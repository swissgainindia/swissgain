'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, update } from 'firebase/database';
import { Handshake, UserPlus, Users, Edit, Trash2, MoreVertical, Link as LinkIcon } from 'lucide-react';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
    app = initializeApp(firebaseConfig, 'AdminApp');
    database = getDatabase(app);
  }
}

const generateUserId = () => {
  return 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateReferralCode = (name: string, uid: string) => {
  const namePart = name.replace(/\s+/g, '').toLowerCase().substring(0, 6);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${namePart}${randomPart}`;
};

const checkEmailExists = async (email: string, excludeUid?: string): Promise<boolean> => {
  try {
    const affiliatesRef = ref(database, 'affiliates');
    const snap = await get(affiliatesRef);
    if (snap.exists()) {
      const affiliates = snap.val();
      for (const affiliateData of Object.values(affiliates)) {
        const data = affiliateData as any;
        if (data.email === email && data.uid !== excludeUid) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

const checkUsernameExists = async (username: string, excludeUid?: string): Promise<boolean> => {
  try {
    const affiliatesRef = ref(database, 'affiliates');
    const snap = await get(affiliatesRef);
    if (snap.exists()) {
      const affiliates = snap.val();
      for (const affiliateData of Object.values(affiliates)) {
        const data = affiliateData as any;
        if (data.username === username && data.uid !== excludeUid) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
};

const checkReferralCodeExists = async (code: string, excludeUid?: string): Promise<boolean> => {
  try {
    const affiliatesRef = ref(database, 'affiliates');
    const snap = await get(affiliatesRef);
    if (snap.exists()) {
      const affiliates = snap.val();
      for (const affiliateData of Object.values(affiliates)) {
        const data = affiliateData as any;
        if (data.referralCode === code && data.uid !== excludeUid) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking referral code:', error);
    return false;
  }
};

interface UserDetails {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
}

interface Affiliate {
  uid: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  isAffiliate: boolean;
  joinDate: string;
  referralCode: string;
  referralLink: string;
  hasEditedReferral?: boolean;
  hasPurchasedProduct?: boolean;
  forceAccessGranted?: boolean;
}

const fetchAffiliates = async (setAffiliates: React.Dispatch<React.SetStateAction<Affiliate[]>>) => {
  try {
    const affiliatesRef = ref(database, 'affiliates');
    const snap = await get(affiliatesRef);
    if (snap.exists()) {
      const data = snap.val();
      const affiliatesList: Affiliate[] = Object.entries(data).map(([uid, d]: [string, any]) => ({
        ...d,
        uid,
      })) as Affiliate[];
      affiliatesList.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
      setAffiliates(affiliatesList);
    } else {
      setAffiliates([]);
    }
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    setAffiliates([]);
  }
};

// Shared function to manage dashboard access
const updateDashboardAccess = async (uid: string, grant: boolean) => {
  try {
    const affiliateRef = ref(database, `affiliates/${uid}`);
    const updates: any = {
      lastUpdated: new Date().toISOString(),
    };

    if (grant) {
      updates.hasPurchasedProduct = true;
      updates.lastPurchaseDate = new Date().toISOString();
      updates.purchaseVerified = true;
      updates.forceAccessGranted = true;
    } else {
      updates.hasPurchasedProduct = false;
      updates.lastPurchaseDate = null;
      updates.purchaseVerified = false;
      updates.forceAccessGranted = false;
    }

    await update(affiliateRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating dashboard access:', error);
    return false;
  }
};

const AddUserForm: React.FC<{ onSuccess: () => void; onClose?: () => void }> = ({ onSuccess, onClose }) => {
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', email: '', phone: '', username: '', password: '' });
  const [manualReferral, setManualReferral] = useState(false);
  const [customReferralCode, setCustomReferralCode] = useState('');
  const [grantDirectAccess, setGrantDirectAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userDetails.name || !userDetails.email || !userDetails.phone || !userDetails.username || !userDetails.password) {
      toast({ title: 'Incomplete Details', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userDetails.email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    if (userDetails.phone.length < 10) {
      toast({ title: 'Invalid Phone', description: 'Please enter a valid phone number.', variant: 'destructive' });
      return;
    }
    if (userDetails.username.length < 3) {
      toast({ title: 'Invalid Username', description: 'Username must be at least 3 characters.', variant: 'destructive' });
      return;
    }
    if (userDetails.password.length < 6) {
      toast({ title: 'Invalid Password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    let referralCode: string = '';
    let hasEditedReferral: boolean = false;

    if (manualReferral) {
      if (customReferralCode.length < 6) {
        toast({ title: 'Invalid Referral Code', description: 'Referral code must be at least 6 characters.', variant: 'destructive' });
        return;
      }
      const codeExists = await checkReferralCodeExists(customReferralCode);
      if (codeExists) {
        toast({ title: 'Referral Code Already Exists', description: 'This referral code is already in use.', variant: 'destructive' });
        return;
      }
      referralCode = customReferralCode;
      hasEditedReferral = true;
    }

    setLoading(true);
    try {
      const emailExists = await checkEmailExists(userDetails.email);
      if (emailExists) {
        toast({ title: 'Email Already Exists', description: 'An affiliate with this email already exists.', variant: 'destructive' });
        return;
      }

      const usernameExists = await checkUsernameExists(userDetails.username);
      if (usernameExists) {
        toast({ title: 'Username Already Exists', description: 'An affiliate with this username already exists.', variant: 'destructive' });
        return;
      }

      const uid = generateUserId();
      setUserId(uid);

      if (!manualReferral) {
        referralCode = generateReferralCode(userDetails.name, uid);
      }

      const userData: Affiliate = {
        uid,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        username: userDetails.username,
        password: userDetails.password,
        isAffiliate: true,
        joinDate: new Date().toISOString(),
        referralCode,
        referralLink: `${window.location.origin}/affiliate?ref=${referralCode}`,
        hasEditedReferral,
        hasPurchasedProduct: false,
      };

      const userRef = ref(database, `affiliates/${uid}`);
      await set(userRef, userData);

      if (grantDirectAccess) {
        const success = await updateDashboardAccess(uid, true);
        if (success) {
          toast({ title: 'Direct Access Granted 🎉', description: 'Full dashboard access enabled.' });
        }
      }

      setUserDetails({ name: '', email: '', phone: '', username: '', password: '' });
      setManualReferral(false);
      setCustomReferralCode('');
      setGrantDirectAccess(false);
      setUserId(null);

      toast({
        title: 'User Added Successfully! 🎉',
        description: `New affiliate "${userDetails.name}" created. ID: ${uid}`,
      });

      onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({ title: 'Add User Failed', description: 'Failed to add user.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg mt-6">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full">
          <UserPlus className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">Add New Affiliate</CardTitle>
        <CardDescription>Create a new affiliate account manually (Admin only)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" type="text" placeholder="Enter full name" value={userDetails.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" name="email" type="email" placeholder="Enter email" value={userDetails.email} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" name="phone" type="tel" placeholder="Enter phone number" value={userDetails.phone} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input id="username" name="username" type="text" placeholder="Unique username (min 3 chars)" value={userDetails.username} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input id="password" name="password" type="password" placeholder="Password (min 6 chars)" value={userDetails.password} onChange={handleInputChange} required />
            </div>

            <div>
              <Label>Referral Code *</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="radio" id="auto-ref" name="ref-type" checked={!manualReferral} onChange={() => setManualReferral(false)} />
                  <Label htmlFor="auto-ref" className="cursor-pointer">Auto-generate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="manual-ref" name="ref-type" checked={manualReferral} onChange={() => setManualReferral(true)} />
                  <Label htmlFor="manual-ref" className="cursor-pointer">Manual</Label>
                </div>
              </div>
              {manualReferral && (
                <Input
                  type="text"
                  placeholder="Custom referral code (min 6 chars)"
                  value={customReferralCode}
                  onChange={(e) => setCustomReferralCode(e.target.value)}
                  className="mt-2"
                  required
                />
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="grant-direct-access-add"
                  checked={grantDirectAccess}
                  onChange={(e) => setGrantDirectAccess(e.target.checked)}
                />
                <Label htmlFor="grant-direct-access-add" className="cursor-pointer font-semibold">
                  Grant Direct Dashboard Access
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1 ml-8">
                Enables full dashboard access immediately (bypasses product purchase).
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? 'Adding...' : (
              <>
                <Handshake className="mr-2 h-4 w-4" />
                Add Affiliate
              </>
            )}
          </Button>
        </form>

        {userId && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700"><strong>Generated ID:</strong> {userId}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EditUserForm: React.FC<{ affiliate: Affiliate; onSuccess: () => void; onClose: () => void }> = ({ affiliate, onSuccess, onClose }) => {
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: affiliate.name,
    email: affiliate.email,
    phone: affiliate.phone,
    username: affiliate.username,
    password: affiliate.password
  });
  const [grantDirectAccess, setGrantDirectAccess] = useState(!!affiliate.hasPurchasedProduct);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userDetails.name || !userDetails.email || !userDetails.phone || !userDetails.username || !userDetails.password) {
      toast({ title: 'Incomplete Details', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userDetails.email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    if (userDetails.phone.length < 10) {
      toast({ title: 'Invalid Phone', description: 'Please enter a valid phone number.', variant: 'destructive' });
      return;
    }
    if (userDetails.username.length < 3) {
      toast({ title: 'Invalid Username', description: 'Username must be at least 3 characters.', variant: 'destructive' });
      return;
    }
    if (userDetails.password.length < 6) {
      toast({ title: 'Invalid Password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const emailExists = await checkEmailExists(userDetails.email, affiliate.uid);
      if (emailExists) {
        toast({ title: 'Email Already Exists', description: 'An affiliate with this email already exists.', variant: 'destructive' });
        return;
      }

      const usernameExists = await checkUsernameExists(userDetails.username, affiliate.uid);
      if (usernameExists) {
        toast({ title: 'Username Already Exists', description: 'An affiliate with this username already exists.', variant: 'destructive' });
        return;
      }

      const updatedData: Partial<Affiliate> = {
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        username: userDetails.username,
        password: userDetails.password,
      };

      const userRef = ref(database, `affiliates/${affiliate.uid}`);
      await set(userRef, { ...affiliate, ...updatedData });

      // Update dashboard access if changed
      const shouldHaveAccess = grantDirectAccess;
      const currentlyHasAccess = !!affiliate.hasPurchasedProduct;

      if (shouldHaveAccess !== currentlyHasAccess) {
        const success = await updateDashboardAccess(affiliate.uid, shouldHaveAccess);
        if (success) {
          toast({
            title: shouldHaveAccess ? 'Access Granted' : 'Access Revoked',
            description: shouldHaveAccess
              ? 'Full dashboard access has been enabled.'
              : 'Dashboard access has been restricted.',
          });
        }
      }

      toast({ title: 'User Updated Successfully! 🎉', description: `Affiliate "${userDetails.name}" updated.` });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ title: 'Update Failed', description: 'Failed to update user.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Affiliate</DialogTitle>
        <DialogDescription>
          Update affiliate details and manage dashboard access.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="name-edit">Full Name *</Label>
            <Input id="name-edit" name="name" type="text" value={userDetails.name} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="email-edit">Email Address *</Label>
            <Input id="email-edit" name="email" type="email" value={userDetails.email} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="phone-edit">Phone Number *</Label>
            <Input id="phone-edit" name="phone" type="tel" value={userDetails.phone} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="username-edit">Username *</Label>
            <Input id="username-edit" name="username" type="text" value={userDetails.username} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="password-edit">Password *</Label>
            <Input id="password-edit" name="password" type="password" value={userDetails.password} onChange={handleInputChange} required />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="grant-direct-access-edit"
                checked={grantDirectAccess}
                onChange={(e) => setGrantDirectAccess(e.target.checked)}
              />
              <Label htmlFor="grant-direct-access-edit" className="cursor-pointer font-semibold">
                Grant Direct Dashboard Access
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-8">
              {grantDirectAccess
                ? 'User currently has full dashboard access.'
                : 'User requires product purchase for dashboard access.'}
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Affiliate'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const EditReferralForm: React.FC<{ affiliate: Affiliate; onSuccess: () => void; onClose: () => void }> = ({ affiliate, onSuccess, onClose }) => {
  const { toast } = useToast();
  const [manualReferral, setManualReferral] = useState(false);
  const [customReferralCode, setCustomReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    const code = generateReferralCode(affiliate.name, affiliate.uid);
    setGeneratedCode(code);
    setCustomReferralCode(code);
  }, [affiliate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalReferralCode: string;

    if (manualReferral) {
      if (customReferralCode.length < 6) {
        toast({ title: 'Invalid Referral Code', description: 'Referral code must be at least 6 characters.', variant: 'destructive' });
        return;
      }
      const codeExists = await checkReferralCodeExists(customReferralCode, affiliate.uid);
      if (codeExists) {
        toast({ title: 'Referral Code Already Exists', description: 'This referral code is already in use.', variant: 'destructive' });
        return;
      }
      finalReferralCode = customReferralCode;
    } else {
      finalReferralCode = generatedCode;
    }

    setLoading(true);
    try {
      const updatedData = {
        ...affiliate,
        referralCode: finalReferralCode,
        referralLink: `${window.location.origin}/affiliate?ref=${finalReferralCode}`,
        hasEditedReferral: true,
      };

      const userRef = ref(database, `affiliates/${affiliate.uid}`);
      await set(userRef, updatedData);

      toast({
        title: 'Referral Code Updated Successfully! 🎉',
        description: `Referral code updated to: ${finalReferralCode}`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating referral code:', error);
      toast({ title: 'Update Failed', description: 'Failed to update referral code.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Referral Code</DialogTitle>
        <DialogDescription>Update the referral code (one-time edit).</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <Label>Current Referral Code</Label>
            <Input type="text" value={affiliate.referralCode} disabled className="bg-muted" />
          </div>
          <div>
            <Label>New Referral Code *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="radio" id="auto-ref-edit" name="ref-type-edit" checked={!manualReferral} onChange={() => setManualReferral(false)} />
                <Label htmlFor="auto-ref-edit" className="cursor-pointer">Auto-generate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="manual-ref-edit" name="ref-type-edit" checked={manualReferral} onChange={() => setManualReferral(true)} />
                <Label htmlFor="manual-ref-edit" className="cursor-pointer">Manual</Label>
              </div>
            </div>
            <Input
              type="text"
              placeholder="Enter custom referral code (min 6 chars)"
              value={customReferralCode}
              onChange={(e) => setCustomReferralCode(e.target.value)}
              className="mt-2"
              disabled={!manualReferral}
              required
            />
            {!manualReferral && <p className="text-xs text-muted-foreground mt-1">Auto-generated: {generatedCode}</p>}
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Referral Code'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const AdminAffiliates: React.FC = () => {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [editingReferralAffiliate, setEditingReferralAffiliate] = useState<Affiliate | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    fetchAffiliates(setAffiliates);
  }, []);

  const handleAddSuccess = () => fetchAffiliates(setAffiliates);
  const handleEditSuccess = () => fetchAffiliates(setAffiliates);

  const handleDelete = async () => {
    if (!deletingUid) return;
    try {
      await remove(ref(database, `affiliates/${deletingUid}`));
      toast({ title: 'User Deleted Successfully!', description: 'The affiliate has been removed.' });
      setDeletingUid(null);
      fetchAffiliates(setAffiliates);
    } catch (error) {
      toast({ title: 'Delete Failed', description: 'Failed to delete user.', variant: 'destructive' });
    }
  };

  return (
    <div className="py-12 bg-gradient-to-b from-muted/20 to-muted/60 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Users className="h-6 w-6 mr-2 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Affiliates Management</h1>
            </div>
            <p className="text-muted-foreground">View and manage all affiliates</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "destructive" : "default"}>
            {showForm ? 'Cancel' : 'Add User'}
          </Button>
        </div>

        {showForm && <AddUserForm onSuccess={handleAddSuccess} onClose={() => setShowForm(false)} />}

        <Dialog open={!!editingAffiliate} onOpenChange={() => setEditingAffiliate(null)}>
          {editingAffiliate && (
            <EditUserForm
              affiliate={editingAffiliate}
              onSuccess={handleEditSuccess}
              onClose={() => setEditingAffiliate(null)}
            />
          )}
        </Dialog>

        <Dialog open={!!editingReferralAffiliate} onOpenChange={() => setEditingReferralAffiliate(null)}>
          {editingReferralAffiliate && (
            <EditReferralForm
              affiliate={editingReferralAffiliate}
              onSuccess={handleEditSuccess}
              onClose={() => setEditingReferralAffiliate(null)}
            />
          )}
        </Dialog>

        <AlertDialog open={!!deletingUid} onOpenChange={() => setDeletingUid(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the affiliate.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              All Affiliates ({affiliates.length})
            </CardTitle>
            <CardDescription>Listing of all registered affiliates</CardDescription>
          </CardHeader>
          <CardContent>
            {affiliates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No affiliates found. Add one to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate) => (
                      <TableRow key={affiliate.uid}>
                        <TableCell className="font-medium">{affiliate.name}</TableCell>
                        <TableCell>{affiliate.email}</TableCell>
                        <TableCell>{affiliate.phone}</TableCell>
                        <TableCell>{affiliate.username}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{affiliate.password}</TableCell>
                        <TableCell className="font-mono text-sm">{affiliate.referralCode}</TableCell>
                        <TableCell>
                          {affiliate.hasPurchasedProduct ? (
                            <span className="text-green-600 font-medium">Full Access</span>
                          ) : (
                            <span className="text-amber-600">Purchase Required</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(affiliate.joinDate).toLocaleDateString()}</TableCell>
                       <TableCell className="text-right">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" className="w-40">
      <DropdownMenuItem onClick={() => setEditingAffiliate(affiliate)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>

      {!affiliate.hasEditedReferral && (
        <DropdownMenuItem onClick={() => setEditingReferralAffiliate(affiliate)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Referral
        </DropdownMenuItem>
      )}

      <DropdownMenuItem asChild>
        <a
          href={affiliate.referralLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center"
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          View Link
        </a>
      </DropdownMenuItem>

      <DropdownMenuItem
        className="text-red-600 focus:text-red-600"
        onClick={() => setDeletingUid(affiliate.uid)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAffiliates;