export type UserRole =
  | 'PATIENT'
  | 'HOSPITAL'
  | 'DONOR'
  | 'BLOOD_BANK'
  | 'NSS_PARTNER'
  | 'ADMIN';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponent = 'Whole Blood' | 'Red Cells' | 'Plasma' | 'Platelets';

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MODERATE';

export type VerificationStatus = 'TRUSTED' | 'UNVERIFIED' | 'CONFIRMED' | 'REJECTED' | 'PENDING';

export type RequestStatus =
  | 'CREATED'
  | 'VALIDATING'
  | 'SEARCHING_BANKS'
  | 'SEARCHING_DONORS'
  | 'DONORS_NOTIFIED'
  | 'PARTIALLY_MATCHED'
  | 'MATCHED'
  | 'RESERVED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED';

export type InventoryStatus = 'AVAILABLE' | 'RESERVED' | 'UNAVAILABLE' | 'EXPIRED';

export type FreshnessCategory = 'FRESH' | 'RECENT' | 'AGING' | 'STALE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  pincode: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
  entityName?: string;
  licenseNumber?: string;
  unitCollege?: string;
  hospitalId?: string;
  bloodBankId?: string;
  nssUnitId?: string;
}

export interface DonorHealthDetails {
  weightKg?: number;
  recentIllness: boolean;
  recentMedication: boolean;
  recentTravel: boolean;
  selfReportedFit: boolean;
  lastReportedAt: string;
  notes?: string;
}

export interface PartnerOffer {
  id: string;
  partnerName: string;
  title: string;
  description: string;
  category: 'HEALTH' | 'NUTRITION' | 'TRANSIT' | 'COMMUNITY';
  pointsCost: number;
  isSyntheticDemo: boolean;
  privacyAssurance: string;
}

export interface DonorRewards {
  points: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earnedAt: string;
    icon: string;
  }>;
  availableOffers: PartnerOffer[];
  redeemedOffers: Array<{
    offerId: string;
    title: string;
    partnerName: string;
    voucherCode: string;
    redeemedAt: string;
  }>;
}

export interface DonorProfile {
  id: string;
  userId: string;
  candidateCode: string; // e.g. D-014
  bloodGroup: BloodGroup;
  pincode: string;
  approxLocation: {
    lat: number;
    lng: number;
    district: string;
    state: string;
  };
  isAvailable: boolean; // Operational readiness (separate from notification consent)
  hasConsented: boolean; // General platform participation consent
  emergencyAlertsOptIn: boolean; // Specific consent to receive emergency SOS alerts
  alertsConsentUpdatedAt: string;
  lastDonationDate?: string;
  nextEligibleDonationDate?: string;
  eligibleAfter?: string;
  donationCount: number;
  responseRate: number; // 0 - 1
  recentActivityScore: number; // 0 - 1
  eligibilityNotes?: string;
  healthDetails?: DonorHealthDetails;
  rewards?: DonorRewards;
}

export interface BloodBank {
  id: string;
  name: string;
  licenseNumber: string;
  pincode: string;
  district: string;
  state: string;
  location: { lat: number; lng: number };
  phone?: string;
  isVerified: boolean;
  operatingHours: string;
  emergencyCapable: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  licenseNumber: string;
  pincode: string;
  district: string;
  state: string;
  location: { lat: number; lng: number };
  phone?: string;
  isVerified: boolean;
  emergencyDepartmentPhone?: string;
  traumaLevel: string;
}

export interface InventoryItem {
  id: string;
  bloodBankId: string;
  bloodBankName: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  units: number;
  collectionDate: string;
  expiryDate: string;
  status: InventoryStatus;
  lastUpdated: string;
  freshness: FreshnessCategory;
}

export interface EmergencyRequest {
  id: string; // BAN-XXXXX
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  patientReferenceId?: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequested: number;
  unitsFulfilled: number;
  urgency: UrgencyLevel;
  hospitalId?: string;
  hospitalName: string;
  pincode: string;
  location: { lat: number; lng: number };
  requiredBy: string;
  status: RequestStatus;
  verificationState: VerificationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  matchedBankId?: string;
  matchedBankName?: string;
  donorCandidatesCount?: number;
}

export interface RequestEvent {
  id: string;
  requestId: string;
  timestamp: string;
  eventType: string;
  description: string;
  actor: string;
}

export interface CandidateMatch {
  candidateId: string; // e.g. D-014
  requestId: string;
  bloodGroup: BloodGroup;
  approxDistanceKm: number;
  matchScore: number; // 0 - 1
  scores: {
    proximityScore: number;
    groupScore: number;
    responseScore: number;
    activityScore: number;
  };
  notificationStatus: 'PENDING' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'TIMED_OUT';
  wave: number;
  notifiedAt?: string;
  respondedAt?: string;
}

export interface DonorNotification {
  id: string;
  requestId: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  units: number;
  urgency: UrgencyLevel;
  approxArea: string;
  hospitalName: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  channel: 'IN_APP' | 'SMS' | 'WHATSAPP' | 'VOICE';
  isSimulated: boolean;
}

export interface RelayMessage {
  id: string;
  requestId: string;
  senderRole: UserRole;
  senderCandidateId?: string; // only candidate ID like D-014
  message: string;
  timestamp: string;
  isStructured: boolean;
  status: 'DELIVERED' | 'BLOCKED_PII';
}

export interface PincodeRecord {
  pincode: string;
  officeName: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
}

export interface SystemMetrics {
  activeDonors: number;
  activeBloodBanks: number;
  openRequests: number;
  matchesToday: number;
  fulfilmentRate: number; // percentage, e.g. 91.2
  responseRate: number; // percentage, e.g. 78.4
  avgMatchTimeSeconds: number; // e.g. 4.2
  avgFulfilmentMinutes: number; // e.g. 18.0
  matchingAccuracy: number; // e.g. 96.5
  isSimulated: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userRole: UserRole;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
  piiUnmaskedReason?: string;
}

export interface CompatibilityRule {
  component: BloodComponent;
  recipientGroup: BloodGroup;
  compatibleDonorGroups: BloodGroup[];
  medicalReviewRequired: boolean;
  guidelines: string;
}
