'use client';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search, ChevronDown, ChevronUp, Users, TrendingUp, ArrowRight,
  ArrowUpRight, ArrowDownRight, TreePine, Network, GitFork,
  User, Users2, GitBranch, GitCommit, Circle, UserPlus
} from 'lucide-react';
// Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
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
// Tree visualization component
interface TreeProps {
  user: any;
  allAffiliates: any;
  referralsMap: any;
  level?: number;
  maxDepth?: number;
  onNodeClick?: (uid: string) => void;
  selectedNode?: string;
}
const TreeVisualization: React.FC<TreeProps> = ({ user, allAffiliates, referralsMap, level = 0, maxDepth = 3, onNodeClick, selectedNode }) => {
  const [expanded, setExpanded] = useState(level === 0);
  const directDownline = referralsMap[user.uid] || [];
  const hasChildren = directDownline.length > 0;
  const isOverflow = level >= maxDepth;
  return (
    <div className={`ml-${level * 6}`}>
      {/* Node */}
      <div className="flex items-center mb-2">
        {/* Vertical line */}
        {level > 0 && (
          <div className="w-6 flex justify-center">
            <div className="w-px h-8 bg-gray-300"></div>
          </div>
        )}
       
        {/* Horizontal connector */}
        {level > 0 && (
          <div className="w-4 h-px bg-gray-300 -ml-1"></div>
        )}
        {/* Node content */}
        <div 
          className={`relative flex items-center cursor-pointer ${level === 0 ? 'bg-primary/10 p-3 rounded-lg border border-primary/20' : 'bg-white p-2 rounded border'} ${selectedNode === user.uid ? 'ring-2 ring-primary/30 bg-primary/5' : ''}`}
          onClick={() => onNodeClick?.(user.uid)}
        >
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${level === 0 ? 'bg-primary text-white' : level === 1 ? 'bg-green-100 text-green-600' : level === 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">{user.name || 'Unknown'}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">L{level}</Badge>
                <span className="text-xs text-muted-foreground">
                  {directDownline.length} direct
                </span>
              </div>
            </div>
          </div>
          {/* Expand/collapse button */}
          {hasChildren && !isOverflow && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-4 h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
      {/* Children */}
      {expanded && hasChildren && !isOverflow && (
        <div className="relative">
          {/* Vertical line extending down */}
          {hasChildren && (
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-300"></div>
          )}
         
          <div className="ml-12">
            {directDownline.map((childUid: string, index: number) => {
              const child = allAffiliates[childUid];
              if (!child) return null;
             
              return (
                <div key={childUid}>
                  {/* Branch line */}
                  <div className="flex items-center">
                    <div className="w-6 h-px bg-gray-300"></div>
                  </div>
                 
                  <TreeVisualization
                    user={child}
                    allAffiliates={allAffiliates}
                    referralsMap={referralsMap}
                    level={level + 1}
                    maxDepth={maxDepth}
                    onNodeClick={onNodeClick}
                    selectedNode={selectedNode}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Overflow message */}
      {isOverflow && directDownline.length > 0 && (
        <div className="ml-12 mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranch className="h-3 w-3" />
            <span>+{directDownline.length} more downline users...</span>
          </div>
        </div>
      )}
    </div>
  );
};
// Network Graph visualization component
const NetworkGraph = ({ user, allAffiliates, referralsMap }) => {
  const [depth, setDepth] = useState(3);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'radial'
 
  // Build network data
  const buildNetwork = (uid: string, currentDepth = 0, maxDepth = 3) => {
    if (currentDepth > maxDepth) return null;
   
    const node = allAffiliates[uid];
    if (!node) return null;
   
    const children = referralsMap[uid] || [];
   
    return {
      id: uid,
      name: node.name || 'Unknown',
      level: currentDepth,
      children: children
        .map(childUid => buildNetwork(childUid, currentDepth + 1, maxDepth))
        .filter(Boolean),
      earnings: node.totalEarnings || 0,
      sales: node.totalSales || 0,
      directs: children.length
    };
  };
  const networkData = buildNetwork(user.uid, 0, depth);
  if (viewMode === 'radial') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Depth:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(d => (
                  <Button
                    key={d}
                    variant={depth === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDepth(d)}
                    className="h-8"
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'tree' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('tree')}
            >
              <TreePine className="h-4 w-4 mr-2" />
              Tree
            </Button>
            <Button
              variant={viewMode === 'radial' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('radial')}
            >
              <Network className="h-4 w-4 mr-2" />
              Radial
            </Button>
          </div>
        </div>
        {/* Radial View */}
        <div className="relative h-[400px] border rounded-lg bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Center node */}
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-primary/20 border-4 border-primary/30 flex flex-col items-center justify-center">
                <User className="h-6 w-6 text-primary" />
                <p className="text-xs font-medium mt-1">{user.name?.split(' ')[0] || 'User'}</p>
                <p className="text-xs text-muted-foreground">Level 0</p>
              </div>
            </div>
            {/* Generate circles for each depth */}
            {Array.from({ length: depth }).map((_, levelIdx) => {
              const radius = 80 + (levelIdx + 1) * 80;
              const nodes = getAllNodesAtDepth(networkData, levelIdx + 1);
             
              return (
                <div key={levelIdx}>
                  {/* Circle outline */}
                  <div
                    className="absolute rounded-full border-2 border-dashed border-gray-200"
                    style={{
                      width: radius * 2,
                      height: radius * 2,
                      top: `calc(50% - ${radius}px)`,
                      left: `calc(50% - ${radius}px)`,
                    }}
                  ></div>
                 
                  {/* Nodes at this level */}
                  {nodes.map((node, nodeIdx) => {
                    const angle = (nodeIdx / nodes.length) * 2 * Math.PI;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                   
                    return (
                      <div
                        key={node.id}
                        className="absolute z-20"
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                          left: '50%',
                          top: '50%',
                        }}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
                          <User className="h-3 w-3 text-blue-600" />
                          <span className="text-[10px] font-medium">L{node.level}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
         
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-primary/30"></div>
              <span className="text-xs">You (Level 0)</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-300"></div>
              <span className="text-xs">Level 1-2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-300"></div>
              <span className="text-xs">Level 3+</span>
            </div>
          </div>
         
          <div className="absolute top-4 right-4 text-sm text-muted-foreground">
            Showing {depth} levels deep
          </div>
        </div>
      </div>
    );
  }
  // Tree View (default)
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Depth:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(d => (
                <Button
                  key={d}
                  variant={depth === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDepth(d)}
                  className="h-8"
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>
          <Badge variant="outline">
            {countNodes(networkData)} total nodes
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'tree' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('tree')}
          >
            <TreePine className="h-4 w-4 mr-2" />
            Tree
          </Button>
          <Button
            variant={viewMode === 'radial' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('radial')}
          >
            <Network className="h-4 w-4 mr-2" />
            Radial
          </Button>
        </div>
      </div>
      <div className="border rounded-lg p-6 bg-gradient-to-b from-slate-50/50 to-white min-h-[400px] overflow-auto">
        {networkData ? (
          <TreeVisualization
            user={user}
            allAffiliates={allAffiliates}
            referralsMap={referralsMap}
            maxDepth={depth}
          />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <TreePine className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No network data available</p>
          </div>
        )}
      </div>
    </div>
  );
};
// Helper functions
function getAllNodesAtDepth(node, targetDepth, currentDepth = 0, result = []) {
  if (!node) return result;
 
  if (currentDepth === targetDepth) {
    result.push(node);
  }
 
  if (node.children) {
    node.children.forEach(child => {
      getAllNodesAtDepth(child, targetDepth, currentDepth + 1, result);
    });
  }
 
  return result;
}
function countNodes(node) {
  if (!node) return 0;
  let count = 1;
  if (node.children) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }
  return count;
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

const checkUsernameExists = async (username: string, excludeUid?: string): Promise<boolean> => {
  try {
    const affiliatesRef = ref(database, 'affiliates');
    const snap = await get(affiliatesRef);
   
    if (snap.exists()) {
      const affiliates = snap.val();
     
      // Check if any affiliate has this username, excluding the current uid
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
     
      // Check if any affiliate has this referral code, excluding the current uid
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

export default function AdminReferralDashboard() {
  const { toast } = useToast();
 
  // Default active tab: All Users
  const [activeTab, setActiveTab] = useState('users');
 
  const [allAffiliates, setAllAffiliates] = useState<any>({});
  const [referralsMap, setReferralsMap] = useState<{[key: string]: string[]}>({});
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
 
  const [selectedUserForTree, setSelectedUserForTree] = useState<string | null>(null);
  const [treeViewMode, setTreeViewMode] = useState<'tree' | 'radial'>('tree');

  // States for add affiliate tab
  const [isNewRoot, setIsNewRoot] = useState(false);
  const [selectedRoot, setSelectedRoot] = useState('');
  const [selectedReferrer, setSelectedReferrer] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [manualReferral, setManualReferral] = useState(false);
  const [customReferralCode, setCustomReferralCode] = useState('');

  const roots = useMemo(() => 
    Object.entries(allAffiliates).filter(([, user]: [string, any]) => !user.referredById).map(([uid]) => uid),
    [allAffiliates]
  );
 
  /* ---------- Load Data ---------- */
  useEffect(() => {
    const affRef = ref(database, 'affiliates');
    onValue(affRef, (snap) => {
      if (snap.exists()) {
        const affiliates = snap.val();
        setAllAffiliates(affiliates);
        // Build referrals map
        const map: {[key: string]: string[]} = {};
        Object.values(affiliates).forEach((user: any) => {
          if (user.referredById) {
            if (!map[user.referredById]) {
              map[user.referredById] = [];
            }
            map[user.referredById].push(user.uid);
          }
        });
        setReferralsMap(map);
        let totalUsers = Object.keys(affiliates).length;
        let totalEarnings = 0;
        let totalSales = 0;
        let totalReferrals = Object.values(affiliates).filter((user: any) => user.referredById).length;
        Object.values(affiliates).forEach((user: any) => {
          totalEarnings += user.totalEarnings || 0;
          totalSales += user.totalSales || 0;
        });
        const avgConversion = totalReferrals > 0 ? (totalSales / totalReferrals) * 100 : 0;
        setGlobalStats({ totalUsers, totalEarnings, totalSales, totalReferrals, avgConversion });
        // Select first user for tree view if none selected
        if (!selectedUserForTree && totalUsers > 0) {
          const firstUid = Object.keys(affiliates)[0];
          setSelectedUserForTree(firstUid);
        }
      }
    });
    const commissionsRef = ref(database, 'commissions');
    onValue(commissionsRef, (snap) => {
      if (snap.exists()) {
        setAllCommissions(snap.val());
      }
    });
  }, []);
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Invalid';
    }
  };

  // Handle add affiliate
  const handleAddAffiliate = async () => {
    if (!newName || !newEmail || !newPhone || !newUsername || !newPassword) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    if (isNewRoot && selectedReferrer) {
      setSelectedReferrer('');
    }

    if (!isNewRoot && !selectedReferrer) {
      toast({ title: "Error", description: "Please select a referrer node or add as new root", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
   
    if (newPhone.length < 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    if (newUsername.length < 3) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be at least 3 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    let referralCode: string;
    let hasEditedReferral: boolean = false;

    if (manualReferral) {
      if (customReferralCode.length < 6) {
        toast({
          title: 'Invalid Referral Code',
          description: 'Referral code must be at least 6 characters.',
          variant: 'destructive',
        });
        return;
      }
      const codeExists = await checkReferralCodeExists(customReferralCode);
      if (codeExists) {
        toast({
          title: 'Referral Code Already Exists',
          description: 'This referral code is already in use.',
          variant: 'destructive',
        });
        return;
      }
      referralCode = customReferralCode;
      hasEditedReferral = true;
    } else {
      // Auto-generate unique referral code
      let code;
      while (true) {
        code = generateReferralCode(newName, '');
        const exists = await checkReferralCodeExists(code);
        if (!exists) break;
      }
      referralCode = code;
    }

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(newEmail);
      if (emailExists) {
        toast({
          title: 'Email Already Exists',
          description: 'An affiliate with this email already exists.',
          variant: 'destructive',
        });
        return;
      }

      // Check if username already exists
      const usernameExists = await checkUsernameExists(newUsername);
      if (usernameExists) {
        toast({
          title: 'Username Already Exists',
          description: 'An affiliate with this username already exists.',
          variant: 'destructive',
        });
        return;
      }

      // Generate user ID
      const newUid = generateUserId();

      // Prepare user data
      const newUser: any = {
        uid: newUid,
        name: newName,
        email: newEmail,
        phone: newPhone,
        username: newUsername,
        password: newPassword,
        joinDate: new Date().toISOString(),
        referralCode: referralCode,
        referralLink: `${window.location.origin}/affiliate?ref=${referralCode}`,
        hasEditedReferral: hasEditedReferral,
        totalEarnings: 0,
        totalSales: 0,
      };

      if (isNewRoot) {
        newUser.level = 0;
      } else {
        newUser.referredById = selectedReferrer;
        newUser.level = (allAffiliates[selectedReferrer]?.level || 0) + 1;
      }

      await set(ref(database, `affiliates/${newUid}`), newUser);
      toast({ title: "Success", description: `Added ${newName} as affiliate with Referral Code: ${referralCode}` });
      // Clear form
      setIsNewRoot(false);
      setSelectedRoot('');
      setSelectedReferrer('');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewUsername('');
      setNewPassword('');
      setManualReferral(false);
      setCustomReferralCode('');
    } catch (error) {
      toast({ title: "Error", description: "Failed to add affiliate", variant: "destructive" });
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
            <Network className="h-4 w-4 mr-2" />
            Admin Referral Dashboard
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">Network Visualization & Analytics</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Interactive tree views of referral chains with real-time network analytics
          </p>
        </div>
        {/* Global Stats */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5" />
                Network Overview
              </CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{Object.keys(allAffiliates).length}</span> total nodes
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">{globalStats.totalUsers}</div>
                <p className="text-sm text-muted-foreground">Total Nodes</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">₹{globalStats.totalEarnings.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                <div className="text-3xl font-bold text-amber-600 mb-2">{globalStats.totalSales}</div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">{globalStats.totalReferrals}</div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                <div className="text-3xl font-bold text-pink-600 mb-2">{Math.round(globalStats.avgConversion)}%</div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="chains" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Network View
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Affiliate
            </TabsTrigger>
          </TabsList>
          {/* All Users */}
          <TabsContent value="users" className="mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All Network Nodes</CardTitle>
                  <CardDescription>{filteredUsers.length} users {searchUsers && `matching "${searchUsers}"`}</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search nodes..."
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
                      <TableHead>Node</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Directs</TableHead>
                      <TableHead>View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.uid} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${referralsMap[user.uid]?.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            {user.uid.slice(0, 10)}...
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{user.email || user.phone || '—'}</TableCell>
                        <TableCell>{formatDate(user.joinDate)}</TableCell>
                        <TableCell className="font-bold text-green-600">₹{(user.totalEarnings || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={user.totalSales > 0 ? "default" : "outline"}>
                            {user.totalSales || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={referralsMap[user.uid]?.length > 0 ? "secondary" : "outline"}>
                              {referralsMap[user.uid]?.length || 0}
                            </Badge>
                            {referralsMap[user.uid]?.length > 0 && (
                              <GitBranch className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserForTree(user.uid);
                              setActiveTab('chains');
                            }}
                          >
                            <TreePine className="h-4 w-4 mr-2" />
                            Tree View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Network View */}
          <TabsContent value="chains" className="mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Interactive Network Visualization
                  </CardTitle>
                  <CardDescription>
                    {selectedUserForTree ? (
                      <span>
                        Showing network for <span className="font-semibold">{allAffiliates[selectedUserForTree]?.name || selectedUserForTree.slice(0, 10)}</span>
                      </span>
                    ) : (
                      'Select a user to view their network'
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search user..."
                      value={searchChains}
                      onChange={(e) => setSearchChains(e.target.value)}
                      className="w-64 pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setTreeViewMode(treeViewMode === 'tree' ? 'radial' : 'tree')}
                    className='hidden'
                  >
                    {treeViewMode === 'tree' ? (
                      <>
                        <Network className="h-4 w-4 mr-2" />
                        Radial View
                      </>
                    ) : (
                      <>
                        <TreePine className="h-4 w-4 mr-2" />
                        Tree View
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* User selector grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {filteredChains.slice(0, 8).map((user: any) => (
                      <Card
                        key={user.uid}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${selectedUserForTree === user.uid ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedUserForTree(user.uid)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{user.name?.split(' ')[0] || 'User'}</p>
                              <p className="text-xs text-muted-foreground">{user.uid.slice(0, 8)}...</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">
                                L{user.level || 0}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {referralsMap[user.uid]?.length || 0} directs
                              </p>
                            </div>
                          </div>
                          {selectedUserForTree === user.uid && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex justify-between text-xs">
                                <span>Earnings:</span>
                                <span className="font-semibold text-green-600">₹{user.totalEarnings || 0}</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {/* Network Visualization */}
                  {selectedUserForTree && allAffiliates[selectedUserForTree] ? (
                    <NetworkGraph
                      user={allAffiliates[selectedUserForTree]}
                      allAffiliates={allAffiliates}
                      referralsMap={referralsMap}
                    />
                  ) : (
                    <div className="text-center py-20 border rounded-lg bg-gradient-to-b from-slate-50/50 to-white">
                      <TreePine className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <h3 className="text-lg font-medium mb-2">No User Selected</h3>
                      <p className="text-muted-foreground mb-6">Select a user from above or search to view their network</p>
                      <Button onClick={() => setActiveTab('users')}>
                        <Users className="h-4 w-4 mr-2" />
                        Browse All Users
                      </Button>
                    </div>
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
                  <CardTitle>Commission Flow</CardTitle>
                  <CardDescription>All commission transactions across the network</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
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
                      <TableHead>From Node</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>To Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Purchase</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center">
                            <TrendingUp className="h-12 w-12 opacity-20 mb-4" />
                            <p>No commission transactions found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCommissions.slice(0, 100).map((comm: any) => (
                        <TableRow key={comm.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <span className="font-medium">{comm.affiliateName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <GitCommit className="h-3 w-3" />
                              L{comm.level}
                            </Badge>
                          </TableCell>
                          <TableCell>{comm.customerName || '—'}</TableCell>
                          <TableCell className="max-w-xs truncate">{comm.productName || '—'}</TableCell>
                          <TableCell>₹{Number(comm.purchaseAmount || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-green-600">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3" />
                              ₹{Number(comm.commissionAmount || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(comm.timestamp)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Add Affiliate */}
          <TabsContent value="add" className="mt-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Manually Add Affiliate
                </CardTitle>
                <CardDescription>
                  Add a new user to an existing node&apos;s referral chain or as a new root
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="new-root"
                      checked={isNewRoot}
                      onCheckedChange={setIsNewRoot}
                    />
                    <Label htmlFor="new-root" className="text-sm font-medium">Add as new root node (Level 0)</Label>
                  </div>
                </div>
                {!isNewRoot && (
                  <Card className="border-0">
                    <CardHeader>
                      <CardTitle>Browse Network Tree</CardTitle>
                      <CardDescription>Select a root user to browse their subtree. Click on any node to select it as the referrer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={selectedRoot} onValueChange={setSelectedRoot}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select root to browse tree" />
                        </SelectTrigger>
                        <SelectContent>
                          {roots.map((rootUid) => {
                            const rootUser = allAffiliates[rootUid];
                            return (
                              <SelectItem key={rootUid} value={rootUid}>
                                {rootUser?.name || 'Unknown'} ({rootUid.slice(0, 8)}...)
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {selectedRoot && (
                        <div className="mt-4 border rounded-lg p-4 bg-slate-50 max-h-96 overflow-auto">
                          <TreeVisualization
                            user={allAffiliates[selectedRoot]}
                            allAffiliates={allAffiliates}
                            referralsMap={referralsMap}
                            level={0}
                            maxDepth={6}
                            onNodeClick={setSelectedReferrer}
                            selectedNode={selectedReferrer}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                {/* Selected Referrer Preview */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  {isNewRoot ? (
                    <p className="text-sm text-blue-700 font-medium">Adding as new root node (Level 0)</p>
                  ) : selectedReferrer ? (
                    <p className="text-sm text-blue-700 font-medium">
                      Adding under: {allAffiliates[selectedReferrer]?.name || selectedReferrer} (Level {allAffiliates[selectedReferrer]?.level || 0})
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a node from the tree above or add as new root</p>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">New Affiliate Name *</label>
                      <Input
                        placeholder="Enter full name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email *</label>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Phone *</label>
                      <Input
                        type="tel"
                        placeholder="Enter phone number"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Username *</label>
                      <Input
                        type="text"
                        placeholder="Choose a unique username (min 3 chars)"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Password *</label>
                      <Input
                        type="password"
                        placeholder="Create a password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Referral Code *</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="auto-ref"
                            name="ref-type"
                            checked={!manualReferral}
                            onChange={() => setManualReferral(false)}
                          />
                          <Label htmlFor="auto-ref" className="cursor-pointer text-sm">Auto-generate (unique)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="manual-ref"
                            name="ref-type"
                            checked={manualReferral}
                            onChange={() => setManualReferral(true)}
                          />
                          <Label htmlFor="manual-ref" className="cursor-pointer text-sm">Manual</Label>
                        </div>
                      </div>
                      {manualReferral && (
                        <Input
                          type="text"
                          placeholder="Enter custom referral code (min 6 chars, unique)"
                          value={customReferralCode}
                          onChange={(e) => setCustomReferralCode(e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <p>Join date will be set to today.</p>
                        <p>UID will be auto-generated as timestamp.</p>
                        {!isNewRoot && <p>The new user will be added as a direct referral to the selected node.</p>}
                        <p>Username, password, and referral code will be validated for uniqueness.</p>
                      </div>
                      <Button
                        onClick={handleAddAffiliate}
                        className="w-full"
                        disabled={!newName || !newEmail || !newPhone || !newUsername || !newPassword || !(isNewRoot || selectedReferrer)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add to Network
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}