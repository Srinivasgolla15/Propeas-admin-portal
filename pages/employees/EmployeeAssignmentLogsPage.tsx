import React, { useEffect, useState, useCallback } from 'react';
import { AssignmentLog, TableColumn, User, UserRole } from '../../types';
import { collection, getDocs, addDoc,where,query,getDoc,doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Search, AlertTriangle, Info } from 'lucide-react';

// Extended AssignmentLog for user details
interface ExtendedAssignmentLog extends AssignmentLog {
  assignerEmail?: string;
  assignerRole?: UserRole;
  assignerPhone?: string;
  assignerCreatedAt?: string;
  assigneeEmail?: string;
  assigneeRole?: UserRole;
  assigneePhone?: string;
  assigneeCreatedAt?: string;
}

// Fallback Select component
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
      aria-label={label}
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

const EmployeeAssignmentLogsPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [logs, setLogs] = useState<ExtendedAssignmentLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ExtendedAssignmentLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ExtendedAssignmentLog | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('All');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'All' | AssignmentLog['targetType']>('All');
  const [actionFilter, setActionFilter] = useState<'All' | AssignmentLog['action']>('All');

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

    // Load the user document by UID
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error(`User doc ${userId} not found`);
    }

    const userData = userSnap.data() as User;
    const log = {
      timestamp: new Date(),
      actorUserId: userId,
      actorUserName: userData.name || 'Unknown',
      actorUserRole: userData.role || 'Employee',
      actionType,
      actionDescription,
      targetEntityType: 'Assignment',
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

  const loadData = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    try {
      const [logsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'assignments')),
        getDocs(collection(db, 'users')),
      ]);

      const usersMap = new Map<string, User>(
        usersSnap.docs.map(doc => {
          const user = { id: doc.id, ...doc.data() } as User;
          return [user.id, user];
        })
      );

      const logsData = logsSnap.docs
        .map(doc => {
          const data = doc.data() as AssignmentLog;
          const assigner = usersMap.get(data.assignerId);
          const assignee = usersMap.get(data.assigneeId);
          return {
            ...data,
            timestamp: data.timestamp,
            assignerEmail: assigner?.email,
            assignerRole: assigner?.role,
            // assignerPhone and assignerCreatedAt removed due to missing properties in User type
            assigneeEmail: assignee?.email,
            assigneeRole: assignee?.role,
            // assigneePhone and assigneeCreatedAt removed due to missing properties in User type
          };
        })
        .filter(log => 
          !log.targetId?.startsWith('<') && 
          !log.assignerId?.startsWith('<') && 
          !log.assigneeId?.startsWith('<')
        ) as ExtendedAssignmentLog[];

      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

      setLogs(logsData);
      setFilteredLogs(logsData);

      const staff = usersData.filter(u =>
        [UserRole.Admin, UserRole.SuperAdmin, UserRole.Operations, UserRole.Employee].includes(u.role)
      );
      setUsers(staff);
    } catch (error) {
      console.error('Error loading logs or users:', error);
      setError('Failed to load assignment logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let result = logs;

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter(log => log.timestamp.toDate() >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(log => log.timestamp.toDate() <= toDate);
    }
    if (employeeFilter !== 'All') {
      result = result.filter(log => log.assigneeId === employeeFilter || log.assignerId === employeeFilter);
    }
    if (targetTypeFilter !== 'All') {
      result = result.filter(log => log.targetType === targetTypeFilter);
    }
    if (actionFilter !== 'All') {
      result = result.filter(log => log.action === actionFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log =>
        log.assigneeName.toLowerCase().includes(term) ||
        log.assignerName.toLowerCase().includes(term) ||
        (log.assigneeEmail?.toLowerCase().includes(term) || false) ||
        (log.assignerEmail?.toLowerCase().includes(term) || false) ||
        log.targetDescription.toLowerCase().includes(term) ||
        (log.notes && log.notes.toLowerCase().includes(term))
      );
    }

    setFilteredLogs(result);
  }, [searchTerm, dateFrom, dateTo, employeeFilter, targetTypeFilter, actionFilter, logs]);

  const handleViewDetails = (log: ExtendedAssignmentLog) => {
    setSelectedLog(log);
    setViewModalOpen(true);
    logAuditAction(
      currentUser?.id,
      'VIEW_ASSIGNMENT_DETAILS',
      `Viewed details for assignment ${log.id}`,
      log.id,
      log.targetDescription,
      { assignerId: log.assignerId, assigneeId: log.assigneeId }
    );
  };

  const columns: TableColumn<ExtendedAssignmentLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: log => (log.timestamp ? log.timestamp.toDate().toLocaleString() : 'N/A'),
    },
    {
      key: 'assignerName',
      header: 'Assigner',
      render: log => (
        <div className="flex flex-col">
          <Badge color="blue">{log.assignerName}</Badge>
          {log.assignerEmail && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.assignerEmail}</span>
          )}
        </div>
      ),
    },
    {
      key: 'assigneeName',
      header: 'Assignee',
      render: log => (
        <div className="flex flex-col">
          <Badge color="purple">{log.assigneeName}</Badge>
          {log.assigneeEmail && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.assigneeEmail}</span>
          )}
        </div>
      ),
    },
    { key: 'targetType', header: 'Target Type' },
    {
      key: 'targetDescription',
      header: 'Target Description',
      render: log => <span className="text-sm">{log.targetDescription}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: log => {
        let color: 'green' | 'yellow' | 'blue' | 'purple' | 'gray' | 'red';
        switch (log.action) {
          case 'Assigned':
            color = 'green';
            break;
          case 'Unassigned':
            color = 'yellow';
            break;
          case 'Reassigned':
            color = 'blue';
            break;
          case 'Task Status Updated':
            color = 'purple';
            break;
          case 'Notes Added':
            color = 'gray';
            break;
          default:
            color = 'red';
        }
        return <Badge color={color}>{log.action}</Badge>;
      },
    },
    {
      key: 'notes',
      header: 'Notes',
      render: log => log.notes || '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: log => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(log)}
          aria-label={`View details for assignment ${log.id}`}
        >
          <Info size={18} />
        </Button>
      ),
    },
  ];

  const targetTypeOptions: { value: AssignmentLog['targetType'] | 'All'; label: string }[] = [
    { value: 'All', label: 'All Target Types' },
    { value: 'Property', label: 'Property' },
    { value: 'Client Task', label: 'Client Task' },
    { value: 'General Task', label: 'General Task' },
  ];

  const actionOptions: { value: AssignmentLog['action'] | 'All'; label: string }[] = [
    { value: 'All', label: 'All Actions' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'Unassigned', label: 'Unassigned' },
    { value: 'Reassigned', label: 'Reassigned' },
    { value: 'Task Status Updated', label: 'Task Status Updated' },
    { value: 'Notes Added', label: 'Notes Added' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Employee Assignment Logs</h1>
      <Card>
        <div className="p-4 border-b border-secondary dark:border-dark-secondary/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Input
            label="Search Logs"
            type="text"
            placeholder="Assignee, Assigner, Email, Target, Notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search />}
          />
          <Input label="Date From" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <Input label="Date To" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <Select
            label="Employee (Assigner/Assignee)"
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Employees' },
              ...users.map(user => ({ value: user.id, label: user.name })),
            ]}
            className="w-full"
          />
          <Select
            label="Target Type"
            value={targetTypeFilter}
            onChange={e => setTargetTypeFilter(e.target.value as 'All' | AssignmentLog['targetType'])}
            options={targetTypeOptions}
            className="w-full"
          />
          <Select
            label="Action"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value as 'All' | AssignmentLog['action'])}
            options={actionOptions}
            className="w-full"
          />
        </div>

        {error && (
          <div
            id="error-message"
            className="p-3 my-4 rounded-md text-sm flex items-center bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50"
            role="alert"
            aria-describedby="error-message"
          >
            <AlertTriangle size={18} className="mr-2" aria-hidden="true" />
            {error}
          </div>
        )}

        <Table<ExtendedAssignmentLog>
          columns={columns}
          data={filteredLogs}
          isLoading={isLoading}
          emptyStateMessage="No assignment logs found matching your criteria."
        />
      </Card>

      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedLog(null);
        }}
        title="Assignment Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assignment Information</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignment ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedLog.timestamp ? selectedLog.timestamp.toDate().toLocaleString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Action</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.action}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.targetType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Target ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.targetId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.targetDescription}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.notes || 'None'}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assigner Information</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigner ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assignerId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assignerName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assignerEmail || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assignerRole || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assignerPhone || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedLog.assignerCreatedAt
                      ? new Date(selectedLog.assignerCreatedAt).toLocaleDateString()
                      : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assignee Information</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignee ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assigneeId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assigneeName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assigneeEmail || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assigneeRole || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.assigneePhone || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedLog.assigneeCreatedAt
                      ? new Date(selectedLog.assigneeCreatedAt).toLocaleDateString()
                      : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedLog(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeAssignmentLogsPage;