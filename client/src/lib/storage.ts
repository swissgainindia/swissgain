import { SwissGainData } from '@/types';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  push,
  query,
  orderByChild,
  equalTo,
  onValue 
} from 'firebase/database';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
  authDomain: "swissgain-a2589.firebaseapp.com",
  databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
  projectId: "swissgain-a2589",
  storageBucket: "swissgain-a2589.firebasestorage.app",
  messagingSenderId: "1062016445247",
  appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a",
  measurementId: "G-VTKPWVEY0S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const STORAGE_KEY = 'swissgain_data';

const defaultData: SwissGainData = {
  cart: [],
  membership: {
    isAffiliate: false,
    memberSince: null,
    totalInvestment: 0,
    rank: 1,
    joinedAt: null
  },
  earnings: {
    affiliateEarnings: 0,
    referralEarnings: 0,
    totalSales: 0,
    totalReferrals: 0,
    monthlyEarnings: 0,
    pendingReferrals: 0
  },
  user: {
    name: '',
    email: '',
    phone: '',
    location: ''
  },
  affiliateLinks: [],
  referralLinks: []
};

// Generate unique user ID
const getUserId = (): string => {
  let userId = localStorage.getItem('swissgain_user_id');
  if (!userId) {
    userId = 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    localStorage.setItem('swissgain_user_id', userId);
  }
  return userId;
};

export const getStorageData = (): SwissGainData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      setStorageData(defaultData);
      return defaultData;
    }
    return { ...defaultData, ...JSON.parse(data) };
  } catch {
    setStorageData(defaultData);
    return defaultData;
  }
};

