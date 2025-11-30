import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

/* 🔹 Firebase DIRECT config */
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
/* 🔹 Firebase init done */

const BannerManager = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [savedBanner, setSavedBanner] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ✅ Load saved banner on page refresh */
  useEffect(() => {
    const bannerRef = ref(database, "banner/hero");

    onValue(bannerRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.image) {
        setSavedBanner(data.image);
        setPreview(data.image); // show existing banner
      }
    });
  }, []);

  /* ✅ When admin selects a new image */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  /* ✅ Upload + Save */
  const saveBanner = async () => {
    if (!file) {
      alert("Please select a banner image");
      return;
    }

    setLoading(true);

    try {
      /* 1) Upload image */
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { imageUrl } = await res.json();

      /* 2) Save image URL in Firebase */
      await set(ref(database, "banner/hero"), {
        image: imageUrl,
        updatedAt: Date.now(),
      });

      setSavedBanner(imageUrl);

      alert("Banner saved successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg space-y-5">
      <h2 className="text-xl font-bold">Banner Management</h2>

      {/* ✅ CURRENT SAVED BANNER (after refresh) */}
      {savedBanner && (
        <div>
          <p className="text-sm font-semibold mb-1">Current Banner:</p>
          <img
            src={savedBanner}
            className="w-full h-44 object-cover border rounded"
          />
        </div>
      )}

      {/* ✅ SELECT NEW IMAGE */}
      <input type="file" accept="image/*" onChange={handleFileChange} />

      {/* ✅ PREVIEW NEW IMAGE */}
      {preview && (
        <div>
          <p className="text-sm font-semibold mb-1">Preview:</p>
          <img
            src={preview}
            className="w-full h-44 object-cover border rounded"
          />
        </div>
      )}

      {/* ✅ SAVE BUTTON */}
      <button
        onClick={saveBanner}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save Banner"}
      </button>
    </div>
  );
};

export default BannerManager;
