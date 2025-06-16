import React, { useEffect, useState, useCallback } from 'react';
import {
  Donation,
  SocialCauseCampaign,
  TableColumn,
} from '../../types';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import {
  Filter,
  Search,
  CalendarRange,
  Users,
  Heart,
  Gift,
  IndianRupee,
} from 'lucide-react';
import { formatINR } from '../../utils/currencyUtils';

const DonationDashboardPage: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<SocialCauseCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | Donation['status']>('All');
  const [summaryStats, setSummaryStats] = useState({
    totalDonated: 0,
    uniqueDonors: 0,
    completedDonations: 0,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const donationsSnapshot = await getDocs(query(collection(db, 'donations'), orderBy('donationDate', 'desc')));
      let donationsData: Donation[] = donationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Donation[];

      const campaignsSnapshot = await getDocs(collection(db, 'campaigns'));
      const campaignsData: SocialCauseCampaign[] = campaignsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SocialCauseCampaign[];

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userMap = new Map<string, string>();
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        userMap.set(doc.id, data.email);
      });

      donationsData = donationsData.map((d) => ({
        ...d,
        donorEmail: userMap.get(d.id) || d.donorEmail || '',
      }));

      setDonations(donationsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to fetch data from Firestore:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let result = donations;

    if (dateFrom) {
      result = result.filter((d) => new Date(d.donationDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      const toDateObj = new Date(dateTo);
      toDateObj.setHours(23, 59, 59, 999);
      result = result.filter((d) => new Date(d.donationDate) <= toDateObj);
    }
    if (campaignFilter !== 'All') {
      result = result.filter((d) => d.campaignId === campaignFilter);
    }
    if (statusFilter !== 'All') {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.donorName.toLowerCase().includes(lowerSearch) ||
          (d.donorEmail && d.donorEmail.toLowerCase().includes(lowerSearch)) ||
          d.campaignName.toLowerCase().includes(lowerSearch) ||
          (d.transactionId && d.transactionId.toLowerCase().includes(lowerSearch))
      );
    }

    setFilteredDonations(result);

    const completed = result.filter((d) => d.status === 'Completed');
    setSummaryStats({
      totalDonated: completed.reduce((sum, d) => sum + d.amount, 0),
      uniqueDonors: new Set(completed.map((d) => d.donorEmail || d.donorName)).size,
      completedDonations: completed.length,
    });
  }, [
    searchTerm,
    dateFrom,
    dateTo,
    campaignFilter,
    statusFilter,
    donations,
  ]);

  const getStatusBadgeColor = (status: Donation['status']): 'green' | 'yellow' | 'red' | 'gray' | 'blue' => {
    switch (status) {
      case 'Completed':
        return 'green';
      case 'Pending':
        return 'yellow';
      case 'Refunded':
        return 'gray';
      case 'Failed':
        return 'red';
      default:
        return 'blue';
    }
  };

  const columns: TableColumn<Donation>[] = [
    {
      key: 'donationDate',
      header: 'Date',
      render: (d) => new Date(d.donationDate).toLocaleDateString(),
    },
    {
      key: 'donorName',
      header: 'Donor',
      render: (d) =>
        d.isAnonymous ? (
          <Badge color="gray">Anonymous</Badge>
        ) : (
          <div className="space-y-0.5">
            <div className="font-medium">{d.donorName}</div>
            {d.donorEmail && (
              <div className="text-sm text-muted-foreground">{d.donorEmail}</div>
            )}
          </div>
        ),
    },
    {
      key: 'campaignName',
      header: 'Campaign',
      render: (d) => <Badge color="purple">{d.campaignName}</Badge>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (d) => formatINR(d.amount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => (
        <Badge color={getStatusBadgeColor(d.status)}>{d.status}</Badge>
      ),
    },
    {
      key: 'transactionId',
      header: 'Txn ID',
      render: (d) => d.transactionId || '-',
    },
  ];

  const donationStatusOptions: Donation['status'][] = [
    'Completed',
    'Pending',
    'Refunded',
    'Failed',
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
        Donation Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Donated (Completed)" className="text-center">
          <Gift size={32} className="mx-auto text-green-500 dark:text-green-400 mb-2" />
          <p className="text-3xl font-bold">{formatINR(summaryStats.totalDonated)}</p>
        </Card>
        <Card title="Unique Donors (Completed)" className="text-center">
          <Users size={32} className="mx-auto text-blue-500 dark:text-blue-400 mb-2" />
          <p className="text-3xl font-bold">{summaryStats.uniqueDonors}</p>
        </Card>
        <Card title="Completed Donations Count" className="text-center">
          <Heart size={32} className="mx-auto text-red-500 dark:text-red-400 mb-2" />
          <p className="text-3xl font-bold">{summaryStats.completedDonations}</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary dark:border-dark-secondary/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <Input
            label="Search Donations"
            type="text"
            placeholder="Donor, Campaign, Txn ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search />}
          />
          <div className="flex gap-2 items-end">
            <Input
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              label="Date To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="campaignFilter" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">
              Campaign
            </label>
            <select
              id="campaignFilter"
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600"
            >
              <option value="All">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'All' | Donation['status'])
              }
              className="block w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-background dark:bg-dark-card text-foreground dark:text-dark-foreground border-gray-300 dark:border-gray-600"
            >
              <option value="All">All Statuses</option>
              {donationStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table<Donation>
          columns={columns}
          data={filteredDonations}
          isLoading={isLoading}
          emptyStateMessage="No donations found matching your criteria."
        />
      </Card>
    </div>
  );
};

export default DonationDashboardPage;
