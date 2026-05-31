'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addProductToCart } from '@/lib/storage';
import SEO from '@/components/layout/seo';
import { Sparkles, ShoppingBag, Eye, ShieldCheck, HelpCircle } from 'lucide-react';
import { useLocation } from 'wouter';

const metalOptions = [
  { id: '24K Gold', name: '24K Yellow Gold Plating', color: '#ecc94b', price: 299, desc: 'Pure yellow gold luster, certified 1g plating.' },
  { id: '22K Rose Gold', name: '22K Rose Gold Plating', color: '#e53e3e', price: 349, desc: 'Warm copper-gold blush, modern luxury styling.' },
  { id: 'Platinum', name: 'Platinum Plating', color: '#cbd5e0', price: 399, desc: 'Sophisticated silver-white sheen, highly durable.' }
];

const chainStyles = [
  { id: 'Curb', name: 'Curb Chain', drawPattern: 'curb', basePrice: 1999, desc: 'Classic interlocking flat links, bold look.' },
  { id: 'Figaro', name: 'Figaro Chain', drawPattern: 'figaro', basePrice: 2099, desc: '3 short links followed by 1 elongated link.' },
  { id: 'Rope', name: 'Rope Chain', drawPattern: 'rope', basePrice: 2199, desc: 'Spiral twist links, premium light reflection.' },
  { id: 'Cable', name: 'Cable Chain', drawPattern: 'cable', basePrice: 1899, desc: 'Simple, elegant round uniform links.' }
];

const pendantShapes = [
  { id: 'Circle', name: 'Classic Round Shield' },
  { id: 'Heart', name: 'Sweetheart Pendant' },
  { id: 'Shield', name: 'Modern Geometric Tag' }
];

