'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Banknote, 
  User, 
  Building, 
  Search,
  Filter,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  IndianRupee,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  ArrowUpDown,
  Wallet,
  CreditCard
} from 'lucide-react';

// Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, set, get } from 'firebase/database';

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
    app = initializeApp(firebaseConfig, 'AdminBankApp');
    database = getDatabase(app);
  }
}

interface BankDetail {
  id: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName?: string;
  ifscCode: string;
  accountType?: string;
  upiId?: string;
  phonePe?: string;
  googlePay?: string;
  paytm?: string;
  verified?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  updatedAt: string;
  status?: 'active' | 'inactive';
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  timestamp: string;
  processedAt?: string;
  description?: string;
  bankDetails?: BankDetail;
  adminNotes?: string;
}

export default function PaymentRequest() {
  const { toast } = useToast();
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [filteredData, setFilteredData] = useState<(BankDetail | WithdrawalRequest)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'bank-details' | 'withdrawals'>('withdrawals');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [adminNotes, setAdminNotes] = useState('');

  /* ---------- Load All Bank Details ---------- */
  useEffect(() => {
    const bankDetailsRef = ref(database, 'bankDetails');
    
    const unsubscribeBank = onValue(bankDetailsRef, (snap) => {
      if (snap.exists()) {
        const detailsData = snap.val();
        const detailsArray = Object.entries(detailsData).map(([userId, data]: [string, any]) => ({
          id: userId,
          ...data
        }));
        
        setBankDetails(detailsArray);
      } else {
        setBankDetails([]);
      }
    });

    return () => unsubscribeBank();
  }, []);

  /* ---------- Load All Withdrawal Requests ---------- */
  useEffect(() => {
    const loadWithdrawalRequests = async () => {
      try {
        const withdrawalsRef = ref(database, 'withdrawals');
        
        const unsubscribeWithdrawals = onValue(withdrawalsRef, async (snap) => {
          if (snap.exists()) {
            const withdrawalsData = snap.val();
            const requests: WithdrawalRequest[] = [];

            // Process each user's withdrawal requests
            for (const [userId, userWithdrawals] of Object.entries(withdrawalsData as any)) {
              if (userWithdrawals && typeof userWithdrawals === 'object') {
                for (const [withdrawalId, withdrawalData] of Object.entries(userWithdrawals as any)) {
                  const withdrawal = withdrawalData as any;
                  
                  // Get user details
                  const userRef = ref(database, `affiliates/${userId}`);
                  const userSnap = await get(userRef);
                  const userData = userSnap.exists() ? userSnap.val() : {};
                  
                  // Get bank details
                  const bankRef = ref(database, `bankDetails/${userId}`);
                  const bankSnap = await get(bankRef);
                  const bankData = bankSnap.exists() ? bankSnap.val() : null;

                  requests.push({
                    id: withdrawalId,
                    userId: userId,
                    userName: userData.name || 'Unknown User',
                    userEmail: userData.email || 'No Email',
                    amount: withdrawal.amount || 0,
                    status: withdrawal.status || 'pending',
                    timestamp: withdrawal.timestamp,
                    processedAt: withdrawal.processedAt,
                    description: withdrawal.description,
                    bankDetails: bankData,
                    adminNotes: withdrawal.adminNotes
                  });
                }
              }
            }

            // Sort by timestamp, newest first
            requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setWithdrawalRequests(requests);
          } else {
            setWithdrawalRequests([]);
          }
          setIsLoading(false);
        });

        return () => unsubscribeWithdrawals();
      } catch (error) {
        console.error('Error loading withdrawal requests:', error);
        setIsLoading(false);
      }
    };

    loadWithdrawalRequests();
  }, []);

  /* ---------- Filter Data Based on Active Tab and Search ---------- */
  useEffect(() => {
    let data: (BankDetail | WithdrawalRequest)[] = [];
    
    if (activeTab === 'bank-details') {
      data = bankDetails;
    } else {
      data = withdrawalRequests;
      
      // Apply status filter for withdrawals
      if (statusFilter !== 'all') {
        data = data.filter(item => 
          'status' in item && item.status === statusFilter
        );
      }
    }

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item =>
        item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ('accountHolderName' in item && item.accountHolderName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ('bankName' in item && item.bankName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ('accountNumber' in item && item.accountNumber?.includes(searchTerm)) ||
        ('ifscCode' in item && item.ifscCode?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ('amount' in item && item.amount.toString().includes(searchTerm))
      );
    }

    setFilteredData(data);
  }, [searchTerm, bankDetails, withdrawalRequests, activeTab, statusFilter]);

  /* ---------- Mark Bank Details as Verified ---------- */
  const handleVerifyUser = async (userId: string) => {
    try {
      const userRef = ref(database, `bankDetails/${userId}`);
      await update(userRef, {
        verified: true,
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'admin',
        status: 'active'
      });

      toast({
        title: "User Verified",
        description: "Bank details have been marked as verified.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error verifying user:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify user. Please try again.",
        variant: "destructive",
      });
    }
  };

  /* ---------- Update Withdrawal Status ---------- */
  const handleUpdateWithdrawalStatus = async (withdrawalId: string, userId: string, newStatus: WithdrawalRequest['status'], notes?: string) => {
    try {
      const withdrawalRef = ref(database, `withdrawals/${userId}/${withdrawalId}`);
      
      const updateData: any = {
        status: newStatus,
        processedAt: new Date().toISOString()
      };

      if (notes) {
        updateData.adminNotes = notes;
      }

      await update(withdrawalRef, updateData);

      // If approved, update wallet balance
      if (newStatus === 'approved') {
        const walletRef = ref(database, `wallets/${userId}`);
        const walletSnap = await get(walletRef);
        const currentBalance = walletSnap.exists() ? walletSnap.val().balance || 0 : 0;
        
        const withdrawal = withdrawalRequests.find(w => w.id === withdrawalId);
        if (withdrawal) {
          const newBalance = currentBalance - withdrawal.amount;
          await set(walletRef, { balance: newBalance });
        }
      }

      toast({
        title: "Status Updated",
        description: `Withdrawal request has been ${newStatus}.`,
        variant: "default",
      });

      setAdminNotes('');
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update withdrawal status. Please try again.",
        variant: "destructive",
      });
    }
  };

  /* ---------- Export to CSV ---------- */
  const handleExportCSV = () => {
    let headers: string[] = [];
    let csvData: any[] = [];

    if (activeTab === 'bank-details') {
      headers = [
        'User ID',
        'User Name',
        'User Email',
        'User Phone',
        'Account Holder Name',
        'Account Number',
        'Bank Name',
        'Branch Name',
        'IFSC Code',
        'Account Type',
        'UPI ID',
        'PhonePe',
        'Google Pay',
        'Paytm',
        'Status',
        'Last Updated'
      ];

      csvData = filteredData.map((detail: any) => [
        detail.id,
        detail.userName || 'N/A',
        detail.userEmail || 'N/A',
        detail.userPhone || 'N/A',
        detail.accountHolderName || 'N/A',
        detail.accountNumber || 'N/A',
        detail.bankName || 'N/A',
        detail.branchName || 'N/A',
        detail.ifscCode || 'N/A',
        detail.accountType || 'N/A',
        detail.upiId || 'N/A',
        detail.phonePe || 'N/A',
        detail.googlePay || 'N/A',
        detail.paytm || 'N/A',
        detail.verified ? 'Verified' : 'Pending',
        detail.updatedAt ? new Date(detail.updatedAt).toLocaleDateString() : 'N/A'
      ]);
    } else {
      headers = [
        'Request ID',
        'User ID',
        'User Name',
        'User Email',
        'Amount',
        'Status',
        'Request Date',
        'Processed Date',
        'Account Holder',
        'Bank Name',
        'Account Number',
        'IFSC Code',
        'Admin Notes'
      ];

      csvData = filteredData.map((request: any) => [
        request.id,
        request.userId,
        request.userName || 'N/A',
        request.userEmail || 'N/A',
        request.amount,
        request.status,
        new Date(request.timestamp).toLocaleDateString(),
        request.processedAt ? new Date(request.processedAt).toLocaleDateString() : 'N/A',
        request.bankDetails?.accountHolderName || 'N/A',
        request.bankDetails?.bankName || 'N/A',
        request.bankDetails?.accountNumber ? `****${request.bankDetails.accountNumber.slice(-4)}` : 'N/A',
        request.bankDetails?.ifscCode || 'N/A',
        request.adminNotes || 'N/A'
      ]);
    }

    const csvContent = [headers, ...csvData]
      .map(row => row.map((field: any) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: `${activeTab === 'bank-details' ? 'Bank details' : 'Withdrawal requests'} exported to CSV successfully.`,
      variant: "default",
    });
  };

  /* ---------- Get Status Badge ---------- */
  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { variant: string; class: string; icon: any } } = {
      pending: { variant: 'secondary', class: 'bg-amber-100 text-amber-800', icon: Clock },
      approved: { variant: 'default', class: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      processing: { variant: 'default', class: 'bg-purple-100 text-purple-800', icon: ArrowUpDown },
      completed: { variant: 'default', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { variant: 'destructive', class: 'bg-red-100 text-red-800', icon: XCircle },
      verified: { variant: 'default', class: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant as any} className={`${config.class} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Payment Requests...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Requests Management</h1>
            <p className="text-gray-600">Manage user bank details and withdrawal requests</p>
          </div>
          <Button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Tabs */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Button
                variant={activeTab === 'withdrawals' ? 'default' : 'outline'}
                onClick={() => setActiveTab('withdrawals')}
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Withdrawal Requests
                <Badge variant="secondary" className="ml-2">
                  {withdrawalRequests.length}
                </Badge>
              </Button>
              <Button
                variant={activeTab === 'bank-details' ? 'default' : 'outline'}
                onClick={() => setActiveTab('bank-details')}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Bank Details
                <Badge variant="secondary" className="ml-2">
                  {bankDetails.length}
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={
                    activeTab === 'bank-details' 
                      ? "Search by name, bank, account number, or IFSC..." 
                      : "Search by user name, amount, or status..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {activeTab === 'withdrawals' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
              
              <Button variant="outline" className="flex items-center gap-2 whitespace-nowrap">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total {activeTab === 'bank-details' ? 'Users' : 'Requests'}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeTab === 'bank-details' ? bankDetails.length : withdrawalRequests.length}
                  </p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          {activeTab === 'withdrawals' ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {withdrawalRequests.filter(d => d.status === 'pending').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{withdrawalRequests.reduce((sum, req) => sum + req.amount, 0)}
                      </p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {withdrawalRequests.filter(d => d.status === 'completed').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Verified</p>
                      <p className="text-2xl font-bold text-green-600">
                        {bankDetails.filter(d => d.verified).length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {bankDetails.filter(d => !d.verified).length}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {bankDetails.filter(d => {
                          const date = new Date(d.updatedAt);
                          const now = new Date();
                          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                    <Banknote className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'bank-details' ? 'User Bank Details' : 'Withdrawal Requests'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'bank-details' 
                ? 'All registered bank details for payment processing' 
                : 'All withdrawal requests from users'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeTab === 'bank-details' ? (
                        <>
                          <TableHead>User Info</TableHead>
                          <TableHead>Bank Details</TableHead>
                          <TableHead>Payment Methods</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>User Info</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Bank Details</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Request Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        {/* User Info */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{item.userName || 'Unknown User'}</p>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {item.userEmail || 'No email'}
                            </div>
                            {'userPhone' in item && item.userPhone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-3 w-3" />
                                {item.userPhone}
                              </div>
                            )}
                            {'userId' in item && (
                              <p className="text-xs text-gray-500">ID: {item.userId.substring(0, 8)}...</p>
                            )}
                          </div>
                        </TableCell>

                        {activeTab === 'bank-details' ? (
                          <>
                            {/* Bank Details for Bank Details Tab */}
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{(item as BankDetail).accountHolderName}</p>
                                <p className="text-sm text-gray-600">A/C: ****{(item as BankDetail).accountNumber?.slice(-4)}</p>
                                <p className="text-sm text-gray-600">{(item as BankDetail).bankName}</p>
                                <p className="text-sm font-mono">{(item as BankDetail).ifscCode}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {(item as BankDetail).upiId && (
                                  <Badge variant="outline" className="bg-blue-50">
                                    UPI: {(item as BankDetail).upiId}
                                  </Badge>
                                )}
                                {(item as BankDetail).phonePe && (
                                  <Badge variant="outline" className="bg-purple-50">
                                    PhonePe: {(item as BankDetail).phonePe}
                                  </Badge>
                                )}
                                {(item as BankDetail).googlePay && (
                                  <Badge variant="outline" className="bg-green-50">
                                    Google Pay: {(item as BankDetail).googlePay}
                                  </Badge>
                                )}
                                {(item as BankDetail).paytm && (
                                  <Badge variant="outline" className="bg-yellow-50">
                                    Paytm: {(item as BankDetail).paytm}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge((item as BankDetail).verified ? 'verified' : 'pending')}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-600">
                                {new Date((item as BankDetail).updatedAt).toLocaleDateString()}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedItem(item)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!(item as BankDetail).verified && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleVerifyUser(item.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            {/* Withdrawal Request Details */}
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-bold text-lg text-green-600">
                                  ₹{((item as WithdrawalRequest).amount)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {(item as WithdrawalRequest).description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {(item as WithdrawalRequest).bankDetails ? (
                                <div className="space-y-1">
                                  <p className="font-medium">{(item as WithdrawalRequest).bankDetails?.accountHolderName}</p>
                                  <p className="text-sm text-gray-600">
                                    {(item as WithdrawalRequest).bankDetails?.bankName}
                                  </p>
                                  <p className="text-sm font-mono">
                                    {(item as WithdrawalRequest).bankDetails?.ifscCode}
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700">
                                  No Bank Details
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge((item as WithdrawalRequest).status)}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-600">
                                {new Date((item as WithdrawalRequest).timestamp).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date((item as WithdrawalRequest).timestamp).toLocaleTimeString()}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedItem(item)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {(item as WithdrawalRequest).status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateWithdrawalStatus(
                                        item.id, 
                                        (item as WithdrawalRequest).userId, 
                                        'approved'
                                      )}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateWithdrawalStatus(
                                        item.id, 
                                        (item as WithdrawalRequest).userId, 
                                        'rejected'
                                      )}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {(item as WithdrawalRequest).status === 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateWithdrawalStatus(
                                      item.id, 
                                      (item as WithdrawalRequest).userId, 
                                      'completed'
                                    )}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Banknote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab === 'bank-details' ? 'Bank Details' : 'Withdrawal Requests'} Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms' : `No ${activeTab === 'bank-details' ? 'users have added their bank details' : 'withdrawal requests'} yet`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {activeTab === 'bank-details' ? 'User Bank Details' : 'Withdrawal Request'} - {selectedItem.userName}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'bank-details' 
                    ? `Complete bank and payment information for ${selectedItem.accountHolderName}`
                    : `Withdrawal request details for ${selectedItem.userName}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Information */}
                <div>
                  <h3 className="font-semibold mb-3">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{selectedItem.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedItem.userEmail}</p>
                    </div>
                    {selectedItem.userPhone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{selectedItem.userPhone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-mono text-sm">{selectedItem.id}</p>
                    </div>
                  </div>
                </div>

                {activeTab === 'bank-details' ? (
                  /* Bank Account Details */
                  <>
                    <div>
                      <h3 className="font-semibold mb-3">Bank Account Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Account Holder</p>
                          <p className="font-medium">{selectedItem.accountHolderName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Number</p>
                          <p className="font-mono font-medium">{selectedItem.accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Bank Name</p>
                          <p className="font-medium">{selectedItem.bankName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Branch</p>
                          <p className="font-medium">{selectedItem.branchName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">IFSC Code</p>
                          <p className="font-mono font-medium">{selectedItem.ifscCode}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Type</p>
                          <p className="font-medium">{selectedItem.accountType}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <h3 className="font-semibold mb-3">Digital Payment Methods</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedItem.upiId && (
                          <div>
                            <p className="text-sm text-gray-600">UPI ID</p>
                            <p className="font-medium">{selectedItem.upiId}</p>
                          </div>
                        )}
                        {selectedItem.phonePe && (
                          <div>
                            <p className="text-sm text-gray-600">PhonePe</p>
                            <p className="font-medium">{selectedItem.phonePe}</p>
                          </div>
                        )}
                        {selectedItem.googlePay && (
                          <div>
                            <p className="text-sm text-gray-600">Google Pay</p>
                            <p className="font-medium">{selectedItem.googlePay}</p>
                          </div>
                        )}
                        {selectedItem.paytm && (
                          <div>
                            <p className="text-sm text-gray-600">Paytm</p>
                            <p className="font-medium">{selectedItem.paytm}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Withdrawal Request Details */
                  <>
                    <div>
                      <h3 className="font-semibold mb-3">Withdrawal Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-bold text-2xl text-green-600">₹{selectedItem.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          {getStatusBadge(selectedItem.status)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Request Date</p>
                          <p className="font-medium">{new Date(selectedItem.timestamp).toLocaleString()}</p>
                        </div>
                        {selectedItem.processedAt && (
                          <div>
                            <p className="text-sm text-gray-600">Processed Date</p>
                            <p className="font-medium">{new Date(selectedItem.processedAt).toLocaleString()}</p>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Description</p>
                          <p className="font-medium">{selectedItem.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bank Details for Withdrawal */}
                    {selectedItem.bankDetails ? (
                      <div>
                        <h3 className="font-semibold mb-3">Bank Details for Transfer</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Account Holder</p>
                            <p className="font-medium">{selectedItem.bankDetails.accountHolderName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Account Number</p>
                            <p className="font-mono font-medium">{selectedItem.bankDetails.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Bank Name</p>
                            <p className="font-medium">{selectedItem.bankDetails.bankName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">IFSC Code</p>
                            <p className="font-mono font-medium">{selectedItem.bankDetails.ifscCode}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-red-800">No Bank Details Found</h4>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          This user has not provided bank details. Please contact them to update their information.
                        </p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                      <h3 className="font-semibold mb-3">Admin Notes</h3>
                      <Input
                        placeholder="Add notes about this withdrawal request..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setSelectedItem(null);
                      setAdminNotes('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  
                  {activeTab === 'bank-details' ? (
                    !selectedItem.verified && (
                      <Button
                        onClick={() => {
                          handleVerifyUser(selectedItem.id);
                          setSelectedItem(null);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Details
                      </Button>
                    )
                  ) : (
                    <>
                      {selectedItem.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => {
                              handleUpdateWithdrawalStatus(selectedItem.id, selectedItem.userId, 'approved', adminNotes);
                              setSelectedItem(null);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              handleUpdateWithdrawalStatus(selectedItem.id, selectedItem.userId, 'rejected', adminNotes);
                              setSelectedItem(null);
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {selectedItem.status === 'approved' && (
                        <Button
                          onClick={() => {
                            handleUpdateWithdrawalStatus(selectedItem.id, selectedItem.userId, 'completed', adminNotes);
                            setSelectedItem(null);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}