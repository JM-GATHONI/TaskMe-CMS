
import { ReactNode } from 'react';

export interface NavItem {
  name: string;
  icon: string;
  subModules: string[];
}

export interface QuickStat {
  title: string;
  thisMonth: string;
  icon: string;
  color: string;
  today?: string;
  thisWeek?: string;
  reportUrl?: string;
}

export interface RecentActivity {
  category: string;
  description: string;
  time: string;
  color: string;
  link?: string;
}

export interface UpcomingPayment {
  id: string;
  name: string;
  unit: string;
  amount: string;
  dueDate: string;
  status: 'Overdue' | 'Due Soon';
}

export const TaskStatus = {
  Issued: 'Issued',
  InProgress: 'In Progress',
  Pending: 'Pending',
  Completed: 'Completed',
  Closed: 'Closed',
  Escalated: 'Escalated',
  Received: 'Received'
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  VeryHigh: 'Very High'
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  sla?: number;
  assignedTo?: string;
  tenant: { name: string; unit: string };
  property: string;
  comments?: Array<{ user: string; text: string; date: string }>;
  history: Array<{ id: string; timestamp: string; event: string }>;
  attachments?: string[];
  source?: 'Internal' | 'External' | 'Preventive';
  costs?: { labor: number; materials: number; travel: number };
  completionAttachments?: string[];
}

export interface TenantProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  idNumber: string;
  status: 'Active' | 'Overdue' | 'Notice' | 'Vacated' | 'Evicted' | 'Blacklisted' | 'Pending';
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unit: string;
  rentAmount: number;
  rentDueDate?: number; // Day of month
  depositPaid?: number;
  onboardingDate: string;
  leaseEnd?: string;
  leaseType?: 'Fixed' | 'Open';
  paymentHistory: {
    date: string;
    amount: string;
    status: 'Paid' | 'Pending' | 'Failed';
    method: string;
    reference: string;
    day?: number; // Derived often
  }[];
  outstandingBills: BillItem[];
  outstandingFines: FineItem[];
  maintenanceRequests: string[]; // IDs
  notes?: string[];
  notices?: Notice[];
  requests?: TenantRequest[];
  dateRegistered?: string;
  houseStatus?: string[];
  collectionHistory?: CollectionLog[];
  recurringBills?: RecurringBillSettings;
  avatar?: string;
  profilePicture?: string; // Alias for avatar sometimes used
  kraPin?: string;
  arrears?: number;
  role?: string; // Optional for unification
  passwordHash?: string;
  referrerId?: string; // ID of who referred this tenant
  referralConfig?: {
      rateType: '%' | 'KES';
      rateValue: number;
  };
}

export interface Property {
  id: string;
  name: string;
  type: string; // Residential, Commercial, Mixed-Use
  ownership: string; // In-house, Affiliate
  branch: string;
  status: 'Active' | 'Suspended' | 'Decommissioned';
  landlordId: string;
  assignedAgentId?: string;
  location?: string;
  defaultMonthlyRent?: number;
  floors?: number;
  units: Unit[];
  assets?: PropertyAsset[];
  defaultUnitType?: string;
  rentIsUniform?: boolean;
  rentType?: 'Inclusive' | 'Exclusive';
  deposit?: { required: boolean; months: number };
  placementFee?: boolean; // If true, first month rent goes to agency
  bills?: {
      [key: string]: { applicable: boolean; amount: number };
  };
  remittanceType?: 'Collection Based' | 'Occupancy Based';
  remittanceCutoffDay?: number;
  nearestLandmark?: string;
  county?: string;
  subCounty?: string;
  zone?: string;
  subLocation?: string;
  profilePictureUrl?: string;
  rentByType?: Record<string, number>;
  floorplan?: FloorPlan[];
}

