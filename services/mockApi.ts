

import React from 'react';
import { Users, Home, FileCheck, IndianRupee, UserCheck, BriefcaseBusiness, Target, FileClock, MailWarning, PhoneCall, Gift, Contact, LifeBuoy } from 'lucide-react'; // Cleaned up unused imports
import { Client, Property, Payment, SocialCauseCampaign, DashboardWidgetData, User, UserRole, Lead, ServicePackage, ServiceInquiry, CallbackRequest, Subscription, AppSetting, RolePermission, PermissionId, ALL_PERMISSIONS, EmployeeSchedule, AssignmentLog, Donation, BillingReportSummary, RevenueDataPoint, Tenant, Lease, RentPaymentRecord, ClientTicket, ClientTicketCategory, ClientTicketPriority, ClientTicketStatus, AuditLogEntry } from '../types';

const MOCK_DELAY = 300; // ms

// --- Actor Helper (for mock API calls) ---
// In a real app, actor info would come from the authenticated session.
const getMockActor = (specificActor?: { id: string; name: string; role: UserRole }): { id: string; name: string; role: UserRole } => {
  if (specificActor) return specificActor;
  const adminUser = mockUsers.find(u => u.role === UserRole.Admin || u.role === UserRole.SuperAdmin);
  return adminUser ? { id: adminUser.id, name: adminUser.name, role: adminUser.role } : { id: 'system', name: 'System', role: UserRole.SuperAdmin };
};


// --- Mock Data ---
let mockUsers: User[] = [
  { id: 'user_super', email: 'super@example.com', password: 'password', name: 'Super Admin User', role: UserRole.SuperAdmin, avatarUrl: 'https://picsum.photos/seed/superadmin/100/100' },
  { id: 'user_admin_1', email: 'admin@example.com', password: 'password', name: 'Admin User One', role: UserRole.Admin, avatarUrl: 'https://picsum.photos/seed/admin1/100/100' },
  { id: 'user_admin_2', email: 'admin2@example.com', password: 'password', name: 'Admin User Two', role: UserRole.Admin, avatarUrl: 'https://picsum.photos/seed/admin2/100/100' },
  { id: 'user_sales', email: 'sales@example.com', password: 'password', name: 'Sales Rep', role: UserRole.Sales, avatarUrl: 'https://picsum.photos/seed/sales/100/100' },
  { id: 'user_ops', email: 'ops@example.com', password: 'password', name: 'Operations Lead', role: UserRole.Operations, avatarUrl: 'https://picsum.photos/seed/ops/100/100' },
  { id: 'user_finance', email: 'finance@example.com', password: 'password', name: 'Finance Officer', role: UserRole.Finance, avatarUrl: 'https://picsum.photos/seed/finance/100/100' },
  { id: 'user_sales_2', email: 'sales2@example.com', password: 'password', name: 'Senior Sales Exec', role: UserRole.Sales, avatarUrl: 'https://picsum.photos/seed/sales2/100/100' },
  { id: 'user_ops_2', email: 'ops2@example.com', password: 'password', name: 'Field Operator', role: UserRole.Operations, avatarUrl: 'https://picsum.photos/seed/ops2/100/100' },
];

let mockClients: Client[] = [
  { id: 'cli_1', name: 'Alice Wonderland', email: 'alice@example.com', phone: '555-0101', service: 'Premium Suite', assignedAdmin: 'Admin User One', assignedAdminId: 'user_admin_1', propertyCount: 3, subscriptionStatus: 'Active', joinDate: '2023-01-15' },
  { id: 'cli_2', name: 'Bob The Builder', email: 'bob@example.com', phone: '555-0102', service: 'Basic Coverage', assignedAdmin: 'Admin User One', assignedAdminId: 'user_admin_1', propertyCount: 1, subscriptionStatus: 'Pending', joinDate: '2023-03-22' },
  { id: 'cli_3', name: 'Charlie Brown', email: 'charlie@example.com', phone: '555-0103', service: 'Premium Suite', assignedAdmin: 'Admin User Two', assignedAdminId: 'user_admin_2', propertyCount: 5, subscriptionStatus: 'Active', joinDate: '2022-11-05' },
  { id: 'cli_4', name: 'Diana Prince', email: 'diana@example.com', phone: '555-0104', service: 'Standard Plan', assignedAdmin: 'Admin User One', assignedAdminId: 'user_admin_1', propertyCount: 2, subscriptionStatus: 'Inactive', joinDate: '2023-05-10' },
  { id: 'cli_5', name: 'Edward Scissorhands', email: 'edward@example.com', phone: '555-0105', service: 'Premium Suite', assignedAdmin: 'Admin User Two', assignedAdminId: 'user_admin_2', propertyCount: 0, subscriptionStatus: 'Blocked', joinDate: '2023-06-01' },
];

let mockProperties: Property[] = [
  { id: 'prop_1', address: '123 Main St, Anytown', type: 'Residential', status: 'Verified', submittedDate: '2023-02-10', imageUrl: 'https://picsum.photos/seed/prop1/400/300', images: ['https://picsum.photos/seed/prop1a/400/300', 'https://picsum.photos/seed/prop1b/400/300'], verificationNotes: 'All documents clear. Verified by Ops.', verifiedById: 'user_ops', verifiedBy: 'Operations Lead', geoTag: { lat: 34.0522, lng: -118.2437 }, assignedEmployeeId: 'user_ops_2' },
  { id: 'prop_2', address: '456 Oak Ave, Anytown', type: 'Commercial', status: 'Pending', submittedDate: '2024-04-01', imageUrl: 'https://picsum.photos/seed/prop2/400/300' },
  { id: 'prop_3', address: '789 Pine Ln, Anytown', type: 'Residential', status: 'Pending', submittedDate: '2024-05-05', imageUrl: 'https://picsum.photos/seed/prop3/400/300', images: ['https://picsum.photos/seed/prop3a/400/300']},
  { id: 'prop_4', address: '101 Maple Dr, Anytown', type: 'Commercial', status: 'Rejected', submittedDate: '2024-03-15', imageUrl: 'https://picsum.photos/seed/prop4/400/300', verificationNotes: 'Incomplete documentation provided.', verifiedById: 'user_ops', verifiedBy: 'Operations Lead' },
  { id: 'prop_5', address: '22 Sky High, Anytown', type: 'Residential', status: 'Verified', submittedDate: '2023-11-20', imageUrl: 'https://picsum.photos/seed/prop5/400/300', verificationNotes: 'Quick verification.', verifiedById: 'user_ops', verifiedBy: 'Operations Lead', geoTag: { lat: 34.0500, lng: -118.2400 } },
  { id: 'prop_6', address: '55 Business Blvd, Metrocity', type: 'Commercial', status: 'Verified', submittedDate: '2023-09-01', imageUrl: 'https://picsum.photos/seed/prop6/400/300', verificationNotes: 'Verified by Super Admin.', verifiedById: 'user_super', verifiedBy: 'Super Admin User', geoTag: { lat: 34.0510, lng: -118.2420 }, assignedEmployeeId: 'user_ops' },
];

let mockPayments: Payment[] = [
  { id: 'pay_1', clientName: 'Alice Wonderland', serviceName: 'Premium Suite Q1', amount: 299.99, date: '2024-01-05', status: 'Verified', transactionId: 'txn_abc123xyz', verifiedById: 'user_finance', verifiedByName: 'Finance Officer' },
  { id: 'pay_2', clientName: 'Bob The Builder', serviceName: 'Basic Coverage Feb', amount: 99.00, date: '2024-02-01', status: 'Pending', transactionId: 'txn_def456uvw' },
  { id: 'pay_3', clientName: 'Charlie Brown', serviceName: 'Premium Suite Q1', amount: 299.99, date: '2024-01-08', status: 'Verified', transactionId: 'txn_ghi789rst', verifiedById: 'user_finance', verifiedByName: 'Finance Officer' },
  { id: 'pay_4', clientName: 'Alice Wonderland', serviceName: 'Premium Suite Q2', amount: 299.99, date: '2024-04-05', status: 'Pending', transactionId: 'txn_jkl012pqr' },
  { id: 'pay_5', clientName: 'Diana Prince', serviceName: 'Standard Plan May', amount: 149.50, date: '2024-05-01', status: 'Failed', transactionId: 'txn_mno345stu', verifiedById: 'user_finance', verifiedByName: 'Finance Officer' },
  { id: 'pay_6', clientName: 'Alice Wonderland', serviceName: 'Premium Suite Mar', amount: 299.99, date: '2024-03-05', status: 'Verified', transactionId: 'txn_qwe456rty', verifiedById: 'user_finance', verifiedByName: 'Finance Officer' },
  { id: 'pay_7', clientName: 'Bob The Builder', serviceName: 'Basic Coverage Mar', amount: 99.00, date: '2024-03-01', status: 'Verified', transactionId: 'txn_uio789pas', verifiedById: 'user_finance', verifiedByName: 'Finance Officer' },
];

