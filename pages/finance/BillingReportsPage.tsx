import React, { useEffect, useState, useCallback } from 'react';
import { BillingReportSummary, RevenueDataPoint, Payment, TableColumn } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { Download, FileText, CalendarDays, AlertTriangle, Search } from 'lucide-react';
import { formatINR } from '../../utils/currencyUtils';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

const BillingReportsPage: React.FC = () => {
  const [reportSummary, setReportSummary] = useState<BillingReportSummary | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueDataPoint[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: string, to: string }>({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      const paymentsRef = collection(db, 'payments');
      const paymentsQuery = query(
        paymentsRef,
        where('paymentDate', '>=', Timestamp.fromDate(fromDate)),
        where('paymentDate', '<=', Timestamp.fromDate(toDate))
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[];

      const verifiedPayments = paymentsData
        .filter(p => p.status === 'Paid')
        .sort((a, b) => {
          const dateA = (a.paymentDate && typeof (a.paymentDate as any).toDate === 'function')
            ? (a.paymentDate as any).toDate()
            : new Date(a.paymentDate);
          const dateB = (b.paymentDate && typeof (b.paymentDate as any).toDate === 'function')
            ? (b.paymentDate as any).toDate()
            : new Date(b.paymentDate);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);

      setRecentPayments(verifiedPayments);

      const totalRevenue = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
      const countVerifiedPayments = verifiedPayments.length;
      const countPendingPayments = paymentsData.filter(p => p.status === 'Pending').length;
      const totalPendingPayments = paymentsData
        .filter(p => p.status === 'Pending')
        .reduce((sum, p) => sum + p.amount, 0);

      const clientsRef = collection(db, 'clients');
      const clientsQuery = query(
        clientsRef,
        where('joinedDate', '>=', Timestamp.fromDate(fromDate)),
        where('joinedDate', '<=', Timestamp.fromDate(toDate))
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as { subscriptionStatus?: string }) }));

      const newSubscriptionsThisPeriod = clientsData.length;
      const cancelledSubscriptionsThisPeriod = clientsData.filter(c => c.subscriptionStatus === 'Cancelled').length;

      setReportSummary({
        period: `${dateRange.from} to ${dateRange.to}`,
        totalRevenue,
        countVerifiedPayments,
        countPendingPayments,
        totalPendingPayments,
        newSubscriptionsThisPeriod,
        cancelledSubscriptionsThisPeriod,
        totalVerifiedPayments: countVerifiedPayments,
      });

      const revenueTrendMap = new Map<string, number>();
      verifiedPayments.forEach(p => {
        const paymentDateObj = (p.paymentDate && typeof (p.paymentDate as any).toDate === 'function')
          ? (p.paymentDate as any).toDate()
          : new Date(p.paymentDate);
        const dateStr = paymentDateObj.toISOString().split('T')[0];
        revenueTrendMap.set(dateStr, (revenueTrendMap.get(dateStr) || 0) + p.amount);
      });
      const revenueTrendData = Array.from(revenueTrendMap.entries()).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());;
      setRevenueTrend(revenueTrendData);

    } catch (error) {
      console.error("Failed to load billing report data:", error);
      setFeedbackMessage("Failed to load billing data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        loadReportData();
      } else {
        setFeedbackMessage("User is not authenticated.");
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loadReportData]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateReport = () => {
    if (new Date(dateRange.to) < new Date(dateRange.from)) {
      setFeedbackMessage("'To' date cannot be earlier than 'From' date.");
      return;
    }
    loadReportData();
  };

  const paymentColumns: TableColumn<Payment>[] = [
    { key: 'transactionId', header: 'Txn ID', render: p => <span className="text-xs font-mono">{p.transactionId}</span> },
    { key: 'clientName', header: 'Client' },
    { key: 'serviceName', header: 'Service' },
    { key: 'amount', header: 'Amount', render: p => formatINR(p.amount || 0) },
    { key: 'paymentDate', header: 'Date', render: p => {
      const dateObj = p.paymentDate && typeof (p.paymentDate as any).toDate === 'function'
        ? (p.paymentDate as any).toDate()
        : new Date(p.paymentDate);
      return dateObj.toLocaleDateString();
    }},
    { key: 'status', header: 'Status', render: p => <Badge color="green">{p.status}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Billing Reports</h1>
        <Button variant="outline" leftIcon={<Download size={16} />} size="sm" onClick={() => alert("Export functionality not implemented.")}>
          Export Report
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary dark:border-dark-secondary/50 flex flex-wrap gap-4 items-end">
          <Input label="From Date" type="date" name="from" value={dateRange.from} onChange={handleDateChange} icon={<CalendarDays size={16} />} />
          <Input label="To Date" type="date" name="to" value={dateRange.to} onChange={handleDateChange} icon={<CalendarDays size={16} />} />
          <Button onClick={handleGenerateReport} isLoading={isLoading} disabled={isLoading} leftIcon={<FileText size={16} />}>Generate Report</Button>
        </div>
        {feedbackMessage && (
          <div className="p-4">
            <div className="p-3 rounded-md text-sm flex items-center bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50">
              <AlertTriangle size={18} className="mr-2" /> {feedbackMessage}
            </div>
          </div>
        )}
      </Card>

      {isLoading && <div className="text-center py-10">Loading report data...</div>}

      {!isLoading && reportSummary && (
        <>
          <Card title={`Summary for ${reportSummary.period}`}>
            {/* Render report summary items here */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
              <div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-lg font-semibold">{formatINR(reportSummary.totalRevenue)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Verified Payments</div>
                <div className="text-lg font-semibold">{reportSummary.countVerifiedPayments}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pending Payments</div>
                <div className="text-lg font-semibold">{reportSummary.countPendingPayments}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Pending Amount</div>
                <div className="text-lg font-semibold">{formatINR(reportSummary.totalPendingPayments)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">New Subscriptions</div>
                <div className="text-lg font-semibold">{reportSummary.newSubscriptionsThisPeriod}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cancelled Subscriptions</div>
                <div className="text-lg font-semibold">{reportSummary.cancelledSubscriptionsThisPeriod}</div>
              </div>
            </div>
          </Card>

          <Card title="Revenue Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title={`Recent Verified Payments (Top 10 in Period)`}>
            <Table<Payment> columns={paymentColumns} data={recentPayments} isLoading={false} emptyStateMessage="No verified payments in this period." />
          </Card>
        </>
      )}

      {!isLoading && !reportSummary && !feedbackMessage && (
        <Card className="text-center p-6">Please select a date range and click "Generate Report".</Card>
      )}
    </div>
  );
};

export default BillingReportsPage;
