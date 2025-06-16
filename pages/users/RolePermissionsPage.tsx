import React, { useEffect, useState, useCallback } from 'react';
import {
  UserRole,
  RolePermission,
  PermissionId,
  ALL_PERMISSIONS,
} from '../../types';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import {db} from '../../services/firebase'; // Adjust the import based on your Firebase setup

const RolePermissionsPage: React.FC = () => {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<PermissionId>>(new Set());
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    setFeedbackMessage(null);

    try {
      const snapshot = await getDocs(collection(db, 'roleDefinitions'));

      const data: RolePermission[] = snapshot.docs.map(docSnap => {
        const { role, description, permissions } = docSnap.data();
        return {
          role: role as UserRole,
          description: description || '',
          permissions: permissions || [],
        };
      });

      setRolePermissions(data);
    } catch (error) {
      console.error('Failed to fetch role permissions:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to load role permissions.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const handleEditRole = (role: UserRole) => {
    setEditingRole(role);
    const currentRolePerms = rolePermissions.find(rp => rp.role === role);
    setSelectedPermissions(new Set(currentRolePerms?.permissions || []));
  };

  const handlePermissionChange = (permissionId: PermissionId, checked: boolean) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(permissionId);
      } else {
        newSet.delete(permissionId);
      }
      return newSet;
    });
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;

    setIsLoading(true);

    try {
      const roleDocRef = doc(db, 'roleDefinitions', editingRole);
      await updateDoc(roleDocRef, {
        permissions: Array.from(selectedPermissions),
      });

      setFeedbackMessage({
        type: 'success',
        message: `Permissions for ${editingRole} updated successfully!`,
      });

      await loadPermissions();
      setEditingRole(null);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      setFeedbackMessage({
        type: 'error',
        message: 'Failed to update permissions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
        Role Permissions Management
      </h1>

      {feedbackMessage && (
        <div
          className={`p-3 my-2 rounded-md text-sm flex items-center ${
            feedbackMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle size={18} className="mr-2" />
          ) : (
            <AlertTriangle size={18} className="mr-2" />
          )}
          {feedbackMessage.message}
        </div>
      )}

      {isLoading && <p className="text-center">Loading permissions...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(UserRole).map(role => {
          const rolePermData = rolePermissions.find(rp => rp.role === role);
          const isCurrentlyEditing = editingRole === role;

          return (
            <Card
              key={role}
              title={`${role} Permissions`}
              className={
                isCurrentlyEditing
                  ? 'ring-2 ring-primary dark:ring-dark-primary shadow-xl'
                  : 'shadow-lg'
              }
            >
              <p className="text-sm text-foreground/70 dark:text-dark-foreground/70 mb-3 h-10 overflow-y-auto">
                {rolePermData?.description || 'Default permissions for this role.'}
              </p>

              {isCurrentlyEditing ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {ALL_PERMISSIONS.map(perm => (
                    <div key={perm.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${role}-${perm.id}`}
                        checked={selectedPermissions.has(perm.id)}
                        onChange={e =>
                          handlePermissionChange(perm.id, e.target.checked)
                        }
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label
                        htmlFor={`${role}-${perm.id}`}
                        className="ml-2 text-sm text-foreground dark:text-dark-foreground"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90 dark:text-dark-foreground/90 max-h-60 overflow-y-auto">
                  {(rolePermData?.permissions.length || 0) > 0 ? (
                    rolePermData?.permissions.map(pId => {
                      const permLabel =
                        ALL_PERMISSIONS.find(p => p.id === pId)?.label || pId;
                      return <li key={pId}>{permLabel}</li>;
                    })
                  ) : (
                    <li>No specific permissions assigned.</li>
                  )}
                </ul>
              )}

              <div className="mt-4 pt-4 border-t border-secondary dark:border-dark-secondary/50 flex justify-end space-x-2">
                {isCurrentlyEditing ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingRole(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSavePermissions}
                      isLoading={isLoading}
                      leftIcon={<ShieldCheck size={16} />}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    Edit Permissions
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RolePermissionsPage;
