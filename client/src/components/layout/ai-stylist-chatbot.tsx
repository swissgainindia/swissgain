'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, X, Send, User, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  options?: string[];
}

export default function AiStylistChatbot() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Welcome to SwissGain, where Swiss precision meets gold artistry. I am your Luxury Stylist Companion. How may I assist you today?",
      options: ['🎁 Suggest a Gift', '📏 Sizing Guide', '💎 Gold Purity Info', '💰 Affiliate Commission']
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputVal('');
    setIsTyping(true);

    // 2. Process automated response
    setTimeout(() => {
      setIsTyping(false);
      const reply = generateStylistResponse(text);
      setMessages(prev => [...prev, reply]);
    }, 1200); // realistic delay for typing animation
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  const generateStylistResponse = (query: string): Message => {
    const q = query.toLowerCase();

    if (q.includes('gift') || q.includes('suggest')) {
      return {
        sender: 'ai',
        text: "For a truly magnificent gift, I recommend our signature **Swiss Gold Curb Chain**—it is a bold, timeless bestseller that fits any occasion. Would you like to view necklaces or bracelets?",
        options: ['View Necklaces', 'View Rings', 'Main Menu']
      };
    }
    
    if (q.includes('sizing') || q.includes('size') || q.includes('measure')) {
      return {
        sender: 'ai',
        text: "Absolutely. Our standard men's chains are **20 inches** (sits right at the collarbone) and **22 inches** (draped fall). For rings, you can measure the inner diameter of an existing ring. What category are you sizing?",
        options: ['Chain Sizing', 'Ring Sizing', 'Main Menu']
      };
    }

    if (q.includes('purity') || q.includes('gold') || q.includes('1 gram')) {
      return {
        sender: 'ai',
        text: "SwissGain jewelry is crafted using a heavy **1-Gram 24K Gold Plating** over a high-durability premium jeweler's alloy. This creates the exact color weight and luster of solid gold, while remaining extremely scratch-resistant and tarnish-free for life.",
        options: ['Does it fade?', 'Certifications', 'Main Menu']
      };
    }

    if (q.includes('fade') || q.includes('tarnish') || q.includes('wear')) {
      return {
        sender: 'ai',
        text: "No, it will not fade under daily wear! We coat each piece with a special anti-tarnish protective lacquer. Every order comes with a **Lifetime Authenticity Certificate & Warranty**.",
        options: ['Main Menu']
      };
    }

    if (q.includes('affiliate') || q.includes('commission') || q.includes('earn') || q.includes('money')) {
      return {
        sender: 'ai',
        text: "Our Affiliate Program is a premium 10-tier network structure. You earn a **Level 1 commission of 10% + a flat ₹100 cash bonus** on every sale you refer. As your team grows, you unlock team royalty overrides up to 10 generations deep! You can join at `/affiliate`.",
        options: ['Join Affiliate Program', 'Earnings Calculator', 'Main Menu']
      };
    }

    if (q.includes('join') || q.includes('register')) {
      return {
        sender: 'ai',
        text: "Wonderful! To register, go directly to our **Affiliate Portal**. There is a one-time lifetime fee of ₹999 which unlocks your customized referral link, dashboard tracking, and marketing creatives.",
        options: ['Sign Up Now', 'Main Menu']
      };
    }

    if (q.includes('calculator') || q.includes('project')) {
      return {
        sender: 'ai',
        text: "You can interactively project your sales, referrals, and target commission ranks using the interactive slider simulator on the `/affiliate` page. Go ahead and try it out!",
        options: ['Go to Affiliate Page', 'Main Menu']
      };
    }

    if (q.includes('necklaces') || q.includes('rings') || q.includes('shop')) {
      return {
        sender: 'ai',
        text: "To browse our premium certified collections, visit our main **Catalog** at `/products`. There you will find gold chains, sapphire rings, and diamond sets.",
        options: ['Go to Catalog', 'Main Menu']
      };
    }

    // Default Fallback
    return {
      sender: 'ai',
      text: "I appreciate your query. As your dedicated stylist, I am here to help you select, custom engrave, or maximize your referral earnings. Choose one of our options below:",
      options: ['🎁 Suggest a Gift', '📏 Sizing Guide', '💎 Gold Purity Info', '💰 Affiliate Commission']
    };
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-2xl flex items-center justify-center border border-amber-400/30 transition-all hover:scale-110 active:scale-95 animate-bounce"
        style={{ animationDuration: '3s' }}
        aria-label="Toggle luxury chatbot stylist"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* Glassmorphic Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-18 right-4 z-50 w-[320px] sm:w-[350px] h-[450px] bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform translate-y-0 scale-100">
          
          {/* Header */}
          <div className="bg-black/20 border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 text-amber-400">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white tracking-wide uppercase">Luxury AI Stylist</h3>
                <p className="text-[9px] text-amber-400/90 font-medium">Online • Personal Style Companion</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-500 hover:text-stone-300 transition-colors p-0.5"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Container */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[320px]"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  
                  {/* Sender Avatar */}
                  <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                    msg.sender === 'ai' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-stone-800 text-stone-300'
                  }`}>
                    {msg.sender === 'ai' ? <Sparkles className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'ai'
                      ? 'bg-white/5 border border-white/5 text-stone-100 rounded-tl-none'
                      : 'bg-amber-600 text-white font-medium rounded-tr-none shadow-md shadow-amber-950/20'
                  }`}>
                    {msg.text}
                  </div>
                </div>

                {/* Response Options */}
                {msg.sender === 'ai' && msg.options && (
                  <div className="flex flex-wrap gap-1.5 pl-8.5">
                    {msg.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => handleOptionClick(opt)}
                        className="bg-stone-900 hover:bg-stone-850 border border-stone-800/80 hover:border-stone-700 text-stone-300 hover:text-white rounded-full py-1 px-2.5 text-[10px] font-semibold transition-all flex items-center gap-0.5 active:scale-95"
                      >
                        {opt} <ChevronRight className="h-2.5 w-2.5 text-stone-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing bubble */}
            {isTyping && (
              <div className="flex items-start gap-2.5">
                <div className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                  <Sparkles className="h-3 w-3" />
                </div>
                <div className="bg-white/5 border border-white/5 text-stone-400 rounded-2xl rounded-tl-none py-2 px-3 text-xs flex items-center gap-1.5 shadow-inner">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="border-t border-white/10 p-3 bg-black/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask your luxury stylist..."
              className="flex-1 bg-black/40 border border-white/10 focus:border-amber-500 focus:ring-0 rounded-xl py-2 px-3.5 text-xs text-stone-200 placeholder-stone-500 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="h-8 w-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:hover:bg-amber-600 transition-colors border-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
