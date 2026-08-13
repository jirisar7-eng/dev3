export type UserRole = 'USER' | 'VOLUNTEER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserProfile {
  id?: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  autoFillDocs?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDocumentData {
  id?: string;
  userId: string;
  fieldKey: string;
  fieldValue: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: 'ACTIVE' | 'SUSPENDED' | string;
  phone?: string;
  bio?: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserCase {
  id: string;
  userId: string;
  title: string;
  caseNumber?: string;
  courtName?: string;
  status: 'active' | 'pending' | 'closed' | string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserChild {
  id: string;
  userId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCalendarEvent {
  id: string;
  userId: string;
  title: string;
  eventDate: string;
  category: 'court' | 'handover' | 'ospod' | 'meeting' | 'other' | string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDocument {
  id: string;
  userId: string;
  name: string;
  fileUrl?: string;
  fileType: string;
  size: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface TextItem {
  id: string;
  key: string;
  category: string;
  valueCzech: string;
  valueEnglish?: string;
  description?: string;
  active: boolean;
  updatedBy?: string;
  updatedAt: string;
}

export interface ThemeVariable {
  id: string;
  themeId?: string;
  key: string;
  value: string;
  label: string;
  category: string;
  updatedAt?: string;
}

export interface Theme {
  id: string;
  key: string;
  name: string;
  description?: string;
  isDefault: boolean;
  active: boolean;
  context: 'PUBLIC' | 'PRIVATE' | 'ADMIN' | 'GLOBAL' | string;
  variables: ThemeVariable[];
  updatedAt: string;
}

export interface ThemeSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  category: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  key: string;
  name: string;
  description?: string;
  version: string;
  enabled: boolean;
  public: boolean;
  config: string; // JSON string
  configuration?: Record<string, any>;
  icon?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface ModuleMetadata {
  id?: string;
  key: string;
  name: string;
  description: string;
  version: string;
  isPublic: boolean;
  icon?: string;
  category?: string;
}

export interface ModulePermissionDef {
  key: string;
  name: string;
  description?: string;
}

export interface ModuleRouteDef {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handlerName: string;
  public?: boolean;
  permissionRequired?: string;
}

export interface ModuleContract<TConfig = Record<string, any>> {
  metadata: ModuleMetadata;
  permissions: ModulePermissionDef[];
  defaultConfig: TConfig;
  routes?: ModuleRouteDef[];
  adminComponentKey?: string;
  publicComponentKey?: string;
  onEnable?: () => Promise<void> | void;
  onDisable?: () => Promise<void> | void;
  onConfigChange?: (newConfig: TConfig) => Promise<void> | void;
}

export interface PageSection {
  id: string;
  pageId: string;
  sectionKey: 'hero' | 'text' | 'image' | 'cards' | 'faq' | 'cta' | string;
  title?: string;
  content?: string;
  order: number;
  config?: string; // JSON config string
  createdAt?: string;
  updatedAt?: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  sections?: PageSection[];
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: 'article' | 'faq' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  published: boolean;
  category: string;
  categoryId?: string;
  authorId?: string;
  authorName?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  categoryId?: string;
  order: number;
  published: boolean;
}

export interface NavItem {
  id: string;
  labelKey: string;
  url: string;
  order: number;
  target: string;
  isExternal: boolean;
  parentId?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType?: string;
  size: number;
  alt?: string;
  scanStatus?: 'CLEAN' | 'PENDING' | 'INFECTED';
  storageProvider?: 'MinIO' | 'Local' | 'S3';
  createdAt: string;
}

export type ComplianceDocType = 'TERMS' | 'PRIVACY' | 'COOKIES' | 'LEGAL' | 'VOLUNTEER_CODE' | 'AI_STATEMENT';

export type LegalDocStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface LegalDocumentVersion {
  id: string;
  documentId: string;
  version: string;
  content: string;
  status: LegalDocStatus;
  effectiveDate: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalDocument {
  id: string;
  key: string;
  title: string;
  type: ComplianceDocType | string;
  description?: string;
  versions?: LegalDocumentVersion[];
  currentVersion?: LegalDocumentVersion;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceDoc {
  id: string;
  key: string;
  title: string;
  content: string;
  version: string;
  effectiveDate: string;
  updatedAt: string;
  status?: LegalDocStatus;
  type?: string;
  description?: string;
  author?: string;
  versions?: LegalDocumentVersion[];
}

export interface UserConsent {
  id: string;
  userId: string;
  userEmail?: string;
  docKey: string;
  docVersion: string;
  versionId?: string;
  status?: 'ACCEPTED' | 'REVOKED';
  ipAddress?: string;
  consentedAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  docKey: string;
  docVersion: string;
  versionId?: string;
  status: 'ACCEPTED' | 'REVOKED';
  ipAddress?: string;
  consentedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

export type StudyStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface StateStatistic {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  value: string;
  unit?: string | null;
  period: string;
  source: string;
  chartData?: any;
  createdAt: string | Date;
}

export interface CourtCase {
  id: string;
  fileNumber: string;
  court: string;
  title: string;
  summary: string;
  legalRatio: string;
  tags: string[];
  fullTextUrl?: string | null;
  publishedAt: string | Date;
  createdAt: string | Date;
}

export interface Study {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  authors: string;
  publicationYear?: number;
  publisher?: string;
  doi?: string;
  sourceUrl?: string;
  abstract?: string;
  summary?: string;
  methodology?: string;
  findings?: string;
  limitations?: string;
  relevance?: string;
  keywords?: string;
  category: string;
  status: StudyStatus;
  featured: boolean;
  pdfUrl?: string;
  pdfMediaId?: string;
  pdfSize?: number;
  s3Bucket?: string;
  s3ObjectKey?: string;
  storageProvider?: string;
  mimeType?: string;
  fileHash?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PartnerType {
  SPONSOR = 'SPONSOR',
  PARTNER = 'PARTNER'
}

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  description: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ForumPost {
  id: string;
  threadId: string;
  author: string;
  userId?: string | null;
  text?: string;
  content: string;
  createdAt: string | Date;
}

export interface ForumThread {
  id: string;
  category: string;
  title: string;
  author: string;
  userId?: string | null;
  content: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  repliesCount?: number;
  posts?: ForumPost[];
  replies?: Array<{ id?: string; author: string; createdAt: string | Date; text: string; content?: string }>;
}



