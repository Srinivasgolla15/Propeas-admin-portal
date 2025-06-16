import React, { useEffect, useState, useCallback } from 'react';
import { ServiceInquiry, TableColumn, Lead } from '../../types';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { Info, Edit, Search, Filter, CheckSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  addDoc,
  getDoc,
} from 'firebase/firestore';

const ServiceInquiriesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [enquiries, setEnquiries] = useState<ServiceInquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<ServiceInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ServiceInquiry['status']>('All');

  const [selectedEnquiry, setSelectedEnquiry] = useState<ServiceInquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'view' | 'updateStatus'>('view');
  const [updateFormData, setUpdateFormData] = useState<{ status: ServiceInquiry['status']; notes: string }>({ status: 'New', notes: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'serviceInquiries'));
      const fetchedData: ServiceInquiry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceInquiry[];
      setEnquiries(fetchedData);
    } catch (error) {
      console.error("Failed to fetch service enquiries:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  useEffect(() => {
    let result = enquiries;
    if (statusFilter !== 'All') {
      result = result.filter(enquiry => enquiry.status === statusFilter);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(enquiry =>
        (enquiry.inquirerName || '').toLowerCase().includes(lowerSearch) ||
        (enquiry.inquirerEmail || '').toLowerCase().includes(lowerSearch) ||
        (enquiry.serviceInterest || '').toLowerCase().includes(lowerSearch) ||
        (enquiry.message || '').toLowerCase().includes(lowerSearch)
      );
    }
    setFilteredEnquiries(result);
  }, [searchTerm, statusFilter, enquiries]);

  const handleOpenModal = useCallback((enquiry: ServiceInquiry, action: 'view' | 'updateStatus') => {
    setSelectedEnquiry(enquiry);
    setModalAction(action);
    if (action === 'updateStatus') {
      setUpdateFormData({ status: enquiry.status, notes: enquiry.notes || '' });
    }
    setErrorMessage(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEnquiry(null);
    setErrorMessage(null);
  }, []);

  const handleUpdateFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({ ...prev, [name]: value as ServiceInquiry['status'] | string }));
  };

  const handleConfirmUpdate = async () => {
    if (!selectedEnquiry || !currentUser) return;
    try {
      // Fetch current user data for audit log
      const userDoc = await getDoc(doc(db, 'users', currentUser.id));
      const userData = userDoc.exists() ? userDoc.data() as { name: string; email: string; role: string } : null;

      // Prepare enquiry update
      const enquiryRef = doc(db, 'serviceInquiries', selectedEnquiry.id);
      const updatedEnquiryData = {
        status: updateFormData.status,
        notes: updateFormData.notes.trim() || null,
        updatedBy: {
          id: currentUser.id,
          name: userData?.name || currentUser.name || 'Unknown',
          role: userData?.role || currentUser.role || 'Unknown',
        },
        updatedAt: Timestamp.now(),
      };

      // Track changes for audit log
      const changes: string[] = [];
      if (selectedEnquiry.status !== updatedEnquiryData.status) {
        changes.push(`status from "${selectedEnquiry.status}" to "${updatedEnquiryData.status}"`);
      }
      if ((selectedEnquiry.notes || '') !== (updatedEnquiryData.notes || '')) {
        changes.push(`notes updated`);
      }
      const actionDescription = changes.length > 0
        ? `Updated inquiry ${selectedEnquiry.inquirerName || 'Unknown'}: changed ${changes.join(', ')}`
        : `Updated inquiry ${selectedEnquiry.inquirerName || 'Unknown'} with no significant changes`;

      // Update enquiry in Firestore
      await updateDoc(enquiryRef, updatedEnquiryData);

      // Log enquiry update
      await addDoc(collection(db, 'platformAuditLogs'), {
        timestamp: new Date(),
        actorUserId: currentUser.id,
        actorUserName: userData?.name || currentUser.name || 'Unknown',
        actorUserEmail: userData?.email || currentUser.email || 'Unknown',
        actorUserRole: userData?.role || currentUser.role || 'Unknown',
        actionType: 'UPDATE_INQUIRY',
        actionDescription,
        targetEntityType: 'ServiceInquiry',
        targetEntityDescription: selectedEnquiry.inquirerName || 'Unknown',
        targetEntityId: selectedEnquiry.id,
        context: 'Platform Audit',
        details: {
          old: {
            status: selectedEnquiry.status,
            notes: selectedEnquiry.notes || '',
          },
          new: {
            status: updatedEnquiryData.status,
            notes: updatedEnquiryData.notes || '',
          }
        }
      });

      // If status is changed to ConvertedToLead, create a new lead
      if (updateFormData.status === 'ConvertedToLead') {
        // Validate required fields
        if (!selectedEnquiry.inquirerName?.trim()) {
          setErrorMessage('Inquirer name is required to convert to a lead.');
          return;
        }
        if (!selectedEnquiry.inquirerEmail?.trim()) {
          setErrorMessage('Inquirer email is required to convert to a lead.');
          return;
        }

        const leadData: Lead = {
          id: '', // Will be generated by Firestore
          clientName: selectedEnquiry.inquirerName.trim() || 'Unknown',
          email: selectedEnquiry.inquirerEmail.trim(),
          phone: selectedEnquiry.inquirerPhone?.trim() || '',
          serviceInterest: selectedEnquiry.serviceInterest || '',
          status: 'New',
          lastContacted: new Date().toISOString(),
          assignedTo: userData?.name || currentUser.name || 'Unassigned',
          assignedToId: currentUser.id || '',
          notes: updateFormData.notes || selectedEnquiry.notes || '',
        };

        const leadDocRef = await addDoc(collection(db, 'leads'), {
          ...leadData,
          createdAt: Timestamp.now(),
        });

        // Log lead creation
        await addDoc(collection(db, 'platformAuditLogs'), {
          timestamp: new Date(),
          actorUserId: currentUser.id,
          actorUserName: userData?.name || currentUser.name || 'Unknown',
          actorUserEmail: userData?.email || currentUser.email || 'Unknown',
          actorUserRole: userData?.role || currentUser.role || 'Unknown',
          actionType: 'CONVERT_TO_LEAD',
          actionDescription: `Converted inquiry ${selectedEnquiry.inquirerName || 'Unknown'} to lead ${leadData.clientName}`,
          targetEntityType: 'Lead',
          targetEntityDescription: leadData.clientName,
          targetEntityId: leadDocRef.id,
          context: 'Platform Audit',
          details: {
            inquiry: {
              id: selectedEnquiry.id,
              inquirerName: selectedEnquiry.inquirerName || 'Unknown',
              status: selectedEnquiry.status,
            },
            lead: {
              clientName: leadData.clientName,
              email: leadData.email,
              phone: leadData.phone,
              serviceInterest: leadData.serviceInterest,
              status: leadData.status,
              assignedToId: leadData.assignedToId,
              notes: leadData.notes,
            }
          }
        });
      }

      await loadEnquiries();
    } catch (error) {
      console.error("Failed to update enquiry:", error);
      setErrorMessage(`Error updating enquiry from ${selectedEnquiry.inquirerName || 'Unknown'}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (!errorMessage) {
        handleCloseModal();
      }
    }
  };

  const getStatusBadgeColor = (status: ServiceInquiry['status']): 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'gray' => {
    switch (status) {
      case 'New': return 'blue';
      case 'Contacted': return 'yellow';
      case 'Resolved': return 'green';
      case 'ConvertedToLead': return 'purple';
      case 'Archived': return 'gray';
      default: return 'gray';
    }
  };

  const enquiryStatusOptions: ServiceInquiry['status'][] = ['New', 'Contacted', 'Resolved', 'ConvertedToLead', 'Archived'];

  const columns: TableColumn<ServiceInquiry>[] = [
    { key: 'inquirerName', header: 'Enquirer Name', render: (i) => <span className="font-medium">{i.inquirerName || 'Unknown'}</span> },
    { key: 'inquirerEmail', header: 'Email' },
    { key: 'serviceInterest', header: 'Service Interest' },
    { key: 'receivedAt', header: 'Received', render: (i) => new Date(i.receivedAt).toLocaleDateString() },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <Badge color={getStatusBadgeColor(i.status)}>{i.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (enquiry) => (
        <div className="space-x-1">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(enquiry, 'view')} title="View">
            <Info size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(enquiry, 'updateStatus')} title="Update">
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const filterStatusOptions: { value: 'All' | ServiceInquiry['status'], label: string }[] = [
    { value: 'All', label: 'All Statuses' },
    ...enquiryStatusOptions.map(s => ({ value: s, label: s }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Service Enquiries</h1>
      </div>

      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center border-b border-secondary">
          <Input
            type="text"
            placeholder="Search enquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search />}
            className="w-full sm:flex-grow"
          />
          <div className="relative w-full sm:w-auto">
            <select
              aria-label='Filter by status'
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | ServiceInquiry['status'])}
              className="block w-full pl-3 pr-10 py-2 border rounded-md"
            >
              {filterStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter size={16} />
            </div>
          </div>
        </div>
        <Table<ServiceInquiry>
          columns={columns}
          data={filteredEnquiries}
          isLoading={isLoading}
          emptyStateMessage="No service enquiries match your criteria."
        />
      </Card>

      {selectedEnquiry && isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={modalAction === 'view' ? `Enquiry from: ${selectedEnquiry.inquirerName || 'Unknown'}` : `Update Enquiry: ${selectedEnquiry.inquirerName || 'Unknown'}`}
          size="lg"
        >
          {modalAction === 'view' ? (
            <div className="space-y-3 text-sm">
              <p><strong>Name:</strong> {selectedEnquiry.inquirerName || 'Unknown'}</p>
              <p><strong>Email:</strong> {selectedEnquiry.inquirerEmail || 'N/A'}</p>
              <p><strong>Service Interest:</strong> {selectedEnquiry.serviceInterest || 'N/A'}</p>
              <p><strong>Received:</strong> {new Date(selectedEnquiry.receivedAt).toLocaleString()}</p>
              <p><strong>Status:</strong> <Badge color={getStatusBadgeColor(selectedEnquiry.status)}>{selectedEnquiry.status}</Badge></p>
              <p className="bg-gray-100 p-2 rounded"><strong>Message:</strong><br />{selectedEnquiry.message || 'No message provided'}</p>
              {selectedEnquiry.notes && (
                <p className="bg-blue-100 p-2 rounded"><strong>Notes:</strong><br />{selectedEnquiry.notes}</p>
              )}
              <div className="mt-6 flex justify-end">
                <Button onClick={handleCloseModal}>Close</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleConfirmUpdate(); }} className="space-y-4">
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1">New Status</label>
                <select
                  id="status"
                  name="status"
                  value={updateFormData.status}
                  onChange={handleUpdateFormChange}
                  className="w-full p-2 border rounded"
                >
                  {enquiryStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={updateFormData.notes}
                  onChange={handleUpdateFormChange}
                  className="w-full p-2 border rounded"
                ></textarea>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit" variant="primary" leftIcon={<CheckSquare size={16} />}>Update Enquiry</Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default ServiceInquiriesPage;