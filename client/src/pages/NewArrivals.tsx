'use client';
import React from 'react';
import Arrivals1 from '@/images/newarrivals/arrivals1 (2).png'; // Rings full banner image
import Arrivals2 from '@/images/newarrivals/arrivals2.png'; // Mangalsutra
import Arrivals3 from '@/images/newarrivals/arrivals3.png'; // Pendants

const NewArrivals: React.FC = () => {
  return (
    <section className="bg-[#c4b8ab] pb-20">
      {/* Full-width Top Ring Image with Text Overlay */}
      <div className="w-full h-[400px] relative">
        <img
          src={Arrivals1}
          alt="Rings"
          className="object-cover w-full h-full absolute inset-0"
        />

        {/* Text Overlay Container - Positioned at top left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgb(41_1_0/90%)] via-[rgb(141_92_92/50%)] to-transparent">
          <div className="h-full flex items-start pt-12 pl-6 md:pl-12 lg:pl-20">
            <div className="text-white max-w-lg">
              <h2 className="text-4xl md:text-5xl font-serif mb-4">New Chain Arrivals</h2>
              <p className="text-xl md:text-2xl font-serif italic mb-4">Fresh Picks Daily</p>
              <p className="text-lg md:text-xl font-serif mb-6">
                Bold. Sleek. Timeless. Unveil New Chain Styles Dropping Daily, Monday to Friday.
              </p>
              <div className="inline-flex items-center bg-white/30 px-4 py-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm14 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0117 8zm-8.121 9.182a.75.75 0 01.878.576l.75 3a.75.75 0 11-1.454.364l-.75-3a.75.75 0 01.576-.878zm4.242 0a.75.75 0 00-.878.576l-.75 3a.75.75 0 101.454.364l.75-3a.75.75 0 00-.576-.878zM5.05 15.95a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.062 1.061l-1.06-1.061a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM12 18a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 18z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold text-sm">500+ New Items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid in White Card */}
      <div className="relative z-10 -mt-12 max-w-[1180px] mx-auto bg-white rounded-xl px-6 md:px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 - Mangalsutra */}
        <div className="relative w-full h-[300px] md:h-[300px] overflow-hidden rounded-xl">
          <img
            src={Arrivals2}
            alt="Mangalsutra"
            className="object-cover w-full h-full absolute inset-0"
            loading="lazy"
          />
          <p className="absolute bottom-5 left-5 text-white text-xl font-serif">Mangalsutra</p>
        </div>

        {/* Card 2 - Pendants */}
        <div className="relative w-full h-[300px] md:h-[300px] overflow-hidden rounded-xl">
          <img
            src={Arrivals3}
            alt="Pendants"
            className="object-cover w-full h-full absolute inset-0"
            loading="lazy"
          />
          <p className="absolute bottom-5 left-5 text-white text-xl font-serif">Pendants</p>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
