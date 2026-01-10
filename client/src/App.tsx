import { Switch, Route } from "wouter";
import { SpeedInsights } from "@vercel/speed-insights/react";
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
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
// Remove AdminLogin import since we bypass login
import AdminPanel from "@/pages/admin-panel";
import AffiliateProduct from "./pages/admin/TestProgramProduct";
// import TermsAndConditions from "./pages/termsandconditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundAndCancellation from "./pages/RefundAndCancellation";
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
      <Route path="/dashboard" component={Dashboard} />
      {/* Direct admin panel route */}
      <Route path="/admin-panel" component={AdminPanel} />
      
      <Route component={NotFound} />
    </Switch>

    
  );
}

function App() {
  const { pathname } = window.location;
  const isAdminRoute = pathname.startsWith("/admin-");

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
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
