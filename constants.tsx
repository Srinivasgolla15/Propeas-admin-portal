

import React from 'react';
import {
  LayoutDashboard, Users, Home, BriefcaseBusiness, UserCog, BadgeIndianRupee, HeartHandshake, Settings,
  UserPlus, FileCheck, FileClock, ListChecks, LucideBadgeIndianRupee, UsersRound, CalendarDays, FileText,
  BarChart3, ShieldCheck, WalletCards, Gift, Landmark, Building, CheckSquare, ListTodo, Target, PhoneCall, Activity, ShieldAlert, MailWarning, Cog, ClipboardList, Package, CalendarCheck, History, BookUser, Contact, FileSpreadsheet, Banknote, Users as UsersIcon, PackagePlus, LifeBuoy, ListFilter, Settings2
} from 'lucide-react';
import { NavItem, UserRole } from './types'; 

const iconSize = 18;
const subIconSize = 16; 
// const subSubIconSize = 14; // No longer needed for platform users as they become cards

export const NAV_ITEMS: NavItem[] = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: <LayoutDashboard size={iconSize} />,
    roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales, UserRole.Operations, UserRole.Finance] 
  },
  {
    name: 'User Management',
    icon: <UsersIcon size={iconSize} />, 
    roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales, UserRole.Operations],
    subItems: [
      {
        name: 'Platform User Management', 
        path: '/users/platform', // Now a direct link to the hub page
        icon: <UserCog size={subIconSize} />,
        roles: [UserRole.SuperAdmin, UserRole.Admin],
        // subItems (Manage All Users, Role Permissions) removed, they are now cards on PlatformUsersHub.tsx
      },
      {
        name: 'Client Management',
        path: '/users/client-management', 
        icon: <UsersRound size={subIconSize} />,
        roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales],
      },
      {
        name: 'Employee Management',
        path: '/users/employee-management', 
        icon: <BriefcaseBusiness size={subIconSize} />,
        roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations],
      }
    ]
  },
  {
    name: 'Properties',
    icon: <Home size={iconSize} />, 
    roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations],
    subItems: [
      { name: 'All Properties', path: '/properties/verified', icon: <FileCheck size={subIconSize} /> },
      // { name: 'Pending Verifications', path: '/properties/pending-verifications', icon: <FileClock size={subIconSize} />, roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations] },
    ],
  },
  {
    name: 'Tenant Management',
    icon: <Contact size={iconSize} />, 
    roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations],
    subItems: [
      { name: 'Tenant Directory', path: '/tenants/directory', icon: <UsersRound size={subIconSize} /> },
      // { name: 'Lease Agreements', path: '/tenants/leases', icon: <FileSpreadsheet size={subIconSize} /> },
      // { name: 'Rent Roll', path: '/tenants/rent-roll', icon: <Banknote size={subIconSize} />, roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance, UserRole.Operations] },
    ],
  },
  {
    name: 'Subscription Management', 
    icon: <Package size={iconSize} />, 
    roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales],
    subItems: [
      { name: 'Manage Packages', path: '/services/manage', icon: <ListChecks size={subIconSize} /> },
      { name: 'Premium Offerings', path: '/services/premium-offers', icon: <BadgeIndianRupee size={subIconSize} /> },
    ],
  },
  {
    name: 'Finance',
    icon: <BadgeIndianRupee size={iconSize} />, 
    roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance],
    subItems: [
      { name: 'Payment Verification', path: '/finance/payment-verification', icon: <ShieldCheck size={subIconSize} /> },
      { name: 'Billing Reports', path: '/finance/billing-reports', icon: <BarChart3 size={subIconSize} />, roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance] },
    ],
  },
  {
    name: 'CRM',
    icon: <Target size={iconSize} />, 
    roles: [UserRole.Sales, UserRole.SuperAdmin, UserRole.Admin], 
    subItems: [
      { name: 'Callback Requests', path: '/crm/callbacks', icon: <PhoneCall size={subIconSize} /> },
      { name: 'Leads Dashboard', path: '/crm/leads', icon: <LayoutDashboard size={subIconSize} /> },
      { name: 'Service enquiries', path: '/crm/inquiries', icon: <MailWarning size={subIconSize} /> },
      { name: 'Client Support Tickets', path: '/crm/support-tickets', icon: <LifeBuoy size={subIconSize} />, roles: [UserRole.Sales, UserRole.Admin, UserRole.SuperAdmin] },
    ],
  },
  {
    name: 'Social Causes',
    icon: <HeartHandshake size={iconSize} />, 
    roles: [UserRole.SuperAdmin, UserRole.Admin],
    subItems: [
      { name: 'Monthly Campaigns', path: '/social-causes/campaigns', icon: <Gift size={subIconSize} /> },
      { name: 'Donation Dashboard', path: '/social-causes/donations', icon: <Landmark size={subIconSize} />, roles: [UserRole.SuperAdmin, UserRole.Admin] },
    ],
  },
  { 
    name: 'Log History', 
    path: '/history/all-logs',
    icon: <History size={iconSize} />, 
    roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations]
  },
  {
    name: 'System Settings',
    icon: <Cog size={iconSize} />, 
    roles: [UserRole.SuperAdmin, UserRole.Admin],
    subItems: [
      { name: 'App Configurations', path: '/settings/app-configurations', icon: <Settings size={subIconSize} /> },
    ],
  },
];

export const APP_NAME = "Propeas";
export const APP_VERSION = "1.0.0";