export interface Unit {
  id: string;
  unitNumber: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  status: 'Vacant' | 'Occupied' | 'Under Maintenance' | 'Reserved' | 'Distressed' | 'Unhabitable';
  rent?: number;
  unitType?: string;
  amenities?: string[];
  isLocked?: boolean; // New: For tracking 'Vacant Locked' KPI
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  idNumber: string;
  kraPin?: string;
  role: UserRole | string;
  status: 'Active' | 'Inactive' | 'Suspended';
  branch?: string;
  avatarUrl?: string;
  passwordHash?: string;
  referralConfig?: {
      rateType: '%' | 'KES';
      rateValue: number;
  };
}

export type UserRole = 'Super Admin' | 'Branch Manager' | 'Field Agent' | 'Accountant' | 'Caretaker' | 'Landlord' | 'Tenant' | 'Contractor' | 'Affiliate' | 'Investor';

export interface Quotation {
  id: string;
  taskId: string;
  contractorName: string;
  totalAmount: number;
  items: QuotationItem[];
  status: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
  submittedDate: string;
}

export interface QuotationItem {
  description: string;
  amount: number;
  type: 'Labor' | 'Materials' | 'Travel';
}

export interface TenantApplication {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber?: string;
  kraPin?: string;
  property?: string; // Legacy/Display
  propertyId?: string;
  propertyName?: string;
  unit?: string; // Legacy/Display
  unitId?: string;
  status: 'New' | 'Under Review' | 'Approved' | 'Rejected';
  submittedDate: string;
  source?: string;
  rentStartDate?: string;
  rentAmount?: number;
  depositPaid?: number;
  documents?: Array<{ name: string; type: string; url: string }>;
  recurringBills?: RecurringBillSettings;
  avatar?: string;
  profilePicture?: string;
  referrerId?: string;
}

export interface LandlordApplication {
  id: string;
  name: string;
  email: string;
  phone?: string;
  idNumber?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  proposedProperties: string[];
  notes?: string;
  location?: string;
  propertyIds?: string[];
  paymentConfig?: {
      method: string;
      details: any;
  };
}

export type BusinessUnit = 'Management' | 'Administration' | 'Security' | 'Rental Management' | 'R-Reits' | 'Cleaning' | 'Maintenance';
export type SalaryType = 'Monthly' | 'Target Based' | 'Commission' | 'Per Project';

export interface StaffProfile {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  email: string;
  phone: string;
  branch: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  avatar?: string;
  department?: BusinessUnit | string;
  salaryConfig?: {
      type: SalaryType;
      amount: number;
      commissionRate?: number;
      activeTargets?: string[]; // New: List of enabled KPIs for Target Based salary
  };
  bankDetails?: {
      bankName?: string;
      accountNumber?: string;
      kraPin?: string;
      defaultMethod: 'Bank' | 'M-Pesa';
      mpesaNumber?: string;
  };
  payrollInfo: {
      baseSalary: number;
      nextPaymentDate: string;
  };
  leaveBalance: {
      annual: number;
  };
  commissions?: Array<{ date: string; amount: number; source: string }>;
  deductions?: StaffDeduction[];
  attendanceRecord?: Record<string, number[]>; // YYYY-MM -> array of absent days
  businessUnitAssignment?: string;
  passwordHash?: string;
  assignedPropertyId?: string;
  referralConfig?: {
      rateType: '%' | 'KES';
      rateValue: number;
  };
}

export interface StaffDeduction {
  id: string;
  name: string;
  amount: number;
  type: 'Recurring' | 'One-Off';
  category: 'Sacco' | 'Chama' | 'Fine' | 'Lost Item' | 'Other';
  dateAdded: string;
}

export interface FineRule {
  id: string;
  type: string;
  basis: 'Fixed Fee' | 'Percentage';
  value: number;
  description: string;
  appliesTo: string;
}

