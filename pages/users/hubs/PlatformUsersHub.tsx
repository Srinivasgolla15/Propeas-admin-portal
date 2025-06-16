

import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { UserCog, ShieldAlert, ArrowRight } from 'lucide-react';

interface ManagementActionLink {
  path: string;
  label: string;
  description: string;
  roles: UserRole[];
  icon: React.ReactElement<{ className?: string }>;
}

const PlatformUsersHub: React.FC = () => {
  const { currentUser } = useAuth();

  const canUserAccessLink = (allowedRoles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(currentUser.role);
  };

  const platformUserActions: ManagementActionLink[] = [
    { 
      path: '/users/manage-all', 
      label: 'Manage Platform Users', 
      description: 'Add, edit, or remove internal user accounts. Assign and update user roles within the system.',
      roles: [UserRole.SuperAdmin, UserRole.Admin], 
      icon: <UserCog size={24} /> 
    },
    // { 
    //   path: '/users/permissions', 
    //   label: 'Role Permissions Management', 
    //   description: 'Define and manage specific permissions for each user role. Control access to various system features.',
    //   roles: [UserRole.SuperAdmin], 
    //   icon: <ShieldAlert size={24} /> 
    // },
  ];

  const accessibleActions = platformUserActions.filter(action => canUserAccessLink(action.roles));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Platform User Management</h1>
          <p className="text-lg text-foreground/70 dark:text-dark-foreground/70 mt-1">
            Administer internal user accounts, assign roles, and manage system-wide permissions.
          </p>
        </div>
        {/* Removed Back to Dashboard button to rely on sidebar navigation */}
      </div>

      {accessibleActions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accessibleActions.map((action) => (
            <Link 
              to={action.path} 
              key={action.path} 
              className="block hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-sky-500 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-[1.02] group"
            >
              <Card className="shadow-lg group-hover:shadow-xl cursor-pointer h-full flex flex-col">
                <div className="p-5 flex-grow">
                  <div className="flex items-center mb-3">
                      {React.cloneElement(action.icon, { className: "mr-3 text-primary dark:text-sky-500"})}
                      <h2 className="text-xl font-semibold text-foreground dark:text-dark-foreground group-hover:text-primary dark:group-hover:text-sky-500 transition-colors">{action.label}</h2>
                  </div>
                  <p className="text-sm text-foreground/70 dark:text-dark-foreground/70 mb-4">{action.description}</p>
                </div>
                <div className="p-4 border-t border-secondary dark:border-dark-secondary/50 mt-auto transition-colors">
                    <div className="flex justify-between items-center text-primary dark:text-sky-500 group-hover:text-primary dark:group-hover:text-sky-400 transition-colors">
                        <span className="text-sm font-medium">Go to {action.label}</span>
                        <ArrowRight size={18} className="transform transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center p-6">
          <p className="text-foreground/70 dark:text-dark-foreground/70">No platform user management actions available for your role.</p>
        </Card>
      )}
    </div>
  );
};

export default PlatformUsersHub;
