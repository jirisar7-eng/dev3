import { prisma } from '../db/prisma';
import { dbStore } from './dbStore';
import { ComplianceDoc, LegalDocument, LegalDocumentVersion, UserConsent, ConsentRecord, User, LegalDocStatus } from '../types';

export class ComplianceService {
  // Map public URL slugs or aliases to official document keys
  static resolveKey(slugOrKey: string): string {
    const map: Record<string, string> = {
      'podminky-uzivani': 'terms',
      'terms': 'terms',
      'gdpr': 'gdpr',
      'privacy': 'gdpr',
      'cookies': 'cookies',
      'moje-pravni-dokumenty': 'legal',
      'legal_docs': 'legal',
      'legal': 'legal',
      'dobrovolnicky-kodex': 'volunteer_code',
      'volunteer_code': 'volunteer_code',
      'dohoda-o-spolupraci': 'dohoda-o-spolupraci',
      'e-dohoda': 'dohoda-o-spolupraci',
      'volunteer-agreement': 'dohoda-o-spolupraci',
      'volunteer_agreement': 'dohoda-o-spolupraci',
      'ai-prohlaseni': 'ai_statement',
      'ai_statement': 'ai_statement',
      'ai_disclaimer': 'ai_statement',
    };
    return map[slugOrKey] || slugOrKey;
  }

