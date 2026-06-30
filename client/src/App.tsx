import { useEffect, useRef, Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import WelcomeCouponModal from "@/components/layout/welcome-coupon-modal";
import FomoTicker from "@/components/layout/fomo-ticker";
import AiStylistChatbot from "@/components/layout/ai-stylist-chatbot";

const Home = lazy(() => import("@/pages/home"));
const Products = lazy(() => import("@/pages/products"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Affiliate = lazy(() => import("@/pages/affiliate"));
const ReferEarn = lazy(() => import("@/pages/refer-earn"));
const Cart = lazy(() => import("@/pages/cart"));
const Contact = lazy(() => import("@/pages/Contact"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AdminPanel = lazy(() => import("@/pages/admin-panel"));
const AffiliateProduct = lazy(() => import("./pages/admin/TestProgramProduct"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundAndCancellation = lazy(() => import("./pages/RefundAndCancellation"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const AffiliateSales = lazy(() => import("./pages/AffilliateSales"));
const TestReferralEarnings = lazy(() => import("./pages/admin/TestReferralEarnings"));
const ThankYouPage = lazy(() => import("./pages/thankyou"));
const Order = lazy(() => import("./pages/Order"));
const Reels = lazy(() => import("@/pages/reels"));
const Warranty = lazy(() => import("@/pages/warranty"));
const SeoLanding = lazy(() => import("@/pages/seo-landing"));
const OrderSuccess = lazy(() => import("@/pages/order-success"));

function Router() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <Switch>
        <Route path="/testreferralearnings" component={TestReferralEarnings} />
        <Route path="/affiliatesales" component={AffiliateSales} />
        <Route path="/refundandcancellation" component={RefundAndCancellation} />
        <Route path="/termsandconditions" component={TermsAndConditions} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/AffiliateProduct" component={AffiliateProduct} />
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/buy/:productSlug-in-:citySlug" component={SeoLanding} />
        
        <Route path="/affiliate" component={Affiliate} />
        <Route path="/thank-you" component={ThankYouPage} />
        <Route path="/order" component={Order} />
        <Route path="/refer-earn" component={ReferEarn} />
        <Route path="/cart" component={Cart} />
        <Route path="/contact" component={Contact} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/reels" component={Reels} />
        <Route path="/warranty" component={Warranty} />
        <Route path="/order-success" component={OrderSuccess} />
        {/* Direct admin panel route */}
        <Route path="/admin-panel" component={AdminPanel} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>

    
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin-");
  const isReelsPage = location === "/reels";
  const isFirstMount = useRef(true);
  const isRestoring = useRef(false);

  // Capture referral ID from URL query params and store it in localStorage and a cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refId = params.get('ref') || params.get('affiliate');
      if (refId) {
        localStorage.setItem('swissgain_referral_id', refId);
        document.cookie = `swissgain_referral_id=${refId}; path=/; max-age=2592000`; // 30 days
        console.log('Stored referral ID:', refId);
      }
    }
  }, [location]);

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
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            {/* Show header/footer only on non-admin/non-reels routes */}
            {!isAdminRoute && !isReelsPage && <Header />}
            
            <main className="flex-1">
              <Router />
            </main>

            {!isAdminRoute && !isReelsPage && <Footer />}

            {!isAdminRoute && (
              <>
                <WelcomeCouponModal />
                <FomoTicker />
                <AiStylistChatbot />
              </>
            )}
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
