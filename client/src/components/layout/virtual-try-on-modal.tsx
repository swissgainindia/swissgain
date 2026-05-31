'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, RotateCw, Maximize, Move, HelpCircle, X, ShieldAlert } from 'lucide-react';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
}

export default function VirtualTryOnModal({ isOpen, onClose, productName, productImage }: VirtualTryOnModalProps) {
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'camera' | 'photo' | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Necklace adjustment states
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0); // in degrees
  const [position, setPosition] = useState({ x: 170, y: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoImageRef = useRef<HTMLImageElement | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  // 1. Initialize Canvas Redrawing
  useEffect(() => {
    drawTryOnCanvas();
  }, [mode, scale, rotation, position, uploadedImageSrc]);

  const drawTryOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // If in photo mode and image is uploaded, draw the photo as the background
    if (mode === 'photo' && photoImageRef.current && uploadedImageSrc) {
      ctx.drawImage(photoImageRef.current, 0, 0, w, h);
    }

    // Draw the Interactive Jewelry Overlay (Necklace)
    ctx.save();
    
    // Position, scale, and rotate
    ctx.translate(position.x, position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Setup gold gradient for premium chain feel
    const chainGrad = ctx.createLinearGradient(-80, -30, 80, 50);
    chainGrad.addColorStop(0, '#b45309'); // dark bronze
    chainGrad.addColorStop(0.3, '#fef08a'); // gold highlight
    chainGrad.addColorStop(0.5, '#ecc94b'); // yellow gold
    chainGrad.addColorStop(0.7, '#fef08a'); // gold highlight
    chainGrad.addColorStop(1, '#b45309');

    ctx.strokeStyle = chainGrad;
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Draw chain curve
    ctx.beginPath();
    ctx.moveTo(-75, -60);
    ctx.bezierCurveTo(-70, 20, 70, 20, 75, -60);
    ctx.stroke();

    // Draw pendant bale and custom pendant
    const pendantGrad = ctx.createRadialGradient(-3, -2, 1, 0, 0, 15);
    pendantGrad.addColorStop(0, '#fef08a');
    pendantGrad.addColorStop(0.5, '#ecc94b');
    pendantGrad.addColorStop(1, '#b45309');

    // Bale Ring
    ctx.fillStyle = pendantGrad;
    ctx.beginPath();
    ctx.arc(0, 8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pendant
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 22, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Small bright gleam on pendant
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-4, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  };

  // 2. Camera Trigger Functions
  const startCamera = async () => {
    setMode('camera');
    setUploadedImageSrc(null);
    try {
      if (streamRef.current) {
        stopStreams();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 340, height: 380, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCameraPermission(true);
      setIsCameraActive(true);
      toast({
        title: 'Webcam Connected 📷',
        description: 'Successfully initialized live virtual try-on stream.',
      });
    } catch (err) {
      console.error('Camera connection error:', err);
      setHasCameraPermission(false);
      setMode(null);
      toast({
        title: 'Camera Access Blocked',
        description: 'Please enable webcam permissions or upload a photo instead.',
        variant: 'destructive',
      });
    }
  };

  // 3. Photo Upload Trigger
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopStreams();
    setMode('photo');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setUploadedImageSrc(src);
      
      const img = new Image();
      img.onload = () => {
        photoImageRef.current = img;
        drawTryOnCanvas();
        toast({
          title: 'Photo Uploaded 🖼️',
          description: 'Drag, rotate, or resize the necklace to align to your collarbone.',
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // 4. Clean up streams on close
  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleClose = () => {
    stopStreams();
    setMode(null);
    setScale(1.0);
    setRotation(0);
    setPosition({ x: 170, y: 220 });
    onClose();
  };

  // 5. Canvas Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    dragStart.current = { x: x - position.x, y: y - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({
      x: x - dragStart.current.x,
      y: y - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile Devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!mode || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    setIsDragging(true);
    dragStart.current = { x: x - position.x, y: y - position.y };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    setPosition({
      x: x - dragStart.current.x,
      y: y - dragStart.current.y
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-stone-950 text-white border-stone-900 rounded-3xl p-5 shadow-2xl overflow-hidden">
        
        <DialogHeader className="pb-3 border-b border-stone-900">
          <DialogTitle className="text-xl font-extrabold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
            ✨ Virtual AR Try-On
          </DialogTitle>
          <DialogDescription className="text-stone-400 text-xs mt-1">
            Overlay the {productName} on your neckline to preview the scale and brilliance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center pt-4 space-y-4">
          
          {/* Main Visualizer Window */}
          <div className="relative w-[340px] h-[380px] bg-stone-900 rounded-2xl border border-stone-850 overflow-hidden shadow-inner flex items-center justify-center">
            
            {/* STAGE 0: Choice buttons */}
            {!mode && (
              <div className="flex flex-col gap-4 text-center p-6 z-10 w-full">
                <p className="text-xs text-stone-300">Choose a preview capture feed to start:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={startCamera} 
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 py-5 rounded-xl border-0"
                  >
                    <Camera className="h-4.5 w-4.5" /> Camera Feed
                  </Button>
                  <label className="flex items-center justify-center bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white font-bold gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer border border-stone-700 transition-colors">
                    <Upload className="h-4.5 w-4.5" /> Upload Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <p className="text-[10px] text-stone-500 italic mt-2">
                  Webcam streams are processed 100% locally and are never stored on any servers.
                </p>
              </div>
            )}

            {/* STAGE 1: Live Video Feed for Camera Mode */}
            {mode === 'camera' && (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
              />
            )}

            {/* Interactive Canvas Overlay (Renders neckchain, upload background) */}
            <canvas
              ref={canvasRef}
              width={340}
              height={380}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className={`absolute inset-0 z-20 bg-transparent cursor-move ${
                mode ? 'block' : 'hidden'
              }`}
            />

            {/* Active Control Hints */}
            {mode && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-stone-950/80 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] text-stone-400 font-semibold flex items-center gap-1.5 z-30 pointer-events-none border border-stone-900">
                <Move className="h-3 w-3 text-amber-500" /> DRAG TO POSITION NECKLACE
              </div>
            )}

            {/* Reset/Switch buttons when mode is active */}
            {mode && (
              <button
                onClick={() => {
                  stopStreams();
                  setMode(null);
                  setUploadedImageSrc(null);
                  photoImageRef.current = null;
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-stone-850/80 text-stone-300 hover:text-white transition-colors z-30"
              >
                <X className="h-4 w-4" />
              </button>
            )}

          </div>

          {/* Sizing & Rotation Controls */}
          {mode && (
            <div className="w-full bg-stone-900/40 border border-stone-900 rounded-2xl p-4 space-y-4">
              
              {/* Scale Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <Maximize className="h-3.5 w-3.5 text-amber-500" /> Necklace Size
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{Math.round(scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.0"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-850 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5 text-amber-500" /> Rotate Angle
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-850 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

            </div>
          )}

          {/* Bottom Help Text */}
          <div className="w-full text-center text-[10px] text-stone-500 flex items-center justify-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
            <span>Collarbone placement matches the 20" chain standard drop.</span>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
