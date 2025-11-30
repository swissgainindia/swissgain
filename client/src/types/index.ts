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
  rating: number;
  reviews: number;
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
