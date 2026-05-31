'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift, Sparkles, Copy, Check, RotateCcw } from 'lucide-react';

const segments = [
  { label: '₹250 OFF', color: '#451a03', textColor: '#fef3c7' }, // dark brown / gold
  { label: 'FREE SHIPPING', color: '#78350f', textColor: '#fef3c7' }, 
  { label: '₹500 OFF', color: '#b45309', textColor: '#ffffff' }, // winning segment
  { label: '10% DISCOUNT', color: '#d97706', textColor: '#fef3c7' }, 
  { label: 'TRY AGAIN', color: '#451a03', textColor: '#f87171' }
];

export default function WelcomeCouponModal() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startAngleRef = useRef(0);
  const spinAngleStartRef = useRef(0);
  const spinTimeRef = useRef(0);
  const spinTimeTotalRef = useRef(0);

  // Check if first-time visitor
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('swissgain_has_seen_welcome');
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000); // Trigger popup after 3 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  // Draw wheel on canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const outsideRadius = center - 10;
    const textRadius = outsideRadius * 0.65;
    const insideRadius = 25;

    ctx.clearRect(0, 0, size, size);

    const arc = Math.PI / (segments.length / 2);

    // Draw outer gold border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(center, center, outsideRadius + 2, 0, 2 * Math.PI, false);
    ctx.stroke();

    ctx.lineWidth = 1;

    segments.forEach((seg, i) => {
      const angle = startAngleRef.current + i * arc;
      ctx.fillStyle = seg.color;

      ctx.beginPath();
      ctx.arc(center, center, outsideRadius, angle, angle + arc, false);
      ctx.arc(center, center, insideRadius, angle + arc, angle, true);
      ctx.fill();

      ctx.save();
      ctx.fillStyle = seg.textColor;
      ctx.translate(
        center + Math.cos(angle + arc / 2) * textRadius,
        center + Math.sin(angle + arc / 2) * textRadius
      );
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(seg.label, 0, 0);
      ctx.restore();
    });

    // Draw center gold pin
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(center, center, insideRadius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (isOpen && !hasSpun) {
      // Small timeout to let DOM render canvas
      const timer = setTimeout(() => {
        drawWheel();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasSpun]);

  const rotateWheel = () => {
    spinTimeRef.current += 30;
    if (spinTimeRef.current >= spinTimeTotalRef.current) {
      stopRotateWheel();
      return;
    }
    const spinAngle =
      spinAngleStartRef.current -
      easeOut(spinTimeRef.current, 0, spinAngleStartRef.current, spinTimeTotalRef.current);
    startAngleRef.current += (spinAngle * Math.PI) / 180;
    drawWheel();
    requestAnimationFrame(rotateWheel);
  };

  const easeOut = (t: number, b: number, c: number, d: number) => {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
  };

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    // We want the wheel to spin at least 5 full rotations, and always land on "₹500 OFF" (index 2)
    const arc = 360 / segments.length;
    // index 2 is between arc * 2 and arc * 3. 
    // Target angle range is 360 - (arc * 3) to 360 - (arc * 2) plus some padding
    const targetMinAngle = 360 - (arc * 2.8);
    const targetMaxAngle = 360 - (arc * 2.2);
    const targetAngle = targetMinAngle + Math.random() * (targetMaxAngle - targetMinAngle);
    
    // Total spin of 5 rotations + target offset
    const totalRotation = 360 * 5 + targetAngle;
    
    spinAngleStartRef.current = 10 + Math.random() * 10;
    spinTimeRef.current = 0;
    spinTimeTotalRef.current = 3000 + Math.random() * 1000; // spin for 3-4 seconds

    startAngleRef.current = 0;
    spinAngleStartRef.current = totalRotation / (spinTimeTotalRef.current / 30) * 1.5; // calibrate starting speed

    rotateWheel();
  };

  const stopRotateWheel = () => {
    setIsSpinning(false);
    setHasSpun(true);
    setPrize('₹500 OFF Discount Coupon');
    localStorage.setItem('swissgain_has_seen_welcome', 'true');
    
    toast({
      title: 'Congratulations! 🎉',
      description: 'You won a ₹500 discount coupon!',
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('SWISS500');
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Coupon code "SWISS500" copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const closeAndShop = () => {
    copyToClipboard();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      
      {/* Container - Frosted Glassmorphism with gold accents */}
      <div className="relative w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-center gap-8 overflow-hidden bg-gradient-to-b from-amber-950/20 via-stone-900/40 to-stone-950/60">
        
        {/* Subtle background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* STAGE 1: Spinning active */}
        {!hasSpun ? (
          <>
            {/* Left: The Wheel */}
            <div className="relative shrink-0 flex flex-col items-center">
              {/* Indicator Arrow */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-amber-500 z-10 animate-bounce"></div>
              
              <canvas 
                ref={canvasRef} 
                width={220} 
                height={220} 
                className="bg-transparent aspect-square transition-transform"
              />

              <Button
                onClick={spin}
                disabled={isSpinning}
                className="mt-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold px-6 py-2 rounded-full border border-amber-400 shadow-lg shadow-amber-900/40 active:scale-95 transition-transform"
              >
                {isSpinning ? 'SPINNING...' : 'SPIN NOW'}
              </Button>
            </div>

            {/* Right: Intro Details */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">EXCLUSIVE OFFER</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent font-primary">
                Unwrap Your Gift
              </h2>
              <p className="text-sm text-stone-200 leading-relaxed">
                Welcome to SwissGain. Spin our premium fortune wheel to unlock a first-time shopper coupon worth up to ₹1,000!
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    localStorage.setItem('swissgain_has_seen_welcome', 'true');
                  }}
                  className="text-xs text-stone-400 hover:text-stone-200 underline decoration-dotted transition-colors"
                >
                  No thanks, I will pay full price
                </button>
              </div>
            </div>
          </>
        ) : (
          /* STAGE 2: Prize Revealed */
          <div className="w-full text-center py-4 space-y-6 flex flex-col items-center">
            <div className="h-16 w-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30 animate-pulse">
              <Gift className="h-8 w-8 text-amber-400" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">CONGRATULATIONS</span>
              <h2 className="text-3xl font-extrabold text-white">You Won ₹500 Off!</h2>
              <p className="text-sm text-stone-300 max-w-sm mx-auto">
                Use your coupon at checkout to redeem your ₹500 discount on any of our premium Swiss-plated jewelry.
              </p>
            </div>

            {/* The Glassmorphic Coupon Card */}
            <div className="relative w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-inner overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500"></div>
              
              <div className="text-left pl-2">
                <span className="text-[10px] text-stone-400 tracking-wider">COUPON CODE</span>
                <p className="text-xl font-mono font-bold tracking-widest text-amber-300">SWISS500</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-medium gap-1.5 active:scale-95 transition-transform"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
              <Button
                onClick={closeAndShop}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold py-2.5 rounded-full border border-amber-400 shadow-md shadow-amber-950/50"
              >
                Redeem & Shop
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
