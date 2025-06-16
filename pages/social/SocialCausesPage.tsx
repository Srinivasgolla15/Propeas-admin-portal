import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { UserRole } from '../../types';
import { collection, getDocs, addDoc, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { Timestamp } from 'firebase/firestore';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { Gift, Target, CalendarClock, FileText, PlusCircle, X, Archive } from 'lucide-react';

// Define Donation type
interface Donation {
  id: string;
  amount: number;
  campaignId: string;
  userId: string;
  createdAt: string | Date;
}

// Define AuditLogEntry type
interface AuditLogEntry {
  id: string;
  timestamp: Timestamp;
  actorUserId: string;
  actorUserName: string;
  actorUserRole: UserRole;
  actorEmail: string;
  actionType: string;
  actionDescription: string;
  targetEntityType?: string;
  targetEntityId?: string;
  targetEntityDescription?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

// Define SocialCauseCampaign type
interface SocialCauseCampaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  endDate: any;
  imageUrl?: string;
  isActive: boolean;
}

// New Campaign Modal
interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCampaign: { name: string; description: string; goal: string; endDate: string; imageUrl: string };
  setNewCampaign: React.Dispatch<React.SetStateAction<{ name: string; description: string; goal: string; endDate: string; imageUrl: string }>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const NewCampaignModal: React.FC<NewCampaignModalProps> = ({ isOpen, onClose, newCampaign, setNewCampaign, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-background rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Create New Campaign</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 dark:text-dark-foreground/80">Name</label>
            <input
              aria-label="Campaign Name"
              type="text"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              required
              className="w-full p-2 border rounded dark:bg-dark-secondary dark:border-dark-secondary dark:text-dark-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 dark:text-dark-foreground/80">Description</label>
            <textarea
              aria-label="Campaign Description"
              value={newCampaign.description}
              onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
              required
              className="w-full p-2 border rounded dark:bg-dark-secondary dark:border-dark-secondary dark:text-dark-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 dark:text-dark-foreground/80">Goal ($)</label>
            <input
              aria-label="Goal Amount"
              type="number"
              value={newCampaign.goal}
              onChange={(e) => setNewCampaign({ ...newCampaign, goal: e.target.value })}
              required
              min="1"
              className="w-full p-2 border rounded dark:bg-dark-secondary dark:border-dark-secondary dark:text-dark-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 dark:text-dark-foreground/80">End Date</label>
            <input
              aria-label="End Date"
              type="date"
              value={newCampaign.endDate}
              onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-2 border rounded dark:bg-dark-secondary dark:border-dark-secondary dark:text-dark-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 dark:text-dark-foreground/80">Image URL (optional)</label>
            <input
              aria-label="Image URL"
              type="url"
              value={newCampaign.imageUrl}
              onChange={(e) => setNewCampaign({ ...newCampaign, imageUrl: e.target.value })}
              className="w-full p-2 border rounded dark:bg-dark-secondary dark:border-dark-secondary dark:text-dark-foreground"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Report Modal
interface ReportModalProps {
  campaignId: string | null;
  campaigns: SocialCauseCampaign[];
  donations: Donation[];
  campaignTotals: Record<string, number>;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ campaignId, campaigns, donations, campaignTotals, onClose }) => {
  if (!campaignId) return null;

  const campaign = campaigns.find(c => c.id === campaignId);
  const campaignDonations = donations.filter(d => d.campaignId === campaignId);
  const totalRaised = campaignTotals[campaignId] || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-background rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">
            Donation Report: {campaign?.name || 'Unknown Campaign'}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-foreground/80 dark:text-dark-foreground/80">
            <strong>Total Raised:</strong> ${totalRaised.toLocaleString()}
          </p>
          <p className="text-sm text-foreground/80 dark:text-dark-foreground/80">
            <strong>Number of Donations:</strong> {campaignDonations.length}
          </p>
          <p className="text-sm text-foreground/80 dark:text-dark-foreground/80">
            <strong>Contributors:</strong> {[...new Set(campaignDonations.map(d => d.userId))].length}
          </p>
          {campaignDonations.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm text-foreground dark:text-dark-foreground">
                <thead>
                  <tr className="border-b dark:border-dark-secondary">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignDonations.map(donation => (
                    <tr key={donation.id} className="border-b dark:border-dark-secondary/50">
                      <td className="p-2">{new Date(donation.createdAt).toLocaleDateString()}</td>
                      <td className="p-2">${donation.amount.toLocaleString()}</td>
                      <td className="p-2">{donation.userId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">No donations for this campaign.</p>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const SocialCausesPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<SocialCauseCampaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    goal: '',
    endDate: '',
    imageUrl: '',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const campaignsSnapshot = await getDocs(collection(db, 'socialCauseCampaigns'));
      const campaignsData = campaignsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          goal: Number(data.goal) || 0,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate),
          imageUrl: data.imageUrl || '',
          isActive: data.isActive !== false, // Default to true if not set
        } as SocialCauseCampaign;
      }).filter(campaign => campaign.isActive); // Only show active campaigns
      setCampaigns(campaignsData);

      const donationsSnapshot = await getDocs(collection(db, 'donations'));
      const donationsData = donationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: Number(data.amount) || 0,
          campaignId: data.campaignId || '',
          userId: data.userId || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Donation;
      });
      setDonations(donationsData);
    } catch (error) {
      console.error('🔥 Failed to fetch data from Firestore:', error);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const campaignTotals = useMemo(() => {
    return campaigns.reduce((acc, campaign) => {
      acc[campaign.id] = donations
        .filter(donation => donation.campaignId === campaign.id)
        .reduce((sum, donation) => sum + donation.amount, 0);
      return acc;
    }, {} as Record<string, number>);
  }, [campaigns, donations]);

  const donationSummary = {
    totalDonated: donations.reduce((sum, donation) => sum + donation.amount, 0),
    totalContributors: [...new Set(donations.map(donation => donation.userId))].length,
    activeCampaigns: campaigns.length,
  };

  // Fetch user details from the 'users' collection
  const fetchUserDetails = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: userData.name || 'Unknown User',
          email: userData.email || 'unknown@example.com',
          role: userData.role || 'user',
        };
      }
      return {
        name: 'Unknown User',
        email: 'unknown@example.com',
        role: 'user',
      };
    } catch (error) {
      console.error('🔥 Failed to fetch user details:', error);
      return {
        name: 'Unknown User',
        email: 'unknown@example.com',
        role: 'user',
      };
    }
  };

  // Inactivate campaign
  const handleInactivateCampaign = async (campaignId: string, campaignName: string) => {
    if (!auth.currentUser) {
      setError('You must be logged in to inactivate a campaign.');
      return;
    }

    try {
      const campaignRef = doc(db, 'socialCauseCampaigns', campaignId);
      await updateDoc(campaignRef, { isActive: false });

      // Fetch user details for audit log
      const userDetails = await fetchUserDetails(auth.currentUser.uid);

      // Log inactivation to platformAuditLogs
      const auditLog: Omit<AuditLogEntry, 'id'> = {
        timestamp: Timestamp.now(),
        actorUserId: auth.currentUser.uid,
        actorUserName: userDetails.name,
        actorUserRole: userDetails.role as UserRole,
        actorEmail: userDetails.email,
        actionType: 'INACTIVATE_CAMPAIGN',
        actionDescription: `Inactivated campaign: ${campaignName}`,
        targetEntityType: 'CAMPAIGN',
        targetEntityId: campaignId,
        targetEntityDescription: campaignName,
        details: { isActive: false },
        ipAddress: '0.0.0.0',
      };

      await addDoc(collection(db, 'platformAuditLogs'), auditLog);

      // Refresh campaigns
      await loadData();
    } catch (error) {
      console.error('🔥 Failed to inactivate campaign:', error);
      setError('Failed to inactivate campaign. Please try again.');
    }
  };

  const handleNewCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('You must be logged in to create a campaign.');
      return;
    }

    try {
      const goalNumber = Number(newCampaign.goal);
      if (isNaN(goalNumber) || goalNumber <= 0) {
        setError('Goal must be a positive number.');
        return;
      }
      const endDate = new Date(newCampaign.endDate);
      if (endDate < new Date()) {
        setError('End date must be in the future.');
        return;
      }

      const campaignData: Partial<SocialCauseCampaign> = {
        name: newCampaign.name,
        description: newCampaign.description,
        goal: goalNumber,
        endDate: Timestamp.fromDate(endDate),
        isActive: true,
      };
      if (newCampaign.imageUrl) {
        campaignData.imageUrl = newCampaign.imageUrl;
      }

      const docRef = await addDoc(collection(db, 'socialCauseCampaigns'), campaignData);

      // Fetch user details for audit log
      const userDetails = await fetchUserDetails(auth.currentUser.uid);

      const auditLog: Omit<AuditLogEntry, 'id'> = {
        timestamp: Timestamp.now(),
        actorUserId: auth.currentUser.uid,
        actorUserName: userDetails.name,
        actorUserRole: userDetails.role as UserRole,
        actorEmail: userDetails.email,
        actionType: 'CREATE_CAMPAIGN',
        actionDescription: `Created new campaign: ${newCampaign.name}`,
        targetEntityType: 'CAMPAIGN',
        targetEntityId: docRef.id,
        targetEntityDescription: newCampaign.name,
        details: campaignData,
        ipAddress: '0.0.0.0',
      };

      await addDoc(collection(db, 'platformAuditLogs'), auditLog);

      await loadData();
      setShowNewCampaignModal(false);
      setNewCampaign({ name: '', description: '', goal: '', endDate: '', imageUrl: '' });
    } catch (error) {
      console.error('🔥 Failed to create campaign:', error);
      setError('Failed to create campaign. Please try again.');
    }
  };

  const CampaignCard: React.FC<{ campaign: SocialCauseCampaign }> = ({ campaign }) => {
    const raisedAmount = campaignTotals[campaign.id] || 0;
    const progress = (raisedAmount / campaign.goal) * 100;
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
        {campaign.imageUrl && (
          <img
            src={campaign.imageUrl}
            alt={campaign.name}
            className="w-full h-48 object-cover rounded-t-xl"
          />
        )}
        <div className="p-5 flex-grow flex flex-col">
          <h3 className="text-xl font-semibold text-primary dark:text-primary-foreground mb-2">{campaign.name}</h3>
          <p className="text-sm text-foreground/80 dark:text-dark-foreground/80 mb-3 flex-grow">{campaign.description}</p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70 dark:text-dark-foreground/70 flex items-center">
                <Target size={16} className="mr-2 opacity-70" /> Goal:
              </span>
              <span className="font-semibold text-foreground dark:text-dark-foreground">${campaign.goal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70 dark:text-dark-foreground/70 flex items-center">
                <Gift size={16} className="mr-2 opacity-70" /> Raised:
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">${raisedAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70 dark:text-dark-foreground/70 flex items-center">
                <CalendarClock size={16} className="mr-2 opacity-70" /> Ends:
              </span>
              <span className="font-semibold text-foreground dark:text-dark-foreground">
                {new Date(campaign.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <ProgressBar value={progress} color="green" showLabel />
        </div>
        <div className="p-5 border-t border-secondary dark:border-dark-secondary/50 flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText size={16} />}
            onClick={() => setShowReportModal(campaign.id)}
          >
            View Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Archive size={16} />}
            onClick={() => {
              if (window.confirm(`Are you sure you want to inactivate ${campaign.name}?`)) {
                handleInactivateCampaign(campaign.id, campaign.name);
              }
            }}
          >
            Inactivate
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Social Cause Initiatives</h1>
        <Button
          variant="primary"
          leftIcon={<PlusCircle size={18} />}
          onClick={() => setShowNewCampaignModal(true)}
        >
          New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-foreground">Loading data...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-10 text-foreground/70">No active social cause campaigns.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-foreground">Loading summary...</div>
      ) : (
        <Card title="Overall Donation Summary" className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">${donationSummary.totalDonated.toLocaleString()}</p>
              <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">Total Donated This Year</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{donationSummary.totalContributors}</p>
              <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">Total Contributors</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{donationSummary.activeCampaigns}</p>
              <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">Active Campaigns</p>
            </div>
          </div>
        </Card>
      )}

      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        newCampaign={newCampaign}
        setNewCampaign={setNewCampaign}
        onSubmit={handleNewCampaignSubmit}
      />
      <ReportModal
        campaignId={showReportModal}
        campaigns={campaigns}
        donations={donations}
        campaignTotals={campaignTotals}
        onClose={() => setShowReportModal(null)}
      />
    </div>
  );
};

export default SocialCausesPage;