import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, getDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ServicePackage, TableColumn } from '../../types';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { PlusCircle, Edit, ToggleLeft, ToggleRight, CheckCircle, AlertTriangle, IndianRupee } from 'lucide-react';
import { formatINR } from '../../utils/currencyUtils';

const ServicePackagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [formData, setFormData] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    features: [],
    tier: 'Standard',
    isActive: true,
  });
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        targetEntityType: 'ServicePackage',
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

  const loadPackages = useCallback(async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const snapshot = await getDocs(collection(db, 'servicePackages'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ServicePackage[];
      setPackages(data);
    } catch (error) {
      console.error('Failed to fetch service packages:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to load service packages.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleOpenModal = (pkg: ServicePackage | null = null) => {
    setEditingPackage(pkg);
    setFormData(pkg ? { ...pkg } : {
      name: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      features: [],
      tier: 'Standard',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
    setFeedbackMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'features') {
      setFormData(prev => ({ ...prev, features: value.split(',').map(f => f.trim()).filter(f => f) }));
    } else if (name === 'price') {
      setFormData(prev => ({ ...prev, price: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingPackage) {
        const docRef = doc(db, 'servicePackages', editingPackage.id);
        await updateDoc(docRef, formData);
        setFeedbackMessage({ type: 'success', message: 'Service package updated successfully!' });

        await logAuditAction(
          currentUser?.id,
          'UPDATE_SERVICE_PACKAGE',
          `Updated package ${editingPackage.name}`,
          editingPackage.id,
          editingPackage.name,
          { updatedFields: formData }
        );
      } else {
        const docRef = await addDoc(collection(db, 'servicePackages'), formData);
        setFeedbackMessage({ type: 'success', message: 'Service package added successfully!' });

        await logAuditAction(
          currentUser?.id,
          'ADD_SERVICE_PACKAGE',
          `Added package ${formData.name}`,
          docRef.id,
          formData.name || 'Unnamed Package',
          { newPackage: formData }
        );
      }
      await loadPackages();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save service package:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to save service package.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActiveStatus = async (pkg: ServicePackage) => {
    try {
      const docRef = doc(db, 'servicePackages', pkg.id);
      await updateDoc(docRef, { isActive: !pkg.isActive });

      await logAuditAction(
        currentUser?.id,
        'TOGGLE_SERVICE_PACKAGE_STATUS',
        `Toggled status for package ${pkg.name} to ${!pkg.isActive ? 'Active' : 'Inactive'}`,
        pkg.id,
        pkg.name,
        { previousStatus: pkg.isActive, newStatus: !pkg.isActive }
      );

      await loadPackages();
    } catch (error) {
      console.error('Failed to toggle package status:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to toggle package status.' });
    }
  };

  const columns: TableColumn<ServicePackage>[] = [
    { key: 'name', header: 'Name', render: p => <span className="font-medium">{p.name}</span> },
    { key: 'price', header: 'Price', render: p => formatINR(p.price, 2) },
    { key: 'billingCycle', header: 'Billing Cycle' },
    { key: 'features', header: 'Features', render: p => p.features.join(', ') },
    { key: 'isActive', header: 'Status', render: p => <Badge color={p.isActive ? 'green' : 'red'}>{p.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: pkg => (
        <div className="space-x-1">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(pkg)} title="Edit Package">
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleActiveStatus(pkg)} title={pkg.isActive ? 'Deactivate' : 'Activate'}>
            {pkg.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-red-500" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Manage Service Packages</h1>
        <Button variant="primary" leftIcon={<PlusCircle size={18} />} onClick={() => handleOpenModal()}>
          Add New Package
        </Button>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3 my-4 rounded-md text-sm flex items-center ${
            feedbackMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50'
          }`}
        >
          {feedbackMessage.type === 'success' ? <CheckCircle size={18} className="mr-2" /> : <AlertTriangle size={18} className="mr-2" />}
          {feedbackMessage.message}
        </div>
      )}

      <Card>
        <Table<ServicePackage>
          columns={columns}
          data={packages}
          isLoading={isLoading}
          emptyStateMessage="No service packages found. Add one to get started."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPackage ? 'Edit Service Package' : 'Add New Service Package'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Package Name" name="name" value={formData.name || ''} onChange={handleInputChange} required />

          <label htmlFor="description" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-2 border rounded-md bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600"
          />

          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-4 w-4 text-foreground/70 dark:text-dark-foreground/70" />
              </div>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price || ''}
                onChange={handleInputChange}
                placeholder="999.00"
                min="0"
                step="0.01"
                className="w-full pl-8"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="billingCycle" className="block text-sm font-medium mb-1">Billing Cycle</label>
            <select
              id="billingCycle"
              name="billingCycle"
              value={formData.billingCycle || 'monthly'}
              onChange={handleInputChange}
              className="w-full p-2 rounded border bg-background dark:bg-dark-card"
            >
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
              <option value="one-time">One-Time</option>
            </select>
          </div>

          <div>
            <label htmlFor="tier" className="block text-sm font-medium mb-1">Tier</label>
            <select
              id="tier"
              name="tier"
              value={formData.tier || 'Standard'}
              onChange={handleInputChange}
              className="w-full p-2 rounded border bg-background dark:bg-dark-card"
            >
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <Input
            label="Features (comma-separated)"
            name="features"
            value={(formData.features || []).join(', ')}
            onChange={handleInputChange}
            placeholder="Feature 1, Feature 2"
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive ?? true}
              onChange={handleInputChange}
              className="h-4 w-4"
            />
            <label htmlFor="isActive" className="ml-2 text-sm">Active Package</label>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {editingPackage ? 'Save Changes' : 'Create Package'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServicePackagesPage;