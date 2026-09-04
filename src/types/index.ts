export type UserRole =
  | 'USER'
  | 'REGISTERED_USER'
  | 'VERIFIED_USER'
  | 'VOLUNTEER'
  | 'VERIFIED_CONTRIBUTOR'
  | 'MODERATOR'
  | 'LEGAL_EDITOR'
  | 'CONTENT_MANAGER'
  | 'SYSTEM_ADMIN'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export interface UserProfile {
  id?: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  hasChildrenInitial?: boolean;
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
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | string;
  gender?: 'MALE' | 'FEMALE' | string;
  hasChildrenInitial?: boolean;
  totpEnabled?: boolean;
  totpSecret?: string;
  totpTempSecret?: string;
  totpBackupCodes?: string[];
  phone?: string;
  bio?: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
  preferences?: UserPreference;
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

// ------------------------------------------------------
// OSOBNÍ KLIENTSKÁ SLOŽKA OTCE - DATA INTERFACES
// ------------------------------------------------------

export type CaseStatusType = 'ACTIVE' | 'CLOSED' | 'ARCHIVED' | 'DRAFT';
export type CasePriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatusType = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type NoteVisibilityType = 'PRIVATE' | 'CASE';
export type CaseEventType = 'COURT' | 'OSPOD' | 'CHILD_HANDOVER' | 'SCHOOL' | 'MEDICAL' | 'COMMUNICATION' | 'OTHER';
export type EvidenceKindType = 'DOCUMENT' | 'PHOTO' | 'EMAIL' | 'MESSAGE' | 'RECORD' | 'OTHER';
export type CareArrangementType = 'STRIDAVA' | 'SPOLECNA' | 'VYHRADNI_OTEC' | 'VYHRADNI_MATKA' | 'UPRAVA_STYKU' | 'JINE';
export type ParticipantRoleType = 'OTEC' | 'MATKA' | 'OSPOD' | 'SOUDCE' | 'KOLIZNI_OPATROVNIK' | 'ADVOKAT_OTCE' | 'ADVOKAT_MATKY' | 'ZNALEC' | 'JINY';

export interface CaseParticipant {
  id: string;
  caseId: string;
  name: string;
  role: ParticipantRoleType | string;
  email?: string;
  phone?: string;
  address?: string;
  institution?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseChild {
  id: string;
  caseId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  birthDate?: string;
  birthNumber?: string;
  schoolName?: string;
  pediatrician?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  createdBy: string;
  title: string;
  description?: string;
  category: CaseEventType | string;
  eventDate: string;
  endDate?: string;
  location?: string;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CaseDeadline {
  id: string;
  caseId: string;
  createdBy: string;
  title: string;
  description?: string;
  dueDate: string;
  type: string;
  isCompleted: boolean;
  priority: CasePriorityType | string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseTask {
  id: string;
  caseId: string;
  createdBy: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: CasePriorityType | string;
  status: TaskStatusType | string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  createdBy: string;
  title: string;
  content: string;
  category?: string;
  visibility: NoteVisibilityType | string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  uploadedBy: string;
  name: string;
  category: string;
  fileUrl?: string;
  s3Bucket?: string;
  s3ObjectKey?: string;
  fileType: string;
  mimeType: string;
  size: number;
  fileHash?: string;
  storageProvider: string;
  scanStatus: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseEvidence {
  id: string;
  caseId: string;
  createdBy: string;
  title: string;
  description?: string;
  date?: string;
  type: EvidenceKindType | string;
  documentId?: string;
  document?: CaseDocument;
  eventId?: string;
  event?: CaseEvent;
  relevance?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseCommunication {
  id: string;
  caseId: string;
  createdBy: string;
  participantName: string;
  channel: string;
  date: string;
  summary: string;
  tone?: string;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CareArrangement {
  id: string;
  caseId: string;
  title: string;
  type: CareArrangementType | string;
  intervalDays: number;
  handoverDay?: string;
  handoverLocation?: string;
  childSupportAmount?: number;
  notes?: string;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionDraftStatus = 'DRAFT' | 'FINAL' | 'ARCHIVED';

export interface CaseSubmissionDraftVersion {
  id: string;
  draftId: string;
  version: number;
  title: string;
  formData?: any;
  generatedContent?: string;
  changeSummary?: string;
  createdById: string;
  createdAt: string;
}

export interface CaseSubmissionDraft {
  id: string;
  caseId: string;
  userId: string;
  title: string;
  templateId?: string;
  status: SubmissionDraftStatus | string;
  formData?: any;
  generatedContent?: string;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  versions?: CaseSubmissionDraftVersion[];
}

export interface ClientCase {
  id: string;
  ownerId: string;
  title: string;
  caseNumber?: string;
  court?: string;
  caseType: string;
  status: CaseStatusType | string;
  description?: string;
  currentCareType?: CareArrangementType | string;
  createdAt: string;
  updatedAt: string;

  participants?: CaseParticipant[];
  children?: CaseChild[];
  events?: CaseEvent[];
  deadlines?: CaseDeadline[];
  tasks?: CaseTask[];
  notes?: CaseNote[];
  documents?: CaseDocument[];
  evidence?: CaseEvidence[];
  communications?: CaseCommunication[];
  careArrangements?: CareArrangement[];
  carePlans?: CarePlan[];
  submissionDrafts?: CaseSubmissionDraft[];
}

// ------------------------------------------------------
// CARE & PARENTING HUB TYPES
// ------------------------------------------------------

export type CarePlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'PROPOSED';
export type CarePlanType = 'CURRENT' | 'PROPOSED' | 'SIMULATION';
export type CarePlanSource = 'MANUAL' | 'JUDGMENT_IMPORT' | 'SIMULATION_TEMPLATE';
export type CareLocationType = 'PARENT_A_HOME' | 'PARENT_B_HOME' | 'SCHOOL' | 'KINDERGARTEN' | 'NEUTRAL' | 'CUSTOM' | string;
export type AssignedParentType = 'PARENT_A' | 'PARENT_B';

export interface ChildAgeDetail {
  childId?: string;
  name?: string;
  dateOfBirth?: string;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  ageBracket: '0_1' | '1_3' | '3_6' | '6_11' | '11_15' | '15_18' | '18_21' | '21_26' | '26_PLUS' | string;
  isAdult: boolean;
  ageFormatted: string;
  exactAgeString?: string;
  developmentalBracket?: string;
  notes?: string;
}

export interface CareLocation {
  id?: string;
  carePlanId?: string;
  planId?: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  type: CareLocationType;
  isDefault?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CareDay {
  id?: string;
  carePlanId?: string;
  date: string; // ISO date YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  assignedParent: AssignedParentType | string;
  isOvernight: boolean;
  overnightParent?: AssignedParentType | string;
  schoolParent?: string;
  isHandover: boolean;
  handoverTime?: string;
  handoverLocationId?: string;
  handoverLocation?: CareLocation;
  locationName?: string;
  travelDistanceKm?: number;
  travelDurationMin?: number;
  isHoliday?: boolean;
  holidayName?: string;
  notes?: string;
}

export interface CareHolidayRule {
  id?: string;
  carePlanId?: string;
  holidayType: 'SUMMER' | 'SPRING' | 'EASTER' | 'AUTUMN' | 'WINTER_CHRISTMAS' | 'STATE_HOLIDAYS' | 'CHRISTMAS' | 'NEW_YEAR' | 'CUSTOM' | string;
  name: string;
  startDate?: string;
  endDate?: string;
  daysCount?: number;
  allocationModel?: 'ALTERNATING_YEARS' | 'SPLIT_HALF' | 'ALWAYS_PARENT_A' | 'ALWAYS_PARENT_B' | 'CUSTOM' | string;
  rulePattern?: 'ALTERNATING_YEARS' | 'HALF_HALF' | 'BY_AGREEMENT' | 'SPECIFIC_DATES' | string;
  evenYearParent?: AssignedParentType | string;
  oddYearParent?: AssignedParentType | string;
  notes?: string;
}

export interface CareMetrics {
  totalDays: number;
  daysA: number;
  daysB: number;
  totalNights: number;
  nightsA: number;
  nightsB: number;
  nightsPercentA: number;
  nightsPercentB: number;
  estimatedTimePercentA?: number | null;
  estimatedTimePercentB?: number | null;
  timeEstimateCalculable: boolean;
  timeEstimateNote?: string;
  totalHandovers: number;
  handoversPerWeek: number;
  totalDistanceKm: number;
  totalTravelMinutes: number;
  blocksCountA: number;
  blocksCountB: number;
  avgBlockLengthDaysA: number;
  avgBlockLengthDaysB: number;
  maxBlockLengthDaysA: number;
  maxBlockLengthDaysB: number;
  maxSeparationDaysA: number; // Max consecutive days away from parent A
  maxSeparationDaysB: number; // Max consecutive days away from parent B
  schoolHandoversCount: number;
  weekendDaysA: number;
  weekendDaysB: number;
}

export interface CarePlanChildLink {
  id?: string;
  carePlanId?: string;
  childId: string;
  child?: CaseChild;
}

export interface CarePlan {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  status: CarePlanStatus;
  type: CarePlanType;
  source: CarePlanSource;
  startDate?: string;
  endDate?: string;
  rotationPattern?: '7/7' | '2-2-3' | '3-4-4-3' | 'ALTERNATING_WEEKENDS' | 'EXTENDED_WEEKENDS' | 'CUSTOM' | string;
  rotationIntervalDays: number;
  version: number;
  isSharedWithCoParent: boolean;
  createdBy?: string;
  parentAName?: string;
  parentBName?: string;
  parentAAddress?: string;
  parentBAddress?: string;
  parentALat?: number;
  parentALng?: number;
  parentBLat?: number;
  parentBLng?: number;
  parentAPreferences?: string;
  parentBPreferences?: string;
  defaultHandoverTime?: string;
  defaultLocationName?: string;
  defaultLocationAddress?: string;
  metricsJson?: string;
  metrics?: CareMetrics;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  children?: CarePlanChildLink[];
  locations?: CareLocation[];
  days?: CareDay[];
  holidayRules?: CareHolidayRule[];
}

export interface CareSimulationVariant {
  id: string;
  name: string;
  pattern: string;
  description?: string;
  plan: CarePlan;
  metrics: CareMetrics;
}

export interface CareSimulationComparison {
  id: string;
  caseId: string;
  title: string;
  variantsJson: string;
  variants?: CareSimulationVariant[];
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseTimelineItem {
  id: string;
  type: 'EVENT' | 'DEADLINE' | 'DOCUMENT' | 'TASK' | 'COMMUNICATION' | 'NOTE';
  date: string;
  title: string;
  description?: string;
  category?: string;
  badge?: string;
  status?: string;
  priority?: string;
  meta?: any;
}


export interface UserChild {
  id: string;
  userId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  isStudying?: boolean;
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
  visibility?: 'public' | 'user' | 'team' | 'admin';
  requiredRoles?: string[];
  requiredPermissions?: string[];
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

export type AuditCategoryType =
  | 'SECURITY'
  | 'REGISTRY'
  | 'CONTENT'
  | 'CMS'
  | 'ARCHITECTURE'
  | 'DATA'
  | 'QA'
  | 'PERFORMANCE'
  | 'LEGAL'
  | 'RESEARCH'
  | 'OTHER';

export type AuditStatusType = 'PASS' | 'WARNING' | 'FAIL' | 'INFO' | 'UNKNOWN';

export interface AuditShareItem {
  id: string;
  auditId: string;
  tokenHash: string;
  rawToken?: string;
  shareUrl?: string;
  accessMode: 'SHARED_LINK' | 'ADMIN_ONLY' | 'PUBLIC' | string;
  createdBy?: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

export interface AuditDocumentItem {
  id: string;
  sourcePath: string;
  title: string;
  category: AuditCategoryType | string;
  status: AuditStatusType | string;
  summary?: string;
  auditDate?: string;
  author?: string;
  sourceSha?: string;
  commitSha?: string;
  branch?: string;
  sourceUrl?: string;
  content?: string;
  discoveredAt: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  shares?: AuditShareItem[];
}

export interface AuditCenterStats {
  total: number;
  passCount: number;
  warningCount: number;
  failCount: number;
  unknownCount: number;
  lastSyncedAt?: string;
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
  evidenceLevel?: string;
  evidenceDirection?: string;
  causality?: string;
  sourceType?: string;
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

export interface CustomModule {
  id: string;
  slug: string;
  title: string;
  category: string;
  icon: string;
  showInMenu: boolean;
  isActive: boolean;
  contentJson: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Schema-Driven UI Component specifications
export type SchemaComponentType =
  | 'hero'
  | 'grid'
  | 'cards'
  | 'accordion'
  | 'faq'
  | 'callout'
  | 'alert'
  | 'text'
  | 'stats'
  | 'form'
  | 'cta'
  | 'links';

export interface SchemaComponentItem {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string;
  icon?: string;
  link?: string;
  linkText?: string;
  badge?: string;
  badgeColor?: 'blue' | 'rose' | 'amber' | 'emerald' | 'indigo' | 'slate';
  value?: string;
  label?: string;
  question?: string;
  answer?: string;
  [key: string]: any;
}

export interface SchemaComponent {
  id?: string;
  type: SchemaComponentType;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  variant?: 'info' | 'warning' | 'success' | 'danger' | 'primary' | 'secondary';
  buttonText?: string;
  buttonLink?: string;
  items?: SchemaComponentItem[];
  fields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
    placeholder?: string;
    options?: string[];
    required?: boolean;
  }>;
  submitLabel?: string;
  submitMessage?: string;
  [key: string]: any;
}

export interface SchemaDrivenContent {
  version?: string;
  title?: string;
  description?: string;
  theme?: 'light' | 'dark' | 'brand';
  sections?: SchemaComponent[];
}

export type EntityType = 'SOUD' | 'OSPOD' | 'ZNALEC' | 'ADVOKAT' | 'PORADNA_CHARITA';

export interface Pracovnik {
  id: string;
  jmeno: string;
  pozice?: string | null;
  telefon?: string | null;
  email?: string | null;
  kancelar?: string | null;
  subjektId: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdById?: string | null;
  createdAt?: string | Date;
  subjektName?: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  subjektId: string;
  pracovnikId?: string | null;
  userId?: string | null;
  rating: number; // 1-5 overall
  supportSharedCare: number; // 1-5
  professionalism: number; // 1-5
  speedAndDeadlines: number; // 1-5
  objektivita?: number | null;
  komunikace?: number | null;
  rychlost?: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string;
  isAnonymous: boolean;
  createdAt: string | Date;
  pracovnikName?: string;
}

export interface Subjekt {
  id: string;
  type: EntityType;
  name: string;
  titleBefore?: string | null;
  position?: string | null;
  institution?: string | null;
  city: string;
  lat?: number;
  lng?: number;
  region: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  avgRating: number;
  reviewCount: number;
  isVerified: boolean;
  status?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'ARCHIVED';
  createdById?: string | null;
  verifiedById?: string | null;
  verifiedAt?: string | Date | null;
  rejectedById?: string | null;
  rejectedAt?: string | Date | null;
  rejectionReason?: string | null;
  createdAt?: string | Date;
  reviews?: Review[];
  pracovnici?: Pracovnik[];
}

export type WikiCategory = 'pravo' | 'ospod' | 'soud' | 'finance' | 'psychologie' | 'ostatni';

export interface WikiTerm {
  id: string;
  slug: string;
  term: string;
  firstLetter: string;
  category: string;
  categoryLabel: string;
  citation?: string;
  definition: string;
  practicalTips: string[];
  relatedTerms?: string[];
  order?: number;
  status: StudyStatus;
  seoTitle?: string;
  seoDescription?: string;
  sources?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalGuideChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  icon?: string;
  type?: 'info' | 'warning' | 'success' | 'checklist' | 'steps' | 'faq' | string;
  checklistItems?: { id: string; label: string }[];
  faqItems?: { question: string; answer: string }[];
}

export interface LegalGuide {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  order: number;
  status: StudyStatus;
  badgeText?: string;
  badgeBg?: string;
  disclaimer?: string;
  sources: string[];
  chapters: LegalGuideChapter[];
  checklist?: { id: string; label: string }[];
  faqs?: { question: string; answer: string }[];
  seoTitle?: string;
  seoDescription?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------
// PHASE B: MULTIMEDIA & EDUCATION (CMS)
// ------------------------------------------------------

export interface VideoAttachment {
  name: string;
  size: string;
  url?: string;
}

export interface AcademyVideo {
  id: string;
  slug: string;
  title: string;
  category: 'rozhovory' | 'navody' | 'webinare' | string;
  categoryLabel: string;
  duration: string;
  speaker: string;
  speakerRole: string;
  thumbnailUrl: string;
  videoEmbedUrl: string;
  sourceType?: 'youtube' | 'vimeo' | 'mp4' | 'other' | string;
  description: string;
  summaryNotes: string[];
  attachments?: VideoAttachment[];
  order: number;
  status: StudyStatus;
  seoTitle?: string;
  seoDescription?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId?: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  order?: number;
}

export interface Quiz {
  id: string;
  slug: string;
  title: string;
  category: string;
  badge: string;
  icon: string;
  description: string;
  recommendedStudyPath: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
  order: number;
  status: StudyStatus;
  seoTitle?: string;
  seoDescription?: string;
  questions: QuizQuestion[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MementoCase {
  id: string;
  slug: string;
  title: string;
  icon: string;
  category?: string;
  error: string;
  consequence: string;
  correctAction: string;
  exampleBad: string;
  exampleGood: string;
  order: number;
  status: StudyStatus;
  seoTitle?: string;
  seoDescription?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}


export interface UserPreference {
  id: string;
  userId: string;
  themeMode: string;
  colorPreset: string;
  customColors?: string | null;
  fontFamily: string;
  fontSize: number;
  density: string;
  borderRadius: string;
  highContrast: boolean;
  updatedAt: string;
  createdAt: string;
}

// ------------------------------------------------------
// PRIVACY-FIRST ANALYTICS & ACTIVITY LOGGING
// ------------------------------------------------------

export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'page_view'
  | 'feature_open'
  | 'feature_complete'
  | 'search'
  | 'form_start'
  | 'form_complete'
  | 'document_download'
  | 'login'
  | 'logout';

export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  userId?: string | null;
  eventType: AnalyticsEventType | string;
  route: string;
  featureId?: string | null;
  metadata?: Record<string, any> | null;
  isAnonymous: boolean;
  ipHash?: string | null;
  createdAt?: string;
}

export interface AnalyticsSetting {
  id: string;
  publicStatsEnabled: boolean;
  simulatedActivityEnabled: boolean;
  simulationMultiplier: number;
  simulationMin: number;
  simulationMax: number;
  simulationTimeWindow: number; // minutes
  updatedAt: string;
}

export interface PublicActivitySummary {
  activeVisitorsNow: number;
  visitsToday: number;
  uniqueVisitorsToday: number;
  pageViewsToday: number;
  featureUsesToday: number;
  searchesToday: number;
  topFeaturesToday: { featureId: string; label: string; count: number }[];
  isSimulationActive: boolean;
  lastUpdated: string;
}

export interface AdminAnalyticsStats {
  real: {
    activeVisitorsNow: number;
    visitsToday: number;
    uniqueVisitorsToday: number;
    visitsYesterday: number;
    visitsLast7Days: number;
    visitsLast30Days: number;
    pageViewsTotal: number;
    pageViewsToday: number;
    anonymousVisitsToday: number;
    registeredVisitsToday: number;
    topSections: { route: string; count: number }[];
    topFeatures: { featureId: string; label: string; count: number; completedCount: number }[];
    searches: { totalCount: number; topQueries: { query: string; count: number }[] };
    completedFeaturesCount: number;
    uncompletedFeaturesCount: number;
    avgTimeInFeatureSeconds?: number;
    entryPages: { route: string; count: number }[];
    exitPages: { route: string; count: number }[];
    activityByHour: { hour: number; visits: number; pageViews: number }[];
  };
  simulation: {
    enabled: boolean;
    multiplier: number;
    min: number;
    max: number;
    timeWindow: number;
    simulatedActiveVisitors: number;
    simulatedVisitsToday: number;
    simulatedPageViewsToday: number;
  };
  publicDisplay: {
    activeVisitorsNow: number;
    visitsToday: number;
    pageViewsToday: number;
    featureUsesToday: number;
  };
  settings: AnalyticsSetting;
}

export type AnalyticsTimeRange = 'today' | '7d' | '30d' | 'all';

export interface UserJourneyTransition {
  fromRoute: string;
  toRoute: string;
  count: number;
  percentage: number;
}

export interface UserJourneyPath {
  path: string[];
  count: number;
  percentage: number;
}

export interface UserJourneyStats {
  timeRange: AnalyticsTimeRange;
  totalSessionsAnalyzed: number;
  avgStepsPerSession: number;
  avgSessionDurationSeconds: number;
  entryPages: { route: string; count: number; percentage: number }[];
  exitPages: { route: string; count: number; percentage: number }[];
  topPaths: UserJourneyPath[];
  topTransitions: UserJourneyTransition[];
  featureCombinations: { features: string[]; count: number }[];
}

export interface FunnelStepStats {
  stepIndex: number;
  stepName: string;
  count: number;
  dropOffCount: number;
  dropOffRate: number;
  conversionFromFirstStep: number;
  conversionFromPrevStep: number;
}

export interface FunnelStats {
  funnelId: string;
  title: string;
  featureId?: string;
  timeRange: AnalyticsTimeRange;
  totalStarts: number;
  totalCompletions: number;
  completionRate: number;
  abandonmentRate: number;
  biggestDropOffStep?: { stepIndex: number; stepName: string; dropOffCount: number; dropOffRate: number };
  steps: FunnelStepStats[];
}

export interface SearchQueryStat {
  query: string;
  count: number;
  resultsCountAvg: number;
  hasResults: boolean;
  lastSearchedAt: string;
}

export interface SearchIntelligenceStats {
  timeRange: AnalyticsTimeRange;
  totalSearches: number;
  uniqueQueriesCount: number;
  zeroResultsCount: number;
  zeroResultsRate: number;
  avgResultsCount: number;
  topQueries: SearchQueryStat[];
  zeroResultQueries: SearchQueryStat[];
  searchesByDay: { date: string; total: number; zeroResults: number }[];
}

export interface FeatureAnalyticsDeepStat {
  featureId: string;
  label: string;
  openCount: number;
  useCount: number;
  completeCount: number;
  completionRate: number;
  abandonmentRate: number;
  avgDurationSeconds: number;
  uniqueUsersCount: number;
  trendPercentage?: number;
}

export interface UserTimelineEvent {
  id: string;
  timestamp: string;
  eventType: string;
  route: string;
  featureId?: string | null;
  durationSeconds?: number;
  safeDescription: string;
  metadata?: Record<string, any>;
}

export interface UserAnalyticsHistory {
  userId: string;
  userEmail?: string;
  userRole?: string;
  totalSessions: number;
  totalEvents: number;
  firstSeenAt: string;
  lastSeenAt: string;
  totalDurationMinutes: number;
  topUsedFeatures: { featureId: string; label: string; count: number }[];
  timeline: UserTimelineEvent[];
}

export interface AnalyticsAiInsightsData {
  timeRange: AnalyticsTimeRange;
  generatedAt: string;
  summary: {
    totalVisitors: number;
    totalPageViews: number;
    totalSearches: number;
    zeroResultsRate: number;
    primaryDropOffFeature: string;
  };
  missingContentTopics: { topic: string; queryCount: number; sampleQueries: string[] }[];
  funnelBottlenecks: { funnelTitle: string; dropOffStep: string; dropOffPercentage: number; recommendation: string }[];
  underutilizedFeatures: { featureId: string; label: string; useCount: number }[];
  highEngagementFeatures: { featureId: string; label: string; completeCount: number; completionRate: number }[];
}

export * from './databaseAudit';
export * from './handoffTypes';
export * from './agentRegistry';

