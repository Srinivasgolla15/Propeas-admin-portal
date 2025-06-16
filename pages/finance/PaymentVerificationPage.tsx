import React, { useEffect, useState, useMemo } from 'react';
import { Payment, TableColumn } from '../../types';
import {
  collection,
  onSnapshot,
  query,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { Info, Search, Download, Edit3 } from 'lucide-react';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import { getAuth } from 'firebase/auth';

const PaymentVerificationPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Payment['status']>('All');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<Payment['status'] | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  useEffect(() => {
    const q = query(collection(db, 'payments'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Payment[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Payment[];
        setPayments(data);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to fetch payments:', error);
        toast.error('Error loading payments');
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredPayments = useMemo(() => {
    let result = [...payments];
    if (statusFilter !== 'All') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          (p.clientName?.toLowerCase() || '').includes(lower) ||
          (p.serviceName?.toLowerCase() || '').includes(lower) ||
          (p.transactionId?.toLowerCase() || '').includes(lower)
      );
    }
    return result;
  }, [payments, searchTerm, statusFilter]);

  const getStatusBadgeColor = (status: Payment['status']) => {
    switch (status) {
      case 'Paid': return 'green';
      case 'Pending': return 'yellow';
      case 'Failed': return 'red';
      default: return 'gray';
    }
  };

  const handleOpenInfoModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setInfoModalOpen(true);
  };

  const handleOpenEditModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditStatus(payment.status || '');
    setEditModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedPayment || !editStatus || !currentUser) return;
    setIsUpdating(true);

    try {
      const ref = doc(db, 'payments', selectedPayment.id);
      await updateDoc(ref, { status: editStatus });

      // Dynamically fetch actor role and name from users collection
      let actorUserRole = 'Unknown';
      let actorUserName = currentUser.displayName || 'Unknown User';

      const userEmail = currentUser.email;
      if (userEmail) {
        const q = query(collection(db, 'users'), where('email', '==', userEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userDoc = snap.docs[0].data();
          actorUserRole = userDoc.role || 'Unknown';
          actorUserName = userDoc.name || actorUserName;
        }
      }

      await addDoc(collection(db, 'platformAuditLogs'), {
        timestamp: serverTimestamp(),
        actorUserId: currentUser.uid,
        actorUserName,
        actorUserRole,
        actionType: 'UpdatePaymentStatus',
        actionDescription: `Updated payment status to ${editStatus}`,
        targetEntityType: 'payment',
        targetEntityId: selectedPayment.id,
        targetEntityDescription: selectedPayment.transactionId || 'Unknown Transaction',
        details: {
          previousStatus: selectedPayment.status,
          updatedStatus: editStatus,
        },
      });

      toast.success(`Status updated to ${editStatus}`);
      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredPayments.map((p) => ({
      TransactionID: p.transactionId || 'N/A',
      ClientName: p.clientName || 'N/A',
      Service: p.serviceName || 'N/A',
      Amount: p.amount ? `$${p.amount.toFixed(2)}` : 'N/A',
      Date: p.paymentDate?.toDate ? p.paymentDate.toDate().toLocaleDateString() : 'N/A',
      Status: p.status || 'N/A',
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'payments.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: TableColumn<Payment>[] = [
    { key: 'clientName', header: 'Client Name', render: (p) => p.clientName || 'N/A' },
    { key: 'serviceName', header: 'Service', render: (p) => p.serviceName || 'N/A' },
    { key: 'amount', header: 'Amount', render: (p) => `$${p.amount?.toFixed(2)}` },
    {
      key: 'paymentDate',
      header: 'Date',
      render: (p) =>
        p.paymentDate?.toDate
          ? p.paymentDate.toDate().toLocaleDateString()
          : 'Invalid Date',
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge color={getStatusBadgeColor(p.status)}>{p.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenInfoModal(p)}>
            <Info size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(p)}>
            <Edit3 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment Verification</h1>
        <Button variant="outline" leftIcon={<Download size={16} />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center border-b">
          <Input
            type="text"
            placeholder="Search..."
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            icon={<Search />}
            className="w-full sm:max-w-xs"
          />
          <select
            aria-label='Filter by status'
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border px-3 py-2 rounded-md"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
        <Table columns={columns} data={filteredPayments} isLoading={isLoading} />
      </Card>

      {infoModalOpen && selectedPayment && (
        <Modal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="Payment Details">
          <div className="space-y-2 text-sm">
            <p><strong>Transaction ID:</strong> {selectedPayment.transactionId}</p>
            <p><strong>Client Name:</strong> {selectedPayment.clientName}</p>
            <p><strong>Service:</strong> {selectedPayment.serviceName}</p>
            <p><strong>Amount:</strong> ${selectedPayment.amount?.toFixed(2)}</p>
            <p><strong>Status:</strong> {selectedPayment.status}</p>
            <p><strong>Date:</strong> {selectedPayment.paymentDate?.toDate ? selectedPayment.paymentDate.toDate().toLocaleString() : 'N/A'}</p>
          </div>
        </Modal>
      )}

      {editModalOpen && selectedPayment && (
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Payment Status">
          <div className="space-y-4">
            <label className="block text-sm font-medium">New Status</label>
            <select
              aria-label='Select new payment status'
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as Payment['status'])}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateStatus} isLoading={isUpdating} disabled={!editStatus}>
                Update
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentVerificationPage;
