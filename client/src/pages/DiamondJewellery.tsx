import React from 'react';
import Chain from '@/images/products/chain.png';
import Chain2 from '@/images/products/chain2.png';
import Chain3 from '@/images/products/chain3.png';
import Chain4 from '@/images/products/chain4.png';
import Chain5 from '@/images/products/chain5.png';

const DiamondJewellery: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-10 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 sm:mb-4 text-[#7b3306] font-serif">
                Gold Jewellery
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-10 text-[#7b3306]">
                Shine through every celebration with the glow of timeless gold.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left large image spanning 3 rows on md+ screens */}
                <div className="md:row-span-3">
                    <div className="relative w-full h-[700px] rounded-md overflow-hidden">
                        <img
                            src={Chain}
                            alt="Statement Necklace"
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>

                {/* 2x2 grid of smaller images on the right */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[Chain2, Chain3, Chain4, Chain5].map((img, index) => (
                        <div
                            key={index}
                            className="relative w-full h-[340px] rounded-md overflow-hidden"
                        >
                            <img
                                src={img}
                                alt={`Diamond piece ${index + 2}`}
                                className="object-cover w-full h-full"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiamondJewellery;
