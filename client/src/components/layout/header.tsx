'use client';

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/images/logo.png';
import {
  useAuth,
  findUserByCredentials,
} from '@/lib/auth';
import axios from "axios";

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Affiliate Program', href: '/affiliate' },
  { name: 'Refer & Earn', href: '/refer-earn' },
];

export default function NecklaceEcommerceHeader() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const {
    isLoggedIn,
    userData,
    isAffiliate,
    login,
    logout,
  } = useAuth();

  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ email: '', phone: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const promoTexts = [
    "Free Shipping on Orders Over Rs 50",
    "New Collection Just Arrived - Shop Now!",
    "Refer a Friend & Get 20% Off Your Next Order"
  ];

  /* ⭐ Fetch all products for search */
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

  /* ⭐ Filter suggestions live */
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

  /* Promo rotation */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  /* ⭐ FIXED — Login input handler */
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginCreds((prev) => ({ ...prev, [name]: value }));
  };

  /* Login function */
  const handleLogin = async () => {
    if (!loginCreds.email || !loginCreds.phone) {
      toast({ title: 'Error', description: 'Both email and phone are required.', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginCreds.email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    if (loginCreds.phone.length < 10) {
      toast({ title: 'Invalid Phone', description: 'Please enter a valid phone number.', variant: 'destructive' });
      return;
    }

    setLoginLoading(true);
    try {
      const user = await findUserByCredentials(loginCreds.email, loginCreds.phone);
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
      setLoginCreds({ email: '', phone: '' });
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

  /* Search focus + blur */
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowSearchSuggestions(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    setShowSearchSuggestions(false);
  };

  /* ⭐ Enter key search logic */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const match = allProducts.find(
      p => p.name.toLowerCase() === searchQuery.toLowerCase()
    );

    if (match) {
      setLocation(`/product/${match._id}`);
    } else {
      setLocation(`/products?search=${searchQuery}`);
    }
  };

  /* ⭐ Suggestion click → open product page */
  const handleSuggestionClick = (product: any) => {
    setSearchQuery(product.name);
    setShowSearchSuggestions(false);
    setLocation(`/product/${product._id}`);
  };

  return (
    <header className="bg-white shadow-md">
      {/* Promo Bar */}
      <div className="bg-amber-900 text-white py-2 overflow-hidden relative h-10 flex items-center justify-center">
        <div className="text-center transition-opacity duration-500 absolute" key={currentPromoIndex}>
          {promoTexts[currentPromoIndex]}
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={Logo} alt="Swissgain" width={80} height={80} className="object-contain" />
          </div>

          {/* Search */}
          <div className="flex-1 max-w-2xl mx-6 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className={`flex items-center border rounded-full overflow-hidden ${isSearchFocused ? 'border-gray-500 shadow' : 'border-gray-300'}`}>
                <input
                  type="text"
                  placeholder="Search..."
                  className="py-2 px-4 w-full focus:outline-none placeholder:text-gray-400 placeholder:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />
                <button type="submit" className="text-red-800 py-2 px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Search Suggestions */}
            {showSearchSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 border border-amber-100">
                <ul>
                  {filteredSuggestions.map((p: any) => (
                    <li
                      key={p._id}
                      className="px-4 py-2 hover:bg-amber-50 cursor-pointer"
                      onMouseDown={() => handleSuggestionClick(p)}
                    >
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-6 relative">
            {/* Account */}
            <div className="relative">
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="text-amber-800 hover:text-amber-600 flex flex-col items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs mt-1 hidden sm:block">
                  {isLoggedIn ? (userData?.name || 'Account') : 'Account'}
                </span>
              </button>

              {isAccountOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-amber-100 z-20">
                  {isLoggedIn ? (
                    <>
                      <div className="px-4 py-2 border-b border-amber-100">
                        <p className="text-sm font-medium text-amber-900">{userData?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
                        {isAffiliate && (
                          <Badge variant="secondary" className="mt-1 text-xs">Affiliate</Badge>
                        )}
                      </div>
                      <a href="#" onClick={handleDashboardClick} className="block px-4 py-2 text-sm text-amber-800 hover:bg-amber-50">Dashboard</a>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-amber-800 hover:bg-amber-50">Logout</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          setShowLoginModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-amber-800 hover:bg-amber-50"
                      >
                        Login
                      </button>
                      <Link href="/affiliate" onClick={() => setIsAccountOpen(false)} className="block px-4 py-2 text-sm text-amber-800 hover:bg-amber-50">
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link href="/cart" className="text-amber-800 hover:text-amber-600 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-xs mt-1 hidden sm:block">Cart</span>
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap justify-center mt-4 space-x-4 md:space-x-8">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={item.name === 'Dashboard' ? handleDashboardClick : undefined}
              className={`text-amber-800 hover:text-amber-600 font-medium py-1 ${location === item.href ? 'underline' : ''}`}
            >
              {item.name}
            </a>
          ))}
        </nav>
      </div>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Login to Dashboard</h3>
            <div className="space-y-3">

              <div>
                <Label htmlFor="login-email">Email *</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginCreds.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="login-phone">Phone *</Label>
                <Input
                  id="login-phone"
                  name="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={loginCreds.phone}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginCreds({ email: '', phone: '' });
                }}
                disabled={loginLoading}
              >
                Cancel
              </Button>

              <Button onClick={handleLogin} disabled={loginLoading}>
                {loginLoading ? 'Checking...' : 'Login'}
              </Button>
            </div>

            <p className="text-xs text-center mt-3 text-muted-foreground">
              Not registered?{" "}
              <Link href="/affiliate" onClick={() => setShowLoginModal(false)} className="text-primary underline">
                Join now
              </Link>
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

/* Tiny Badge used only in header */
function Badge({ variant = 'secondary', className = '', children }: { variant?: 'secondary' | 'default', className?: string, children: React.ReactNode }) {
  const baseClasses = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
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
