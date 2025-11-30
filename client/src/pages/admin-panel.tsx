// AdminPanel.tsx
'use client';

import { useState, useEffect } from "react";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Firebase Realtime Database - Direct inside file
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, onValue } from "firebase/database";

// const firebaseConfig = {
//   apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
//   authDomain: "swissgain-a2589.firebaseapp.com",
//   databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
//   projectId: "swissgain-a2589",
//   storageBucket: "swissgain-a2589.appspot.com",
//   messagingSenderId: "1062016445247",
//   appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a"
// };

// const app = initializeApp(firebaseConfig);
// const database = getDatabase(app);


// ... others

// Import shared Firebase
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

interface RoleUser {
  id: string;
  username: string;
  password: string;
  permissions: Record<string, boolean>;
  createdAt: string;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);

  const SUPER_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "admin";
  const SUPER_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

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

    // Super Admin Login
    if (loginData.username === SUPER_USERNAME && loginData.password === SUPER_PASSWORD) {
      const superUser = {
        username: SUPER_USERNAME,
        email: "admin@swissgain.com",
        role: "superadmin",
        permissions: {
          dashboard: true, products: true, categories: true, orders: true,
          users: true, referusers: true, paymentrequest: true,
          adminsupportcenter: true, role: true
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
      default: return <AdminDashboard />;
    }
  };

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
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-purple-300 outline-none"
              required
            />
            {loginError && <p className="text-red-600 text-center">{loginError}</p>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg">
              Login
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Super Admin: <code>{SUPER_USERNAME} / {SUPER_PASSWORD}</code></p>
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">SwissGain Admin</h1>
          {currentUser?.role === "superadmin" && <span className="text-xs bg-yellow-500 px-2 py-1 rounded">SUPER ADMIN</span>}
        </div>
        <nav className="p-4 space-y-1">
          {allowedMenu.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === item.id ? "bg-purple-600" : "hover:bg-gray-800"}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            {/* <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
              {currentUser?.username[0].toUpperCase()}
            </div> */}
            <div>
              <p className="font-medium">{currentUser?.username}</p>
              <p className="text-xs text-gray-400">{currentUser?.role}</p>
            </div>

             <Button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 ">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
          </div>
         
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
  );
}