'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  BarChart3,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  TrendingUp,
  Copy,
  Plus
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, update, get, onValue, off } from 'firebase/database';

// Import the new components
import { OverviewContent } from './components/OverviewContent';
import { AffiliateEarningsContent } from './components/AffiliateEarningsContent';
import AffiliateSales from './components/AffilliateSales';
import { ReferralEarningsContent } from './components/ReferralEarningsContent';
import { ProfileContent } from './components/ProfileContent';
import { BillingContent } from './components/BillingContent';
import { ReportsContent } from './components/ReportsContent';
import { SidebarItem } from './components/SidebarItem'
import PaymentRequest from './components/BankDetailsPage';
import UserSupportCenter from './components/UserSupportCenter';

const firebaseConfig = {
  apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
  authDomain: "swissgain-a2589.firebaseapp.com",
  databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
  projectId: "swissgain-a2589",
  storageBucket: "swissgain-a2589.firebasestorage.app",
  messagingSenderId: "1062016445247",
  appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a",
  measurementId: "G-VTKPWVEY0S"
};

// Initialize Firebase
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'DashboardApp');
    database = getDatabase(app);
  } else {
    console.error('Firebase initialization error:', error);
  }
}

// Cookie helpers
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};

// Firebase data functions
const saveAffiliateSale = async (userId: string, saleData: any) => {
  try {
    const salesRef = ref(database, `affiliateSales/${userId}`);
    const newSaleRef = push(salesRef);
    await set(newSaleRef, {
      ...saleData,
      id: newSaleRef.key,
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Update affiliate stats
    const affiliateRef = ref(database, `affiliates/${userId}`);
    const snapshot = await get(affiliateRef);
    if (snapshot.exists()) {
      const affiliateData = snapshot.val();
      const currentStats = affiliateData.stats || {};
      await update(affiliateRef, {
        stats: {
          ...currentStats,
          totalSales: (currentStats.totalSales || 0) + 1,
          affiliateEarnings: (currentStats.affiliateEarnings || 0) + saleData.amount,
          totalEarnings: (currentStats.totalEarnings || 0) + saleData.amount,
          updatedAt: new Date().toISOString()
        }
      });
    }

    return newSaleRef.key;
  } catch (error) {
    console.error('Error saving affiliate sale:', error);
    throw error;
  }
};

const saveReferralEarning = async (userId: string, referralData: any) => {
  try {
    const referralsRef = ref(database, `referralEarnings/${userId}`);
    const newReferralRef = push(referralsRef);
    await set(newReferralRef, {
      ...referralData,
      id: newReferralRef.key,
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Update affiliate stats
    const affiliateRef = ref(database, `affiliates/${userId}`);
    const snapshot = await get(affiliateRef);
    if (snapshot.exists()) {
      const affiliateData = snapshot.val();
      const currentStats = affiliateData.stats || {};
      await update(affiliateRef, {
        stats: {
          ...currentStats,
          totalReferrals: (currentStats.totalReferrals || 0) + 1,
          referralEarnings: (currentStats.referralEarnings || 0) + referralData.amount,
          totalEarnings: (currentStats.totalEarnings || 0) + referralData.amount,
          updatedAt: new Date().toISOString()
        }
      });
    }

    return newReferralRef.key;
  } catch (error) {
    console.error('Error saving referral earning:', error);
    throw error;
  }
};

const saveAffiliateLink = async (userId: string, linkData: any) => {
  try {
    const linksRef = ref(database, `affiliateLinks/${userId}`);
    const newLinkRef = push(linksRef);
    await set(newLinkRef, {
      ...linkData,
      id: newLinkRef.key,
      userId: userId,
      createdAt: new Date().toISOString(),
      clicks: 0,
      conversions: 0
    });
    return newLinkRef.key;
  } catch (error) {
    console.error('Error saving affiliate link:', error);
    throw error;
  }
};

const saveReferralLink = async (userId: string, linkData: any) => {
  try {
    const linksRef = ref(database, `referralLinks/${userId}`);
    const newLinkRef = push(linksRef);
    await set(newLinkRef, {
      ...linkData,
      id: newLinkRef.key,
      userId: userId,
      createdAt: new Date().toISOString(),
      clicks: 0,
      signups: 0
    });
    return newLinkRef.key;
  } catch (error) {
    console.error('Error saving referral link:', error);
    throw error;
  }
};

// Real-time data fetching functions
const getAffiliateEarningsData = (userId: string, callback: (data: any[]) => void) => {
  try {
    const earningsRef = ref(database, `affiliateSales/${userId}`);
    return onValue(earningsRef, (snapshot) => {
      if (snapshot.exists()) {
        const earningsData = snapshot.val();
        const earningsArray = Object.values(earningsData).map((earning: any) => ({
          id: earning.id,
          date: earning.timestamp,
          amount: earning.amount || 0,
          description: earning.description || 'Affiliate Sale'
        }));
        callback(earningsArray);
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate earnings:', error);
    callback([]);
  }
};

const getReferralEarningsData = (userId: string, callback: (data: any[]) => void) => {
  try {
    const earningsRef = ref(database, `referralEarnings/${userId}`);
    return onValue(earningsRef, (snapshot) => {
      if (snapshot.exists()) {
        const earningsData = snapshot.val();
        const earningsArray = Object.values(earningsData).map((earning: any) => ({
          id: earning.id,
          date: earning.timestamp,
          amount: earning.amount || 0,
          description: earning.description || 'Referral Bonus'
        }));
        callback(earningsArray);
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Error fetching referral earnings:', error);
    callback([]);
  }
};

const getAffiliateLinks = (userId: string, callback: (data: any[]) => void) => {
  try {
    const linksRef = ref(database, `affiliateLinks/${userId}`);
    return onValue(linksRef, (snapshot) => {
      if (snapshot.exists()) {
        const linksData = snapshot.val();
        const linksArray = Object.values(linksData).map((link: any) => ({
          id: link.id,
          name: link.name || 'Unnamed Link',
          url: link.url,
          clicks: link.clicks || 0,
          conversions: link.conversions || 0,
          createdAt: link.createdAt
        }));
        callback(linksArray);
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    callback([]);
  }
};

const getReferralLinks = (userId: string, callback: (data: any[]) => void) => {
  try {
    const linksRef = ref(database, `referralLinks/${userId}`);
    return onValue(linksRef, (snapshot) => {
      if (snapshot.exists()) {
        const linksData = snapshot.val();
        const linksArray = Object.values(linksData).map((link: any) => ({
          id: link.id,
          name: link.name || 'Unnamed Link',
          url: link.url,
          clicks: link.clicks || 0,
          signups: link.signups || 0,
          createdAt: link.createdAt
        }));
        callback(linksArray);
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Error fetching referral links:', error);
    callback([]);
  }
};

const getBillingHistory = (userId: string, callback: (data: any[]) => void) => {
  try {
    const billingRef = ref(database, `payments/${userId}`);
    return onValue(billingRef, (snapshot) => {
      if (snapshot.exists()) {
        const billingData = snapshot.val();
        const billingArray = Object.values(billingData).map((payment: any) => ({
          id: payment.id,
          date: payment.timestamp,
          amount: payment.amount || 0,
          description: payment.description || 'Payment',
          status: payment.status || 'completed'
        }));
        callback(billingArray);
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    callback([]);
  }
};

const getAffiliateStats = (userId: string, callback: (data: any) => void) => {
  try {
    const affiliateRef = ref(database, `affiliates/${userId}`);
    return onValue(affiliateRef, (snapshot) => {
      if (snapshot.exists()) {
        const affiliateData = snapshot.val();
        callback(affiliateData.stats || {
          totalSales: 0,
          affiliateEarnings: 0,
          referralEarnings: 0,
          totalEarnings: 0,
          totalReferrals: 0
        });
      } else {
        callback({
          totalSales: 0,
          affiliateEarnings: 0,
          referralEarnings: 0,
          totalEarnings: 0,
          totalReferrals: 0
        });
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    callback({
      totalSales: 0,
      affiliateEarnings: 0,
      referralEarnings: 0,
      totalEarnings: 0,
      totalReferrals: 0
    });
  }
};

const getAffiliateData = (userId: string, callback: (data: any) => void) => {
  try {
    const affiliateRef = ref(database, `affiliates/${userId}`);
    return onValue(affiliateRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate data:', error);
    callback(null);
  }
};

// Main Dashboard Component
export default function Dashboard() {
  const { isLoggedIn, userData, logout } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAffiliateLinkDialog, setShowAffiliateLinkDialog] = useState(false);
  const [showReferralLinkDialog, setShowReferralLinkDialog] = useState(false);
  const [linkName, setLinkName] = useState('');

  const [firebaseData, setFirebaseData] = useState({
    affiliateEarnings: [],
    referralEarnings: [],
    billingHistory: [],
    reports: [
      { id: 1, title: 'January Earnings Report', date: '2024-02-01', type: 'Monthly' },
      { id: 2, title: 'Q1 Performance Summary', date: '2024-04-01', type: 'Quarterly' }
    ],
    affiliateLinks: [],
    referralLinks: [],
    affiliateStats: {
      totalSales: 0,
      affiliateEarnings: 0,
      referralEarnings: 0,
      totalEarnings: 0,
      totalReferrals: 0
    },
    affiliateData: null
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      toast({
        title: "Access Denied",
        description: "Please log in to access the dashboard.",
        variant: "destructive",
      });
      setLocation('/');
    }
  }, [isLoggedIn, setLocation, toast]);

  // Get user ID from cookie
  const userId = getCookie('swissgain_uid');

  // Set up real-time Firebase listeners
  useEffect(() => {
    if (!userId || !isLoggedIn) return;

    // Set up real-time listeners
    const unsubscribeAffiliateEarnings = getAffiliateEarningsData(userId, (earnings) => {
      setFirebaseData(prev => ({ ...prev, affiliateEarnings: earnings }));
    });

    const unsubscribeReferralEarnings = getReferralEarningsData(userId, (earnings) => {
      setFirebaseData(prev => ({ ...prev, referralEarnings: earnings }));
    });

    const unsubscribeAffiliateLinks = getAffiliateLinks(userId, (links) => {
      setFirebaseData(prev => ({ ...prev, affiliateLinks: links }));
    });

    const unsubscribeReferralLinks = getReferralLinks(userId, (links) => {
      setFirebaseData(prev => ({ ...prev, referralLinks: links }));
    });

    const unsubscribeBillingHistory = getBillingHistory(userId, (billing) => {
      setFirebaseData(prev => ({ ...prev, billingHistory: billing }));
    });

    const unsubscribeAffiliateStats = getAffiliateStats(userId, (stats) => {
      setFirebaseData(prev => ({ ...prev, affiliateStats: stats }));
    });

    const unsubscribeAffiliateData = getAffiliateData(userId, (affiliateData) => {
      setFirebaseData(prev => ({ ...prev, affiliateData }));
    });

    // Cleanup function
    return () => {
      unsubscribeAffiliateEarnings();
      unsubscribeReferralEarnings();
      unsubscribeAffiliateLinks();
      unsubscribeReferralLinks();
      unsubscribeBillingHistory();
      unsubscribeAffiliateStats();
      unsubscribeAffiliateData();
    };
  }, [userId, isLoggedIn]);

  const calculateROI = () => {
    const totalEarnings = firebaseData.affiliateStats.affiliateEarnings + firebaseData.affiliateStats.referralEarnings;
    const investment = 999; // Fixed affiliate registration fee
    if (investment === 0) return 0;
    return Math.round(((totalEarnings - investment) / investment) * 100);
  };

  const calculateNetProfit = () => {
    const totalEarnings = firebaseData.affiliateStats.affiliateEarnings + firebaseData.affiliateStats.referralEarnings;
    return totalEarnings - 999; // Fixed affiliate registration fee
  };

  const handleSimulateSale = async () => {
    if (!userData?.isAffiliate) {
      toast({
        title: "Not an Affiliate",
        description: "You need to join the affiliate program first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const saleData = {
        amount: 100,
        description: 'Neckchain Sale',
        product: 'Classic Neckchain',
        commission: 100
      };

      await saveAffiliateSale(userId!, saleData);

      toast({
        title: "Congratulations!",
        description: "You earned ₹100 from an affiliate sale!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record sale. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSimulateReferral = async () => {
    try {
      const referralData = {
        amount: 299.9,
        description: 'New Member Referral',
        type: 'direct',
        commission: 299.9
      };

      await saveReferralEarning(userId!, referralData);

      toast({
        title: "Referral Success!",
        description: "You earned ₹299.9 from a successful referral!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record referral. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAffiliateLink = async () => {
    try {
      const newLink = {
        name: linkName || 'New Affiliate Link',
        url: `https://swissgain.com/affiliate/${Math.random().toString(36).substr(2, 9)}`
      };

      await saveAffiliateLink(userId!, newLink);

      setLinkName('');
      setShowAffiliateLinkDialog(false);
      toast({
        title: "Affiliate Link Generated!",
        description: "Your unique affiliate link has been created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate affiliate link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReferralLink = async () => {
    try {
      const newLink = {
        name: linkName || 'New Referral Link',
        url: `https://swissgain.com/refer/${Math.random().toString(36).substr(2, 9)}`
      };

      await saveReferralLink(userId!, newLink);

      setLinkName('');
      setShowReferralLinkDialog(false);
      toast({
        title: "Referral Link Generated!",
        description: "Your unique referral link has been created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate referral link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation('/');
  };

  const dashboardUserData = {
    name: userData?.name || "Guest User",
    email: userData?.email || "",
    phone: userData?.phone || "",
    location: userData?.location || "Not specified",
    joinDate: userData?.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : "Not joined",
    tier: userData?.rank ? `Rank ${userData.rank}` : "Starter",
    profileCompletion: (userData?.name && userData?.email && userData?.phone) ? 100 : 60,
    isAffiliate: userData?.isAffiliate || false
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent
          data={{ membership: { isAffiliate: dashboardUserData.isAffiliate, rank: userData?.rank || 1 } }}
          userData={dashboardUserData}
          calculateROI={calculateROI}
          calculateNetProfit={calculateNetProfit}
          handleSimulateSale={handleSimulateSale}
          handleSimulateReferral={handleSimulateReferral}
          firebaseData={firebaseData}
        />;
      case 'affiliate-earnings':
        return <AffiliateEarningsContent
          data={{ membership: { isAffiliate: dashboardUserData.isAffiliate } }}
          affiliateEarnings={firebaseData.affiliateEarnings}
          affiliateLinks={firebaseData.affiliateLinks}
          handleSimulateSale={handleSimulateSale}
          onGenerateLink={() => setShowAffiliateLinkDialog(true)}
        />;
      case 'sales-dashboard':
        return <AffiliateSales />;

      case 'payment-request':
        return <PaymentRequest />;


      case 'referral-earnings':
        return <ReferralEarningsContent
          data={{ membership: { isAffiliate: dashboardUserData.isAffiliate } }}
          referralEarnings={firebaseData.referralEarnings}
          referralLinks={firebaseData.referralLinks}
          handleSimulateReferral={handleSimulateReferral}
          onGenerateLink={() => setShowReferralLinkDialog(true)}
        />;
      case 'profile':
        return <ProfileContent
          userData={dashboardUserData}
          data={{ membership: { isAffiliate: dashboardUserData.isAffiliate, rank: userData?.rank || 1 } }}
          updateData={() => { }}
        />;
      case 'billing':
        return <BillingContent billingHistory={firebaseData.billingHistory} />;
      case 'reports':
        return <ReportsContent reports={firebaseData.reports} />;
      case 'support-center':
        return <UserSupportCenter  />;  
      default:
        return <OverviewContent
          data={{ membership: { isAffiliate: dashboardUserData.isAffiliate, rank: userData?.rank || 1 } }}
          userData={dashboardUserData}
          calculateROI={calculateROI}
          calculateNetProfit={calculateNetProfit}
          handleSimulateSale={handleSimulateSale}
          handleSimulateReferral={handleSimulateReferral}
          firebaseData={firebaseData}
        />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please log in to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex bg-background min-h-screen my-5 border">
      <Dialog open={showAffiliateLinkDialog} onOpenChange={setShowAffiliateLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Affiliate Link</DialogTitle>
            <DialogDescription>
              Create a unique affiliate link to track your sales and commissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="linkName">Link Name (Optional)</Label>
              <Input
                id="linkName"
                placeholder="e.g., Facebook Campaign, Instagram Bio"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAffiliateLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateAffiliateLink}>
              Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReferralLinkDialog} onOpenChange={setShowReferralLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Referral Link</DialogTitle>
            <DialogDescription>
              Create a unique referral link to track your referrals and earn commissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="referralLinkName">Link Name (Optional)</Label>
              <Input
                id="referralLinkName"
                placeholder="e.g., WhatsApp Share, Email Campaign"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReferralLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReferralLink}>
              Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <div className={`bg-sidebar text-sidebar-foreground transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col border-r`}>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">SwissGain</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 h-8 w-8"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            <SidebarItem
              icon={<Home className="h-4 w-4" />}
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              collapsed={sidebarCollapsed}
            />
            <SidebarItem
              icon={<BarChart3 className="h-4 w-4" />}
              label="Affiliate Earnings"
              active={activeTab === 'affiliate-earnings'}
              onClick={() => setActiveTab('affiliate-earnings')}
              collapsed={sidebarCollapsed}
            />
            <SidebarItem
              icon={<TrendingUp className="h-4 w-4" />}
              label="Sales Dashboard"
              active={activeTab === 'sales-dashboard'}
              onClick={() => setActiveTab('sales-dashboard')}
              collapsed={sidebarCollapsed}
            />
            <SidebarItem
              icon={<User className="h-4 w-4" />}
              label="Referral Earnings"
              active={activeTab === 'referral-earnings'}
              onClick={() => setActiveTab('referral-earnings')}
              collapsed={sidebarCollapsed}
            />
            <SidebarItem
              icon={<User className="h-4 w-4" />}
              label="Profile"
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              collapsed={sidebarCollapsed}
            />
            <SidebarItem
              icon={<Settings className="h-4 w-4" />}
              label="Billing"
              active={activeTab === 'billing'}
              onClick={() => setActiveTab('billing')}
              collapsed={sidebarCollapsed}
            />
            {/* <SidebarItem
              icon={<BarChart3 className="h-4 w-4" />}
              label="Reports"
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              collapsed={sidebarCollapsed}
            /> */}

            <SidebarItem
              icon={<BarChart3 className="h-4 w-4" />}
              label="Payment Request"
              active={activeTab === 'payment-request'}
              onClick={() => setActiveTab('payment-request')}
              collapsed={sidebarCollapsed}
            />

            <SidebarItem
              icon={<BarChart3 className="h-4 w-4" />}
              label="Support Center"
              active={activeTab === 'support-center'}
              onClick={() => setActiveTab('support-center')}
              collapsed={sidebarCollapsed}
            />
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{dashboardUserData.name}</p>
                <p className="text-xs text-muted-foreground truncate">{dashboardUserData.tier}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
              <p className="text-muted-foreground">
                Welcome back, {dashboardUserData.name}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}