import { Timestamp } from 'firebase/firestore';
import { ReactNode, ReactElement } from 'react';

export enum UserRole {
  SuperAdmin = 'Super Admin',
  Admin = 'Admin',
  Sales = 'Sales Team',
  Operations = 'Operations Team',
  Finance = 'Finance Team',
  Employee = 'Employee',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  password?: string;
}

export interface NavItem {
  name: string;
  path?: string;
  icon: ReactElement<{ className?: string; size?: number }>;
  subItems?: NavItem[];
  roles?: UserRole[];
}

export type Theme = 'light' | 'dark';

// Client
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  location?: string;
  servicePackages?: string[];
  servicePackageId: string;
  assignedAdmin: string;
  assignedAdminId?: string;
  // propertyId: string;
  properties:string[]
  propertyCount: number;
  propertyLimit: number;
  subscriptionStatus: 'Active' | 'Pending' | 'Inactive' | 'Blocked' | 'Cancelled';
  joinedDate: Timestamp;
  updatedAt?: Timestamp;
  clientRef?: any;
}

// Property
export interface Property {
  id: string;
  name: string;
  address: string;
  clientId: string;
  type: 'Residential' | 'Commercial';
  status: 'Verified' | 'Pending' | 'Rejected';
  imageUrl?: string;
  images?: string[];
  geoPoint?: { lat: number; lng: number };
  verificationNotes?: string;
  submittedDate: any;
  verifiedBy?: string;
  verifiedById?: string;
  assignedEmployeeId?: string;
}

// Employee
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedto?: string; // Client ID or Property ID
  avatarUrl?: string;
  department?: string;
  employmentStatus?: 'Active' | 'Inactive' | 'On Leave';
  joinedOn?: string;
  phone?: string;
}

// Payment
export interface Payment {
  id: string;
  clientName: string;
  serviceName: string;
  amount: number;
  paymentDate?: any;
  status: 'Paid' | 'Pending' | 'Failed';
  transactionId: string;
  verifiedById?: string;
  verifiedByName?: string;
}

// Social Campaign
export interface SocialCauseCampaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  currentAmount: number;
  endDate: Timestamp;
  imageUrl?: string;
}

// Dashboard widget
export interface DashboardWidgetData {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  period?: string;
  actionLink?: string;
  actionText?: string;
}

export interface TableColumn<T> {
  key: keyof T | 'actions';
  header: string | ReactNode;
  render?: (item: T) => ReactNode;
  sortable?: boolean; 
}

// CRM Lead
export interface Lead {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  serviceInterest: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Converted' | 'Dropped';
  lastContacted: string;
  assignedTo: string;
  assignedToId?: string;
  notes?: string;
}

// Service Package
export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'annually' | 'one-time';
  features: string[];
  tier: 'Basic' | 'Standard' | 'Premium' | 'Enterprise';
  isActive: boolean;
  highlight?: string;
  imageUrl?: string;
}

// Service Inquiry
export interface ServiceInquiry {
  id: string;
  inquirerName: string;
  inquirerEmail: string;
  inquirerPhone?: string;
  serviceInterest: string;
  message: string;
  status: 'New' | 'Contacted' | 'Resolved' | 'ConvertedToLead' | 'Archived';
  receivedAt: string;
  handledById?: string;
  handledByName?: string;
  notes?: string;
}

// Callback Request
export interface CallbackRequest {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  reason: string;
  requestedTime?: string;
  serviceInterest?: string;
  status: 'New' | 'Contacted' | 'Unreached' | 'Dropped' | 'ConvertedtoLead';
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  scheduledFor?: string;
  notes?: string;
}

// Subscription
export interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  servicePackageId: string;
  servicePackageName: string;
  status: 'Active' | 'Inactive' | 'Cancelled' | 'Rejected';
  startDate: any; // Firestore Timestamp
  endDate?: any; // Firestore Timestamp, optional
  billingCycle: ServicePackage['billingCycle']
  priceAtSubscription: number;
  renewsOn: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  description: string;
  highlight: boolean;
  imageUrl: string;
  clientRef?: any;
}

// App Settings
export interface AppSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isEditable: boolean;
}

// Permissions
export interface RolePermission {
  role: UserRole;
  permissions: PermissionId[];
  description?: string;
}

