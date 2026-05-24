import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product-card';
import { products, getFeaturedProducts } from '@/data/products';
import { Star, Shield, Truck, ShoppingBag, Handshake, ChevronRight, Crown, Award, Users } from 'lucide-react';
import Banner1 from "@/images/banner-luxury-2.png"
import Ticker from './Ticker';
import { motion } from "framer-motion";
import DiamondJewellery from './DiamondJewellery';
import HandwearGallery from './HandwearGallery';
import NewArrivals from './NewArrivals';
import Testimonials from './Testimonials';
import Hero from './hero'
import HeroSection from './heroSection';
import FeaturedProductsSection from './FeaturedProductsSection'

export default function Home() {
  return (
    <div>
      <HeroSection />

     


      <Ticker />


      {/* Diamond Jewellery section */}
      <DiamondJewellery />

      <NewArrivals />


      {/* Product Categories */}
      {/* <section className="py-20 bg-[#f9f0eb82]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Shop by Category</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our exquisite collection of Swiss-crafted jewelry across all categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
            {[
              { name: 'Necklaces', href: '/products?category=necklaces', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300' },
              { name: 'Earrings', href: '/products?category=earrings', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300' },
              { name: 'Rings', href: '/products?category=rings', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300' },
              { name: 'Bracelets', href: '/products?category=bracelets', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300' },
              { name: 'Sets', href: '/products?category=sets', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300' },
              { name: 'Chains', href: '/products?category=chains', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300' }
            ].map((category) => (
              <Link key={category.name} href={category.href}>
                <div className="group cursor-pointer text-center">
                  <div className="relative overflow-hidden rounded-full w-24 h-24 mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section> */}

      <FeaturedProductsSection />

      {/* Featured Products */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-4 font-primary">Featured Products</h2>
              <p className="text-xl text-muted-foreground">
                Handpicked selections from our premium collection
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="hidden md:flex items-center" data-testid="button-view-all-products">
                View All Products
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {getFeaturedProducts().map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center md:hidden">
            <Link href="/products">
              <Button variant="outline" data-testid="button-view-all-mobile">
                View All Products
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      <HandwearGallery />
      <Testimonials />


      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose SwissGain?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the finest in Swiss jewelry craftsmanship with our premium neckchain collection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-card rounded-2xl shadow-lg">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl mx-auto mb-6">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Premium Quality</h3>
              <p className="text-muted-foreground">Handcrafted with the finest materials and precision that SwissGain is renowned for worldwide.</p>
            </div>

            <div className="text-center p-8 bg-card rounded-2xl shadow-lg">
              <div className="bg-accent text-accent-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl mx-auto mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Swiss Craftsmanship</h3>
              <p className="text-muted-foreground">Each piece is meticulously crafted in Switzerland, ensuring unparalleled quality and durability.</p>
            </div>

            <div className="text-center p-8 bg-card rounded-2xl shadow-lg">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl mx-auto mb-6">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Free Worldwide Shipping</h3>
              <p className="text-muted-foreground">Enjoy complimentary shipping on all orders with secure packaging and tracking included.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-[#F9F6F2] text-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#C5A572]">
              Trusted by Thousands Worldwide
            </h2>
            <p className="text-xl text-[#6B6B6B] max-w-2xl mx-auto">
              Join our growing community of satisfied customers and successful affiliates
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-[#1A1A1A]" data-testid="text-stat-customers">50,000+</div>
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-[#C5A572] mr-2" />
                <span className="text-[#6B6B6B]">Happy Customers</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-[#1A1A1A]" data-testid="text-stat-products">100+</div>
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-6 w-6 text-[#C5A572] mr-2" />
                <span className="text-[#6B6B6B]">Premium Products</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-[#1A1A1A]" data-testid="text-stat-affiliates">5,000+</div>
              <div className="flex items-center justify-center mb-2">
                <Handshake className="h-6 w-6 text-[#C5A572] mr-2" />
                <span className="text-[#6B6B6B]">Active Affiliates</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-[#1A1A1A]" data-testid="text-stat-rating">4.9★</div>
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-[#C5A572] mr-2" />
                <span className="text-[#6B6B6B]">Average Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1A1A1A]">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-[#6B6B6B] mb-8">
            Join thousands of satisfied customers and affiliate partners worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button className="bg-[#C5A572] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#A8895D]" data-testid="button-shop-now-cta">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Now
              </Button>
            </Link>
            <Link href="/affiliate">
              <Button variant="outline" className="border-2 border-[#C5A572] text-[#C5A572] px-8 py-3 rounded-full font-semibold hover:bg-[#C5A572] hover:text-white" data-testid="button-become-affiliate-cta">
                <Handshake className="mr-2 h-5 w-5" />
                Become an Affiliate
              </Button>
            </Link>
          </div>
        </div>
      </section>



    </div>
  );
}