export const setStorageData = (data: SwissGainData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const updateStorageData = (updater: (data: SwissGainData) => SwissGainData): SwissGainData => {
  const currentData = getStorageData();
  const newData = updater(currentData);
  setStorageData(newData);
  return newData;
};

// Firebase sync functions
export const syncWithFirebase = async (): Promise<void> => {
  const userId = getUserId();
  const userData = getStorageData();
  
  try {
    // Save user data to Firebase
    await set(ref(db, `users/${userId}`), {
      ...userData,
      lastSynced: new Date().toISOString(),
      userId: userId
    });
  } catch (error) {
    console.error('Error syncing with Firebase:', error);
    throw error;
  }
};

export const getUserDataFromFirebase = async (): Promise<SwissGainData | null> => {
  const userId = getUserId();
  
  try {
    const snapshot = await get(ref(db, `users/${userId}`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data from Firebase:', error);
    return null;
  }
};

export const getAffiliateEarningsData = async (userId: string) => {
  try {
    const snapshot = await get(ref(db, `affiliateSales`));
    if (snapshot.exists()) {
      const allSales = snapshot.val();
      // Filter sales for this user
      const userSales = Object.values(allSales).filter((sale: any) => sale.affiliateId === userId);
      return userSales;
    }
    return [];
  } catch (error) {
    console.error('Error fetching affiliate earnings:', error);
    return [];
  }
};

export const getReferralEarningsData = async (userId: string) => {
  try {
    const snapshot = await get(ref(db, `referrals`));
    if (snapshot.exists()) {
      const allReferrals = snapshot.val();
      // Filter referrals for this user
      const userReferrals = Object.values(allReferrals).filter((ref: any) => ref.referrerId === userId);
      return userReferrals;
    }
    return [];
  } catch (error) {
    console.error('Error fetching referral earnings:', error);
    return [];
  }
};

export const getBillingHistory = async (userId: string) => {
  try {
    const snapshot = await get(ref(db, `billing`));
    if (snapshot.exists()) {
      const allBilling = snapshot.val();
      // Filter billing for this user
      const userBilling = Object.values(allBilling).filter((bill: any) => bill.userId === userId);
      return userBilling;
    }
    return [];
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
};

export const getReports = async (userId: string) => {
  try {
    const snapshot = await get(ref(db, `reports`));
    if (snapshot.exists()) {
      const allReports = snapshot.val();
      // Filter reports for this user
      const userReports = Object.values(allReports).filter((report: any) => report.userId === userId);
      return userReports;
    }
    return [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};

// Cart operations
export const addProductToCart = (product: any, quantity: number = 1) => {
  return updateStorageData(data => {
    const productId = product.id || product._id;

    const existingItem = data.cart.find(item => item.id === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      data.cart.push({
        id: productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
        category: product.category,
      });
    }
    return data;
  });
};

export const removeFromCart = (productId: string) => {
  return updateStorageData(data => {
    data.cart = data.cart.filter(item => item.id !== productId);
    return data;
  });
};

export const updateCartQuantity = (productId: string, quantity: number) => {
  return updateStorageData(data => {
    const item = data.cart.find(item => item.id === productId);
    if (item) item.quantity = quantity;
    return data;
  });
};

export const clearCart = () => {
  return updateStorageData(data => {
    data.cart = [];
    return data;
  });
};

// Membership operations
export const joinAffiliate = () => {
  return updateStorageData(data => {
    data.membership.isAffiliate = true;
    data.membership.memberSince = new Date().toISOString();
    data.membership.joinedAt = new Date().toISOString();
    data.membership.totalInvestment = 999;
    data.membership.rank = 1;
    return data;
  });
};

// Earnings operations
export const addAffiliateSale = async (saleData: any = {}) => {
  const userId = getUserId();
  const saleId = push(ref(db, 'affiliateSales')).key;
  
  const sale = {
    id: saleId,
    affiliateId: userId,
    amount: 100,
    product: 'Neckchain',
    date: new Date().toISOString(),
    ...saleData
  };

  try {
    await set(ref(db, `affiliateSales/${saleId}`), sale);
    
    return updateStorageData(data => {
      data.earnings.totalSales += 1;
      data.earnings.affiliateEarnings += sale.amount;
      data.earnings.monthlyEarnings += sale.amount;
      return data;
    });
  } catch (error) {
    console.error('Error adding affiliate sale:', error);
    throw error;
  }
};

export const addReferral = async (referralData: any = {}) => {
  const userId = getUserId();
  const referralId = push(ref(db, 'referrals')).key;
  
  const referral = {
    id: referralId,
    referrerId: userId,
    amount: 299.9,
    date: new Date().toISOString(),
    status: 'completed',
    ...referralData
  };

  try {
    await set(ref(db, `referrals/${referralId}`), referral);
    
    return updateStorageData(data => {
      data.earnings.totalReferrals += 1;
      data.earnings.referralEarnings += referral.amount;
      return data;
    });
  } catch (error) {
    console.error('Error adding referral:', error);
    throw error;
  }
};

// Link generation functions
export const generateAffiliateLink = async (customName?: string) => {
  const userId = getUserId();
  const linkId = push(ref(db, 'affiliateLinks')).key;
  const uniqueCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  
  const affiliateLink = {
    id: linkId,
    userId: userId,
    code: uniqueCode,
    name: customName || `Affiliate Link ${new Date().toLocaleDateString()}`,
    url: `https://swissgain.com/affiliate/${uniqueCode}`,
    createdAt: new Date().toISOString(),
    clicks: 0,
    conversions: 0
  };

  try {
    await set(ref(db, `affiliateLinks/${linkId}`), affiliateLink);
    
    // Update local storage
    updateStorageData(data => {
      if (!data.affiliateLinks) data.affiliateLinks = [];
      data.affiliateLinks.push(affiliateLink);
      return data;
    });
    
    return affiliateLink;
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    throw error;
  }
};

export const generateReferralLink = async (customName?: string) => {
  const userId = getUserId();
  const linkId = push(ref(db, 'referralLinks')).key;
  const uniqueCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  
  const referralLink = {
    id: linkId,
    userId: userId,
    code: uniqueCode,
    name: customName || `Referral Link ${new Date().toLocaleDateString()}`,
    url: `https://swissgain.com/ref/${uniqueCode}`,
    createdAt: new Date().toISOString(),
    clicks: 0,
    signups: 0
  };

  try {
    await set(ref(db, `referralLinks/${linkId}`), referralLink);
    
    // Update local storage
    updateStorageData(data => {
      if (!data.referralLinks) data.referralLinks = [];
      data.referralLinks.push(referralLink);
      return data;
    });
    
    return referralLink;
  } catch (error) {
    console.error('Error generating referral link:', error);
    throw error;
  }
};

export const getAffiliateLinks = async (userId: string) => {
  try {
    const snapshot = await get(ref(db, 'affiliateLinks'));
    if (snapshot.exists()) {
      const allLinks = snapshot.val();
      return Object.values(allLinks).filter((link: any) => link.userId === userId);
    }
    return [];
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    return [];
  }
};

export const getReferralLinks = async (userId: string) => {
  try {
    const snapshot = await get(ref(db, 'referralLinks'));
    if (snapshot.exists()) {
      const allLinks = snapshot.val();
      return Object.values(allLinks).filter((link: any) => link.userId === userId);
    }
    return [];
  } catch (error) {
    console.error('Error fetching referral links:', error);
    return [];
  }
};