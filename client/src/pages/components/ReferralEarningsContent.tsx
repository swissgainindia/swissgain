// Updated ReferralEarningsContent - Complete with all sections
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign, Link as LinkIcon, Copy, Share2, Users,
  ArrowUpRight, ArrowDownRight, Wallet, IndianRupee, Activity,
  ShoppingBag, Filter, Search, BarChart, Zap
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, update } from 'firebase/database';

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

let app: any, database: any;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (e: any) {
  if (e.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'ReferEarnApp');
    database = getDatabase(app);
  }
}

function Clock(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function ReferralEarningsContent() {
  const { toast } = useToast();
  const [referralLink, setReferralLink] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    referralEarnings: 0,
    pendingReferrals: 0,
    networkSize: 0,
    totalSales: 0,
    conversionRate: 0
  });
  const [affiliateInfo, setAffiliateInfo] = useState({
    name: 'Your Username',
    phone: 'Not provided',
    affiliateId: 'Not generated',
    status: 'Inactive',
    joinDate: 'Not joined'
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [allReferrals, setAllReferrals] = useState<any[]>([]);
  const [allAffiliates, setAllAffiliates] = useState<any>({});
  const [allOrders, setAllOrders] = useState<any>({});
  const [downlineUsers, setDownlineUsers] = useState<any[]>([]);
  
  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  
  // Load commissions data
  const [allCommissions, setAllCommissions] = useState<any>({});

  const commissionLevels = [
    { level: 1, commission: "10% + ₹100", amount: "₹190+", color: "from-slate-500 to-slate-600", people: 5 },
    { level: 2, commission: "5%", amount: "₹45+", color: "from-gray-500 to-gray-600", people: 25 },
    { level: 3, commission: "2.5%", amount: "₹22.5+", color: "from-amber-500 to-amber-600", people: 125 },
    { level: 4, commission: "2%", amount: "₹18+", color: "from-purple-500 to-purple-600", people: 625 },
    { level: 5, commission: "1.5%", amount: "₹13.5+", color: "from-pink-500 to-pink-600", people: 3125 },
    { level: 6, commission: "1%", amount: "₹9+", color: "from-indigo-500 to-indigo-600", people: 15625 },
    { level: 7, commission: "0.8%", amount: "₹7.2+", color: "from-orange-500 to-orange-600", people: 78125 },
    { level: 8, commission: "0.6%", amount: "₹5.4+", color: "from-teal-500 to-teal-600", people: 390625 },
    { level: 9, commission: "0.5%", amount: "₹4.5+", color: "from-rose-500 to-rose-600", people: 1953125 },
    { level: 10, commission: "0.5%", amount: "₹4.5+", color: "from-cyan-500 to-cyan-600", people: 9765625 }
  ];

  /* ---------- Cookie helpers ---------- */
  const getCookie = (name: string) => {
    const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? m[2] : null;
  };

  const setCookie = (name: string, value: string, days: number) => {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
  };

  /* ---------- Initialize UID & check status ---------- */
  useEffect(() => {
    let uid = getCookie('swissgain_uid');
    if (!uid) {
      uid = 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setCookie('swissgain_uid', uid, 365);
    }
    setUserId(uid);
    checkUserStatus(uid);
    loadWalletData(uid);
  }, []);

  // Load commissions data
  useEffect(() => {
    if (!userId) return;
    const commissionsRef = ref(database, `commissions/${userId}`);
    onValue(commissionsRef, (snap) => {
      if (snap.exists()) {
        setAllCommissions(snap.val());
        console.log('📊 Commissions loaded:', Object.values(snap.val()));
      } else {
        setAllCommissions({});
      }
    });
  }, [userId]);

  // Calculate totals from commissions and transactions
  useEffect(() => {
    if (!userId) return;

    // Calculate from commissions data
    const commissionsArray = Object.values(allCommissions);
    const commissionsTotal = commissionsArray.reduce((sum: number, commission: any) => {
      return sum + (commission.commissionAmount || 0);
    }, 0);

    // Calculate from transaction history
    const transactionTotal = transactionHistory
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const withdrawn = transactionHistory
      .filter(t => t.type === 'debit' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Use commissions total for accurate earnings
    const finalTotalEarned = commissionsTotal;
    
    setTotalEarned(finalTotalEarned);
    setTotalWithdrawn(withdrawn);

    console.log('💰 Earnings Calculation:', {
      commissionsTotal,
      transactionTotal,
      finalTotalEarned,
      commissionsCount: commissionsArray.length
    });
  }, [allCommissions, transactionHistory, userId]);

  // Load wallet data with enhanced transaction processing
  const loadWalletData = (uid: string) => {
    try {
      // Load wallet balance
      const walletRef = ref(database, `wallets/${uid}`);
      onValue(walletRef, (snap) => {
        if (snap.exists()) {
          const walletData = snap.val();
          setWalletBalance(walletData.balance || 0);
          setUpiId(walletData.upiId || '');
        } else {
          set(walletRef, {
            balance: 0,
            upiId: '',
            createdAt: new Date().toISOString()
          });
        }
      });

      // Load and process transaction history
      const transactionsRef = ref(database, `transactions/${uid}`);
      onValue(transactionsRef, (snap) => {
        if (snap.exists()) {
          const transactionsData = snap.val();
          const transactionsArray = Object.keys(transactionsData).map(key => ({
            id: key,
            ...transactionsData[key]
          }));

          // Process transactions to combine commission data
          const processedTransactions = processTransactionsWithCommissions(
            transactionsArray, 
            allCommissions
          );

          // Sort by timestamp
          const sortedTransactions = processedTransactions.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setTransactionHistory(sortedTransactions);
        } else {
          setTransactionHistory([]);
        }
      });
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

// Add this function to properly format commission descriptions
const formatCommissionDescription = (transaction: any) => {
  if (transaction.description?.includes('Level 1 commission') && transaction.description?.includes('fixed affiliate bonus')) {
    return transaction.description;
  }
  
  // For legacy Level 1 commissions without bonus, enhance the description
  if (transaction.description?.includes('Level 1 commission') && !transaction.description?.includes('fixed affiliate bonus')) {
    return `${transaction.description} + ₹100 fixed affiliate bonus`;
  }
  
  return transaction.description;
};

  // Function to process transactions and combine with commission data

const processTransactionsWithCommissions = (transactions: any[], commissions: any) => {
  const commissionsArray = Object.values(commissions);
  
  return transactions.map(transaction => {
    // For credit transactions, try to find matching commission data
    if (transaction.type === 'credit' && transaction.description?.includes('commission')) {
      const matchingCommission = commissionsArray.find((comm: any) => 
        comm.orderId === transaction.orderId ||
        comm.timestamp === transaction.timestamp ||
        comm.commissionAmount === transaction.amount
      );

      if (matchingCommission) {
        // Use the enhanced description from the commission record
        let enhancedDescription = matchingCommission.description || transaction.description;
        
        // Ensure Level 1 commissions show the bonus
        if (matchingCommission.level === 1 && !enhancedDescription.includes('₹100')) {
          const baseCommission = Math.round((matchingCommission.purchaseAmount || transaction.amount * 10) * 0.10);
          enhancedDescription = `Level 1 commission (10.0%) from ${matchingCommission.customerName || 'customer'}'s purchase of ${matchingCommission.productName || 'product'} + ₹100 fixed affiliate bonus`;
        }

        return {
          ...transaction,
          description: enhancedDescription,
          commissionData: matchingCommission
        };
      }
    }

    return {
      ...transaction,
      description: formatCommissionDescription(transaction)
    };
  });
};

  // Reload transactions when commissions change
  useEffect(() => {
    if (userId && transactionHistory.length > 0) {
      const transactionsRef = ref(database, `transactions/${userId}`);
      onValue(transactionsRef, (snap) => {
        if (snap.exists()) {
          const transactionsData = snap.val();
          const transactionsArray = Object.keys(transactionsData).map(key => ({
            id: key,
            ...transactionsData[key]
          }));

          const processedTransactions = processTransactionsWithCommissions(
            transactionsArray, 
            allCommissions
          );

          const sortedTransactions = processedTransactions.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setTransactionHistory(sortedTransactions);
        }
      });
    }
  }, [allCommissions, userId]);

  // Load other data (affiliates, orders, etc.)
  useEffect(() => {
    const affRef = ref(database, 'affiliates');
    onValue(affRef, (snap) => {
      if (snap.exists()) {
        setAllAffiliates(snap.val());
      }
    });
  }, []);

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snap) => {
      if (snap.exists()) {
        setAllOrders(snap.val());
      } else {
        setAllOrders({});
      }
    });
  }, []);

  // Build downline users and calculate stats
  useEffect(() => {
    if (!userId || Object.keys(allAffiliates).length === 0) return;
    
    const downline: any[] = [];
    const buildLevels = (targetUid: string, currentUid: string, affiliates: any, vis: Set<string>): number => {
      if (vis.has(targetUid)) return -1;
      vis.add(targetUid);
      const user = affiliates[targetUid];
      if (!user) return -1;
      if (targetUid === currentUid) return 0;
      if (!user.referredById) return -1;
      const parentLevel = buildLevels(user.referredById, currentUid, affiliates, vis);
      if (parentLevel >= 0) return parentLevel + 1;
      return -1;
    };

    Object.entries(allAffiliates).forEach(([key, user]: [string, any]) => {
      if (key === userId) return;
      const vis = new Set<string>();
      const level = buildLevels(key, userId, allAffiliates, vis);
      if (level > 0 && level <= 10) {
        const commLevel = commissionLevels[level - 1];
        const referrerUid = user.referredById;
        const referrerName = allAffiliates[referrerUid]?.name || 'Direct';
        downline.push({
          uid: key,
          name: user.name || 'New User',
          joinDate: user.joinDate,
          level,
          commissionPercent: commLevel.commission,
          referrerUid,
          referrerName,
        });
      }
    });

    downline.sort((a, b) => a.level - b.level || (new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()));
    setDownlineUsers(downline);

    // Calculate stats
    const commissionsArray = Object.values(allCommissions);
    const totalEarnings = commissionsArray.reduce((sum: number, commission: any) => {
      return sum + (commission.commissionAmount || 0);
    }, 0);

    const salesCount = commissionsArray.filter((comm: any) => comm.commissionAmount > 0).length;
    const usersWithSales = new Set(commissionsArray.map((comm: any) => comm.customerId).filter(Boolean));
    const convRate = downline.length > 0 ? (usersWithSales.size / downline.length * 100) : 0;

    setReferralStats({
      totalReferrals: downline.length,
      pendingReferrals: downline.length - usersWithSales.size,
      referralEarnings: totalEarnings,
      totalSales: salesCount,
      conversionRate: convRate,
      networkSize: downline.length
    });

  }, [userId, allAffiliates, allCommissions]);

  // Calculate sales data from commissions and orders
  useEffect(() => {
    if (!userId || !allCommissions || Object.keys(allCommissions).length === 0) return;

    const commissionsArray = Object.values(allCommissions);
    const salesDataLocal: any[] = [];

    commissionsArray.forEach((commission: any) => {
      if (commission.commissionAmount > 0) {
        const saleData = {
          id: commission.orderId || `comm_${Date.now()}`,
          dateId: formatDateForId(commission.timestamp),
          level: commission.level || 1,
          product: commission.productName || 'Premium Product',
          customer: commission.customerName || 'Customer',
          customerId: commission.customerId || 'unknown',
          amount: `₹${commission.purchaseAmount?.toLocaleString() || '0'}`,
          myCommission: `₹${commission.commissionAmount.toLocaleString()}`,
          status: 'Completed',
          orderDate: formatDate(commission.timestamp),
          description: commission.description || 'Commission'
        };
        salesDataLocal.push(saleData);
      }
    });

    // Sort by date
    setSalesData(salesDataLocal.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }, [allCommissions, userId]);

  // Format date for ID
  const formatDateForId = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      }).replace(/\//g, '/');
    } catch {
      return '01/01/2023';
    }
  };

  /* ---------- Withdrawal Functions ---------- */

  const processWithdrawal = async () => {
    if (!userId) return;
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount < 100) {
      toast({ title: "Invalid Amount", description: "Minimum withdrawal amount is ₹100", variant: "destructive" });
      return;
    }
    if (amount > walletBalance) {
      toast({ title: "Insufficient Balance", description: `Your wallet balance is ₹${walletBalance.toLocaleString()}`, variant: "destructive" });
      return;
    }
    if (!upiId) {
      toast({ title: "UPI ID Required", description: "Please set your UPI ID in wallet settings", variant: "destructive" });
      return;
    }

    try {
      const walletRef = ref(database, `wallets/${userId}`);
      const transactionRef = push(ref(database, `transactions/${userId}`));
      const withdrawalRef = push(ref(database, `withdrawals/${userId}`));

      const newBalance = walletBalance - amount;
      await update(walletRef, { balance: newBalance });
      
      await set(withdrawalRef, {
        amount: amount,
        upiId: upiId,
        status: 'pending',
        timestamp: new Date().toISOString(),
        processedAt: null
      });

      await set(transactionRef, {
        amount: amount,
        type: 'debit',
        description: 'Withdrawal to UPI',
        balanceAfter: newBalance,
        timestamp: new Date().toISOString(),
        upiId: upiId,
        status: 'pending'
      });

      setWalletBalance(newBalance);
      setWithdrawalAmount('');
      setShowWithdrawalModal(false);
      
      toast({
        title: "Withdrawal Request Sent",
        description: `₹${amount.toLocaleString()} withdrawal to ${upiId} is being processed.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({ title: "Withdrawal Failed", description: "Please try again later.", variant: "destructive" });
    }
  };

  const updateUpiId = async (newUpiId: string) => {
    if (!userId) return;
    try {
      const walletRef = ref(database, `wallets/${userId}`);
      await update(walletRef, { upiId: newUpiId });
      setUpiId(newUpiId);
      toast({ title: "UPI ID Updated", description: "Your UPI ID has been saved successfully.", variant: "default" });
    } catch (error) {
      console.error('Error updating UPI ID:', error);
      toast({ title: "Update Failed", description: "Failed to update UPI ID. Please try again.", variant: "destructive" });
    }
  };

  /* ---------- Referral Link Functions ---------- */
  const checkUserStatus = async (uid: string) => {
    try {
      const affRef = ref(database, `affiliates/${uid}`);
      const snap = await get(affRef);
      if (snap.exists()) {
        const userDataLocal = snap.val();
        setUserData(userDataLocal);
        setAffiliateInfo(prev => ({
          ...prev,
          name: userDataLocal.name || 'Your Username',
          phone: userDataLocal.phone || 'Not provided',
          status: userDataLocal.isAffiliate ? 'Active' : 'Inactive',
          joinDate: userDataLocal.joinDate ? formatDate(userDataLocal.joinDate) : 'Not joined',
          affiliateId: userDataLocal.referralCode || 'Not generated'
        }));
        if (userDataLocal.isAffiliate) {
          generateReferralLink(uid, userDataLocal);
        }
      } else {
        const userRef = ref(database, `affiliates/${uid}`);
        await set(userRef, {
          name: 'New User',
          isAffiliate: false,
          joinDate: new Date().toISOString()
        });
        setUserData({ name: 'New User', isAffiliate: false, joinDate: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const generateReferralLink = (uid: string, userData: any) => {
    const baseUrl = window.location.origin;
    const referralCode = userData.referralCode || generateReferralCode(userData.name, uid);
    const link = `${baseUrl}/affiliate?ref=${referralCode}`;
    setReferralLink(link);
    if (!userData.referralCode) {
      const userRef = ref(database, `affiliates/${uid}`);
      set(userRef, {
        ...userData,
        referralCode: referralCode,
        referralLink: link,
        isAffiliate: true,
        joinDate: userData.joinDate || new Date().toISOString()
      });
    }
    setAffiliateInfo(prev => ({
      ...prev,
      name: userData.name || 'Your Username',
      affiliateId: referralCode,
      status: 'Active',
      joinDate: formatDate(userData.joinDate || new Date().toISOString())
    }));
  };

  const generateReferralCode = (name: string, uid: string) => {
    const namePart = name?.replace(/\s+/g, '').toLowerCase().substring(0, 6) || 'user';
    const uidPart = uid.substring(uid.length - 6);
    return `${namePart}${uidPart}`;
  };

  const handleGenerateLink = async () => {
    if (!userId) {
      toast({ title: "User Not Found", description: "Please refresh the page and try again.", variant: "destructive" });
      return;
    }
    const userRef = ref(database, `affiliates/${userId}`);
    if (!userData) {
      const newUserData = { name: 'New Affiliate', isAffiliate: true, joinDate: new Date().toISOString() };
      await set(userRef, newUserData);
      setUserData(newUserData);
      generateReferralLink(userId, newUserData);
      toast({ title: "Welcome to Affiliate Program!", description: "Your account has been created and referral link generated." });
      return;
    }
    let updatedData = { ...userData, isAffiliate: true };
    await set(userRef, updatedData);
    setUserData(updatedData);
    generateReferralLink(userId, updatedData);
    toast({ title: "Affiliate Program Joined!", description: "You are now an affiliate member." });
  };

  const handleCopyLink = async () => {
    if (!referralLink) {
      toast({ title: "No Link Available", description: "Please generate a referral link first.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: "Link Copied!", description: "Referral link copied to clipboard." });
    } catch (err) {
      toast({ title: "Copy Failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const handleShareLink = async () => {
    if (!referralLink) {
      toast({ title: "No Link Available", description: "Please generate a referral link first.", variant: "destructive" });
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SwissGain Affiliate Program',
          text: 'Join SwissGain and start earning with premium jewelry sales! Earn 10% commission + ₹100 bonus per direct referral sale.',
          url: referralLink
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  /* ---------- Utility Functions ---------- */
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8 w-full">
          
          {/* Sidebar Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Earnings Summary Card */}
            <Card className="rounded-lg bg-card border-0 shadow-lg bg-gradient-to-br from-gray-500 to-gray-700 text-white md:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Earnings Summary</h3>
                  <DollarSign className="h-6 w-6 text-gray-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center bg-white/10 rounded-lg p-3">
                    <div className="text-xl font-bold text-yellow-100">₹{totalEarned.toLocaleString()}</div>
                    <p className="text-xs text-gray-200 mt-1">Total Earned</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-lg p-3">
                    <div className="text-xl font-bold text-red-100">₹{totalWithdrawn.toLocaleString()}</div>
                    <p className="text-xs text-gray-200 mt-1">Total Withdrawn</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-100">₹{walletBalance.toLocaleString()}</div>
                    <p className="text-xs text-gray-200 mt-1">Available</p>
                  </div>
                </div>
                {/* <div className="space-y-3">
                  <Button
                    onClick={() => setShowWithdrawalModal(true)}
                    disabled={walletBalance < 100}
                    className="w-full bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Withdraw Money
                  </Button>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white">UPI ID:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white hover:bg-white/20 h-6 px-2"
                        onClick={() => {
                          const newUpiId = prompt('Enter your UPI ID:', upiId);
                          if (newUpiId) updateUpiId(newUpiId);
                        }}
                      >
                        {upiId ? 'Change' : 'Add'}
                      </Button>
                    </div>
                    <p className="text-white text-sm font-medium break-all">
                      {upiId || 'Not set'}
                    </p>
                  </div>
                </div> */}
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-slate-600" />
                  Performance Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Referrals</span>
                  <span className="font-bold text-gray-900">{referralStats.totalReferrals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Sales</span>
                  <span className="font-bold text-amber-600">{referralStats.totalSales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="font-bold text-slate-600">₹{totalEarned.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Wallet</span>
                  <span className="font-bold text-amber-600">₹{walletBalance.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Your Referral Link Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">Your Referral Link</h3>
                {referralLink ? (
                  <div className="space-y-3">
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-sm break-all">{referralLink}</p>
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      className="w-full bg-white text-slate-600 hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      onClick={handleShareLink}
                      variant="outline"
                      className="w-full bg-transparent text-white border-white hover:bg-white/20"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Link
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleGenerateLink}
                    className="w-full bg-white text-slate-600 hover:bg-gray-100"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Join Affiliate Program
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Referrals</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">{referralStats.totalReferrals}</h3>
                  </div>
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm text-gray-600">{allReferrals.length} people joined</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Earnings</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{totalEarned.toLocaleString()}</h3>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm text-gray-600">From {referralStats.totalSales} sales</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Wallet Balance</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{walletBalance.toLocaleString()}</h3>
                  </div>
                  <Wallet className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Available for withdrawal</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pending</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">{referralStats.pendingReferrals}</h3>
                  </div>
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowDownRight className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Awaiting purchase</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Transaction History</CardTitle>
                <CardDescription>
                  All your wallet transactions and commissions
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                Balance: ₹{walletBalance.toLocaleString()}
              </Badge>
            </CardHeader>
            <CardContent>
              {transactionHistory.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionHistory.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {formatDateTime(transaction.timestamp)}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="text-sm">
                              {transaction.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={transaction.type === 'credit' ? 'default' : 'secondary'}
                              className={transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="font-bold text-gray-900">
                            ₹{transaction.balanceAfter?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                              className={transaction.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'}
                            >
                              {transaction.status || 'completed'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
                  <p className="text-gray-600">Your transaction history will appear here when you start earning commissions.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referral Details Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Your Referral Details</CardTitle>
                <CardDescription>
                  All people who joined through your referral chain (up to 10 levels)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." className="pl-10 w-40" />
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allReferrals.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Commission %</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Referred By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Earned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allReferrals.map((referral, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{formatDate(referral.joinDate)}</TableCell>
                          <TableCell className="font-bold">{referral.level}</TableCell>
                          <TableCell className="font-bold text-green-600">{referral.commissionPercent}</TableCell>
                          <TableCell className="font-mono text-sm">{referral.uid.substring(0, 8)}...</TableCell>
                          <TableCell>{referral.name}</TableCell>
                          <TableCell>{referral.referrerName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={referral.hasPurchase ? 'default' : 'secondary'}
                              className={referral.hasPurchase ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'}
                            >
                              {referral.hasPurchase ? 'Active' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            ₹{referral.totalEarnedFromThis?.toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Referrals Yet</h3>
                  <p className="text-gray-600 mb-4">Share your referral link to start getting referrals.</p>
                  <Button onClick={handleShareLink} className="bg-gray-600 hover:bg-gray-700">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Your Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Details Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Your Sales Details</CardTitle>
                <CardDescription>
                  Purchase details from your referral chain with your commissions (10% + ₹100 for direct referrals)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salesData.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date ID</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>My Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.map((sale, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{sale.dateId}</TableCell>
                          <TableCell className="font-bold">{sale.level}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{sale.product}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{sale.customer}</TableCell>
                          <TableCell className="font-mono text-sm">{sale.customerId.substring(0, 8)}...</TableCell>
                          <TableCell className="font-bold">{sale.amount}</TableCell>
                          <TableCell className="font-bold text-green-600">
                            {sale.myCommission}
                            {sale.level === 1 && (
                              <div className="text-xs text-gray-500">(10% + ₹100 bonus)</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={sale.status === 'Completed' ? 'default' : 'secondary'}
                              className={sale.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'}
                            >
                              {sale.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{sale.orderDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Yet</h3>
                  <p className="text-gray-600">Sales data will appear here when your referrals make purchases.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-gray-600" />
                  How Your Affiliate System Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600">Your Unique Affiliate ID</h4>
                  <p className="text-lg font-mono text-gray-600 mt-1 break-all">{affiliateInfo.affiliateId}</p>
                </div>
                <p className="text-sm text-gray-600">
                  Share your unique affiliate link. When someone joins through your link, they'll appear here automatically.
                  You earn <strong>10% commission + ₹100 fixed bonus</strong> on direct referral purchases, and regular commissions on downline purchases.
                  Commissions are automatically added to your wallet.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-gray-600" />
                  Real-time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  This dashboard updates in real-time. Every new referral through your link will instantly appear here.
                  Commissions are processed at purchase time and credited to wallets automatically.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{allReferrals.length}</div>
                    <div className="text-xs text-gray-600">Total Referrals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{referralStats.totalSales}</div>
                    <div className="text-xs text-gray-600">Active Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">₹{walletBalance.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">In Wallet</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Withdraw Money
              </CardTitle>
              <CardDescription>Transfer funds to your UPI account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min="100"
                  max={walletBalance}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum withdrawal: ₹100 | Available: ₹{walletBalance.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">UPI ID</label>
                <div className="flex gap-2">
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                  />
                  <Button onClick={() => updateUpiId(upiId)} variant="outline">Save</Button>
                </div>
              </div>
              {withdrawalAmount && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Withdrawal Amount:</span>
                    <span className="font-bold">₹{parseFloat(withdrawalAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Processing Fee:</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 font-bold">
                    <span>You'll Receive:</span>
                    <span>₹{parseFloat(withdrawalAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardContent className="flex gap-3 pt-0">
              <Button variant="outline" className="flex-1" onClick={() => setShowWithdrawalModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gray-600 hover:bg-gray-700"
                onClick={processWithdrawal}
                disabled={!withdrawalAmount || parseFloat(withdrawalAmount) < 100 || parseFloat(withdrawalAmount) > walletBalance || !upiId}
              >
                Confirm Withdrawal
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}