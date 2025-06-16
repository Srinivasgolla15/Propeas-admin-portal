// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  IndianRupeeIcon, Home, FileCheck, Users, AlertTriangle, Contact,BadgeIndianRupee,
  Target, LifeBuoy, FileClock, Heart
} from 'lucide-react';
import Card from '../components/ui/Card';
import TrendIndicator from '../components/charts/TrendIndicator';
import { DashboardWidgetData, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import FinancePlaceholderPage from './finance/FinancePlaceholderPage';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import ThemeToggle from '../components/ui/ThemeToggle'; // Import ThemeToggle

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [widgetData, setWidgetData] = useState<DashboardWidgetData[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [propertyStatusData, setPropertyStatusData] = useState<any[]>([]);
  const [donationsChartData, setDonationsChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Define theme-aware colors
  const PIE_COLORS = theme === 'dark'
    ? ['#6EE7B7', '#FCD34D', '#FCA5A5'] // Dark mode: soft and readable
    : ['#10B981', '#F59E0B', '#EF4444']; // Light mode: rich and clear

  const BAR_COLOR = theme === 'dark' ? '#818cf8' : '#4f46e5'; // Lighter indigo for dark mode
  const DONATION_LINE_COLOR = theme === 'dark' ? '#f87171' : '#ef4444'; // Red-ish line for donations

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === UserRole.Finance) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          clientsSnap,
          propertiesSnap,
          tenantsSnap,
          paymentsSnap,
          leadsSnap,
          ticketsSnap,
          donationsSnap
        ] = await Promise.all([
          getDocs(collection(db, 'clients')),
          getDocs(collection(db, 'properties')),
          getDocs(collection(db, 'tenants')),
          getDocs(collection(db, 'payments')),
          getDocs(collection(db, 'leads')),
          getDocs(collection(db, 'clientTickets')),
          getDocs(collection(db, 'donations')),
        ]);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const clients = clientsSnap.docs.map(doc => doc.data());
        const properties = propertiesSnap.docs.map(doc => doc.data());
        const tenants = tenantsSnap.docs.map(doc => doc.data());
        const payments = paymentsSnap.docs.map(doc => doc.data());
        const leads = leadsSnap.docs.map(doc => doc.data());
        const tickets = ticketsSnap.docs.map(doc => doc.data());
        const donations = donationsSnap.docs.map(doc => doc.data());

        const getMonth = (date: any) => date?.toDate ? date.toDate().getMonth() : new Date(date).getMonth();
        const getYear = (date: any) => date?.toDate ? date.toDate().getFullYear() : new Date(date).getFullYear();

        const currentMonthClients = clients.filter(c => getMonth(c.joinedDate) === currentMonth && getYear(c.joinedDate) === currentYear).length;
        const lastMonthClients = clients.filter(c => getMonth(c.joinedDate) === lastMonth.getMonth() && getYear(c.joinedDate) === lastMonth.getFullYear()).length;
        const clientTrend = currentMonthClients - lastMonthClients;

        const verifiedProperties = properties.filter(p => p.status === 'Verified');
        const lastMonthVerified = verifiedProperties.filter(p => getMonth(p.submittedDate) === lastMonth.getMonth() && getYear(p.submittedDate) === lastMonth.getFullYear()).length;
        const currentMonthVerified = verifiedProperties.filter(p => getMonth(p.submittedDate) === currentMonth && getYear(p.submittedDate) === currentYear).length;
        const propertyTrend = currentMonthVerified - lastMonthVerified;

        const currentRevenue = payments
          .filter(p => p.status === 'Paid' && getMonth(p.paymentDate) === currentMonth && getYear(p.paymentDate) === currentYear)
          .reduce((sum, p) => sum + p.amount, 0);
        const lastRevenue = payments
          .filter(p => p.status === 'Paid' && getMonth(p.paymentDate) === lastMonth.getMonth() && getYear(p.paymentDate) === lastMonth.getFullYear())
          .reduce((sum, p) => sum + p.amount, 0);
        const revenueTrend = currentRevenue - lastRevenue;

        const currentMonthDonations = donations
          .filter(d => {
            const date = d.donationDate?.toDate ? d.donationDate.toDate() : new Date(d.donationDate);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          })
          .reduce((sum, d) => sum + d.amount, 0);

        const lastMonthDonations = donations
          .filter(d => {
            const date = d.donationDate?.toDate ? d.donationDate.toDate() : new Date(d.donationDate);
            return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
          })
          .reduce((sum, d) => sum + d.amount, 0);

        const donationsTrend = currentMonthDonations - lastMonthDonations;

        const activeTenants = tenants.filter(t => t.status === 'Active').length;
        const pendingVerifications = properties.filter(p => p.status === 'Pending').length;
        const activeLeads = leads.filter(l => l.status !== 'Converted' && l.status !== 'Dropped').length;
        const openTickets = tickets.filter(t => ['Open', 'InProgress'].includes(t.status)).length;

        const widgets: DashboardWidgetData[] = [
          {
            title: 'Total Clients',
            value: currentMonthClients.toString(),
            icon: <Users size={22} />,
            trend: Math.abs(clientTrend),
            trendDirection: clientTrend > 0 ? 'up' : clientTrend < 0 ? 'down' : 'neutral',
            period: 'month-over-month',
            actionLink: '/users/clients/all',
          },
          {
            title: 'Properties Verified',
            value: currentMonthVerified.toString(),
            icon: <Home size={22} />,
            trend: Math.abs(propertyTrend),
            trendDirection: propertyTrend > 0 ? 'up' : propertyTrend < 0 ? 'down' : 'neutral',
            period: 'month-over-month',
            actionLink: '/properties/verified',
          },
          {
            title: 'Subscription Revenue (MTD)',
            value: `$${currentRevenue.toLocaleString()}`,
            icon: <IndianRupeeIcon size={22} />,
            trend: Math.abs(revenueTrend),
            trendDirection: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'neutral',
            period: 'month-over-month',
            actionLink: '/finance/billing-reports',
          },
          {
            title: 'Monthly Donations',
            value: `$${currentMonthDonations.toLocaleString()}`,
            icon: <Heart size={22} />,
            trend: Math.abs(donationsTrend),
            trendDirection: donationsTrend > 0 ? 'up' : donationsTrend < 0 ? 'down' : 'neutral',
            period: 'month-over-month',
            actionLink: '/social-causes/donations',
          },
          {
            title: 'Active Tenants',
            value: activeTenants.toString(),
            icon: <Contact size={22} />,
            actionLink: '/tenants/directory',
          },
          {
            title: 'Pending Verifications',
            value: pendingVerifications.toString(),
            icon: <FileClock size={22} />,
            actionLink: '/properties/pending-verifications',
          },
          {
            title: 'Active Leads',
            value: activeLeads.toString(),
            icon: <Target size={22} />,
            actionLink: '/crm/leads',
          },
          {
            title: 'Open Support Tickets',
            value: openTickets.toString(),
            icon: <LifeBuoy size={22} />,
            actionLink: '/crm/support-tickets',
          },
        ];

        // Revenue chart data for last 6 months
        const revenueChart = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const month = date.getMonth();
          const year = date.getFullYear();

          const revenue = payments
            .filter(p => {
              const d = p.paymentDate?.toDate ? p.paymentDate.toDate() : new Date(p.paymentDate);
              return p.status === 'Paid' && d.getMonth() === month && d.getFullYear() === year;
            })
            .reduce((sum, p) => sum + p.amount, 0);

          revenueChart.push({ month: monthName, revenue });
        }

        // Donations chart data for last 6 months
        const donationsChart = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const month = date.getMonth();
          const year = date.getFullYear();

          const donationSum = donations
            .filter(d => {
              const dDate = d.donationDate?.toDate ? d.donationDate.toDate() : new Date(d.donationDate);
              return dDate.getMonth() === month && dDate.getFullYear() === year;
            })
            .reduce((sum, d) => sum + d.amount, 0);

          donationsChart.push({ month: monthName, donations: donationSum });
        }

        const statusData = ['Verified', 'Pending', 'Rejected'].map(status => ({
          name: status,
          value: properties.filter(p => p.status === status).length,
        }));

        setWidgetData(widgets);
        setRevenueData(revenueChart);
        setPropertyStatusData(statusData);
        setDonationsChartData(donationsChart);
      } catch (err) {
        console.error('Dashboard Error:', err);
        setError('Could not load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-lg text-foreground dark:text-dark-foreground">Loading Dashboard...</div>;
  }

  if (error) {
    return (
      <Card title="Error" className="text-center">
        <div className="p-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400" />
          <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
        </div>
      </Card>
    );
  }

  if (currentUser?.role === UserRole.Finance) {
    return <FinancePlaceholderPage />;
  }

  return (
    <div className="space-y-6 bg-background dark:bg-dark-background min-h-screen p-6 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-dark-foreground">Welcome, {currentUser?.name}!</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {widgetData.map((widget) => (
          <Card key={widget.title} className="shadow-lg hover:shadow-xl transition-shadow bg-card dark:bg-dark-card">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-foreground/70 dark:text-dark-foreground/70 uppercase">{widget.title}</h3>
              <div className="p-2 bg-primary/10 text-primary dark:text-dark-primary rounded-lg">{widget.icon}</div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground dark:text-dark-foreground">{widget.value}</p>
            {widget.trend !== undefined && widget.trendDirection && (
              <div className="mt-1">
                <TrendIndicator trend={widget.trend} trendDirection={widget.trendDirection} period={widget.period} />
              </div>
            )}
            {widget.actionLink && (
              <div className="mt-3">
                <Link to={widget.actionLink}>
                  <Button variant="ghost" size="sm" className="text-xs !p-0 h-auto text-foreground dark:text-dark-foreground">
                    {widget.actionText || 'View Details'}
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Subscription Revenue (Monthly)" className="shadow-lg bg-card dark:bg-dark-card">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4b5563' : '#e5e7eb'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#9ca3af' : '#374151'} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#374151'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: 'none',
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Property Status Distribution" className="shadow-lg bg-card dark:bg-dark-card">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={propertyStatusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {propertyStatusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: 'none',
                }}
                labelStyle={{
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                itemStyle={{
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                  fontSize: '13px',
                }}
                formatter={(value: any, name: string) => [`${value}`, name]}
              />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* New Donations Line Chart */}
        <Card title="Monthly Donations (Last 6 Months)" className="shadow-lg bg-card dark:bg-dark-card">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={donationsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4b5563' : '#e5e7eb'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#9ca3af' : '#374151'} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#374151'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: 'none',
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="donations" stroke={DONATION_LINE_COLOR} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
