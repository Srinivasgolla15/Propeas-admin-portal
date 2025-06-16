import React, { useEffect, useState } from 'react';
import { Client, Subscription, ServicePackage, TableColumn } from '../../types';
import { db } from '../../services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PlusCircle, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';

const ClientSubscriptionsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);

  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubPackageId, setNewSubPackageId] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load clients and service packages on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingClients(true);
        setIsLoadingPackages(true);

        const clientsSnapshot = await getDocs(collection(db, 'clients'));
        const packagesSnapshot = await getDocs(query(collection(db, 'servicePackages'), where('isActive', '==', true)));

        setClients(clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[]);
        setServicePackages(packagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServicePackage[]);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setFeedbackMessage({ type: 'error', message: 'Failed to load clients or service packages.' });
      } finally {
        setIsLoadingClients(false);
        setIsLoadingPackages(false);
      }
    };

    loadInitialData();
  }, []);

  // Load subscriptions when selected client changes
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!selectedClientId) {
        setSubscriptions([]);
        return;
      }

      setIsLoadingSubscriptions(true);
      setFeedbackMessage(null);
      try {
        const subSnap = await getDocs(query(collection(db, 'subscriptions'), where('clientId', '==', selectedClientId)));
        setSubscriptions(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subscription[]);
        console.log("Loaded subscriptions:", subSnap.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Failed to load subscriptions:", error);
        setFeedbackMessage({ type: 'error', message: 'Failed to load subscriptions.' });
      } finally {
        setIsLoadingSubscriptions(false);
      }
    };

    loadSubscriptions();
  }, [selectedClientId]);

  // Add subscription handler
  const handleAddSubscription = async () => {
    if (!selectedClientId || !newSubPackageId) {
      setFeedbackMessage({ type: 'error', message: 'Please select a client and a service package.' });
      return;
    }

    const selectedPackage = servicePackages.find(p => p.id === newSubPackageId);
    const client = clients.find(c => c.id === selectedClientId);

    if (!selectedPackage || !client) {
      setFeedbackMessage({ type: 'error', message: 'Selected package or client not found.' });
      return;
    }

    setIsLoadingSubscriptions(true);
    setFeedbackMessage(null);

    try {
      const now = new Date();

      // Add subscription document with all required fields
      await addDoc(collection(db, 'subscriptions'), {
        clientId: selectedClientId,
        clientName: client.name,
        servicePackageId: selectedPackage.id,
        servicePackageName: selectedPackage.name,
        priceAtSubscription: selectedPackage.price,
        billingCycle: selectedPackage.billingCycle,
        status: 'Active',
        startDate: Timestamp.fromDate(now),
        renewsOn: Timestamp.fromDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
        tier: selectedPackage.tier ?? '',
        imageUrl: selectedPackage.imageUrl ?? '',
        highlight: selectedPackage.highlight ?? false,
        description: selectedPackage.description ?? '',
        createdAt: Timestamp.now()
      });

      setFeedbackMessage({ type: 'success', message: 'Subscription added successfully!' });

      // Refresh subscriptions list immediately after add
      const updatedSubs = await getDocs(query(collection(db, 'subscriptions'), where('clientId', '==', selectedClientId)));
      setSubscriptions(updatedSubs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subscription[]);
    } catch (error: any) {
      console.error("Failed to add subscription:", error);
      if (error.code === 'permission-denied') {
        setFeedbackMessage({ type: 'error', message: 'Permission denied. Check your Firestore rules and user role claims.' });
      } else {
        setFeedbackMessage({ type: 'error', message: 'Failed to add subscription.' });
      }
    } finally {
      setIsLoadingSubscriptions(false);
      setIsAddModalOpen(false);
      setNewSubPackageId('');
    }
  };

  // Cancel subscription handler
  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!window.confirm("Are you sure you want to cancel this subscription?")) return;

    setIsLoadingSubscriptions(true);
    setFeedbackMessage(null);

    try {
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'Cancelled',
      });
      setFeedbackMessage({ type: 'success', message: 'Subscription cancelled.' });

      const updatedSubs = await getDocs(query(collection(db, 'subscriptions'), where('clientId', '==', selectedClientId)));
      setSubscriptions(updatedSubs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subscription[]);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      setFeedbackMessage({ type: 'error', message: 'Failed to cancel subscription.' });
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  // Map subscription status to badge color
  const getStatusBadgeColor = (status: Subscription['status']) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Pending Activation': return 'blue';
      case 'PastDue': return 'yellow';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  const columns: TableColumn<Subscription>[] = [
    { key: 'servicePackageName', header: 'Package', render: s => <span className="font-medium">{s.servicePackageName}</span> },
    { key: 'priceAtSubscription', header: 'Price', render: s => `$${s.priceAtSubscription.toFixed(2)} (${s.billingCycle})` },
    {
      key: 'startDate',
      header: 'Start Date',
      render: s => new Date((s.startDate as any)?.toDate?.() ?? s.startDate).toLocaleDateString()
    },
    {
      key: 'renewsOn',
      header: 'Renews/Ends On',
      render: s => {
        const renews = (s.renewsOn as any)?.toDate?.() ?? s.renewsOn;
        const end = (s.endDate as any)?.toDate?.() ?? s.endDate;
        return renews ? new Date(renews).toLocaleDateString() : end ? new Date(end).toLocaleDateString() : 'N/A';
      }
    },
    { key: 'status', header: 'Status', render: s => <Badge color={getStatusBadgeColor(s.status)}>{s.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (sub) => (
        <div className="space-x-1">
          {sub.status === 'Active' && (
            <Button variant="danger" size="sm" onClick={() => handleCancelSubscription(sub.id)} leftIcon={<XCircle size={14} />}>Cancel</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Client Subscription Management</h1>

      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-grow">
            <label htmlFor="client" className="block text-sm font-medium mb-1">Select Client</label>
            <select
              id="client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="block w-full sm:w-96 px-3 py-2 border rounded-md text-sm"
              disabled={isLoadingClients || isLoadingPackages}
            >
              <option value="" disabled>-- Select a Client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<PlusCircle size={18} />}
            disabled={!selectedClientId || isLoadingPackages}
            className="mt-2 sm:mt-6"
          >
            Add Subscription
          </Button>
        </div>

        {feedbackMessage && (
          <div className={`p-3 m-4 rounded-md text-sm flex items-center ${feedbackMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {feedbackMessage.type === 'success' ? <CheckCircle size={18} className="mr-2" /> : <AlertTriangle size={18} className="mr-2" />}
            {feedbackMessage.message}
          </div>
        )}

        {selectedClientId ? (
          <Table<Subscription>
            columns={columns}
            data={subscriptions}
            isLoading={isLoadingSubscriptions}
            emptyStateMessage="No subscriptions found for this client."
          />
        ) : (
          <p className="p-6 text-center text-gray-500">Please select a client to view their subscriptions.</p>
        )}
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Subscription" size="md">
        <div className="space-y-4">
          <div>
            <label htmlFor="servicePackage" className="block text-sm font-medium mb-1">Service Package</label>
            <select
              id="servicePackage"
              value={newSubPackageId}
              onChange={(e) => setNewSubPackageId(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="" disabled>-- Select a Package --</option>
              {servicePackages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>{pkg.name} (${pkg.price}/{pkg.billingCycle})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddSubscription} isLoading={isLoadingSubscriptions}>Add Subscription</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ClientSubscriptionsPage;