let mockSocialCampaigns: SocialCauseCampaign[] = [
  { id: 'sc_1', name: 'Shelter for All', description: 'Help build shelters for the homeless in our community. Every bit counts towards a safe space.', goal: 50000, currentAmount: 35750, endDate: '2024-08-31', imageUrl: 'https://picsum.photos/seed/social1/600/400' },
  { id: 'sc_2', name: 'Clean Water Initiative', description: 'Support providing clean and accessible drinking water to underserved regions. Health starts with water.', goal: 75000, currentAmount: 75000, endDate: '2024-06-30', imageUrl: 'https://picsum.photos/seed/social2/600/400' },
  { id: 'sc_3', name: 'Youth Education Fund', description: 'Empower the next generation by funding educational programs and scholarships for underprivileged youth.', goal: 100000, currentAmount: 15200, endDate: '2024-12-31', imageUrl: 'https://picsum.photos/seed/social3/600/400' },
];

let mockLeads: Lead[] = [
    { id: 'lead_1', clientName: 'New Horizons Inc.', contactEmail: 'contact@newhorizons.com', contactPhone: '555-0201', serviceOfInterest: 'Enterprise Solution', status: 'New', lastContacted: '2024-05-01', assignedTo: 'Sales Rep', assignedToId: 'user_sales' },
    { id: 'lead_2', clientName: 'GreenTech Solutions', contactEmail: 'info@greentech.com', contactPhone: '555-0202', serviceOfInterest: 'Premium Suite', status: 'Qualified', lastContacted: '2024-05-10', assignedTo: 'Sales Rep', assignedToId: 'user_sales', notes: 'Follow up scheduled for next week. Strong interest.' },
    { id: 'lead_3', clientName: 'Local Bakery Co.', contactEmail: 'orders@localbakery.com', contactPhone: '555-0203', serviceOfInterest: 'Basic Coverage', status: 'Contacted', lastContacted: '2024-05-15', assignedTo: 'Sales Rep', assignedToId: 'user_sales' },
    { id: 'lead_4', clientName: 'Innovate LLC', contactEmail: 'innovate@llc.com', contactPhone: '555-0204', serviceOfInterest: 'Standard Plan', status: 'Converted', lastContacted: '2024-04-20', assignedTo: 'Senior Sales Exec', assignedToId: 'user_sales_2'},
    { id: 'lead_5', clientName: 'Old Town Supplies', contactEmail: 'supplies@oldtown.com', contactPhone: '555-0205', serviceOfInterest: 'Basic Coverage', status: 'Dropped', lastContacted: '2024-03-10', assignedTo: 'Sales Rep', assignedToId: 'user_sales', notes: 'Budget constraints.'},
];

let mockServicePackages: ServicePackage[] = [
    { id: 'sp_1', name: 'Basic Coverage', description: 'Essential property monitoring and alerts.', price: 99, billingCycle: 'monthly', features: ['24/7 Monitoring', 'Basic Alerts', 'Email Support'], tier: 'Basic', isActive: true, imageUrl: 'https://picsum.photos/seed/sp_basic/300/200' },
    { id: 'sp_2', name: 'Standard Plan', description: 'Comprehensive coverage with additional support.', price: 199, billingCycle: 'monthly', features: ['All Basic Features', 'Priority Alerts', 'Phone Support', 'Monthly Reports'], tier: 'Standard', isActive: true, imageUrl: 'https://picsum.photos/seed/sp_standard/300/200' },
    { id: 'sp_3', name: 'Premium Suite', description: 'Full-service package for maximum peace of mind. Includes dedicated support and advanced analytics.', price: 299, billingCycle: 'monthly', features: ['All Standard Features', 'Dedicated Account Manager', 'Customizable Reports', 'API Access', 'On-site Consultation (1/yr)'], tier: 'Premium', isActive: true, highlight: "Most Popular!", imageUrl: 'https://picsum.photos/seed/sp_premium/300/200' },
    { id: 'sp_4', name: 'Enterprise Solution', description: 'Tailored solutions for large portfolios and specific needs. Contact us for custom pricing.', price: 999, billingCycle: 'annually', features: ['All Premium Features', 'On-site Support Options', 'Bulk Management Tools', 'SLA', 'Custom Integrations'], tier: 'Enterprise', isActive: true, highlight: "For Large Businesses", imageUrl: 'https://picsum.photos/seed/sp_enterprise/300/200' },
    { id: 'sp_5', name: 'Weekend Warrior Security', description: 'Affordable weekend monitoring for small businesses.', price: 49, billingCycle: 'monthly', features: ['Weekend Monitoring', 'Basic Alerts'], tier: 'Basic', isActive: false, imageUrl: 'https://picsum.photos/seed/sp_weekend/300/200' },
];

let mockServiceInquiries: ServiceInquiry[] = [
    { id: 'si_1', inquirerName: 'John Doe', inquirerEmail: 'john.d@example.com', serviceInterest: 'Premium Suite', message: 'Interested in learning more about the premium suite for 5 properties.', status: 'New', receivedAt: '2024-07-20T10:00:00Z' },
    { id: 'si_2', inquirerName: 'Jane Smith', inquirerEmail: 'jane.s@example.net', inquirerPhone: '555-1234', serviceInterest: 'General Information', message: 'What are your general service costs?', status: 'Contacted', receivedAt: '2024-07-19T14:30:00Z', handledById: 'user_sales', handledByName: 'Sales Rep', notes: 'Responded with price sheet.'},
    { id: 'si_3', inquirerName: 'Future Corp', inquirerEmail: 'contact@futurecorp.dev', serviceInterest: 'API Access', message: 'Need details about API capabilities for integration.', status: 'Resolved', receivedAt: '2024-07-18T09:00:00Z', handledById: 'user_admin_1', handledByName: 'Admin User One', notes: 'Provided API documentation. Client satisfied.'},
];

let mockCallbackRequests: CallbackRequest[] = [
    {id: 'cr_1', clientName: 'GreenTech Solutions', contactPhone: '555-0202', reason: 'Follow-up on Premium Suite', requestedTime: 'ASAP', status: 'Pending', createdAt: '2024-07-20T10:00:00Z', assignedToId: 'user_sales', assignedToName: 'Sales Rep'},
    {id: 'cr_2', clientName: 'Alice Wonderland', contactPhone: '555-0101', reason: 'Question about billing', requestedTime: 'Tomorrow PM', status: 'Scheduled', createdAt: '2024-07-19T15:00:00Z', scheduledFor: '2024-07-21T14:00:00Z', assignedToId: 'user_admin_1', assignedToName: 'Admin User One', notes: 'Scheduled call with Alice for billing query.'},
];

let mockSubscriptions: Subscription[] = [
    { id: 'sub_1', clientId: 'cli_1', clientName: 'Alice Wonderland', servicePackageId: 'sp_3', servicePackageName: 'Premium Suite', status: 'Active', startDate: '2023-01-15', renewsOn: '2025-01-15', priceAtSubscription: 299, billingCycle: 'monthly' },
    { id: 'sub_2', clientId: 'cli_2', clientName: 'Bob The Builder', servicePackageId: 'sp_1', servicePackageName: 'Basic Coverage', status: 'Pending Activation', startDate: '2023-03-22', priceAtSubscription: 99, billingCycle: 'monthly' },
    { id: 'sub_3', clientId: 'cli_3', clientName: 'Charlie Brown', servicePackageId: 'sp_3', servicePackageName: 'Premium Suite', status: 'Active', startDate: '2022-11-05', renewsOn: '2024-11-05', priceAtSubscription: 299, billingCycle: 'monthly' },
    { id: 'sub_4', clientId: 'cli_4', clientName: 'Diana Prince', servicePackageId: 'sp_2', servicePackageName: 'Standard Plan', status: 'Cancelled', startDate: '2023-05-10', endDate: '2024-05-09', priceAtSubscription: 149, billingCycle: 'monthly' },
];

let mockAppSettings: AppSetting[] = [
    {id: 'setting_1', key: 'siteName', value: 'RealEstate Platform Admin', description: 'The public display name of the application.', type: 'string', isEditable: true},
    {id: 'setting_2', key: 'defaultCurrency', value: 'USD', description: 'Default currency for financial transactions.', type: 'string', isEditable: false},
    {id: 'setting_3', key: 'maintenanceMode', value: false, description: 'Enable maintenance mode for the application.', type: 'boolean', isEditable: true},
    {id: 'setting_4', key: 'maxUploadSizeMB', value: 10, description: 'Maximum file upload size in Megabytes.', type: 'number', isEditable: true},
    {id: 'setting_5', key: 'sessionTimeoutMinutes', value: 30, description: 'User session timeout in minutes.', type: 'number', isEditable: true},
];

