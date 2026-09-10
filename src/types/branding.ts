export const BRAND_APP_KEYS = [
  'public_portal',
  'case_portal',
  'admin_portal',
] as const;

export type BrandAppKey = typeof BRAND_APP_KEYS[number];

export type BrandProfileKind = 'FAMILY' | 'APPLICATION';

export type BrandReleaseStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'READY'
  | 'PUBLISHED'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export type BrandAssetRole =
  | 'LOGO'
  | 'MARK'
  | 'FAVICON'
  | 'PWA_ICON'
  | 'APPLE_TOUCH_ICON'
  | 'SOCIAL_IMAGE'
  | 'DOCUMENT_LOGO'
  | 'WATERMARK';

export type BrandAssetVariant =
  | 'PRIMARY'
  | 'LIGHT'
  | 'DARK'
  | 'MONO'
  | 'ANY'
  | 'MASKABLE';

export type BrandAssetSource = 'UPLOADED' | 'GENERATED' | 'MIGRATED';

export type BrandAssetValidationStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID';

export interface BrandFamilyContract {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppIdentityContract {
  id: string;
  familyId: string;
  appKey: BrandAppKey;
  name: string;
  shortName: string;
  scope: string;
  startUrl: string;
  manifestPath: string;
  serviceWorkerPath: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfileContract {
  id: string;
  familyId: string;
  identityId?: string | null;
  parentProfileId?: string | null;
  key: string;
  name: string;
  kind: BrandProfileKind;
  inheritsParent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandAssetContract {
  id: string;
  profileId: string;
  key: string;
  role: BrandAssetRole;
  variant: BrandAssetVariant;
  targetWidth?: number | null;
  targetHeight?: number | null;
  required: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BrandJson = Record<string, unknown>;

export interface BrandAssetVersionContract {
  id: string;
  assetId: string;
  version: number;
  source: BrandAssetSource;
  storageProvider: 'MINIO';
  bucket: string;
  objectKey: string;
  deliveryPath?: string | null;
  mimeType: string;
  byteSize: number;
  sha256: string;
  width?: number | null;
  height?: number | null;
  validationStatus: BrandAssetValidationStatus;
  validationReport?: BrandJson | null;
  sanitizerVersion?: string | null;
  derivedFromId?: string | null;
  createdById?: string | null;
  createdAt: string;
}

export interface BrandReleaseAssetContract {
  slotKey: string;
  assetVersionId: string;
}

export interface BrandReleaseContract {
  id: string;
  profileId: string;
  version: number;
  status: BrandReleaseStatus;
  manifestHash?: string | null;
  notes?: string | null;
  createdById?: string | null;
  validatedById?: string | null;
  publishedById?: string | null;
  supersedesReleaseId?: string | null;
  createdAt: string;
  validatedAt?: string | null;
  publishedAt?: string | null;
  assets: BrandReleaseAssetContract[];
}

export type DocumentBrandingMode =
  | 'FULL'
  | 'SUBTLE'
  | 'NEUTRAL'
  | 'NONE';

export type WatermarkMode =
  | 'NONE'
  | 'BRAND'
  | 'STATUS'
  | 'BRAND_AND_STATUS';

export type BrandedDocumentFormat = 'PDF' | 'DOCX' | 'PRINT';

export interface DocumentBrandingProfileContract {
  id: string;
  identityId: string;
  key: string;
  name: string;
  version: number;
  mode: DocumentBrandingMode;
  watermarkMode: WatermarkMode;
  status: BrandReleaseStatus;
  config: BrandJson;
  active: boolean;
  createdById?: string | null;
  createdAt: string;
  publishedAt?: string | null;
}

export type BrandedDocumentSource =
  | 'SYSTEM_GENERATED'
  | 'USER_UPLOAD_DERIVATIVE'
  | 'AUDIT_EXPORT';

export interface BrandedDocumentExportContract {
  id: string;
  identityId: string;
  releaseId: string;
  documentProfileId?: string | null;
  sourceType: BrandedDocumentSource;
  sourceId?: string | null;
  format: BrandedDocumentFormat;
  storageProvider: 'MINIO';
  bucket: string;
  objectKey: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  originalSha256?: string | null;
  isDerivative: boolean;
  createdById?: string | null;
  createdAt: string;
}

export interface BrandIdentityPreset {
  name: string;
  shortName: string;
  scope: string;
  startUrl: string;
  manifestPath: string;
  serviceWorkerPath: string;
}

export const BRAND_IDENTITY_PRESETS = {
  public_portal: {
    name: 'Táta má právo', shortName: 'Táta má právo',
    scope: '/', startUrl: '/',
    manifestPath: '/manifests/public.webmanifest',
    serviceWorkerPath: '/sw.js',
  },
  case_portal: {
    name: 'Můj případ – Táta má právo', shortName: 'Můj případ',
    scope: '/muj-pripad/', startUrl: '/muj-pripad/',
    manifestPath: '/manifests/case.webmanifest',
    serviceWorkerPath: '/sw-case.js',
  },
  admin_portal: {
    name: 'Synthesis Admin – Táta má právo', shortName: 'Synthesis Admin',
    scope: '/administrace/', startUrl: '/administrace/',
    manifestPath: '/manifests/admin.webmanifest',
    serviceWorkerPath: '/sw-admin.js',
  },
} satisfies Record<BrandAppKey, BrandIdentityPreset>;

export type BrandCampaignStatus =
  | 'DRAFT'
  | 'READY'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type BrandCampaignDisplayMode =
  | 'REPLACE_LOGO'
  | 'DECORATE_LOGO'
  | 'BADGE'
  | 'THEME_ACCENT';

export type BrandSurface =
  | 'WEB_UI'
  | 'LOGIN'
  | 'OFFLINE_PAGE'
  | 'SOCIAL_METADATA'
  | 'PWA_MANIFEST'
  | 'PWA_ICON'
  | 'EMAIL'
  | 'DOCUMENT'
  | 'WATERMARK';

export interface BrandCampaignContract {
  id: string;
  familyId: string;
  key: string;
  name: string;
  description?: string | null;
  status: BrandCampaignStatus;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  priority: number;
  altText?: string | null;
  createdById?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandCampaignTargetContract {
  id: string;
  campaignId: string;
  identityId: string;
  releaseId: string;
  surface: BrandSurface;
  displayMode: BrandCampaignDisplayMode;
  enabled: boolean;
  createdAt: string;
}
