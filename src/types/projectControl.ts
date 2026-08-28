export type ProjectTaskStatus =
  | 'DONE'
  | 'IN_PROGRESS'
  | 'PLANNED'
  | 'IDEA'
  | 'BLOCKED'
  | 'ARCHIVED';

export type ProjectTaskPriority =
  | 'P0_CRITICAL'
  | 'P1_HIGH'
  | 'P2_MEDIUM'
  | 'P3_LOW'
  | 'INFO';

export type ProjectTaskCategory =
  | 'CONTENT'
  | 'LEGAL'
  | 'CALCULATOR'
  | 'OSPOD_MAP'
  | 'USER_PORTAL'
  | 'COMMUNITY'
  | 'SECURITY'
  | 'DEVOPS'
  | 'PERFORMANCE'
  | 'UX'
  | 'DATA_INTEGRITY';

export interface PortalContentItem {
  id: string;
  title: string;
  path: string;
  category: 'PUBLIC_PORTAL' | 'LEGAL_GUIDE' | 'CALCULATOR_TOOL' | 'OSPOD_REGISTRY' | 'USER_PORTAL' | 'COMMUNITY' | 'ADMIN_SYSTEM';
  categoryLabel: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNED' | 'ARCHIVED';
  dataSource: 'DATABASE' | 'STATIC_ENGINE' | 'MARKDOWN_CMS' | 'LIVE_API' | 'LOCAL_CACHE';
  dataSourceLabel: string;
  description: string;
  auditVerification: string;
  features: string[];
  recommendations: string[];
  lastAudited: string;
  completenessPercent: number;
}

export interface AuditRecommendationItem {
  id: string;
  phase: string;
  auditFileName: string;
  title: string;
  description: string;
  targetModule: string;
  priority: ProjectTaskPriority;
  status: ProjectTaskStatus;
  implementedInPhase?: string;
  resolutionNotes?: string;
  category: ProjectTaskCategory;
}

export interface ProjectPhaseItem {
  phaseId: string;
  phaseNumber: number | string;
  title: string;
  subtitle: string;
  description: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNED';
  date: string;
  auditReport: string;
  auditReportPath: string;
  keyDeliverables: string[];
  gitBranch?: string;
}

export interface ProjectTaskItem {
  id: string;
  ticketNumber?: number;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  category: ProjectTaskCategory;
  source: string;
  sourcePath?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  tags?: string[];
  notes?: string;
}

export interface ProjectControlOverview {
  counts: Record<ProjectTaskStatus, number>;
  categoryCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  totalContentItems: number;
  totalVerifiedPages: number;
  totalRecommendations: number;
  resolvedRecommendations: number;
  completedPhasesCount: number;
  totalPhasesCount: number;
  systemHealth: {
    status: string;
    prisma: string;
    uptime: number;
  };
  recentTickets: ProjectTaskItem[];
}