let mockRolePermissions: RolePermission[] = [
    { role: UserRole.SuperAdmin, permissions: ALL_PERMISSIONS.map(p => p.id), description: "Full access to all system features and settings." },
    { role: UserRole.Admin, permissions: ['view_dashboard', 'manage_users', 'manage_clients', 'assign_client_admin', 'manage_client_subscriptions', 'manage_properties', 'verify_properties', 'assign_property_employee', 'manage_service_packages', 'manage_payments','view_billing_reports', 'manage_social_campaigns', 'manage_app_settings', 'manage_leads', 'manage_callbacks', 'manage_inquiries', 'manage_client_support_tickets', 'view_donation_dashboard', 'manage_tenants', 'manage_leases', 'manage_rent_roll'], description: "Broad administrative access, excluding super-admin functions." },
    { role: UserRole.Sales, permissions: ['view_dashboard', 'manage_clients', 'manage_client_subscriptions', 'manage_leads', 'manage_callbacks', 'manage_inquiries', 'manage_client_support_tickets'], description: "Access to CRM and client management tools." },
    { role: UserRole.Operations, permissions: ['view_dashboard', 'manage_properties', 'verify_properties', 'assign_property_employee', 'manage_employee_availability', 'view_assignment_logs', 'manage_tenants', 'manage_leases', 'manage_rent_roll'], description: "Access to property and operations management." },
    { role: UserRole.Finance, permissions: ['view_dashboard', 'manage_payments', 'view_billing_reports', 'manage_rent_roll'], description: "Access to financial records, payment verification, and rent roll." },
];

let mockEmployeeSchedules: EmployeeSchedule[] = [
    {id: 'sched_1', employeeId: 'user_ops', employeeName: 'Operations Lead', date: new Date().toISOString().split('T')[0], availabilityStatus: 'Available', notes: 'Full day availability.'},
    {id: 'sched_2', employeeId: 'user_ops_2', employeeName: 'Field Operator', date: new Date().toISOString().split('T')[0], availabilityStatus: 'Partially Available', notes: 'Morning site visit, available PM.'},
    {id: 'sched_3', employeeId: 'user_ops', employeeName: 'Operations Lead', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], availabilityStatus: 'Unavailable', notes: 'Day Off'},
];

let mockAssignmentLogs: AssignmentLog[] = [
    { id: 'log_1', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), assignerId: 'user_admin_1', assignerName: 'Admin User One', assigneeId: 'user_ops', assigneeName: 'Operations Lead', targetType: 'Property', targetId: 'prop_1', targetDescription: '123 Main St, Anytown', action: 'Assigned', notes: 'Initial assignment for verification support.' },
    { id: 'log_2', timestamp: new Date(Date.now() - 86400000).toISOString(), assignerId: 'user_admin_1', assignerName: 'Admin User One', assigneeId: 'user_ops_2', assigneeName: 'Field Operator', targetType: 'Property', targetId: 'prop_6', targetDescription: '55 Business Blvd, Metrocity', action: 'Assigned', notes: 'Routine check assigned.' },
    { id: 'log_3', timestamp: new Date().toISOString(), assignerId: 'user_super', assignerName: 'Super Admin User', assigneeId: 'user_sales', assigneeName: 'Sales Rep', targetType: 'Client Task', targetId: 'cli_2', targetDescription: 'Bob The Builder - Follow up on pending subscription', action: 'Assigned', notes: 'Client requested follow-up.'},
];

let mockDonations: Donation[] = [
    { id: 'don_1', campaignId: 'sc_1', campaignName: 'Shelter for All', donorName: 'Anonymous Donor', amount: 100, donationDate: '2024-07-15T10:00:00Z', status: 'Completed', isAnonymous: true },
    { id: 'don_2', campaignId: 'sc_1', campaignName: 'Shelter for All', donorName: 'Jane Smith', donorEmail: 'jane.s@example.net', userId: 'user_sales', amount: 250, donationDate: '2024-07-18T14:30:00Z', status: 'Completed', isAnonymous: false, transactionId: 'txn_don_abc', comment: "Great cause!" },
    { id: 'don_3', campaignId: 'sc_2', campaignName: 'Clean Water Initiative', donorName: 'Hydro Corp', amount: 5000, donationDate: '2024-06-01T09:00:00Z', status: 'Completed', isAnonymous: false, transactionId: 'txn_don_def' },
    { id: 'don_4', campaignId: 'sc_3', campaignName: 'Youth Education Fund', donorName: 'Richard Miles', amount: 50, donationDate: '2024-07-20T11:00:00Z', status: 'Pending', isAnonymous: false },
];

let mockTenants: Tenant[] = [
    { id: 'ten_1', name: 'John Renter', email: 'john.renter@example.com', phone: '555-1111', propertyId: 'prop_1', propertyName: '123 Main St, Anytown', leaseId: 'lease_1', status: 'Active', moveInDate: '2023-06-01', rentAmount: 1200, securityDeposit: 1200, avatarUrl: 'https://picsum.photos/seed/johnrenter/100/100' },
    { id: 'ten_2', name: 'Jane Tenant', email: 'jane.tenant@example.com', phone: '555-2222', propertyId: 'prop_5', propertyName: '22 Sky High, Anytown', leaseId: 'lease_2', status: 'Active', moveInDate: '2024-01-15', rentAmount: 1500, securityDeposit: 1500, avatarUrl: 'https://picsum.photos/seed/janetenant/100/100' },
    { id: 'ten_3', name: 'Mike Prospect', email: 'mike.prospect@example.com', phone: '555-3333', propertyId: 'prop_3', propertyName: '789 Pine Ln, Anytown', status: 'Prospective', moveInDate: '2024-08-01', rentAmount: 1350 },
];

let mockLeases: Lease[] = [
    { id: 'lease_1', tenantId: 'ten_1', propertyId: 'prop_1', startDate: '2023-06-01', endDate: '2024-05-31', rentAmount: 1200, depositAmount: 1200, status: 'Active', leaseDocumentUrl: '/mock-lease-doc.pdf' },
    { id: 'lease_2', tenantId: 'ten_2', propertyId: 'prop_5', startDate: '2024-01-15', endDate: '2025-01-14', rentAmount: 1500, depositAmount: 1500, status: 'Active' },
];

let mockRentPaymentRecords: RentPaymentRecord[] = [
    { id: 'rp_1', tenantId: 'ten_1', propertyId: 'prop_1', leaseId: 'lease_1', paymentDate: '2024-05-01', amountPaid: 1200, expectedAmount: 1200, paymentMethod: 'Online Portal', status: 'Paid', transactionReference: 'rp_ref_001' },
    { id: 'rp_2', tenantId: 'ten_2', propertyId: 'prop_5', leaseId: 'lease_2', paymentDate: '2024-05-01', amountPaid: 1500, expectedAmount: 1500, paymentMethod: 'Bank Transfer', status: 'Paid', transactionReference: 'rp_ref_002' },
    { id: 'rp_3', tenantId: 'ten_1', propertyId: 'prop_1', leaseId: 'lease_1', paymentDate: '2024-06-01', amountPaid: 1200, expectedAmount: 1200, paymentMethod: 'Online Portal', status: 'Paid', transactionReference: 'rp_ref_003' },
    { id: 'rp_4', tenantId: 'ten_2', propertyId: 'prop_5', leaseId: 'lease_2', paymentDate: '2024-06-05', amountPaid: 1000, expectedAmount: 1500, paymentMethod: 'Bank Transfer', status: 'Partially Paid', transactionReference: 'rp_ref_004', notes: 'Will pay balance next week.' },
];

let mockClientTickets: ClientTicket[] = [
    { id: 'tkt_1', clientId: 'cli_1', clientName: 'Alice Wonderland', title: 'Billing discrepancy for Q2', description: 'My invoice for Q2 seems higher than expected. Can you please check?', category: ClientTicketCategory.Billing, priority: ClientTicketPriority.Medium, status: ClientTicketStatus.Open, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), assignedToId: 'user_sales' , assignedToName: 'Sales Rep', updatedById: 'user_sales', updatedByName: 'Sales Rep'},
    { id: 'tkt_2', clientId: 'cli_3', clientName: 'Charlie Brown', title: 'Cannot access property camera feed', description: 'The live camera feed for property 789 Pine Ln is not working.', category: ClientTicketCategory.Technical, priority: ClientTicketPriority.High, status: ClientTicketStatus.InProgress, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), assignedToId: 'user_admin_1', assignedToName: 'Admin User One', updatedById: 'user_admin_1', updatedByName: 'Admin User One' },
    { id: 'tkt_3', clientId: 'cli_2', clientName: 'Bob The Builder', title: 'Question about service upgrade', description: 'I want to know more about upgrading from Basic to Standard plan.', category: ClientTicketCategory.Service, priority: ClientTicketPriority.Low, status: ClientTicketStatus.Resolved, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(), assignedToId: 'user_sales_2', assignedToName: 'Senior Sales Exec', resolutionNotes: 'Provided upgrade details and pricing. Client considering.', updatedById: 'user_sales_2', updatedByName: 'Senior Sales Exec'},
];

let mockPlatformAuditLogs: AuditLogEntry[] = [];