export default function CustomizePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedMetal, setSelectedMetal] = useState(metalOptions[0]);
  const [selectedChain, setSelectedChain] = useState(chainStyles[0]);
  const [selectedPendant, setSelectedPendant] = useState(pendantShapes[0]);
  const [chainLength, setChainLength] = useState(20); // 18, 20, 22, 24
  const [engravingText, setEngravingText] = useState('SWISS');
  const [fontStyle, setFontStyle] = useState('Georgia');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Price Calculation
  const finalPrice = selectedChain.basePrice + selectedMetal.price + (chainLength - 18) * 50;

  // Draw the preview on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, w, h);

    // Draw luxury backdrop gradient
    const bgGrad = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, w/2);
    bgGrad.addColorStop(0, '#2d1810');
    bgGrad.addColorStop(1, '#0c0705');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw Neck / Shoulder Silhouette (Subtle, elegant)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(217, 119, 6, 0.02)';
    ctx.beginPath();
    
    // Head / neck outline
    ctx.moveTo(w * 0.35, 0);
    ctx.bezierCurveTo(w * 0.35, h * 0.3, w * 0.42, h * 0.45, w * 0.42, h * 0.55); // neck left
    ctx.bezierCurveTo(w * 0.42, h * 0.65, w * 0.2, h * 0.72, 0, h * 0.85); // shoulder left
    ctx.lineTo(0, h);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h * 0.85);
    ctx.bezierCurveTo(w * 0.8, h * 0.72, w * 0.58, h * 0.65, w * 0.58, h * 0.55); // neck right
    ctx.bezierCurveTo(w * 0.58, h * 0.45, w * 0.65, h * 0.3, w * 0.65, 0); // head right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Setup metal color gradients
    const getMetalColors = () => {
      if (selectedMetal.id === '24K Gold') {
        return { main: '#ecc94b', light: '#fef08a', dark: '#b45309' };
      } else if (selectedMetal.id === '22K Rose Gold') {
        return { main: '#f43f5e', light: '#fecdd3', dark: '#9f1239' };
      } else { // Platinum
        return { main: '#cbd5e0', light: '#f7fafc', dark: '#4a5568' };
      }
    };
    const metalColors = getMetalColors();

    // 1. Draw Draped Chain
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    const chainColorGrad = ctx.createLinearGradient(0, h * 0.2, w, h * 0.65);
    chainColorGrad.addColorStop(0, metalColors.dark);
    chainColorGrad.addColorStop(0.3, metalColors.light);
    chainColorGrad.addColorStop(0.5, metalColors.main);
    chainColorGrad.addColorStop(0.7, metalColors.light);
    chainColorGrad.addColorStop(1, metalColors.dark);

    ctx.strokeStyle = chainColorGrad;
    ctx.lineWidth = selectedChain.drawPattern === 'rope' ? 6 : 4;
    ctx.setLineDash([]);

    // Chain Drop adjustments based on length
    // 18" is high, 24" hangs very low
    const lengthFactor = (chainLength - 18) * 6; 
    const chainLeftX = w * 0.32;
    const chainRightX = w * 0.68;
    const chainTopY = h * 0.15;
    const chainBottomY = h * 0.45 + lengthFactor;

    ctx.beginPath();
    ctx.moveTo(chainLeftX, chainTopY);
    ctx.bezierCurveTo(
      chainLeftX + 5, chainBottomY - 20,
      chainRightX - 5, chainBottomY - 20,
      chainRightX, chainTopY
    );
    
    if (selectedChain.drawPattern === 'rope') {
      ctx.stroke();
      // Draw inner core to make rope effect
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(chainLeftX, chainTopY);
      ctx.bezierCurveTo(chainLeftX + 5, chainBottomY - 20, chainRightX - 5, chainBottomY - 20, chainRightX, chainTopY);
      ctx.stroke();
    } else if (selectedChain.drawPattern === 'figaro') {
      ctx.setLineDash([12, 4, 3, 4, 3, 4]); // 1 long link, 2 short links
      ctx.stroke();
    } else if (selectedChain.drawPattern === 'curb') {
      ctx.setLineDash([8, 2]); // flat flat pattern
      ctx.stroke();
    } else { // Cable
      ctx.setLineDash([5, 3]); // uniform segments
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Pendant bale & connection
    const pendantCenterX = w / 2;
    const pendantCenterY = chainBottomY - 14;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Small bale ring
    const baleGrad = ctx.createRadialGradient(pendantCenterX, pendantCenterY - 10, 1, pendantCenterX, pendantCenterY - 10, 5);
    baleGrad.addColorStop(0, metalColors.light);
    baleGrad.addColorStop(1, metalColors.dark);
    ctx.fillStyle = baleGrad;
    ctx.beginPath();
    ctx.arc(pendantCenterX, pendantCenterY - 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Pendant Shape
    const pendantGrad = ctx.createRadialGradient(pendantCenterX - 5, pendantCenterY - 5, 2, pendantCenterX, pendantCenterY, 30);
    pendantGrad.addColorStop(0, metalColors.light);
    pendantGrad.addColorStop(0.4, metalColors.main);
    pendantGrad.addColorStop(1, metalColors.dark);
    ctx.fillStyle = pendantGrad;
    ctx.strokeStyle = metalColors.light;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    if (selectedPendant.id === 'Circle') {
      ctx.arc(pendantCenterX, pendantCenterY, 26, 0, Math.PI * 2);
    } else if (selectedPendant.id === 'Heart') {
      // Draw Heart shape
      const x = pendantCenterX;
      const y = pendantCenterY - 14;
      ctx.moveTo(x, y + 10);
      ctx.bezierCurveTo(x - 18, y - 10, x - 28, y + 10, x, y + 36);
      ctx.bezierCurveTo(x + 28, y + 10, x + 18, y - 10, x, y + 10);
    } else { // Shield / Tag
      const px = pendantCenterX - 18;
      const py = pendantCenterY - 26;
      ctx.roundRect(px, py, 36, 52, 6);
    }
    ctx.fill();
    ctx.stroke();

    // Draw Dynamic Engraving text
    if (engravingText.trim().length > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; // deep engraved contrast
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate responsive font size
      const maxLen = engravingText.length;
      const fs = maxLen > 8 ? 8 : maxLen > 5 ? 10 : 12;
      ctx.font = `bold ${fs}px ${fontStyle}, serif`;

      // Engrave shadow overlay to simulate depth
      ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
      ctx.shadowBlur = 1;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;

      ctx.fillText(engravingText.toUpperCase(), pendantCenterX, pendantCenterY + (selectedPendant.id === 'Heart' ? 2 : 0));
    }
    ctx.restore();

    // 3. Draw a premium light reflection gleam (glare effect on pendant edge)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gleamGrad = ctx.createRadialGradient(pendantCenterX - 10, pendantCenterY - 10, 0, pendantCenterX - 10, pendantCenterY - 10, 15);
    gleamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gleamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gleamGrad;
    ctx.beginPath();
    ctx.arc(pendantCenterX - 10, pendantCenterY - 10, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  }, [selectedMetal, selectedChain, selectedPendant, chainLength, engravingText, fontStyle]);

  const handleAddToCart = () => {
    const customConfig = {
      id: `SG-CUSTOM-${Date.now()}`,
      name: `Design Lab Custom Necklace`,
      price: finalPrice,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
      category: 'necklaces',
      customProperties: {
        metal: selectedMetal.id,
        chain: selectedChain.name,
        pendant: selectedPendant.name,
        length: `${chainLength} inches`,
        engraving: engravingText || 'None'
      }
    };

    addProductToCart(customConfig, 1);
    toast({
      title: 'Added to Cart! 🛍️',
      description: `Your custom ${selectedChain.name} (${selectedMetal.id}) has been added.`,
    });
    setLocation('/cart');
  };

  return (
    <div className="py-12 bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950 text-white min-h-screen">
      <SEO 
        title="Design Lab | Customize Your 1 Gram Gold Necklace | SwissGain"
        description="Craft your custom jewelry piece. Select gold metals, interlocking curb styles, adjustable lengths, and personalize with custom name engraving."
        url="/customize"
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro */}
        <div className="text-center mb-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" /> SWISSGAIN DESIGN STUDIO
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent font-primary">
            Custom Necklace Builder
          </h1>
          <p className="text-stone-300 text-sm sm:text-base max-w-2xl mx-auto">
            Experience absolute personalization. Meticulously tweak the materials, chain linkages, sizing, and add signature monograms carved onto precious plated gold.
          </p>
        </div>

        {/* Builder Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Customizer Controls (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card 1: Metal selection */}
            <Card className="bg-stone-900/60 backdrop-blur-md border-stone-800 text-white shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-amber-400">1. Select Precious Metal Plating</CardTitle>
                <CardDescription className="text-stone-400">All SwissGain items carry premium, heavy gold/platinum overlays.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {metalOptions.map((metal) => (
                    <button
                      key={metal.id}
                      onClick={() => setSelectedMetal(metal)}
                      className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                        selectedMetal.id === metal.id 
                          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-900/20' 
                          : 'border-stone-800 bg-stone-950/40 hover:bg-stone-850 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full border border-white/20 inline-block" style={{ backgroundColor: metal.color }} />
                        <span className="font-bold text-sm">{metal.id}</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1.5 leading-relaxed flex-1">{metal.desc}</p>
                      <span className="text-xs text-amber-300 font-bold mt-2 font-mono">+₹{metal.price}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Chain style */}
            <Card className="bg-stone-900/60 backdrop-blur-md border-stone-800 text-white shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-amber-400">2. Interlocking Linkage Style</CardTitle>
                <CardDescription className="text-stone-400">Pick the structure of the neckchain links.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {chainStyles.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setSelectedChain(chain)}
                      className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                        selectedChain.id === chain.id 
                          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-900/20' 
                          : 'border-stone-800 bg-stone-950/40 hover:bg-stone-850 hover:border-stone-700'
                      }`}
                    >
                      <span className="font-bold text-sm">{chain.name}</span>
                      <p className="text-[10px] text-stone-400 mt-1">{chain.desc}</p>
                      <div className="flex justify-between items-center w-full mt-3">
                        <span className="text-xs text-stone-500">Base Price:</span>
                        <span className="text-sm text-amber-300 font-bold font-mono">₹{chain.basePrice.toLocaleString('en-IN')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Sizing & Engraving */}
            <Card className="bg-stone-900/60 backdrop-blur-md border-stone-800 text-white shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-amber-400">3. Length & Signature Monogram</CardTitle>
                <CardDescription className="text-stone-400">Customize the chain fall and personalize the pendant shield.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Length slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-stone-300">Chain Length</span>
                    <span className="font-mono font-bold text-amber-400">{chainLength} inches</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="24"
                    step="2"
                    value={chainLength}
                    onChange={(e) => setChainLength(parseInt(e.target.value))}
                    className="w-full h-2 bg-stone-850 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500 px-1 font-mono">
                    <span>18" (Tight Fall)</span>
                    <span>20" (Standard Fall)</span>
                    <span>22" (Draped Fall)</span>
                    <span>24" (Low Hang)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {/* Pendant Shape selection */}
                  <div className="space-y-2.5">
                    <Label className="text-stone-300 font-semibold text-sm">Pendant Tag Style</Label>
                    <div className="flex flex-col gap-2">
                      {pendantShapes.map((shape) => (
                        <button
                          key={shape.id}
                          onClick={() => setSelectedPendant(shape)}
                          className={`w-full py-2 px-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                            selectedPendant.id === shape.id 
                              ? 'border-amber-500 bg-amber-500/10 text-white' 
                              : 'border-stone-800 bg-stone-950/40 text-stone-300 hover:bg-stone-850'
                          }`}
                        >
                          {shape.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Engraving Input */}
                  <div className="space-y-2.5">
                    <Label htmlFor="engraving-text" className="text-stone-300 font-semibold text-sm">Signature Engraving (Max 12 chars)</Label>
                    <Input
                      id="engraving-text"
                      type="text"
                      maxLength={12}
                      value={engravingText}
                      onChange={(e) => setEngravingText(e.target.value.toUpperCase())}
                      className="bg-stone-950/40 border-stone-800 focus:border-amber-500 focus:ring-amber-500 text-white font-mono tracking-widest text-sm"
                      placeholder="e.g. SWISS"
                    />

                    {/* Font Selector */}
                    <div className="space-y-1.5 mt-4">
                      <Label className="text-[11px] text-stone-400">Typography Font</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Georgia', 'Courier New', 'Trebuchet MS'].map((font) => (
                          <button
                            key={font}
                            type="button"
                            onClick={() => setFontStyle(font)}
                            className={`py-1 rounded text-[10px] border transition-all font-semibold ${
                              fontStyle === font 
                                ? 'border-amber-500 bg-amber-500/10 text-white' 
                                : 'border-stone-800 bg-stone-950/45 text-stone-400 hover:text-stone-200'
                            }`}
                            style={{ fontFamily: font }}
                          >
                            {font.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Right panel: Visual Canvas Sandbox (5 columns) */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
            
            {/* Visualizer card */}
            <Card className="bg-stone-900/60 backdrop-blur-md border-stone-800 text-white shadow-xl rounded-2xl overflow-hidden relative">
              <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-sm border border-stone-800/80 px-2.5 py-1 rounded-full text-[10px] text-amber-300 font-semibold flex items-center gap-1.5 z-10">
                <Eye className="h-3 w-3" /> REAL-TIME PREVIEW
              </div>

              <CardContent className="p-0 flex flex-col items-center">
                
                {/* HTML5 canvas */}
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={380}
                  className="w-full aspect-[340/380] bg-stone-950"
                />

                {/* Price Display Card */}
                <div className="w-full bg-stone-950/80 border-t border-stone-800 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] tracking-wider text-stone-400 uppercase font-semibold">Total Price</span>
                      <p className="text-3xl font-extrabold text-white font-mono mt-0.5">
                        ₹{finalPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ In Stock
                      </span>
                      <p className="text-[10px] text-stone-400 mt-1">Includes luxury gift box</p>
                    </div>
                  </div>

                  {/* Trust highlight */}
                  <div className="bg-stone-900/60 border border-stone-800/50 rounded-xl p-3 flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
                    <p className="text-[10px] text-stone-300 leading-relaxed">
                      All custom monograms are individually hand-engraved with certified lifetime guarantees on 1 gram gold plating.
                    </p>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold py-3 rounded-xl border border-amber-400 shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 active:scale-98 transition-transform"
                  >
                    <ShoppingBag className="h-4.5 w-4.5" />
                    ADD CUSTOM DESIGN TO CART
                  </Button>
                </div>

              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
