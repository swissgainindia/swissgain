import { Product } from '@/types';
import Product1 from '@/images/products/product1.png';
import bangles1 from '@/images/products/bangles/Fashion  Enamel  Meenakari Bangles.jpg';
import bangles2 from '@/images/products/bangles/Glass  Lac Bangles.jpg';
import bracelet1 from '@/images/products/bracelet/Chain Bracelets.jpg';
import bracelet2 from '@/images/products/bracelet/Cuff Bracelet.jpg';
import bridalSets1 from '@/images/products/bridalSets/Diamond Bridal Sets.jpg';
import bridalSets2 from '@/images/products/bridalSets/Full Bridal Sets (Necklace + Earrings + Maang Tikka + Bangles).jpg';
import chain1 from '@/images/products/chain/Box Chain.jpg';
import chain2 from '@/images/products/chain/Pendant Chain.jpg';
import chain3 from '@/images/products/chain/Plain Gold Chain.jpg';
import necklace1 from '@/images/products/necklace/Bib Necklace.jpg';
import necklace2 from '@/images/products/necklace/Diamond  Gemstone Necklace.jpg';
import necklace3 from '@/images/products/necklace/Kundan  Polki Necklace.jpg';
import bridalset1 from '@/images/products/bridalSets/Kundan  Polki  Jadau Bridal Sets.jpg';
import bridalset2 from '@/images/products/bridalSets/Diamond Bridal Sets.jpg';
import weddingSets1 from '@/images/products/weddingSets/Designer Wedding Sets (modern fusion).jpg';
import weddingSets2 from '@/images/products/weddingSets/Regional Styles  Bengali.jpg';