// --- Platform User Audit Log API ---
export const logPlatformUserAction = async (
  entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newLogEntry: AuditLogEntry = {
        ...entryData,
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      mockPlatformAuditLogs.unshift(newLogEntry); // Add to the beginning for chronological order
      resolve();
    }, MOCK_DELAY / 2); // Faster logging
  });
};

export const fetchPlatformAuditLogs = (
  filters?: { actorUserId?: string; dateFrom?: string; dateTo?: string; actionType?: string; targetEntityType?: string; searchTerm?: string }
): Promise<AuditLogEntry[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...mockPlatformAuditLogs];
      if (filters?.actorUserId) {
        results = results.filter(log => log.actorUserId === filters.actorUserId);
      }
      if (filters?.dateFrom) {
        results = results.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom!));
      }
      if (filters?.dateTo) {
        const toDateObj = new Date(filters.dateTo!);
        toDateObj.setHours(23, 59, 59, 999); // Include whole day
        results = results.filter(log => new Date(log.timestamp) <= toDateObj);
      }
      if (filters?.actionType) {
        results = results.filter(log => log.actionType === filters.actionType);
      }
      if (filters?.targetEntityType) {
        results = results.filter(log => log.targetEntityType === filters.targetEntityType);
      }
      if (filters?.searchTerm) {
        const lowerSearch = filters.searchTerm.toLowerCase();
        results = results.filter(log =>
          log.actionDescription.toLowerCase().includes(lowerSearch) ||
          (log.targetEntityId && log.targetEntityId.toLowerCase().includes(lowerSearch)) ||
          (log.targetEntityDescription && log.targetEntityDescription.toLowerCase().includes(lowerSearch)) ||
          (log.details && JSON.stringify(log.details).toLowerCase().includes(lowerSearch))
        );
      }
      resolve(results); // Already sorted by unshift, or sort explicitly if needed
    }, MOCK_DELAY);
  });
};


// --- Auth API Functions ---
export const loginUser = async (email: string, password_unused: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(async () => { // make inner function async
      const user = mockUsers.find(u => u.email === email); 
      if (user) {
        await logPlatformUserAction({
          actorUserId: user.id,
          actorUserName: user.name,
          actorUserRole: user.role,
          actionType: 'USER_LOGIN_SUCCESS',
          actionDescription: `User ${user.name} (${user.email}) logged in successfully.`,
          targetEntityType: 'User',
          targetEntityId: user.id,
          targetEntityDescription: user.email,
        });
        resolve({ ...user }); 
      } else {
         await logPlatformUserAction({ // Log failed login attempt
          actorUserId: 'unknown', // Or try to get from request if possible
          actorUserName: 'Unknown',
          actorUserRole: UserRole.Admin, // Placeholder
          actionType: 'USER_LOGIN_FAILURE',
          actionDescription: `Failed login attempt for email: ${email}.`,
          targetEntityType: 'System',
          details: { emailAttempted: email }
        });
        resolve(null);
      }
    }, MOCK_DELAY + 200);
  });
};

export const fetchUserById = (userId: string): Promise<User | null> => {
   return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.id === userId);
      resolve(user ? { ...user } : null);
    }, MOCK_DELAY);
  });
}

// --- User Management API Functions ---
export const fetchUsers = (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockUsers]), MOCK_DELAY);
  });
};

export const fetchAdmins = (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUsers.filter(u => u.role === UserRole.Admin || u.role === UserRole.SuperAdmin));
    }, MOCK_DELAY);
  });
};

export const fetchEmployeesByRole = (roles: UserRole[]): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUsers.filter(u => roles.includes(u.role)));
    }, MOCK_DELAY);
  });
};


export const addUser = (userData: Omit<User, 'id' | 'avatarUrl'>, actor?: { id: string; name: string; role: UserRole }): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const performingActor = getMockActor(actor);
      const newUser: User = {
        ...userData,
        id: `user_${Date.now()}`,
        avatarUrl: `https://picsum.photos/seed/${userData.name.split(' ')[0]}/100/100`,
      };
      mockUsers.push(newUser);
      await logPlatformUserAction({
        actorUserId: performingActor.id,
        actorUserName: performingActor.name,
        actorUserRole: performingActor.role,
        actionType: 'USER_CREATED',
        actionDescription: `User ${newUser.name} (${newUser.email}) created by ${performingActor.name}.`,
        targetEntityType: 'User',
        targetEntityId: newUser.id,
        targetEntityDescription: newUser.email,
        details: { name: newUser.name, email: newUser.email, role: newUser.role }
      });
      resolve(newUser);
    }, MOCK_DELAY);
  });
};

export const assignUserRole = (userId: string, role: UserRole, actor?: { id: string; name: string; role: UserRole }): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const performingActor = getMockActor(actor);
      const userIndex = mockUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        const oldRole = mockUsers[userIndex].role;
        mockUsers[userIndex].role = role;
        await logPlatformUserAction({
          actorUserId: performingActor.id,
          actorUserName: performingActor.name,
          actorUserRole: performingActor.role,
          actionType: 'USER_ROLE_ASSIGNED',
          actionDescription: `Role for user ${mockUsers[userIndex].name} changed from ${oldRole} to ${role} by ${performingActor.name}.`,
          targetEntityType: 'User',
          targetEntityId: mockUsers[userIndex].id,
          targetEntityDescription: mockUsers[userIndex].email,
          details: { oldRole, newRole: role }
        });
        resolve({ ...mockUsers[userIndex] });
      } else {
        resolve(null);
      }
    }, MOCK_DELAY);
  });
};


// --- General Data API Functions ---
export const fetchClients = (): Promise<Client[]> => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockClients]), MOCK_DELAY));
};

export const assignAdminToClient = (clientId: string, adminId: string, actor?: { id: string; name: string; role: UserRole }): Promise<Client | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            const performingActor = getMockActor(actor);
            const clientIndex = mockClients.findIndex(c => c.id === clientId);
            const admin = mockUsers.find(u => u.id === adminId && (u.role === UserRole.Admin || u.role === UserRole.SuperAdmin));
            if (clientIndex !== -1 && admin) {
                const oldAdminId = mockClients[clientIndex].assignedAdminId;
                const oldAdminName = mockClients[clientIndex].assignedAdmin;
                mockClients[clientIndex].assignedAdminId = adminId;
                mockClients[clientIndex].assignedAdmin = admin.name;

                await logPlatformUserAction({
                    actorUserId: performingActor.id,
                    actorUserName: performingActor.name,
                    actorUserRole: performingActor.role,
                    actionType: 'CLIENT_ADMIN_ASSIGNED',
                    actionDescription: `Admin ${admin.name} assigned to client ${mockClients[clientIndex].name} by ${performingActor.name}.`,
                    targetEntityType: 'Client',
                    targetEntityId: clientId,
                    targetEntityDescription: mockClients[clientIndex].name,
                    details: { oldAdminId, oldAdminName, newAdminId: adminId, newAdminName: admin.name }
                });
                resolve({ ...mockClients[clientIndex] });
            } else {
                reject(new Error('Client or Admin not found, or user is not an Admin.'));
            }
        }, MOCK_DELAY);
    });
};

export const fetchPendingProperties = (): Promise<Property[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockProperties.filter(p => p.status === 'Pending')), MOCK_DELAY));
};
export const fetchAllProperties = (): Promise<Property[]> => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockProperties]), MOCK_DELAY));
};

export const fetchVerifiedProperties = (): Promise<Property[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockProperties.filter(p => p.status === 'Verified')), MOCK_DELAY));
};


export const updatePropertyStatus = (propertyId: string, status: 'Verified' | 'Rejected', notes?: string, actor?: { id: string; name: string; role: UserRole }): Promise<Property> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const performingActor = getMockActor(actor);
      const idx = mockProperties.findIndex(p => p.id === propertyId);
      if (idx > -1) {
        const oldStatus = mockProperties[idx].status;
        mockProperties[idx] = { ...mockProperties[idx], status, verificationNotes: notes, verifiedById: performingActor.id, verifiedBy: performingActor.name };
        
        await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: status === 'Verified' ? 'PROPERTY_VERIFIED' : 'PROPERTY_REJECTED',
            actionDescription: `Property ${mockProperties[idx].address} status changed to ${status} by ${performingActor.name}. Notes: ${notes || 'N/A'}`,
            targetEntityType: 'Property',
            targetEntityId: propertyId,
            targetEntityDescription: mockProperties[idx].address,
            details: { oldStatus, newStatus: status, notes }
        });
        resolve(mockProperties[idx]);
      } else {
        reject(new Error('Property not found'));
      }
    }, MOCK_DELAY);
  });
};

