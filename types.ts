
export enum AssessmentType {
  WEB = 'Web',
  MOBILE = 'Mobile',
  CHATBOT = 'Chat-Bot',
  API = 'API',
  AI = 'AI Application'
}

export enum AppTier {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export type Region = 'APAC' | 'EMEA' | 'Global' | 'Latin America' | 'North America';

export interface SecurityQuestionnaire {
  handlesPII: boolean;
  internetFacing: boolean;
  storesPaymentData: boolean;
  thirdPartyIntegrations: boolean;
  requiresUserAuth: boolean;
}

export type TicketStatus = 'Pending' | 'In Review' | 'Scheduled' | 'In Progress' | 'Completed' | 'Rejected';

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
}

export interface ChatMessage {
  id: string;
  sender: 'vendor' | 'security';
  text: string;
  timestamp: string;
  attachment?: ChatAttachment;
}

export interface FinalReport {
  fileName: string;
  uploadDate: string;
  fileUrl?: string;
}

export interface SubmissionFile {
  name: string;
  url: string;
  uploadDate: string;
  size?: string;
  type?: string;
}

export type VulnerabilitySeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface VulnerabilityComment {
  text: string;
  timestamp: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: VulnerabilitySeverity;
  status: 'Open' | 'Ready for Retest' | 'Remediated';
  impact?: string;
  observation?: string;
  affectedUrl?: string;
  remediation?: string;
  vendorFixComments?: VulnerabilityComment[]; // History of comments
  readyForRetest?: boolean;
  dueDate?: string;
  slaReminderSent?: boolean;
}

export interface SecurityFormDetails {
  // Application Information (1-4)
  description: string;
  targetAudienceRegion: string;
  
  // Contacts (5-9)
  isExternalSite: string; // Public consumers, Partners, or Internal
  isTcccOwned: string; // TCCC, Partner, or Bottler
  businessOwner: string; // email
  itProjectManager: string; // email
  techContact: string; // email (agency/devs)

  // Timeline (10-12)
  goLiveDate: string;
  testingDeadline: string;
  blackoutDates: string;

  // Expedited Request (13)
  expeditedReason?: string;

  // Tier Determination (14-18)
  businessCriticality: 'Class 0' | 'Class 1' | 'Class 2' | 'Class 3';
  confidentialityRating: '1' | '2' | '3';
  integrityRating: '1' | '2' | '3';
  availabilityRating: '1' | '2' | '3';
  calculatedTier: AppTier;

  // Pre-Requisite (19-30)
  devSecOpsImplemented: string; // CodeQL, SAST, etc.
  allWeaknessesRemediated: boolean;
  wafDisabled: boolean;
  environmentPrereqs: string;
  isCustomCoded: string; // Custom, COTS, AI Generated, etc.
  techStack: string; // Lang, framework, hosting, DB
  repoUrl: string; // Platform/repo for source code
  priorAssessment: string; // date, report, remediation status
  testUrlProvided: string; // Specific staging/UAT URL
  outOfScopeItems: string;
  vendorPermission: boolean;
  walkthroughInfo: string; // key transactions, walkthrough doc

  // Web App Testing Information (31-36)
  hasEmailFunctionality: boolean;
  hasPromotionalActivities: boolean; // prize-based, promo/PIN codes
  hasEcommerce: boolean; // credit card, third party pay
  testAccountsProvided: string; // 2 user, 1 admin
  piiCollectionDetails: string; // full name, email, DOB, etc.
  fileUploadFunctionality: string; // file type, max size

  // API Testing (37-41)
  apiProtocol: string; // REST, SOAP, GraphQL, gRPC
  apiTargetAudience: string; // Public, Partner (B2B), Internal
  apiDocumentation: string; // Swagger, Postman
  apiAuthMechanisms: string; // API Keys, OAuth, JWT, MFA
  apiHandlesSensitiveData: string;

  // Authentication and Authorization (42-46)
  isProtectedByAuth: boolean;
  authMechanisms: string; // user/pass, OAuth, SSO, MFA
  sessionExpirationPolicies: string;
  sessionValidationHandled: string; // JWT sig, rotation, revocation
  passwordPolicies: string; // lockout, credential reset

  // Compliance and Security Concerns (47-51)
  cocaColaPiiPolicy: boolean;
  geoCompliance: string; // GDPR, PCI-DSS
  regionSpecificData: string; // phone, address, account details
  multilingualSupport: string; // languages
  knownSecurityConcerns: string;
}

export interface TeamMember {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  appName: string;
  vendorEmail?: string;
  region: Region;
  testUrl: string;
  readyDate: string;
  type: AssessmentType;
  tier: AppTier;
  isExpedited: boolean;
  securityAnswers: SecurityQuestionnaire;
  details: SecurityFormDetails; // The full 51-point data
  submissionFile?: SubmissionFile;
  artifacts?: SubmissionFile[]; // Assessment artifacts like APK, IPA, JSON, etc.
  aiRiskAnalysis?: string;
  scheduledDate?: string;
  status: TicketStatus;
  messages: ChatMessage[];
  finalReport?: FinalReport;
  retestReports?: FinalReport[];
  unreadFor?: 'vendor' | 'security' | null;
  vulnerabilities?: Vulnerability[];
  remediationDeadline?: string;
  assignedTo?: string;
  optionalReviewers?: string[];
  slaBreachNotificationSent?: boolean;
}
