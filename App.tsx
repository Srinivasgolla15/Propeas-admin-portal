

import React from 'react';
import { Routes, Route, Outlet, Navigate, useLocation, BrowserRouter } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import LoginPage from './pages/auth/LoginPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainAppLayout from './components/layout/MainAppLayout';

import DashboardPage from './pages/DashboardPage';
// User Management imports
import PlatformUsersHub from './pages/users/hubs/PlatformUsersHub'; 
import ClientManagementHubPage from './pages/users/hubs/ClientManagementHubPage';
import EmployeeManagementHubPage from './pages/users/hubs/EmployeeManagementHubPage';

// Detailed functional pages
import UserManagementPage from './pages/users/UserManagementPage'; 
import RolePermissionsPage from './pages/users/RolePermissionsPage'; 
import AllClientsPage from './pages/clients/AllClientsPage'; 
import ClientSubscriptionsPage from './pages/clients/ClientSubscriptionsPage'; 
import AssignPropertyToEmployeePage from './pages/employees/AssignPropertyToEmployeePage'; 
import EmployeeAvailabilityPage from './pages/employees/EmployeeAvailabilityPage'; 
import AllEmployeesPage from './pages/employees/allemployees';
// EmployeeAssignmentLogsPage import removed

// Properties
import PendingVerificationsPage from './pages/properties/PendingVerificationsPage';
import AllPropertiesPage from './pages/properties/AllPropertiesPage';

// Tenant Management
import TenantDirectoryPage from './pages/tenants/TenantDirectoryPage';
import LeaseAgreementsPage from './pages/tenants/LeaseAgreementsPage';
import RentRollPage from './pages/tenants/RentRollPage';

// Services
import ServicePackagesPage from './pages/services/ServicePackagesPage'; 
import PremiumServiceOfferingsPage from './pages/services/PremiumServiceOfferingsPage';

// Finance
import PaymentVerificationPage from './pages/finance/PaymentVerificationPage';
import FinancePlaceholderPage from './pages/finance/FinancePlaceholderPage';
import BillingReportsPage from './pages/finance/BillingReportsPage';

// Social Causes
import SocialCausesPage from './pages/social/SocialCausesPage';
import DonationDashboardPage from './pages/social/DonationDashboardPage';

// CRM
import LeadsPage from './pages/crm/LeadsPage';
import ServiceInquiriesPage from './pages/crm/ServiceInquiriesPage';
import CallbackRequestsPage from './pages/crm/CallbackRequestsPage'; 
import ClientSupportTicketsPage from './pages/crm/ClientSupportTicketsPage'; 

// Settings
import AppConfigurationsPage from './pages/settings/AppConfigurationsPage'; 

// Audit/History
// PlatformAuditLogsPage import removed
import CombinedLogsPage from './pages/history/CombinedLogsPage'; // New combined log page

import NotFoundPage from './pages/NotFoundPage';

import { UserRole } from './types';
import { useAuth } from './contexts/AuthContext';
import EmployeeAssignmentLogsPage from './pages/employees/EmployeeAssignmentLogsPage';


const AnimatedOutlet: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};