export const assignEmployeeToProperty = (propertyId: string, employeeId: string, actor?: { id: string; name: string; role: UserRole }): Promise<Property | null> => {
  return new Promise((resolve, reject) => {
      setTimeout(async () => {
          const performingActor = getMockActor(actor);
          const propertyIndex = mockProperties.findIndex(p => p.id === propertyId);
          const employee = mockUsers.find(u => u.id === employeeId); 
          if (propertyIndex !== -1 && employee) {
              const oldEmployeeId = mockProperties[propertyIndex].assignedEmployeeId;
              mockProperties[propertyIndex].assignedEmployeeId = employeeId;
              
              const logEntry: AssignmentLog = {
                id: `log_assign_${Date.now()}`,
                timestamp: new Date().toISOString(),
                assignerId: performingActor.id,
                assignerName: performingActor.name,
                assigneeId: employee.id,
                assigneeName: employee.name,
                targetType: 'Property',
                targetId: propertyId,
                targetDescription: mockProperties[propertyIndex].address,
                action: 'Assigned',
                notes: 'Assigned via UI by platform user.'
              };
              mockAssignmentLogs.push(logEntry);

              await logPlatformUserAction({
                  actorUserId: performingActor.id,
                  actorUserName: performingActor.name,
                  actorUserRole: performingActor.role,
                  actionType: 'PROPERTY_EMPLOYEE_ASSIGNED',
                  actionDescription: `Employee ${employee.name} assigned to property ${mockProperties[propertyIndex].address} by ${performingActor.name}.`,
                  targetEntityType: 'Property',
                  targetEntityId: propertyId,
                  targetEntityDescription: mockProperties[propertyIndex].address,
                  details: { oldEmployeeId, newEmployeeId: employeeId, employeeName: employee.name }
              });
              resolve({ ...mockProperties[propertyIndex] });
          } else {
              reject(new Error('Property or Employee not found.'));
          }
      }, MOCK_DELAY);
  });
};


export const fetchPayments = (): Promise<Payment[]> => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockPayments]), MOCK_DELAY));
};

export const updatePaymentStatus = (paymentId: string, status: 'Verified' | 'Failed', actor?: { id: string; name: string; role: UserRole }): Promise<Payment> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const performingActor = getMockActor(actor);
      const idx = mockPayments.findIndex(p => p.id === paymentId);
      if (idx > -1) {
        const oldStatus = mockPayments[idx].status;
        mockPayments[idx].status = status;
        mockPayments[idx].verifiedById = performingActor.id;
        mockPayments[idx].verifiedByName = performingActor.name;

        await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: status === 'Verified' ? 'PAYMENT_VERIFIED' : 'PAYMENT_MARKED_FAILED',
            actionDescription: `Payment ${mockPayments[idx].transactionId} for ${mockPayments[idx].clientName} marked as ${status} by ${performingActor.name}.`,
            targetEntityType: 'Payment',
            targetEntityId: paymentId,
            targetEntityDescription: `Txn: ${mockPayments[idx].transactionId}, Client: ${mockPayments[idx].clientName}`,
            details: { oldStatus, newStatus: status, amount: mockPayments[idx].amount }
        });
        resolve(mockPayments[idx]);
      } else {
        reject(new Error('Payment not found'));
      }
    }, MOCK_DELAY);
  });
};

export const fetchSocialCampaigns = (): Promise<SocialCauseCampaign[]> => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockSocialCampaigns]), MOCK_DELAY));
};

export const fetchServiceInquiries = (): Promise<ServiceInquiry[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockServiceInquiries]), MOCK_DELAY));
};

export const updateServiceInquiry = (inquiryId: string, status: ServiceInquiry['status'], notes?: string, actor?: { id: string; name: string; role: UserRole }): Promise<ServiceInquiry | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            const performingActor = getMockActor(actor);
            const inquiryIndex = mockServiceInquiries.findIndex(i => i.id === inquiryId);
            if (inquiryIndex !== -1) {
                const oldStatus = mockServiceInquiries[inquiryIndex].status;
                mockServiceInquiries[inquiryIndex].status = status;
                if (notes !== undefined) mockServiceInquiries[inquiryIndex].notes = notes;
                mockServiceInquiries[inquiryIndex].handledById = performingActor.id;
                mockServiceInquiries[inquiryIndex].handledByName = performingActor.name;

                await logPlatformUserAction({
                    actorUserId: performingActor.id,
                    actorUserName: performingActor.name,
                    actorUserRole: performingActor.role,
                    actionType: 'SERVICE_INQUIRY_UPDATED',
                    actionDescription: `Service inquiry from ${mockServiceInquiries[inquiryIndex].inquirerName} status changed to ${status} by ${performingActor.name}.`,
                    targetEntityType: 'ServiceInquiry',
                    targetEntityId: inquiryId,
                    targetEntityDescription: `Inquiry from: ${mockServiceInquiries[inquiryIndex].inquirerName}`,
                    details: { oldStatus, newStatus: status, notes }
                });
                resolve({ ...mockServiceInquiries[inquiryIndex] });
            } else {
                reject(new Error('Service inquiry not found.'));
            }
        }, MOCK_DELAY);
    });
};

export const fetchCallbackRequests = (): Promise<CallbackRequest[]> => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockCallbackRequests]), MOCK_DELAY));
};

export const updateCallbackRequest = (requestId: string, data: Partial<Pick<CallbackRequest, 'status' | 'assignedToId' | 'scheduledFor' | 'notes'>>, actor?: { id: string; name: string; role: UserRole }): Promise<CallbackRequest | null> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const performingActor = getMockActor(actor);
      const index = mockCallbackRequests.findIndex(r => r.id === requestId);
      if (index !== -1) {
        const oldData = { ...mockCallbackRequests[index] };
        mockCallbackRequests[index] = { ...mockCallbackRequests[index], ...data };
        if (data.assignedToId) {
            mockCallbackRequests[index].assignedToName = mockUsers.find(u => u.id === data.assignedToId)?.name;
        }

        await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: 'CALLBACK_REQUEST_UPDATED',
            actionDescription: `Callback request for ${mockCallbackRequests[index].clientName} updated by ${performingActor.name}.`,
            targetEntityType: 'CallbackRequest',
            targetEntityId: requestId,
            targetEntityDescription: `Request from: ${mockCallbackRequests[index].clientName}`,
            details: { oldStatus: oldData.status, newStatus: data.status, changes: data }
        });
        resolve({ ...mockCallbackRequests[index] });
      } else {
        reject(new Error('Callback request not found.'));
      }
    }, MOCK_DELAY);
  });
};

export const fetchSubscriptionsByClientId = (clientId: string): Promise<Subscription[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSubscriptions.filter(sub => sub.clientId === clientId));
    }, MOCK_DELAY);
  });
};

export const addSubscription = (data: Omit<Subscription, 'id'>, actor?: { id: string; name: string; role: UserRole }): Promise<Subscription> => {
  return new Promise((resolve) => {
    setTimeout(async() => {
      const performingActor = getMockActor(actor);
      const newSub: Subscription = { ...data, id: `sub_${Date.now()}` };
      mockSubscriptions.push(newSub);
      await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: 'SUBSCRIPTION_CREATED',
            actionDescription: `Subscription for ${newSub.servicePackageName} created for client ${newSub.clientName} by ${performingActor.name}.`,
            targetEntityType: 'Subscription',
            targetEntityId: newSub.id,
            targetEntityDescription: `Client: ${newSub.clientName}, Package: ${newSub.servicePackageName}`,
            details: { ...newSub }
      });
      resolve(newSub);
    }, MOCK_DELAY);
  });
};

export const updateSubscriptionStatus = (subscriptionId: string, status: Subscription['status'], actor?: { id: string; name: string; role: UserRole }): Promise<Subscription | null> => {
  return new Promise((resolve, reject) => {
    setTimeout(async() => {
      const performingActor = getMockActor(actor);
      const index = mockSubscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        const oldStatus = mockSubscriptions[index].status;
        mockSubscriptions[index].status = status;
        if (status === 'Cancelled') mockSubscriptions[index].endDate = new Date().toISOString();
        
        await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: 'SUBSCRIPTION_STATUS_UPDATED',
            actionDescription: `Subscription ${mockSubscriptions[index].servicePackageName} for client ${mockSubscriptions[index].clientName} status changed to ${status} by ${performingActor.name}.`,
            targetEntityType: 'Subscription',
            targetEntityId: subscriptionId,
            targetEntityDescription: `Client: ${mockSubscriptions[index].clientName}, Package: ${mockSubscriptions[index].servicePackageName}`,
            details: { oldStatus, newStatus: status }
        });
        resolve({ ...mockSubscriptions[index] });
      } else {
        reject(new Error('Subscription not found'));
      }
    }, MOCK_DELAY);
  });
};

export const fetchRolePermissions = (): Promise<RolePermission[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(mockRolePermissions))), MOCK_DELAY));
};

