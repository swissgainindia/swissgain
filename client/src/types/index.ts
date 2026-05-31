export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images: string[];
  category: ProductCategory;
  description: string;
  features: string[];
  inStock: boolean;
  stockQuantity?: number;
  rating: number;
  reviews: number;
  videoType?: 'upload' | 'youtube' | '';
  videoUrl?: string;
  sortOrder?: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: ProductCategory;
}

export type ProductCategory = 'necklaces' | 'earrings' | 'rings' | 'bracelets' | 'sets' | 'chains';

export interface Membership {
  isAffiliate: boolean;
  memberSince: string | null;
  totalInvestment: number;
}

export interface Earnings {
  affiliateEarnings: number;
  referralEarnings: number;
  totalSales: number;
  totalReferrals: number;
  monthlyEarnings: number;
  pendingReferrals: number;
}

export interface SwissGainData {
  cart: CartItem[];
  membership: Membership;
  earnings: Earnings;
  referralLink?: string;
}

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface Reel {
  id?: string;
  _id?: string;
  videoUrl: string;
  productId: string | { _id: string; name: string; price: number; image: string };
  userId?: string | { _id: string; username: string };
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface Order {
  id?: string;
  _id?: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: {
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  isGiftWrapped?: boolean;
  giftMessage?: string;
  orderDate?: string;
}
