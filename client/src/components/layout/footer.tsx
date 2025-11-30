import { Gem, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from "@/images/logo-white.png";
import {useState} from 'react';




export default function Footer() {

   const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && isValidEmail(email)) {
      setIsSubscribed(true);
      // Here you would typically send the email to your backend
      console.log('Subscribed with email:', email);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleReset = () => {
    setEmail('');
    setIsSubscribed(false);
  };

  return (
    <footer className="bg-[#300708] text-background mx-2 mb-2 rounded-2xl">
      <div className='flex justify-center'>
        <img src="https://stores.tanishq.co.in/static/media/top-bottom-border-curve.3ba34b4d22b39e10b926.webp" alt="" />
      </div>
      <div className='py-16'>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              {/* Logo */}
              <div className="flex justifiy-start items-center space-x-0">
                <img
                  src={Logo}
                  alt="LuxeChains Logo"
                  width={120}
                  height={120}
                  className="object-contain"
                />
                <h1 className="text-2xl font-serif font-bold text-white">Swissgain</h1>
              </div>
              {/* <div className="text-2xl font-bold flex items-center">
              <Gem className="mr-2 h-6 w-6" />
              SwissGain
            </div> */}
              <p className="text-muted text-sm leading-relaxed">
                Premium Swiss jewelry crafted with precision and elegance. Experience luxury that defines your style.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-background hover:text-accent p-2">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-background hover:text-accent p-2">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-background hover:text-accent p-2">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-background hover:text-accent p-2">
                  <Linkedin className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-background">Quick Links</h4>
              <ul className="space-y-2 text-muted text-sm">
                <li>
                  <Link href="/" className="hover:text-accent transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/product" className="hover:text-accent transition-colors">
                    Product
                  </Link>
                </li>
                <li>
                  <Link href="/affiliate" className="hover:text-accent transition-colors">
                    Affiliate Program
                  </Link>
                </li>
                <li>
                  <Link href="/refer-earn" className="hover:text-accent transition-colors">
                    Refer & Earn
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-background">Support</h4>
              <ul className="space-y-2 text-muted text-sm">
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Shipping Info
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Returns
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div className="newsletter-container">
              <div className="newsletter-header">
                <div className="newsletter-icon">
                  <i className="fas fa-paper-plane"></i>
                </div>
                <h4 className="font-semibold mb-2 text-background">Stay in the Loop</h4>
                <p className="text-muted mb-4 text-sm">
                  Join our newsletter for exclusive offers, updates, and creative inspiration.
                </p>
              </div>

              {!isSubscribed ? (
                <form onSubmit={handleSubmit} className="newsletter-form">
                  <div className={`input-group ${isFocused ? 'focused' : ''}`}>
                    <i className="input-icon fas fa-envelope"></i>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Enter your email"
                      className="input-field"
                      data-testid="input-newsletter-email"
                      required
                    />
                    <div className="input-decoration">
                      <div className="decoration-dot"></div>
                      <div className="decoration-line"></div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="subscribe-btn"
                    data-testid="button-newsletter-subscribe"
                    disabled={!email || !isValidEmail(email)}
                  >
                    <span>Subscribe Now</span>
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </form>
              ) : (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i>
                  <h3>Thank you for subscribing!</h3>
                  <p>We've sent a confirmation email to {email}</p>
                  <button onClick={handleReset} className="reset-btn">
                    Subscribe another email
                  </button>
                </div>
              )}

              <p className="privacy-note">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
            
          </div>

          <div className="border-t border-gray-100 mt-12 pt-8 text-center text-muted text-sm">
            <p>&copy; 2024 SwissGain. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>

      </div>

      <div className="flex justify-center">
        <img
          src="https://stores.tanishq.co.in/static/media/top-bottom-border-curve.3ba34b4d22b39e10b926.webp"
          alt=""
          className="rotate-180 w-36"
        />
      </div>


    </footer>
  );
}