export interface OffboardingRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  unit: string;
  noticeDate: string;
  moveOutDate: string;
  status: 'Notice Given' | 'Inspection Pending' | 'Completed' | 'Cancelled';
  inspectionStatus: 'Pending' | 'Passed' | 'Failed';
  utilityClearance: boolean;
  depositRefunded: boolean;
  keysReturned: boolean;
  finalBillAmount?: number;
}

export interface GeospatialData {
  [county: string]: {
      [subCounty: string]: {
          [location: string]: {
              [zone: string]: string[]; // villages/sub-locations
          }
      }
  };
}

export type CommissionTrigger = 'Rent Collection' | 'Tenancy Referral' | 'Property Management Referral' | 'Property Sale';

export interface CommissionRule {
  id: string;
  trigger: CommissionTrigger;
  rateType: '%' | 'KES';
  rateValue: number;
  description: string;
  appliesTo: string;
  deadlineDay?: number;
}

export interface DeductionRule {
  id: string;
  name: string;
  type: 'Percentage' | 'Fixed';
  value: number;
  frequency: 'Monthly' | 'Yearly' | 'One-Off';
  applicability: 'Global' | 'Specific Landlord' | 'Specific Property';
  targetId?: string;
  status: 'Active' | 'Inactive';
  description?: string;
}

export interface Bill {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  invoiceDate: string;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Initiated' | 'Under Review';
  propertyId: string;
  description?: string;
  metadata?: any;
}