export const updateRolePermissions = (role: UserRole, permissions: PermissionId[], actor?: { id: string; name: string; role: UserRole }): Promise<RolePermission | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            const performingActor = getMockActor(actor);
            const roleIndex = mockRolePermissions.findIndex(rp => rp.role === role);
            if (roleIndex !== -1) {
                const oldPermissions = [...mockRolePermissions[roleIndex].permissions];
                mockRolePermissions[roleIndex].permissions = permissions;
                await logPlatformUserAction({
                    actorUserId: performingActor.id,
                    actorUserName: performingActor.name,
                    actorUserRole: performingActor.role,
                    actionType: 'ROLE_PERMISSIONS_UPDATED',
                    actionDescription: `Permissions for role ${role} updated by ${performingActor.name}.`,
                    targetEntityType: 'RolePermission',
                    targetEntityId: role,
                    targetEntityDescription: `Role: ${role}`,
                    details: { oldPermissions, newPermissions: permissions }
                });
                resolve({ ...mockRolePermissions[roleIndex] });
            } else {
                reject(new Error('Role not found.'));
            }
        }, MOCK_DELAY);
    });
};

export const fetchAppSettings = (): Promise<AppSetting[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(mockAppSettings))), MOCK_DELAY));
};

export const updateAppSetting = (settingId: string, value: any, actor?: { id: string; name: string; role: UserRole }): Promise<AppSetting | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            const performingActor = getMockActor(actor);
            const settingIndex = mockAppSettings.findIndex(s => s.id === settingId);
            if (settingIndex !== -1) {
                if (!mockAppSettings[settingIndex].isEditable) {
                    return reject(new Error('This setting is not editable.'));
                }
                const oldValue = mockAppSettings[settingIndex].value;
                const settingKey = mockAppSettings[settingIndex].key;
                mockAppSettings[settingIndex].value = value;

                await logPlatformUserAction({
                    actorUserId: performingActor.id,
                    actorUserName: performingActor.name,
                    actorUserRole: performingActor.role,
                    actionType: 'APP_SETTING_UPDATED',
                    actionDescription: `App setting "${settingKey}" updated by ${performingActor.name}.`,
                    targetEntityType: 'AppSetting',
                    targetEntityId: settingId,
                    targetEntityDescription: `Setting Key: ${settingKey}`,
                    details: { key: settingKey, oldValue, newValue: value }
                });
                resolve({ ...mockAppSettings[settingIndex] });
            } else {
                reject(new Error('App setting not found.'));
            }
        }, MOCK_DELAY);
    });
};

export const fetchEmployeeSchedules = (filters?: { employeeId?: string, date?: string }): Promise<EmployeeSchedule[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...mockEmployeeSchedules];
      if (filters?.employeeId) {
        results = results.filter(s => s.employeeId === filters.employeeId);
      }
      if (filters?.date) {
        results = results.filter(s => s.date === filters.date);
      }
      resolve(results);
    }, MOCK_DELAY);
  });
};

export const updateEmployeeSchedule = (scheduleId: string, data: Partial<Omit<EmployeeSchedule, 'id' | 'employeeId' | 'employeeName'>>, actor?: { id: string; name: string; role: UserRole }): Promise<EmployeeSchedule | null> => {
  return new Promise((resolve, reject) => {
    setTimeout(async() => {
      const performingActor = getMockActor(actor);
      const index = mockEmployeeSchedules.findIndex(s => s.id === scheduleId);
      if (index !== -1) {
        const oldData = { ...mockEmployeeSchedules[index] };
        mockEmployeeSchedules[index] = { ...mockEmployeeSchedules[index], ...data };
         await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: 'EMPLOYEE_SCHEDULE_UPDATED',
            actionDescription: `Schedule for ${oldData.employeeName} on ${oldData.date} updated by ${performingActor.name}.`,
            targetEntityType: 'EmployeeSchedule',
            targetEntityId: scheduleId,
            targetEntityDescription: `Employee: ${oldData.employeeName}, Date: ${oldData.date}`,
            details: { changes: data, oldAvailability: oldData.availabilityStatus, newAvailability: data.availabilityStatus }
        });
        resolve({ ...mockEmployeeSchedules[index] });
      } else {
        reject(new Error('Schedule not found.'));
      }
    }, MOCK_DELAY);
  });
};

export const addEmployeeSchedule = (data: Omit<EmployeeSchedule, 'id'>, actor?: { id: string; name: string; role: UserRole }): Promise<EmployeeSchedule> => {
  return new Promise((resolve) => {
    setTimeout(async() => {
      const performingActor = getMockActor(actor);
      const newSchedule: EmployeeSchedule = { ...data, id: `sched_${Date.now()}` };
      mockEmployeeSchedules.push(newSchedule);
      await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: 'EMPLOYEE_SCHEDULE_CREATED',
            actionDescription: `Schedule for ${newSchedule.employeeName} on ${newSchedule.date} created by ${performingActor.name}.`,
            targetEntityType: 'EmployeeSchedule',
            targetEntityId: newSchedule.id,
            targetEntityDescription: `Employee: ${newSchedule.employeeName}, Date: ${newSchedule.date}`,
            details: { ...newSchedule }
        });
      resolve(newSchedule);
    }, MOCK_DELAY);
  });
};

export const fetchAssignmentLogs = (filters?: { employeeId?: string, dateFrom?: string, dateTo?: string, targetType?: AssignmentLog['targetType'] }): Promise<AssignmentLog[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...mockAssignmentLogs];
      if (filters?.employeeId) {
        results = results.filter(log => log.assigneeId === filters.employeeId || log.assignerId === filters.employeeId);
      }
      if (filters?.dateFrom) {
        results = results.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom!));
      }
      if (filters?.dateTo) {
        results = results.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo!));
      }
      if (filters?.targetType) {
        results = results.filter(log => log.targetType === filters.targetType);
      }
      resolve(results.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, MOCK_DELAY);
  });
};

export const fetchDonations = (filters?: { campaignId?: string, dateFrom?: string, dateTo?: string, status?: Donation['status']}): Promise<Donation[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...mockDonations];
      if (filters?.campaignId) {
        results = results.filter(d => d.campaignId === filters.campaignId);
      }
      if (filters?.dateFrom) {
        results = results.filter(d => new Date(d.donationDate) >= new Date(filters.dateFrom!));
      }
      if (filters?.dateTo) {
        results = results.filter(d => new Date(d.donationDate) <= new Date(filters.dateTo!));
      }
      if (filters?.status) {
        results = results.filter(d => d.status === filters.status);
      }
      resolve(results.sort((a,b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime()));
    }, MOCK_DELAY);
  });
};