const App: React.FC = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        Loading application...
      </div>
    );
  }

  return (

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainAppLayout />}>
            <Route element={<AnimatedOutlet />}>
              <Route path="/" element={<DashboardPage />} />
              
              {/* User Management Main Path Redirect */}
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales, UserRole.Operations]}>
                  <Navigate to="/users/platform" replace />
                </ProtectedRoute>
              }/>

              {/* User Management Hub Pages & Detailed Routes */}
              <Route path="/users/platform" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin]}>
                  <PlatformUsersHub /> 
                </ProtectedRoute>
              }/>
              <Route path="/users/client-management" element={ 
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales]}>
                  <ClientManagementHubPage />
                </ProtectedRoute>
              }/>
              <Route path="/users/employee-management" element={ 
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations]}>
                  <EmployeeManagementHubPage />
                </ProtectedRoute>
              }/>

              {/* Detailed User Management Routes (linked from PlatformUsersHub or new Hub Pages) */}
              <Route path="/users/manage-all" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin]}>
                  <UserManagementPage />
                </ProtectedRoute>
              } />
              <Route path="/users/permissions" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin]}>
                  <RolePermissionsPage />
                </ProtectedRoute>
              }/>
              <Route path="/users/clients/all" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales]}>
                  <AllClientsPage />
                </ProtectedRoute>
              } />
              <Route path="/users/clients/subscriptions" element={
                 <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales]}>
                    <ClientSubscriptionsPage />
                 </ProtectedRoute>
              } />
              <Route path="/users/employees/assign-property" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations]}>
                  <AssignPropertyToEmployeePage />
                </ProtectedRoute>
              } />
              <Route path="/users/employees/availability" element={
                 <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations]}>
                    <EmployeeAvailabilityPage />
                 </ProtectedRoute>
              } />
              <Route path ="/users/employees/EmployeeAssignmentLogs" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations]}>
                  <EmployeeAssignmentLogsPage />
                </ProtectedRoute>
              } />
              <Route path="/users/employees/all-employees" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations]}>
                  <AllEmployeesPage />
                </ProtectedRoute>
              } />

              {/* Route for EmployeeAssignmentLogsPage removed */}
              
              {/* Properties */}
              <Route path="/properties/verified" element={<AllPropertiesPage />} />
              {/* <Route path="/properties/pending-verifications" element={<PendingVerificationsPage />} /> */}
              <Route path="/properties" element={<Navigate to="/properties/verified" replace />} />


              {/* Tenant Management */}
              <Route path="/tenants" element={<Navigate to="/tenants/directory" replace />} />
              <Route path="/tenants/directory" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations]}>
                  <TenantDirectoryPage />
                </ProtectedRoute>
              } />
              <Route path="/tenants/leases" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations]}>
                  <LeaseAgreementsPage />
                </ProtectedRoute>
              } />
              <Route path="/tenants/rent-roll" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations, UserRole.Finance]}>
                  <RentRollPage />
                </ProtectedRoute>
              } />
              
              {/* Services Catalog (Subscription Management) */}
              <Route path="/services/manage" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin]}>
                  <ServicePackagesPage />
                </ProtectedRoute>
              } />
              <Route path="/services/premium-offers" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales]}>
                  <PremiumServiceOfferingsPage />
                </ProtectedRoute>
              } />
               <Route path="/services" element={<Navigate to="/services/manage" replace />} />


              {/* Finance */}
              <Route path="/finance/payment-verification" element={
                  <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance]}>
                    <PaymentVerificationPage />
                  </ProtectedRoute>
                } />
              <Route path="/finance/billing-reports" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance]}>
                 <BillingReportsPage />
                </ProtectedRoute>
              } />
              <Route path="/finance-dashboard" element={ 
                <ProtectedRoute allowedRoles={[UserRole.Finance]}>
                  <FinancePlaceholderPage />
                </ProtectedRoute>
              }/>
               <Route path="/finance" element={<Navigate to="/finance/payment-verification" replace />} />


              {/* Social Causes */}
              <Route path="/social-causes/campaigns" element={<SocialCausesPage />} />
              <Route path="/social-causes/donations" element={
                 <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin]}>
                    <DonationDashboardPage />
                 </ProtectedRoute>
              } />
              <Route path="/social-causes" element={<Navigate to="/social-causes/campaigns" replace />} />

              {/* Audit Logs / History - Consolidated */}
              <Route path="/history/all-logs" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin ]}>
                  <CombinedLogsPage />
                </ProtectedRoute>
              } />
              {/* Routes for /audit and /audit/platform-user-logs removed */}


              {/* Settings */}
              <Route path="/settings/app-configurations" element={
                <ProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin]}>
                 <AppConfigurationsPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={<Navigate to="/settings/app-configurations" replace />} />

              
              {/* CRM */}
              <Route path="/crm/leads" element={
                <ProtectedRoute allowedRoles={[UserRole.Sales, UserRole.SuperAdmin, UserRole.Admin]}>
                  <LeadsPage />
                </ProtectedRoute>
              } />
               <Route path="/crm/inquiries" element={
                <ProtectedRoute allowedRoles={[UserRole.Sales, UserRole.Admin, UserRole.SuperAdmin]}>
                  <ServiceInquiriesPage />
                </ProtectedRoute>
              } />
              <Route path="/crm/callbacks" element={
                <ProtectedRoute allowedRoles={[UserRole.Sales, UserRole.SuperAdmin, UserRole.Admin]}>
                  <CallbackRequestsPage />
                </ProtectedRoute>
              }/>
              <Route path="/crm/support-tickets" element={ 
                <ProtectedRoute allowedRoles={[UserRole.Sales, UserRole.SuperAdmin, UserRole.Admin]}>
                  <ClientSupportTicketsPage />
                </ProtectedRoute>
              }/>
              <Route path="/crm" element={<Navigate to="/crm/leads" replace />} />


              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
  );
};

export default App;
