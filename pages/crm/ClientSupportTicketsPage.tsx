import React, { useEffect, useState, useCallback } from 'react';
import {
  ClientTicket, ClientTicketCategory, ClientTicketPriority, ClientTicketStatus,
  TableColumn, UserRole, Client, User
} from '../../types';
import {
  getFirestore, collection, getDocs, addDoc, getDoc, updateDoc, doc, query, where,
  Timestamp, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { Edit, PlusCircle, Search, LifeBuoy, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const db = getFirestore();
const auth = getAuth();

const ClientSupportTicketsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<ClientTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ClientTicket[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ClientTicketStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | ClientTicketPriority>('All');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('All');
  const [selectedTicket, setSelectedTicket] = useState<ClientTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view' | 'edit' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [summaryData, setSummaryData] = useState<{ open: number; highPriorityOpen: number; resolvedToday: number } | null>(null);

  const initialFormData: Partial<ClientTicket> = {
    clientId: '',
    title: '',
    description: '',
    category: ClientTicketCategory.Other,
    priority: ClientTicketPriority.Medium,
    status: ClientTicketStatus.Open,
    assignedToId: '',
  };
  const [formData, setFormData] = useState<Partial<ClientTicket>>(initialFormData);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setFeedbackMessage(null);

    // Fetch clients and users once with getDocs
    Promise.all([
      getDocs(collection(db, 'clients')),
      getDocs(query(collection(db, 'users'), where('role', 'in', [UserRole.Sales, UserRole.Admin, UserRole.SuperAdmin])))
    ])
      .then(([clientSnap, usersSnap]) => {
        const clientsData: Client[] = clientSnap.docs.map(d => {
          const data = d.data();
          return {
            id: data.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            servicePackageId: data.servicePackageId || '',
            address: data.address || '',
            createdAt: data.createdAt as Timestamp,
            updatedAt: data.updatedAt as Timestamp,
            status: data.status || '',
            notes: data.notes || '',
            assignedAdmin: data.assignedAdmin || '',
            propertyId: data.propertyId || '',
            propertyCount: data.propertyCount ?? 0,
            propertyLimit: data.propertyLimit ?? 0,
            subscriptionStatus: data.subscriptionStatus || 'inactive',
            joinedDate: data.joinedDate as Timestamp,
            properties: data.properties ?? [],
          };
        });

        const usersData: User[] = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as User[];

        setClients(clientsData);
        setAssignableUsers(usersData);
      })
      .catch(err => {
        console.error('Failed to load clients or users', err);
        setFeedbackMessage({ type: 'error', message: 'Failed to load client or user data.' });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Real-time listener for tickets
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'clientTickets'), (snapshot) => {
      try {
        const ticketsData: ClientTicket[] = snapshot.docs.map(d => {
          const data: any = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? '',
            updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() ?? '',
          };
        });

        const today = new Date();
        const isSameDay = (iso: string) => {
          const d = new Date(iso);
          return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
        };
        const open = ticketsData.filter(t => t.status === ClientTicketStatus.Open).length;
        const highPriorityOpen = ticketsData.filter(t => t.status === ClientTicketStatus.Open && [ClientTicketPriority.High, ClientTicketPriority.Urgent].includes(t.priority)).length;
        const resolvedToday = ticketsData.filter(t => t.status === ClientTicketStatus.Resolved && isSameDay(t.updatedAt)).length;

        setTickets(ticketsData);
        setSummaryData({ open, highPriorityOpen, resolvedToday });
      } catch (err) {
        console.error('Failed to process ticket snapshot', err);
        setFeedbackMessage({ type: 'error', message: 'Failed to load ticket data.' });
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Snapshot error:', error);
      setFeedbackMessage({ type: 'error', message: 'Error listening to ticket updates.' });
      setIsLoading(false);
    });

    // Fetch clients and users once
    loadData();

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [loadData]);

  useEffect(() => {
    let result = tickets;
    if (statusFilter !== 'All') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'All') result = result.filter(t => t.priority === priorityFilter);
    if (assignedToFilter !== 'All') result = result.filter(t => t.assignedToId === assignedToFilter);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(t => (t.title??'').toLowerCase().includes(s) || (t.clientName??'').toLowerCase().includes(s) || (t.description??'').toLowerCase().includes(s) || (t.id??'').toLowerCase().includes(s));
    }
    setFilteredTickets(result);
  }, [tickets, searchTerm, statusFilter, priorityFilter, assignedToFilter]);

  const getStatusBadgeColor = (status: ClientTicketStatus) => {
    switch (status) {
      case ClientTicketStatus.Open: return 'blue';
      case ClientTicketStatus.InProgress: return 'yellow';
      case ClientTicketStatus.PendingClient: return 'purple';
      case ClientTicketStatus.Resolved: return 'green';
      case ClientTicketStatus.Closed: return 'gray';
      default: return 'gray';
    }
  };
  const getPriorityBadgeColor = (priority: ClientTicketPriority) => {
    switch (priority) {
      case ClientTicketPriority.Urgent: return 'red';
      case ClientTicketPriority.High: return 'yellow';
      case ClientTicketPriority.Medium: return 'blue';
      case ClientTicketPriority.Low: return 'gray';
      default: return 'gray';
    }
  };

  const handleOpenModal = (ticket: ClientTicket | null, mode: 'add' | 'view' | 'edit') => {
    setSelectedTicket(ticket);
    setModalMode(mode);
    if (mode === 'add') {
      setFormData({ ...initialFormData, assignedToId: currentUser?.id || '' });
    } else if (ticket) {
      setFormData({ ...ticket });
    }
    setIsModalOpen(true);
    setFeedbackMessage(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setModalMode(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const client = clients.find(c => c.id === formData.clientId);
    const assignee = assignableUsers.find(u => u.id === formData.assignedToId);
    const payload: any = {
      clientId: formData.clientId || '',
      clientName: client?.name || 'Unknown Client',
      title: formData.title || '',
      description: formData.description || '',
      category: formData.category || ClientTicketCategory.Other,
      priority: formData.priority || ClientTicketPriority.Medium,
      status: formData.status || ClientTicketStatus.Open,
      assignedToId: formData.assignedToId || null,
      assignedToName: assignee?.name || (formData.assignedToId ? 'User Not Found' : null),
      resolutionNotes: formData.resolutionNotes || null,
      updatedById: currentUser.id,
      updatedByName: currentUser.name || currentUser.email || 'Unknown',
      updatedAt: serverTimestamp()
    };

    setIsLoading(true);
    try {
      if (modalMode === 'add') {
        if (!payload.clientId || !payload.title || !payload.description) {
          setFeedbackMessage({ type: 'error', message: 'Client, Title and Description are required.' });
          setIsLoading(false);
          return;
        }
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'clientTickets'), payload);
        setFeedbackMessage({ type: 'success', message: 'New support ticket logged successfully!' });
      } else if (modalMode === 'edit' && selectedTicket) {
        await updateDoc(doc(db, 'clientTickets', selectedTicket.id), payload);
        setFeedbackMessage({ type: 'success', message: 'Ticket updated successfully!' });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save ticket:", error);
      setFeedbackMessage({ type: 'error', message: (error as Error).message || 'Failed to save ticket data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket || !currentUser) return;

    try {
      const ticketRef = doc(db, 'clientTickets', selectedTicket.id);
      const userDoc = await getDoc(doc(db, 'users', currentUser.id));
      const userData = userDoc.exists() ? userDoc.data() as { name: string; email: string; role: string } : null;

      const updatedData = {
        priority: selectedTicket.priority,
        status: selectedTicket.status,
        assignedToId: selectedTicket.assignedToId || null,
        updatedById: currentUser.id,
        updatedByName: userData?.name || currentUser.name || currentUser.email || 'Unknown',
        updatedAt: serverTimestamp()
      };

      const originalTicket = tickets.find(t => t.id === selectedTicket.id);
      if (!originalTicket) throw new Error('Original ticket not found');
      const changes: string[] = [];
      if (originalTicket.priority !== updatedData.priority) {
        changes.push(`priority from "${originalTicket.priority}" to "${updatedData.priority}"`);
      }
      if (originalTicket.status !== updatedData.status) {
        changes.push(`status from "${originalTicket.status}" to "${updatedData.status}"`);
      }
      if (originalTicket.assignedToId !== updatedData.assignedToId) {
        const oldUser = assignableUsers.find(u => u.id === originalTicket.assignedToId)?.name || 'Unassigned';
        const newUser = assignableUsers.find(u => u.id === updatedData.assignedToId)?.name || 'Unassigned';
        changes.push(`assignedTo from "${oldUser}" to "${newUser}"`);
      }
      const actionDescription = changes.length > 0
        ? `Updated ticket ${selectedTicket.title || selectedTicket.id}: changed ${changes.join(', ')}`
        : `Updated ticket ${selectedTicket.title || selectedTicket.id} with no significant changes`;

      await updateDoc(ticketRef, updatedData);

      await addDoc(collection(db, 'platformAuditLogs'), {
        timestamp: new Date(),
        actorUserId: currentUser.id,
        actorUserName: userData?.name || currentUser.name || 'Unknown',
        actorUserEmail: userData?.email || currentUser.email || 'Unknown',
        actorUserRole: userData?.role || currentUser.role || 'Unknown',
        actionType: 'UPDATE_TICKET',
        actionDescription,
        targetEntityType: 'ClientTicket',
        targetEntityDescription: selectedTicket.title || selectedTicket.id,
        targetEntityId: selectedTicket.id,
        context: 'Platform Audit',
        details: {
          old: {
            priority: originalTicket.priority,
            status: originalTicket.status,
            assignedToId: originalTicket.assignedToId || null,
          },
          new: {
            priority: updatedData.priority,
            status: updatedData.status,
            assignedToId: updatedData.assignedToId || null,
          }
        }
      });

      toast.success('Ticket updated successfully');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  };

  const columns: TableColumn<ClientTicket>[] = [
    { key: 'id', header: 'ID', render: t => <span className="text-xs font-mono">{t.id.substring(0, 8)}...</span> },
    { key: 'title', header: 'Title', render: t => <span className="font-medium">{t.title}</span> },
    { key: 'clientName', header: 'Client' },
    { key: 'category', header: 'Category' },
    { key: 'priority', header: 'Priority', render: t => <Badge color={getPriorityBadgeColor(t.priority)}>{t.priority}</Badge> },
    { key: 'status', header: 'Status', render: t => <Badge color={getStatusBadgeColor(t.status)}>{t.status}</Badge> },
    { key: 'assignedToName', header: 'Assigned To', render: t => t.assignedToName || 'Unassigned' },
    { key: 'updatedAt', header: 'Last Updated', render: t => new Date(t.updatedAt).toLocaleDateString() },
    {
      key: 'actions', header: 'Actions', render: (ticket) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(ticket, 'view')}
            title="View Ticket Info"
          >
            <Info size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(ticket, 'edit')}
            title="Edit Ticket"
          >
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Client Support Tickets</h1>
        <Button variant="primary" leftIcon={<PlusCircle size={18} />} onClick={() => handleOpenModal(null, 'add')}>
          Log New Ticket
        </Button>
      </div>

      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Open Tickets" className="text-center">
            <LifeBuoy size={32} className="mx-auto text-blue-500 dark:text-blue-400 mb-2" />
            <p className="text-3xl font-bold">{summaryData.open}</p>
          </Card>
          <Card title="High/Urgent Priority Open" className="text-center">
            <AlertTriangle size={32} className="mx-auto text-red-500 dark:text-red-400 mb-2" />
            <p className="text-3xl font-bold">{summaryData.highPriorityOpen}</p>
          </Card>
          <Card title="Resolved Today" className="text-center">
            <CheckCircle size={32} className="mx-auto text-green-500 dark:text-green-400 mb-2" />
            <p className="text-3xl font-bold">{summaryData.resolvedToday}</p>
          </Card>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-secondary dark:border-dark-secondary/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            label="Search Tickets"
            type="text"
            placeholder="ID, Title, Client, Description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search />}
            className="w-full"
          />
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">Status</label>
            <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="block w-full p-2 border rounded-md shadow-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600">
              <option value="All">All Statuses</option>
              {Object.values(ClientTicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="priorityFilter" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">Priority</label>
            <select id="priorityFilter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)} className="block w-full p-2 border rounded-md shadow-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600">
              <option value="All">All Priorities</option>
              {Object.values(ClientTicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="assignedToFilter" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">Assigned To</label>
            <select id="assignedToFilter" value={assignedToFilter} onChange={(e) => setAssignedToFilter(e.target.value)} className="block w-full p-2 border rounded-md shadow-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600">
              <option value="All">All Users</option>
              <option value="">Unassigned</option>
              {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <Table<ClientTicket>
          columns={columns}
          data={filteredTickets}
          isLoading={isLoading}
          emptyStateMessage="No support tickets match your criteria."
        />
      </Card>

      {isModalOpen && (modalMode === 'add' || (selectedTicket && (modalMode === 'view' || modalMode === 'edit'))) && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={modalMode === 'add' ? 'Log New Ticket' : modalMode === 'edit' ? 'Edit Ticket' : 'Ticket Info'}
        >
          {modalMode === 'add' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {feedbackMessage && (
                <p className={`text-sm ${feedbackMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                  {feedbackMessage.message}
                </p>
              )}
              <div>
                <label className="block text-sm font-medium">Client</label>
                <select
                  aria-label='Select Client'
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Title</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter ticket title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  aria-label='Ticket Description'
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Category</label>
                <select
                  aria-label='Select Category'
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                >
                  {Object.values(ClientTicketCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Priority</label>
                <select
                  aria-label='Select Priority'
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                >
                  {Object.values(ClientTicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  aria-label='Select Status'
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                >
                  {Object.values(ClientTicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Assigned To</label>
                <select
                  aria-label='Select User'
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit" variant="primary">Submit</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Subject</label>
                <input
                  aria-label='Ticket Title'
                  type="text"
                  value={selectedTicket?.title ?? ''}
                  className="w-full border rounded p-2"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Priority</label>
                <select
                  aria-label='Select Ticket Priority'
                  className="w-full border rounded p-2"
                  value={selectedTicket?.priority}
                  disabled={modalMode === 'view'}
                  onChange={(e) =>
                    setSelectedTicket(prev => prev ? { ...prev, priority: e.target.value as ClientTicketPriority } : prev)
                  }
                >
                  {Object.values(ClientTicketPriority).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  aria-label='Select Ticket Status'
                  className="w-full border rounded p-2"
                  value={selectedTicket?.status}
                  disabled={modalMode === 'view'}
                  onChange={(e) =>
                    setSelectedTicket(prev => prev ? { ...prev, status: e.target.value as ClientTicketStatus } : prev)
                  }
                >
                  {Object.values(ClientTicketStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Assigned To</label>
                <select
                  aria-label='Select User'
                  className="w-full border rounded p-2"
                  value={selectedTicket?.assignedToId || ''}
                  disabled={modalMode === 'view'}
                  onChange={(e) =>
                    setSelectedTicket(prev => prev ? { ...prev, assignedToId: e.target.value } : prev)
                  }
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              {modalMode === 'edit' && (
                <div className="flex justify-end">
                  <Button onClick={handleUpdateTicket}>Update Ticket</Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default ClientSupportTicketsPage;