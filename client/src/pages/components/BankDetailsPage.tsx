'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Banknote, 
  CreditCard, 
  User, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Save,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  IndianRupee
} from 'lucide-react';

// Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, onValue } from 'firebase/database';

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
    app = initializeApp(firebaseConfig, 'BankDetailsApp');
    database = getDatabase(app);
  }
}

// Cookie helper
const getCookie = (name: string) => {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};

// Indian Banks List
const INDIAN_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Canara Bank",
  "Axis Bank",
  "Union Bank of India",
  "Bank of India",
  "IndusInd Bank",
  "Kotak Mahindra Bank",
  "IDBI Bank",
  "Indian Bank",
  "Central Bank of India",
  "Yes Bank",
  "Federal Bank",
  "Indian Overseas Bank",
  "IDFC First Bank",
  "Bandhan Bank",
  "South Indian Bank"
];

// Account Types
const ACCOUNT_TYPES = [
  "Savings Account",
  "Current Account",
  "Salary Account",
  "Fixed Deposit Account",
  "Recurring Deposit Account"
];

export default function BankDetailsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Bank Details Form State
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    bankName: '',
    branchName: '',
    ifscCode: '',
    accountType: '',
    upiId: '',
    phonePe: '',
    googlePay: '',
    paytm: ''
  });

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---------- Initialize User ---------- */
  useEffect(() => {
    const uid = getCookie('swissgain_uid');
    if (uid) {
      setUserId(uid);
      loadUserData(uid);
    } else {
      setIsLoading(false);
    }
  }, []);

  /* ---------- Load User Data ---------- */
  const loadUserData = (uid: string) => {
    try {
      const userRef = ref(database, `affiliates/${uid}`);
      onValue(userRef, (snap) => {
        if (snap.exists()) {
          const userDataLocal = snap.val();
          setUserData(userDataLocal);
          
          // Load existing bank details if available
          if (userDataLocal.bankDetails) {
            setBankDetails(userDataLocal.bankDetails);
          }
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoading(false);
    }
  };

  /* ---------- Handle Input Change ---------- */
  const handleInputChange = (field: string, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /* ---------- Validation Functions ---------- */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Account Holder Name
    if (!bankDetails.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    } else if (bankDetails.accountHolderName.trim().length < 3) {
      newErrors.accountHolderName = 'Name must be at least 3 characters';
    }

    // Account Number
    if (!bankDetails.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(bankDetails.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    }

    // Confirm Account Number
    if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    // Bank Name
    if (!bankDetails.bankName) {
      newErrors.bankName = 'Bank name is required';
    }

    // IFSC Code
    if (!bankDetails.ifscCode) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode.toUpperCase())) {
      newErrors.ifscCode = 'Invalid IFSC code format';
    }

    // Account Type
    if (!bankDetails.accountType) {
      newErrors.accountType = 'Account type is required';
    }

    // At least one payment method should be provided
    if (!bankDetails.upiId && !bankDetails.phonePe && !bankDetails.googlePay && !bankDetails.paytm) {
      newErrors.upiId = 'Please provide at least one payment method (UPI, PhonePe, Google Pay, or Paytm)';
    }

    // UPI ID validation if provided
    if (bankDetails.upiId && !/^[\w.-]+@[\w]+$/.test(bankDetails.upiId)) {
      newErrors.upiId = 'Invalid UPI ID format (e.g., username@upi)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------- Save Bank Details ---------- */
  const handleSaveBankDetails = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const userRef = ref(database, `affiliates/${userId}`);
      const bankDetailsRef = ref(database, `bankDetails/${userId}`);
      
      // Prepare bank details data (remove confirmAccountNumber)
      const { confirmAccountNumber, ...bankDetailsToSave } = bankDetails;

      // Save to user's affiliate record
      await update(userRef, {
        bankDetails: bankDetailsToSave,
        bankDetailsUpdatedAt: new Date().toISOString()
      });

      // Also save to separate bankDetails collection for admin access
      await set(bankDetailsRef, {
        ...bankDetailsToSave,
        userId: userId,
        userName: userData?.name || 'Unknown User',
        userEmail: userData?.email || 'No Email',
        userPhone: userData?.phone || 'No Phone',
        updatedAt: new Date().toISOString(),
        status: 'active'
      });

      // Notify admin about new bank details
      await notifyAdminAboutBankDetails(userId, bankDetailsToSave);

      toast({
        title: "Bank Details Saved Successfully!",
        description: "Your bank details have been saved and are ready for withdrawals.",
        variant: "default",
      });

    } catch (error) {
      console.error('Error saving bank details:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save bank details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- Notify Admin ---------- */
  const notifyAdminAboutBankDetails = async (userId: string, bankDetails: any) => {
    try {
      const notificationsRef = ref(database, 'adminNotifications');
      const newNotificationRef = ref(database, 'adminNotifications/bankDetails');
      
      await update(newNotificationRef, {
        [userId]: {
          userId: userId,
          userName: userData?.name || 'Unknown User',
          userEmail: userData?.email || 'No Email',
          accountHolderName: bankDetails.accountHolderName,
          bankName: bankDetails.bankName,
          accountNumber: `****${bankDetails.accountNumber.slice(-4)}`, // Only show last 4 digits
          ifscCode: bankDetails.ifscCode,
          updatedAt: new Date().toISOString(),
          status: 'pending_review'
        }
      });

      console.log('Admin notified about bank details update');
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  };

  /* ---------- Mask Account Number ---------- */
  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  };

  /* ---------- Mask UPI ID ---------- */
  const maskUpiId = (upiId: string) => {
    if (!upiId) return '';
    const [username, domain] = upiId.split('@');
    if (!username || !domain) return upiId;
    
    if (username.length <= 2) return upiId;
    return `${username.substring(0, 2)}***@${domain}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Bank Details...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Banknote className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank & Payment Details</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Add your bank account and UPI details to receive payments and withdrawals securely.
            Admin will use these details to send your earnings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <CreditCard className="h-5 w-5" />
                  Bank Account Information
                </CardTitle>
                <CardDescription>
                  Fill in your bank account details for direct bank transfers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Account Holder Name */}
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account Holder Name *
                  </Label>
                  <Input
                    id="accountHolderName"
                    placeholder="Enter account holder name as per bank records"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                    className={errors.accountHolderName ? 'border-red-500' : ''}
                  />
                  {errors.accountHolderName && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.accountHolderName}
                    </p>
                  )}
                </div>

                {/* Account Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      placeholder="Enter account number"
                      value={bankDetails.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                      className={errors.accountNumber ? 'border-red-500' : ''}
                      maxLength={18}
                    />
                    {errors.accountNumber && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.accountNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmAccountNumber">Confirm Account Number *</Label>
                    <Input
                      id="confirmAccountNumber"
                      type="text"
                      placeholder="Re-enter account number"
                      value={bankDetails.confirmAccountNumber}
                      onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value.replace(/\D/g, ''))}
                      className={errors.confirmAccountNumber ? 'border-red-500' : ''}
                      maxLength={18}
                    />
                    {errors.confirmAccountNumber && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.confirmAccountNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bank Name and Branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Bank Name *
                    </Label>
                    <Select
                      value={bankDetails.bankName}
                      onValueChange={(value) => handleInputChange('bankName', value)}
                    >
                      <SelectTrigger className={errors.bankName ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bankName && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.bankName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branchName">Branch Name</Label>
                    <Input
                      id="branchName"
                      placeholder="Enter branch name (optional)"
                      value={bankDetails.branchName}
                      onChange={(e) => handleInputChange('branchName', e.target.value)}
                    />
                  </div>
                </div>

                {/* IFSC Code and Account Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code *</Label>
                    <Input
                      id="ifscCode"
                      placeholder="e.g., SBIN0000123"
                      value={bankDetails.ifscCode}
                      onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                      className={errors.ifscCode ? 'border-red-500' : ''}
                      maxLength={11}
                    />
                    {errors.ifscCode && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.ifscCode}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Select
                      value={bankDetails.accountType}
                      onValueChange={(value) => handleInputChange('accountType', value)}
                    >
                      <SelectTrigger className={errors.accountType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.accountType && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.accountType}
                      </p>
                    )}
                  </div>
                </div>

                {/* UPI Payment Methods */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    UPI & Digital Payment Methods
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="username@upi"
                        value={bankDetails.upiId}
                        onChange={(e) => handleInputChange('upiId', e.target.value)}
                        className={errors.upiId ? 'border-red-500' : ''}
                      />
                      {errors.upiId && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.upiId}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phonePe">PhonePe Number</Label>
                        <Input
                          id="phonePe"
                          placeholder="PhonePe number"
                          value={bankDetails.phonePe}
                          onChange={(e) => handleInputChange('phonePe', e.target.value.replace(/\D/g, ''))}
                          maxLength={10}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="googlePay">Google Pay Number</Label>
                        <Input
                          id="googlePay"
                          placeholder="Google Pay number"
                          value={bankDetails.googlePay}
                          onChange={(e) => handleInputChange('googlePay', e.target.value.replace(/\D/g, ''))}
                          maxLength={10}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paytm">Paytm Number</Label>
                        <Input
                          id="paytm"
                          placeholder="Paytm number"
                          value={bankDetails.paytm}
                          onChange={(e) => handleInputChange('paytm', e.target.value.replace(/\D/g, ''))}
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleSaveBankDetails}
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Bank Details
                      </>
                    )}
                  </Button>

                  {(bankDetails.accountNumber || bankDetails.upiId) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDetails(!showDetails)}
                      className="flex items-center gap-2"
                    >
                      {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showDetails ? 'Hide' : 'Show'} Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Information & Preview */}
          <div className="space-y-6">
            {/* Security Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-green-50 border-b">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Your data is encrypted and secure</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Only admin can view your bank details</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Used only for payment processing</p>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            {(bankDetails.accountNumber || bankDetails.upiId) && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Details Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {bankDetails.accountHolderName && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Account Holder</p>
                      <p className="text-lg font-semibold">{bankDetails.accountHolderName}</p>
                    </div>
                  )}

                  {bankDetails.accountNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Account Number</p>
                      <p className="text-lg font-mono">
                        {showDetails ? bankDetails.accountNumber : maskAccountNumber(bankDetails.accountNumber)}
                      </p>
                    </div>
                  )}

                  {bankDetails.bankName && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Bank</p>
                      <p className="text-lg">{bankDetails.bankName}</p>
                    </div>
                  )}

                  {bankDetails.ifscCode && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">IFSC Code</p>
                      <p className="text-lg font-mono">{bankDetails.ifscCode}</p>
                    </div>
                  )}

                  {bankDetails.upiId && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">UPI ID</p>
                      <p className="text-lg">
                        {showDetails ? bankDetails.upiId : maskUpiId(bankDetails.upiId)}
                      </p>
                    </div>
                  )}

                  <Badge variant="secondary" className="w-full justify-center bg-blue-100 text-blue-800">
                    {showDetails ? 'Details Visible' : 'Details Masked'}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Admin Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-purple-50 border-b">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <User className="h-5 w-5" />
                  For Admin Use
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-gray-600">
                  Admin will see the following information to process your payments:
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    Full bank account details
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    UPI and payment app details
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    Contact information
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Notes */}
        <Card className="mt-8 border-0 shadow-lg bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Important Notes</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Ensure all bank details match exactly with your bank records</li>
                  <li>• Double-check account number and IFSC code before saving</li>
                  <li>• Payments will be processed within 3-5 business days</li>
                  <li>• Contact support if you need to update your details</li>
                  <li>• Keep your UPI IDs active for instant payments</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}