'use client';

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useAuth,
  findUserByCredentials,
} from '@/lib/auth';
import axios from "axios";

/* ✅ IMAGES: Import both your default and white logos here */
import Logo from '@/images/logo.png'; 
import WhiteLogo from '@/images/LOGO_white.png'; 

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Affiliate Program', href: '/affiliate' },
  { name: 'Refer & Earn', href: '/refer-earn' },
];

export default function NecklaceEcommerceHeader() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  /* ✅ DYNAMIC THEME LOGIC */
  const isHomePage = location === '/';

  // 1. Determine Text Color
  const textColorClass = isHomePage 
    ? 'text-white hover:text-gray-200' 
    : 'text-amber-800 hover:text-amber-600';

  // 2. Determine Which Logo to Use
  const currentLogo = isHomePage ? WhiteLogo : Logo;

  // 3. ✅ Determine Logo Size (Bigger on Home Page)
  const logoSize = isHomePage ? 125 : 120;

  const {
    isLoggedIn,
    userData,
    isAffiliate,
    login,
    logout,
  } = useAuth();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  /* Fetch products */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("/api/products");
        setAllProducts(res.data);
      } catch (err) {
        console.error("Search Fetch Error:", err);
      }
    };
    fetchProducts();
  }, []);

  /* Filter suggestions */
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const suggestions = allProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(suggestions.slice(0, 6));
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchQuery, allProducts]);

  /* Dashboard click */
  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn && isAffiliate) {
      setLocation('/dashboard');
    } else if (isAffiliate) {
      setShowLoginModal(true);
    } else {
      setLocation('/affiliate');
    }
  };

  /* Login input handler */
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginCreds((prev) => ({ ...prev, [name]: value }));
  };

  /* Login function */
  const handleLogin = async () => {
    if (!loginCreds.username || !loginCreds.password) {
      toast({ title: 'Error', description: 'Both username and password are required.', variant: 'destructive' });
      return;
    }
    setLoginLoading(true);
    try {
      const user = await findUserByCredentials(loginCreds.username, loginCreds.password);
      if (!user) {
        toast({
          title: 'Account Not Found',
          description: 'No affiliate account found with these credentials.',
          variant: 'destructive'
        });
        setLoginLoading(false);
        return;
      }
      login(user);
      setShowLoginModal(false);
      setLoginCreds({ username: '', password: '' });
      toast({ title: 'Success!', description: 'Logged in successfully. Redirecting to dashboard...' });
      setTimeout(() => setLocation('/dashboard'), 1500);

    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Login Failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsAccountOpen(false);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    setLocation('/');
  };

  /* Search Handlers */
  const handleSearchFocus = () => { setIsSearchFocused(true); setShowSearchSuggestions(true); };
  const handleSearchBlur = () => { setIsSearchFocused(false); setShowSearchSuggestions(false); };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = allProducts.find(p => p.name.toLowerCase() === searchQuery.toLowerCase());
    if (match) {
      setLocation(`/product/${match._id}`);
    } else {
      setLocation(`/products?search=${searchQuery}`);
    }
  };

  const handleSuggestionClick = (product: any) => {
    setSearchQuery(product.name);
    setShowSearchSuggestions(false);
    setLocation(`/product/${product._id}`);
  };

  return (
    <header className="bg-transparent z-10 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo Section - DYNAMIC LOGO & SIZE */}
          <div className="flex items-center shrink-0">
            <img 
              src={currentLogo} 
              alt="Swissgain" 
              width={logoSize} 
              height={logoSize} 
              className="object-contain transition-all duration-300" 
            />
          </div>

          {/* Navigation - DYNAMIC TEXT COLOR */}
          <nav className="hidden md:flex flex-wrap justify-center space-x-8 mx-auto">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={item.name === 'Dashboard' ? handleDashboardClick : undefined}
                className={`${textColorClass} font-medium text-lg transition-colors ${location === item.href ? 'underline decoration-2 underline-offset-4' : ''}`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Search - HIDDEN */}
          <div className="hidden flex-1 max-w-xl mx-6 relative"> 
             {/* Search Code preserved but hidden */}
          </div>

          {/* Right Icons - DYNAMIC TEXT COLOR */}
          <div className="flex items-center space-x-8 relative shrink-0">
            {/* Account */}
            <div className="relative">
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className={`${textColorClass} flex flex-col items-center transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm mt-1 hidden sm:block font-medium">
                  {isLoggedIn ? (userData?.name || 'Account') : 'Account'}
                </span>
              </button>

              {isAccountOpen && (
                <div className="absolute top-full right-0 mt-3 w-48 bg-white shadow-xl rounded-md border border-gray-100 z-50">
                  {isLoggedIn ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userData?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
                        {isAffiliate && (
                          <Badge variant="secondary" className="mt-1 text-xs">Affiliate</Badge>
                        )}
                      </div>
                      <a href="#" onClick={handleDashboardClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Dashboard</a>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Logout</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          setShowLoginModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Login
                      </button>
                      <Link href="/affiliate" onClick={() => setIsAccountOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link href="/cart" className={`${textColorClass} flex flex-col items-center transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-sm mt-1 hidden sm:block font-medium">Cart</span>
            </Link>
          </div>
        </div>
      </div>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Login to Dashboard</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="login-username">Username *</Label>
                <Input
                  id="login-username"
                  name="username"
                  type="text"
                  placeholder="your username"
                  value={loginCreds.username}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password *</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="your password"
                  value={loginCreds.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginCreds({ username: '', password: '' });
                }}
                disabled={loginLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleLogin} disabled={loginLoading}>
                {loginLoading ? 'Checking...' : 'Login'}
              </Button>
            </div>
            <p className="text-xs text-center mt-4 text-gray-500">
              Not registered?{" "}
              <Link href="/affiliate" onClick={() => setShowLoginModal(false)} className="text-blue-600 font-semibold hover:underline">
                Join now
              </Link>
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

function Badge({ variant = 'secondary', className = '', children }: { variant?: 'secondary' | 'default', className?: string, children: React.ReactNode }) {
  const baseClasses = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const variantClasses = {
    secondary: "bg-gray-100 text-gray-800",
    default: "bg-blue-100 text-blue-800"
  };
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}