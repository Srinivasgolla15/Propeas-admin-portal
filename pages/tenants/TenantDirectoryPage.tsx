import React, { useEffect, useState, useMemo } from 'react';
import { Tenant, Property, TableColumn, UserRole } from '../../types';
import {
  collection,
  onSnapshot,
  addDoc,getDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { Edit, Eye, Trash, UserPlus, Search, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuditLogEntry {
  id: string;
  timestamp: Timestamp;
  actorUserId: string;
  actorUserName: string;
  actorUserRole: UserRole;
  actionType: string;
  actionDescription: string;
  targetEntityType?: string;
  targetEntityId?: string;
  targetEntityDescription?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

const TenantDirectoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: '', email: '', phone: '', propertyId: '', status: 'Prospective',
    rentAmount: 0, moveInDate: new Date().toISOString().split('T')[0],
    leaseEndDate: '', lastPaymentDate: '', securityDeposit: 0
  });
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Function to log audit actions
  const logAuditAction = async (
  userId: string | undefined,
  actionType: string,
  actionDescription: string,
  targetEntityType: string,
  targetEntityId: string,
  targetEntityDescription: string,
  details: Record<string, any> = {}
) => {
  try {
    if (!userId) throw new Error('User ID not found.');

    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) throw new Error('User doc not found.');

    const userData = userSnap.data();
    const auditLog: Omit<AuditLogEntry, 'id'> = {
      timestamp: Timestamp.now(),
      actorUserId: userId,
      actorUserName: userData.name || 'Unknown',
      actorUserRole: userData.role || 'user',
      actionType,
      actionDescription,
      targetEntityType,
      targetEntityId,
      targetEntityDescription,
      details,
      ipAddress: 'unknown'
    };

    await addDoc(collection(db, 'platformAuditLogs'), auditLog);
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
};

  useEffect(() => {
    setIsLoading(true);
    const unsub = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const propertiesData: Property[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[];
      setProperties(propertiesData);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const unsub = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const tenantsData: Tenant[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
      setTenants(tenantsData);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const enrichedTenants = useMemo(() => {
    if (properties.length === 0) return tenants;
    const propertyMap = new Map(properties.map(p => [p.id, p.address]));
    return tenants.map(t => ({
      ...t,
      propertyName: t.propertyId ? propertyMap.get(t.propertyId) || 'N/A' : 'N/A'
    }));
  }, [tenants, properties]);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredTenants(
      enrichedTenants.filter(t =>
        (t.name?.toLowerCase().includes(lower) || '') ||
        (t.email?.toLowerCase().includes(lower) || '') ||
        (t.phone?.toLowerCase().includes(lower) || '') ||
        (t.propertyName?.toLowerCase().includes(lower) || '') ||
        (t.status?.toLowerCase().includes(lower) || '')
      )
    );
  }, [searchTerm, enrichedTenants]);

  const handleOpenModal = (tenant: Tenant | null = null) => {
    setEditingTenant(tenant);
    setFormData(tenant ? {
      name: tenant.name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      propertyId: tenant.propertyId || '',
      status: tenant.status || 'Prospective',
      rentAmount: tenant.rentAmount || 0,
      moveInDate: tenant.moveInDate?.split('T')[0] || '',
      leaseEndDate: tenant.leaseEndDate?.split('T')[0] || '',
      lastPaymentDate: tenant.lastPaymentDate?.split('T')[0] || '',
      securityDeposit: tenant.securityDeposit || 0
    } : {
      name: '', email: '', phone: '', propertyId: '', status: 'Prospective',
      rentAmount: 0, moveInDate: new Date().toISOString().split('T')[0],
      leaseEndDate: '', lastPaymentDate: '', securityDeposit: 0
    });
    setIsModalOpen(true);
    setFeedbackMessage(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTenant(null);
  };

  const handleOpenViewModal = (tenant: Tenant) => {
    setViewingTenant(tenant);
    setIsViewModalOpen(true);
    // Log view action
    logAuditAction(
      currentUser?.id,
      'VIEW_TENANT',
      `Viewed tenant details for ${tenant.name || 'N/A'}`,
      'Tenant',
      tenant.id,
      tenant.name || 'N/A',
      {
        viewedFields: ['name', 'email', 'phone', 'propertyName', 'rentAmount', 'securityDeposit', 'moveInDate', 'leaseEndDate', 'lastPaymentDate', 'status']
      }
    );
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingTenant(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rentAmount' || name === 'securityDeposit' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        // Calculate changed fields for audit log
        const changedFields: Record<string, { old: any; new: any }> = {};
        Object.entries(formData).forEach(([key, newValue]) => {
          const oldValue = editingTenant[key as keyof Tenant];
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changedFields[key] = { old: oldValue, new: newValue };
          }
        });

        const tenantRef = doc(db, 'tenants', editingTenant.id);
        await updateDoc(tenantRef, formData);
        setFeedbackMessage({ type: 'success', message: 'Tenant updated successfully!' });

        // Log update action
        await logAuditAction(
          currentUser?.id,
          'UPDATE_TENANT',
          `Updated tenant ${editingTenant.name || 'N/A'}`,
          'Tenant',
          editingTenant.id,
          editingTenant.name || 'N/A',
          { changedFields }
        );
      } else {
        const newTenantRef = await addDoc(collection(db, 'tenants'), { ...formData, createdAt: new Date() });
        setFeedbackMessage({ type: 'success', message: 'Tenant added successfully!' });

        // Log add action
        await logAuditAction(
          currentUser?.id,
          'ADD_TENANT',
          `Added new tenant ${formData.name || 'N/A'}`,
          'Tenant',
          newTenantRef.id,
          formData.name || 'N/A',
          { newTenantData: formData }
        );
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving tenant:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to save tenant data.' });
    }
  };

  const getStatusBadgeColor = (status?: Tenant['status']) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Prospective': return 'blue';
      case 'Notice Given': return 'yellow';
      case 'Inactive': return 'gray';
      case 'Evicted': return 'red';
      default: return 'gray';
    }
  };

  const tenantStatusOptions: Tenant['status'][] = ['Active', 'Prospective', 'Notice Given', 'Inactive', 'Evicted'];

  const columns: TableColumn<Tenant>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (tenant) => (
        <div className="flex items-center">
          <img
            src={tenant.avatarUrl || `https://ui-avatars.com/api/?name=${tenant.name?.replace(' ', '+') || ''}&background=random&color=fff`}
            alt={tenant.name || 'Unknown'}
            className="w-8 h-8 rounded-full mr-3 object-cover"
          />
          <span className="font-medium">{tenant.name || 'N/A'}</span>
        </div>
      )
    },
    { key: 'email', header: 'Email', render: (t) => t.email || 'N/A' },
    { key: 'phone', header: 'Phone', render: (t) => t.phone || 'N/A' },
    { key: 'propertyName', header: 'Property', render: (t) => t.propertyName || 'N/A' },
    { key: 'rentAmount', header: 'Rent', render: (t) => t.rentAmount != null ? `$${t.rentAmount.toFixed(2)}` : 'N/A' },
    { key: 'moveInDate', header: 'Move-In', render: (t) => t.moveInDate ? new Date(t.moveInDate).toLocaleDateString() : 'N/A' },
    { key: 'leaseEndDate', header: 'Lease End', render: (t) => t.leaseEndDate ? new Date(t.leaseEndDate).toLocaleDateString() : 'N/A' },
    { key: 'lastPaymentDate', header: 'Last Payment', render: (t) => t.lastPaymentDate ? new Date(t.lastPaymentDate).toLocaleDateString() : 'N/A' },
    { key: 'status', header: 'Status', render: (t) => t.status ? <Badge color={getStatusBadgeColor(t.status)}>{t.status}</Badge> : 'N/A' },
    {
      key: 'actions',
      header: 'Actions',
      render: (tenant) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenViewModal(tenant)} title="View Info">
            <Info size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(tenant)} title="Edit Tenant">
            <Edit size={16} />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Tenant Directory</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input type="text" placeholder="Search tenants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search />} className="w-full sm:w-64" />
          <Button variant="primary" leftIcon={<UserPlus size={18} />} onClick={() => handleOpenModal()}>
            Add Tenant
          </Button>
        </div>
      </div>

      {feedbackMessage && (
        <div className={`p-3 rounded-md text-sm flex items-center ${feedbackMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedbackMessage.type === 'success' ? <CheckCircle size={18} className="mr-2" /> : <AlertTriangle size={18} className="mr-2" />}
          {feedbackMessage.message}
        </div>
      )}

      <Card>
        <Table<Tenant> columns={columns} data={filteredTenants} isLoading={isLoading} emptyStateMessage="No tenants found." />
      </Card>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTenant ? 'Edit Tenant' : 'Add New Tenant'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" name="name" value={formData.name || ''} onChange={handleInputChange} required />
              <Input label="Email Address" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} required />
              <Input label="Phone Number" name="phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} />
              <div>
                <label htmlFor="propertyId" className="block text-sm font-medium mb-1">Assign Property</label>
                <select id="propertyId" name="propertyId" value={formData.propertyId || ''} onChange={handleInputChange} required className="block w-full px-3 py-2 border rounded-md text-sm">
                  <option value="" disabled>-- Select a Property --</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                </select>
              </div>
              <Input label="Rent Amount ($)" name="rentAmount" type="number" value={formData.rentAmount || 0} onChange={handleInputChange} required />
              <Input label="Security Deposit ($)" name="securityDeposit" type="number" value={formData.securityDeposit || 0} onChange={handleInputChange} />
              <Input label="Move-in Date" name="moveInDate" type="date" value={formData.moveInDate || ''} onChange={handleInputChange} required />
              <Input label="Lease End Date" name="leaseEndDate" type="date" value={formData.leaseEndDate || ''} onChange={handleInputChange} />
              <Input label="Last Payment Date" name="lastPaymentDate" type="date" value={formData.lastPaymentDate || ''} onChange={handleInputChange} />
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
                <select id="status" name="status" value={formData.status || 'Prospective'} onChange={handleInputChange} className="block w-full px-3 py-2 border rounded-md text-sm">
                  {tenantStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" variant="primary" leftIcon={<UserPlus size={16} />}>
                {editingTenant ? 'Save Changes' : 'Add Tenant'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isViewModalOpen && viewingTenant && (
        <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Tenant Details" size="lg">
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src={viewingTenant.avatarUrl || `https://ui-avatars.com/api/?name=${viewingTenant.name?.replace(' ', '+') || ''}&background=random&color=fff`}
                alt={viewingTenant.name || 'Unknown'}
                className="w-12 h-12 rounded-full mr-3 object-cover"
              />
              <h2 className="text-xl font-semibold">{viewingTenant.name || 'N/A'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="text-sm">{viewingTenant.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Phone</label>
                <p className="text-sm">{viewingTenant.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Property</label>
                <p className="text-sm">{viewingTenant.propertyName || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Rent Amount</label>
                <p className="text-sm">{viewingTenant.rentAmount != null ? `$${viewingTenant.rentAmount.toFixed(2)}` : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Security Deposit</label>
                <p className="text-sm">{viewingTenant.securityDeposit != null ? `$${viewingTenant.securityDeposit.toFixed(2)}` : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Move-in Date</label>
                <p className="text-sm">{viewingTenant.moveInDate ? new Date(viewingTenant.moveInDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Lease End Date</label>
                <p className="text-sm">{viewingTenant.leaseEndDate ? new Date(viewingTenant.leaseEndDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Last Payment Date</label>
                <p className="text-sm">{viewingTenant.lastPaymentDate ? new Date(viewingTenant.lastPaymentDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <Badge color={getStatusBadgeColor(viewingTenant.status)}>{viewingTenant.status || 'N/A'}</Badge>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="secondary" onClick={handleCloseViewModal}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TenantDirectoryPage;