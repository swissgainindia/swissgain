'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DollarSign, TrendingUp, Users, Target, Trophy, ArrowUpRight, Users as UsersIcon,
  ExternalLink, Wallet, IndianRupee, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, get } from 'firebase/database';

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

// Initialize Firebase safely
let app;
let database;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'OverviewApp');
    database = getDatabase(app);
  } else {
    console.error('Firebase initialization error:', error);
  }
}

// Cookie helper
const getCookie = (name: string) => {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};

// Accurate Total Referral Count Hook (up to 10 levels)
function useTotalReferralCount(): number {
  const [totalReferrals, setTotalReferrals] = useState(0);

  useEffect(() => {
    let uid = getCookie('swissgain_uid');
    if (!uid) {
      uid = 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      document.cookie = `swissgain_uid=${uid};path=/;max-age=${60 * 60 * 24 * 365}`;
    }

    const affiliatesRef = ref(database, 'affiliates');
    const unsubscribe = onValue(affiliatesRef, (snap) => {
      if (!snap.exists()) {
        setTotalReferrals(0);
        return;
      }
      const allAffiliates = snap.val();
      const hash = new Set<string>();
      let count = 0;

      const getLevel = (targetUid: string): number => {
        if (hash.has(targetUid)) return -1;
        hash.add(targetUid);
        if (targetUid === uid) return 0;
        const user = allAffiliates[targetUid];
        if (!user?.referredById) return -1;
        const parentLevel = getLevel(user.referredById);
        if (parentLevel >= 0) return parentLevel + 1;
        return -1;
      };

      Object.keys(allAffiliates).forEach((key) => {
        if (key === uid) return;
        const level = getLevel(key);
        if (level > 0 && level <= 10) count++;
      });

      setTotalReferrals(count);
    });

    return () => unsubscribe();
  }, []);

  return totalReferrals;
}

interface OverviewContentProps {
  data: {
    membership: {
      isAffiliate: boolean;
      rank: number;
    };
  };
  userData: {
    name: string;
    tier: string;
    profileCompletion: number;
    joinDate: string;
    location: string;
  };
  calculateROI: () => number;
  calculateNetProfit: () => void;
  handleSimulateSale: () => void;
  handleSimulateReferral: () => void;
  firebaseData: {
    affiliateStats: {
      totalSales: number;
      affiliateEarnings: number;
      referralEarnings: number;
      totalEarnings: number;
      totalReferrals: number;
    };
    affiliateEarnings: any[];
    referralEarnings: any[];
  };
}

interface AffiliateSale {
  id: string;
  productId: string;
  affiliateId: string;
  customerId: string;
  productName: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  totalAmount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  images: string[];
  category: string;
  discount?: number;
  commission: number;
}

