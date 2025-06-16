import React, { useEffect, useState, useCallback } from 'react';
import { Employee, TableColumn, UserRole, User } from '../../types';
import { collection, getDocs, doc, setDoc, getDoc, addDoc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../services/firebase';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { PlusCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Fallback Select component if not available in components/ui
const Select: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ label, value, onChange, options, className }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <select
    aria-label='Select'
      value={value}
      onChange={onChange}
      className={`border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200 ${className}`}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Extend Employee interface for display purposes
interface AssignmentDisplay {
  id: string;
  name: string; // Property or client name
  type: 'Property' | 'Client';
}

interface ExtendedEmployee extends Employee {
  assignments?: AssignmentDisplay[];
}

const AllEmployeesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<ExtendedEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'On Leave'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'On Leave', label: 'On Leave' },
  ];

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
      if (!userDoc.exists()) throw new Error('User not found');

      const userData = userDoc.data();
      const log = {
        timestamp: new Date(),
        actorUserId: userId,
        actorUserName: userData.name || 'Unknown',
        actorUserRole: userData.role || 'user',
        actionType,
        actionDescription,
        targetEntityType: 'Employee',
        targetEntityId,
        targetEntityDescription,
        details,
        ipAddress: 'unknown',
      };

      await addDoc(collection(db, 'platformAuditLogs'), log);
    } catch (err) {
      console.error('Audit logging failed:', err);
    }
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'employees'));
      const list = await Promise.all(
        snapshot.docs.map(async (empDoc) => {
          const empData = empDoc.data() as Employee;
          const assignments: AssignmentDisplay[] = [];

          // Fetch active assignments from the assignments collection
          const assignmentsQuery = query(
            collection(db, 'assignments'),
            where('employeeRef', '==', doc(db, 'employees', empDoc.id)),
            where('status', '==', 'assigned')
          );
          const assignmentSnapshot = await getDocs(assignmentsQuery);

          await Promise.all(
            assignmentSnapshot.docs.map(async (assignDoc) => {
              const assignData = assignDoc.data();
              // Check propertyRef
              if (assignData.propertyRef) {
                const propertyDoc = await getDoc(assignData.propertyRef);
                if (propertyDoc.exists()) {
                  const propertyData = propertyDoc.data() as { name?: string };
                  assignments.push({
                    id: propertyDoc.id,
                    name: propertyData.name || 'Unknown Property',
                    type: 'Property',
                  });
                }
              }
              // Check clientRef (if applicable)
              if (assignData.clientRef) {
                const clientDoc = await getDoc(assignData.clientRef);
                if (clientDoc.exists()) {
                  const clientData = clientDoc.data() as { name?: string };
                  assignments.push({
                    id: clientDoc.id,
                    name: clientData.name || 'Unknown Client',
                    type: 'Client',
                  });
                }
              }
            })
          );

          return {
            ...empData,
            id: empDoc.id,
            assignments: assignments.length > 0 ? assignments : undefined,
          } as ExtendedEmployee;
        })
      );
      setEmployees(list);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setFeedbackMessage({ type: 'error', message: 'Failed to load employees.' });
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      (emp.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.phone ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || emp.employmentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const validateAdminCredentials = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user.uid !== currentUser?.id) {
        throw new Error('Credentials do not match the current user.');
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User not found.');
      }
      const userData = userDoc.data() as User;
      if (![UserRole.Admin, UserRole.SuperAdmin].includes(userData.role)) {
        throw new Error('User is not an Admin or SuperAdmin.');
      }
      return true;
    } catch (err) {
      console.error('Admin validation failed:', err);
      return false;
    }
  };

  const handleAddEmployee = async () => {
    setFeedbackMessage(null);
    if (!email || !password || !name) {
      setFeedbackMessage({ type: 'error', message: 'Please fill all required employee fields.' });
      return;
    }
    if (!adminEmail || !adminPassword) {
      setFeedbackMessage({ type: 'error', message: 'Please enter your admin email and password to confirm.' });
      return;
    }

    setLoading(true);
    try {
      // Validate admin credentials without signing in
      const isValidAdmin = await validateAdminCredentials(adminEmail, adminPassword);
      if (!isValidAdmin) {
        throw new Error('Invalid admin credentials. Please verify your email and password.');
      }

      // Check if user already exists
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const existingUser = usersSnapshot.docs.find(doc => doc.data().email === email);
      if (existingUser) {
        throw new Error('User with this email already exists.');
      }

      // Sign out temporarily to create new user
      await auth.signOut();

      // Create Firebase Auth user for new employee
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Add new employee to Firestore users collection
      await setDoc(doc(db, 'users', uid), {
        email,
        role: UserRole.Employee,
        name,
        phone,
        createdAt: new Date().toISOString(),
      });

      // Add to employees collection
      await setDoc(doc(db, 'employees', uid), {
        userId: uid,
        name,
        email,
        role: UserRole.Employee,
        phone,
        employmentStatus: 'Active',
        joinedOn: new Date().toISOString(),
        assignedto: null,
      });

      // Log audit action
      await logAuditAction(
        currentUser?.id,
        'ADD_EMPLOYEE',
        `Added new employee ${name}`,
        uid,
        name,
        { newEmployee: { email, name, phone } }
      );

      // Restore admin session
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

      // Reset states & close modal
      setFeedbackMessage({ type: 'success', message: 'Employee added successfully!' });
      setIsModalOpen(false);
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setAdminEmail('');
      setAdminPassword('');
      await fetchEmployees();
    } catch (e: any) {
      // Restore admin session on error
      if (auth.currentUser?.email !== adminEmail) {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      }
      setFeedbackMessage({ type: 'error', message: e.message || 'Failed to add employee.' });
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<ExtendedEmployee>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'assignedto',
      header: 'Assigned To',
      render: emp => (
        <span className="text-sm">
          {emp.assignments && emp.assignments.length > 0
            ? emp.assignments.map(a => `${a.name} (${a.type})`).join(', ')
            : 'None'}
        </span>
      ),
    },
    {
      key: 'employmentStatus',
      header: 'Status',
      render: emp => (
        <Badge color={emp.employmentStatus === 'Active' ? 'green' : 'red'}>
          {emp.employmentStatus ?? 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'joinedOn',
      header: 'Joined On',
      render: emp =>
        emp.joinedOn ? (
          <span className="text-sm text-gray-500">{new Date(emp.joinedOn).toLocaleDateString()}</span>
        ) : (
          'N/A'
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">All Employees</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive' | 'On Leave')}
              options={statusOptions}
              className="w-full sm:w-40"
            />
            <Button variant="primary" leftIcon={<PlusCircle size={18} />} onClick={() => setIsModalOpen(true)}>
              Add Employee
            </Button>
          </div>
        </div>

        {feedbackMessage && (
          <div
            className={`p-3 my-4 rounded-md text-sm flex items-center ${
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

        <Table columns={columns} data={filteredEmployees} isLoading={loading} emptyStateMessage="No employees found." />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFeedbackMessage(null);
          setEmail('');
          setPassword('');
          setName('');
          setPhone('');
          setAdminEmail('');
          setAdminPassword('');
        }}
        title="Add New Employee"
        size="md"
      >
        <form onSubmit={e => { e.preventDefault(); handleAddEmployee(); }} className="space-y-4">
          <Input
            label="Name"
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Input
            label="Phone (optional)"
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <div>
            <h3 className="font-semibold mb-2 text-sm">Confirm Your Admin Credentials</h3>
            <Input
              label="Admin Email"
              type="email"
              placeholder="Your Admin Email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              required
            />
            <Input
              label="Admin Password"
              type="password"
              placeholder="Your Admin Password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              required
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Add Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AllEmployeesPage;