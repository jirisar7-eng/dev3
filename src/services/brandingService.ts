import { prisma } from '../db/prisma';
import { sanitizeSvg } from '../utils/svgSanitizer';

export class BrandingService {
  static async getActiveBranding() {
    return prisma.brandingVersion.findFirst({
      where: { isActive: true },
    });
  }

  static async getHistory() {
    return prisma.brandingVersion.findMany({
      orderBy: { version: 'desc' },
      take: 50
    });
  }

  static async restoreVersion(versionId: string, updatedBy: string) {
    const version = await prisma.brandingVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new Error("Version not found");

    return prisma.$transaction(async (tx) => {
      await tx.brandingVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
      return tx.brandingVersion.update({
        where: { id: versionId },
        data: { isActive: true, updatedBy, updatedAt: new Date() }
      });
    });
  }

  static async saveNewVersion(data: {
    primaryLogoSvg?: string;
    darkLogoSvg?: string;
    faviconSvg?: string;
    logoAlt?: string;
  }, updatedBy: string) {
    // Validate SVG inputs
    for (const key of ['primaryLogoSvg', 'darkLogoSvg', 'faviconSvg'] as const) {
      if (data[key]) {
        const check = sanitizeSvg(data[key]!);
        if (!check.valid) {
          throw new Error(`Neplatné SVG pro ${key}: ${check.error}`);
        }
        data[key] = check.sanitized;
      }
    }

    const latest = await prisma.brandingVersion.findFirst({
      orderBy: { version: 'desc' }
    });
    const nextVersion = (latest?.version || 0) + 1;

    return prisma.$transaction(async (tx) => {
      await tx.brandingVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      return tx.brandingVersion.create({
        data: {
          version: nextVersion,
          primaryLogoSvg: data.primaryLogoSvg,
          darkLogoSvg: data.darkLogoSvg,
          faviconSvg: data.faviconSvg,
          logoAlt: data.logoAlt || 'Táta má právo',
          isActive: true,
          updatedBy
        }
      });
    });
  }

  static async restoreDefault(updatedBy: string) {
    // Reading default from file could be done, but for now we create an empty record 
    // which signifies "use default assets (public/icon.svg)".
    return this.saveNewVersion({
      primaryLogoSvg: '',
      darkLogoSvg: '',
      faviconSvg: '',
      logoAlt: 'Táta má právo'
    }, updatedBy);
  }
}