export const ALL_PERMISSIONS = [
  { id: 'view_dashboard', label: 'View Dashboard' },
  { id: 'manage_users', label: 'Manage All Users' },
  { id: 'manage_roles_permissions', label: 'Manage Roles & Permissions' },
  { id: 'manage_clients', label: 'Manage Clients' },
  { id: 'assign_client_admin', label: 'Assign Client to Admin' },
  { id: 'manage_client_subscriptions', label: 'Manage Client Subscriptions' },
  { id: 'manage_properties', label: 'Manage Properties (View All)' },
  { id: 'verify_properties', label: 'Verify Properties' },
  { id: 'assign_property_employee', label: 'Assign Property to Employee' },
  { id: 'manage_service_packages', label: 'Manage Service Packages' },
  { id: 'manage_employees', label: 'Manage Employees (HR aspects)' },
  { id: 'manage_employee_availability', label: 'Manage Employee Availability' },
  { id: 'view_assignment_logs', label: 'View Assignment Logs' },
  { id: 'manage_payments', label: 'Manage Payments (Verify)' },
  { id: 'view_billing_reports', label: 'View Billing Reports' },
  { id: 'manage_leads', label: 'Manage CRM Leads' },
  { id: 'manage_callbacks', label: 'Manage Callback Requests' },
  { id: 'manage_inquiries', label: 'Manage Service Inquiries' },
  { id: 'manage_client_support_tickets', label: 'Manage Client Support Tickets' },
  { id: 'manage_social_campaigns', label: 'Manage Social Campaigns' },
  { id: 'view_donation_dashboard', label: 'View Donation Dashboard' },
  { id: 'manage_app_settings', label: 'Manage App Configurations' },
  { id: 'manage_tenants', label: 'Manage Tenants' },
  { id: 'manage_leases', label: 'Manage Leases' },
  { id: 'manage_rent_roll', label: 'Manage Rent Roll' },
  { id: 'view_audit_logs', label: 'View Audit Logs' },
] as const;

export type PermissionId = typeof ALL_PERMISSIONS[number]['id'];

// Employee Schedule
export interface EmployeeSchedule {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  availabilityStatus: 'Available' | 'Unavailable' | 'Partially Available';
  notes?: string;
  timeSlots?: { start: string; end: string; status: 'Available' | 'Booked' }[];
}

// Assignment Log
export interface AssignmentLog {
  id: string;
  timestamp: Timestamp;
  assignerId: string;
  assignerName: string;
  assigneeEmail?: string;
  assigneeId: string;
  assigneeName: string;
  targetType: 'Property' | 'Client Task' | 'General Task';
  targetId: string;
  targetDescription: string;
  action: 'Assigned' | 'Unassigned' | 'Task Status Updated' | 'Notes Added'|'Reassigned';
  notes?: string;
}

// Donations
export interface Donation {
  id: string;
  campaignId: string;
  campaignName: string;
  donorName: string;
  donorEmail?: string;
  userId?: string;
  amount: number;
  donationDate: string;
  transactionId?: string;
  status: 'Completed' | 'Pending' | 'Refunded' | 'Failed';
  isAnonymous: boolean;
  comment?: string;
}

// Billing Report
export interface BillingReportSummary {
  period: string;
  totalRevenue: number;
  totalVerifiedPayments: number;
  countVerifiedPayments: number;
  totalPendingPayments: number;
  countPendingPayments: number;
  newSubscriptionsThisPeriod: number;
  cancelledSubscriptionsThisPeriod: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

// Tenants
export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName?: string;
  clientId?: string;
  leaseId?: string;
  status: 'Active' | 'Inactive' | 'Notice Given' | 'Evicted' | 'Prospective';
  moveInDate: string;
  moveOutDate?: string;
  rentAmount: number;
  leaseEndDate?: string;
  lastPaymentDate?: string;
  securityDeposit?: number;
  outstandingBalance?: number;
  avatarUrl?: string;
}

// Lease
export interface Lease {
  id: string;
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  leaseDocumentUrl?: string;
  status: 'Active' | 'Expired' | 'Terminated' | 'Upcoming' | 'Draft';
  renewalDate?: string;
  notes?: string;
}

// Rent Payments
export interface RentPaymentRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  leaseId: string;
  paymentDate: string;
  amountPaid: number;
  expectedAmount: number;
  paymentMethod: 'Card' | 'Bank Transfer' | 'Cash' | 'Check' | 'Online Portal' | 'Other';
  status: 'Paid' | 'Partially Paid' | 'Overdue' | 'Pending Confirmation' | 'Failed';
  transactionReference?: string;
  notes?: string;
}

// Client Tickets
export enum ClientTicketCategory {
  Billing = 'Billing Inquiry',
  Technical = 'Technical Issue',
  Service = 'Service Question',
  Property = 'Property Issue',
  FeatureRequest = 'Feature Request',
  Other = 'Other',
}

export enum ClientTicketPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export enum ClientTicketStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  PendingClient = 'Pending Client Response',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export interface ClientTicket {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  category: ClientTicketCategory;
  priority: ClientTicketPriority;
  status: ClientTicketStatus;
  createdAt: string;
  updatedAt: string;
  assignedToId?: string;
  assignedToName?: string;
  resolutionNotes?: string;
  updatedById?: string;
  updatedByName?: string;
}

// Audit Logs
export interface AuditLogEntry {
  id: string;
  timestamp: Timestamp;
  actorUserId: string;
  actorUserName: string;
  actorUserRole: UserRole;
  actorEmail: string;
  actionType: string;
  actionDescription: string;
  targetEntityType?: string;
  targetEntityId?: string;
  targetEntityDescription?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}
export interface AuditLogFilter {
  startDate?: string;
  endDate?: string;
  userId?: string;
  userRole?: UserRole;
  actionType?: string;
  targetEntityType?: string;
}