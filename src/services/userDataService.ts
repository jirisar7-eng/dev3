import { prisma } from '../db/prisma';
import { dbStore } from './dbStore';
import { hashPassword } from './seedService';
import { User, UserCase, UserChild, UserCalendarEvent, UserNote, UserDocument, UserRole, UserProfile } from '../types';

export class UserDataService {
  // Check ownership helper: returns true if user owns resource or is admin
  static isOwnerOrAdmin(targetUserId: string, requestingUser?: User | null): boolean {
    if (!requestingUser) return false;
    if (requestingUser.id === targetUserId) return true;
    const adminRoles: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
    return adminRoles.includes(requestingUser.role);
  }

  // --- PROFILE & ACCOUNT MANAGEMENT ---

  static async getUserProfile(userId: string): Promise<{ user: User; profile: UserProfile | null } | null> {
    if (prisma) {
      try {
        const u = await (prisma as any).user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });
        if (!u) return null;

        const profileObj: UserProfile | null = u.profile
          ? {
              id: u.profile.id,
              userId: u.profile.userId,
              firstName: u.profile.firstName || undefined,
              lastName: u.profile.lastName || undefined,
              birthDate: u.profile.birthDate || undefined,
              phone: u.profile.phone || undefined,
              address: u.profile.address || undefined,
              city: u.profile.city || undefined,
              postalCode: u.profile.postalCode || undefined,
              autoFillDocs: u.profile.autoFillDocs ?? true,
              createdAt: new Date(u.profile.createdAt).toISOString(),
              updatedAt: new Date(u.profile.updatedAt).toISOString(),
            }
          : null;

        const userObj: User = {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role as UserRole,
          status: u.status || 'ACTIVE',
          phone: u.phone || undefined,
          bio: u.bio || undefined,
          avatar: u.avatar || '',
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : undefined,
          createdAt: new Date(u.createdAt).toISOString(),
          updatedAt: new Date(u.updatedAt).toISOString(),
          profile: profileObj || undefined,
        };

        return { user: userObj, profile: profileObj };
      } catch (err) {
        console.warn('Prisma getUserProfile error, falling back:', err);
      }
    }

    const fallbackUser = dbStore.users.find((u) => u.id === userId) || null;
    if (!fallbackUser) return null;
    return { user: fallbackUser, profile: null };
  }

  static async updateUserProfile(
    targetUserId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      bio?: string;
      avatar?: string;
      firstName?: string;
      lastName?: string;
      birthDate?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      autoFillDocs?: boolean;
    },
    requestingUser?: User | null
  ): Promise<{ user: User; profile: UserProfile | null }> {
    if (!this.isOwnerOrAdmin(targetUserId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění upravovat profil jiného uživatele.');
    }

    // Input validations
    if (data.phone) {
      const phoneClean = data.phone.replace(/\s+/g, '');
      if (!/^(\+?[0-9]{9,15})$/.test(phoneClean)) {
        throw new Error('Zadejte platné telefonní číslo (např. +420777123456).');
      }
    }

    if (data.postalCode) {
      const pscClean = data.postalCode.replace(/\s+/g, '');
      if (!/^[0-9]{5}$/.test(pscClean)) {
        throw new Error('PSČ musí obsahovat 5 číslic (např. 11000).');
      }
    }

    if (prisma) {
      try {
        const displayName = data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : undefined);

        const updatedUser = await (prisma as any).user.update({
          where: { id: targetUserId },
          data: {
            ...(displayName ? { name: displayName } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.bio !== undefined ? { bio: data.bio } : {}),
            ...(data.avatar ? { avatar: data.avatar } : {}),
            ...(data.email ? { email: data.email.toLowerCase() } : {}),
          },
        });

        const updatedProfile = await (prisma as any).userProfile.upsert({
          where: { userId: targetUserId },
          create: {
            userId: targetUserId,
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            birthDate: data.birthDate || null,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            postalCode: data.postalCode || null,
            autoFillDocs: data.autoFillDocs ?? true,
          },
          update: {
            ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
            ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
            ...(data.birthDate !== undefined ? { birthDate: data.birthDate } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.address !== undefined ? { address: data.address } : {}),
            ...(data.city !== undefined ? { city: data.city } : {}),
            ...(data.postalCode !== undefined ? { postalCode: data.postalCode } : {}),
            ...(data.autoFillDocs !== undefined ? { autoFillDocs: data.autoFillDocs } : {}),
          },
        });

        // PII-Safe Audit Log (NO raw PII details logged)
        await (prisma as any).auditLog.create({
          data: {
            userId: requestingUser?.id || targetUserId,
            userEmail: requestingUser?.email || updatedUser.email,
            action: 'PROFILE_UPDATE',
            module: 'USER_ACCOUNT',
            details: `Aktualizovány profilové údaje uživatele.`,
          },
        });

        const userResult: User = {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role as UserRole,
          status: updatedUser.status || 'ACTIVE',
          phone: updatedUser.phone || undefined,
          bio: updatedUser.bio || undefined,
          avatar: updatedUser.avatar || '',
          createdAt: new Date(updatedUser.createdAt).toISOString(),
          updatedAt: new Date(updatedUser.updatedAt).toISOString(),
        };

        const profileResult: UserProfile = {
          id: updatedProfile.id,
          userId: updatedProfile.userId,
          firstName: updatedProfile.firstName || undefined,
          lastName: updatedProfile.lastName || undefined,
          birthDate: updatedProfile.birthDate || undefined,
          phone: updatedProfile.phone || undefined,
          address: updatedProfile.address || undefined,
          city: updatedProfile.city || undefined,
          postalCode: updatedProfile.postalCode || undefined,
          autoFillDocs: updatedProfile.autoFillDocs,
          createdAt: new Date(updatedProfile.createdAt).toISOString(),
          updatedAt: new Date(updatedProfile.updatedAt).toISOString(),
        };

        return { user: userResult, profile: profileResult };
      } catch (err: any) {
        if (err.message?.includes('telefonní') || err.message?.includes('PSČ')) throw err;
        console.warn('Prisma updateUserProfile error, falling back:', err);
      }
    }

    const user = dbStore.users.find((u) => u.id === targetUserId);
    if (!user) throw new Error('Uživatel nenalezen.');

    if (data.name) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.avatar) user.avatar = data.avatar;
    if (data.email) user.email = data.email.toLowerCase();
    user.updatedAt = new Date().toISOString();

    dbStore.logAudit('PROFILE_UPDATE', 'USER_ACCOUNT', `Aktualizace profilových údajů.`, requestingUser);

    return { user, profile: null };
  }

  static async changePassword(
    targetUserId: string,
    oldPass: string,
    newPass: string,
    requestingUser?: User | null
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isOwnerOrAdmin(targetUserId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění měnit heslo jiného uživatele.');
    }

    const newHash = hashPassword(newPass);

    if (prisma) {
      try {
        await (prisma as any).user.update({
          where: { id: targetUserId },
          data: { passwordHash: newHash },
        });

        await (prisma as any).auditLog.create({
          data: {
            userId: requestingUser?.id || targetUserId,
            userEmail: requestingUser?.email || 'user',
            action: 'PASSWORD_CHANGE',
            module: 'USER_ACCOUNT',
            details: `Změna hesla pro uživatele ID ${targetUserId}.`,
          },
        });

        return { success: true, message: 'Heslo bylo úspěšně změněno.' };
      } catch (err) {
        console.warn('Prisma changePassword error, falling back:', err);
      }
    }

    const user = dbStore.users.find((u) => u.id === targetUserId);
    if (!user) throw new Error('Uživatel nenalezen.');

    (user as any).passwordHash = newHash;
    user.updatedAt = new Date().toISOString();
    dbStore.logAudit('PASSWORD_CHANGE', 'USER_ACCOUNT', `Změna hesla pro uživatele ${user.email}.`, requestingUser);

    return { success: true, message: 'Heslo bylo úspěšně změněno.' };
  }

  static async updateUserStatus(
    targetUserId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    adminUser: User
  ): Promise<User> {
    const adminRoles: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
    if (!adminRoles.includes(adminUser.role)) {
      throw new Error('Přístup odepřen: Pouze administrátor může měnit stav účtu.');
    }

    if (prisma) {
      try {
        const updated = await (prisma as any).user.update({
          where: { id: targetUserId },
          data: { status },
        });

        await (prisma as any).auditLog.create({
          data: {
            userId: adminUser.id,
            userEmail: adminUser.email,
            action: 'USER_STATUS_CHANGE',
            module: 'USER_ACCOUNT',
            details: `Změna stavu účtu ${updated.email} na ${status}.`,
          },
        });

        return {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role as UserRole,
          status: updated.status || status,
          phone: updated.phone || undefined,
          bio: updated.bio || undefined,
          avatar: updated.avatar || '',
          createdAt: new Date(updated.createdAt).toISOString(),
          updatedAt: new Date(updated.updatedAt).toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateUserStatus error, falling back:', err);
      }
    }

    const user = dbStore.users.find((u) => u.id === targetUserId);
    if (!user) throw new Error('Uživatel nenalezen.');

    user.status = status;
    user.updatedAt = new Date().toISOString();
    dbStore.logAudit('USER_STATUS_CHANGE', 'USER_ACCOUNT', `Změna stavu účtu ${user.email} na ${status}.`, adminUser);

    return user;
  }

  // --- USER CASES ---

  static async getCases(targetUserId: string, requestingUser: User): Promise<UserCase[]> {
    if (!this.isOwnerOrAdmin(targetUserId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění číst spisy jiného uživatele.');
    }

    if (prisma) {
      try {
        const cases = await (prisma as any).userCase.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: 'desc' },
        });
        return cases.map((c: any) => ({
          id: c.id,
          userId: c.userId,
          title: c.title,
          caseNumber: c.caseNumber || undefined,
          courtName: c.courtName || undefined,
          status: c.status,
          notes: c.notes || undefined,
          createdAt: new Date(c.createdAt).toISOString(),
          updatedAt: new Date(c.updatedAt).toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getCases error, falling back:', err);
      }
    }

    return dbStore.userCases.filter((c) => c.userId === targetUserId);
  }

  static async createCase(
    requestingUser: User,
    data: { userId?: string; title: string; caseNumber?: string; courtName?: string; notes?: string }
  ): Promise<UserCase> {
    const userId = data.userId || requestingUser.id;
    if (!this.isOwnerOrAdmin(userId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění zakládat spis pro jiného uživatele.');
    }

    if (prisma) {
      try {
        const created = await (prisma as any).userCase.create({
          data: {
            userId,
            title: data.title,
            caseNumber: data.caseNumber,
            courtName: data.courtName,
            status: 'active',
            notes: data.notes,
          },
        });
        return {
          id: created.id,
          userId: created.userId,
          title: created.title,
          caseNumber: created.caseNumber || undefined,
          courtName: created.courtName || undefined,
          status: created.status,
          notes: created.notes || undefined,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: new Date(created.updatedAt).toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createCase error, falling back:', err);
      }
    }

    const newCase: UserCase = {
      id: 'case-' + Date.now(),
      userId,
      title: data.title,
      caseNumber: data.caseNumber,
      courtName: data.courtName,
      status: 'active',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.userCases.unshift(newCase);
    dbStore.logAudit('CREATE_CASE', 'USER_PORTAL', `Založen nový opatrovnický spis: ${data.title}`, requestingUser);
    return newCase;
  }

  // --- USER CHILDREN ---

  static async getChildren(targetUserId: string, requestingUser: User): Promise<UserChild[]> {
    if (!this.isOwnerOrAdmin(targetUserId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění zobrazit děti jiného uživatele.');
    }

    if (prisma) {
      try {
        const children = await (prisma as any).userChild.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: 'desc' },
        });
        return children.map((c: any) => ({
          id: c.id,
          userId: c.userId,
          name: c.name,
          firstName: c.firstName || undefined,
          lastName: c.lastName || undefined,
          birthDate: c.birthDate || undefined,
          isStudying: c.isStudying ?? false,
          notes: c.notes || undefined,
          createdAt: new Date(c.createdAt).toISOString(),
          updatedAt: new Date(c.updatedAt).toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getChildren error, falling back:', err);
      }
    }

    return dbStore.userChildren.filter((c) => c.userId === targetUserId);
  }

  static async createChild(
    requestingUser: User,
    data: { userId?: string; name?: string; firstName?: string; lastName?: string; birthDate?: string; isStudying?: boolean; notes?: string }
  ): Promise<UserChild> {
    const userId = data.userId || requestingUser.id;
    if (!this.isOwnerOrAdmin(userId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění vkládat dítě pro jiného uživatele.');
    }

    const fullName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Dítě';

    if (prisma) {
      try {
        const created = await (prisma as any).userChild.create({
          data: {
            userId,
            name: fullName,
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            birthDate: data.birthDate || null,
            isStudying: data.isStudying ?? false,
            notes: data.notes || null,
          },
        });

        // Non-PII Audit
        await (prisma as any).auditLog.create({
          data: {
            userId: requestingUser.id,
            userEmail: requestingUser.email,
            action: 'CHILD_ADD',
            module: 'USER_ACCOUNT',
            details: `Přidán nový záznam dítěte.`,
          },
        });

        return {
          id: created.id,
          userId: created.userId,
          name: created.name,
          firstName: created.firstName || undefined,
          lastName: created.lastName || undefined,
          birthDate: created.birthDate || undefined,
          isStudying: created.isStudying ?? false,
          notes: created.notes || undefined,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: new Date(created.updatedAt).toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createChild error, falling back:', err);
      }
    }

    const newChild: UserChild = {
      id: 'child-' + Date.now(),
      userId,
      name: fullName,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      isStudying: data.isStudying ?? false,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.userChildren.unshift(newChild);
    dbStore.logAudit('CHILD_ADD', 'USER_ACCOUNT', `Přidán nový záznam dítěte.`, requestingUser);
    return newChild;
  }

  static async updateChild(
    requestingUser: User,
    childId: string,
    data: { name?: string; firstName?: string; lastName?: string; birthDate?: string; isStudying?: boolean; notes?: string }
  ): Promise<UserChild> {
    if (prisma) {
      try {
        const existing = await (prisma as any).userChild.findUnique({ where: { id: childId } });
        if (!existing) throw new Error('Záznam dítěte nenalezen.');
        if (!this.isOwnerOrAdmin(existing.userId, requestingUser)) {
          throw new Error('Přístup odepřen.');
        }

        const fullName = data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : existing.name);

        const updated = await (prisma as any).userChild.update({
          where: { id: childId },
          data: {
            name: fullName,
            ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
            ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
            ...(data.birthDate !== undefined ? { birthDate: data.birthDate } : {}),
            ...(data.isStudying !== undefined ? { isStudying: data.isStudying } : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
          },
        });

        await (prisma as any).auditLog.create({
          data: {
            userId: requestingUser.id,
            userEmail: requestingUser.email,
            action: 'CHILD_UPDATE',
            module: 'USER_ACCOUNT',
            details: `Aktualizován záznam dítěte.`,
          },
        });

        return {
          id: updated.id,
          userId: updated.userId,
          name: updated.name,
          firstName: updated.firstName || undefined,
          lastName: updated.lastName || undefined,
          birthDate: updated.birthDate || undefined,
          notes: updated.notes || undefined,
          createdAt: new Date(updated.createdAt).toISOString(),
          updatedAt: new Date(updated.updatedAt).toISOString(),
        };
      } catch (err: any) {
        if (err.message?.includes('Přístup') || err.message?.includes('nenalezen')) throw err;
        console.warn('Prisma updateChild error, falling back:', err);
      }
    }

    const idx = dbStore.userChildren.findIndex((c) => c.id === childId);
    if (idx === -1) throw new Error('Záznam dítěte nenalezen.');
    const child = dbStore.userChildren[idx];
    if (!this.isOwnerOrAdmin(child.userId, requestingUser)) throw new Error('Přístup odepřen.');

    if (data.name) child.name = data.name;
    if (data.firstName !== undefined) child.firstName = data.firstName;
    if (data.lastName !== undefined) child.lastName = data.lastName;
    if (data.birthDate !== undefined) child.birthDate = data.birthDate;
    if (data.notes !== undefined) child.notes = data.notes;
    child.updatedAt = new Date().toISOString();

    dbStore.logAudit('CHILD_UPDATE', 'USER_ACCOUNT', `Aktualizován záznam dítěte.`, requestingUser);
    return child;
  }

  static async deleteChild(requestingUser: User, childId: string): Promise<boolean> {
    if (prisma) {
      try {
        const existing = await (prisma as any).userChild.findUnique({ where: { id: childId } });
        if (!existing) throw new Error('Záznam dítěte nenalezen.');
        if (!this.isOwnerOrAdmin(existing.userId, requestingUser)) {
          throw new Error('Přístup odepřen.');
        }

        await (prisma as any).userChild.delete({ where: { id: childId } });

        await (prisma as any).auditLog.create({
          data: {
            userId: requestingUser.id,
            userEmail: requestingUser.email,
            action: 'CHILD_DELETE',
            module: 'USER_ACCOUNT',
            details: `Smazán záznam dítěte.`,
          },
        });

        return true;
      } catch (err: any) {
        if (err.message?.includes('Přístup') || err.message?.includes('nenalezen')) throw err;
        console.warn('Prisma deleteChild error, falling back:', err);
      }
    }

    const idx = dbStore.userChildren.findIndex((c) => c.id === childId);
    if (idx === -1) throw new Error('Záznam dítěte nenalezen.');
    const child = dbStore.userChildren[idx];
    if (!this.isOwnerOrAdmin(child.userId, requestingUser)) throw new Error('Přístup odepřen.');

    dbStore.userChildren.splice(idx, 1);
    dbStore.logAudit('CHILD_DELETE', 'USER_ACCOUNT', `Smazán záznam dítěte.`, requestingUser);
    return true;
  }

  // --- DOCUMENT PRE-FILLING ENGINE ---

  static async previewFilledDocument(requestingUser: User, templateText: string): Promise<string> {
    // Retrieve full profile & children for requesting user
    const fullProfile = await this.getUserProfile(requestingUser.id);
    const children = await this.getChildren(requestingUser.id, requestingUser);

    const profile = fullProfile?.profile;
    const user = fullProfile?.user || requestingUser;
    const primaryChild = children[0];

    let filledText = templateText || '';

    // Replace User Placeholders
    filledText = filledText.replace(/\{\{\s*user\.email\s*\}\}/g, user.email || '');
    filledText = filledText.replace(/\{\{\s*user\.name\s*\}\}/g, user.name || '');
    filledText = filledText.replace(/\{\{\s*user\.firstName\s*\}\}/g, profile?.firstName || user.name.split(' ')[0] || '');
    filledText = filledText.replace(/\{\{\s*user\.lastName\s*\}\}/g, profile?.lastName || user.name.split(' ').slice(1).join(' ') || '');
    filledText = filledText.replace(/\{\{\s*user\.birthDate\s*\}\}/g, profile?.birthDate || '___');
    filledText = filledText.replace(/\{\{\s*user\.phone\s*\}\}/g, profile?.phone || user.phone || '___');
    filledText = filledText.replace(/\{\{\s*user\.address\s*\}\}/g, profile?.address || '___');
    filledText = filledText.replace(/\{\{\s*user\.city\s*\}\}/g, profile?.city || '___');
    filledText = filledText.replace(/\{\{\s*user\.postalCode\s*\}\}/g, profile?.postalCode || '___');

    // Replace Primary Child Placeholders
    if (primaryChild) {
      filledText = filledText.replace(/\{\{\s*child\.name\s*\}\}/g, primaryChild.name || '');
      filledText = filledText.replace(/\{\{\s*child\.firstName\s*\}\}/g, primaryChild.firstName || primaryChild.name.split(' ')[0] || '');
      filledText = filledText.replace(/\{\{\s*child\.lastName\s*\}\}/g, primaryChild.lastName || primaryChild.name.split(' ').slice(1).join(' ') || '');
      filledText = filledText.replace(/\{\{\s*child\.birthDate\s*\}\}/g, primaryChild.birthDate || '___');
    } else {
      filledText = filledText.replace(/\{\{\s*child\.[a-zA-Z0-9_]+\s*\}\}/g, '___');
    }

    return filledText;
  }

  // --- USER NOTES & TIMELINE ---

  static async getNotes(targetUserId: string, requestingUser: User): Promise<UserNote[]> {
    if (!this.isOwnerOrAdmin(targetUserId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění zobrazit poznámky jiného uživatele.');
    }

    if (prisma) {
      try {
        const notes = await (prisma as any).userNote.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: 'desc' },
        });
        return notes.map((n: any) => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          content: n.content,
          category: n.category || undefined,
          createdAt: new Date(n.createdAt).toISOString(),
          updatedAt: new Date(n.updatedAt).toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getNotes error, falling back:', err);
      }
    }

    return dbStore.userNotes.filter((n) => n.userId === targetUserId);
  }

  static async createNote(
    requestingUser: User,
    data: { userId?: string; title: string; content: string; category?: string }
  ): Promise<UserNote> {
    const userId = data.userId || requestingUser.id;
    if (!this.isOwnerOrAdmin(userId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění vytvářet poznámky pro jiného uživatele.');
    }

    if (prisma) {
      try {
        const created = await (prisma as any).userNote.create({
          data: {
            userId,
            title: data.title,
            content: data.content,
            category: data.category,
          },
        });
        return {
          id: created.id,
          userId: created.userId,
          title: created.title,
          content: created.content,
          category: created.category || undefined,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: new Date(created.updatedAt).toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createNote error, falling back:', err);
      }
    }

    const newNote: UserNote = {
      id: 'note-' + Date.now(),
      userId,
      title: data.title,
      content: data.content,
      category: data.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.userNotes.unshift(newNote);
    return newNote;
  }

  static async deleteNote(noteId: string, requestingUser: User): Promise<boolean> {
    if (prisma) {
      try {
        const note = await (prisma as any).userNote.findUnique({ where: { id: noteId } });
        if (!note) return false;
        if (!this.isOwnerOrAdmin(note.userId, requestingUser)) {
          throw new Error('Přístup odepřen: Nemáte oprávnění mazat poznámku jiného uživatele.');
        }
        await (prisma as any).userNote.delete({ where: { id: noteId } });
        return true;
      } catch (err) {
        console.warn('Prisma deleteNote error, falling back:', err);
      }
    }

    const idx = dbStore.userNotes.findIndex((n) => n.id === noteId);
    if (idx !== -1) {
      if (!this.isOwnerOrAdmin(dbStore.userNotes[idx].userId, requestingUser)) {
        throw new Error('Přístup odepřen.');
      }
      dbStore.userNotes.splice(idx, 1);
      return true;
    }
    return false;
  }

  // --- USER DOCUMENTS ---

  static async getDocuments(targetUserId: string, requestingUser: User): Promise<UserDocument[]> {
    if (!this.isOwnerOrAdmin(targetUserId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění zobrazit dokumenty jiného uživatele.');
    }

    if (prisma) {
      try {
        const docs = await (prisma as any).userDocument.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: 'desc' },
        });
        return docs.map((d: any) => ({
          id: d.id,
          userId: d.userId,
          name: d.name,
          fileUrl: d.fileUrl,
          fileType: d.fileType,
          size: d.size,
          category: d.category || undefined,
          createdAt: new Date(d.createdAt).toISOString(),
          updatedAt: new Date(d.updatedAt).toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getDocuments error, falling back:', err);
      }
    }

    return dbStore.userDocuments.filter((d) => d.userId === targetUserId);
  }

  static async createDocument(
    requestingUser: User,
    data: { userId?: string; name: string; fileUrl: string; fileType: string; size?: number; category?: string }
  ): Promise<UserDocument> {
    const userId = data.userId || requestingUser.id;
    if (!this.isOwnerOrAdmin(userId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění vkládat dokumenty pro jiného uživatele.');
    }

    if (prisma) {
      try {
        const created = await (prisma as any).userDocument.create({
          data: {
            userId,
            name: data.name,
            fileUrl: data.fileUrl,
            fileType: data.fileType,
            size: data.size || 0,
            category: data.category,
          },
        });
        return {
          id: created.id,
          userId: created.userId,
          name: created.name,
          fileUrl: created.fileUrl,
          fileType: created.fileType,
          size: created.size,
          category: created.category || undefined,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: new Date(created.updatedAt).toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createDocument error, falling back:', err);
      }
    }

    const newDoc: UserDocument = {
      id: 'doc-' + Date.now(),
      userId,
      name: data.name,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      size: data.size || 0,
      category: data.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.userDocuments.unshift(newDoc);
    return newDoc;
  }

  // --- USER CALENDAR EVENTS ---

  static async getEvents(targetUserId: string, requestingUser: User): Promise<UserCalendarEvent[]> {
    if (!this.isOwnerOrAdmin(targetUserId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění zobrazit události jiného uživatele.');
    }

    if (prisma) {
      try {
        const events = await (prisma as any).userCalendarEvent.findMany({
          where: { userId: targetUserId },
          orderBy: { eventDate: 'asc' },
        });
        return events.map((e: any) => ({
          id: e.id,
          userId: e.userId,
          title: e.title,
          eventDate: new Date(e.eventDate).toISOString(),
          category: e.category,
          description: e.description || undefined,
          createdAt: new Date(e.createdAt).toISOString(),
          updatedAt: new Date(e.updatedAt).toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getEvents error, falling back:', err);
      }
    }

    return dbStore.userEvents.filter((e) => e.userId === targetUserId);
  }

  static async createEvent(
    requestingUser: User,
    data: { userId?: string; title: string; eventDate: string; category?: string; description?: string }
  ): Promise<UserCalendarEvent> {
    const userId = data.userId || requestingUser.id;
    if (!this.isOwnerOrAdmin(userId, requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění vytvářet události pro jiného uživatele.');
    }

    if (prisma) {
      try {
        const created = await (prisma as any).userCalendarEvent.create({
          data: {
            userId,
            title: data.title,
            eventDate: new Date(data.eventDate),
            category: data.category || 'handover',
            description: data.description,
          },
        });
        return {
          id: created.id,
          userId: created.userId,
          title: created.title,
          eventDate: new Date(created.eventDate).toISOString(),
          category: created.category,
          description: created.description || undefined,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: new Date(created.updatedAt).toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createEvent error, falling back:', err);
      }
    }

    const newEvt: UserCalendarEvent = {
      id: 'evt-' + Date.now(),
      userId,
      title: data.title,
      eventDate: data.eventDate,
      category: data.category || 'handover',
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.userEvents.push(newEvt);
    return newEvt;
  }
}
