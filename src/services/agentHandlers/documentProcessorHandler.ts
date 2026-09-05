import { AgentCapabilityHandler, AgentDispatchRequest } from '../../types/agentDispatcher';
import { AgentAuthorizationResult } from '../../types/agentRegistry';
import { JudgmentParserService } from '../judgmentParserService';
import { ClientCaseService } from '../clientCaseService';
import { getPrismaClient, isPrismaAvailable } from '../../db/prisma';
import { dbStore } from '../dbStore';
import { User, CaseDocument } from '../../types';

export interface ValidatedDocumentInput {
  documentId?: string;
  caseId?: string;
  text?: string;
}

const FORBIDDEN_KEYS = [
  'query', 'sql', 'rawQuery', 'table', 'model', 'endpoint', 'function', 'fn',
  'select', 'where', 'execute', 'eval', '__proto__', 'prototype', 'constructor',
  'filePath', 'filesystemPath', 'path', 'provider', 'systemPrompt', 'temperature', 'maxTokens'
];

function validateDocumentInput(payload?: unknown): ValidatedDocumentInput {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  const payloadObj = payload as Record<string, unknown>;

  // Explicitly deny arbitrary query execution, raw SQL, filesystem paths, or model/table access
  for (const key of FORBIDDEN_KEYS) {
    if (Object.prototype.hasOwnProperty.call(payloadObj, key)) {
      throw new Error(`FAIL CLOSED: Client is strictly forbidden from specifying database operations, filesystem paths, or parameter '${key}'.`);
    }
  }

  // Scan string values for SQL injection, path traversal, or command patterns
  for (const [key, val] of Object.entries(payloadObj)) {
    if (typeof val === 'string') {
      if (key !== 'text') {
        if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)\b|--|;)/i.test(val)) {
          throw new Error(`FAIL CLOSED: SQL injection attempt detected in field '${key}'.`);
        }
        if (val.includes('..') || val.includes('/etc') || val.includes('\\') || val.includes('.env') || val.startsWith('/')) {
          throw new Error(`FAIL CLOSED: Path traversal or filesystem path detected in field '${key}'.`);
        }
      } else {
        // For text payload: check for suspicious filesystem traversal patterns
        if (/(^|[/\\])\.\.([/\\]|$)/.test(val) || val.includes('/etc/passwd') || val.includes('/etc/shadow')) {
          throw new Error(`FAIL CLOSED: Path traversal or filesystem path detected in field '${key}'.`);
        }
      }
    }
  }

  const result: ValidatedDocumentInput = {};

  if (payloadObj.documentId !== undefined && payloadObj.documentId !== null) {
    if (typeof payloadObj.documentId !== 'string') {
      throw new Error('FAIL CLOSED: Invalid documentId: must be a string.');
    }
    const docId = payloadObj.documentId.trim();
    if (docId.length === 0 || docId.length > 100) {
      throw new Error('FAIL CLOSED: Invalid documentId length (must be between 1 and 100 characters).');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(docId)) {
      throw new Error('FAIL CLOSED: Invalid documentId format: Allowed characters are alphanumeric, dashes, and underscores.');
    }
    result.documentId = docId;
  }

  if (payloadObj.caseId !== undefined && payloadObj.caseId !== null) {
    if (typeof payloadObj.caseId !== 'string') {
      throw new Error('FAIL CLOSED: Invalid caseId: must be a string.');
    }
    const cId = payloadObj.caseId.trim();
    if (cId.length === 0 || cId.length > 100) {
      throw new Error('FAIL CLOSED: Invalid caseId length (must be between 1 and 100 characters).');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cId)) {
      throw new Error('FAIL CLOSED: Invalid caseId format: Allowed characters are alphanumeric, dashes, and underscores.');
    }
    result.caseId = cId;
  }

  if (payloadObj.text !== undefined && payloadObj.text !== null) {
    if (typeof payloadObj.text !== 'string') {
      throw new Error('FAIL CLOSED: Invalid text: must be a string.');
    }
    if (payloadObj.text.length > 500000) {
      throw new Error('FAIL CLOSED: Text payload exceeds maximum allowed size (500,000 characters).');
    }
    result.text = payloadObj.text;
  }

  return result;
}

