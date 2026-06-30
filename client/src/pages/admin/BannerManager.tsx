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
  const [bannerType, setBannerType] = useState("image"); // "image" or "youtube"
  const [youtubeUrl, setYoutubeUrl] = useState("");

  /* ✅ Load saved banner on page refresh */
  useEffect(() => {
    const bannerRef = ref(database, "banner/hero");

    onValue(bannerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSavedBanner(data);
        setBannerType(data.type || "image");
        
        if (data.type === "youtube" && data.youtubeUrl) {
          setYoutubeUrl(data.youtubeUrl);
          setPreview(`https://img.youtube.com/vi/${extractYouTubeId(data.youtubeUrl)}/maxresdefault.jpg`);
        } else if (data.type === "image" && data.image) {
          setPreview(data.image);
        }
      }
    });
  }, []);

  // Function to extract YouTube ID from URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  /* ✅ When admin selects a new image */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setBannerType("image");
  };

  /* ✅ Handle YouTube URL change */
  const handleYoutubeUrlChange = (e) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    
    const videoId = extractYouTubeId(url);
    if (videoId) {
      setPreview(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
      setBannerType("youtube");
    }
  };

  /* ✅ Upload + Save */
  const saveBanner = async () => {
    setLoading(true);

    try {
      let bannerData = {
        type: bannerType,
        updatedAt: Date.now(),
      };

      if (bannerType === "image") {
        if (!file) {
          alert("Please select a banner image");
          setLoading(false);
          return;
        }

        /* 1) Upload image */
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const { imageUrl } = await res.json();
        bannerData.image = imageUrl;

      } else if (bannerType === "youtube") {
        if (!youtubeUrl) {
          alert("Please enter a YouTube URL");
          setLoading(false);
          return;
        }

        const videoId = extractYouTubeId(youtubeUrl);
        if (!videoId) {
          alert("Invalid YouTube URL");
          setLoading(false);
          return;
        }

        bannerData.youtubeUrl = youtubeUrl;
        bannerData.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      } else if (bannerType === "video") {
        if (!youtubeUrl) {
          alert("Please enter a direct video URL");
          setLoading(false);
          return;
        }
        (bannerData as any).videoUrl = youtubeUrl;
        (bannerData as any).thumbnail = "https://via.placeholder.com/400x300?text=Direct+Video+Banner";
      }

      /* 2) Save in Firebase */
      await set(ref(database, "banner/hero"), bannerData);
      setSavedBanner(bannerData);

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

      {/* ✅ Banner Type Selector */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Banner Type:</p>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="image"
              checked={bannerType === "image"}
              onChange={() => setBannerType("image")}
              className="w-4 h-4"
            />
            <span>Image Banner</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="youtube"
              checked={bannerType === "youtube"}
              onChange={() => setBannerType("youtube")}
              className="w-4 h-4"
            />
            <span>YouTube Video</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="video"
              checked={bannerType === "video"}
              onChange={() => setBannerType("video")}
              className="w-4 h-4"
            />
            <span>Direct Video URL</span>
          </label>
        </div>
      </div>

      {/* ✅ CURRENT SAVED BANNER (after refresh) */}
      {savedBanner && (
        <div>
          <p className="text-sm font-semibold mb-1">Current Banner ({savedBanner.type}):</p>
          {savedBanner.type === "image" && savedBanner.image && (
            <img loading="lazy"
              src={savedBanner.image}
              className="w-full h-44 object-cover border rounded"
              alt="Current banner"
            />
          )}
          {savedBanner.type === "youtube" && savedBanner.thumbnail && (
            <div>
              <img loading="lazy"
                src={savedBanner.thumbnail}
                className="w-full h-44 object-cover border rounded"
                alt="YouTube thumbnail"
              />
              <p className="text-xs text-gray-600 mt-1 truncate">
                URL: {savedBanner.youtubeUrl}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✅ IMAGE UPLOAD SECTION */}
      {bannerType === "image" && (
        <div>
          <p className="text-sm font-semibold mb-2">Upload Image:</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="w-full"
          />
        </div>
      )}

      {/* ✅ YOUTUBE URL SECTION */}
      {bannerType === "youtube" && (
        <div>
          <p className="text-sm font-semibold mb-2">YouTube Video URL:</p>
          <input
            type="text"
            value={youtubeUrl}
            onChange={handleYoutubeUrlChange}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: https://youtu.be/ipcvINIbeDY or https://youtube.com/watch?v=ipcvINIbeDY
          </p>
        </div>
      )}

      {/* ✅ DIRECT VIDEO URL SECTION */}
      {bannerType === "video" && (
        <div>
          <p className="text-sm font-semibold mb-2">Direct Video URL (MP4/WebM):</p>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => {
              setYoutubeUrl(e.target.value);
              setPreview(null);
            }}
            placeholder="https://cloudinary.com/.../video.mp4"
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter direct Cloudinary or host video link.
          </p>
        </div>
      )}

      {/* ✅ PREVIEW */}
      {preview && (
        <div>
          <p className="text-sm font-semibold mb-1">Preview:</p>
          <img loading="lazy"
            src={preview}
            className="w-full h-44 object-cover border rounded"
            alt="Preview"
          />
          {bannerType === "youtube" && youtubeUrl && (
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <p className="text-xs">
                <strong>YouTube ID:</strong> {extractYouTubeId(youtubeUrl)}
              </p>
              <p className="text-xs">
                <strong>Embed URL:</strong> https://youtube.com/embed/{extractYouTubeId(youtubeUrl)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✅ SAVE BUTTON */}
      <button
        onClick={saveBanner}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Banner"}
      </button>
    </div>
  );
};

export default BannerManager;