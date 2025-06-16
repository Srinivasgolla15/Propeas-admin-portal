import React, { useEffect, useState, useCallback } from 'react';
import { CallbackRequest, User, TableColumn, UserRole } from '../../types';
import { db } from '../../services/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
} from 'firebase/firestore';

import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

import {
  Info,
  Edit,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CallbackRequestsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<CallbackRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CallbackRequest[]>([]);
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CallbackRequest['status']>('All');

  const [selectedRequest, setSelectedRequest] = useState<CallbackRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'view' | 'update'>('view');
  const [updateFormData, setUpdateFormData] = useState<Partial<CallbackRequest>>({});
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
      if (!userDoc.exists()) throw new Error('User doc not found');
      const userData = userDoc.data();

      const log = {
        timestamp: new Date(),
        actorUserId: userId,
        actorUserName: userData.name || 'Unknown',
        actorUserRole: userData.role || 'user',
        actionType,
        actionDescription,
        targetEntityType: 'CallbackRequest',
        targetEntityId,
        targetEntityDescription,
        details,
        ipAddress: 'unknown'
      };

      await addDoc(collection(db, 'platformAuditLogs'), log);
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const [reqSnap, userSnap] = await Promise.all([
        getDocs(collection(db, 'callbackRequests')),
        getDocs(collection(db, 'users')),
      ]);

      const requestsData: CallbackRequest[] = reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallbackRequest));
      const usersData: User[] = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

      setRequests(requestsData);
      setSalesUsers(usersData.filter(u =>
        [UserRole.Sales, UserRole.Admin, UserRole.SuperAdmin].includes(u.role)
      ));
    } catch (error) {
      console.error('Error loading data:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to load callback requests or users.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let result = requests;
    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r =>
        (r.clientName??'').toLowerCase().includes(lower) ||
        (r.phone??'').toLowerCase().includes(lower)||
        (r.email??'').toLowerCase().includes(lower)||
        (r.serviceInterest??'').toLowerCase().includes(lower)
      );
    }
    setFilteredRequests(result);
  }, [requests, searchTerm, statusFilter]);

  const handleOpenModal = useCallback((req: CallbackRequest, action: 'view' | 'update') => {
    setSelectedRequest(req);
    setModalAction(action);
    if (action === 'update') {
      setUpdateFormData({
        status: req.status,
        assignedToId: req.assignedToId || '',
        notes: req.notes || '',
      });
    }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setFeedbackMessage(null);
  }, []);

  const handleUpdateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmUpdate = async () => {
    if (!selectedRequest) return;
    setIsLoading(true);
    try {
      const updateData: Partial<CallbackRequest> = { ...updateFormData };
      const ref = doc(db, 'callbackRequests', selectedRequest.id);
      await updateDoc(ref, updateData);

      await logAuditAction(
        currentUser?.id,
        'UPDATE_CALLBACK_REQUEST',
        `Updated callback request for ${selectedRequest.clientName}`,
        selectedRequest.id,
        selectedRequest.clientName,
        updateData
      );
      // ✅ If status is 'Converted', move to 'leads' collection
    if (updateData.status === 'ConvertedtoLead') {
      const callbackDoc = await getDoc(ref);
      const callbackData = callbackDoc.data();
      if (callbackData) {
        // Prepare lead data
        const leadData = {
          ...callbackData,
          source: 'Callback Request',
          convertedAt: new Date(),
          status: 'New', 
        };

        // Add to leads collection
        await addDoc(collection(db, 'leads'), leadData);

        // Optional: remove from callbackRequests (comment this if you want to keep it)
        // await deleteDoc(ref);
      }
    }


      setFeedbackMessage({ type: 'success', message: 'Request updated successfully.' });
      await loadData();
    } catch (error) {
      console.error('Update error:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to update request.' });
    } finally {
      setIsLoading(false);
      handleCloseModal();
    }
  };

  const getStatusBadgeColor = (status: string): 'green' | 'blue' | 'yellow' | 'red' | 'gray' => {
    switch (status) {
      case 'New': return 'blue';
      case 'Contacted': return 'yellow';
      case 'Unreached': return 'gray';
      case 'Dropped': return 'red';
      case 'ConvertedtoLead': return 'green';
      default: return 'gray';
    }
  };

  const callbackStatusOptions: CallbackRequest['status'][] = ['New', 'Contacted', 'Unreached', 'Dropped', 'ConvertedtoLead'];

  const columns: TableColumn<CallbackRequest>[] = [
    { key: 'clientName', header: 'Client Name', render: r => <span className="font-medium">{r.clientName}</span> },
    { key: 'phone', header: 'Phone' },
    {
      key: 'email',
      header: 'ClientEmail',
      render: r => <span>{r.email || '-'}</span>
    },
    {
      key: 'requestedTime',
      header: 'Requested Time',
      render: r => {
        if (!r.requestedTime) return '-';
        if (typeof r.requestedTime === 'string') {
          const date = new Date(r.requestedTime);
          return isNaN(date.getTime()) ? r.requestedTime : date.toLocaleString();
        }
        if (
          r.requestedTime &&
          typeof r.requestedTime === 'object' &&
          typeof (r.requestedTime as { toDate?: () => Date }).toDate === 'function'
        ) {
          return (r.requestedTime as { toDate: () => Date }).toDate().toLocaleString();
        }
        return '-';
      },
    },
    { key: 'assignedToId', header: 'Assigned To', render: r => salesUsers.find(u => u.id === r.assignedToId)?.name || 'Unassigned' },
    { key: 'status', header: 'Status', render: r => <Badge color={getStatusBadgeColor(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: req => (
        <div className="space-x-1">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(req, 'view')} title="View Details">
            <Info size={16} />
          </Button>
          {req.status !== 'ConvertedtoLead' && (
            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(req, 'update')} title="Edit Callback">
              <Edit size={16} />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Callback Requests</h1>
      </div>

      {feedbackMessage && (
        <div className={`p-3 rounded-md text-sm flex items-center ${feedbackMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {feedbackMessage.type === 'success' ? <CheckCircle className="mr-2" /> : <AlertTriangle className="mr-2" />}
          {feedbackMessage.message}
        </div>
      )}

      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center border-b">
          <Input
            type="text"
            placeholder="Search by Name or Phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search />}
            className="w-full sm:flex-grow"
          />
          <select
            aria-label='Filter by Status'
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as CallbackRequest['status'] | 'All')}
            className="border p-2 rounded-md"
          >
            <option value="All">All Statuses</option>
            {callbackStatusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <Table columns={columns} data={filteredRequests} isLoading={isLoading && !requests.length} emptyStateMessage="No callback requests found." />
      </Card>

      {/* View Modal */}
      {selectedRequest && modalAction === 'view' && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Callback Request Details" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Detail label="Client Name" value={selectedRequest.clientName} />
              <Detail label="Phone" value={selectedRequest.phone} />
              <Detail label="Email" value={selectedRequest.email || '-'} />
              <Detail label="Service Interest" value={selectedRequest.serviceInterest || '-'} />
              <Detail
                label="Requested Time"
                value={
                  typeof selectedRequest.requestedTime === 'string'
                    ? new Date(selectedRequest.requestedTime).toLocaleString()
                    : (selectedRequest.requestedTime &&
                        typeof selectedRequest.requestedTime === 'object' &&
                        typeof (selectedRequest.requestedTime as { toDate?: () => Date }).toDate === 'function'
                      )
                      ? (selectedRequest.requestedTime as { toDate: () => Date }).toDate().toLocaleString()
                      : '-'
                }
              />
              <Detail label="Assigned To" value={salesUsers.find(u => u.id === selectedRequest.assignedToId)?.name || 'Unassigned'} />
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <Badge color={getStatusBadgeColor(selectedRequest.status)}>{selectedRequest.status}</Badge>
              </div>
            </div>
            {selectedRequest.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                <p className="text-base">{selectedRequest.notes}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {selectedRequest && modalAction === 'update' && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Update Callback Request">
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmUpdate(); }} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
              aria-label='Status'
                name="status"
                value={updateFormData.status}
                onChange={handleUpdateFormChange}
                className="w-full p-2 border rounded"
              >
                {callbackStatusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Assign To</label>
              <select
              aria-label='Assign To'
                name="assignedToId"
                value={updateFormData.assignedToId}
                onChange={handleUpdateFormChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Unassigned</option>
                {salesUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
              aria-label='Notes'
                name="notes"
                rows={3}
                value={updateFormData.notes}
                onChange={handleUpdateFormChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" variant="primary">Update</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-500">{label}</h4>
    <p className="text-base">{value}</p>
  </div>
);

export default CallbackRequestsPage;
