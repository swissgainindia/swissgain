'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus, Handshake, DollarSign, Link as LinkIcon, Copy, Share2, Users,
  TrendingUp, ArrowRight, Zap, Target, BarChart3, InfoIcon, Sparkles,
  ShoppingBag, Calendar, User, CreditCard, Phone, Mail, Globe,
  BarChart, PieChart, Activity, Download, Filter, Search,
  Eye, MoreHorizontal, ArrowUpRight, ArrowDownRight, Wallet, IndianRupee,
  ChevronDown, ChevronUp
} from 'lucide-react';

// Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

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

const commissionStructure = [
  { level: 1, percent: '10%', earning: '₹299.90' },
  { level: 2, percent: '5%', earning: '₹149.95' },
  { level: 3, percent: '2.5%', earning: '₹74.98' },
  { level: 4, percent: '2%', earning: '₹59.98' },
  { level: 5, percent: '1.5%', earning: '₹44.99' },
  { level: 6, percent: '1%', earning: '₹29.99' },
  { level: 7, percent: '0.8%', earning: '₹23.99' },
  { level: 8, percent: '0.6%', earning: '₹17.99' },
  { level: 9, percent: '0.5%', earning: '₹14.99' },
  { level: 10, percent: '0.5%', earning: '₹14.99' }
];