export const fetchBillingReportData = (dateRange: { from: string, to: string }): Promise<{summary: BillingReportSummary, revenueTrend: RevenueDataPoint[]}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);

      const paymentsInPeriod = mockPayments.filter(p => {
        const pDate = new Date(p.date);
        return pDate >= fromDate && pDate <= toDate;
      });
      
      const verifiedPaymentsInPeriod = paymentsInPeriod.filter(p => p.status === 'Verified');
      const pendingPaymentsInPeriod = paymentsInPeriod.filter(p => p.status === 'Pending');

      const totalRevenue = verifiedPaymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);
      
      // Simplified revenue trend (mock, could be more granular)
      const revenueTrend: RevenueDataPoint[] = [
        { date: 'Previous Month', revenue: totalRevenue * 0.8 }, // Mock trend
        { date: 'Current Period', revenue: totalRevenue },
      ];
      
      const summary: BillingReportSummary = {
        period: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`,
        totalRevenue,
        totalVerifiedPayments: totalRevenue, // Assuming verified payments sum up to total revenue
        countVerifiedPayments: verifiedPaymentsInPeriod.length,
        totalPendingPayments: pendingPaymentsInPeriod.reduce((sum, p) => sum + p.amount, 0),
        countPendingPayments: pendingPaymentsInPeriod.length,
        newSubscriptionsThisPeriod: mockSubscriptions.filter(s => {
            const sDate = new Date(s.startDate);
            return sDate >= fromDate && sDate <= toDate;
        }).length,
        cancelledSubscriptionsThisPeriod: mockSubscriptions.filter(s => {
            if (!s.endDate) return false;
            const eDate = new Date(s.endDate);
            return s.status === 'Cancelled' && eDate >= fromDate && eDate <= toDate;
        }).length,
      };

      resolve({ summary, revenueTrend });
    }, MOCK_DELAY + 200);
  });
};

export const fetchPremiumOfferings = (): Promise<ServicePackage[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockServicePackages.filter(p => (p.tier === 'Premium' || p.tier === 'Enterprise') && p.isActive));
    }, MOCK_DELAY);
  });
};


// --- Dashboard Specific Data ---
export const fetchDashboardWidgets = (role: UserRole): Promise<DashboardWidgetData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let widgets: DashboardWidgetData[] = [];
      const totalClients = mockClients.length;
      const verifiedProperties = mockProperties.filter(p => p.status === 'Verified').length;
      const pendingVerifications = mockProperties.filter(p => p.status === 'Pending').length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const activeTenantsCount = mockTenants.filter(t => t.status === 'Active').length;
      
      const totalRevenueMTD = mockPayments
        .filter(p => p.status === 'Verified' && new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const activeLeadsCount = mockLeads.filter(l => l.status !== 'Converted' && l.status !== 'Dropped').length.toString();
      const openSupportTickets = mockClientTickets.filter(t => t.status === ClientTicketStatus.Open || t.status === ClientTicketStatus.InProgress).length;

      if (role === UserRole.SuperAdmin || role === UserRole.Admin) {
        widgets.push(
          { title: 'Total Clients', value: totalClients.toString(), icon: React.createElement(Users, { size: 22 }), trend: 5, trendDirection: 'up', period: 'last month', actionLink: '/users/clients/all' },
          { title: 'Properties Managed', value: verifiedProperties.toString(), icon: React.createElement(Home, { size: 22 }), trend: 2, trendDirection: 'up', period: 'last month', actionLink: '/properties/verified' },
          { title: 'Active Tenants', value: activeTenantsCount.toString(), icon: React.createElement(Contact, { size: 22 }), trend: 3, trendDirection: 'up', period: 'last month', actionLink: '/tenants/directory'},
          { title: 'Pending Verifications', value: pendingVerifications.toString(), icon: React.createElement(FileClock, { size: 22 }), trend: -10, trendDirection: 'down', period: 'last week', actionLink: '/properties/pending-verifications' },
          { title: 'Subscription Revenue (MTD)', value: `₹${totalRevenueMTD.toLocaleString()}`, icon: React.createElement(IndianRupee, { size: 22 }), trend: 8, trendDirection: 'up', period: 'last month MTD', actionLink: '/finance/billing-reports' },
          { title: 'Active Leads', value: activeLeadsCount, icon: React.createElement(Target, { size: 22 }), actionLink: '/crm/leads'},
          { title: 'Open Support Tickets', value: openSupportTickets.toString(), icon: React.createElement(LifeBuoy, { size: 22 }), actionLink: '/crm/support-tickets' }
        );
      }
      
      if (role === UserRole.SuperAdmin) {
        widgets.push(
            { title: 'Total Platform Users', value: mockUsers.length.toString(), icon: React.createElement(UserCheck, {size: 22}), actionLink: '/users/manage-all' },
            { title: 'Total Donations (All Time)', value: `₹${mockDonations.filter(d=>d.status === 'Completed').reduce((sum,d)=>sum+d.amount,0).toLocaleString()}`, icon: React.createElement(Gift, {size: 22}), actionLink: '/social-causes/donations'}
        );
      }

      if (role === UserRole.Sales) {
        widgets.push(
          { title: 'Active Leads', value: activeLeadsCount, icon: React.createElement(Target, { size: 22 }), trend: 3, trendDirection: 'up', actionLink: '/crm/leads'},
          { title: 'Open Support Tickets', value: openSupportTickets.toString(), icon: React.createElement(LifeBuoy, { size: 22 }), actionLink: '/crm/support-tickets' },
          { title: 'New Inquiries (Today)', value: mockServiceInquiries.filter(si => si.status === 'New' && new Date(si.receivedAt).toDateString() === new Date().toDateString()).length.toString(), icon: React.createElement(MailWarning, { size: 22 }), actionLink: '/crm/inquiries' },
          { title: 'Callbacks Due', value: mockCallbackRequests.filter(cr => cr.status === 'Pending').length.toString(), icon: React.createElement(PhoneCall, {size:22}), actionLink: '/crm/callbacks' } 
        );
      }

      if (role === UserRole.Operations) {
        widgets.push(
          { title: 'Active Tenants', value: activeTenantsCount.toString(), icon: React.createElement(Contact, { size: 22 }), actionLink: '/tenants/directory'},
          { title: 'Pending Verifications', value: pendingVerifications.toString(), icon: React.createElement(FileClock, { size: 22 }), actionLink: '/properties/pending-verifications' },
          { title: 'Properties Verified (MTD)', value: mockProperties.filter(p => p.status === 'Verified' && new Date(p.submittedDate).getMonth() === currentMonth && new Date(p.submittedDate).getFullYear() === currentYear).length.toString(), icon: React.createElement(FileCheck, { size: 22 }) }, 
          { title: 'Open Assignment Logs', value: mockAssignmentLogs.filter(log => log.action === 'Assigned').length.toString(), icon: React.createElement(BookUser, { size: 22 }), actionLink: '/users/employees/assignment-logs'} 
        );
      }
      
      if (widgets.length === 0 && role !== UserRole.Finance) { // Finance has its own page
         widgets.push({ title: 'No specific widgets for your role.', value: '', icon: React.createElement(BriefcaseBusiness, { size: 22 }) });
      }

      resolve(widgets);
    }, MOCK_DELAY);
  });
};

export const fetchRevenueData = (): Promise<any[]> => { // This is used by dashboard chart
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate monthly revenue for the last 6 months
      const data = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthlyRevenue = mockPayments
          .filter(p => p.status === 'Verified' && new Date(p.date).getMonth() === date.getMonth() && new Date(p.date).getFullYear() === year)
          .reduce((sum, p) => sum + p.amount, 0);
        data.push({ month: monthName, revenue: monthlyRevenue });
      }
      resolve(data);
    }, MOCK_DELAY);
  });
};

export const fetchPropertyStatusData = (): Promise<any[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: 'Verified', value: mockProperties.filter(p => p.status === 'Verified').length },
        { name: 'Pending', value: mockProperties.filter(p => p.status === 'Pending').length },
        { name: 'Rejected', value: mockProperties.filter(p => p.status === 'Rejected').length },
      ]);
    }, MOCK_DELAY);
  });
};

// --- CRM (Sales) ---
export const fetchLeads = (): Promise<Lead[]> => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockLeads]), MOCK_DELAY));
};

export const updateLeadStatus = (leadId: string, status: Lead['status'], notes?: string, actor?: { id: string; name: string; role: UserRole }): Promise<Lead | null> => {
    return new Promise((resolve) => {
        setTimeout(async() => {
            const performingActor = getMockActor(actor);
            const leadIndex = mockLeads.findIndex(l => l.id === leadId);
            if (leadIndex > -1) {
                const oldStatus = mockLeads[leadIndex].status;
                mockLeads[leadIndex].status = status;
                if (notes !== undefined) mockLeads[leadIndex].notes = notes;
                mockLeads[leadIndex].lastContacted = new Date().toISOString().split('T')[0];
                await logPlatformUserAction({
                    actorUserId: performingActor.id,
                    actorUserName: performingActor.name,
                    actorUserRole: performingActor.role,
                    actionType: 'LEAD_STATUS_UPDATED',
                    actionDescription: `Lead ${mockLeads[leadIndex].clientName} status changed to ${status} by ${performingActor.name}.`,
                    targetEntityType: 'Lead',
                    targetEntityId: leadId,
                    targetEntityDescription: mockLeads[leadIndex].clientName,
                    details: { oldStatus, newStatus: status, notes }
                });
                resolve({ ...mockLeads[leadIndex] });
            } else {
                resolve(null);
            }
        }, MOCK_DELAY);
    });
};

export const fetchSalesLeadsSummary = (): Promise<{total: number, new: number, qualified: number}> => {
     return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                total: mockLeads.length,
                new: mockLeads.filter(l => l.status === 'New').length,
                qualified: mockLeads.filter(l => l.status === 'Qualified').length,
            });
        }, MOCK_DELAY);
    });
}

// --- Operations ---
export const fetchOperationsQueueSummary = (): Promise<{pendingProperties: number, pendingTasks: number}> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                pendingProperties: mockProperties.filter(p => p.status === 'Pending').length,
                pendingTasks: 5, // Example static value
            });
        }, MOCK_DELAY);
    });
}

// --- Service Packages ---
export const fetchServicePackages = (): Promise<ServicePackage[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(JSON.parse(JSON.stringify(mockServicePackages)));
        }, MOCK_DELAY);
    });
};
export const addServicePackage = (pkg: Omit<ServicePackage, 'id'>, actor?: { id: string; name: string; role: UserRole }): Promise<ServicePackage> => {
    return new Promise((resolve) => {
        setTimeout(async() => {
            const performingActor = getMockActor(actor);
            const newPkg: ServicePackage = {...pkg, id: `sp_${Date.now()}`};
            mockServicePackages.push(newPkg);
            await logPlatformUserAction({
                actorUserId: performingActor.id,
                actorUserName: performingActor.name,
                actorUserRole: performingActor.role,
                actionType: 'SERVICE_PACKAGE_CREATED',
                actionDescription: `Service package "${newPkg.name}" created by ${performingActor.name}.`,
                targetEntityType: 'ServicePackage',
                targetEntityId: newPkg.id,
                targetEntityDescription: newPkg.name,
                details: { ...newPkg }
            });
            resolve(newPkg);
        }, MOCK_DELAY);
    });
};
export const updateServicePackage = (packageId: string, data: Partial<Omit<ServicePackage, 'id'>>, actor?: { id: string; name: string; role: UserRole }): Promise<ServicePackage | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(async() => {
            const performingActor = getMockActor(actor);
            const index = mockServicePackages.findIndex(p => p.id === packageId);
            if (index !== -1) {
                const oldPackage = {...mockServicePackages[index]};
                mockServicePackages[index] = {...mockServicePackages[index], ...data};
                 await logPlatformUserAction({
                    actorUserId: performingActor.id,
                    actorUserName: performingActor.name,
                    actorUserRole: performingActor.role,
                    actionType: 'SERVICE_PACKAGE_UPDATED',
                    actionDescription: `Service package "${mockServicePackages[index].name}" updated by ${performingActor.name}.`,
                    targetEntityType: 'ServicePackage',
                    targetEntityId: packageId,
                    targetEntityDescription: mockServicePackages[index].name,
                    details: { oldData: oldPackage, newData: mockServicePackages[index] }
                });
                resolve({...mockServicePackages[index]});
            } else {
                reject(new Error("Package not found"));
            }
        }, MOCK_DELAY);
    });
};

// --- Tenant Management API Functions ---
export const fetchTenants = (): Promise<Tenant[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Denormalize propertyName for tenants
      const tenantsWithPropNames = mockTenants.map(tenant => {
        const property = mockProperties.find(p => p.id === tenant.propertyId);
        return { ...tenant, propertyName: property ? property.address : 'N/A' };
      });
      resolve(tenantsWithPropNames);
    }, MOCK_DELAY);
  });
};

export const addTenant = (tenantData: Omit<Tenant, 'id' | 'avatarUrl' | 'propertyName'>, actor?: { id: string; name: string; role: UserRole }): Promise<Tenant> => {
  return new Promise((resolve) => {
    setTimeout(async() => {
      const performingActor = getMockActor(actor);
      const property = mockProperties.find(p => p.id === tenantData.propertyId);
      const newTenant: Tenant = {
        ...tenantData,
        id: `ten_${Date.now()}`,
        avatarUrl: `https://picsum.photos/seed/${tenantData.name.split(' ')[0]}/100/100`,
        propertyName: property ? property.address : 'N/A'
      };
      mockTenants.push(newTenant);
       await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: 'TENANT_CREATED',
            actionDescription: `Tenant "${newTenant.name}" created by ${performingActor.name}.`,
            targetEntityType: 'Tenant',
            targetEntityId: newTenant.id,
            targetEntityDescription: newTenant.name,
            details: { ...newTenant }
        });
      resolve(newTenant);
    }, MOCK_DELAY);
  });
};