export interface BillItem {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Paid';
  description?: string;
  meterReadings?: {
      previous: number;
      current: number;
      units: number;
      rate: number;
      period: string;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  category: 'Inbound' | 'Outbound';
  tenantName: string; // Or Recipient/Vendor
  unit?: string;
  amount: number;
  dueDate: string;
  status: 'Due' | 'Paid' | 'Overdue';
  items?: Array<{ description: string; amount: number; quantity?: number; unitPrice?: number }>;
  email?: string;
  phone?: string;
  billingAddress?: string;
  attachmentUrl?: string;
}

export interface Vendor {
  id: string;
  name: string;
  username?: string;
  specialty: string;
  rating: number;
  email?: string;
  phone?: string;
  passwordHash?: string;
  // Fundi Hub specific fields
  location?: string;
  dailyRate?: number;
  verified?: boolean;
  completedJobs?: number;
  avatarUrl?: string;
  summary?: string;
  certifications?: string[];
  eta?: string;
  available?: boolean;
  portfolioImages?: string[]; // Added portfolio images
}

export interface FundiJob {
    id: string;
    fundiId: string;
    fundiName: string;
    clientName: string;
    clientPhone: string;
    location: string;
    description: string;
    status: 'Pending' | 'Accepted' | 'Completed' | 'Declined';
    date: string;
    amount?: number;
    source: 'Website' | 'App';
}

export interface Message {
  id: string;
  recipient: { name: string; contact: string };
  content: string;
  channel: 'SMS' | 'Email' | 'WhatsApp' | 'App';
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
  timestamp: string;
  priority: 'Normal' | 'High';
  isIncoming?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'Success' | 'Warning' | 'Alert' | 'Info';
  recipientRole: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'SMS' | 'Email' | 'WhatsApp' | 'App';
  content: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
}

export interface CommunicationAutomationRule {
  id: string;
  name: string;
  trigger: string;
  templateName: string;
  channels: string[];
  enabled: boolean;
}

export interface EscalationRule {
  id: string;
  condition: string;
  action: string;
  assignedTo?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
}

export interface ExternalTransaction {
  id: string;
  date: string;
  reference: string;
  transactionCode?: string;
  amount: number;
  name: string;
  account: string;
  type: 'M-Pesa' | 'Bank';
  matched: boolean;
  matchedTenantId?: string;
}

export interface Overpayment {
  id: string;
  tenantName: string;
  unit: string;
  amount: number;
  reference: string;
  dateReceived: string;
  appliedMonth: string;
  status: 'Held' | 'Applied';
}

export interface SystemSettings {
  companyName: string;
  logo: string | null;
  profilePic: string | null;
  address?: string;
  phone?: string;
  shortcode?: string;
}

export interface PreventiveTask {
  id: string;
  title: string;
  asset: string;
  frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  nextDueDate: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  type: string;
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  targetApy: string;
  capitalRaised: number;
  targetCapital: number;
  investors: number;
  status: 'Active' | 'Closing Soon' | 'Project Completed' | 'Fully Funded';
  riskProfile: 'Low' | 'Medium' | 'High';
  projectedCompletion?: string;
  landlordType?: 'Internal' | 'External';
  landlordName?: string;
  landlordId?: string;
  landlordContact?: string;
  landlordPic?: string;
  propertyType?: 'Residential' | 'Commercial' | 'Mixed Use';
  clientInterestRate?: number;
  projectPic?: string;
  renovationStartDate?: string;
  renovationEndDate?: string;
  boq?: BoQItem[];
  documents?: Array<{ name: string; url: string; date: string }>;
  progressUpdates?: Array<{ id: string; date: string; caption: string; imageUrl: string }>;
}

export interface BoQItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Investment {
  id: string;
  fundId: string;
  fundName: string;
  amount: number;
  date: string;
  strategy: 'Monthly Payout' | 'Compound';
  status: 'Active' | 'Closed';
  accruedInterest: number;
  investorId?: string;
}

export interface WithdrawalRequest {
  id: string;
  investorName: string;
  amount: number;
  requestDate: string;
  type: 'Interest' | 'Capital' | 'Partial Capital';
  method: 'M-Pesa' | 'Bank';
  status: 'Pending Approval' | 'Paid' | 'Rejected';
  destinationAccount?: string;
  notes?: string;
}

export interface RenovationInvestor {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  idNumber: string;
  status: 'Active' | 'Pending' | 'Verified' | 'Rejected';
  joinDate: string;
  nextOfKin?: { name: string; phone: string; relationship: string };
  paymentDetails?: { bankName?: string; accountNumber?: string; mpesaNumber?: string };
  investorType?: 'Individual' | 'Chama' | 'Sacco' | 'Corporate';
  groupMembersCount?: number;
  residency?: string;
  kraPin?: string;
  authorizedRep?: { name: string; phone: string; role: string };
  referrerId?: string;
  referrerType?: string;
  passwordHash?: string;
}

export interface RFTransaction {
  id: string;
  date: string;
  type: 'Investment' | 'Loan Payback' | 'Management Fee' | 'Withdrawal' | 'Interest Payout' | 'Expense' | 'Invoice' | 'Referral Commission';
  category: 'Inbound' | 'Outbound';
  amount: number;
  partyName: string;
  reference: string;
  status: 'Completed' | 'Pending';
  description?: string;
}

export interface RenovationProjectBill {
  id: string;
  projectId: string;
  vendor: string;
  description: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
  category: 'Material' | 'Labor' | 'Permits' | 'Other';
  invoiceNumber?: string;
  attachmentUrl?: string;
}

export interface SearchResult {
  id: string;
  type: 'Tenant' | 'Property';
  title: string;
  subtitle: string;
  status?: string;
}

export interface PropertyAsset {
  name: string;
  type: 'doc' | 'image';
  category: 'Document' | 'Image';
  url: string;
}

export interface FloorPlan {
  floorNumber: number;
  compositionType: 'Uniform' | 'Mixed';
  unitType?: string;
  unitCount?: number;
  mixedComposition?: Record<string, number>;
}

export type UnitType = 'Single Room' | 'Double Room' | 'Bedsitter' | 'Studio' | 'One Bedroom' | 'Two Bedrooms' | 'Three Bedrooms' | 'Shop' | 'Office';

export interface RecurringBillSettings {
  serviceCharge: number;
  garbage: number;
  security: number;
  waterFixed: number;
  other: number;
}

export interface FineItem {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Paid';
}

export interface TenantRequest {
  id: string;
  type: 'General' | 'Maintenance' | 'Eviction' | 'Inquiry' | 'Complaint';
  title: string;
  description: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Converted to Task' | 'Under Review';
  priority: TaskPriority;
  messages?: RequestMessage[];
  images?: string[];
  taskId?: string;
}

export interface RequestMessage {
  id: string;
  sender: string;
  text: string;
  date: string;
}

export interface Notice {
  id: string;
  type: 'Warning' | 'Vacation' | 'Eviction';
  origin: 'System' | 'Client';
  dateIssued: string;
  effectiveDate: string;
  reason: string;
  status: 'Active' | 'Resolved';
}

export interface CollectionLog {
  id: string;
  date: string;
  type: 'Call' | 'Message' | 'Visit';
  feedback: string;
  outcome: 'Promise to Pay' | 'No Answer' | 'Refusal' | 'Left Message' | 'Paid';
  expectedCompletionDate?: string;
  loggedBy: string;
}

export type ExpenseCategory = 'Maintenance' | 'Transaction Costs' | 'Tax' | 'Legal' | 'Marketing' | 'Office Rent' | 'Other' | 'Salary' | 'Cleaning' | 'Vendor' | 'Internet' | 'Licences' | 'Deposit Refund' | 'Landlord Payout' | 'Security' | 'Water' | 'Electricity' | 'Garbage' | 'Gas' | 'Service Charge';
export type RevenueStreamCategory = 'Agency Management Commission' | 'Fines & Penalties' | 'Late Payment Fine' | 'Bills' | 'Maintenance Interest (15%)' | 'Tenancy Placement Fee';

export interface Payslip {
  id: string;
  staffId: string;
  month: string;
  basic: number;
  deductions: number;
  net: number;
}

export interface TaxRecord {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: 'Due' | 'Paid';
}

export interface LeaseTemplate {
  id: string;
  name: string;
  type: 'Residential' | 'Commercial';
  content: string;
}

export interface RoleAwareKpis {
  welcomeMessage: string;
  summaryCards: Array<{ text: string; value: string; icon: string }>;
}

export interface OccupancyMetric {
  // Mock interface to satisfy export if unused
  id?: string;
}

export interface StaffLeaderboardEntry {
  rank: number;
  name: string;
  metricName: string;
  metricValue: string;
}

export interface PropertyInsight {
  id: string;
  name: string;
  occupancy: number;
}

export interface ReitMetric {
  title: string;
  value: string;
  change: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
}

// --- MARKETPLACE & LISTING TYPES ---
export interface MarketplaceListing {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  type: 'Rent' | 'Sale' | 'AirBnB';
  status: 'Published' | 'Draft' | 'Sold' | 'Rented';
  price: number; // Rent per month, Sale price, or Nightly rate
  currency: string;
  description: string;
  title: string;
  location: string;
  images: string[];
  features: string[]; // "WiFi", "Pool", "Title Deed Ready"
  
