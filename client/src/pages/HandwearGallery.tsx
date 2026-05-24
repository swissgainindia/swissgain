import React from 'react';
import Gchain1 from '@/images/handwear/gchain1.png';
import Gchain2 from '@/images/handwear/gchain2.png';
import Gchain3 from '@/images/handwear/gchain3.png';
import Gchain4 from '@/images/handwear/gchain4.png';

const HandwearGallery: React.FC = () => {
  return (
    <div className="flex items-center justify-center mx-auto">
      <div className="text-center">
        <h2 className="text-3xl sm:text-3xl font-semibold tracking-wide text-[#7b3306] mt-8">
          Necklaces Collection
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px] px-6 py-6">
          {[Gchain1, Gchain2, Gchain3, Gchain4].map((image, index) => (
            <div
              key={index}
              className="w-[250px] h-[370px] relative overflow-hidden transition-transform duration-300 hover:scale-105"
            >
              <img
                src={image}
                alt={`Necklace ${index + 1}`}
                className="object-cover w-full h-full absolute inset-0"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HandwearGallery;
