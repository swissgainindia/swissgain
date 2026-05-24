import React, { useEffect, useState } from "react";
import banner1 from "@/images/banner-luxury-2.png"
import banner2 from "@/images/banner/banner-luxury.jpg"


const slides = [
  {
    id: 1,
    image: banner1, // replace with your image path
    title: "Stunning every Ear",
    description: "Discover timeless gold & diamond jewellery.",
    button: "Shop Now",
  },
  {
    id: 2,
    image: banner2,
    title: "Elegance Redefined",
    description: "Modern designs for every occasion.",
    button: "Explore",
  },
  
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000); // auto scroll every 4 sec
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[90vh] overflow-hidden  shadow-lg">
      {/* Slides */}
      <div
        className="flex transition-transform ease-in-out duration-700"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="w-full h-[100vh] flex-shrink-0 relative"
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-start px-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                {slide.title}
              </h2>
              <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-lg">
                {slide.description}
              </p>
              <button className="mt-6 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl shadow-md hover:bg-gray-200 transition">
                {slide.button}
              </button>
            </div> */}
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-6 w-full flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition ${
              current === index ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
