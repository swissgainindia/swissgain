import { useEffect, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import Products from "@/pages/products";

import ProductDetail from "@/pages/product-detail";
import Affiliate from "@/pages/affiliate";
import ReferEarn from "@/pages/refer-earn";
import Cart from "@/pages/cart";
import Contact from "@/pages/Contact";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
// Remove AdminLogin import since we bypass login
import AdminPanel from "@/pages/admin-panel";
import AffiliateProduct from "./pages/admin/TestProgramProduct";
// import TermsAndConditions from "./pages/termsandconditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundAndCancellation from "./pages/RefundAndCancellation";
import TermsAndConditions from "./pages/TermsAndConditions";
import AffiliateSales from "./pages/AffilliateSales";
import TestReferralEarnings from "./pages/admin/TestReferralEarnings";
import ThankYouPage from "./pages/thankyou";
import Order from "./pages/Order";

function Router() {
  return (
    <Switch>
      <Route path="/testreferralearnings" component={TestReferralEarnings} />
      <Route path="/affiliatesales" component={AffiliateSales} />
      <Route path="/refundandcancellation" component={RefundAndCancellation} />
      <Route path="/termsandconditions" component={TermsAndConditions} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      {/* <Route path="/termsandconditions" component={TermsAndConditions} /> */}
      <Route path="/AffiliateProduct" component={AffiliateProduct} />
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      
      <Route path="/affiliate" component={Affiliate} />
       <Route path="/thank-you" component={ThankYouPage} />
       <Route path="/order" component={Order} />
      <Route path="/refer-earn" component={ReferEarn} />
      <Route path="/cart" component={Cart} />
      <Route path="/contact" component={Contact} />
      <Route path="/dashboard" component={Dashboard} />
      {/* Direct admin panel route */}
      <Route path="/admin-panel" component={AdminPanel} />
      
      <Route component={NotFound} />
    </Switch>

    
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin-");
  const isFirstMount = useRef(true);
  const isRestoring = useRef(false);

  // 1. Scroll listener to record scroll positions
  useEffect(() => {
    const handleScroll = () => {
      if (!isRestoring.current) {
        sessionStorage.setItem("prevScrollPosition", window.scrollY.toString());
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Intelligent scroll restoration on page reload vs navigation
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;

      // Handle Hard Refresh Scroll Restoration
      const savedScroll = sessionStorage.getItem("prevScrollPosition");
      const targetScroll = savedScroll ? parseInt(savedScroll, 10) : 0;

      if (targetScroll > 0) {
        isRestoring.current = true;
        if ("scrollRestoration" in window.history) {
          window.history.scrollRestoration = "manual";
        }

        let attempts = 0;
        const restoreScroll = () => {
          const currentHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
          const viewportHeight = window.innerHeight;

          // Wait until the layout expands enough to safely scroll to the target spot
          if (currentHeight >= targetScroll + viewportHeight || attempts > 30) {
            window.scrollTo(0, targetScroll);
            setTimeout(() => {
              isRestoring.current = false;
              if ("scrollRestoration" in window.history) {
                window.history.scrollRestoration = "auto";
              }
            }, 100);
            return true;
          }
          return false;
        };

        // Try immediately or poll until height stabilizes
        if (!restoreScroll()) {
          const interval = setInterval(() => {
            attempts++;
            if (restoreScroll() || attempts > 30) {
              clearInterval(interval);
            }
          }, 100);
        }
      }
    } else {
      // Handle Active Route Navigation
      window.scrollTo(0, 0);
      sessionStorage.setItem("prevScrollPosition", "0");
    }
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          {/* Show header/footer only on non-admin routes */}
          {!isAdminRoute && <Header />}
          
          <main className="flex-1">
            <Router />
          </main>

          {!isAdminRoute && <Footer />}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
