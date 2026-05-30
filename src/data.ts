import { Product, Customization } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "emerald-royal",
    title: "Maisha's Royal Emerald Borka",
    slug: "emerald-royal-borka",
    sku: "MBH-EM-01",
    description: "Our signature masterpiece. Tailored from original Dubai Georgette Chery fabric. Features delicate, handcrafted gold bullion embroidery along the heavy flare lower border and balloon bell cuffs. Exudes deep modesty, grace, and professional Islamic flair. Includes a matching premium double-layer soft georgette hijab.",
    shortDescription: "Original Dubai Chery fabric with luxury gold embroidery. Master craftsmanship.",
    price: 3850,
    discountPrice: 3450,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Emerald Green", "Soft Gold", "Royal Navy"],
    sizes: ["52", "54", "56", "58"],
    inventory: 15,
    rating: 4.9,
    reviewsCount: 12,
    category: "Borka",
    isFeatured: true,
    isTrending: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "dubai-kaftan",
    title: "Classic Midnight Dubai Abaya Kaftan",
    slug: "classic-dubai-kaftan",
    sku: "MBH-DK-02",
    description: "An elegant, loose-fitting Kaftan tailored from the finest, sweat-wicking breathable Dubai Chery fabric. Ideal for daily formal modesty, university presentation layers, or active outdoor walks. Completed with delicate gold-plated snap-on inner buttons and elegant wide batwing modesty sleeves.",
    shortDescription: "Premium ultra-breathable batwing Abaya. Elegant slate accents.",
    price: 2900,
    discountPrice: 2600,
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Midnight Black", "Deep Teal", "Slate Gray"],
    sizes: ["52", "54", "56", "58"],
    inventory: 24,
    rating: 4.7,
    reviewsCount: 8,
    category: "Abaya",
    isFeatured: true,
    isNewArrival: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "luxury-gold",
    title: "Luxury Soft Gold Premium Embroidered Kaftan",
    slug: "luxury-gold-kaftan",
    sku: "MBH-LK-03",
    description: "Designed strictly for weddings, Eid festivities, and high-tier elegant celebrations. Crafted with high-grade silk-blend linen fabric in soft cream-beige, decorated with continuous gold zari embroidered floral borders running all down the double-overlapping front panels.",
    shortDescription: "Exquisite Gold Zari Embroidery. Silk-blend linen premium build.",
    price: 4500,
    discountPrice: 3950,
    images: [
      "https://images.unsplash.com/photo-1549064491-62d9bf8ce347?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Soft Gold", "Milky Cream", "Deep Maroon"],
    sizes: ["54", "56", "58"],
    inventory: 8,
    rating: 5.0,
    reviewsCount: 15,
    category: "Kaftan",
    isTrending: true,
    isFlashSale: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "daily-hijab",
    title: "Daily Comfort Breathable linen Hijab",
    slug: "daily-comfort-hijab",
    sku: "MBH-HJ-04",
    description: "Our lighter-than-air premium linen daily hijab designed to keep sisters cool in standard tropical weather. Extremely easy to style without pins, non-slippery, offering maximum coverage with high modesty.",
    shortDescription: "Non-slip lightweight maximum coverage daily linen hijab.",
    price: 450,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
    ],
    colors: ["Emerald Green", "Soft Gold", "Pastel Pink", "Mint Mint"],
    sizes: ["Standard"],
    inventory: 50,
    rating: 4.8,
    reviewsCount: 22,
    category: "Hijab",
    isNewArrival: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "charcoal-duo",
    title: "Regal Charcoal Linen Duo Abaya",
    slug: "regal-charcoal-duo-abaya",
    sku: "MBH-CC-05",
    description: "Contemporary two-tone slate grey Borka accompanied by a integrated drape cowl neck inner. Extremely professional, stylish yet thoroughly modest, double stitched on corners. Made from top-grade wrinkle-free linen.",
    shortDescription: "Wrinkle-free two-tone duo Abaya with cowled neck inner.",
    price: 3200,
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Slate Gray", "Midnight Black"],
    sizes: ["52", "54", "56"],
    inventory: 5,
    rating: 4.6,
    reviewsCount: 4,
    category: "Abaya",
    isFeatured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "velvet-evening",
    title: "Royal Velvet Evening Abaya",
    slug: "royal-velvet-evening-abaya",
    sku: "MBH-VV-06",
    description: "For sisters seeking warmth and regal elegance on cool festive evenings. Crafted from ultra-plush premium micro velvet with high luxury sheen. Embellished with beautiful gold-lace sleeve motifs.",
    shortDescription: "Luxury micro velvet fabric with shimmering gold sleeves.",
    price: 5200,
    discountPrice: 4800,
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Deep Green", "Royal Black"],
    sizes: ["54", "56", "58"],
    inventory: 7,
    rating: 4.9,
    reviewsCount: 19,
    category: "Abaya",
    isFeatured: true,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_CUSTOMIZATION: Customization = {
  id: "global_settings",
  heroTitle: "Elegance Meets Islamic Modesty",
  heroSubtitle: "Explore our premium hand-crafted Borkas, luxurious Abayas, Kaftans and soft-fall Hijabs custom embroidered with threads of genuine soft gold.",
  heroBanners: [
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=1200"
  ],
  accentColor: "#D4AF37", // Soft Gold
  primaryColor: "#0F4C3A", // Dark Emerald Green
  announcementText: "🌟 Eid Mubarak Special Campaign! 15% OFF on Royal Emerald designs. Cash on Delivery nationwide! 🌟",
  aboutText: "Maisha Borka House was established with a singular pious vision: to empower modern Muslim women with premium, luxurious Islamic modest wear without compromising on textile quality, fabric comfort, or contemporary elegance. From Dhanmondi with love, we serve thousands of proud sisters across Bangladesh.",
  companyName: "Maisha Pearl Borka Store",
  companyLogoUrl: "/src/assets/images/maisha_pearl_logo_1780103575455.png",
  companyHelpline: "+880 1570-297347",
  companyGmail: "mahashinshinhamahin135@gmail.com",
  companyWhatsapp: "01570297347",
  customFields: [
    { id: "f1", key: "শো-রুম লোকেশন (Dhanmondi HQ)", value: "Road No. 27, Dhanmondi, Dhaka" },
    { id: "f2", key: "ডেলিভারি পার্টনার (Courier Partner)", value: "Pathao, RedX Delivery Services" }
  ]
};

export const INSTAGRAM_PHOTOS = [
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1549064491-62d9bf8ce347?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
];

export const BLOG_POSTS = [
  {
    id: "blog-1",
    title: "The Ultimate Modesty Guide: Dubai Georgette vs Cherry Fabric",
    summary: "Understand the structural differences, breathability ratios, and drape aesthetics between original Dubai cherry fabric and premium georgette under hot climates.",
    date: "2026-05-20",
    author: "Sister Maisha"
  },
  {
    id: "blog-2",
    title: "How to Keep Your Soft Gold Bullion Needlework Brand New",
    summary: "Step-by-step guidance on gentle washing, flat laying, steam heat values, and storage options for luxury gold embroidered Borkas and kaftans.",
    date: "2026-05-25",
    author: "Sister Maisha"
  }
];