export function OverviewContent({
  data,
  userData,
  calculateROI,
  calculateNetProfit,
  handleSimulateSale,
  handleSimulateReferral,
  firebaseData
}: OverviewContentProps) {
  const [affiliateSales, setAffiliateSales] = useState<AffiliateSale[]>([]);
  const [loading, setLoading] = useState(true);

  // LIVE REAL-TIME VALUES FROM FIREBASE
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [hasBankDetails, setHasBankDetails] = useState<boolean | null>(null);
  const [checkingBankDetails, setCheckingBankDetails] = useState(false);
  
  // Track old balances for comparison
  const [oldPendingAffiliateCommission, setOldPendingAffiliateCommission] = useState(0);
  const [oldWalletBalance, setOldWalletBalance] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Live accurate referral count
  const totalReferralsLive = useTotalReferralCount();

  const affiliateId = getCookie('swissgain_uid') || "default_affiliate";
  const uid = getCookie('swissgain_uid');

  // Check bank details
  const checkBankDetails = async (): Promise<boolean> => {
    if (!uid) return false;
    try {
      const bankDetailsRef = ref(database, `affiliates/${uid}/bankDetails`);
      const snapshot = await get(bankDetailsRef);
      if (snapshot.exists()) {
        const bankData = snapshot.val();
        const hasRequiredDetails = !!(bankData.accountHolderName && bankData.accountNumber && bankData.ifscCode && bankData.bankName);
        setHasBankDetails(hasRequiredDetails);
        return hasRequiredDetails;
      }
      setHasBankDetails(false);
      return false;
    } catch (error) {
      console.error('Error checking bank details:', error);
      setHasBankDetails(false);
      return false;
    }
  };

  const handleWithdrawalClick = async () => {
    setCheckingBankDetails(true);
    const hasBankDetails = await checkBankDetails();
    setCheckingBankDetails(false);

    if (!hasBankDetails) {
      alert('Please fill your bank details first before withdrawing funds. Go to Bank Details page and complete your payment information.');
      return;
    }

    // Store old balances before withdrawal
    setOldPendingAffiliateCommission(pendingAffiliateCommission);
    setOldWalletBalance(walletBalance);
    
    setWithdrawalAmount(totalAvailable.toString());
    setShowWithdrawalModal(true);
  };

  // WITHDRAWAL LOGIC USING REAL COMMISSION (₹100 × items sold)
  const processWithdrawal = async () => {
    if (!uid) return;

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount < 100) {
      alert("Minimum withdrawal amount is ₹100");
      return;
    }

    const totalAvailable = pendingAffiliateCommission + walletBalance;
    if (amount > totalAvailable) {
      alert(`Insufficient funds. Available: ₹${totalAvailable.toLocaleString()}`);
      return;
    }

    setIsWithdrawing(true);
    try {
      let remaining = amount;
      let newTotalWithdrawn = totalWithdrawn;
      let newWalletBalance = walletBalance;

      // First, try to withdraw from pending affiliate commission
      if (remaining <= pendingAffiliateCommission) {
        // All from affiliate
        newTotalWithdrawn += remaining;
        remaining = 0;
      } else if (pendingAffiliateCommission > 0) {
        // Withdraw all pending affiliate, then from wallet
        newTotalWithdrawn += pendingAffiliateCommission;
        remaining -= pendingAffiliateCommission;
        if (remaining <= walletBalance) {
          newWalletBalance -= remaining;
          remaining = 0;
        } else {
          throw new Error('Insufficient wallet balance after affiliate deduction');
        }
      } else {
        // No pending affiliate, withdraw from wallet
        if (remaining <= walletBalance) {
          newWalletBalance -= remaining;
          remaining = 0;
        } else {
          throw new Error('Insufficient wallet balance');
        }
      }

      if (remaining > 0) {
        throw new Error('Insufficient funds');
      }

      // Record withdrawal
      const withdrawalRef = push(ref(database, `withdrawals/${uid}`));
      await set(withdrawalRef, {
        amount,
        status: 'pending',
        timestamp: new Date().toISOString(),
        processedAt: null,
        description: 'Withdrawal Request'
      });

      // Record transaction
      const transactionRef = push(ref(database, `transactions/${uid}`));
      await set(transactionRef, {
        amount: -amount,
        type: 'debit',
        description: 'Withdrawal Request',
        balanceAfter: totalAvailable - amount,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      // Update totalWithdrawn and wallet
      await set(ref(database, `affiliates/${uid}/totalWithdrawn`), newTotalWithdrawn);
      await set(ref(database, `wallets/${uid}`), { balance: newWalletBalance });

      // Update UI instantly
      setTotalWithdrawn(newTotalWithdrawn);
      setWalletBalance(newWalletBalance);
      setWithdrawalAmount('');
      setShowWithdrawalModal(false);
      alert(`₹${amount.toLocaleString()} withdrawal request sent successfully!`);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert("Withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Load live wallet balance and totalWithdrawn
  useEffect(() => {
    if (!uid) return;

    const walletRef = ref(database, `wallets/${uid}`);
    const withdrawnRef = ref(database, `affiliates/${uid}/totalWithdrawn`);

    const unsubWallet = onValue(walletRef, (snap) => {
      setWalletBalance(snap.val()?.balance || 0);
    });

    const unsubWithdrawn = onValue(withdrawnRef, (snap) => {
      setTotalWithdrawn(snap.val() || 0);
    });

    checkBankDetails();

    return () => {
      unsubWallet();
      unsubWithdrawn();
    };
  }, [uid]);

  // Load affiliate sales (real-time)
  useEffect(() => {
    if (!affiliateId || affiliateId === "default_affiliate") {
      setLoading(false);
      return;
    }

    const salesRef = ref(database, 'orders');
    const unsubscribe = onValue(salesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setAffiliateSales([]);
        setLoading(false);
        return;
      }

      const salesData = snapshot.val();
      const salesArray: AffiliateSale[] = [];

      Object.entries(salesData).forEach(([key, value]: [string, any]) => {
        if (value.affiliateId === affiliateId) {
          salesArray.push({
            id: value.id || key,
            productId: value.productId,
            affiliateId: value.affiliateId,
            customerId: value.customerId || "N/A",
            productName: value.productName,
            price: value.price || 0,
            originalPrice: value.originalPrice,
            quantity: value.quantity || 1,
            totalAmount: value.totalAmount || 0,
            customerInfo: value.customerInfo || {
              name: "N/A",
              email: "N/A",
              phone: "N/A",
              address: "N/A",
              city: "N/A",
              state: "N/A",
              pincode: "N/A"
            },
            status: value.status || 'pending',
            createdAt: value.createdAt,
            images: value.images || [],
            category: value.category || "Unknown",
            discount: value.discount,
            commission: 100 * (value.quantity || 1) // ₹100 per item
          });
        }
      });

      salesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAffiliateSales(salesArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [affiliateId]);

  // REAL COMMISSION CALCULATION — THIS IS YOUR TRUE EARNINGS
  const getRealStats = () => {
    const totalSales = affiliateSales.length;
    const totalRevenue = affiliateSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // ₹100 commission per item sold
    const totalCommission = affiliateSales.reduce((sum, sale) => {
      return sum + 100 * (sale.quantity || 1);
    }, 0);

    const pendingOrders = affiliateSales.filter(sale => sale.status === 'pending').length;
    const deliveredOrders = affiliateSales.filter(sale => sale.status === 'delivered').length;

    const recentSales = affiliateSales.slice(0, 3).map(sale => ({
      id: sale.id,
      date: sale.createdAt,
      amount: 100 * (sale.quantity || 1),
      description: sale.productName,
      type: 'sale' as const
    }));

    return {
      totalSales,
      totalRevenue,
      totalCommission, // ← This is the gross earned
      pendingOrders,
      deliveredOrders,
      recentSales
    };
  };

  const realStats = getRealStats();
  const pendingAffiliateCommission = Math.max(0, realStats.totalCommission - totalWithdrawn);
  const totalAvailable = pendingAffiliateCommission + walletBalance;
  const canWithdraw = totalAvailable >= 100 && hasBankDetails === true;

  // Calculate balance changes for display
  const showBalanceComparison = oldPendingAffiliateCommission > 0 || oldWalletBalance > 0;
  const affiliateEarningsChange = pendingAffiliateCommission - oldPendingAffiliateCommission;
  const walletBalanceChange = walletBalance - oldWalletBalance;
  const totalAvailableChange = affiliateEarningsChange + walletBalanceChange;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading your personal sales data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Available</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  ₹{totalAvailable.toLocaleString()}
                  {showBalanceComparison && totalAvailableChange !== 0 && (
                    <Badge 
                      variant={totalAvailableChange >= 0 ? "default" : "destructive"} 
                      className="text-xs"
                    >
                      {totalAvailableChange >= 0 ? '+' : ''}{totalAvailableChange.toLocaleString()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending earnings + wallet balance
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Pending Affiliate:</span>
                    <span className="font-medium text-green-600 flex items-center gap-1">
                      ₹{pendingAffiliateCommission.toLocaleString()}
                      {showBalanceComparison && affiliateEarningsChange !== 0 && (
                        <span className={`text-xs ${affiliateEarningsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({affiliateEarningsChange >= 0 ? '+' : ''}{affiliateEarningsChange.toLocaleString()})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wallet Balance:</span>
                    <span className="font-medium flex items-center gap-1">
                      ₹{walletBalance.toLocaleString()}
                      {showBalanceComparison && walletBalanceChange !== 0 && (
                        <span className={`text-xs ${walletBalanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({walletBalanceChange >= 0 ? '+' : ''}{walletBalanceChange.toLocaleString()})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-muted-foreground">
                    <span>Total:</span>
                    <span className="font-bold text-green-600">₹{totalAvailable.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Bank Details:</span>
                    {hasBankDetails === null ? (
                      <Badge variant="outline" className="text-xs">
                        Checking...
                      </Badge>
                    ) : hasBankDetails ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Required
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleWithdrawalClick}
                  disabled={!canWithdraw || checkingBankDetails || isWithdrawing}
                  className="mt-3 w-full text-xs h-8"
                  variant={canWithdraw ? "default" : "outline"}
                >
                  {isWithdrawing ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <IndianRupee className="h-3 w-3 mr-1" />
                  )}
                  {checkingBankDetails ? (
                    "Checking..."
                  ) : isWithdrawing ? (
                    "Processing..."
                  ) : !hasBankDetails ? (
                    "Add Bank Details First"
                  ) : !canWithdraw ? (
                    'Minimum ₹100 Required'
                  ) : (
                    `Withdraw ₹${totalAvailable.toLocaleString()}`
                  )}
                </Button>

                {!hasBankDetails && hasBankDetails !== null && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-amber-800 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Please add your bank details to enable withdrawals
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Affiliate Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realStats.totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  {realStats.deliveredOrders > 0 ? `${realStats.deliveredOrders} delivered` : 'Your successful sales'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {totalReferralsLive}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your team members (up to 10 levels)
                </p>
                {totalReferralsLive > 0 && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Live count • Real-time
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Balance History Card */}
          {showBalanceComparison && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Balance History
                </CardTitle>
                <CardDescription>
                  Comparison of your balances before and after withdrawal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium">Pending Affiliate Earnings</div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Before:</span>
                      <span>₹{oldPendingAffiliateCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">After:</span>
                      <span className="font-medium">₹{pendingAffiliateCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-muted-foreground">Change:</span>
                      <span className={affiliateEarningsChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {affiliateEarningsChange >= 0 ? '+' : ''}₹{affiliateEarningsChange.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Wallet Balance</div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Before:</span>
                      <span>₹{oldWalletBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">After:</span>
                      <span className="font-medium">₹{walletBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-muted-foreground">Change:</span>
                      <span className={walletBalanceChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {walletBalanceChange >= 0 ? '+' : ''}₹{walletBalanceChange.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Total Available</div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Before:</span>
                      <span>₹{(oldPendingAffiliateCommission + oldWalletBalance).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">After:</span>
                      <span className="font-medium text-green-600">₹{totalAvailable.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-muted-foreground">Change:</span>
                      <span className={totalAvailableChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {totalAvailableChange >= 0 ? '+' : ''}₹{totalAvailableChange.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest earnings and sales
                  </CardDescription>
                </div>
                {affiliateSales.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <a href="#sales-dashboard">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View All Your Sales
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realStats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Your Affiliate Sale</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">+₹{sale.amount}</p>
                      <p className="text-xs text-muted-foreground">Your Commission</p>
                    </div>
                  </div>
                ))}

                {(realStats.recentSales.length === 0 && firebaseData.affiliateEarnings?.length === 0 && firebaseData.referralEarnings?.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start promoting products to see your earnings here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Your Sales Performance Summary */}
          {affiliateSales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Sales Performance</CardTitle>
                <CardDescription>
                  Summary of your personal affiliate sales performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{realStats.deliveredOrders}</div>
                    <div className="text-xs text-muted-foreground">Your Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{realStats.pendingOrders}</div>
                    <div className="text-xs text-muted-foreground">Your Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">₹{realStats.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Your Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{realStats.totalCommission.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Your Total Commission</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Profile & Goals */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile Summary</CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{userData.name}</p>
                  <p className="text-sm text-muted-foreground">{userData.tier}</p>
                  {affiliateId && affiliateId !== "default_user" && (
                    <p className="text-xs text-blue-600 font-mono mt-1">
                      Your ID: {affiliateId.substring(0, 8)}...
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Profile Completion</span>
                  <span>{userData.profileCompletion}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${userData.profileCompletion}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Your Member Since</p>
                  <p className="font-medium">{userData.joinDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Your Location</p>
                  <p className="font-medium">{userData.location}</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-sm">
                  <span>Your Affiliate Status</span>
                  <Badge variant={data?.membership?.isAffiliate ? "default" : "secondary"}>
                    {data?.membership?.isAffiliate ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex justify-between text-sm mt-2">
                  <span>Bank Details</span>
                  {hasBankDetails === null ? (
                    <Badge variant="outline" className="text-xs">
                      Checking...
                    </Badge>
                  ) : hasBankDetails ? (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Your Monthly Goals</CardTitle>
              <CardDescription>
                Track your personal progress this month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Earnings Target</span>
                  <span>₹{realStats.totalCommission.toLocaleString()}/₹5,000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min((realStats.totalCommission / 5000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Sales Target</span>
                  <span>{realStats.totalSales}/20</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((realStats.totalSales / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Quick Stats</CardTitle>
              <CardDescription>
                Your affiliate performance at a glance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Your Active Products</span>
                <Badge variant="outline">{affiliateSales.length > 0 ? 'Multiple' : 'None'}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Your Conversion Rate</span>
                <span className="text-sm font-medium">
                  {affiliateSales.length > 0 ? 'Active' : '0%'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Your Avg. Commission</span>
                <span className="text-sm font-medium">
                  {affiliateSales.length > 0 ? `₹${(realStats.totalCommission / realStats.totalSales).toFixed(0)}` : '₹100'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Your Affiliate ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {affiliateId.substring(0, 6)}...
                </code>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Bank Details</span>
                {hasBankDetails ? (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    Verified
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => {
                      window.location.href = '/bank-details';
                    }}
                  >
                    Add Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rank Progress */}
          {data?.membership?.isAffiliate && (
            <Card>
              <CardHeader>
                <CardTitle>Your Rank Progress</CardTitle>
                <CardDescription>
                  Your next rank: {data.membership.rank < 5 ? `Rank ${data.membership.rank + 1}` : 'Max Rank'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Your Rank {data.membership.rank}</span>
                  <span className="text-sm text-muted-foreground">
                    {data.membership.rank < 5 ? `${data.membership.rank * 20}% to your next rank` : 'Your Maximum Rank Achieved'}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${data.membership.rank * 20}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-3">
                  {[1, 2, 3, 4, 5].map((rank) => (
                    <div key={rank} className="text-center">
                      <Trophy className={`h-5 w-5 mx-auto ${rank <= data.membership.rank ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                      <span className="text-xs">Rank {rank}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Request Withdrawal
              </CardTitle>
              <CardDescription>
                Transfer from your earnings to bank account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Bank Details Verified</span>
                </div>
                <p className="text-xs text-green-700">
                  Your bank details are complete. Funds will be transferred to your registered account.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min="100"
                  max={totalAvailable}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Min: ₹100 | Total Available: ₹{totalAvailable.toLocaleString()}
                </p>
              </div>
            </CardContent>
            <CardContent className="flex gap-3 pt-0">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowWithdrawalModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={processWithdrawal}
                disabled={!withdrawalAmount || parseFloat(withdrawalAmount) < 100 || parseFloat(withdrawalAmount) > totalAvailable || isWithdrawing}
              >
                {isWithdrawing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Request'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default OverviewContent;