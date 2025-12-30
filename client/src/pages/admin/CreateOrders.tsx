'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { ref, get, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import axios from 'axios';
import { Package, User, Users, Search, CheckCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
}

interface Affiliate {
  uid: string;
  name: string;
  phone: string;
  email: string;
  referralCode: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CreateOrders() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'prepaid'>('cod');

  // Purchase type: guest or existing affiliate
 const [purchaseType, setPurchaseType] = useState<string>('');

  const [selectedBuyer, setSelectedBuyer] = useState<Affiliate | null>(null);
  const [openBuyerPopover, setOpenBuyerPopover] = useState(false);

  // Referrer (who referred this customer)
  const [referrerAffiliateId, setReferrerAffiliateId] = useState<string>('');


  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        const formatted = res.data.map((p: any) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          images: Array.isArray(p.images) ? p.images : [p.image || '/placeholder.png'],
          category: p.category,
        }));
        setProducts(formatted);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
      }
    };
    fetchProducts();
  }, [toast]);

  // Fetch affiliates
  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const affiliatesRef = ref(database, 'affiliates');
        const snapshot = await get(affiliatesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list: Affiliate[] = Object.keys(data).map(uid => ({
            uid,
            name: data[uid].name || 'Unknown',
            phone: data[uid].phone || '',
            email: data[uid].email || '',
            referralCode: data[uid].referralCode || '',
            address: data[uid].address || '',
            city: data[uid].city || '',
            state: data[uid].state || '',
            pincode: data[uid].pincode || '',
          }));
          setAffiliates(list);
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load affiliates', variant: 'destructive' });
      }
    };
    fetchAffiliates();
  }, [toast]);

  // Auto-fill customer info when affiliate is selected
  useEffect(() => {
    if (selectedBuyer && purchaseType === 'affiliate') {
      setCustomerInfo({
        name: selectedBuyer.name,
        email: selectedBuyer.email,
        phone: selectedBuyer.phone,
        address: selectedBuyer.address,
        city: selectedBuyer.city,
        state: selectedBuyer.state,
        pincode: selectedBuyer.pincode,
      });
   } else if (!purchaseType) {
  setCustomerInfo({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' });
}
  }, [selectedBuyer, purchaseType]);

  const selectedProduct = products.find(p => p._id === selectedProductId);
  const totalAmount = selectedProduct ? selectedProduct.price * quantity : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const generateGuestId = () => `guest_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const saveOrderToFirebase = async (orderData: any): Promise<string> => {
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    const orderId = newOrderRef.key!;

    await set(newOrderRef, {
      ...orderData,
      id: orderId,
      uniqueOrderId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      commissionProcessed: false,
      creditedUplines: {},
      createdBy: 'admin_manual',
    });

    return orderId;
  };

  const creditReferralBonus = async (affiliateId: string, orderId: string, amount: number) => {
    const commission = Math.round(amount * 0.10) + 100;
    const walletRef = ref(database, `wallets/${affiliateId}`);
    const transactionRef = push(ref(database, `transactions/${affiliateId}`));

    const snap = await get(walletRef);
    const balance = snap.exists() ? (snap.val().balance || 0) : 0;
    const newBalance = balance + commission;

    await set(walletRef, { balance: newBalance, lastUpdated: new Date().toISOString() });
    await set(transactionRef, {
      amount: commission,
      type: 'credit',
      description: `Manual Order: 10% + ₹100 bonus from ${customerInfo.name}'s purchase`,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
      orderId,
      status: 'completed',
    });

    toast({ description: `₹${commission} credited to referrer ${affiliateId}` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast({ title: 'Error', description: 'Please select a product', variant: 'destructive' });
      return;
    }

    const required = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    if (required.some(f => !customerInfo[f as keyof typeof customerInfo])) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (purchaseType === 'affiliate' && !selectedBuyer) {
      toast({ title: 'Error', description: 'Please select an affiliate', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const finalCustomerId = purchaseType === 'affiliate' && selectedBuyer ? selectedBuyer.uid : generateGuestId();

      // CRITICAL FIX: Never include undefined values
      const orderData: any = {
        productId: selectedProduct._id,
        customerId: finalCustomerId,
        originalCustomerId: finalCustomerId,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        quantity,
        totalAmount,
        customerInfo,
        images: selectedProduct.images,
        category: selectedProduct.category,
        status: paymentMethod === 'prepaid' ? 'confirmed' : 'pending',
        paymentMethod: paymentMethod === 'prepaid' ? 'razorpay' : 'cod',
        paymentStatus: paymentMethod === 'prepaid' ? 'paid' : 'pending',
        createdAt: new Date().toISOString(),
      };

      // Only add affiliateId if referrer exists and is not empty
      if (referrerAffiliateId.trim()) {
        orderData.affiliateId = referrerAffiliateId.trim();
      }

      const orderId = await saveOrderToFirebase(orderData);

      // Credit referrer bonus if provided
      if (referrerAffiliateId.trim()) {
        const refSnap = await get(ref(database, `affiliates/${referrerAffiliateId.trim()}`));
        if (refSnap.exists()) {
          await creditReferralBonus(referrerAffiliateId.trim(), orderId, totalAmount);
        } else {
          toast({ description: 'Referrer affiliate not found', variant: 'destructive' });
        }
      }

      toast({
        title: 'Success!',
        description: `Order #${orderId} created successfully for ₹${totalAmount.toLocaleString()}`,
      });

      // Reset form
      setSelectedProductId('');
      setQuantity(1);
      setPaymentMethod('cod');
     setPurchaseType('');

      setSelectedBuyer(null);
      setReferrerAffiliateId('');
      setCustomerInfo({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' });
    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast({
        title: 'Failed',
        description: error.message || 'Could not create order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 py-12">
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Package className="h-8 w-8" />
            Manually Create Order
          </CardTitle>
          <CardDescription>For phone, WhatsApp, or support orders</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Purchase By Section */}
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
              <Label className="text-xl font-bold flex items-center gap-3 mb-4">
                <Users className="h-6 w-6" />
                This Order is For
              </Label>
         <Select
  value={purchaseType}
  onValueChange={(v: string) => {
    setPurchaseType(v);
    setSelectedBuyer(null);
  }}
>
  <SelectTrigger className="text-lg">
    <SelectValue placeholder="Select Customer" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="affiliate">
      Existing Affiliate (Registered)
    </SelectItem>
  </SelectContent>
</Select>



              {purchaseType === 'affiliate' && (
                <div className="mt-6">
                  <Label className="text-lg">Select Affiliate Buyer</Label>
                  <Popover open={openBuyerPopover} onOpenChange={setOpenBuyerPopover}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between text-left font-normal">
                        {selectedBuyer ? `${selectedBuyer.name} (${selectedBuyer.phone})` : "Search affiliates..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search by name, phone, email, code..." />
                        <CommandEmpty>No affiliate found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {affiliates.map((aff) => (
                            <CommandItem
                              key={aff.uid}
                              onSelect={() => {
                                setSelectedBuyer(aff);
                                setOpenBuyerPopover(false);
                              }}
                            >
                              <CheckCircle className={cn("mr-2 h-4 w-4", selectedBuyer?.uid === aff.uid ? "opacity-100" : "opacity-0")} />
                              <div>
                                <div className="font-medium">{aff.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {aff.phone} • {aff.email} • Code: {aff.referralCode}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div className="space-y-3">
              <Label>Product <span className="text-red-500">*</span></Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} — ₹{p.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                      <img src={selectedProduct.images[0]} alt="" className="w-24 h-24 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-semibold text-lg">{selectedProduct.name}</h4>
                        <p className="text-muted-foreground">₹{selectedProduct.price.toLocaleString()} × {quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(q => Math.max(1, q-1))}>-</Button>
                      <span className="w-12 text-center font-bold">{quantity}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(q => q+1)}>+</Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-right">
                    <p className="text-2xl font-bold">Total: ₹{totalAmount.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Status</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="prepaid">Prepaid (Already Paid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Referrer */}
            <div className="space-y-2 hidden">
              <Label>Referred By (Optional)</Label>
              <Input
                placeholder="Enter referrer's UID or Referral Code"
                value={referrerAffiliateId}
                onChange={(e) => setReferrerAffiliateId(e.target.value.trim())}
              />
              <p className="text-sm text-muted-foreground">Will receive 10% commission + ₹100 bonus</p>
            </div>

            {/* Customer Details */}
            <div className="pt-6 border-t space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <User className="h-6 w-6" />
                Delivery Details {selectedBuyer && `(Auto-filled from ${selectedBuyer.name})`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input name="name" value={customerInfo.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" value={customerInfo.email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label>Phone <span className="text-red-500">*</span></Label>
                  <Input name="phone" value={customerInfo.phone} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label>PIN Code <span className="text-red-500">*</span></Label>
                  <Input name="pincode" value={customerInfo.pincode} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Full Address <span className="text-red-500">*</span></Label>
                  <Textarea name="address" value={customerInfo.address} onChange={handleInputChange} rows={3} required />
                </div>
                <div className="space-y-2">
                  <Label>City <span className="text-red-500">*</span></Label>
                  <Input name="city" value={customerInfo.city} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label>State <span className="text-red-500">*</span></Label>
                  <Input name="state" value={customerInfo.state} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-8 border-t">
              <Button type="submit" size="lg" className="w-full text-lg py-6" disabled={loading || !selectedProduct}>
                {loading ? 'Creating Order...' : (
                  <>
                    <CheckCircle className="mr-2 h-6 w-6" />
                    Create Order — ₹{totalAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}