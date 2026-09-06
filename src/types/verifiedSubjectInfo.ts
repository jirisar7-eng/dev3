export type SubjectVerificationStatus = 'VERIFIED' | 'PENDING_REVIEW' | 'STALE' | 'REJECTED';

export type SourceTrustLevel =
  | 'P0_OFFICIAL_SUBJECT_WEB'
  | 'P1_STATE_MUNICIPAL_PORTAL'
  | 'P2_PUBLIC_STATE_REGISTRY'
  | 'P3_VERIFIED_PARTNER'
  | 'P4_USER_COMMUNITY_PROPOSAL'
  | 'P5_UNVERIFIED_EXTERNAL';

export type OpeningIntervalType = 'STANDARD' | 'APPOINTMENT_ONLY' | 'FILING_OFFICE';

export interface TimeInterval {
  from: string; // 'HH:mm' e.g. '08:00'
  to: string;   // 'HH:mm' e.g. '12:00'
  type?: OpeningIntervalType;
}

export interface DayOpeningHours {
  isOpen: boolean;
  intervals: TimeInterval[];
  note?: string; // e.g. 'Pouze pro objednané'
}

export interface WeeklyOpeningHours {
  monday: DayOpeningHours;
  tuesday: DayOpeningHours;
  wednesday: DayOpeningHours;
  thursday: DayOpeningHours;
  friday: DayOpeningHours;
  saturday: DayOpeningHours;
  sunday: DayOpeningHours;
  irregularScheduleNote?: string;
  lastUpdated?: string;
}

export interface SubjectVerifiedProfileDto {
  id: string;
  subjektId: string;
  officialWebsite?: string | null;
  officialPhone?: string | null;
  officialEmail?: string | null;
  openingHours?: WeeklyOpeningHours | null;
  openingHoursRaw?: string | null;
  appointmentRequired: boolean;
  bookingUrl?: string | null;
  accessibility?: string | null;
  dataBoxId?: string | null;
  submissionMethods?: string | null;
  status: SubjectVerificationStatus;
  staleAfterDays: number;
  lastCheckedAt?: string | null;
  nextCheckAt?: string | null;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectInformationSourceDto {
  id: string;
  profileId?: string | null;
  subjektId: string;
  sourceLevel: SourceTrustLevel;
  sourceUrl: string;
  fieldKey: string;
  extractedValue: string;
  evidenceSnippet?: string | null;
  extractionMethod: string;
  confidence?: number | null;
  status: SubjectVerificationStatus;
  createdById?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  fetchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSourceProposalInput {
  subjektId: string;
  sourceLevel?: SourceTrustLevel;
  sourceUrl: string;
  fieldKey: string;
  extractedValue: string;
  evidenceSnippet?: string;
  extractionMethod?: string;
  confidence?: number;
}

export interface ReviewSourceProposalInput {
  decision: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
  subjektId?: string;
}

export interface UpdateVerifiedProfileInput {
  officialWebsite?: string | null;
  officialPhone?: string | null;
  officialEmail?: string | null;
  openingHours?: WeeklyOpeningHours | null;
  appointmentRequired?: boolean;
  bookingUrl?: string | null;
  accessibility?: string | null;
  dataBoxId?: string | null;
  submissionMethods?: string | null;
  staleAfterDays?: number;
}
