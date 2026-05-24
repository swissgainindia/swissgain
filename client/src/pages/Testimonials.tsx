import React, { useEffect, useState, useRef } from 'react';

import Test1 from '@/images/testimonials/test1.png';
import Test2 from '@/images/testimonials/test2.png';
import Test3 from '@/images/testimonials/test3.png';
import Test4 from '@/images/testimonials/test4.png';
import Test5 from '@/images/testimonials/test5.png';
import Test6 from '@/images/testimonials/test6.png';
import Test7 from '@/images/testimonials/test7.png';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      rating: '★★★★★',
      text: "I love the look of real jewellery, but I can't afford it. Your imitation pieces are so elegant and realistic!",
      image: Test1,
    },
    {
      id: 2,
      name: 'Nidhi Patel',
      rating: '★★★★★',
      text: "I'm always on the lookout for new and interesting jewellery. Your collection never disappoints!",
      image: Test2,
    },
    {
      id: 3,
      name: 'Akash Mishra',
      rating: '★★★★★',
      text: "I'm always on the lookout for unique and affordable jewellery. Your pieces are perfect for gifting!",
      image: Test3,
    },
    {
      id: 4,
      name: 'Anjali Desai',
      rating: '★★★★★',
      text: "The craftsmanship of the imitation jewellery is outstanding. It looks just like the real thing!",
      image: Test4,
    },
    {
      id: 5,
      name: 'Priya Patel',
      rating: '★★★★☆',
      text: "Good variety and quick delivery. The jewellery exceeded expectations in terms of quality.",
      image: Test5,
    },
    {
      id: 6,
      name: 'Rahul Jain',
      rating: '★★★★★',
      text: "Absolutely thrilled with my purchase! The designs are trendy and perfect for any occasion.",
      image: Test6,
    },
    {
      id: 7,
      name: 'Vikram Mehta',
      rating: '★★★★☆',
      text: "Impressed with the range of options. The customer service was helpful and responsive.",
      image: Test7,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const testimonialRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle testimonial navigation with direction
  const goToTestimonial = (index: number, dir: 'left' | 'right') => {
    setDirection(dir);
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setDirection('right');
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  // Animation for testimonial cards
  useEffect(() => {
    testimonialRefs.current.forEach((ref, index) => {
      if (ref) {
        if (index === currentIndex) {
          ref.classList.remove('opacity-0', 'scale-90', '-translate-x-full', 'translate-x-full');
          ref.classList.add('opacity-100', 'scale-100', 'translate-x-0');
        } else {
          ref.classList.remove('opacity-100', 'scale-100', 'translate-x-0');
          ref.classList.add('opacity-0', 'scale-90');
          
          if (index < currentIndex) {
            ref.classList.add('-translate-x-full');
          } else {
            ref.classList.add('translate-x-full');
          }
        }
      }
    });
  }, [currentIndex]);

  return (
    <section className="relative px-4 py-6 bg-gradient-to-b from-[#faf2e6] to-[#f8e9d5] overflow-hidden h-[750px]">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-10 h-10 opacity-10">
        <svg viewBox="0 0 100 100" className="text-amber-900">
          <path d="M50,0 L60,40 L100,50 L60,60 L50,100 L40,60 L0,50 L40,40 Z" fill="currentColor"/>
        </svg>
      </div>
      <div className="absolute bottom-10 right-10 w-32 h-32 opacity-10">
        <svg viewBox="0 0 100 100" className="text-amber-900">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10 h-[200px]">
        {/* Section header */}
        <div className="text-center mb-5">
          {/* <h2 className="text-4xl md:text-5xl font-serif font-bold text-amber-900 mb-4">
            TESTIMONIALS
          </h2> */}
      
          <p className="text-4xl text-amber-800 font-serif font-bold max-w-2xl mx-auto">
            What Our Customers Say
          </p>
              <div className="w-24 h-1 bg-amber-600 mx-auto mb-6 mt-5"></div>
        </div>

        {/* Main testimonial card */}
<div className="relative h-[350px] mb-0">  {/* FIX: give height */}
  {testimonials.map((testimonial, index) => (
    <div
      key={testimonial.id}
      ref={el => testimonialRefs.current[index] = el}
      className={`absolute top-10 left-0 w-full transition-all duration-700 ease-in-out transform ${
        index === currentIndex ? 'z-10 opacity-100 scale-100 translate-x-0' : 'z-0 opacity-0 scale-90'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start max-w-4xl mx-auto h-full">
        {/* Customer image */}
        <div className="relative mb-6 md:mb-0 md:mr-8 flex-shrink-0">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-amber-200 shadow-lg">
            <img
              src={testimonial.image}
              alt={testimonial.name}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="absolute -inset-3 rounded-full border-2 border-amber-400 opacity-50"></div>
        </div>

        {/* Testimonial content */}
        <div className="text-center md:text-left">
          <div className="text-amber-500 text-2xl mb-4">{testimonial.rating}</div>
          <p className="text-gray-700 text-lg md:text-xl mb-6 leading-relaxed italic">
            "{testimonial.text}"
          </p>
          <div className="text-amber-900 font-serif font-semibold text-xl">
            {testimonial.name}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

        {/* Navigation controls */}
        <div className="flex justify-center items-center space-x-4 mb-5">
          <button
            onClick={() => goToTestimonial(
              currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1, 
              'left'
            )}
            className="p-3 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Previous testimonial"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index, index > currentIndex ? 'right' : 'left')}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-amber-600 scale-125' 
                    : 'bg-amber-300 hover:bg-amber-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={() => goToTestimonial(
              (currentIndex + 1) % testimonials.length, 
              'right'
            )}
            className="p-3 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Next testimonial"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Additional testimonials grid (small cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div 
              key={testimonial.id} 
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-amber-100"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-amber-200">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="object-cover w-full h-full"
                    width={48}
                    height={48}
                  />
                </div>
                <div>
                  <div className="text-amber-500">{testimonial.rating}</div>
                  <div className="font-semibold text-amber-900">{testimonial.name}</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm italic">"{testimonial.text.substring(0, 80)}..."</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;