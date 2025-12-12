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
import { getDatabase, ref, set, get, remove } from 'firebase/database';
import { Handshake, UserPlus, Users, Edit, Trash2 } from 'lucide-react';

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
     
      // Check if any affiliate has this email, excluding the current uid
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

interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

interface Affiliate {
  uid: string;
  name: string;
  email: string;
  phone: string;
  isAffiliate: boolean;
  joinDate: string;
  referralCode: string;
  referralLink: string;
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
      // Sort by joinDate descending
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

const AddUserForm: React.FC<{ onSuccess: () => void; onClose?: () => void }> = ({ onSuccess, onClose }) => {
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      toast({
        title: 'Incomplete Details',
        description: 'Please fill all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userDetails.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
   
    if (userDetails.phone.length < 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(userDetails.email);
      if (emailExists) {
        toast({
          title: 'Email Already Exists',
          description: 'An affiliate with this email already exists.',
          variant: 'destructive',
        });
        return;
      }

      // Generate user ID and referral code
      const uid = generateUserId();
      setUserId(uid);
      const referralCode = generateReferralCode(userDetails.name, uid);

      // Prepare user data
      const userData = {
        uid: uid,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        isAffiliate: true,
        joinDate: new Date().toISOString(),
        referralCode: referralCode,
        referralLink: `${window.location.origin}/affiliate?ref=${referralCode}`,
      };

      // Save to Firebase
      const userRef = ref(database, `affiliates/${uid}`);
      await set(userRef, userData);

      // Reset form
      setUserDetails({ name: '', email: '', phone: '' });
      setUserId(null);

      toast({
        title: 'User Added Successfully! 🎉',
        description: `New affiliate "${userDetails.name}" has been created with ID: ${uid}. Referral Code: ${referralCode}`,
      });

      console.log('User added:', userData);
      onSuccess(); // Refetch the list
      if (onClose) onClose();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Add User Failed',
        description: 'Failed to add user. Please try again.',
        variant: 'destructive',
      });
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
        <CardDescription>
          Create a new affiliate account manually (Admin only - no payment required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter full name"
                value={userDetails.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={userDetails.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter phone number"
                value={userDetails.phone}
                onChange={handleInputChange}
                required
              />
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
            <p className="text-sm text-green-700">
              <strong>Generated ID:</strong> {userId}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EditUserForm: React.FC<{ affiliate: Affiliate; onSuccess: () => void; onClose: () => void }> = ({ affiliate, onSuccess, onClose }) => {
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: affiliate.name, email: affiliate.email, phone: affiliate.phone });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      toast({
        title: 'Incomplete Details',
        description: 'Please fill all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userDetails.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
   
    if (userDetails.phone.length < 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists (exclude current uid)
      const emailExists = await checkEmailExists(userDetails.email, affiliate.uid);
      if (emailExists) {
        toast({
          title: 'Email Already Exists',
          description: 'An affiliate with this email already exists.',
          variant: 'destructive',
        });
        return;
      }

      // Generate new referral code if name changed
      const newReferralCode = generateReferralCode(userDetails.name, affiliate.uid);

      // Prepare updated data
      const updatedData = {
        ...affiliate,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        referralCode: newReferralCode,
        referralLink: `${window.location.origin}/affiliate?ref=${newReferralCode}`,
      };

      // Update in Firebase
      const userRef = ref(database, `affiliates/${affiliate.uid}`);
      await set(userRef, updatedData);

      toast({
        title: 'User Updated Successfully! 🎉',
        description: `Affiliate "${userDetails.name}" has been updated.`,
      });

      console.log('User updated:', updatedData);
      onSuccess(); // Refetch the list
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Affiliate</DialogTitle>
        <DialogDescription>
          Update the affiliate details below.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter full name"
              value={userDetails.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              value={userDetails.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter phone number"
              value={userDetails.phone}
              onChange={handleInputChange}
              required
            />
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

const AdminAffiliates: React.FC = () => {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    fetchAffiliates(setAffiliates);
  }, []);

  const handleAddSuccess = () => {
    fetchAffiliates(setAffiliates);
  };

  const handleEditSuccess = () => {
    fetchAffiliates(setAffiliates);
  };

  const handleDelete = async () => {
    if (!deletingUid) return;
    try {
      const deleteRef = ref(database, `affiliates/${deletingUid}`);
      await remove(deleteRef);
      toast({
        title: 'User Deleted Successfully!',
        description: 'The affiliate has been removed.',
      });
      setDeletingUid(null);
      fetchAffiliates(setAffiliates);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
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

        <AlertDialog open={!!deletingUid} onOpenChange={() => setDeletingUid(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the affiliate and remove their data.
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
                      <TableHead>Referral Code</TableHead>
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
                        <TableCell className="font-mono text-sm">{affiliate.referralCode}</TableCell>
                        <TableCell>
                          {new Date(affiliate.joinDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingAffiliate(affiliate)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setDeletingUid(affiliate.uid)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={affiliate.referralLink} target="_blank" rel="noopener noreferrer">
                              View Link
                            </a>
                          </Button>
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