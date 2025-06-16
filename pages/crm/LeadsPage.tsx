import React, { useEffect, useState, useCallback } from 'react';
import {
  collection, getDocs, doc, updateDoc, getDoc, addDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Lead, TableColumn, CallbackRequest, User, ServicePackage
} from '../../types';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import {
  Edit3, PlusCircle, Search, Filter, Target,
  PhoneForwarded, UserPlus, UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LeadsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callbackRequests, setCallbackRequests] = useState<CallbackRequest[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Lead['status']>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    clientName: string;
    email: string;
    phone: string;
    status: Lead['status'];
    serviceInterest: string;
    assignedToId: string;
    notes: string;
  }>({
    clientName: '',
    email: '',
    phone: '',
    status: 'New',
    serviceInterest: '',
    assignedToId: '',
    notes: ''
  });
  const [summary, setSummary] = useState({ total: 0, new: 0, qualified: 0 });

  const fetchCallbackRequests = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'callbackrequests'));
    const data: CallbackRequest[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallbackRequest));
    setCallbackRequests(data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const map: Record<string, User> = {};
    snapshot.docs.forEach(doc => {
      const user = { id: doc.id, ...doc.data() } as User;
      if (user.role === 'Sales Team' || user.role === 'Admin') {
        map[user.id] = user;
      }
    });
    setUsersMap(map);
  }, []);

  const fetchServicePackages = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'servicePackages'));
    const packages: ServicePackage[] = [];
    snapshot.docs.forEach(doc => {
      const pkg = { id: doc.id, ...doc.data() } as ServicePackage;
      packages.push(pkg);
    });
    setServicePackages(packages);
  }, []);

  const fetchLeadsFromFirestore = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'leads'));
      const leadsList: Lead[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadsList);
      const newCount = leadsList.filter(lead => lead.status === 'New').length;
      const qualifiedCount = leadsList.filter(lead => lead.status === 'Qualified').length;
      setSummary({ total: leadsList.length, new: newCount, qualified: qualifiedCount });
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadsFromFirestore();
    fetchUsers();
    fetchCallbackRequests();
    fetchServicePackages();
  }, [fetchLeadsFromFirestore, fetchUsers, fetchCallbackRequests, fetchServicePackages]);

  useEffect(() => {
    let result = leads;
    if (statusFilter !== 'All') {
      result = result.filter(lead => lead.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(lead =>
        (lead.clientName ?? '').toLowerCase().includes(lower) ||
        (lead.email ?? '').toLowerCase().includes(lower) ||
        (lead.serviceInterest ?? '').toLowerCase().includes(lower)
      );
    }
    setFilteredLeads(result);
  }, [searchTerm, statusFilter, leads]);

  const handleOpenEditModal = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setEditFormData({
      clientName: lead.clientName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      status: lead.status || 'New',
      serviceInterest: lead.serviceInterest || '',
      assignedToId: lead.assignedToId || '',
      notes: lead.notes || ''
    });
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedLead(null);
    setEditFormData({
      clientName: '',
      email: '',
      phone: '',
      status: 'New',
      serviceInterest: '',
      assignedToId: '',
      notes: ''
    });
  }, []);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmUpdate = async () => {
    if (!selectedLead || !currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.id));
      const userData = userDoc.exists() ? (userDoc.data() as User) : null;

      const serviceSnapshot = await getDocs(collection(db, 'servicePackages'));
      let servicePackageId: string | null = null;
      serviceSnapshot.forEach(pkgDoc => {
        const pkg = pkgDoc.data() as ServicePackage;
        if (pkg.name === editFormData.serviceInterest) {
          servicePackageId = pkgDoc.id;
        }
      });

      const updatedData = {
        clientName: editFormData.clientName,
        email: editFormData.email,
        phone: editFormData.phone,
        status: editFormData.status,
        serviceInterest: editFormData.serviceInterest,
        servicePackageId: servicePackageId || '',
        assignedToId: editFormData.assignedToId,
        notes: editFormData.notes,
        lastContacted: new Date().toISOString()
      };

      await updateDoc(doc(db, 'leads', selectedLead.id), updatedData);

      // Generate detailed audit log description
      const changes: string[] = [];
      if (selectedLead.clientName !== editFormData.clientName) {
        changes.push(`clientName from "${selectedLead.clientName}" to "${editFormData.clientName}"`);
      }
      if (selectedLead.email !== editFormData.email) {
        changes.push(`email from "${selectedLead.email}" to "${editFormData.email}"`);
      }
      if (selectedLead.phone !== editFormData.phone) {
        changes.push(`phone from "${selectedLead.phone || 'None'}" to "${editFormData.phone || 'None'}"`);
      }
      if (selectedLead.status !== editFormData.status) {
        changes.push(`status from "${selectedLead.status}" to "${editFormData.status}"`);
      }
      if (selectedLead.serviceInterest !== editFormData.serviceInterest) {
        changes.push(`serviceInterest from "${selectedLead.serviceInterest || 'None'}" to "${editFormData.serviceInterest || 'None'}"`);
      }
      if (selectedLead.assignedToId !== editFormData.assignedToId) {
        const oldUser = usersMap[selectedLead.assignedToId || '']?.name || 'Unassigned';
        const newUser = usersMap[editFormData.assignedToId || '']?.name || 'Unassigned';
        changes.push(`assignedTo from "${oldUser}" to "${newUser}"`);
      }
      if (selectedLead.notes !== editFormData.notes) {
        changes.push(`notes updated`);
      }
      const actionDescription = changes.length > 0
        ? `Updated lead ${selectedLead.clientName}: changed ${changes.join(', ')}`
        : `Updated lead ${selectedLead.clientName} with no significant changes`;

      await addDoc(collection(db, 'platformAuditLogs'), {
        timestamp: new Date(),
        actorUserId: currentUser.id,
        actorUserName: userData?.name || 'Unknown',
        actorUserEmail: userData?.email || 'Unknown',
        actorUserRole: userData?.role || 'Unknown',
        actionType: 'UPDATE_LEAD',
        actionDescription,
        targetEntityType: 'Lead',
        targetEntityDescription: selectedLead.clientName,
        targetEntityId: selectedLead.id,
        context: 'Platform Audit',
        details: {
          old: {
            clientName: selectedLead.clientName,
            email: selectedLead.email,
            phone: selectedLead.phone,
            status: selectedLead.status,
            serviceInterest: selectedLead.serviceInterest,
            assignedToId: selectedLead.assignedToId,
            notes: selectedLead.notes
          },
          new: {
            clientName: editFormData.clientName,
            email: editFormData.email,
            phone: editFormData.phone,
            status: editFormData.status,
            serviceInterest: editFormData.serviceInterest,
            assignedToId: editFormData.assignedToId,
            notes: editFormData.notes
          }
        }
      });

      await fetchLeadsFromFirestore();
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      handleCloseEditModal();
    }
  };

  const getStatusBadgeColor = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'blue';
      case 'Contacted': return 'yellow';
      case 'Qualified': return 'purple';
      case 'Proposal Sent': return 'gray';
      case 'Converted': return 'green';
      case 'Dropped': return 'red';
      default: return 'gray';
    }
  };

  const leadStatusOptions: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Dropped'];

  const columns: TableColumn<Lead>[] = [
    { key: 'clientName', header: 'Lead Name', render: lead => <span className="font-medium">{lead.clientName || 'Unnamed Lead'}</span> },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', render: r => <span>{r.phone || '-'}</span> },
    {
      key: 'serviceInterest',
      header: 'Service Interest',
      render: lead => {
        const name = servicePackages.find(pkg => pkg.id === lead.id)?.name || lead.serviceInterest || 'N/A';
        return <span>{name}</span>;
      }
    },
    {
      key: 'assignedToId',
      header: 'Assigned To',
      render: lead => {
        const user = usersMap[lead.assignedToId || ''];
        return user ? (
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        ) : <span className="text-gray-400 italic">Unassigned</span>;
      }
    },
    {
      key: 'lastContacted',
      header: 'Last Contacted',
      render: lead => lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString() : '—'
    },
    {
      key: 'status',
      header: 'Status',
      render: lead => <Badge color={getStatusBadgeColor(lead.status)}>{lead.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      render: lead => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(lead)} title="Update Lead">
          <Edit3 size={16} />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads Dashboard</h1>
        <Button leftIcon={<UserPlus size={18} />} onClick={() => alert('Add New Lead form not implemented.')}>Add New Lead</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Leads"><div className="flex justify-between"><p className="text-3xl font-bold">{summary.total}</p><Target size={28} className="text-blue-500" /></div></Card>
        <Card title="New Leads"><div className="flex justify-between"><p className="text-3xl font-bold">{summary.new}</p><UserPlus size={28} className="text-green-500" /></div></Card>
        <Card title="Qualified Leads"><div className="flex justify-between"><p className="text-3xl font-bold">{summary.qualified}</p><UserCheck size={28} className="text-purple-500" /></div></Card>
      </div>

      <Card>
        <div className="p-4 flex gap-4 items-center border-b">
          <Input
            type="text"
            placeholder="Search by Name, Email, Service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search />}
            className="w-full"
          />
          <div className="relative">
            <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
            <select
              id="statusFilter"
              title="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full pl-3 pr-10 py-2 text-sm border rounded-md"
            >
              <option value="All">All Statuses</option>
              {leadStatusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div className="absolute right-2 top-2 text-gray-400 pointer-events-none">
              <Filter size={16} />
            </div>
          </div>
        </div>
        <Table columns={columns} data={filteredLeads} isLoading={isLoading} emptyStateMessage="No leads found." />
      </Card>

      {selectedLead && isEditModalOpen && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Update Lead: ${selectedLead.clientName || 'Unnamed Lead'}`}>
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmUpdate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client Name</label>
              <Input
                name="clientName"
                value={editFormData.clientName}
                onChange={handleEditFormChange}
                placeholder="Enter client name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditFormChange}
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                name="phone"
                value={editFormData.phone}
                onChange={handleEditFormChange}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                aria-label="Status"
                name="status"
                value={editFormData.status}
                onChange={handleEditFormChange}
                className="w-full border rounded px-3 py-2"
              >
                {leadStatusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service of Interest</label>
              <select
                aria-label="Service of Interest"
                name="serviceInterest"
                value={editFormData.serviceInterest}
                onChange={handleEditFormChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select a service package</option>
                {servicePackages.map(pkg => (
                  <option key={pkg.id} value={pkg.name}>{pkg.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assigned To</label>
              <select
                aria-label="Assigned To"
                name="assignedToId"
                value={editFormData.assignedToId}
                onChange={handleEditFormChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Unassigned</option>
                {Object.values(usersMap).map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                aria-label="Notes"
                name="notes"
                rows={4}
                value={editFormData.notes}
                onChange={handleEditFormChange}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleCloseEditModal}>Cancel</Button>
              <Button type="submit" variant="primary" leftIcon={<PhoneForwarded size={16} />}>Update Lead</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LeadsPage;