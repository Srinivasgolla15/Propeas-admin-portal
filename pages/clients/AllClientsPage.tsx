import React, { useEffect, useState, useCallback } from 'react';
import {
  collection, query, limit, startAfter, endBefore, onSnapshot,
  where, getDocs, getDoc, doc, DocumentReference, updateDoc, addDoc, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import {
  Client, Property, ServicePackage, User, TableColumn, Subscription,
} from '../../types';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Info, Edit, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/Popover';
import { toast } from '../../components/ui/Toast'; // Assume a toast component for notifications

const PAGE_SIZE = 3;

const AllClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [firstVisibleDoc, setFirstVisibleDoc] = useState<any>(null);
  const [isPageEnd, setIsPageEnd] = useState(false);
  const [isPageStart, setIsPageStart] = useState(true);
  const [clientUnsubscribe, setClientUnsubscribe] = useState<() => void>(() => () => {});
  const [subscriptionUnsubscribes, setSubscriptionUnsubscribes] = useState<(() => void)[]>([]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [clientProperties, setClientProperties] = useState<Property[]>([]);
  const [assignedAdmins, setAssignedAdmins] = useState<User[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [allServicePackages, setAllServicePackages] = useState<ServicePackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionMap, setSubscriptionMap] = useState<Record<string, Subscription[]>>({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Log action to platformAuditLogs
  const logAuditAction = async (actionType: string, clientId: string, details?: Record<string, any>) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('No authenticated user found for audit logging');
        return;
      }

      // Fetch user role from users collection
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      await addDoc(collection(db, 'platformAuditLogs'), {
        actionType,
        clientId,
        actorUserId: user.uid,
        actorUserEmail: user.email || 'unknown',
        actorUserName: user.displayName || userData.name || 'Unknown User',
        actorUserRole: userData.role || 'unknown',
        timestamp: serverTimestamp(),
        details: details || {},
      });
    } catch (err) {
      console.error('Failed to log audit action:', err);
      toast.error('Failed to log action. Please try again.');
    }
  };

  useEffect(() => {
    const fetchAllServicePackages = async () => {
      try {
        const q = query(collection(db, 'servicePackages'));
        const unsub = onSnapshot(q, (snap) => {
          const packages = snap.docs.map(d => ({ ...(d.data() as ServicePackage), id: d.id }));
          setAllServicePackages(packages);
        });
        return () => unsub();
      } catch (err) {
        console.error('Failed to fetch service packages:', err);
        setError('Failed to load service packages.');
        toast.error('Failed to load service packages.');
      }
    };
    fetchAllServicePackages();
  }, []);

  const computeClientSubscriptionStatus = (subscriptions: Subscription[]): Client['subscriptionStatus'] => {
    if (!subscriptions.length) return 'Inactive';
    if (subscriptions.some(sub => sub.status === 'Active')) return 'Active';
    if (subscriptions.some(sub => sub.status === 'Inactive')) return 'Inactive';
    if (subscriptions.every(sub => sub.status === 'Cancelled')) return 'Cancelled';
    return 'Inactive';
  };

  const loadPage = useCallback(async (direction: 'next' | 'prev' = 'next') => {
    setIsLoading(true);
    setError(null);

    let q = query(collection(db, 'clients'), limit(PAGE_SIZE));
    if (direction === 'next' && lastVisibleDoc) {
      q = query(collection(db, 'clients'), startAfter(lastVisibleDoc), limit(PAGE_SIZE));
    } else if (direction === 'prev' && firstVisibleDoc) {
      q = query(collection(db, 'clients'), endBefore(firstVisibleDoc), limit(PAGE_SIZE));
    }

    if (clientUnsubscribe) clientUnsubscribe();
    subscriptionUnsubscribes.forEach(unsub => unsub());

    const unsubClients = onSnapshot(q, async (snapshot) => {
      try {
        const data = snapshot.docs.map(doc => ({ ...(doc.data() as Client), id: doc.id }));
        setClients(data);
        setFilteredClients(data);
        setFirstVisibleDoc(snapshot.docs[0] || null);
        setLastVisibleDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setIsPageEnd(snapshot.docs.length < PAGE_SIZE);
        setIsPageStart(!firstVisibleDoc);

        const ids = data.map(c => c.id).filter(id => !id.startsWith('<')); // Exclude placeholders
        let subsMap: Record<string, Subscription[]> = {};
        let unsubs: (() => void)[] = [];

        if (ids.length > 0) {
          const chunkArray = (arr: string[], size: number) =>
            arr.reduce((chunks, item, i) => {
              if (i % size === 0) chunks.push([]);
              chunks[Math.floor(i / size)].push(item);
              return chunks;
            }, [] as string[][]);

          const idChunks = chunkArray(ids, 10);
          const updatedClientPackages: Record<string, string[]> = {};
          const updatedClientStatuses: Record<string, Client['subscriptionStatus']> = {};

          for (const chunk of idChunks) {
            const subQuery = query(collection(db, 'subscriptions'), where('clientId', 'in', chunk));
            const unsub = onSnapshot(subQuery, async (subSnap) => {
              const batch = writeBatch(db);
              subSnap.docs.forEach(d => {
                const sub = { ...(d.data() as Subscription), id: d.id };
                if (!subsMap[sub.clientId]) subsMap[sub.clientId] = [];
                subsMap[sub.clientId].push(sub);

                // Populate clientRef if missing
                if (!sub.clientRef) {
                  batch.update(d.ref, { clientRef: doc(db, 'clients', sub.clientId) });
                }

                if (sub.status === 'Active') {
                  if (!updatedClientPackages[sub.clientId]) updatedClientPackages[sub.clientId] = [];
                  updatedClientPackages[sub.clientId].push(sub.servicePackageId);
                }
              });

              for (const clientId in subsMap) {
                updatedClientStatuses[clientId] = computeClientSubscriptionStatus(subsMap[clientId]);
              }

              setSubscriptionMap({ ...subsMap });

              // Batch update clients
              for (const client of data) {
                const activePackages = updatedClientPackages[client.id] || [];
                const existingPackages = client.servicePackages || [];
                const newStatus = updatedClientStatuses[client.id] || 'Inactive';
                const currentStatus = client.subscriptionStatus || 'Inactive';

                const isPackagesDifferent =
                  activePackages.length !== existingPackages.length ||
                  activePackages.some(pkg => !existingPackages.includes(pkg));
                const isStatusDifferent = newStatus !== currentStatus;

                if (isPackagesDifferent || isStatusDifferent) {
                  const updateData: Partial<Client> = {};
                  if (isPackagesDifferent) updateData.servicePackages = activePackages;
                  if (isStatusDifferent) updateData.subscriptionStatus = newStatus;
                  batch.update(doc(db, 'clients', client.id), updateData);
                }
              }

              await batch.commit().catch(err => {
                console.error('Batch update failed:', err);
                setError('Failed to sync client data.');
                toast.error('Failed to sync client data.');
              });
            });
            unsubs.push(unsub);
          }

          setSubscriptionUnsubscribes(unsubs);
        } else {
          subsMap = {};
          setSubscriptionMap(subsMap);
          setSubscriptionUnsubscribes([]);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading clients or subscriptions:', error);
        setError('Failed to load data. Please try again.');
        toast.error('Failed to load data.');
        setIsLoading(false);
      }
    });

    setClientUnsubscribe(() => unsubClients);
  }, [lastVisibleDoc, firstVisibleDoc, clientUnsubscribe, subscriptionUnsubscribes]);

  useEffect(() => {
    loadPage('next');
    return () => {
      clientUnsubscribe();
      subscriptionUnsubscribes.forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    setFilteredClients(
      term
        ? clients.filter(
            c =>
              c.name?.toLowerCase().includes(term) ||
              c.email?.toLowerCase().includes(term) ||
              c.phone?.toLowerCase().includes(term)
          )
        : clients
    );
  }, [searchTerm, clients]);

  const handleViewClient = async (client: Client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
    await logAuditAction('VIEW_CLIENT', client.id, { clientName: client.name });
    try {
      setError(null);
      setSubscriptions(subscriptionMap[client.id] || []);

      if (client.properties?.length) {
        // Filter out placeholder or invalid property IDs
        const validProperties = client.properties.filter(id => id && !id.startsWith('<'));
        if (validProperties.length === 0) {
          setClientProperties([]);
          return;
        }

        const propSnapshot = await getDocs(
          query(collection(db, 'properties'), where('__name__', 'in', validProperties))
        );
        const props = propSnapshot.docs.map(d => ({ ...(d.data() as Property), id: d.id }));
        setClientProperties(props);

        const propertyRefs = props.map(p => doc(db, 'properties', p.id));
        const assignmentSnapshot = await getDocs(
          query(
            collection(db, 'assignments'),
            where('propertyRef', 'in', propertyRefs),
            where('status', '==', 'assigned')
          )
        );

        const employeeRefs = Array.from(
          new Set(assignmentSnapshot.docs.map(d => (d.data().employeeRef as DocumentReference).path))
        );

        const employees: User[] = [];
        for (const refPath of employeeRefs) {
          const empRef = doc(db, refPath);
          const empSnap = await getDoc(empRef);
          if (empSnap.exists()) {
            employees.push({ ...(empSnap.data() as User), id: empSnap.id });
          }
        }
        setAssignedAdmins(employees);
      }

      const packagesSnapshot = await getDocs(
        query(collection(db, 'servicePackages'), where('__name__', 'in', client.servicePackages ?? []))
      );
      const packages = packagesSnapshot.docs.map(d => ({
        ...(d.data() as ServicePackage),
        id: d.id
      }));
      setServicePackages(packages);
    } catch (error) {
      console.error('View client error:', error);
      setError('Failed to load client details.');
      toast.error('Failed to load client details.');
    }
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedClient(null);
    setClientProperties([]);
    setAssignedAdmins([]);
    setServicePackages([]);
    setSubscriptions([]);
    setError(null);
  };

  const handleEditClient = (client: Client) => {
    setEditClient(client);
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!editClient) return;
    try {
      const updates = {
        name: editClient.name,
        phone: editClient.phone,
        email: editClient.email || null,
      };
      await updateDoc(doc(db, 'clients', editClient.id), updates);
      await logAuditAction('EDIT_CLIENT', editClient.id, {
        clientName: editClient.name,
        updatedFields: Object.keys(updates),
      });
      setIsEditModalOpen(false);
      toast.success('Client updated successfully.');
    } catch (err) {
      console.error('Update failed:', err);
      setError('Failed to update client.');
      toast.error('Failed to update client.');
    }
  };

  const columns: TableColumn<Client>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'subscriptionStatus',
      header: 'Status',
      render: (c: Client) => (
        <Badge color={c.subscriptionStatus === 'Active' ? 'green' : 'yellow'}>
          {c.subscriptionStatus}
        </Badge>
      ),
    },
    {
      key: 'servicePackages',
      header: 'Subscriptions',
      render: (c: Client) => {
        const subs = subscriptionMap[c.id] || [];
        if (!subs.length) return 'N/A';
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto">
                {subs.length} Subscription{subs.length > 1 ? 's' : ''}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <ul className="space-y-1">
                {subs.map(sub => (
                  <li key={sub.id} className="text-sm">
                    {sub.servicePackageName} ({sub.billingCycle})
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        );
      },
    },
    {
      key: 'properties',
      header: 'Properties',
      render: (c: Client) => c.properties?.length ?? 0,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Client) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewClient(c)}>
            <Info size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEditClient(c)}>
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Clients</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search />}
          />
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <Table
        columns={columns}
        data={filteredClients}
        isLoading={isLoading}
        emptyStateMessage="No clients found."
      />

      <div className="flex justify-end mt-6 space-x-2">
        <Button onClick={() => loadPage('prev')} disabled={isPageStart}>
          ← Prev
        </Button>
        <Button onClick={() => loadPage('next')} disabled={isPageEnd}>
          Next →
        </Button>
      </div>

      {selectedClient && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleCloseModal}
          title={`Client: ${selectedClient.name}`}
        >
          <div className="space-y-2">
            <p><strong>Email:</strong> {selectedClient.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {selectedClient.phone}</p>
            <p><strong>Location:</strong> {selectedClient.location || 'N/A'}</p>
            <p><strong>Status:</strong> {selectedClient.subscriptionStatus}</p>
            <p>
              <strong>Joined:</strong> {selectedClient.joinedDate?.toDate().toLocaleDateString() || 'N/A'}
            </p>
            <div>
              <strong>Subscriptions:</strong>
              {subscriptions.length > 0 ? (
                <ul className="list-disc ml-5 space-y-2">
                  {subscriptions.map(sub => (
                    <li key={sub.id}>
                      <strong>{sub.servicePackageName}</strong> ({sub.billingCycle})<br />
                      Status: {sub.status}<br />
                      Price: ${sub.priceAtSubscription.toLocaleString()}<br />
                      Start: {sub.startDate?.toDate().toLocaleDateString() || 'N/A'}<br />
                      Renews: {sub.renewsOn?.toDate().toLocaleDateString() || 'N/A'}<br />
                      Created: {sub.createdAt?.toDate().toLocaleDateString() || 'N/A'}<br />
                      Description: {sub.description || 'N/A'}<br />
                      {sub.highlight && <span className="text-yellow-500">Highlighted</span>}
                      {sub.imageUrl && <img src={sub.imageUrl} alt="Subscription" className="mt-1 max-w-xs" />}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No subscriptions found.</p>
              )}
            </div>
            <div>
              <strong>Assigned Employees:</strong>
              {assignedAdmins.length > 0 ? (
                <ul className="list-disc ml-5">
                  {assignedAdmins.map(admin => (
                    <li key={admin.id}>{admin.name} ({admin.email})</li>
                  ))}
                </ul>
              ) : (
                'N/A'
              )}
            </div>
            <div>
              <strong>Properties:</strong>
              {clientProperties.length > 0 ? (
                <ul className="list-disc ml-5 space-y-1">
                  {clientProperties.map(p => (
                    <li key={p.id}>
                      {p.address} – {p.type} – {p.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No properties assigned.</p>
              )}
            </div>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <div className="mt-4 text-right">
            <Button onClick={handleCloseModal}>Close</Button>
          </div>
        </Modal>
      )}

      {editClient && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Client: ${editClient.name}`}
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={editClient.name}
              onChange={e => setEditClient({ ...editClient, name: e.target.value })}
            />
            <Input
              label="Phone"
              value={editClient.phone}
              onChange={e => setEditClient({ ...editClient, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={editClient.email || ''}
              onChange={e => setEditClient({ ...editClient, email: e.target.value })}
            />
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <div className="mt-4 text-right">
            <Button variant="primary" onClick={handleUpdateClient}>
              Save Changes
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllClientsPage;