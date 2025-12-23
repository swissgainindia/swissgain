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
  Plus,
  ShoppingBag,
  AlertCircle,
  Package,
  RefreshCw
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, update, get, onValue, off, query, orderByChild, equalTo } from 'firebase/database';

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
import Orders from './Order';

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

// Check if user has purchased a product - SIMPLIFIED AND FIXED VERSION
const hasPurchasedProduct = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking purchase status for user:', userId);
    
    if (!userId) {
      console.log('❌ No user ID provided');
      return false;
    }

    // METHOD 1: First check if user has the purchase flag in affiliate data
    const affiliateRef = ref(database, `affiliates/${userId}`);
    const affiliateSnap = await get(affiliateRef);
    
    if (affiliateSnap.exists()) {
      const affiliateData = affiliateSnap.val();
      console.log('📋 Affiliate data found:', {
        name: affiliateData.name,
        email: affiliateData.email,
        hasPurchasedProduct: affiliateData.hasPurchasedProduct,
        isAffiliate: affiliateData.isAffiliate
      });
      
      // Check if hasPurchasedProduct flag is true
      if (affiliateData.hasPurchasedProduct === true) {
        console.log('✅ Purchase confirmed from affiliate flag (hasPurchasedProduct: true)');
        return true;
      }
    }

    // METHOD 2: Check orders collection for any paid orders
    console.log('🔍 Checking orders collection...');
    const ordersRef = ref(database, 'orders');
    const ordersSnap = await get(ordersRef);
    
    if (ordersSnap.exists()) {
      const orders = ordersSnap.val();
      console.log('📦 Total orders in database:', Object.keys(orders).length);
      
      // Get user email from affiliate data for matching
      let userEmail = '';
      if (affiliateSnap.exists()) {
        userEmail = affiliateSnap.val().email || '';
      }
      
      // Search through ALL orders
      for (const orderId in orders) {
        const order = orders[orderId];
        
        // Check multiple ways the user might be identified in the order
        const isUserInOrder = 
          order.customerId === userId || 
          order.originalCustomerId === userId ||
          order.uid === userId ||
          (order.customerInfo && order.customerInfo.email && userEmail && order.customerInfo.email === userEmail) ||
          (order.affiliateId === userId);
        
        if (isUserInOrder) {
          console.log('👤 User found in order:', orderId);
          console.log('📊 Order details:', {
            orderId,
            customerId: order.customerId,
            originalCustomerId: order.originalCustomerId,
            uid: order.uid,
            affiliateId: order.affiliateId,
            customerEmail: order.customerInfo?.email,
            paymentStatus: order.paymentStatus,
            status: order.status,
            productName: order.productName,
            totalAmount: order.totalAmount
          });
          
          // Check if order is paid/delivered
          const isPaid = order.paymentStatus === 'paid' || order.status === 'paid' || 
                        order.status === 'delivered' || order.status === 'shipped' || 
                        order.status === 'confirmed' || order.status === 'completed' ||
                        order.paymentStatus === 'completed';
          
          if (isPaid) {
            console.log('✅ Purchase confirmed from paid order');
            
            // Update the affiliate record with purchase flag
            if (affiliateSnap.exists()) {
              await update(affiliateRef, {
                hasPurchasedProduct: true,
                lastPurchaseDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                purchaseVerified: true
              });
              console.log('📝 Updated affiliate record with purchase flag');
            }
            
            return true;
          } else {
            console.log('⚠️ Order found but not paid:', order.paymentStatus, order.status);
          }
        }
      }
      
      // If no direct match, check by scanning all orders for email match
      if (userEmail) {
        console.log('🔍 Scanning all orders for email match:', userEmail);
        for (const orderId in orders) {
          const order = orders[orderId];
          if (order.customerInfo && order.customerInfo.email === userEmail) {
            console.log('📧 Found order with matching email:', orderId);
            console.log('Order payment status:', order.paymentStatus);
            
            if (order.paymentStatus === 'paid' || order.status === 'paid') {
              console.log('✅ Purchase confirmed by email match');
              
              // Update the affiliate record with purchase flag
              if (affiliateSnap.exists()) {
                await update(affiliateRef, {
                  hasPurchasedProduct: true,
                  lastPurchaseDate: new Date().toISOString(),
                  lastUpdated: new Date().toISOString(),
                  purchaseVerified: true
                });
              }
              
              return true;
            }
          }
        }
      }
    } else {
      console.log('📭 No orders found in database');
    }

    // METHOD 3: Check for any sales/earnings (for existing active affiliates)
    if (affiliateSnap.exists()) {
      const affiliateData = affiliateSnap.val();
      
      // If user is an affiliate and has been active for a while, allow access
      if (affiliateData.isAffiliate && affiliateData.joinDate) {
        console.log('👑 User is affiliate, checking activity...');
        
        // Check affiliate sales
        const salesRef = ref(database, `affiliateSales/${userId}`);
        const salesSnap = await get(salesRef);
        
        // Check referral earnings
        const referralsRef = ref(database, `referralEarnings/${userId}`);
        const referralsSnap = await get(referralsRef);
        
        const hasSales = salesSnap.exists() && Object.keys(salesSnap.val()).length > 0;
        const hasReferrals = referralsSnap.exists() && Object.keys(referralsSnap.val()).length > 0;
        
        console.log('📈 Activity check:', { hasSales, hasReferrals });
        
        if (hasSales || hasReferrals) {
          console.log('✅ User has sales/referrals, allowing access');
          return true;
        }
      }
    }

    console.log('❌ No purchase found for user');
    return false;
  } catch (error) {
    console.error('❌ Error checking purchase status:', error);
    return false;
  }
};

