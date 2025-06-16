import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc,addDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { User, UserRole, TableColumn } from '../../types';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { PlusCircle, Trash2, UserCog, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const UserManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: UserRole.Sales, password: '' });

  const logAuditAction = async (
    userId: string | undefined,
    actionType: string,
    actionDescription: string,
    targetEntityId: string,
    targetEntityDescription: string,
    details: Record<string, any> = {}
  ) => {
    try {
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) throw new Error('User doc not found.');

      const userData = userDoc.data();
      const log = {
        timestamp: new Date(),
        actorUserId: userId,
        actorUserName: userData.name || 'Unknown',
        actorUserRole: userData.role || 'user',
        actionType,
        actionDescription,
        targetEntityType: 'User',
        targetEntityId,
        targetEntityDescription,
        details,
        ipAddress: 'unknown',
      };

      await addDoc(collection(db, 'platformAuditLogs'), log);
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && (currentUser.role === UserRole.Admin || currentUser.role === UserRole.SuperAdmin)) {
      loadUsers();
    } else {
      setUsers([]);
      setFilteredUsers([]);
      setIsLoading(false);
    }
  }, [currentUser, loadUsers]);

  useEffect(() => {
    const lowercased = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(u =>
        u.name.toLowerCase().includes(lowercased) ||
        u.email.toLowerCase().includes(lowercased) ||
        u.role.toLowerCase().includes(lowercased)
      )
    );
  }, [searchTerm, users]);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
    } else {
      setFormData({ name: '', email: '', role: UserRole.Sales, password: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (currentUser.role === UserRole.Admin) {
      if (formData.role === UserRole.SuperAdmin || (editingUser?.role === UserRole.SuperAdmin && editingUser.id !== currentUser.id)) {
        alert('Admins cannot create or modify Super Admin roles.');
        return;
      }
      if (editingUser?.id === currentUser.id && formData.role !== UserRole.Admin) {
        alert('Admins cannot change their own role.');
        return;
      }
    }

    try {
      if (editingUser) {
        const userRef = doc(db, 'users', editingUser.id);
        await updateDoc(userRef, { role: formData.role });

        await logAuditAction(
          currentUser.id,
          'UPDATE_USER_ROLE',
          `Updated role for ${editingUser.name} to ${formData.role}`,
          editingUser.id,
          editingUser.name,
          { previousRole: editingUser.role, newRole: formData.role }
        );
      } else {
        const newUserCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const uid = newUserCredential.user.uid;
        await setDoc(doc(db, 'users', uid), {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          avatarUrl: '',
          createdAt: new Date(),
        });

        await logAuditAction(
          currentUser.id,
          'ADD_USER',
          `Added new user ${formData.name}`,
          uid,
          formData.name,
          { newUser: formData }
        );
      }
      await loadUsers();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to save user: ' + errorMessage);
    }
  };

  const canEditRole = (userToEdit: User): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.SuperAdmin) return true;
    if (currentUser.role === UserRole.Admin) {
      return userToEdit.role !== UserRole.SuperAdmin && userToEdit.id !== currentUser.id;
    }
    return false;
  };

  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: user => (
        <div className="flex items-center">
          <img
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name.replace(' ', '+')}&background=random`}
            alt={user.name}
            className="w-8 h-8 rounded-full mr-3 object-cover"
          />
          <span className="font-medium">{user.name}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: user => (
        <Badge color={user.role === UserRole.SuperAdmin ? 'purple' : user.role === UserRole.Admin ? 'blue' : 'gray'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: user => (
        <div className="space-x-2">
          {canEditRole(user) && (
            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(user)} title="Edit User Role">
              <UserCog size={16} />
            </Button>
          )}
          {currentUser?.role === UserRole.SuperAdmin && user.id !== currentUser.id && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => alert(`Delete ${user.name} (not implemented)`)}
              title="Delete User"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const roleOptions = Object.values(UserRole).filter(
    role => currentUser?.role === UserRole.SuperAdmin || role !== UserRole.SuperAdmin
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">User Management</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search />}
            className="w-full sm:w-64"
          />
          {currentUser?.role === UserRole.SuperAdmin && (
            <Button variant="primary" leftIcon={<PlusCircle size={18} />} onClick={() => handleOpenModal()}>
              Add User
            </Button>
          )}
        </div>
      </div>

      <Table<User>
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyStateMessage="No users found."
      />

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingUser ? 'Edit User Role' : 'Add New User'} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={!!editingUser}
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={!!editingUser}
            />
            {!editingUser && (
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Min. 8 characters"
              />
            )}
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-background dark:bg-dark-card"
                required
              >
                {roleOptions.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" leftIcon={<ShieldCheck size={16} />}>
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;