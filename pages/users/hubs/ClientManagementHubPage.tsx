
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { UsersRound, WalletCards, ArrowRight } from 'lucide-react';

interface ManagementAction {
  path: string;
  label: string;
  description: string;
  roles: UserRole[];
  icon: React.ReactElement<{ className?: string }>;
}

const ClientManagementHubPage: React.FC = () => {
  const { currentUser } = useAuth();

  const canUserAccessLink = (allowedRoles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (allowedRoles.length === 0) return true; 
    return allowedRoles.includes(currentUser.role);
  };

  const clientActions: ManagementAction[] = [
    { 
      path: '/users/clients/all', 
      label: 'View All Clients', 
      description: 'Access and manage the complete list of client profiles and their details.',
      roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales], 
      icon: <UsersRound size={24} /> 
    },
    { 
      path: '/users/clients/subscriptions', 
      label: 'Manage Client Subscriptions', 
      description: 'View, add, or modify service subscriptions for individual clients.',
      roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Sales], 
      icon: <WalletCards size={24} /> 
    },
  ];

  const accessibleActions = clientActions.filter(action => canUserAccessLink(action.roles));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Client Management</h1>
          <p className="text-lg text-foreground/70 dark:text-dark-foreground/70 mt-1">
            Manage client profiles, accounts, and their service subscriptions.
          </p>
        </div>
        <Link to="/users/platform">
            <Button variant="outline" size="sm">&larr; Back to User Management</Button>
        </Link>
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
          <p className="text-foreground/70 dark:text-dark-foreground/70">No client management actions available for your role.</p>
        </Card>
      )}
    </div>
  );
};

export default ClientManagementHubPage;