export default function AdminReferralDashboard() {
  const { toast } = useToast();
  
  // Default active tab: All Users
  const [activeTab, setActiveTab] = useState('users');
  
  const [allAffiliates, setAllAffiliates] = useState<any>({});
  const [allCommissions, setAllCommissions] = useState<any>({});
  
  // Search states for each tab
  const [searchUsers, setSearchUsers] = useState('');
  const [searchChains, setSearchChains] = useState('');
  const [searchCommissions, setSearchCommissions] = useState('');
  
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    totalEarnings: 0,
    totalSales: 0,
    totalReferrals: 0,
    avgConversion: 0
  });
  
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  /* ---------- Load Data ---------- */
  useEffect(() => {
    const affRef = ref(database, 'affiliates');
    onValue(affRef, (snap) => {
      if (snap.exists()) {
        const affiliates = snap.val();
        setAllAffiliates(affiliates);

        let totalUsers = Object.keys(affiliates).length;
        let totalEarnings = 0;
        let totalSales = 0;
        let totalReferrals = 0;

        Object.values(affiliates).forEach((user: any) => {
          totalEarnings += user.totalEarnings || 0;
          totalSales += user.totalSales || 0;
          totalReferrals += (user.referrals || []).length;
        });

        const avgConversion = totalReferrals > 0 ? (totalSales / totalReferrals) * 100 : 0;

        setGlobalStats({ totalUsers, totalEarnings, totalSales, totalReferrals, avgConversion });
      }
    });

    const commissionsRef = ref(database, 'commissions');
    onValue(commissionsRef, (snap) => {
      if (snap.exists()) {
        setAllCommissions(snap.val());
      }
    });
  }, []);

  // Build referral chain
  const buildChain = (uid: string, affiliates: any) => {
    const upline: any[] = [];
    let current = affiliates[uid];
    let level = 1;
    while (current && current.referredById) {
      const referrer = affiliates[current.referredById];
      if (referrer) {
        upline.push({
          uid: current.referredById,
          name: referrer.name || 'Unknown',
          level
        });
        current = referrer;
        level++;
      } else break;
    }
    // Reverse to show immediate upline first (level 1) to top
    upline.reverse();

    const downline: any[] = [];
    const buildDownline = (refUid: string, level: number) => {
      const user = affiliates[refUid];
      if (user && user.referrals) {
        user.referrals.forEach((ref: any) => {
          downline.push({
            uid: ref.uid,
            name: ref.name || 'Unknown User',
            level
          });
          buildDownline(ref.uid, level + 1);
        });
      }
    };
    buildDownline(uid, 1);

    return { upline, downline };
  };

  // Toggle chain visibility
  const toggleChain = (uid: string) => {
    const newSet = new Set(expandedChains);
    if (newSet.has(uid)) newSet.delete(uid);
    else newSet.add(uid);
    setExpandedChains(newSet);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Invalid';
    }
  };

  // Filtered lists
  const filteredUsers = Object.entries(allAffiliates)
    .filter(([uid, user]: [string, any]) => {
      const term = searchUsers.toLowerCase();
      return !searchUsers || 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        uid.includes(term);
    })
    .map(([uid, user]: [string, any]) => ({ uid, ...user }));

  const filteredChains = Object.entries(allAffiliates)
    .filter(([uid, user]: [string, any]) => {
      const term = searchChains.toLowerCase();
      return !searchChains || 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        uid.includes(term);
    })
    .map(([uid, user]: [string, any]) => ({ uid, ...user }));

  const filteredCommissions = Object.entries(allCommissions)
    .flatMap(([affId, comms]: [any, any]) => 
      Object.entries(comms).map(([id, comm]: [string, any]) => ({
        id,
        affId,
        affiliateName: allAffiliates[affId]?.name || affId,
        ...comm
      }))
    )
    .filter((comm: any) => {
      const term = searchCommissions.toLowerCase();
      return !searchCommissions ||
        comm.affiliateName?.toLowerCase().includes(term) ||
        comm.customerName?.toLowerCase().includes(term) ||
        comm.productName?.toLowerCase().includes(term);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 py-1 px-3 text-primary font-semibold">
            Admin Referral Dashboard
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">Global Referral & Earn Analytics</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Monitor all users, their referral chains, earnings, and system-wide performance.
          </p>
        </div>

        {/* Global Stats */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle>System-Wide Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{globalStats.totalUsers}</div>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">₹{globalStats.totalEarnings.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Earnings Paid</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-2">{globalStats.totalSales}</div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{globalStats.totalReferrals}</div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{Math.round(globalStats.avgConversion)}%</div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="chains">Referral Chains</TabsTrigger>
            <TabsTrigger value="commissions">Global Commissions</TabsTrigger>
          </TabsList>

          {/* All Users */}
          <TabsContent value="users" className="mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All Affiliates</CardTitle>
                  <CardDescription>{filteredUsers.length} users {searchUsers && `matching "${searchUsers}"`}</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="w-80 pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email/Phone</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>Total Sales</TableHead>
                      <TableHead>Downline</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => {
                      const chain = buildChain(user.uid, allAffiliates);
                      return (
                        <>
                          <TableRow key={user.uid}>
                            <TableCell className="font-mono text-xs">{user.uid.slice(0, 10)}...</TableCell>
                            <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                            <TableCell className="text-sm">{user.email || user.phone || '—'}</TableCell>
                            <TableCell>{formatDate(user.joinDate)}</TableCell>
                            <TableCell className="font-bold text-green-600">₹{(user.totalEarnings || 0).toLocaleString()}</TableCell>
                            <TableCell>{user.totalSales || 0}</TableCell>
                            <TableCell>{(user.referrals || []).length}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => toggleChain(user.uid)}>
                                {expandedChains.has(user.uid) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Chain
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedChains.has(user.uid) && (
                            <>
                              {chain.upline.length > 0 && (
                                <TableRow>
                                  <TableCell colSpan={8} className="p-0">
                                    <div className="bg-green-50 border-t">
                                      <div className="px-4 py-3 border-b">
                                        <h5 className="font-semibold flex items-center gap-2 text-green-600">
                                          <ArrowUpRight className="h-4 w-4" /> Upline ({chain.upline.length})
                                        </h5>
                                      </div>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {chain.upline.map((u: any, i: number) => (
                                          <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                                            <span className="font-medium">{u.name}</span>
                                            <Badge variant="secondary" className="text-xs">L{u.level}</Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                              {chain.downline.length > 0 && (
                                <TableRow>
                                  <TableCell colSpan={8} className="p-0">
                                    <div className="bg-blue-50 border-t">
                                      <div className="px-4 py-3 border-b">
                                        <h5 className="font-semibold flex items-center gap-2 text-blue-600">
                                          <ArrowDownRight className="h-4 w-4" /> Downline ({chain.downline.length})
                                        </h5>
                                      </div>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {chain.downline.slice(0, 10).map((d: any, i: number) => (
                                          <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                                            <span className="font-medium">{d.name}</span>
                                            <Badge variant="outline" className="text-xs">L{d.level}</Badge>
                                          </div>
                                        ))}
                                        {chain.downline.length > 10 && (
                                          <div className="px-4 py-2 text-center text-sm text-muted-foreground">
                                            ... and {chain.downline.length - 10} more
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Chains */}
          <TabsContent value="chains" className="mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Referral Chains</CardTitle>
                  <CardDescription>View complete upline & downline for each user</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search user to view chain..."
                    value={searchChains}
                    onChange={(e) => setSearchChains(e.target.value)}
                    className="w-80 pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredChains.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">No users found matching your search.</p>
                  ) : (
                    filteredChains.map((user: any) => {
                      const chain = buildChain(user.uid, allAffiliates);
                      return (
                        <Card key={user.uid} className="border">
                          <CardHeader className="flex justify-between items-center pb-3">
                            <div>
                              <CardTitle className="text-lg">{user.name || 'Unknown'}</CardTitle>
                              <p className="text-sm text-muted-foreground">{user.uid.slice(0, 12)}...</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => toggleChain(user.uid)}>
                              {expandedChains.has(user.uid) ? 'Hide' : 'Show'} Chain
                            </Button>
                          </CardHeader>
                          {expandedChains.has(user.uid) && (
                            <CardContent className="space-y-6 pt-4">
                              {chain.upline.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                                    <ArrowUpRight className="h-5 w-5" /> Upline ({chain.upline.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {chain.upline.map((u: any, i: number) => (
                                      <div key={i} className="flex justify-between items-center bg-green-50 px-4 py-2 rounded">
                                        <span className="font-medium">{u.name}</span>
                                        <Badge variant="secondary">Level {u.level}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {chain.downline.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-600">
                                    <ArrowDownRight className="h-5 w-5" /> Downline ({chain.downline.length})
                                  </h4>
                                  <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {chain.downline.slice(0, 20).map((d: any, i: number) => (
                                      <div key={i} className="flex justify-between items-center bg-blue-50 px-4 py-2 rounded">
                                        <span className="font-medium">{d.name}</span>
                                        <Badge variant="outline">Level {d.level}</Badge>
                                      </div>
                                    ))}
                                    {chain.downline.length > 20 && (
                                      <p className="text-center text-sm text-muted-foreground pt-2">
                                        ... and {chain.downline.length - 20} more
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Commissions */}
          <TabsContent value="commissions" className="mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Global Commissions</CardTitle>
                  <CardDescription>All commission payouts across the network</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by affiliate, customer, or product..."
                    value={searchCommissions}
                    onChange={(e) => setSearchCommissions(e.target.value)}
                    className="w-80 pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No commissions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCommissions.slice(0, 100).map((comm: any) => (
                        <TableRow key={comm.id}>
                          <TableCell className="font-medium">{comm.affiliateName}</TableCell>
                          <TableCell><Badge variant="secondary">L{comm.level}</Badge></TableCell>
                          <TableCell>{comm.customerName || '—'}</TableCell>
                          <TableCell className="max-w-xs truncate">{comm.productName || '—'}</TableCell>
                          <TableCell>₹{Number(comm.purchaseAmount || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-green-600">₹{Number(comm.commissionAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>{formatDate(comm.timestamp)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}