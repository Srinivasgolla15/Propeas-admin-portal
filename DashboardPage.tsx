
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Home, FileCheck, Users, Heart, UserCheck, Briefcase, AlertTriangle, Contact } from 'lucide-react'; // Added Contact
import Card from './components/ui/Card';
import TrendIndicator from './components/charts/TrendIndicator';
import { DashboardWidgetData, UserRole } from './types';
import { fetchDashboardWidgets, fetchRevenueData, fetchPropertyStatusData } from './services/mockApi';
import { useAuth } from './contexts/AuthContext';
import FinancePlaceholderPage from './pages/finance/FinancePlaceholderPage'; 
import { Link } from 'react-router-dom';
import Button from './components/ui/Button';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [widgetData, setWidgetData] = useState<DashboardWidgetData[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [propertyStatusData, setPropertyStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === UserRole.Finance) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [widgets, revenue, propertyStatus] = await Promise.all([
          fetchDashboardWidgets(currentUser.role), 
          fetchRevenueData(), 
          fetchPropertyStatusData(), 
        ]);
        setWidgetData(widgets);
        setRevenueData(revenue);
        setPropertyStatusData(propertyStatus);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-lg text-foreground dark:text-dark-foreground">Loading Dashboard...</div>;
  }

  if (error) {
    return (
      <Card title="Error" className="text-center">
        <div className="p-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
        </div>
      </Card>
    );
  }
  
  if (currentUser?.role === UserRole.Finance) {
    return <FinancePlaceholderPage />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-dark-foreground">
        Welcome, {currentUser?.name}!
      </h1>
      
      {widgetData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"> {/* Adjusted grid for potentially more items */}
          {widgetData.map((widget) => (
            <Card key={widget.title} className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-medium text-foreground/70 dark:text-dark-foreground/70 uppercase tracking-wider">{widget.title}</h3>
                <div className={`p-2 bg-primary/10 dark:bg-dark-primary/20 text-primary dark:text-dark-primary rounded-lg`}>
                  {widget.icon}
                </div>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-foreground dark:text-dark-foreground">{widget.value}</p>
              {widget.trend !== undefined && widget.trendDirection && (
                <div className="mt-1">
                  <TrendIndicator trend={widget.trend} trendDirection={widget.trendDirection} period={widget.period} />
                </div>
              )}
              {widget.actionLink && (
                 <div className="mt-3">
                    <Link to={widget.actionLink}>
                        <Button variant="ghost" size="sm" className="text-xs !p-0 h-auto">
                            {widget.actionText || "View Details"}
                        </Button>
                    </Link>
                 </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {(currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Admin) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Subscription Revenue (Monthly)" className="shadow-lg">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} className="dark:stroke-gray-700" />
                <XAxis dataKey="month" fontSize={12} className="dark:fill-dark-foreground/70" />
                <YAxis fontSize={12} className="dark:fill-dark-foreground/70" />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: document.documentElement.classList.contains('dark') ? 'hsl(217.2, 32.6%, 17.5%)' : 'hsl(0, 0%, 100%)',
                    color: document.documentElement.classList.contains('dark') ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 84%, 4.9%)',
                    borderRadius: '0.5rem',
                    borderColor: document.documentElement.classList.contains('dark') ? 'hsl(217.2, 32.6%, 25%)' : 'hsl(210, 40%, 90%)'
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                  itemStyle={{ color: document.documentElement.classList.contains('dark') ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 84%, 4.9%)'}}
                />
                <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
                <Bar dataKey="revenue" fill="hsl(222.2, 47.4%, 11.2%)" className="dark:fill-blue-500" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Property Status Distribution" className="shadow-lg">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {propertyStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: document.documentElement.classList.contains('dark') ? 'hsl(217.2, 32.6%, 17.5%)' : 'hsl(0, 0%, 100%)',
                    color: document.documentElement.classList.contains('dark') ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 84%, 4.9%)',
                    borderRadius: '0.5rem',
                    borderColor: document.documentElement.classList.contains('dark') ? 'hsl(217.2, 32.6%, 25%)' : 'hsl(210, 40%, 90%)'
                  }}
                />
                <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
