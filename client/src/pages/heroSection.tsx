import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

/* ✅ Firebase DIRECT init */
const firebaseConfig = {
  apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
  authDomain: "swissgain-a2589.firebaseapp.com",
  databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
  projectId: "swissgain-a2589",
  storageBucket: "swissgain-a2589.firebasestorage.app",
  messagingSenderId: "1062016445247",
  appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a",
  measurementId: "G-VTKPWVEY0S",
};

// Singleton pattern to prevent multiple initializations
let app;
let database;
try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
} catch (e) {
    // App already initialized
}

const HeroSection = () => {
  const [banner, setBanner] = useState(null);
  const [bannerType, setBannerType] = useState("image");

  useEffect(() => {
    const bannerRef = ref(database, "banner/hero");

    const unsubscribe = onValue(bannerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBanner(data);
        setBannerType(data.type || "image");
      }
    });

    return () => off(bannerRef);
  }, []);

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  return (
    <>
      {/* ✅ 1. BACKGROUND LAYER (The Fix)
        Positioned 'absolute top-0' to force it behind the Navbar.
        z-0 ensures it stays behind the Navbar (assuming Navbar is z-50).
      */}
      <div className="absolute top-0 left-0 w-full h-screen z-0 overflow-hidden">
        {banner && bannerType === "image" && banner.image && (
          <motion.img
            src={banner.image}
            alt="Luxury Jewellery Banner"
            className="w-full h-full object-cover object-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8 }}
          />
        )}

        {banner && bannerType === "youtube" && banner.youtubeUrl && (
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.8 }}
              className="relative w-full h-full"
            >
              <div className="relative w-full h-full overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(banner.youtubeUrl)}?autoplay=1&mute=1&loop=1&playlist=${extractYouTubeId(banner.youtubeUrl)}&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3&background=1`}
                  title="YouTube Video Banner"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: "100vw",
                    height: "56.25vw", /* 16:9 Aspect Ratio */
                    minHeight: "100vh",
                    minWidth: "177.78vh",
                  }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="absolute inset-0 bg-black/30 z-10"></div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* ✅ 2. SPACER / CONTENT LAYER 
        This transparent div takes up space in the document flow so your 
        next section doesn't collapse up. 
      */}
      <div className="relative w-full h-screen z-10 pointer-events-none flex items-center justify-center">
        {/* Put any Hero Text/Buttons here if you have them later.
            pointer-events-auto class would be needed on the buttons. */}
      </div>
    </>
  );
};

export default HeroSection;