export const products: Product[] = [
  // Necklaces
  {
    id: 'swiss-premium-necklace',
    name: 'Swiss Premium Necklace',
    price: 2999,
    originalPrice: 3999,
    discount: 25,
    image: bangles1,
    images: [
      bangles1,
      
    ],
    category: 'necklaces',
    description: 'Exquisite Swiss-crafted necklace featuring premium materials and timeless design.',
    features: [
      'Premium Swiss-made craftsmanship',
      '24K Gold plated finish',
      'Hypoallergenic materials',
      'Adjustable length (18-22 inches)',
      'Lifetime warranty included'
    ],
    inStock: true,
    rating: 4.9,
    reviews: 127
  },
  {
    id: 'diamond-pendant-necklace',
    name: 'Diamond Pendant Necklace',
    price: 4599,
    originalPrice: 5999,
    discount: 23,
    image: bridalSets1,
    images: [
      bridalSets1,
      
    ],
    category: 'necklaces',
    description: 'Stunning diamond pendant necklace with brilliant cut diamonds and elegant design.',
    features: [
      '0.5 carat diamond pendant',
      '18K white gold chain',
      'Certified diamonds',
      'Secure clasp design',
      'Gift box included'
    ],
    inStock: true,
    rating: 4.8,
    reviews: 89
  },
  {
    id: 'pearl-strand-necklace',
    name: 'Swiss Pearl Strand Necklace',
    price: 3299,
    originalPrice: 4299,
    discount: 23,
    image: chain1,
    images: [
      chain1
    ],
    category: 'necklaces',
    description: 'Classic pearl strand necklace with lustrous cultured pearls.',
    features: [
      'Cultured freshwater pearls',
      'Hand-knotted design',
      '18-inch length',
      'Sterling silver clasp',
      'Elegant presentation box'
    ],
    inStock: true,
    rating: 4.7,
    reviews: 156
  },

  // Earrings
  {
    id: 'diamond-stud-earrings',
    name: 'Diamond Stud Earrings',
    price: 1899,
    originalPrice: 2499,
    discount: 24,
    image: bracelet1,
    images: [
      bracelet1
    ],
    category: 'earrings',
    description: 'Classic diamond stud earrings perfect for everyday elegance.',
    features: [
      '0.25 carat each diamond',
      '14K white gold setting',
      'Secure back closure',
      'Conflict-free diamonds',
      'Certificate of authenticity'
    ],
    inStock: true,
    rating: 4.9,
    reviews: 203
  },

  {
    id: 'gold-hoop-earrings',
    name: 'Swiss Gold Hoop Earrings',
    price: 1299,
    originalPrice: 1699,
    discount: 24,
    image: bracelet2,
    images: [
      bracelet2
    ],
    category: 'earrings',
    description: 'Elegant gold hoop earrings with Swiss precision craftsmanship.',
    features: [
      '18K yellow gold',
      'Medium size hoops',
      'Lightweight design',
      'Secure latch closure',
      'Polished finish'
    ],
    inStock: true,
    rating: 4.6,
    reviews: 178
  },
  {
    id: 'pearl-drop-earrings',
    name: 'Pearl Drop Earrings',
    price: 899,
    originalPrice: 1199,
    discount: 25,
    image: necklace1,
    images: [
      necklace1
    ],
    category: 'earrings',
    description: 'Graceful pearl drop earrings with sophisticated appeal.',
    features: [
      'Cultured pearls',
      'Sterling silver posts',
      'Elegant drop design',
      'Hypoallergenic',
      'Gift ready packaging'
    ],
    inStock: true,
    rating: 4.8,
    reviews: 142
  },

  // Rings
  {
    id: 'diamond-engagement-ring',
    name: 'Diamond Engagement Ring',
    price: 8999,
    originalPrice: 11999,
    discount: 25,
    image: weddingSets1,
    images: [
      weddingSets1
    ],
    category: 'rings',
    description: 'Stunning diamond engagement ring with exceptional brilliance.',
    features: [
      '1 carat center diamond',
      'Platinum band',
      'Ideal cut diamond',
      'VS1 clarity grade',
      'GIA certified'
    ],
    inStock: true,
    rating: 5.0,
    reviews: 67
  },
  {
    id: 'gold-wedding-band',
    name: 'Swiss Gold Wedding Band',
    price: 1599,
    originalPrice: 1999,
    discount: 20,
    image: bridalset1,
    images: [
      bridalset1
    ],
    category: 'rings',
    description: 'Classic gold wedding band symbolizing eternal love.',
    features: [
      '18K yellow gold',
      '4mm width',
      'Comfort fit design',
      'Polished finish',
      'Lifetime warranty'
    ],
    inStock: true,
    rating: 4.9,
    reviews: 234
  },
  {
    id: 'sapphire-cocktail-ring',
    name: 'Sapphire Cocktail Ring',
    price: 3299,
    originalPrice: 4299,
    discount: 23,
    image: bangles2,
    images: [
      bangles2
    ],
    category: 'rings',
    description: 'Bold sapphire cocktail ring perfect for special occasions.',
    features: [
      '3 carat blue sapphire',
      'Diamond accents',
      '14K white gold',
      'Statement design',
      'Certified gemstone'
    ],
    inStock: true,
    rating: 4.7,
    reviews: 98
  },

  // Bracelets
  {
    id: 'tennis-bracelet',
    name: 'Diamond Tennis Bracelet',
    price: 5999,
    originalPrice: 7999,
    discount: 25,
    image: bridalSets2,
    images: [
      bridalSets2
    ],
    category: 'bracelets',
    description: 'Exquisite diamond tennis bracelet with continuous brilliance.',
    features: [
      '2 carat total weight',
      'Round brilliant diamonds',
      '14K white gold',
      'Secure clasp',
      'Professional setting'
    ],
    inStock: true,
    rating: 4.8,
    reviews: 76
  },
  {
    id: 'gold-charm-bracelet',
    name: 'Swiss Gold Charm Bracelet',
    price: 1899,
    originalPrice: 2399,
    discount: 21,
    image: chain2,
    images: [
      chain2
    ],
    category: 'bracelets',
    description: 'Charming gold bracelet perfect for personal expression.',
    features: [
      '18K yellow gold',
      'Multiple charm attachments',
      'Adjustable length',
      'Secure lobster clasp',
      'Swiss craftsmanship'
    ],
    inStock: true,
    rating: 4.6,
    reviews: 123
  },

  // Jewelry Sets
  {
    id: 'bridal-jewelry-set',
    name: 'Bridal Jewelry Set',
    price: 12999,
    originalPrice: 16999,
    discount: 24,
    image: necklace2,
    images: [
      necklace2
    ],
    category: 'sets',
    description: 'Complete bridal jewelry set for your special day.',
    features: [
      'Necklace, earrings & bracelet',
      'Matching design',
      'Pearl and crystal details',
      'Sterling silver base',
      'Luxury gift box'
    ],
    inStock: true,
    rating: 4.9,
    reviews: 45
  },
  {
    id: 'everyday-gold-set',
    name: 'Everyday Gold Set',
    price: 4599,
    originalPrice: 5999,
    discount: 23,
    image: bridalset2,
    images: [
      bridalset2
    ],
    category: 'sets',
    description: 'Perfect gold jewelry set for everyday elegance.',
    features: [
      'Pendant necklace & earrings',
      '14K yellow gold',
      'Minimalist design',
      'Comfortable wear',
      'Coordinated styling'
    ],
    inStock: true,
    rating: 4.7,
    reviews: 189
  },

  // Chains
  {
    id: 'swiss-gold-chain',
    name: 'Swiss Gold Chain',
    price: 2199,
    originalPrice: 2799,
    discount: 21,
    image: weddingSets2,
    images: [
      weddingSets2
    ],
    category: 'chains',
    description: 'Premium Swiss-made gold chain for versatile styling.',
    features: [
      '18K yellow gold',
      'Rope chain design',
      '20-inch length',
      'Secure clasp',
      'Swiss precision'
    ],
    inStock: true,
    rating: 4.8,
    reviews: 167
  },
  {
    id: 'swiss-gold-chain-1',
    name: 'Swiss Gold Chain',
    price: 2199,
    originalPrice: 2799,
    discount: 21,
    image: chain3,
    images: [
      chain3
    ],
    category: 'chains',
    description: 'Premium Swiss-made gold chain for versatile styling.',
    features: [
      '18K yellow gold',
      'Rope chain design',
      '20-inch length',
      'Secure clasp',
      'Swiss precision'
    ],
    inStock: true,
    rating: 4.8,
    reviews: 167
  },
  {
    id: 'gold-charm-bracelet-1',
    name: 'Swiss Gold Charm Bracelet',
    price: 1899,
    originalPrice: 2399,
    discount: 21,
    image: necklace3,
    images: [
      necklace3
    ],
    category: 'bracelets',
    description: 'Charming gold bracelet perfect for personal expression.',
    features: [
      '18K yellow gold',
      'Multiple charm attachments',
      'Adjustable length',
      'Secure lobster clasp',
      'Swiss craftsmanship'
    ],
    inStock: true,
    rating: 4.6,
    reviews: 123
  }

];

export const getProductsByCategory = (category: string) => {
  return products.filter(product => product.category === category);
};

export const getProductById = (id: string) => {
  return products.find(product => product.id === id);
};

export const getFeaturedProducts = () => {
  return products.slice(0, 8);
};