export class DocumentProcessorHandler implements AgentCapabilityHandler {
  /**
   * Resolves a document from Prisma or memory store and strictly verifies
   * caller ownership and participant authorization.
   */
  private async resolveAndAuthorizeDocument(documentId: string, user: User): Promise<CaseDocument | Record<string, any>> {
    let caseDoc: any = null;
    let userDoc: any = null;

    if (isPrismaAvailable()) {
      const prisma = getPrismaClient();
      if (prisma) {
        try {
          caseDoc = await prisma.caseDocument.findUnique({
            where: { id: documentId },
            include: { case: { include: { participants: true } } }
          });
        } catch (err) {
          console.warn('[DocumentProcessorHandler] Prisma caseDocument lookup error:', err);
        }

        if (!caseDoc) {
          try {
            userDoc = await prisma.userDocument.findUnique({
              where: { id: documentId }
            });
          } catch (err) {
            console.warn('[DocumentProcessorHandler] Prisma userDocument lookup error:', err);
          }
        }
      }
    }

    if (!caseDoc && !userDoc) {
      // Memory store fallback
      caseDoc = dbStore.caseDocuments.find((d: any) => d.id === documentId);
      if (caseDoc && !caseDoc.case) {
        const relatedCase = dbStore.cases.find((c: any) => c.id === caseDoc.caseId);
        if (relatedCase) {
          caseDoc = {
            ...caseDoc,
            case: relatedCase
          };
        }
      }
    }

    if (!caseDoc && !userDoc) {
      throw new Error(`FAIL CLOSED: Document '${documentId}' not found.`);
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (caseDoc) {
      const caseOwnerId = caseDoc.case?.ownerId || (caseDoc.case as any)?.userId;
      const isUploader = caseDoc.uploadedBy === user.id;
      const isOwner = caseOwnerId === user.id;
      const isParticipant = Array.isArray(caseDoc.case?.participants) &&
        caseDoc.case.participants.some((p: any) => p.userId === user.id);

      if (!isAdmin && !isUploader && !isOwner && !isParticipant) {
        throw new Error(`FAIL CLOSED: Access denied: User is not authorized to access document '${documentId}' (ownership/participant violation).`);
      }

      return caseDoc;
    }

    if (userDoc) {
      if (!isAdmin && userDoc.userId !== user.id) {
        throw new Error(`FAIL CLOSED: Access denied: User is not the owner of document '${documentId}'.`);
      }
      return userDoc;
    }

    throw new Error(`FAIL CLOSED: Document '${documentId}' not found.`);
  }

  public async execute(
    request: AgentDispatchRequest,
    authorization: AgentAuthorizationResult
  ): Promise<unknown> {
    if (authorization.decision !== 'ALLOW') {
      throw new Error('Unauthorized execution attempt.');
    }

    const user = request.user as User;
    if (!user || !user.id) {
      throw new Error('FAIL CLOSED: Unauthenticated actor in Document Processor context.');
    }

    const input = validateDocumentInput(request.payload);

    switch (request.capabilityId) {
      case 'document.read': {
        if (!input.documentId) {
          throw new Error("FAIL CLOSED: Field 'documentId' is required for capability 'document.read'.");
        }

        const doc = await this.resolveAndAuthorizeDocument(input.documentId, user);

        return {
          status: 'success',
          capability: 'document.read',
          document: {
            id: doc.id,
            name: doc.name,
            category: doc.category || 'OTHER',
            fileType: doc.fileType || 'pdf',
            mimeType: doc.mimeType || 'application/pdf',
            size: doc.size || 0,
            scanStatus: doc.scanStatus || 'CLEAN',
            caseId: doc.caseId || null,
            uploadedBy: doc.uploadedBy || (doc as any).userId,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            notes: doc.notes || '',
            contentAvailable: Boolean(doc.fileUrl || (doc as any).fileData || (doc as any).notes),
          }
        };
      }

      case 'document.parse': {
        if (input.caseId) {
          // Authorize access to the specified case
          await ClientCaseService.authorizeCaseAccess(input.caseId, user);
        }

        let textToParse = '';

        if (input.documentId) {
          const doc = await this.resolveAndAuthorizeDocument(input.documentId, user);
          textToParse = input.text || doc.notes || (doc as any).rawText || '';
          if (!textToParse.trim()) {
            throw new Error(`FAIL CLOSED: No parseable text content found for document '${input.documentId}'. Provide text or document content.`);
          }
        } else if (input.text) {
          textToParse = input.text;
        } else {
          throw new Error("FAIL CLOSED: Either 'documentId' or 'text' must be provided for capability 'document.parse'.");
        }

        if (!textToParse.trim()) {
          throw new Error('FAIL CLOSED: Document text is empty. Nothing to parse.');
        }

        // Invoke existing JudgmentParserService without modifying its architecture
        const parsed = await JudgmentParserService.parseJudgmentFile(undefined, textToParse);

        return {
          status: 'success',
          capability: 'document.parse',
          documentId: input.documentId || null,
          parsed,
        };
      }

      case 'ocr.extract': {
        // Section 7 Requirement: Standalone OCR engine is not configured in this project.
        // Return a safe unsupported/fail-closed error. Never simulate or return fake OCR data.
        throw new Error("FAIL CLOSED: Capability 'ocr.extract' is currently unsupported. Standalone OCR engine is not configured in this environment.");
      }

      default:
        throw new Error(`FAIL CLOSED: Unsupported capability '${request.capabilityId}' for DOCUMENT_PROCESSOR.`);
    }
  }
}

export const documentProcessorHandler = new DocumentProcessorHandler();
