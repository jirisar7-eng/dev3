import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ControlPlaneRiskEngine } from '../src/services/controlPlaneRiskEngine';
import { ControlPlaneFinding } from '../src/types/controlPlane';

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      synthesisTicket: {
        findUnique: vi.fn(),
        create: vi.fn()
      },
      synthesisTicketEvent: {
        create: vi.fn()
      }
    }
  };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: function() {
      return prismaMock;
    }
  };
});

vi.mock('../src/services/auditService', () => ({
  AuditService: {
    recordLog: vi.fn().mockResolvedValue({ id: 'mock-audit-id' })
  }
}));

import { ControlPlaneTicketEngine } from '../src/services/controlPlaneTicketEngine';

describe('Project Control Plane - Ticket & Risk Intelligence', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ControlPlaneRiskEngine (Deterministic Rules)', () => {
    it('detects P0 CRITICAL correctly (e.g. auth bypass, secret leak)', () => {
      const result = ControlPlaneRiskEngine.calculateRisk(
        'Vulnerability',
        'We found an auth bypass in the API',
        { suggestedSeverity: 'P3' } as any,
        0.9
      );
      expect(result.severity).toBe('P0');
      expect(result.priorityScore).toBeGreaterThanOrEqual(900); // 1000 * 0.9
      expect(result.recommendsHumanReview).toBe(true);
    });

    it('detects P1 HIGH correctly (e.g. sql injection, production outage)', () => {
      const result = ControlPlaneRiskEngine.calculateRisk(
        'Downtime',
        'There is a production outage',
        { suggestedSeverity: 'P3' } as any,
        0.9
      );
      expect(result.severity).toBe('P1');
      expect(result.recommendsHumanReview).toBe(true);
    });

    it('refuses to blindly accept AI P0 if no deterministic keyword is found (Fail Closed)', () => {
      const result = ControlPlaneRiskEngine.calculateRisk(
        'Minor bug',
        'Button is misaligned',
        { suggestedSeverity: 'P0' } as any,
        0.6
      );
      expect(result.severity).toBe('P1'); // Escalates to P1 for human review, not P0 directly
      expect(result.recommendsHumanReview).toBe(true);
      expect(result.reason).toContain('AI navrhlo P0, ale nebyl nalezen deterministický důkaz');
    });

    it('computes confidence penalty on Project Priority Score', () => {
      const result = ControlPlaneRiskEngine.calculateRisk(
        'Timeout',
        'API is slow',
        { suggestedSeverity: 'P2' } as any,
        0.1 // very low confidence
      );
      expect(result.severity).toBe('P2');
      // P2 base = 100, x 0.1 = 10
      expect(result.priorityScore).toBeLessThan(20);
      expect(result.priorityReason).toContain('nízké AI confidence');
    });
  });

  describe('ControlPlaneTicketEngine (Deduplication & Lifecycle)', () => {
    const mockFinding: ControlPlaneFinding = {
      findingId: 'f1',
      source: 'QA',
      sourceReference: 'run-123',
      title: 'Database connection failed',
      description: 'Timeout during peak hours',
      severity: 'P1',
      confidence: 0.9,
      affectedResources: ['Database'],
      affectedFiles: [],
      affectedRoutes: [],
      affectedServices: ['PostgreSQL'],
      affectedDatabaseModels: [],
      securityImpact: 'None',
      userImpact: 'Unable to load app',
      productionImpact: 'High',
      regressionRisk: 'Low',
      reproducibility: 'Intermittent',
      detectedAt: new Date(),
      status: 'DETECTED',
      dedupHash: ''
    };

    const mockUser: any = { id: 'u1', email: 'test@test.com' };

    it('generates deterministic fingerprint for deduplication', () => {
      const hash1 = ControlPlaneRiskEngine.generateFingerprint('QA', 'Same Title', ['Res1']);
      const hash2 = ControlPlaneRiskEngine.generateFingerprint('QA', 'same title', ['Res1']);
      expect(hash1).toBe(hash2);
    });

    it('creates a NEW ticket if deduplication fingerprint is unique', async () => {
      prismaMock.synthesisTicket.findUnique.mockResolvedValue(null as any);
      prismaMock.synthesisTicket.create.mockResolvedValue({ id: 't1', ticketNumber: 1 } as any);

      const res = await ControlPlaneTicketEngine.processFinding(mockFinding, mockUser);
      
      expect(res.isDuplicate).toBe(false);
      expect(prismaMock.synthesisTicket.create).toHaveBeenCalled();
      expect(prismaMock.synthesisTicketEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'TICKET_CREATED' })
        })
      );
    });

    it('adds an event and DOES NOT create a new ticket if duplicate found', async () => {
      prismaMock.synthesisTicket.findUnique.mockResolvedValue({ id: 't1', ticketNumber: 1 } as any);

      const res = await ControlPlaneTicketEngine.processFinding(mockFinding, mockUser);
      
      expect(res.isDuplicate).toBe(true);
      expect(prismaMock.synthesisTicket.create).not.toHaveBeenCalled();
      expect(prismaMock.synthesisTicketEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'FINDING_REOCCURRED' })
        })
      );
    });

    it('distinguishes Root Cause from secondary symptoms and identifies blast radius', async () => {
      const res = await ControlPlaneTicketEngine.analyzeRootCause(
        ['API timeout', 'DB lock'],
        ['Database', 'User Service']
      );
      
      expect(res.isSecondaryEffect).toBe(true);
      expect(res.rootCause).toContain('Database overload');
      expect(res.blastRadius).toContain('API Layer');
    });
  });
});
