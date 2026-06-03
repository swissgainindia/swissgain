'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { useLocation } from 'wouter';

const fomoPurchases = [
  { name: 'Ananya', city: 'Mumbai', product: 'Swiss Gold Chain', image: 'chains' },
  { name: 'Rahul', city: 'Delhi', product: 'Diamond Stud Earrings', image: 'earrings' },
  { name: 'Priya', city: 'Bengaluru', product: 'Swiss Premium Necklace', image: 'necklaces' },
  { name: 'Vikram', city: 'Pune', product: 'Sapphire Cocktail Ring', image: 'rings' },
  { name: 'Neha', city: 'Jaipur', product: 'Diamond Tennis Bracelet', image: 'bracelets' },
  { name: 'Rohit', city: 'Kolkata', product: 'Swiss Gold Hoop Earrings', image: 'earrings' },
  { name: 'Sneha', city: 'Ahmedabad', product: 'Everyday Gold Set', image: 'sets' },
  { name: 'Akshay', city: 'Surat', product: 'Swiss Pearl Strand Necklace', image: 'necklaces' }
];

export default function FomoTicker() {
  const [location] = useLocation();
  const [currentPurchase, setCurrentPurchase] = useState<typeof fomoPurchases[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  if (location === '/reels') return null;

  useEffect(() => {
    // Show first alert after 10 seconds
    const startTimer = setTimeout(() => {
      showNextAlert();
    }, 10000);

    // Set interval to trigger every 20 seconds
    const interval = setInterval(() => {
      showNextAlert();
    }, 20000);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, []);

  const showNextAlert = () => {
    // Dismiss current alert first
    setIsVisible(false);
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * fomoPurchases.length);
      setCurrentPurchase(fomoPurchases[randomIndex]);
      setIsVisible(true);

      // Dismiss automatically after 6 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    }, 400); // Small delay to allow fade-out transition
  };

  if (!currentPurchase) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm w-[90%] sm:w-auto bg-stone-900/90 backdrop-blur-md text-stone-100 border border-stone-800 rounded-2xl p-3.5 shadow-2xl transition-all duration-500 flex items-center gap-3.5 ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
      }`}
    >
      {/* Decorative Gold Side Strip */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500 rounded-l-2xl"></div>

      {/* Bag Icon with dynamic pulse */}
      <div className="shrink-0 h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-400">
        <ShoppingBag className="h-5 w-5 animate-pulse" />
      </div>

      {/* Ticker Content */}
      <div className="flex-1 min-w-0 pr-4 pl-1">
        <p className="text-xs text-stone-400 font-medium tracking-wide">
          RECENT PURCHASE
        </p>
        <p className="text-sm font-semibold text-white truncate mt-0.5">
          {currentPurchase.name} from {currentPurchase.city}
        </p>
        <p className="text-xs text-amber-200/90 truncate mt-0.5">
          Bought: <span className="font-semibold">{currentPurchase.product}</span>
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-0.5 text-stone-500 hover:text-stone-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
