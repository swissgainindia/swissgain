

// // lib/firebase.ts
// import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
// import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
// import { getDatabase } from 'firebase/database';

// // ====================
// // Firebase Config
// // ====================
// // Replace with your actual Firebase project config
// // You can also use environment variables (recommended for production)

// const firebaseConfig: FirebaseOptions = {
//  apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
//   authDomain: "swissgain-a2589.firebaseapp.com",
//   databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
//   projectId: "swissgain-a2589",
//   storageBucket: "swissgain-a2589.firebasestorage.app",
//   messagingSenderId: "1062016445247",
//   appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a",
//   measurementId: "G-VTKPWVEY0S"
// };



// // ====================
// // Initialize Firebase
// // ====================
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// // ====================
// // Firebase Services
// // ====================
// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const rtdb = getDatabase(app); // Realtime Database (optional)

// // ====================
// // Types
// // ====================
// export type { User, DocumentData };

// // ====================
// // Auth Helpers
// // ====================

// /**
//  * Sign up with email and password
//  */
// export const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
//   try {
//     const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
//     // Create user profile in Firestore
//     await setDoc(doc(db, 'users', user.uid), {
//       uid: user.uid,
//       email: user.email,
//       name: userData.name || '',
//       phone: userData.phone || '',
//       location: userData.location || '',
//       tier: 'Free',
//       isAffiliate: false,
//       joinDate: new Date().toISOString().split('T')[0],
//       profileCompletion: 60,
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     });

//     return user;
//   } catch (error: any) {
//     throw new Error(error.message || 'Failed to sign up');
//   }
// };

// /**
//  * Sign in with email and password
//  */
// export const login = async (email: string, password: string) => {
//   try {
//     const { user } = await signInWithEmailAndPassword(auth, email, password);
//     return user;
//   } catch (error: any) {
//     throw new Error(error.message || 'Invalid credentials');
//   }
// };

// /**
//  * Sign out current user
//  */
// export const logout = async () => {
//   await signOut(auth);
// };

// /**
//  * Listen to auth state changes
//  */
// export const onAuthChange = (callback: (user: User | null) => void) => {
//   return onAuthStateChanged(auth, callback);
// };

// // ====================
// // Firestore Helpers
// // ====================

// /**
//  * Get user profile from Firestore
//  */
// export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
//   try {
//     const docRef = doc(db, 'users', uid);
//     const docSnap = await getDoc(docRef);
//     if (docSnap.exists()) {
//       return docSnap.data() as UserProfile;
//     }
//     return null;
//   } catch (error) {
//     console.error('Error fetching user profile:', error);
//     return null;
//   }
// };

// /**
//  * Update user profile
//  */
// export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
//   try {
//     const docRef = doc(db, 'users', uid);
//     await updateDoc(docRef, {
//       ...data,
//       updatedAt: serverTimestamp(),
//     });
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     throw error;
//   }
// };

// /**
//  * Affiliate Data Helpers
//  */
// export const affiliateCollection = (uid: string) => collection(db, 'users', uid, 'affiliate');
// export const referralCollection = (uid: string) => collection(db, 'users', uid, 'referrals');

// // Example: Add affiliate earning
// export const addAffiliateEarning = async (uid: string, earning: AffiliateEarning) => {
//   const coll = affiliateCollection(uid);
//   const docRef = doc(coll);
//   await setDoc(docRef, {
//     ...earning,
//     createdAt: serverTimestamp(),
//   });
// };

// // Example: Add referral
// export const addReferral = async (uid: string, referral: Referral) => {
//   const coll = referralCollection(uid);
//   const docRef = doc(coll);
//   await setDoc(docRef, {
//     ...referral,
//     createdAt: serverTimestamp(),
//   });
// };

// // ====================
// // Types (UserProfile, Earnings, etc.)
// // ====================

// export interface UserProfile {
//   uid: string;
//   email: string | null;
//   name: string;
//   phone: string;
//   location: string;
//   tier: 'Free' | 'Premium';
//   isAffiliate: boolean;
//   joinDate: string;
//   profileCompletion: number;
//   createdAt?: any;
//   updatedAt?: any;
// }

// export interface AffiliateEarning {
//   id?: string;
//   amount: number;
//   description: string;
//   date: string | Date;
//   product?: string;
// }

// export interface Referral {
//   id?: string;
//   amount: number;
//   name: string;
//   status: 'pending' | 'paid';
//   date: string | Date;
// }

// export interface AffiliateLink {
//   id: string;
//   name: string;
//   url: string;
//   clicks: number;
//   conversions: number;
// }

// // ====================
// // Default Export
// // ====================
// export default app;


// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
  authDomain: "swissgain-a2589.firebaseapp.com",
  databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
  projectId: "swissgain-a2589",
  storageBucket: "swissgain-a2589.appspot.com",
  messagingSenderId: "1062016445247",
  appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a"
};

// Initialize only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

export { app, database };