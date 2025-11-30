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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
/* ✅ Firebase init end */

const HeroSection = () => {
  const [banner, setBanner] = useState("");

  useEffect(() => {
    const bannerRef = ref(database, "banner/hero");

    const unsubscribe = onValue(bannerRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.image) {
        // ✅ image already starts with "/uploads/..."
        setBanner(data.image);
      }
    });

    return () => off(bannerRef); // ✅ cleanup
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="
        relative
        bg-brown-100
        text-white
        h-[30vh]
        md:h-[75vh]
        lg:h-[90vh]
        flex
        items-center
        overflow-hidden
      "
    >
      {banner && (
        <motion.img
          src={banner}
          alt="Luxury Jewellery Banner"
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8 }}
        />
      )}
    </motion.section>
  );
};

export default HeroSection;
