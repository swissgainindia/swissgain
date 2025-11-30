'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Receipt,
  Wallet,
  Mail,
  Phone,
  FileText,
  IndianRupee,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, get } from 'firebase/database';

// Firebase Config
const firebaseConfig = {
  apiKey: 'AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k',
  authDomain: 'swissgain-a2589.firebaseapp.com',
  databaseURL: 'https://swissgain-a2589-default-rtdb.firebaseio.com',
  projectId: 'swissgain-a2589',
  storageBucket: 'swissgain-a2589.firebasestorage.app',
  messagingSenderId: '1062016445247',
  appId: '1:1062016445247:web:bf559ce1ed7f17e2ca418a',
  measurementId: 'G-VTKPWVEY0S',
};

// Prevent Firebase Duplicate Initialization
let app: any;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const database = getDatabase(app);

// Cookie Reader
const getCookie = (name: string) => {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};

interface BillingContentProps {
  affiliateStats?: {
    totalSales: number;
    affiliateEarnings: number;
    referralEarnings: number;
    totalEarnings: number;
    totalReferrals: number;
  };
  walletBalance?: number;
}

export function BillingContent({ affiliateStats, walletBalance = 0 }: BillingContentProps) {
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [hasBankDetails, setHasBankDetails] = useState<boolean | null>(null);
  const [checkingBankDetails, setCheckingBankDetails] = useState(false);

  const uid = getCookie('swissgain_uid');

  // Function to check if bank details exist
  const checkBankDetails = async (): Promise<boolean> => {
    if (!uid) return false;
    
    try {
      const bankDetailsRef = ref(database, `affiliates/${uid}/bankDetails`);
      const snapshot = await get(bankDetailsRef);
      
      if (snapshot.exists()) {
        const bankData = snapshot.val();
        // Check if essential bank details are filled
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

  // Load billing history and check bank details
  useEffect(() => {
    if (uid) {
      const withdrawalsRef = ref(database, `withdrawals/${uid}`);

      const unsubscribe = onValue(withdrawalsRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();

          const history = Object.entries(data)
            .map(([id, item]: [string, any]) => ({
              id,
              ...item,
              description: 'Withdrawal Request',
              date: item.timestamp,
              amount: item.amount,
              status: item.status || 'pending',
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setBillingHistory(history);
        } else {
          setBillingHistory([]);
        }

        setLoading(false);
      });

      // Check bank details on component load
      checkBankDetails();

      return unsubscribe;
    }

    setLoading(false);
  }, [uid]);

  // Handle withdrawal button click
  const handleWithdrawalClick = async () => {
    setCheckingBankDetails(true);
    const hasBankDetails = await checkBankDetails();
    setCheckingBankDetails(false);
    
    if (!hasBankDetails) {
      alert('Please fill your bank details first before withdrawing funds. Go to Bank Details page and complete your payment information.');
      return;
    }
    
    // Calculate total available amount
    const totalAvailable = calculateTotalAvailable();
    setWithdrawalAmount(totalAvailable.toString());
    setShowWithdrawalModal(true);
  };

  // Calculate total available amount
  const calculateTotalAvailable = () => {
    const stats = affiliateStats || {
      affiliateEarnings: 0,
      referralEarnings: 0,
      totalEarnings: 0
    };
    return stats.affiliateEarnings + stats.referralEarnings + walletBalance;
  };

  // Process withdrawal
  const processWithdrawal = async () => {
    if (!uid) {
      alert("User not found. Please refresh the page.");
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount < 100) {
      alert("Minimum withdrawal amount is ₹100");
      return;
    }

    const totalAvailable = calculateTotalAvailable();
    if (amount > totalAvailable) {
      alert(`Insufficient funds. Total available: ₹${totalAvailable.toLocaleString()}`);
      return;
    }

    try {
      const walletRef = ref(database, `wallets/${uid}`);
      const transactionRef = ref(database, `transactions/${uid}`);
      const withdrawalRef = ref(database, `withdrawals/${uid}`);
     
      // Calculate new balance
      const newBalance = totalAvailable - amount;
      
      // Update wallet balance
      await set(walletRef, { balance: newBalance });
      
      // Add withdrawal record
      const newWithdrawalRef = push(withdrawalRef);
      await set(newWithdrawalRef, {
        amount: amount,
        status: 'pending',
        timestamp: new Date().toISOString(),
        processedAt: null,
        description: 'Withdrawal Request'
      });
      
      // Add transaction record
      const newTransactionRef = push(transactionRef);
      await set(newTransactionRef, {
        amount: -amount,
        type: 'debit',
        description: 'Withdrawal Request',
        balanceAfter: newBalance,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      
      setWithdrawalAmount('');
      setShowWithdrawalModal(false);
      alert(`₹${amount.toLocaleString()} withdrawal request submitted successfully!`);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert("Withdrawal failed. Please try again.");
    }
  };

  const totalAvailable = calculateTotalAvailable();
  const canWithdraw = totalAvailable >= 500 && hasBankDetails;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading billing history...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              Your withdrawal requests and payment history
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {billingHistory?.length > 0 ? (
                billingHistory.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">₹{payment.amount}</p>
                      <Badge
                        variant={
                          payment.status === 'completed'
                            ? 'default'
                            : payment.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Billing History
                  </h3>
                  <p className="text-muted-foreground">
                    Your withdrawal requests will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Section */}
      <div className="space-y-6">
        {/* Withdrawal Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Status</CardTitle>
            <CardDescription>Your current withdrawal eligibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Bank Details</span>
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
            
            <div className="flex justify-between">
              <span className="text-sm">Available Balance</span>
              <span className="font-medium">₹{totalAvailable.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">Minimum Withdrawal</span>
              <span className="font-medium">₹500</span>
            </div>
            
            <Button
              onClick={handleWithdrawalClick}
              disabled={!canWithdraw || checkingBankDetails}
              className="w-full"
              variant={canWithdraw ? "default" : "outline"}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {checkingBankDetails ? (
                "Checking..."
              ) : !hasBankDetails ? (
                "Add Bank Details First"
              ) : totalAvailable < 500 ? (
                `Minimum ₹500 Required`
              ) : (
                `Withdraw ₹${totalAvailable.toLocaleString()}`
              )}
            </Button>

            {!hasBankDetails && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please add your bank details to enable withdrawals
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your default payment method</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">
                    {hasBankDetails ? 'Bank details configured' : 'No bank details'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Navigate to bank details page
                  window.location.href = '/bank-details';
                }}
              >
                {hasBankDetails ? 'Update' : 'Add'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Overview</CardTitle>
            <CardDescription>Current billing cycle</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Current Balance</span>
              <span className="font-medium">₹{totalAvailable.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Next Billing Date</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Billing Cycle</span>
              <span className="font-medium">Monthly</span>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Contact our support team</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Call Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </CardContent>
        </Card>
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
                Transfer funds to your bank account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Details Status */}
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
                  Min: ₹100 | Max: ₹{totalAvailable.toLocaleString()}
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
                disabled={!withdrawalAmount || parseFloat(withdrawalAmount) < 100 || parseFloat(withdrawalAmount) > totalAvailable}
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