  // Specific Configs
  airbnbConfig?: {
      cleaningFee: number;
      checkInTime: string;
      checkOutTime: string;
      maxGuests: number;
      houseRules: string;
      amenities: string[];
  };
  saleConfig?: {
      titleDeedType: string; // Freehold, Leasehold
      landSize: string;
      financingAvailable: boolean;
      propertyCategory?: 'House' | 'Apartment' | 'Land'; // New
      usageType?: 'Residential' | 'Commercial' | 'Mixed'; // New
  };
  
  ownerDetails: {
      name: string;
      contact: string;
      email: string;
      rating?: number; // 0-5
      reviews?: number; // Count of reviews
  };
  
  dateCreated: string;
}

export interface Listing {
  id: string;
  title: string;
  price: string | number;
  status: 'Available' | 'Rented' | 'Sold';
  type: 'For Rent' | 'For Sale';
  location: string;
  agent: { name: string };
  houseType?: string;
  image?: string;
  beds?: number;
  baths?: number;
  size?: string;
  purpose: 'Rent' | 'Sale';
}

export interface Lead {
  id: string;
  tenantName: string;
  status: 'New' | 'Contacted' | 'Viewing' | 'Negotiation' | 'Closed' | 'Lost';
  assignedAgent: string;
  listingTitle: string;
  contact?: string;
  email?: string;
  interest?: string;
  date?: string;
  source?: 'Website' | 'Walk-in' | 'Referral' | 'Social Media';
  notes?: string;
  referrerId?: string; // ID of the affiliate/user who referred this lead
}

export interface Affiliate {
  id: string;
  name: string;
  referralCode: string;
  stats: { leadsReferred: number; leasesSigned: number; totalEarned: number };
  referrals: Array<{ date: string; tenantName: string; status: 'Signed' | 'Pending'; commission: number }>;
}

export interface DeveloperProject {
  id: string;
  name: string;
  unitsSold: number;
  totalUnits: number;
}

export interface ReitReferralDashboardData {
  stats: { count: number; activeBalance: number; commission: number };
  referrals: Array<{ name: string; activeBalance: number; monthlyCommission: number }>;
}

export interface KycRecord {
  id: string;
  investorName: string;
  idNumber: string;
  phone: string;
  joinDate: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

export interface RolePermissions {
    [module: string]: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        view: boolean;
        approve: boolean;
        import: boolean;
        activate: boolean;
        deactivate: boolean;
        publish: boolean;
        pay: boolean;
        resolve: boolean;
        cancel: boolean;
    };
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissions;
  accessibleSubmodules: string[];
  widgetAccess?: string[];
}

export interface WidgetConfig {
  id: string;
  name: string;
  enabled: boolean;
}

export interface RateRule {
  id: string;
  name: string;
  value: number;
  unit: string;
}

export interface SystemConstant {
  id: string;
  category: string;
  value: string;
}

export interface CompanyStructureNode {
  name: string;
  type: string;
}

export interface LandlordStatement {
  id: string;
  period: string;
  gross: number;
  deductions: number;
  netPayout: number;
  status: 'Paid' | 'Pending';
}

export interface Distribution {
  id: string;
  date: string;
  amount: number;
  investorName: string;
  method: string;
  status: 'Paid' | 'Pending';
}

export interface InvestorProfile {
  id: string;
  name: string;
  totalInvested: number;
  balance: number;
  totalReturns: number;
  nextPayout: { amount: number; date: string };
  transactions: Array<{ id: string; date: string; type: string; amount: number; status: string; category: string; partyName: string; reference: string }>;
}

export interface OperationsKpi {
  title: string;
  value: number;
  unit: string;
}

export interface Lease {
  id: string;
  tenantName: string;
  property: string;
  unit: string;
  startDate: string;
  endDate: string;
  rent: number;
  status: LeaseStatus;
  history: any[];
}

export enum LeaseStatus {
  Active = 'Active',
  ExpiringSoon = 'Expiring Soon',
  Renewed = 'Renewed',
  Terminated = 'Terminated',
  Evicted = 'Evicted'
}

export interface ReportCardData {
  title: string;
  value: string;
  icon: string;
  link?: string;
  color: 'primary' | 'secondary' | 'red' | 'green' | 'blue' | 'gray';
  subtext?: string;
  chartData?: any;
  chartType?: 'bar' | 'line';
}

export interface PaymentKpi {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
}

export interface LedgerEntry {
  id: string;
  date: string;
  property: string;
  description: string;
  totalAmount: number;
  agencyAmount: number;
  landlordAmount: number;
  category: string;
  type: 'Income' | 'Expense';
}

export interface DataContextType {
    tenants: TenantProfile[];
    properties: Property[];
    landlords: User[];
    tasks: Task[];
    quotations: Quotation[];
    applications: TenantApplication[];
    landlordApplications: LandlordApplication[];
    staff: StaffProfile[];
    fines: FineRule[];
    offboardingRecords: OffboardingRecord[];
    geospatialData: GeospatialData;
    commissionRules: CommissionRule[];
    deductionRules: DeductionRule[];
    bills: Bill[];
    invoices: Invoice[];
    vendors: Vendor[];
    messages: Message[];
    notifications: Notification[];
    templates: CommunicationTemplate[];
    workflows: Workflow[];
    automationRules: CommunicationAutomationRule[];
    escalationRules: EscalationRule[];
    auditLogs: AuditLogEntry[];
    externalTransactions: ExternalTransaction[];
    overpayments: Overpayment[];
    systemSettings: SystemSettings;
    preventiveTasks: PreventiveTask[];
    incomeSources: IncomeSource[];
    funds: Fund[];
    investments: Investment[];
    withdrawals: WithdrawalRequest[];
    renovationInvestors: RenovationInvestor[];
    rfTransactions: RFTransaction[];
    renovationProjectBills: RenovationProjectBill[];
    roles: Role[];
    currentUser: User | StaffProfile | TenantProfile | null;
    scheduledReports: ScheduledReport[];
    taxRecords: TaxRecord[];
    marketplaceListings: MarketplaceListing[];
    leads: Lead[];
    fundiJobs: FundiJob[]; // Added fundiJobs
    users: User[]; // Unified list of all users
    updateUser: (id: string, data: Partial<User>) => void; // Unified update

