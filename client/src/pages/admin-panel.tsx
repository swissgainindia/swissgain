// AdminPanel.tsx
'use client';

import { useState, useEffect } from "react";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Users, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Import your page components here
import AdminDashboard from "./admin/dashboard";
import AdminProducts from "./admin/products";
import AdminCategories from "./admin/categories";
import AdminOrders from "./admin/orders";
import AdminUsers from "./admin/users";
import AdminReferUser from "./admin/referuser";
import AdminPaymentRequest from "./admin/paymentRequest";
import AdminSupportCenter from "./admin/AdminSupportCenter";
import RoleManagement from "./admin/role";
import BannerManager from "./admin/BannerManager";
import AddUser from "./admin/AddUser";

// Import shared Firebase
import { database } from "@/lib/firebase";
import { ref, onValue, update, set } from "firebase/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoleUser {
  id: string;
  username: string;
  password: string;
  permissions: Record<string, boolean>;
  createdAt: string;
}

interface SuperAdminCredentials {
  username: string;
  password: string;
}

interface ChangeCredentialsData {
  currentPassword: string;
  newUsername: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
  const [superAdminCredentials, setSuperAdminCredentials] = useState<SuperAdminCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for change credentials modal
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeData, setChangeData] = useState<ChangeCredentialsData>({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  // Load super admin credentials from Firebase
  useEffect(() => {
    const superAdminRef = ref(database, "superadmin");
    const unsubscribe = onValue(superAdminRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSuperAdminCredentials({
          username: data.username || "",
          password: data.password || ""
        });
      } else {
        setSuperAdminCredentials(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error loading super admin credentials:", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Load all role-based users from Firebase
  useEffect(() => {
    const rolesRef = ref(database, "adminRoles");
    const unsubscribe = onValue(rolesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.entries(data).map(([id, value]: any) => ({
          id,
          ...value
        }));
        setRoleUsers(users as RoleUser[]);
      } else {
        setRoleUsers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Check for saved session
  useEffect(() => {
    const auth = localStorage.getItem("adminAuthenticated");
    const user = localStorage.getItem("adminUser");
    if (auth === "true" && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // Check if super admin credentials are loaded
    if (!superAdminCredentials) {
      setLoginError("System is loading. Please try again.");
      return;
    }

    // Super Admin Login
    if (loginData.username === superAdminCredentials.username && 
        loginData.password === superAdminCredentials.password) {
      const superUser = {
        username: superAdminCredentials.username,
        email: "admin@swissgain.com",
        role: "superadmin",
        permissions: {
          dashboard: true, products: true, categories: true, orders: true,
          users: true, referusers: true, paymentrequest: true,
          adminsupportcenter: true, role: true, banner: true
        }
      };
      setCurrentUser(superUser);
      setIsAuthenticated(true);
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminUser", JSON.stringify(superUser));
      return;
    }

    // Role-based Admin Login
    const matchedUser = roleUsers.find(
      u => u.username === loginData.username && u.password === loginData.password
    );

    if (matchedUser) {
      const userData = {
        username: matchedUser.username,
        email: `${matchedUser.username}@swissgain.com`,
        role: "admin",
        permissions: matchedUser.permissions
      };
      setCurrentUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminUser", JSON.stringify(userData));
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminUser");
    setLoginData({ username: "", password: "" });
  };

  // Handle change credentials
  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    setChangeSuccess("");
    
    // Validate inputs
    if (!changeData.currentPassword) {
      setChangeError("Current password is required");
      return;
    }
    
    if (!changeData.newUsername && !changeData.newPassword) {
      setChangeError("Please enter either new username or new password");
      return;
    }
    
    if (changeData.newPassword && changeData.newPassword !== changeData.confirmPassword) {
      setChangeError("New passwords do not match");
      return;
    }
    
    if (changeData.newPassword && changeData.newPassword.length < 6) {
      setChangeError("New password must be at least 6 characters");
      return;
    }
    
    setIsChanging(true);
    
    try {
      // Check current password
      if (currentUser?.role === "superadmin") {
        // For super admin
        if (changeData.currentPassword !== superAdminCredentials?.password) {
          setChangeError("Current password is incorrect");
          setIsChanging(false);
          return;
        }
        
        // Update super admin credentials
        const updates: any = {};
        
        if (changeData.newUsername) {
          updates.username = changeData.newUsername;
        }
        
        if (changeData.newPassword) {
          updates.password = changeData.newPassword;
        }
        
        if (Object.keys(updates).length > 0) {
          const superAdminRef = ref(database, "superadmin");
          await update(superAdminRef, updates);
          
          // Update local state
          setSuperAdminCredentials(prev => ({
            username: changeData.newUsername || prev?.username || "",
            password: changeData.newPassword || prev?.password || ""
          }));
          
          // Update current user session
          const updatedUser = {
            ...currentUser,
            username: changeData.newUsername || currentUser.username
          };
          setCurrentUser(updatedUser);
          localStorage.setItem("adminUser", JSON.stringify(updatedUser));
          
          setChangeSuccess("Credentials updated successfully!");
          
          // Reset form
          setChangeData({
            currentPassword: "",
            newUsername: "",
            newPassword: "",
            confirmPassword: ""
          });
          
          // Close modal after 2 seconds
          setTimeout(() => {
            setShowChangeModal(false);
          }, 2000);
        }
      } else {
        // For role-based admin
        const matchedUser = roleUsers.find(
          u => u.username === currentUser.username && u.password === changeData.currentPassword
        );
        
        if (!matchedUser) {
          setChangeError("Current password is incorrect");
          setIsChanging(false);
          return;
        }
        
        // Find the user ID
        const userToUpdate = roleUsers.find(u => u.username === currentUser.username);
        if (!userToUpdate) {
          setChangeError("User not found");
          setIsChanging(false);
          return;
        }
        
        // Update role-based admin credentials
        const updates: any = {};
        
        if (changeData.newUsername) {
          updates.username = changeData.newUsername;
        }
        
        if (changeData.newPassword) {
          updates.password = changeData.newPassword;
        }
        
        if (Object.keys(updates).length > 0) {
          const userRef = ref(database, `adminRoles/${userToUpdate.id}`);
          await update(userRef, updates);
          
          // Update local state
          const updatedUser = {
            ...currentUser,
            username: changeData.newUsername || currentUser.username
          };
          setCurrentUser(updatedUser);
          localStorage.setItem("adminUser", JSON.stringify(updatedUser));
          
          setChangeSuccess("Credentials updated successfully!");
          
          // Reset form
          setChangeData({
            currentPassword: "",
            newUsername: "",
            newPassword: "",
            confirmPassword: ""
          });
          
          // Close modal after 2 seconds
          setTimeout(() => {
            setShowChangeModal(false);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error updating credentials:", error);
      setChangeError("Failed to update credentials. Please try again.");
    } finally {
      setIsChanging(false);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: FolderTree },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "users", label: "Affiliate Users", icon: Users },
    { id: "referusers", label: "Refer User", icon: Users },
    { id: "paymentrequest", label: "Payment Request", icon: Users },
    { id: "adminsupportcenter", label: "Support Center", icon: Users },
    { id: "role", label: "Role Management", icon: Users },
    { id: "banner", label: "Banner Management", icon: Users },
     { id: "adduser", label: "Add User", icon: Users },
  ];

  const getAllowedMenu = () => {
    if (!currentUser) return [];
    if (currentUser.role === "superadmin") return menuItems;
    return menuItems.filter(item => currentUser.permissions?.[item.id]);
  };

  const allowedMenu = getAllowedMenu();

  const renderPage = () => {
    if (currentUser?.role !== "superadmin") {
      const hasAccess = currentUser.permissions?.[activeTab];
      if (!hasAccess && allowedMenu.length > 0) {
        setActiveTab(allowedMenu[0].id);
      }
    }

    switch (activeTab) {
      case "dashboard": return <AdminDashboard />;
      case "products": return <AdminProducts />;
      case "categories": return <AdminCategories />;
      case "orders": return <AdminOrders />;
      case "users": return <AdminUsers />;
      case "referusers": return <AdminReferUser />;
      case "paymentrequest": return <AdminPaymentRequest />;
      case "adminsupportcenter": return <AdminSupportCenter />;
      case "role": return <RoleManagement />;
      case "banner": return <BannerManager />;
      case "adduser": return <AddUser />;
      default: return <AdminDashboard />;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading admin system...</p>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">SwissGain Admin</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="text"
              placeholder="Username"
              value={loginData.username}
              onChange={e => setLoginData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-purple-300 outline-none"
              required
              disabled={!superAdminCredentials}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-purple-300 outline-none"
              required
              disabled={!superAdminCredentials}
            />
            {loginError && <p className="text-red-600 text-center">{loginError}</p>}
            {!superAdminCredentials && (
              <p className="text-yellow-600 text-center text-sm">
                System credentials not loaded. Please check Firebase configuration.
              </p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
              disabled={!superAdminCredentials}
            >
              {!superAdminCredentials ? "Loading..." : "Login"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Using Firebase authentication system</p>
          </div>
        </div>
      </div>
    );
  }

  if (allowedMenu.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">No Access</h1>
          <p className="mt-4 text-gray-700">Your account has no permissions.</p>
          <Button onClick={handleLogout} className="mt-6 bg-purple-600">Logout</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar with scrollbar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="p-6 border-b border-gray-800 flex-shrink-0">
            <h1 className="text-2xl font-bold">SwissGain Admin</h1>
            {currentUser?.role === "superadmin" && <span className="text-xs bg-yellow-500 px-2 py-1 rounded">SUPER ADMIN</span>}
          </div>
          
          {/* Scrollable Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 sidebar-scroll">
            {allowedMenu.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === item.id ? "bg-purple-600" : "hover:bg-gray-800"}`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Fixed Footer */}
          <div className="p-4 border-t border-gray-800 flex-shrink-0">
            <div 
              className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition"
              onClick={() => setShowChangeModal(true)}
            >
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{currentUser?.username}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.role}</p>
                <p className="text-xs text-purple-400 mt-1 truncate">Click to change credentials</p>
              </div>
            </div>
            <Button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
            <h2 className="text-2xl font-bold capitalize">{activeTab.replace(/([A-Z])/g, ' $1').trim()}</h2>
            <span className="text-gray-600">Welcome, <strong>{currentUser?.username}</strong></span>
          </header>
          <div className="p-8">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Change Credentials Modal */}
      <Dialog open={showChangeModal} onOpenChange={setShowChangeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Credentials</DialogTitle>
            <DialogDescription>
              Update your username or password. Leave fields empty if you don't want to change them.
            </DialogDescription>
          </DialogHeader>
          
          {changeSuccess ? (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{changeSuccess}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleChangeCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={changeData.currentPassword}
                  onChange={(e) => setChangeData({...changeData, currentPassword: e.target.value})}
                  placeholder="Enter your current password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newUsername">New Username (Optional)</Label>
                <Input
                  id="newUsername"
                  type="text"
                  value={changeData.newUsername}
                  onChange={(e) => setChangeData({...changeData, newUsername: e.target.value})}
                  placeholder="Enter new username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password (Optional)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={changeData.newPassword}
                  onChange={(e) => setChangeData({...changeData, newPassword: e.target.value})}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={changeData.confirmPassword}
                  onChange={(e) => setChangeData({...changeData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  disabled={!changeData.newPassword}
                />
              </div>
              
              {changeError && (
                <Alert variant="destructive">
                  <AlertDescription>{changeError}</AlertDescription>
                </Alert>
              )}
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowChangeModal(false);
                    setChangeData({
                      currentPassword: "",
                      newUsername: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                    setChangeError("");
                    setChangeSuccess("");
                  }}
                  disabled={isChanging}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={isChanging}
                >
                  {isChanging ? "Updating..." : "Update Credentials"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}