  // 1. Get all documents summary for Compliance Center / Public listing
  static async getDocs(): Promise<ComplianceDoc[]> {
    if (prisma) {
      try {
        const docs = await prisma.legalDocument.findMany({
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        if (docs.length > 0) {
          return docs.map((d) => {
            const publishedVer = d.versions.find((v) => v.status === 'PUBLISHED') || d.versions[0];
            return {
              id: d.id,
              key: d.key,
              title: d.title,
              type: d.type,
              description: d.description || undefined,
              content: publishedVer?.content || '',
              version: publishedVer?.version || '1.0.0',
              effectiveDate: publishedVer?.effectiveDate.toISOString() || d.createdAt.toISOString(),
              updatedAt: d.updatedAt.toISOString(),
              status: (publishedVer?.status as LegalDocStatus) || 'PUBLISHED',
              author: publishedVer?.author || 'Administrátor',
              versions: d.versions.map((v) => ({
                id: v.id,
                documentId: v.documentId,
                version: v.version,
                content: v.content,
                status: v.status as LegalDocStatus,
                effectiveDate: v.effectiveDate.toISOString(),
                author: v.author || 'Administrátor',
                createdAt: v.createdAt.toISOString(),
                updatedAt: v.updatedAt.toISOString(),
              })),
            };
          });
        }
      } catch (err) {
        console.warn('Prisma getDocs error, falling back:', err);
      }
    }
    return dbStore.complianceDocs;
  }

  // 2. Get document details with full version history by key or alias
  static async getDocByKey(keyOrAlias: string): Promise<LegalDocument | null> {
    const targetKey = this.resolveKey(keyOrAlias);

    if (prisma) {
      try {
        const doc = await prisma.legalDocument.findUnique({
          where: { key: targetKey },
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (doc) {
          const publishedVer = doc.versions.find((v) => v.status === 'PUBLISHED') || doc.versions[0];
          return {
            id: doc.id,
            key: doc.key,
            title: doc.title,
            type: doc.type,
            description: doc.description || undefined,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString(),
            versions: doc.versions.map((v) => ({
              id: v.id,
              documentId: v.documentId,
              version: v.version,
              content: v.content,
              status: v.status as LegalDocStatus,
              effectiveDate: v.effectiveDate.toISOString(),
              author: v.author || 'Administrátor',
              createdAt: v.createdAt.toISOString(),
              updatedAt: v.updatedAt.toISOString(),
            })),
            currentVersion: publishedVer
              ? {
                  id: publishedVer.id,
                  documentId: publishedVer.documentId,
                  version: publishedVer.version,
                  content: publishedVer.content,
                  status: publishedVer.status as LegalDocStatus,
                  effectiveDate: publishedVer.effectiveDate.toISOString(),
                  author: publishedVer.author || 'Administrátor',
                  createdAt: publishedVer.createdAt.toISOString(),
                  updatedAt: publishedVer.updatedAt.toISOString(),
                }
              : undefined,
          };
        }
      } catch (err) {
        console.warn('Prisma getDocByKey error, falling back:', err);
      }
    }

    const doc = dbStore.complianceDocs.find((d) => d.key === targetKey || this.resolveKey(d.key) === targetKey);
    if (!doc) return null;

    return {
      id: doc.id,
      key: doc.key,
      title: doc.title,
      type: doc.type || 'TERMS',
      description: doc.description,
      createdAt: doc.effectiveDate,
      updatedAt: doc.updatedAt,
      currentVersion: {
        id: doc.id + '-v1',
        documentId: doc.id,
        version: doc.version,
        content: doc.content,
        status: doc.status || 'PUBLISHED',
        effectiveDate: doc.effectiveDate,
        author: doc.author || 'Administrátor',
        createdAt: doc.effectiveDate,
        updatedAt: doc.updatedAt,
      },
      versions: [
        {
          id: doc.id + '-v1',
          documentId: doc.id,
          version: doc.version,
          content: doc.content,
          status: doc.status || 'PUBLISHED',
          effectiveDate: doc.effectiveDate,
          author: doc.author || 'Administrátor',
          createdAt: doc.effectiveDate,
          updatedAt: doc.updatedAt,
        },
      ],
    };
  }

  // 3. Public version lookup (returns current PUBLISHED version)
  static async getPublishedDoc(slugOrKey: string): Promise<ComplianceDoc | null> {
    const key = this.resolveKey(slugOrKey);
    const docs = await this.getDocs();
    return docs.find((d) => d.key === key) || null;
  }

  // 4. Create new legal document container
  static async createDoc(
    data: { key: string; title: string; type: string; description?: string; initialVersion?: string; initialContent?: string },
    user?: User | null
  ): Promise<ComplianceDoc> {
    const key = this.resolveKey(data.key);
    const version = data.initialVersion || '1.0.0';
    const content = data.initialContent || `Tento dokument (${data.title}) je v procesu přípravy.`;
    const authorName = user?.name || 'Administrátor';

    if (prisma) {
      try {
        const doc = await prisma.legalDocument.create({
          data: {
            key,
            title: data.title,
            type: data.type || 'TERMS',
            description: data.description || null,
          },
        });

        const ver = await prisma.legalDocumentVersion.create({
          data: {
            documentId: doc.id,
            version,
            content,
            status: 'PUBLISHED',
            author: authorName,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_DOC_CREATE',
            module: 'COMPLIANCE',
            details: `Vytvořen nový compliance dokument '${doc.title}' [${doc.key}] s verzí ${version}.`,
          },
        });

        return {
          id: doc.id,
          key: doc.key,
          title: doc.title,
          type: doc.type,
          description: doc.description || undefined,
          content: ver.content,
          version: ver.version,
          status: ver.status as LegalDocStatus,
          effectiveDate: ver.effectiveDate.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          author: authorName,
        };
      } catch (err) {
        console.warn('Prisma createDoc error, falling back:', err);
      }
    }

    const doc: ComplianceDoc = {
      id: 'cmp-' + Date.now(),
      key,
      title: data.title,
      type: data.type || 'TERMS',
      description: data.description,
      content,
      version,
      status: 'PUBLISHED',
      effectiveDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: authorName,
    };

    dbStore.complianceDocs.push(doc);
    dbStore.logAudit('COMPLIANCE_DOC_CREATE', 'COMPLIANCE', `Vytvořen nový compliance dokument '${data.title}' [${key}] s verzí ${version}.`, user);
    return doc;
  }

  // 5. Update document container metadata
  static async updateDocMetadata(
    key: string,
    data: { title?: string; type?: string; description?: string },
    user?: User | null
  ): Promise<ComplianceDoc> {
    const targetKey = this.resolveKey(key);

    if (prisma) {
      try {
        const updated = await prisma.legalDocument.update({
          where: { key: targetKey },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.type && { type: data.type }),
            ...(data.description !== undefined && { description: data.description }),
          },
          include: {
            versions: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_DOC_UPDATE',
            module: 'COMPLIANCE',
            details: `Aktualizována metadata dokumentu '${updated.title}' [${targetKey}].`,
          },
        });

        const latestVer = updated.versions[0];
        return {
          id: updated.id,
          key: updated.key,
          title: updated.title,
          type: updated.type,
          description: updated.description || undefined,
          content: latestVer?.content || '',
          version: latestVer?.version || '1.0.0',
          effectiveDate: latestVer?.effectiveDate.toISOString() || updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateDocMetadata error, falling back:', err);
      }
    }

    const doc = dbStore.complianceDocs.find((d) => d.key === targetKey);
    if (!doc) throw new Error(`Dokument '${targetKey}' nenalezen.`);

    if (data.title) doc.title = data.title;
    if (data.type) doc.type = data.type;
    if (data.description !== undefined) doc.description = data.description;
    doc.updatedAt = new Date().toISOString();

    dbStore.logAudit('COMPLIANCE_DOC_UPDATE', 'COMPLIANCE', `Aktualizována metadata dokumentu '${doc.title}' [${targetKey}].`, user);
    return doc;
  }

  // 6. Create a NEW VERSION for a document. Historical versions are NEVER overwritten!
  static async createVersion(
    docKey: string,
    data: { version: string; content: string; status?: LegalDocStatus; effectiveDate?: string; author?: string },
    user?: User | null
  ): Promise<LegalDocumentVersion> {
    const targetKey = this.resolveKey(docKey);
    const newStatus = data.status || 'PUBLISHED';
    const authorName = data.author || user?.name || 'Administrátor';
    const effDate = data.effectiveDate ? new Date(data.effectiveDate) : new Date();

    if (prisma) {
      try {
        const doc = await prisma.legalDocument.findUnique({ where: { key: targetKey } });
        if (!doc) throw new Error(`Dokument '${targetKey}' nenalezen.`);

        // Check if this exact version number already exists
        const existingVer = await prisma.legalDocumentVersion.findUnique({
          where: { documentId_version: { documentId: doc.id, version: data.version } },
        });

        if (existingVer) {
          throw new Error(`Verze ${data.version} pro dokument '${targetKey}' již existuje. Historické verze nesmí být přepsány! Zvolte nové číslo verze (SemVer).`);
        }

        // If new version is PUBLISHED, archive all previous published versions
        if (newStatus === 'PUBLISHED') {
          await prisma.legalDocumentVersion.updateMany({
            where: { documentId: doc.id, status: 'PUBLISHED' },
            data: { status: 'ARCHIVED' },
          });
        }

        const newVer = await prisma.legalDocumentVersion.create({
          data: {
            documentId: doc.id,
            version: data.version,
            content: data.content,
            status: newStatus,
            effectiveDate: effDate,
            author: authorName,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_VERSION_CREATE',
            module: 'COMPLIANCE',
            details: `Vytvořena nová verze v${data.version} (${newStatus}) pro dokument '${doc.title}'.`,
          },
        });

        return {
          id: newVer.id,
          documentId: newVer.documentId,
          version: newVer.version,
          content: newVer.content,
          status: newVer.status as LegalDocStatus,
          effectiveDate: newVer.effectiveDate.toISOString(),
          author: newVer.author || authorName,
          createdAt: newVer.createdAt.toISOString(),
          updatedAt: newVer.updatedAt.toISOString(),
        };
      } catch (err: any) {
        if (err.message.includes('Historické verze')) throw err;
        console.warn('Prisma createVersion error, falling back:', err);
      }
    }

    // Memory Fallback
    const doc = dbStore.complianceDocs.find((d) => d.key === targetKey);
    if (!doc) throw new Error(`Dokument '${targetKey}' nenalezen.`);

    if (doc.version === data.version) {
      throw new Error(`Verze ${data.version} pro dokument '${targetKey}' již existuje. Zvolte nové číslo verze.`);
    }

    doc.version = data.version;
    doc.content = data.content;
    doc.status = newStatus;
    doc.effectiveDate = effDate.toISOString();
    doc.updatedAt = new Date().toISOString();
    doc.author = authorName;

    dbStore.logAudit('COMPLIANCE_VERSION_CREATE', 'COMPLIANCE', `Vytvořena nová verze v${data.version} (${newStatus}) pro dokument '${doc.title}'.`, user);

    return {
      id: doc.id + '-v' + Date.now(),
      documentId: doc.id,
      version: data.version,
      content: data.content,
      status: newStatus,
      effectiveDate: effDate.toISOString(),
      author: authorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // 7. Publish a specific version ID
  static async publishVersion(versionId: string, user?: User | null): Promise<LegalDocumentVersion> {
    if (prisma) {
      try {
        const ver = await prisma.legalDocumentVersion.findUnique({
          where: { id: versionId },
          include: { document: true },
        });

        if (!ver) throw new Error('Verze neexistuje.');

        // Archive all other published versions for this document
        await prisma.legalDocumentVersion.updateMany({
          where: { documentId: ver.documentId, status: 'PUBLISHED' },
          data: { status: 'ARCHIVED' },
        });

        // Set this version to PUBLISHED
        const updated = await prisma.legalDocumentVersion.update({
          where: { id: versionId },
          data: { status: 'PUBLISHED', effectiveDate: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_VERSION_PUBLISH',
            module: 'COMPLIANCE',
            details: `Publikována verze v${updated.version} dokumentu '${ver.document.title}'. Starší publikované verze byly archivovány.`,
          },
        });

        return {
          id: updated.id,
          documentId: updated.documentId,
          version: updated.version,
          content: updated.content,
          status: updated.status as LegalDocStatus,
          effectiveDate: updated.effectiveDate.toISOString(),
          author: updated.author || 'Administrátor',
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err: any) {
        console.warn('Prisma publishVersion error:', err);
        throw err;
      }
    }

    throw new Error('Fallback nepodporuje přímou publikaci verze podle ID.');
  }

  // 8. Deactivate / Archive a specific version ID
  static async deactivateVersion(versionId: string, user?: User | null): Promise<LegalDocumentVersion> {
    if (prisma) {
      try {
        const ver = await prisma.legalDocumentVersion.findUnique({
          where: { id: versionId },
          include: { document: true },
        });

        if (!ver) throw new Error('Verze neexistuje.');

        const updated = await prisma.legalDocumentVersion.update({
          where: { id: versionId },
          data: { status: 'ARCHIVED' },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_VERSION_DEACTIVATE',
            module: 'COMPLIANCE',
            details: `Deaktivována / archivována verze v${updated.version} dokumentu '${ver.document.title}'.`,
          },
        });

        return {
          id: updated.id,
          documentId: updated.documentId,
          version: updated.version,
          content: updated.content,
          status: updated.status as LegalDocStatus,
          effectiveDate: updated.effectiveDate.toISOString(),
          author: updated.author || 'Administrátor',
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err: any) {
        console.warn('Prisma deactivateVersion error:', err);
        throw err;
      }
    }

    throw new Error('Fallback nepodporuje přímou deaktivaci verze podle ID.');
  }

  // 9. Record User Consent
  static async recordConsent(
    userId: string,
    docKey: string,
    docVersion: string,
    status: 'ACCEPTED' | 'REVOKED' = 'ACCEPTED',
    userEmail?: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<UserConsent> {
    const key = this.resolveKey(docKey);

    if (prisma) {
      try {
        const consent = await prisma.consent.upsert({
          where: { userId_docKey_docVersion: { userId, docKey: key, docVersion } },
          update: { status, consentedAt: new Date(), ipAddress },
          create: { userId, docKey: key, docVersion, status, ipAddress },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            userEmail,
            action: status === 'ACCEPTED' ? 'USER_CONSENT_ACCEPT' : 'USER_CONSENT_REVOKE',
            module: 'COMPLIANCE',
            details: `Uživatel ${userEmail || userId} ${status === 'ACCEPTED' ? 'potvrdil souhlas s' : 'odvolal souhlas s'} '${key}' (v${docVersion}).`,
            ipAddress,
          },
        });

        return {
          id: consent.id,
          userId: consent.userId,
          userEmail,
          docKey: consent.docKey,
          docVersion: consent.docVersion,
          versionId: consent.versionId || undefined,
          status: consent.status as 'ACCEPTED' | 'REVOKED',
          ipAddress: consent.ipAddress || ipAddress,
          consentedAt: consent.consentedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma recordConsent error, falling back:', err);
      }
    }

    let existing = dbStore.userConsents.find((c) => c.userId === userId && c.docKey === key && c.docVersion === docVersion);
    if (existing) {
      existing.status = status;
      existing.consentedAt = new Date().toISOString();
      return existing;
    }

    const consent: UserConsent = {
      id: 'cns-' + Date.now(),
      userId,
      userEmail,
      docKey: key,
      docVersion,
      status,
      ipAddress,
      consentedAt: new Date().toISOString(),
    };

    dbStore.userConsents.push(consent);
    dbStore.logAudit('USER_CONSENT', 'COMPLIANCE', `Uživatel ${userEmail || userId} ${status === 'ACCEPTED' ? 'potvrdil souhlas s' : 'odvolal souhlas s'} '${key}' (v${docVersion}).`);
    return consent;
  }

  // 10. Get Consents List for Admin Compliance Registry
  static async getConsents(userId?: string, docKey?: string): Promise<ConsentRecord[]> {
    if (prisma) {
      try {
        const whereClause: any = {};
        if (userId) whereClause.userId = userId;
        if (docKey) whereClause.docKey = this.resolveKey(docKey);

        const consents = await prisma.consent.findMany({
          where: whereClause,
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
          orderBy: { consentedAt: 'desc' },
        });

        return consents.map((c) => ({
          id: c.id,
          userId: c.userId,
          userEmail: c.user?.email || undefined,
          userName: c.user?.name || undefined,
          docKey: c.docKey,
          docVersion: c.docVersion,
          versionId: c.versionId || undefined,
          status: (c.status as 'ACCEPTED' | 'REVOKED') || 'ACCEPTED',
          ipAddress: c.ipAddress || '127.0.0.1',
          consentedAt: c.consentedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getConsents error:', err);
      }
    }

    return dbStore.userConsents.map((c) => ({
      id: c.id,
      userId: c.userId,
      userEmail: c.userEmail,
      userName: 'Uživatel',
      docKey: c.docKey,
      docVersion: c.docVersion,
      versionId: c.versionId,
      status: c.status || 'ACCEPTED',
      ipAddress: c.ipAddress || '127.0.0.1',
      consentedAt: c.consentedAt,
    }));
  }

  // 11. Legacy support for updateDoc
  static async updateDoc(key: string, title: string, content: string, version: string, user?: User | null): Promise<ComplianceDoc> {
    const targetKey = this.resolveKey(key);
    return this.createVersion(targetKey, { version, content, status: 'PUBLISHED' }, user).then(() => {
      return this.updateDocMetadata(targetKey, { title }, user);
    });
  }

  // 12. User consents helper
  static async getUserConsents(userId: string): Promise<UserConsent[]> {
    return this.getConsents(userId);
  }
}