// Direct access function for testing
const forceAllowAccess = async (userId: string): Promise<boolean> => {
  try {
    console.log('🚨 TEMPORARY FIX: Force allowing access for user:', userId);
    
    // Directly update the affiliate record to mark as purchased
    const affiliateRef = ref(database, `affiliates/${userId}`);
    const affiliateSnap = await get(affiliateRef);
    
    if (affiliateSnap.exists()) {
      await update(affiliateRef, {
        hasPurchasedProduct: true,
        lastPurchaseDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        purchaseVerified: true,
        forceAccessGranted: true
      });
      console.log('✅ Force updated affiliate record');
      return true;
    } else {
      // Create affiliate record if it doesn't exist
      await set(affiliateRef, {
        uid: userId,
        hasPurchasedProduct: true,
        lastPurchaseDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        purchaseVerified: true,
        forceAccessGranted: true
      });
      console.log('✅ Created affiliate record with purchase flag');
      return true;
    }
  } catch (error) {
    console.error('Error in forceAllowAccess:', error);
    return false;
  }
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
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [loadingPurchaseCheck, setLoadingPurchaseCheck] = useState(true);
  const [showForceAccessBtn, setShowForceAccessBtn] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

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

  // Get user ID from cookie
  const userId = getCookie('swissgain_uid');

  // Check if user has purchased a product
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!userId || !isLoggedIn) {
        console.log('No user ID or not logged in');
        setDebugInfo('No user ID or not logged in');
        return;
      }
      
      console.log('🔄 Starting purchase check for user:', userId);
      setDebugInfo(`Checking purchase status for user: ${userId}`);
      setLoadingPurchaseCheck(true);
      
      try {
        // First try normal check
        const purchased = await hasPurchasedProduct(userId);
        console.log('Purchase check result:', purchased);
        setDebugInfo(`Purchase check result: ${purchased ? 'ACCESS GRANTED' : 'ACCESS DENIED'}`);
        
        if (!purchased) {
          // If not purchased, show force access button after 3 seconds
          setTimeout(() => {
            setShowForceAccessBtn(true);
          }, 3000);
        }
        
        setHasPurchased(purchased);
      } catch (error) {
        console.error('Error checking purchase status:', error);
        setDebugInfo(`Error: ${error.message}`);
        setHasPurchased(false);
        setShowForceAccessBtn(true);
      } finally {
        setLoadingPurchaseCheck(false);
      }
    };

    if (isLoggedIn && userId) {
      checkPurchaseStatus();
    }
  }, [userId, isLoggedIn]);

  // Force access button handler
  const handleForceAccess = async () => {
    if (!userId) return;
    
    setLoadingPurchaseCheck(true);
    try {
      const success = await forceAllowAccess(userId);
      if (success) {
        toast({
          title: "Access Granted!",
          description: "Dashboard access has been manually enabled.",
          variant: "default",
        });
        setHasPurchased(true);
        setShowForceAccessBtn(false);
        setDebugInfo('Access manually enabled via force access button');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable access. Please try again.",
        variant: "destructive",
      });
      setDebugInfo(`Force access error: ${error.message}`);
    } finally {
      setLoadingPurchaseCheck(false);
    }
  };

  // Retry purchase check
  const handleRetryCheck = async () => {
    if (!userId) return;
    
    setLoadingPurchaseCheck(true);
    setDebugInfo('Retrying purchase check...');
    try {
      const purchased = await hasPurchasedProduct(userId);
      setHasPurchased(purchased);
      setDebugInfo(`Retry result: ${purchased ? 'ACCESS GRANTED' : 'ACCESS DENIED'}`);
    } catch (error) {
      console.error('Error retrying purchase check:', error);
      setDebugInfo(`Retry error: ${error.message}`);
    } finally {
      setLoadingPurchaseCheck(false);
    }
  };

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

  // Set up real-time Firebase listeners - ONLY if user has purchased
  useEffect(() => {
    if (!userId || !isLoggedIn || hasPurchased === false) return;

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
  }, [userId, isLoggedIn, hasPurchased]);

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
    isAffiliate: userData?.isAffiliate || false,
    hasPurchasedProduct: hasPurchased || false
  };

  // Purchase Required Component - UPDATED WITH FORCE ACCESS BUTTON
  const PurchaseRequiredMessage = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="h-10 w-10 text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Purchase Required
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        You have successfully paid the affiliate membership fee of ₹999. 
        To access the full dashboard features and start earning commissions, 
        you need to purchase at least one product from our store.
      </p>
      
      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-gray-100 p-3 rounded-lg mb-4 max-w-md w-full">
          <p className="text-xs font-mono text-gray-700 break-all">
            <strong>Debug Info:</strong> {debugInfo}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            User ID: {userId}
          </p>
        </div>
      )}
      
      {/* {showForceAccessBtn && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6 max-w-md w-full">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-semibold mb-2">
                Having trouble accessing dashboard even after purchase?
              </p>
              <p className="text-xs text-red-700 mb-3">
                If you've already purchased a product but still can't access the dashboard, 
                click the button below to manually enable access.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleForceAccess} 
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  disabled={loadingPurchaseCheck}
                >
                  {loadingPurchaseCheck ? 'Processing...' : 'Enable Dashboard Access Manually'}
                </Button>
                <Button 
                  onClick={handleRetryCheck} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600"
                  disabled={loadingPurchaseCheck}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Purchase Check
                </Button>
              </div>
            </div>
          </div>
        </div>
      )} */}
      
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6 max-w-md w-full">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Your affiliate membership is active, but dashboard access requires a product purchase.
          </p>
        </div>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => setLocation('/products')} className="gradient-primary">
          <ShoppingBag className="mr-2 h-4 w-4" />
          Browse Products
        </Button>
        <Button variant="outline" onClick={() => setLocation('/')}>
          Go to Homepage
        </Button>
      </div>
    </div>
  );

  // Loading State
  if (loadingPurchaseCheck) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Checking Access</CardTitle>
            <CardDescription>
              Verifying your purchase status...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Checking Firebase for your purchase records...
            </p>
            {debugInfo && (
              <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Purchase Required State
  if (hasPurchased === false && userData?.isAffiliate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <header className="bg-background border-b px-6 py-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">SwissGain Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back, {dashboardUserData.name}!
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>
          <PurchaseRequiredMessage />
        </div>
      </div>
    );
  }

  // Not Logged In
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
      case 'orders':
        return <Orders />;
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
            <SidebarItem
              icon={<Package className="h-4 w-4" />}
              label="Orders"
              active={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
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
                {hasPurchased && (
                  <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-200">
                    Product Owner
                  </Badge>
                )}
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
                {hasPurchased && (
                  <span className="ml-2 text-green-600 font-medium">
                    ✓ Product Verified
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
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