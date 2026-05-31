'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, FileText, Printer, Search, ArrowLeft, Award, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import axios from 'axios';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  _id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  items: OrderItem[];
}

export default function WarrantyPortal() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast({
        title: "Order ID Required",
        description: "Please enter a valid Order ID or Order Number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setOrder(null);

    try {
      const response = await axios.get(`/api/warranty/${orderId.trim()}`);
      setOrder(response.data);
      toast({
        title: "Warranty Verified",
        description: "Your official jewelry care certificate is ready.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || "Could not verify order. Please check the Order ID and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      {/* Print-specific style sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-3xl w-full space-y-8 no-print">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-amber-800 hover:text-amber-600 gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure Guarantee
          </div>
        </div>

        {/* Portal Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 mb-4 animate-pulse">
            <Award className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Digital Warranty Portal
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Verify your genuine SwissGain jewelry purchase and download your gold-standard shine certificate.
          </p>
        </div>

        {/* Verification Card */}
        <Card className="border border-border/60 bg-card/80 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Activate & View Guarantee</CardTitle>
            <CardDescription>
              Enter the unique Order ID or Order Number provided at purchase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="e.g., rzp_live_xyz or orderNumber"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="pl-10 text-sm sm:text-base bg-background/50 focus-visible:ring-amber-500"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="gradient-gold text-accent-foreground font-semibold py-2.5 px-6 shadow-md transition-all duration-200"
              >
                {loading ? 'Verifying...' : 'Verify Purchase'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Beautiful Gold-Themed Certificate (Reactive Render) */}
      {order && (
        <div className="max-w-3xl w-full mt-8 animate-in fade-in zoom-in-95 duration-300">
          {/* Certificate Container */}
          <div 
            id="printable-certificate"
            className="relative bg-[#faf7f2] border-[12px] border-double border-amber-600 rounded-3xl p-6 sm:p-12 md:p-16 shadow-2xl text-center overflow-hidden"
          >
            {/* Elegant watermark / gold patterns background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Corner Ornamental Accents */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-600/30"></div>
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-600/30"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-600/30"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-600/30"></div>

            {/* Top Badge */}
            <div className="flex justify-center mb-6">
              <div className="relative flex items-center justify-center h-20 w-20 rounded-full border-4 border-amber-500 bg-gradient-to-br from-amber-600 to-yellow-500 shadow-lg text-white">
                <Sparkles className="h-10 w-10 animate-pulse text-amber-100" />
                <div className="absolute -inset-1 rounded-full border border-yellow-400 opacity-50"></div>
              </div>
            </div>

            {/* Header Text */}
            <p className="text-amber-800 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-2">
              Certificate of Authenticity
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-amber-950 leading-tight">
              SwissGain India Official Jewelry Care Certificate & 6-Month Shine Guarantee
            </h2>

            {/* Certificate Body Divider */}
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto my-6 sm:my-8"></div>

            {/* Customer & Date */}
            <p className="text-xs sm:text-sm text-amber-900/60 uppercase tracking-widest mb-2">
              This certifies that
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-900 italic underline decoration-amber-600/40 underline-offset-8 decoration-1 mb-4">
              {order.customerName}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              is the registered owner of authenticated genuine SwissGain 1-gram gold-plated jewelry. Manufactured to the highest standards of craftsmanship, this gold overlay is warranted against fading or loss of shine for a period of six months from date of purchase.
            </p>

            {/* Order Details Details */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-8 bg-amber-500/5 p-4 rounded-xl border border-amber-600/10 text-left text-xs sm:text-sm">
              <div>
                <p className="text-amber-950/50 font-medium">Order Number</p>
                <p className="font-semibold text-amber-900 font-mono break-all">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-amber-950/50 font-medium">Registration Date</p>
                <p className="font-semibold text-amber-900">
                  {new Date(order.orderDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Specific Items Purchased */}
            <div className="max-w-lg mx-auto mb-8 text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-3 border-b border-amber-600/15 pb-1 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Registered Products Under Guarantee
              </h3>
              <ul className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center text-xs text-amber-950/80 bg-white/40 p-2 rounded border border-amber-500/5">
                    <span className="font-semibold truncate mr-2">{item.productName}</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-800 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                      Qty: {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stamp & Signatures */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 max-w-xl mx-auto pt-6 border-t border-amber-600/10">
              <div className="text-center sm:text-left">
                <p className="text-[10px] text-amber-900/60 uppercase tracking-widest">Seal of Authentication</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-amber-600 text-white font-extrabold px-2.5 py-1 rounded tracking-widest shadow-sm">SWISSGAIN CERTIFIED</span>
                </div>
              </div>
              <div className="text-center sm:text-right font-serif">
                <p className="text-[11px] text-amber-950 italic border-b border-amber-600/30 pb-1 px-4">SwissGain India Quality Assurance</p>
                <p className="text-[9px] text-amber-900/50 uppercase tracking-wider mt-1">Official Authorized Signatory</p>
              </div>
            </div>
          </div>

          {/* Action buttons (Hidden during Print) */}
          <div className="no-print flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <Button 
              onClick={handlePrint} 
              className="gradient-gold text-accent-foreground font-semibold flex items-center gap-2 py-2.5 px-6 shadow-md transition-all duration-200"
            >
              <Printer className="h-4 w-4" /> Print Certificate
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setOrder(null);
                setOrderId('');
              }}
              className="border-amber-600/40 text-amber-900 hover:bg-amber-500/5"
            >
              Verify Another Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
