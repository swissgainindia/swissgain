// src/lib/auth.ts
import { useEffect, useState, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  off,
  get,
  set,
  push,
} from 'firebase/database';

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

let app: any, db: any;
try { app = initializeApp(firebaseConfig); } catch { /* ignore duplicate */ }
db = getDatabase(app);

/* ---------- Cookie helpers ---------- */
const getCookie = (name: string) => {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};
const setCookie = (name: string, value: string, days: number) => {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
};
const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

/* ---------- UID handling ---------- */
export const getOrCreateUID = (): string => {
  let uid = getCookie('swissgain_uid');
  if (!uid) {
    uid = 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setCookie('swissgain_uid', uid, 365);
  }
  return uid;
};

/* ---------- Affiliate listener (shared) ---------- */
export const useAffiliate = (uid: string) => {
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!uid) return;
    const affRef = ref(db, `affiliates/${uid}`);
    const callback = (snap: any) => {
      const data = snap.val();
      setIsAffiliate(!!data);
      setAffiliateData(data);
    };
    const unsub = onValue(affRef, callback, (err) => console.error(err));
    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [uid]);

  const cleanup = () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  };

  return { isAffiliate, affiliateData, setAffiliateData, cleanup };
};

/* ---------- Full auth hook ---------- */
export const useAuth = () => {
  const uid = getOrCreateUID();

  const [isLoggedIn, setIsLoggedIn] = useState(!!getCookie('swissgain_logged_in'));
  const [isLoggedOut, setIsLoggedOut] = useState(!!getCookie('swissgain_logged_out')); // NEW
  const [userData, setUserData] = useState<any>(null);

  const { isAffiliate, affiliateData, setAffiliateData, cleanup } = useAffiliate(uid);

  // Sync cookies
  useEffect(() => {
    if (isLoggedIn) {
      setCookie('swissgain_logged_in', 'true', 365);
      deleteCookie('swissgain_logged_out'); // clear logout flag
    } else {
      deleteCookie('swissgain_logged_in');
      deleteCookie('swissgain_user');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedOut) {
      setCookie('swissgain_logged_out', 'true', 1); // 1 day
    } else {
      deleteCookie('swissgain_logged_out');
    }
  }, [isLoggedOut]);

  // Load user from cookie
  useEffect(() => {
    const saved = getCookie('swissgain_user');
    if (saved && !isLoggedOut) {
      setUserData(JSON.parse(saved));
    }
  }, [isLoggedOut]);

  // **BLOCK AUTO‑LOGIN IF USER LOGGED OUT**
  useEffect(() => {
    if (affiliateData && !isLoggedIn && !isLoggedOut) {
      setIsLoggedIn(true);
      setUserData(affiliateData);
      setCookie('swissgain_user', JSON.stringify(affiliateData), 365);
    }
  }, [affiliateData, isLoggedIn, isLoggedOut]);

  const login = (data: any) => {
    const realUid = data.userId || data.id || uid;
    if (realUid !== uid) setCookie('swissgain_uid', realUid, 365);
    setIsLoggedIn(true);
    setIsLoggedOut(false); // clear logout flag
    setUserData(data);
    setCookie('swissgain_user', JSON.stringify(data), 365);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsLoggedOut(true);           // **THIS BLOCKS AUTO‑LOGIN**
    setUserData(null);
    setAffiliateData(null);
    deleteCookie('swissgain_logged_in');
    deleteCookie('swissgain_user');
    cleanup();
  };

  return {
    uid,
    isLoggedIn,
    isLoggedOut,
    userData,
    isAffiliate,
    affiliateData,
    login,
    logout,
  };
};

/* ---------- Find user by email + phone ---------- */
export const findUserByCredentials = async (email: string, phone: string) => {
  try {
    const listSnap = await get(ref(db, 'affiliatesList'));
    if (listSnap.exists()) {
      const list = listSnap.val();
      for (const key in list) {
        const u = list[key];
        if (u.email === email.toLowerCase().trim() && u.phone === phone.trim())
          return { ...u, userId: u.userId };
      }
    }

    const allSnap = await get(ref(db, 'affiliates'));
    if (allSnap.exists()) {
      const all = allSnap.val();
      for (const uid in all) {
        const u = all[uid];
        if (u.email === email.toLowerCase().trim() && u.phone === phone.trim())
          return { ...u, userId: uid };
      }
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/* ---------- Save new affiliate ---------- */
export const saveNewAffiliate = async (uid: string, payload: any) => {
  const affRef = ref(db, `affiliates/${uid}`);
  const affiliateData = {
    ...payload,
    id: uid,
    joinedAt: new Date().toISOString(),
    isAffiliate: true,
    membership: { type: 'affiliate', rank: 1, status: 'active' },
    stats: { totalSales: 0, totalCommission: 0, teamMembers: 0, teamSales: 0 },
  };
  await set(affRef, affiliateData);

  const listRef = ref(db, 'affiliatesList');
  const newRef = push(listRef);
  await set(newRef, {
    userId: uid,
    name: payload.name,
    email: payload.email.toLowerCase().trim(),
    phone: payload.phone.trim(),
    joinedAt: affiliateData.joinedAt,
    rank: 1,
    status: 'active',
  });

  const payRef = ref(db, `payments/${uid}`);
  const newPay = push(payRef);
  await set(newPay, {
    amount: 999,
    type: 'affiliate_registration',
    description: 'One-time fee',
    timestamp: new Date().toISOString(),
    status: 'completed',
  });

  return affiliateData;
};