export const updateTenant = (tenantId: string, tenantData: Partial<Omit<Tenant, 'id' | 'avatarUrl' | 'propertyName'>>, actor?: { id: string; name: string; role: UserRole }): Promise<Tenant | null> => {
  return new Promise((resolve, reject) => {
    setTimeout(async() => {
      const performingActor = getMockActor(actor);
      const index = mockTenants.findIndex(t => t.id === tenantId);
      if (index !== -1) {
        const oldTenant = {...mockTenants[index]};
        const property = tenantData.propertyId ? mockProperties.find(p => p.id === tenantData.propertyId) : mockProperties.find(p => p.id === mockTenants[index].propertyId);
        mockTenants[index] = { ...mockTenants[index], ...tenantData, propertyName: property ? property.address : mockTenants[index].propertyName };
        await logPlatformUserAction({
            actorUserId: performingActor.id,
            actorUserName: performingActor.name,
            actorUserRole: performingActor.role,
            actionType: 'TENANT_UPDATED',
            actionDescription: `Tenant "${mockTenants[index].name}" updated by ${performingActor.name}.`,
            targetEntityType: 'Tenant',
            targetEntityId: tenantId,
            targetEntityDescription: mockTenants[index].name,
            details: { oldData: oldTenant, newData: mockTenants[index] }
        });
        resolve({ ...mockTenants[index] });
      } else {
        reject(new Error('Tenant not found'));
      }
    }, MOCK_DELAY);
  });
};

export const fetchLeases = (filters?: { tenantId?: string, propertyId?: string }): Promise<Lease[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...mockLeases];
      if (filters?.tenantId) {
        results = results.filter(l => l.tenantId === filters.tenantId);
      }
      if (filters?.propertyId) {
        results = results.filter(l => l.propertyId === filters.propertyId);
      }
      resolve(results);
    }, MOCK_DELAY);
  });
};

export const fetchRentPaymentRecords = (filters?: { tenantId?: string, leaseId?: string, propertyId?: string }): Promise<RentPaymentRecord[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...mockRentPaymentRecords];
      if (filters?.tenantId) {
        results = results.filter(r => r.tenantId === filters.tenantId);
      }
      if (filters?.leaseId) {
        results = results.filter(r => r.leaseId === filters.leaseId);
      }
      if (filters?.propertyId) {
        results = results.filter(r => r.propertyId === filters.propertyId);
      }
      resolve(results.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
    }, MOCK_DELAY);
  });
};


// --- Client Support Tickets API ---
export const fetchClientTickets = (): Promise<ClientTicket[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(JSON.parse(JSON.stringify(mockClientTickets)));
        }, MOCK_DELAY);
    });
};

export const addClientTicket = (ticketData: Omit<ClientTicket, 'id' | 'createdAt' | 'updatedAt'>, actor?: { id: string; name: string; role: UserRole }): Promise<ClientTicket> => {
    return new Promise((resolve) => {
        setTimeout(async() => {
            const performingActor = getMockActor(actor);
            const now = new Date().toISOString();
            const newTicket: ClientTicket = {
                ...ticketData,
                id: `tkt_${Date.now()}`,
                createdAt: now,
                updatedAt: now,
                updatedById: performingActor.id,
                updatedByName: performingActor.name
            };
            mockClientTickets.push(newTicket);
             await logPlatformUserAction({
                actorUserId: performingActor.id,
                actorUserName: performingActor.name,
                actorUserRole: performingActor.role,
                actionType: 'CLIENT_SUPPORT_TICKET_CREATED',
                actionDescription: `Support ticket "${newTicket.title}" for client ${newTicket.clientName} created by ${performingActor.name}.`,
                targetEntityType: 'ClientTicket',
                targetEntityId: newTicket.id,
                targetEntityDescription: newTicket.title,
                details: { ...newTicket }
            });
            resolve(newTicket);
        }, MOCK_DELAY);
    });
};

export const updateClientTicket = (ticketId: string, updates: Partial<Omit<ClientTicket, 'id' | 'clientId' | 'clientName' | 'createdAt'>>, actor?: { id: string; name: string; role: UserRole }): Promise<ClientTicket | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(async() => {
            const performingActor = getMockActor(actor);
            const ticketIndex = mockClientTickets.findIndex(t => t.id === ticketId);
            if (ticketIndex !== -1) {
                const oldTicket = {...mockClientTickets[ticketIndex]};
                mockClientTickets[ticketIndex] = {
                    ...mockClientTickets[ticketIndex],
                    ...updates,
                    updatedAt: new Date().toISOString(),
                    updatedById: performingActor.id,
                    updatedByName: performingActor.name
                };
                // If assignedToId is updated, update assignedToName
                if (updates.assignedToId) {
                    const assignedUser = mockUsers.find(u => u.id === updates.assignedToId);
                    mockClientTickets[ticketIndex].assignedToName = assignedUser ? assignedUser.name : 'Unassigned';
                } else if (updates.assignedToId === '') { // Handle unassigning
                     mockClientTickets[ticketIndex].assignedToName = 'Unassigned';
                }

                await logPlatformUserAction({
                    actorUserId: performingActor.id,
                    actorUserName: performingActor.name,
                    actorUserRole: performingActor.role,
                    actionType: 'CLIENT_SUPPORT_TICKET_UPDATED',
                    actionDescription: `Support ticket "${mockClientTickets[ticketIndex].title}" for client ${mockClientTickets[ticketIndex].clientName} updated by ${performingActor.name}.`,
                    targetEntityType: 'ClientTicket',
                    targetEntityId: ticketId,
                    targetEntityDescription: mockClientTickets[ticketIndex].title,
                    details: { oldData: oldTicket, newData: mockClientTickets[ticketIndex] }
                });
                resolve({ ...mockClientTickets[ticketIndex] });
            } else {
                reject(new Error('Client ticket not found.'));
            }
        }, MOCK_DELAY);
    });
};

export const fetchClientTicketSummary = (): Promise<{ open: number; highPriorityOpen: number; resolvedToday: number }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const today = new Date().toISOString().split('T')[0];
            const openTickets = mockClientTickets.filter(t => t.status === ClientTicketStatus.Open || t.status === ClientTicketStatus.InProgress);
            resolve({
                open: openTickets.length,
                highPriorityOpen: openTickets.filter(t => t.priority === ClientTicketPriority.High || t.priority === ClientTicketPriority.Urgent).length,
                resolvedToday: mockClientTickets.filter(t => (t.status === ClientTicketStatus.Resolved || t.status === ClientTicketStatus.Closed) && t.updatedAt.startsWith(today)).length,
            });
        }, MOCK_DELAY);
    });
};