    isSupabaseEnabled: boolean;
    isDataLoading: boolean;

    setCurrentUser: (user: User | StaffProfile | TenantProfile | null) => void;
    addTenant: (tenant: TenantProfile) => void;
    updateTenant: (id: string, data: Partial<TenantProfile>) => void;
    deleteTenant: (id: string) => void;
    addProperty: (p: Property) => void;
    updateProperty: (id: string, d: Partial<Property>) => void;
    deleteProperty: (id: string) => void;
    addUnitToProperty: (propId: string, unit: Unit) => void;
    addTask: (t: Task) => void;
    updateTask: (id: string, d: Partial<Task>) => void;
    addQuotation: (q: Quotation) => void;
    updateQuotation: (id: string, d: Partial<Quotation>) => void;
    addApplication: (a: TenantApplication) => void;
    updateApplication: (id: string, d: Partial<TenantApplication>) => void;
    deleteApplication: (id: string) => void;
    addLandlordApplication: (a: LandlordApplication) => void;
    updateLandlordApplication: (id: string, d: Partial<LandlordApplication>) => void;
    deleteLandlordApplication: (id: string) => void;
    addLandlord: (u: User) => void;
    updateLandlord: (id: string, d: Partial<User>) => void;
    deleteLandlord: (id: string) => void;
    addStaff: (s: StaffProfile) => void;
    updateStaff: (id: string, d: Partial<StaffProfile>) => void;
    deleteStaff: (id: string) => void;
    addFine: (f: FineRule) => void;
    updateFine: (id: string, d: Partial<FineRule>) => void;
    deleteFine: (id: string) => void;
    addOffboardingRecord: (r: OffboardingRecord) => void;
    updateOffboardingRecord: (id: string, d: Partial<OffboardingRecord>) => void;
    addGeospatialNode: (level: any, parentPath: any, name: any) => void;
    addCommissionRule: (r: CommissionRule) => void;
    updateCommissionRule: (id: string, d: Partial<CommissionRule>) => void;
    deleteCommissionRule: (id: string) => void;
    addDeductionRule: (r: DeductionRule) => void;
    updateDeductionRule: (id: string, d: Partial<DeductionRule>) => void;
    deleteDeductionRule: (id: string) => void;
    addBill: (b: Bill) => void;
    updateBill: (id: string, d: Partial<Bill>) => void;
    deleteBill: (id: string) => void;
    addTenantBill: (tid: string, b: BillItem) => void;
    addInvoice: (i: Invoice) => void;
    updateInvoice: (id: string, d: Partial<Invoice>) => void;
    addMessage: (m: Message) => void;
    addNotification: (n: Notification) => void;
    addVendor: (v: Vendor) => void;
    updateVendor: (id: string, d: Partial<Vendor>) => void;
    deleteVendor: (id: string) => void;
    addAuditLog: (log: AuditLogEntry) => void;
    updateExternalTransaction: (id: string, d: Partial<ExternalTransaction>) => void;
    updateOverpayment: (id: string, d: Partial<Overpayment>) => void;
    moveTenantPayment: (f: string, t: string, r: string) => void;
    addWorkflow: (w: Workflow) => void;
    updateWorkflow: (id: string, d: Partial<Workflow>) => void;
    addAutomationRule: (r: CommunicationAutomationRule) => void;
    updateAutomationRule: (id: string, d: Partial<CommunicationAutomationRule>) => void;
    addEscalationRule: (r: EscalationRule) => void;
    updateEscalationRule: (id: string, d: Partial<EscalationRule>) => void;
    updateSystemSettings: (settings: Partial<SystemSettings>) => void;
    addPreventiveTask: (t: PreventiveTask) => void;
    addTemplate: (t: CommunicationTemplate) => void;
    updateTemplate: (id: string, d: Partial<CommunicationTemplate>) => void;
    deleteTemplate: (id: string) => void;
    addIncomeSource: (s: IncomeSource) => void;
    updateIncomeSource: (id: string, d: Partial<IncomeSource>) => void;
    addFund: (f: Fund) => void;
    updateFund: (id: string, d: Partial<Fund>) => void;
    deleteFund: (id: string) => void;
    addInvestment: (inv: Investment) => void;
    updateInvestment: (id: string, d: Partial<Investment>) => void;
    addWithdrawal: (req: WithdrawalRequest) => void;
    updateWithdrawal: (id: string, d: Partial<WithdrawalRequest>) => void;
    addRenovationInvestor: (inv: RenovationInvestor) => void;
    updateRenovationInvestor: (id: string, d: Partial<RenovationInvestor>) => void;
    deleteRenovationInvestor: (id: string) => void;
    addRFTransaction: (tx: RFTransaction) => void;
    updateRFTransaction: (id: string, d: Partial<RFTransaction>) => void;
    addRenovationProjectBill: (bill: RenovationProjectBill) => void;
    updateRenovationProjectBill: (id: string, d: Partial<RenovationProjectBill>) => void;
    addRole: (r: Role) => void;
    updateRole: (id: string, d: Partial<Role>) => void;
    deleteRole: (id: string) => void;
    addScheduledReport: (r: ScheduledReport) => void;
    deleteScheduledReport: (id: string) => void;
    addTaxRecord: (record: TaxRecord) => void;
    updateTaxRecord: (id: string, d: Partial<TaxRecord>) => void;
    
    // Marketplace CRUD
    addMarketplaceListing: (listing: MarketplaceListing) => void;
    updateMarketplaceListing: (id: string, d: Partial<MarketplaceListing>) => void;
    deleteMarketplaceListing: (id: string) => void;
    markUnitOccupied: (propertyId: string, unitId: string) => void;

    // Leads CRUD
    addLead: (lead: Lead) => void;
    updateLead: (id: string, d: Partial<Lead>) => void;
    deleteLead: (id: string) => void;
    syncWebsiteLeads: () => Promise<void>;

    // Fundi Jobs CRUD
    addFundiJob: (job: FundiJob) => void;
    updateFundiJob: (id: string, d: Partial<FundiJob>) => void;
    syncFundiJobs: () => Promise<void>;

    // New Helper to check permissions
    checkPermission: (module: string, action: string) => boolean;

    getOccupancyRate: () => number;
    getTotalRevenue: () => number;
}