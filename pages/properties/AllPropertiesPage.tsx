import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  collection, doc, getDoc, getDocs, runTransaction, Timestamp,
  where, query, QueryConstraint
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../services/firebase';
import {
  Property, Client, Employee, AuditLogEntry,
  TableColumn, UserRole, AssignmentLog
} from '../../types';

import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import BadgeColor from '../../components/ui/Badge';
import {
  Search, Building, Home as HomeIcon, Edit,
  ArrowUp, ArrowDown, RefreshCcw
} from 'lucide-react';

const PAGE_SIZE = 5;
const PROPERTY_STATUSES = ['Verified', 'Pending', 'Rejected'] as const;
const PROPERTY_TYPES = ['Residential', 'Commercial'] as const;

const AllPropertiesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [clientCache, setClientCache] = useState<Record<string, string>>({});
  const [employeeCache, setEmployeeCache] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sortKey, setSortKey] = useState<keyof Property | 'clientName' | 'assignedEmployeeName'>('submittedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState<Partial<Property>>({});
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const snap = await getDocs(collection(db, 'employees'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(list);
    };
    fetchEmployees();
  }, []);

  const fetchClientName = useCallback(async (id: string) => {
    if (clientCache[id]) return clientCache[id];
    const snap = await getDoc(doc(db, 'clients', id));
    const name = snap.exists() ? (snap.data() as Client).name : 'Unknown';
    setClientCache(prev => ({ ...prev, [id]: name }));
    return name;
  }, [clientCache]);

  const fetchEmployeeName = useCallback(async (id: string) => {
    if (employeeCache[id]) return employeeCache[id];
    const snap = await getDoc(doc(db, 'employees', id));
    const name = snap.exists() ? (snap.data() as Employee).name : 'Unknown';
    setEmployeeCache(prev => ({ ...prev, [id]: name }));
    return name;
  }, [employeeCache]);


  const getStatusBadgeColor = (status: Property['status']): 'green' | 'yellow' | 'red' | 'gray' => {
    switch (status) {
      case 'Verified': return 'green';
      case 'Pending': return 'yellow';
      case 'Rejected': return 'red';
      default: return 'gray';
    }
  };

  const handleSort = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleEdit = (property: Property) => {
    setEditProperty(property);
    setEditForm({
      name: property.name,
      address: property.address,
      type: property.type,
      status: property.status,
      assignedEmployeeId: property.assignedEmployeeId,
    });
  };

  const handleSave = async () => {
    if (!editProperty || !editForm.name || !editForm.address || !editForm.type || !editForm.status) {
      setError('Please fill in all required fields.');
      return;
    }

    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setError('User not authenticated.');
      return;
    }

    setIsSaving(true);
    try {
      const propertyRef = doc(db, 'properties', editProperty.id);
      const auditLogRef = doc(collection(db, 'platformAuditLogs'));
      const assignmentLogRef = doc(collection(db, 'assignments'));

      await runTransaction(db, async (transaction) => {
  // 1. Read user
        const userSnap = await transaction.get(doc(db, 'users', userId));
        if (!userSnap.exists()) throw new Error('User not found');
        const user = userSnap.data() as { name: string; role: UserRole };

        // 2. If assigning employee, read employee doc FIRST (before any writes)
        let assigneeName = 'None';
        let assigneeId = editForm.assignedEmployeeId || '';
        if (editForm.assignedEmployeeId && editForm.assignedEmployeeId !== editProperty.assignedEmployeeId) {
          const assigneeSnap = await transaction.get(doc(db, 'employees', assigneeId));
          assigneeName = assigneeSnap.exists() ? assigneeSnap.data().name : 'Unknown';
        }

        // 3. Now do writes
        const changes: Record<string, any> = {};
        if (editForm.name !== editProperty.name) changes.name = editForm.name;
        if (editForm.address !== editProperty.address) changes.address = editForm.address;
        if (editForm.type !== editProperty.type) changes.type = editForm.type;
        if (editForm.status !== editProperty.status) changes.status = editForm.status;
        if (editForm.assignedEmployeeId !== editProperty.assignedEmployeeId)
          changes.assignedEmployeeId = editForm.assignedEmployeeId || null;

        if (Object.keys(changes).length > 0) {
          transaction.update(propertyRef, { ...changes, updatedAt: new Date() });

          if ('assignedEmployeeId' in changes) {
            const assignmentLog: AssignmentLog = {
              id: assignmentLogRef.id,
              timestamp: Timestamp.now(),
              assignerId: userId,
              assignerName: user.name,
              assigneeId,
              assigneeName,
              targetType: 'Property',
              targetId: editProperty.id,
              targetDescription: editProperty.name,
              action: editProperty.assignedEmployeeId
                ? (assigneeId ? 'Reassigned' : 'Unassigned')
                : 'Assigned',
              notes: `Changed from ${editProperty.assignedEmployeeId || 'None'} to ${assigneeId || 'None'}`,
            };
            transaction.set(assignmentLogRef, assignmentLog);
          }

          if (Object.keys(changes).length > ('assignedEmployeeId' in changes ? 1 : 0)) {
            const auditLog: AuditLogEntry = {
              id: auditLogRef.id,
              timestamp: Timestamp.now(),
              actorUserId: userId,
              actorUserName: user.name,
              actorUserRole: user.role,
              actorEmail: auth.currentUser?.email || 'unknown',
              actionType: 'property_updated',
              actionDescription: `Updated property ${editProperty.name}`,
              targetEntityType: 'Property',
              targetEntityId: editProperty.id,
              targetEntityDescription: editProperty.name,
              details: Object.fromEntries(Object.entries(changes).filter(([k]) => k !== 'assignedEmployeeId')),
            };
            transaction.set(auditLogRef, auditLog);
          }
        }
      });


      setEditProperty(null);
      setEditForm({});
      setError('');
      setRefreshFlag((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const columns: TableColumn<Property & { clientName?: string; assignedEmployeeName?: string }>[] = [
    { key: 'name', header: 'Property Name', sortable: true, render: p => <span className="font-medium">{p.name}</span> },
    {
      key: 'address', header: 'Address', sortable: true, render: p => (
        <div className="flex items-center">
          {p.type === 'Residential' ? <HomeIcon className="mr-2 text-blue-500" size={18} /> : <Building className="mr-2 text-purple-500" size={18} />}
          {p.address}
        </div>
      )
    },
    { key: 'type', header: 'Type', sortable: true },
    {
      key: 'submittedDate', header: 'Submitted', sortable: true,
      render: p => p.submittedDate?.toDate().toLocaleDateString() ?? 'N/A'
    },
    { key: 'verifiedById', header: 'Verified By', sortable: true, render: p => p.verifiedBy || 'N/A' },
    { key: 'clientName', header: 'Client Name', sortable: true, render: p => p.clientName || 'N/A' },
    { key: 'assignedEmployeeName', header: 'Assigned To', sortable: true, render: p => p.assignedEmployeeName || 'N/A' },
    { key: 'status', header: 'Status', sortable: true, render: p => <Badge color={getStatusBadgeColor(p.status)}>{p.status}</Badge> },
    {
      key: 'actions', header: 'Actions', sortable: false,
      render: (p) => <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Edit size={16} /></Button>
    },
  ];

  const renderSortableHeader = (col: typeof columns[0]) => {
    if (!col.sortable) return col.header;
    // Only allow handleSort for valid sort keys
    const validSortKeys: (keyof Property | 'clientName' | 'assignedEmployeeName')[] = [
      'name', 'address', 'type', 'submittedDate', 'verifiedById', 'clientName', 'assignedEmployeeName', 'status'
    ];
    const isSorted = sortKey === col.key;
    return (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => {
          if (validSortKeys.includes(col.key as any)) {
            handleSort(col.key as keyof Property | 'clientName' | 'assignedEmployeeName');
          }
        }}
      >
        {col.header}
        {isSorted && (sortOrder === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />)}
      </div>
    );
  };

  const additionalConstraints = useMemo(() => {
    const constraints: QueryConstraint[] = [];
    if (startDate) constraints.push(where('submittedDate', '>=', Timestamp.fromDate(startDate)));
    if (endDate) {
      const adjusted = new Date(endDate);
      adjusted.setHours(23, 59, 59, 999);
      constraints.push(where('submittedDate', '<=', Timestamp.fromDate(adjusted)));
    }
    return constraints;
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">All Properties</h1>
        <div className="flex gap-3 items-center flex-wrap">
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search />} />
          <Input type="date" value={startDate ? startDate.toISOString().split('T')[0] : ''} onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)} />
          <Input type="date" value={endDate ? endDate.toISOString().split('T')[0] : ''} onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)} />
          <Button variant="outline" size="sm" onClick={() => setRefreshFlag(prev => prev + 1)}><RefreshCcw size={16} className="mr-1" /> Refresh</Button>
        </div>
      </div>

      <ErrorBoundary>
        <Card>
          <Pagination
            key={refreshFlag}
            collectionPath="properties"
            pageSize={PAGE_SIZE}
            orderByField={sortKey === 'clientName' || sortKey === 'assignedEmployeeName' ? 'submittedDate' : sortKey}
            sortOrder={sortOrder}
            additionalConstraints={additionalConstraints}
            onDataChange={async (docs: Property[]) => {
              return await Promise.all(docs.map(async (d) => ({
                ...d,
                clientName: d.clientId ? await fetchClientName(d.clientId) : 'N/A',
                assignedEmployeeName: d.assignedEmployeeId ? await fetchEmployeeName(d.assignedEmployeeId) : 'N/A'
              })));
            }}
            renderData={(data: (Property & { clientName?: string; assignedEmployeeName?: string })[], isLoading, error) => {
              const filtered = useMemo(() => data.filter(p => {
                const term = searchTerm.toLowerCase();
                return !searchTerm || [p.name, p.address, p.clientName, p.assignedEmployeeName]
                  .some(val => val?.toLowerCase().includes(term));
              }), [data, searchTerm]);

              const sorted = useMemo(() => {
                if (sortKey === 'clientName' || sortKey === 'assignedEmployeeName') {
                  return [...filtered].sort((a, b) => {
                    const aVal = (a as any)[sortKey] || '';
                    const bVal = (b as any)[sortKey] || '';
                    return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                  });
                }
                return filtered;
              }, [filtered, sortKey, sortOrder]);

              return (
                <Table
                  columns={columns.map(col => ({ ...col, header: renderSortableHeader(col) }))}
                  data={sorted}
                  isLoading={isLoading}
                  emptyStateMessage={error || 'No matching properties found.'}
                />
              );
            }}
          />
        </Card>
      </ErrorBoundary>

      {editProperty && (
        <Modal isOpen={true} onClose={() => { setEditProperty(null); setEditForm({}); setError(''); }} title="Edit Property">
          <div className="space-y-4">
            <Input label="Name" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <Input label="Address" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required />
            <Select label="Type" value={editForm.type || ''} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Property['type'] })} options={PROPERTY_TYPES.map(t => ({ label: t, value: t }))} required />
            <Select label="Status" value={editForm.status || ''} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Property['status'] })} options={PROPERTY_STATUSES.map(s => ({ label: s, value: s }))} required />
            <Select label="Assigned Employee" value={editForm.assignedEmployeeId || ''} onChange={(e) => setEditForm({ ...editForm, assignedEmployeeId: e.target.value })} options={[{ label: 'None', value: '' }, ...employees.map(emp => ({ label: emp.name, value: emp.id }))]} />
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEditProperty(null); setEditForm({}); setError(''); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllPropertiesPage;
