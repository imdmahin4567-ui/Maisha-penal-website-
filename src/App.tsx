import React, { useState, useEffect, useRef } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  ShoppingBag, 
  User, 
  Settings, 
  Search, 
  MessageSquare, 
  Heart, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Minus, 
  Trash2, 
  PlusCircle,
  Check, 
  Truck, 
  Tag, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  LogOut, 
  X, 
  Database, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Activity, 
  Sliders, 
  Eye, 
  BookOpen, 
  Send, 
  RefreshCw, 
  Download, 
  Palette, 
  Bell, 
  Upload,
  ShoppingBag as CartIcon
} from "lucide-react";

import { 
  db, 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  handleFirestoreError,
  testConnection
} from "./lib/firebase";

import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  onSnapshot, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  deleteDoc
} from "firebase/firestore";

import { 
  Product, 
  Order, 
  Review, 
  Customization, 
  CartItem, 
  OperationType 
} from "./types";

import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMIZATION, 
  INSTAGRAM_PHOTOS, 
  BLOG_POSTS 
} from "./data";

export default function App() {
  // Global States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customization, setCustomization] = useState<Customization>(INITIAL_CUSTOMIZATION);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'shop' | 'cart' | 'profile' | 'admin'>('home');
  
  // Navigation & Siting Ref modifiers
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  // Cart & Orders
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');
  const [promoCode, setPromoCode] = useState<string>("");
  const [activeDiscount, setActiveDiscount] = useState<number>(0); // Percentage
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Dhaka",
    district: "",
    notes: ""
  });
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  
  // Admin collection buffers
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [dbReviews, setDbReviews] = useState<Review[]>([]);
  
  // Sizing and AI Advisor triggers
  const [showSizingModal, setShowSizingModal] = useState<boolean>(false);
  const [advisorForm, setAdvisorForm] = useState({
    skinTone: "Warm Wheatish",
    size: "54",
    occasion: "Eid Festive",
    favoriteColor: "Emerald Green"
  });
  const [aiStylingResult, setAiStylingResult] = useState<string>("");
  const [aiStylingLoading, setAiStylingLoading] = useState<boolean>(false);

  // Chatbot drawer state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{sender: 'user' | 'assistant', text: string}>>([
    { sender: 'assistant', text: "Assalamu Alaikum sister! I am Sister Maisha's AI advisor. Ask me anything about our Dubai Cherry fabric weaves, sizing guides, or active promotions." }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Admin insights
  const [adminInsights, setAdminInsights] = useState<string>("");
  const [adminInsightsLoading, setAdminInsightsLoading] = useState<boolean>(false);
  const [inventoryPrediction, setInventoryPrediction] = useState<string>("");
  const [marketingCopy, setMarketingCopy] = useState<string>("");
  const [marketingLoading, setMarketingLoading] = useState<boolean>(false);
  const [activeCampaign, setActiveCampaign] = useState({ name: "Eid Luxury Borka festival", discount: 15 });

  // Customization Form values
  const [custForm, setCustForm] = useState<Customization>(INITIAL_CUSTOMIZATION);
  const [newFieldKey, setNewFieldKey] = useState<string>("");
  const [newFieldValue, setNewFieldValue] = useState<string>("");

  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) {
      alert("দয়া করে ইনফরমেশন টাইটেল বা ভ্যালু দুটিই পূরণ করুন!");
      return;
    }
    const updatedCustomFields = [
      ...(custForm.customFields || []),
      {
        id: "field-" + Date.now(),
        key: newFieldKey.trim(),
        value: newFieldValue.trim()
      }
    ];
    setCustForm({
      ...custForm,
      customFields: updatedCustomFields
    });
    setNewFieldKey("");
    setNewFieldValue("");
  };

  const handleDeleteCustomField = (id: string) => {
    const updatedCustomFields = (custForm.customFields || []).filter(f => f.id !== id);
    setCustForm({
      ...custForm,
      customFields: updatedCustomFields
    });
  };

  // Firebase integration status
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Admin Interactive Sub-tabs States
  const [adminSubTab, setAdminSubTab] = useState<'overview' | 'orders' | 'products' | 'branding' | 'ai_ops'>('overview');
  const [selectedAdminOrder, setSelectedAdminOrder] = useState<Order | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [searchAdminQuery, setSearchAdminQuery] = useState<string>("");
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'>('all');
  
  // CSV Import States
  const [showCsvImporter, setShowCsvImporter] = useState<boolean>(false);
  const [csvText, setCsvText] = useState<string>("");
  const [isImportingCsv, setIsImportingCsv] = useState<boolean>(false);

  // Custom premium CSV parser that handles quoted commas
  const handleImportCsv = async () => {
    if (!csvText.trim()) {
      alert("উইন্ডোতে অন্তত কিছু CSV ডাটা পেস্ট করুন অথবা ফাইল লোড করুন!");
      return;
    }

    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert("CSV ফাইলে কমপক্ষে একটি হেডার লাইন এবং একটি ডাটা লাইন থাকতে হবে!");
      return;
    }

    setIsImportingCsv(true);

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      // Remove starting/ending quotes if exists
      return result.map(col => col.replace(/^"(.*)"$/, '$1'));
    };

    try {
      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
      
      let importedCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;

        // Extract values mapping with headers
        const getVal = (field: string, defaultVal: string = ""): string => {
          const idx = headers.indexOf(field.toLowerCase());
          if (idx !== -1 && idx < row.length) {
            return row[idx];
          }
          return defaultVal;
        };

        const title = getVal("title", "");
        const sku = getVal("sku", "");
        if (!title || !sku) {
          errorCount++;
          continue;
        }

        const category = getVal("category", "Borka");
        const price = Number(getVal("price", "3200"));
        const discountPrice = Number(getVal("discountPrice", "0")) || undefined;
        const inventory = Number(getVal("inventory", "15"));
        const colors = getVal("colors", "Emerald Green, Midnight Black").split(",").map(c => c.trim()).filter(Boolean);
        const sizes = getVal("sizes", "52, 54, 56, 58").split(",").map(s => s.trim()).filter(Boolean);
        const imageUrl = getVal("imageUrl", "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600");
        const shortDescription = getVal("shortDescription", "Premium handtailored original Dubai fabric with custom embroidery.");
        const description = getVal("description", "Premium quality traditional design with outstanding draping feel.");

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const generatedId = "prod-" + Math.floor(100000 + Math.random() * 90000) + "-" + category.toLowerCase();

        const pObj: Product = {
          id: generatedId,
          title,
          slug,
          sku,
          category,
          price,
          discountPrice,
          inventory,
          colors: colors.length > 0 ? colors : ["Emerald Green"],
          sizes: sizes.length > 0 ? sizes : ["52", "54", "56", "58"],
          images: [imageUrl],
          shortDescription,
          description,
          rating: 4.8,
          reviewsCount: 5,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "products", generatedId), pObj);
        importedCount++;
      }

      alert(`আলহামদুলিল্লাহ! CSV ইম্পোর্ট সফল হয়েছে।\nসফলভাবে যোগ করা হয়েছে: ${importedCount} টি পণ্য\nত্রুটিপূর্ণ বা বাদ পড়া পণ্য: ${errorCount} টি`);
      setCsvText("");
      setShowCsvImporter(false);
    } catch (err: any) {
      alert("CSV কোড পার্স বা ডাটাবেজ রাইট করার সময় সমস্যা হয়েছে: " + err.message);
    } finally {
      setIsImportingCsv(false);
    }
  };

  // New/Edit product form state
  const [prodForm, setProdForm] = useState({
    title: "",
    sku: "",
    category: "Borka",
    price: 3200,
    discountPrice: 2800,
    inventory: 15,
    description: "",
    imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600",
    colors: "Emerald Green, Midnight Black",
    sizes: "52, 54, 56, 58",
    shortDescription: "Premium handtailored original Dubai fabric with custom embroidery."
  });

  const prepareEditProduct = (prod: Product) => {
    setIsEditingProduct(prod);
    setProdForm({
      title: prod.title,
      sku: prod.sku,
      category: prod.category,
      price: prod.price,
      discountPrice: prod.discountPrice || 0,
      inventory: prod.inventory,
      description: prod.description || "",
      imageUrl: prod.images[0] || "",
      colors: prod.colors.join(", "),
      sizes: prod.sizes.join(", "),
      shortDescription: prod.shortDescription || ""
    });
    setAdminSubTab('products');
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm("Are you sure you want to remove this product from the catalog? This action is permanent!")) return;
    try {
      await deleteDoc(doc(db, "products", prodId));
      alert("Product successfully deleted from Cloud catalog!");
      // Fallback local update
      setProducts(prev => prev.filter(p => p.id !== prodId));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `products/${prodId}`);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.title || !prodForm.sku) {
      alert("Please provide at least a title and SKU for the product.");
      return;
    }
    const slug = prodForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const colorsArr = prodForm.colors.split(",").map(c => c.trim()).filter(Boolean);
    const sizesArr = prodForm.sizes.split(",").map(s => s.trim()).filter(Boolean);
    
    const newProduct: Product = {
      id: isEditingProduct ? isEditingProduct.id : "prod-" + Math.floor(100000 + Math.random() * 90000) + "-" + prodForm.category.toLowerCase(),
      title: prodForm.title,
      slug: slug,
      sku: prodForm.sku,
      category: prodForm.category,
      price: Number(prodForm.price),
      discountPrice: prodForm.discountPrice ? Number(prodForm.discountPrice) : undefined,
      description: prodForm.description,
      shortDescription: prodForm.shortDescription,
      images: [prodForm.imageUrl],
      colors: colorsArr.length > 0 ? colorsArr : ["Emerald Green"],
      sizes: sizesArr.length > 0 ? sizesArr : ["52", "54", "56", "58"],
      inventory: Number(prodForm.inventory),
      rating: isEditingProduct ? isEditingProduct.rating : 4.8,
      reviewsCount: isEditingProduct ? isEditingProduct.reviewsCount : 5,
      createdAt: isEditingProduct ? isEditingProduct.createdAt : new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "products", newProduct.id), newProduct);
      alert(isEditingProduct ? "Alhamdulillah! Product updated successfully." : "Alhamdulillah! Product added successfully.");
      setIsEditingProduct(null);
      // Reset Form values
      setProdForm({
        title: "",
        sku: "",
        category: "Borka",
        price: 3200,
        discountPrice: 0,
        inventory: 15,
        description: "",
        imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600",
        colors: "Emerald Green, Midnight Black",
        sizes: "52, 54, 56, 58",
        shortDescription: "Premium handtailored original Dubai fabric with custom embroidery."
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `products/${newProduct.id}`);
    }
  };

  // Load current theme dynamically from customization settings
  const themeAccentColor = customization.accentColor || "#D4AF37"; // gold
  const themePrimaryColor = customization.primaryColor || "#0F4C3A"; // emerald

  // Run on first login
  useEffect(() => {
    // Check Firebase Startup Connection Check
    const checkConn = async () => {
      const connResult = await testConnection();
      setIsFirebaseConnected(connResult);
    };
    checkConn();

    // Authenticated State Changed
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        // Is user the bootstrapping administrator?
        if (["imdmahin4567@gmail.com", "mahashinshinhamahin135@gmail.com"].includes(user.email || "")) {
          setIsAdminMode(true);
        }
      } else {
        setCurrentUser(null);
        setIsAdminMode(false);
      }
    });

    // Subscriptions to live database collections (sync with deployed FirestoreRules)
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Product);
      });
      if (items.length > 0) {
        setProducts(items);
      }
    }, (err) => {
      console.warn("Loading initial static products fallback. Firestore status code restrictions may apply.");
    });

    const unsubscribeCustomization = onSnapshot(collection(db, "customization"), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id === "global_settings") {
          const data = doc.data() as Customization;
          setCustomization(data);
          setCustForm(data);
        }
      });
    }, (err) => {
      console.warn("Loading default static customization fallback.");
    });

    const unsubscribeOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      setDbOrders(ordersList);
    }, (err) => {
      // Quietly handled under rules context
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeCustomization();
      unsubscribeOrders();
    };
  }, []);

  // Sync shipping customer email when user changes
  useEffect(() => {
    if (currentUser) {
      setShippingInfo(prev => ({
        ...prev,
        name: currentUser.displayName || "",
        email: currentUser.email || ""
      }));
    }
  }, [currentUser]);

  // Seeding trigger functionality
  const handleSeedDatabase = async () => {
    try {
      // Seed products & customized attributes
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
      await setDoc(doc(db, "customization", "global_settings"), INITIAL_CUSTOMIZATION);
      alert("Alhamdulillah! 6 Premium products and default Global Website Customizations have been successfully seeded to Cloud Firestore!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, "products/seeding");
    }
  };

  // Login handler
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      alert("Failed to authenticate. Please verify in popup console.");
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      setActiveTab('home');
    } catch (err) {
      console.error(err);
    }
  };

  // AI Chatbot trigger logic
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const prompt = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { sender: 'user', text: prompt }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/gemini/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, { sender: 'user', text: prompt }],
          currentProducts: products
        }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: "Assalamu Alaikum, I am having trouble connecting to Sister Maisha's servers right now but our Dhanmondi hub is fully open! Please let me know if I can assist with style guidelines." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // AI Recommendations Advisor trigger
  const handleRequestAdvisorAdvice = async () => {
    setAiStylingLoading(true);
    setAiStylingResult("");
    try {
      const response = await fetch("/api/gemini/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(advisorForm),
      });
      const data = await response.json();
      setAiStylingResult(data.recommendation);
    } catch (error) {
      setAiStylingResult("Could not establish deep AI consulting. We highly advise our Bestselling Royal Emerald Borka (Size 54) for your festivities.");
    } finally {
      setAiStylingLoading(false);
    }
  };

  // AI Sales Predictions trigger for admin
  const handleGetSalesInsights = async () => {
    setAdminInsightsLoading(true);
    try {
      const response = await fetch("/api/gemini/sales-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesData: dbOrders,
          pendingCount: dbOrders.filter(o => o.status === 'pending').length
        }),
      });
      const data = await response.json();
      setAdminInsights(data.insights);
    } catch (err) {
      setAdminInsights("Sales data analyzed. High demand on green fabric remains priority.");
    } finally {
      setAdminInsightsLoading(false);
    }
  };

  // AI Inventory forecast
  const handlePredictInventory = async () => {
    try {
      const response = await fetch("/api/gemini/predict-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStock: products.map(p => ({ title: p.title, inventory: p.inventory }))
        }),
      });
      const data = await response.json();
      setInventoryPrediction(data.prediction);
    } catch (err) {
      setInventoryPrediction("Optimal restock interval estimated at bi-weekly.");
    }
  };

  // AI Marketing campaign suger
  const handleGenerateMarketing = async () => {
    setMarketingLoading(true);
    try {
      const response = await fetch("/api/gemini/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: activeCampaign.name,
          discountPercentage: activeCampaign.discount
        }),
      });
      const data = await response.json();
      setMarketingCopy(data.post);
    } catch (err) {
      setMarketingCopy("Promotional blast prepared.");
    } finally {
      setMarketingLoading(false);
    }
  };

  // Customization Update Save in DB
  const saveCustomizationSettings = async () => {
    try {
      await setDoc(doc(db, "customization", "global_settings"), custForm);
      setCustomization(custForm);
      alert("Alhamdulillah! Store customization settings saved successfully.");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, "customization/global_settings");
    }
  };

  // CART OPERATIONS
  const addToCart = (product: Product, color: string, size: string) => {
    const cardId = `${product.id}_${color}_${size}`;
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === cardId);
      if (existing) {
        return prevCart.map(item => item.id === cardId ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prevCart, { id: cardId, product, quantity: 1, selectedColor: color, selectedSize: size }];
      }
    });

    // Simple visual highlight feedback
    alert(`Added ${product.title} (${color}, Size ${size}) to your bag!`);
  };

  const updateCartQuantity = (cartId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === cartId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty < 1 ? 1 : newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartId));
  };

  // Promo Coup codes validator
  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === "MUBARAK15") {
      setActiveDiscount(15);
      alert("Promo Code Applied: 15% discount successfully calculated!");
    } else {
      alert("Invalid Code. Try MUBARAK15 for early Eid savings.");
    }
  };

  // Wishlist toggle
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // CALCULATE BALANCES
  const cartSubtotal = cart.reduce((sum, item) => {
    const unitPrice = item.product.discountPrice || item.product.price;
    return sum + (unitPrice * item.quantity);
  }, 0);
  const deliveryFee = shippingInfo.city === "Dhaka" ? 80 : 150;
  const discountAmount = Math.round(cartSubtotal * (activeDiscount / 100));
  const finalTotalAmount = cartSubtotal - discountAmount + deliveryFee;

  // Process checkout order submit
  const handlePlaceOrder = async (payMethod: 'cod' | 'bkash' | 'nagad' | 'rocket') => {
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      alert("Please provide the full name, contact line, and shipping details.");
      return;
    }

    const newOrder: Order = {
      id: "OR-" + Math.floor(100000 + Math.random() * 900000),
      customerEmail: shippingInfo.email || "guest@maishaborka.com",
      customerName: shippingInfo.name,
      userId: currentUser?.uid || "guest-session-" + Math.floor(1000 + Math.random() * 9000),
      items: cart.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        imageUrl: item.product.images[0],
        quantity: item.quantity,
        color: item.selectedColor,
        size: item.selectedSize,
        price: item.product.discountPrice || item.product.price
      })),
      totalAmount: finalTotalAmount,
      status: 'pending',
      paymentMethod: payMethod,
      shippingAddress: {
        address: shippingInfo.address,
        phone: shippingInfo.phone,
        city: shippingInfo.city,
        district: shippingInfo.district || "Dhaka Zone"
      },
      orderNotes: shippingInfo.notes,
      createdAt: new Date().toISOString()
    };

    try {
      // Save order to cloud firestore securely
      await setDoc(doc(db, "orders", newOrder.id), newOrder);
      setCompletedOrder(newOrder);
      setCart([]);
      setCheckoutStep('success');
    } catch (err: any) {
      // Fallback local persistence if offline
      console.warn("Saving order to local storage fallback.");
      const saved = localStorage.getItem("local_orders");
      const list = saved ? JSON.parse(saved) : [];
      list.push(newOrder);
      localStorage.setItem("local_orders", JSON.stringify(list));
      
      setCompletedOrder(newOrder);
      setCart([]);
      setCheckoutStep('success');
    }
  };

  // Filter products by search and category selection
  const filteredProducts = products.filter(p => {
    const categoryMatch = selectedCategory === "All" || p.category === selectedCategory;
    const searchMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-slate-800 font-sans selection:bg-[#E5D5A8] selection:text-emerald-990">
      
      {/* 1. TOP BAR ANNOUNCEMENT */}
      <div 
        style={{ backgroundColor: themePrimaryColor }}
        className="text-white text-center text-xs py-2 px-4 shadow-sm z-50 transition-all font-medium flex items-center justify-center gap-2 overflow-hidden"
      >
        <span className="animate-pulse">✨</span>
        <span>{customization.announcementText}</span>
        <span className="hidden sm:inline bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
          COD Dhaka 80 BDT / Outside 150 BDT
        </span>
      </div>

      {/* 2. MAIN HEADER & MENUS */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200/50 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          
          {/* Brand Logo and Title */}
          <div 
            onClick={() => setActiveTab('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            {customization.companyLogoUrl ? (
              <img 
                src={customization.companyLogoUrl} 
                alt={customization.companyName || "Logo"} 
                className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-[#D4AF37] group-hover:scale-105 transition-all"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                style={{ backgroundColor: themePrimaryColor }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-serif text-xl shadow-md border-2 border-[#D4AF37] group-hover:scale-105 transition-all uppercase"
              >
                {(customization.companyName || "Maisha").charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none flex flex-wrap items-center gap-1">
                {customization.companyName || "Maisha Borka House"}
              </h1>
              <p style={{ color: themePrimaryColor }} className="text-[9px] tracking-widest font-extrabold uppercase mt-1">
                Premium Modset Wear Hub
              </p>
            </div>
          </div>

          {/* Search bar middle */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative">
            <input 
              type="text" 
              placeholder="Search designer Borkas, original Dubai fabric designs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-full bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-750 transition-all"
            />
            <Search className="absolute left-3.5 w-4 h-4 text-stone-400" />
            {searchQuery && (
              <X 
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 w-4 h-4 cursor-pointer text-stone-400 hover:text-stone-600" 
              />
            )}
          </div>

          {/* Icon buttons right side */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('shop')} 
              className={`hover:bg-stone-100 p-2 rounded-full transition-all text-sm font-semibold hidden lg:inline-flex items-center gap-1.5 ${activeTab === 'shop' ? 'text-emerald-800' : 'text-slate-650'}`}
            >
              Shop Catalog
            </button>

            <button 
              onClick={() => {
                setActiveTab('cart');
                setCheckoutStep('cart');
              }}
              className="relative p-2 hover:bg-stone-100 rounded-full transition-all"
            >
              <ShoppingBag className="w-6 h-6 text-slate-700" />
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span 
                  style={{ backgroundColor: themeAccentColor }}
                  className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce shadow"
                >
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Profile handler */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="p-1 hover:bg-stone-100 rounded-full transition-all flex items-center gap-1.5 border border-stone-200"
                >
                  <img 
                    src={currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                    alt="profile" 
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="hidden sm:inline text-xs font-medium pr-1.5">{currentUser.displayName?.split(" ")[0]}</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleLogin}
                className="bg-emerald-900 border border-emerald-800 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-full inline-flex items-center gap-1.5 shadow"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Admin trigger button if email matches */}
            {currentUser && ["imdmahin4567@gmail.com", "mahashinshinhamahin135@gmail.com"].includes(currentUser.email || "") && (
              <button 
                onClick={() => setActiveTab('admin')}
                style={{ borderColor: themeAccentColor, color: themeAccentColor }}
                className="border px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-[#FFFDE6]"
              >
                <Settings className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden md:inline">Admin Panel</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CATEGORY SELECTOR ACCORDION BAND */}
      <div className="bg-stone-100 py-2.5 overflow-x-auto border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2.5 scrollbar-thin">
          {["All", "Borka", "Abaya", "Kaftan", "Hijab"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setActiveTab('shop');
              }}
              style={selectedCategory === cat ? { backgroundColor: themePrimaryColor, color: "#fff" } : {}}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${selectedCategory === cat ? '' : 'bg-white hover:bg-stone-100 text-slate-700'}`}
            >
              {cat} Collection
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 min-w-[200px]">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Advisor:</span>
            <button
              onClick={() => {
                setShowSizingModal(true);
                handleRequestAdvisorAdvice();
              }}
              className="bg-purple-900 hover:bg-purple-800 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm transition-all animate-shimmer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Personal Stylist</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CORE VIEW PAGES */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* HOME VIEW TAB */}
          {activeTab === 'home' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
            >
              {/* Luxury Hero Banner Slider Section */}
              <div className="relative min-h-[460px] md:min-h-[550px] bg-emerald-990 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 select-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-stone-900/90 z-10" />
                  <img 
                    src={customization.heroBanners[0] || INITIAL_CUSTOMIZATION.heroBanners[0]} 
                    alt="Royal Islamic Wear" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative max-w-4xl mx-auto px-6 text-center text-white z-20 py-16">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ delay: 0.1 }}
                  >
                    <span 
                      style={{ color: themeAccentColor }}
                      className="inline-block text-xs font-bold uppercase tracking-widest bg-yellow-450/10 px-4 py-1.5 rounded-full border mb-6"
                    >
                      👑 Hand-Tailored Premium Modesty
                    </span>
                  </motion.div>
                  <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                    {customization.heroTitle}
                  </h2>
                  <p className="text-stone-200 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                    {customization.heroSubtitle}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => {
                        setSelectedCategory("All");
                        setActiveTab('shop');
                      }}
                      style={{ backgroundColor: themeAccentColor }}
                      className="w-full sm:w-auto text-emerald-950 px-8 py-3.5 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-all text-center"
                    >
                      Explore Luxury Catalog
                    </button>
                    <button 
                      onClick={() => {
                        setShowSizingModal(true);
                        handleRequestAdvisorAdvice();
                      }}
                      className="w-full sm:w-auto bg-white/20 hover:bg-white/35 text-white px-8 py-3.5 rounded-full font-bold text-sm backdrop-blur-sm transition-all border border-white/50 text-center flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Configure Sizing with AI</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mega Value Highlights Grid */}
              <div className="max-w-7xl mx-auto px-4 py-12 -mt-10 relative z-30">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: "Cash on Delivery", body: "Check comfort before payment nationwide", icon: Truck },
                    { title: "Dubai Original Cherry Fabric", body: "100% genuine breathable modest quality", icon: Check },
                    { title: "Tailored Custom Sizing", body: "Order custom length in checkout note", icon: Sliders },
                    { title: "Special discounts", body: "Early festive offerings via code MUBARAK15", icon: Tag }
                  ].map((x, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl shadow-md border border-stone-100 flex items-start gap-4">
                      <div style={{ backgroundColor: themePrimaryColor }} className="p-3 rounded-xl text-white">
                        <x.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm leading-snug">{x.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{x.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Featured Products Showcase */}
              <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                      Signature Modest Gems
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Our featured selection of hand embroidered elegant designs</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('shop')}
                    className="text-emerald-900 text-xs sm:text-sm font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>View complete shop</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.slice(0, 3).map((item) => (
                    <ProductCard 
                      key={item.id} 
                      product={item} 
                      themeAccent={themeAccentColor} 
                      themePrimary={themePrimaryColor}
                      onSelect={() => setSelectedProduct(item)}
                      onWishlist={() => toggleWishlist(item.id)}
                      isWishlisted={wishlist.includes(item.id)}
                      onInstantAdd={() => addToCart(item, item.colors[0], item.sizes[0])}
                    />
                  ))}
                </div>
              </div>

              {/* Discount Campaign Banner Section */}
              <div className="bg-[#FAF0D7] py-12 border-y border-[#E5D5A8] my-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="max-w-md">
                    <span className="bg-emerald-850 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">Limited campaign offer</span>
                    <h3 className="font-serif text-2xl sm:text-4xl font-bold text-emerald-990 leading-tight">
                      Sisterhood Festival Is Live!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2">
                      Get an elegant **15% direct deduction** on all Dubai Georgette Cherry Borkas. Apply the coupon code below at your invoice checkout.
                    </p>
                    <div className="flex items-center gap-2.5 mt-6">
                      <div className="bg-white border-dashed border-2 border-emerald-900/60 px-4 py-2 rounded-lg font-mono text-sm sm:text-base font-bold text-slate-900 tracking-wider">
                        MUBARAK15
                      </div>
                      <button 
                        onClick={() => {
                          setPromoCode("MUBARAK15");
                          applyPromoCode();
                          setActiveTab('shop');
                        }}
                        className="bg-emerald-900 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-800 transition-all"
                      >
                        Claim coupon
                      </button>
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden shadow-lg w-full max-w-sm h-[200px] md:h-[250px]">
                    <img 
                      src="https://images.unsplash.com/photo-1549064491-62d9bf8ce347?auto=format&fit=crop&q=80&w=500" 
                      alt="Special Promo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Pure Brand Story */}
              <div className="max-w-4xl mx-auto px-6 py-12 text-center text-slate-800 bg-white/70 backdrop-blur rounded-2xl border border-stone-200/50 mb-12">
                <span style={{ color: themeAccentColor }} className="text-xs font-bold uppercase tracking-widest">Our Devoted Story</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-2 mb-4">{customization.companyName || "Maisha Borka House"}</h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
                  {customization.aboutText}
                </p>
              </div>

              {/* Simulated Modest blogs feed list */}
              <div className="max-w-7xl mx-auto px-4 py-8 border-t border-stone-200">
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-6 text-center">Modest Lifestyle Hub & Blog</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {BLOG_POSTS.map((post) => (
                    <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-150 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#0F4C3A] font-semibold mb-2">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>By {post.author}</span>
                          <span className="text-stone-300">•</span>
                          <span>{post.date}</span>
                        </div>
                        <h4 className="font-serif text-lg font-bold text-slate-900 mb-2">{post.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{post.summary}</p>
                      </div>
                      <button 
                        onClick={() => alert(`Sister, "${post.title}" newsletter is fully customized. Sign up below to receive full texts!`)}
                        style={{ color: themeAccentColor }}
                        className="text-xs font-bold shrink-0 self-start mt-4 inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        Read Complete Article →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instagram Gallery showcase */}
              <div className="max-w-7xl mx-auto px-4 py-12 border-t border-stone-200/60">
                <h4 className="text-xs tracking-widest text-[#0F4C3A] font-semibold uppercase text-center">Instagram @maishaborkahouse</h4>
                <p className="text-serif font-bold text-lg text-slate-800 text-center mt-1 mb-6">Sisterhood Styling Community Highlight</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {INSTAGRAM_PHOTOS.map((src, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-stone-200 shadow-sm">
                      <img src={src} alt="instagram highlight" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SHOP VIEW CATALOG TAB */}
          {activeTab === 'shop' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 py-8"
            >
              {/* Category Showcase Ribbon */}
              <div className="mb-8">
                <h2 className="font-serif text-3xl font-bold text-slate-900">Custom Luxury Collections</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Filtering {selectedCategory} products. Over {products.length} tailormade collections configured live.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6 items-center">
                  <div className="relative w-full max-w-md">
                    <input 
                      type="text" 
                      placeholder="Search items by name, fabrics or SKU..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-stone-350 rounded-full text-xs"
                    />
                    <Search className="absolute left-3 w-4 h-4 text-stone-400 top-2.5" />
                  </div>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-red-500 font-bold"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Products list grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-200/50">
                  <AlertTriangle className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                  <h4 className="font-serif text-xl font-semibold text-slate-800">No Borkas match the current selection.</h4>
                  <p className="text-xs text-slate-500 mt-1">Try changing category buttons or search query above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((item) => (
                    <ProductCard 
                      key={item.id} 
                      product={item} 
                      themeAccent={themeAccentColor} 
                      themePrimary={themePrimaryColor}
                      onSelect={() => setSelectedProduct(item)}
                      onWishlist={() => toggleWishlist(item.id)}
                      isWishlisted={wishlist.includes(item.id)}
                      onInstantAdd={() => addToCart(item, item.colors[0], item.sizes[0])}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SHOPPING BAG & CHECKOUT VIEW TAB */}
          {activeTab === 'cart' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 py-8"
            >
              <h2 className="font-serif text-3xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <ShoppingBag className="w-8 h-8 text-[#0F4C3A]" />
                <span>Modesty Bag & Smart Checkout</span>
              </h2>

              {checkoutStep === 'success' && completedOrder ? (
                <div className="bg-white p-8 rounded-3xl shadow-md border border-[#E5D5A8] max-w-2xl mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 mx-auto mb-6">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-slate-900">Alhamdulillah! Your Order Is Placed</h3>
                  <p className="text-xs text-slate-500 mt-2">Order Referrence Code: <b>{completedOrder.id}</b></p>
                  
                  {/* Generated Invoice details */}
                  <div className="border border-stone-200 rounded-2xl p-5 my-6 text-left bg-stone-50/50">
                    <h4 className="text-xs font-bold uppercase text-stone-500 pr-2 border-b pb-2 mb-3">Invoice Details</h4>
                    <p className="text-xs text-slate-700"><b>Name:</b> {completedOrder.customerName}</p>
                    <p className="text-xs text-slate-700 mt-1"><b>Contact Phone:</b> {completedOrder.shippingAddress.phone}</p>
                    <p className="text-xs text-slate-700 mt-1"><b>Shipping Zone:</b> {completedOrder.shippingAddress.address}, {completedOrder.shippingAddress.city}</p>
                    
                    <div className="my-3 border-t border-dashed border-stone-200 pt-3">
                      {completedOrder.items.map((x, i) => (
                        <div key={i} className="flex justify-between text-xs py-1">
                          <span className="text-stone-600">{x.title} ({x.color}, Sz {x.size}) x {x.quantity}</span>
                          <span className="font-mono text-slate-900">BDT {x.price * x.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-sm">
                      <span className="text-slate-900">Paid Grand Total ({completedOrder.paymentMethod.toUpperCase()}):</span>
                      <span className="font-mono text-emerald-900">BDT {completedOrder.totalAmount}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    We will dispatch a confirmation SMS and secure shipment tracking shortly inside Bangladesh hub.
                  </p>

                  <div className="flex gap-4 items-center justify-center mt-8">
                    <button 
                      onClick={() => {
                        setCompletedOrder(null);
                        setCheckoutStep('cart');
                        setActiveTab('home');
                      }}
                      style={{ backgroundColor: themePrimaryColor }}
                      className="text-white px-6 py-2.5 rounded-full text-xs font-bold"
                    >
                      Return to catalog
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="border border-stone-300 px-6 py-2.5 rounded-full text-xs font-bold"
                    >
                      Print invoice
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-250">
                  <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                  <h4 className="font-serif text-xl font-semibold text-slate-800">Your bag is currently empty.</h4>
                  <p className="text-xs text-slate-500 mt-2">Explore our custom Dubai embroidery collections.</p>
                  <button 
                    onClick={() => setActiveTab('shop')} 
                    style={{ backgroundColor: themeAccentColor }}
                    className="text-slate-900 px-6 py-2.5 rounded-full text-xs font-bold mt-6 inline-block"
                  >
                    View shop
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Cart listings left column */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
                      
                      {/* Step Indicator */}
                      <div className="flex items-center gap-1.5 border-b pb-6 mb-6">
                        {['cart', 'shipping', 'payment'].map((step, idx) => (
                          <React.Fragment key={step}>
                            {idx > 0 && <ChevronRight className="w-4 h-4 text-stone-300" />}
                            <span 
                              style={checkoutStep === step ? { color: themeAccentColor } : {}}
                              className={`text-xs font-bold uppercase tracking-wider ${checkoutStep === step ? '' : 'text-stone-400'}`}
                            >
                              {step}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Step Contents */}
                      {checkoutStep === 'cart' && (
                        <div>
                          <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">Bag Elements ({cart.length})</h3>
                          <div className="space-y-6">
                            {cart.map((item) => {
                              const itemPrice = item.product.discountPrice || item.product.price;
                              return (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-4 justify-between border-b pb-6 last:border-b-0 last:pb-0">
                                  <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                                      <img src={item.product.images[0]} alt="product highlight" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs sm:text-sm font-semibold text-slate-800">{item.product.title}</h4>
                                      <div className="flex gap-2.5 text-[11px] text-stone-500 mt-1">
                                        <span>Color: <b>{item.selectedColor}</b></span>
                                        <span>Size: <b>{item.selectedSize}</b></span>
                                      </div>
                                      <div className="font-mono text-xs sm:text-sm text-slate-800 mt-2">
                                        BDT {itemPrice} {item.product.discountPrice && <span className="line-through text-stone-400 text-xs ml-1.5">BDT {item.product.price}</span>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 justify-between sm:justify-start">
                                    <div className="flex items-center border border-stone-300 rounded-full px-2.5 py-1">
                                      <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:text-stone-700">
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="px-3 font-mono text-xs">{item.quantity}</span>
                                      <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:text-stone-700">
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-stone-400 hover:text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-8 flex justify-end">
                            <button 
                              onClick={() => setCheckoutStep('shipping')}
                              style={{ backgroundColor: themePrimaryColor }}
                              className="text-white text-xs font-bold px-8 py-3 rounded-full shadow hover:scale-103 transition-all"
                            >
                              Proceed to Sizing & Shipping Details
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutStep === 'shipping' && (
                        <div>
                          <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">Shipping Contact & MODESTY Notes</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                              <input 
                                type="text" 
                                value={shippingInfo.name} 
                                onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-xs"
                                placeholder="Recipient Name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Backup Mobile Phone Line</label>
                              <input 
                                type="text" 
                                value={shippingInfo.phone} 
                                onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-xs"
                                placeholder="e.g. 01712XXXXXX"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Email</label>
                              <input 
                                type="email" 
                                value={shippingInfo.email} 
                                onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-xs"
                                placeholder="e.g. buyer@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delivery Region State</label>
                              <select 
                                value={shippingInfo.city} 
                                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-xs"
                              >
                                <option value="Dhaka">Dhaka Metropolitan Hub (COD 80 BDT)</option>
                                <option value="Outside Dhaka">All Outside Districts (COD 150 BDT)</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detailed Street Address / Landmark</label>
                              <textarea 
                                value={shippingInfo.address} 
                                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-xs h-16"
                                placeholder="Room, House number, Road details, landmarks"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Modesty Order note / Custom Length Requests (Inches 52-58)</label>
                              <textarea 
                                value={shippingInfo.notes} 
                                onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-xs h-16"
                                placeholder="e.g. Sisters' specific borka fitting notes"
                              />
                            </div>
                          </div>

                          <div className="mt-8 flex justify-between">
                            <button onClick={() => setCheckoutStep('cart')} className="border border-stone-300 px-6 py-2 rounded-full text-xs font-bold text-slate-600">
                              Back to bag
                            </button>
                            <button 
                              onClick={() => {
                                if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
                                  alert("Please fill up all the mandatory shipping inputs first!");
                                  return;
                                }
                                setCheckoutStep('payment');
                              }}
                              style={{ backgroundColor: themePrimaryColor }}
                              className="text-white text-xs font-bold px-8 py-2.5 rounded-full shadow"
                            >
                              Proceed to secure Payment options
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutStep === 'payment' && (
                        <div>
                          <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">Choose Premium Check Payment Option</h3>
                          <p className="text-xs text-stone-500 mb-6">Select from native cash or wallet options validated by SSLCommerz and local bKash integration.</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              { id: 'cod', title: 'Cash On Delivery (COD)', desc: 'Inspect at your doorstep. Cash handover.', partner: 'Home Delivery' },
                              { id: 'bkash', title: 'bKash Wallet', desc: 'Secure live transfer.', partner: 'Settle via SMS OTP' },
                              { id: 'nagad', title: 'Nagad Mobile Cash', desc: 'Immediate mobile transfer.', partner: 'Post confirmation' },
                              { id: 'rocket', title: 'Rocket Bank Agent', desc: 'Settle from bank account.', partner: 'Post confirmation' }
                            ].map((pM) => (
                              <div 
                                key={pM.id}
                                onClick={() => handlePlaceOrder(pM.id as any)}
                                style={{ borderColor: themeAccentColor }}
                                className="border rounded-2xl p-5 hover:bg-stone-50 cursor-pointer shadow-sm hover:scale-102 transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <span className="text-[10px] font-bold text-[#0F4C3A] bg-stone-100 px-2.5 py-1 rounded inline-block mb-2">{pM.partner}</span>
                                  <h4 className="font-semibold text-sm text-slate-900">{pM.title}</h4>
                                  <p className="text-xs text-slate-500 mt-1">{pM.desc}</p>
                                </div>
                                <span style={{ color: themeAccentColor }} className="text-xs font-bold mt-4 inline-block text-right">Place Invoice order →</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-8 flex justify-between">
                            <button onClick={() => setCheckoutStep('shipping')} className="border border-stone-300 px-6 py-2 rounded-full text-xs font-bold text-slate-600">
                              Back to shipping info
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Summary Column right side */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm sticky top-28">
                      <h3 className="font-serif text-md font-bold text-slate-900 border-b pb-3 mb-4">Total Bill Breakdown</h3>
                      
                      <div className="space-y-3 pb-4 border-b">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} Items)</span>
                          <span className="font-mono text-slate-950">BDT {cartSubtotal}</span>
                        </div>
                        {activeDiscount > 0 && (
                          <div className="flex justify-between text-xs text-red-500 font-medium">
                            <span>Festive Promo ({activeDiscount}%)</span>
                            <span className="font-mono">- BDT {discountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Home Shipment Fee</span>
                          <span className="font-mono text-slate-950">BDT {deliveryFee}</span>
                        </div>
                      </div>

                      <div className="flex justify-between font-bold text-sm py-4 border-b">
                        <span className="text-slate-900">Total Invoice Amount</span>
                        <span className="font-mono text-emerald-900">BDT {finalTotalAmount}</span>
                      </div>

                      {/* Coupon code block */}
                      <div className="mt-6">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apply Promo Code</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="MUBARAK15" 
                            value={promoCode} 
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="border border-stone-300 rounded-lg px-3 py-1.5 text-xs flex-1 uppercase font-mono"
                          />
                          <button 
                            onClick={applyPromoCode}
                            className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold text-center"
                          >
                            Apply
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1.5">Try using <b>MUBARAK15</b> to redeem early savings.</p>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* CUSTOMER PORTAL REGISTER/HISTORY VIEW TAB */}
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="max-w-4xl mx-auto px-4 py-8"
            >
              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                {!currentUser ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="font-serif text-xl font-bold text-slate-900">Access Your Loyalty Account Portal</h3>
                    <p className="text-xs text-sans text-stone-500 max-w-sm mx-auto mt-2 mb-6">
                      Sign in with Google OAuth to check historic orders, saved luxury shopping carts, return requests and loyalty streak scores.
                    </p>
                    <button 
                      onClick={handleGoogleLogin} 
                      style={{ backgroundColor: themePrimaryColor }}
                      className="text-white px-8 py-3 rounded-full text-xs font-bold"
                    >
                      Authenticate Google Profile
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Logged in layout */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6 mb-6">
                      <div className="flex items-center gap-4 text-left">
                        <img 
                          src={currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                          alt="avatar" 
                          className="w-16 h-16 rounded-full border-2 border-[#D4AF37] object-cover"
                        />
                        <div>
                          <h4 className="font-serif text-xl font-bold text-slate-900">{currentUser.displayName}</h4>
                          <p className="text-xs text-stone-500">{currentUser.email}</p>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-1">Verified Modest Sister</span>
                        </div>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>

                    {/* Sizing & Saved Wishlists Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-[#FFFCE6] p-5 rounded-2xl border border-[#E5D5A8]">
                        <span style={{ color: themeAccentColor }} className="text-[10px] uppercase font-bold tracking-widest">Sister Loyalty Points</span>
                        <h4 className="font-serif text-3xl font-black text-slate-900 mt-1">120 Points</h4>
                        <p className="text-xs text-stone-500 mt-2">Earned through custom purchases. Receive free soft luxury georgette hijabs at 500 points!</p>
                      </div>
                      <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-widest">Address Book</span>
                        <h5 className="font-semibold text-xs text-slate-800 mt-2">Current primary deliver zone:</h5>
                        <p className="text-xs text-slate-500 mt-1">
                          {shippingInfo.address ? `${shippingInfo.address}, ${shippingInfo.city}` : "Not specified yet. Fill shipping details inside checkout dashboard."}
                        </p>
                      </div>
                    </div>

                    {/* Wishlisted Product listings inside account */}
                    <div className="mb-8 p-3 bg-stone-50/50 rounded-2xl border border-stone-200">
                      <h4 className="font-serif text-base font-bold text-slate-900 mb-3 px-2 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        <span>Your Curated Wishlist ({wishlist.length} Items)</span>
                      </h4>
                      {wishlist.length === 0 ? (
                        <p className="text-xs text-stone-400 italic p-2">No custom items flagged as favorite yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
                          {products.filter(p => wishlist.includes(p.id)).map(p => (
                            <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer shadow-xs hover:bg-stone-100">
                              <img src={p.images[0]} alt="wishlist" className="w-8 h-8 rounded object-cover" />
                              <div className="truncate flex-1">
                                <span className="block text-xs font-semibold truncate leading-none">{p.title}</span>
                                <span className="text-[10px] text-stone-500">BDT {p.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client past orders history */}
                    <div>
                      <h4 className="font-serif text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5 pb-2 border-b">
                        <Calendar className="w-5 h-5 text-[#0F4C3A]" />
                        <span>Recent Order History & Tracking</span>
                      </h4>
                      
                      {dbOrders.filter(o => o.userId === currentUser.uid).length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-xs text-stone-400 italic">No orders logged under your verified account yet. Place your first cash-on-delivery Abaya order now.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dbOrders.filter(o => o.userId === currentUser.uid).map((order) => (
                            <div key={order.id} className="border p-4 rounded-xl shadow-xs bg-stone-50 hover:bg-white transition-all">
                              <div className="flex flex-col sm:flex-row justify-between mb-2 pb-2 border-b gap-1.5">
                                <div>
                                  <span className="text-xs font-bold text-slate-800">Order Ref: {order.id}</span>
                                  <span className="text-[10px] text-stone-400 ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className={`text-[10px] uppercase font-bold shrink-0 self-start px-2 py-0.5 rounded ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  ● {order.status}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {order.items.map((it, j) => (
                                  <div key={j} className="text-xs text-stone-600 flex justify-between">
                                    <span>{it.title} ({it.color}, Sz {it.size}) x {it.quantity}</span>
                                    <span>BDT {it.price * it.quantity}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 text-right text-xs font-semibold text-emerald-990 font-mono">
                                Grand total paid: BDT {order.totalAmount}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            </motion.div>
          )}
           {/* SUPER ADVANCED BACKEND ADMIN CONTROL BOARD TAB */}
          {activeTab === 'admin' && currentUser && ["imdmahin4567@gmail.com", "mahashinshinhamahin135@gmail.com"].includes(currentUser.email || "") && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="max-w-7xl mx-auto px-4 py-8"
            >
              <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
                
                {/* Header title block */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 bg-slate-900 text-white relative overflow-hidden border-b border-stone-800">
                  <div className="absolute right-0 top-0 text-white/5 font-serif text-[120px] leading-none pointer-events-none select-none">ADMIN</div>
                  <div className="z-10">
                    <span style={{ color: themeAccentColor }} className="text-[10px] font-extrabold uppercase tracking-widest bg-yellow-450/10 px-3 py-1 rounded border border-yellow-450/30">Maisha Enterprise Portal v4.5</span>
                    <h2 className="font-serif text-3xl font-black mt-2">Dhanmondi HQ Command Station</h2>
                    <p className="text-xs text-stone-300 mt-1">Configure designer inventory level settings, global styles, process client orders, and query operations AI agents.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 z-10 shrink-0">
                    <button 
                      onClick={handleSeedDatabase}
                      style={{ backgroundColor: themeAccentColor }}
                      className="text-emerald-950 px-5 py-2.5 rounded-xl text-xs font-bold shadow hover:opacity-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-4 h-4" />
                      <span>Seed Modest Catalog</span>
                    </button>
                  </div>
                </div>

                {/* Sub-navigation Interactive Tab Bar */}
                <div className="bg-stone-50 border-b border-stone-200 p-4">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setAdminSubTab('overview')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${adminSubTab === 'overview' ? 'text-white bg-emerald-900 shadow-md' : 'bg-white hover:bg-stone-100 text-slate-700 border border-stone-200'}`}
                    >
                      <Activity className="w-4 h-4" />
                      <span>ড্যাশবোর্ড ওভারভিউ (Overview)</span>
                    </button>
                    <button 
                      onClick={() => setAdminSubTab('orders')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${adminSubTab === 'orders' ? 'text-white bg-emerald-900 shadow-md' : 'bg-white hover:bg-stone-100 text-slate-700 border border-stone-200'}`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>অর্ডার ট্র্যাকিং ও আপডেট ({dbOrders.length})</span>
                    </button>
                    <button 
                      onClick={() => setAdminSubTab('products')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${adminSubTab === 'products' ? 'text-white bg-emerald-900 shadow-md' : 'bg-white hover:bg-stone-100 text-slate-700 border border-stone-200'}`}
                    >
                      <Tag className="w-4 h-4" />
                      <span>ডিজাইনার ক্যাটালগ ({products.length})</span>
                    </button>
                    <button 
                      onClick={() => setAdminSubTab('ai_ops')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${adminSubTab === 'ai_ops' ? 'text-white bg-purple-900 shadow-md' : 'bg-white hover:bg-stone-100 text-slate-700 border border-stone-200'}`}
                    >
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>এআই অপারেশনস অ্যাসিস্ট্যান্ট</span>
                    </button>
                    <button 
                      onClick={() => setAdminSubTab('branding')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${adminSubTab === 'branding' ? 'text-white bg-emerald-900 shadow-md' : 'bg-white hover:bg-stone-100 text-slate-700 border border-stone-200'}`}
                    >
                      <Palette className="w-4 h-4" />
                      <span>ব্র্যান্ডিং বা ডিজাইন সেটিংস</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 md:p-8">

                  {/* SUB-TAB: OVERVIEW */}
                  {adminSubTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                      {/* Live Database Indicators & Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="border border-stone-200 p-5 rounded-2xl bg-stone-50/50 shadow-xs">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">মোট বিক্রি (Revenue)</span>
                          <h4 className="font-mono text-3xl font-black text-slate-950 mt-1">
                            BDT {dbOrders.reduce((sum, order) => sum + order.totalAmount, 0)}
                          </h4>
                          <p className="text-[10px] text-emerald-800 mt-1">✓ Live calculations from Cloud</p>
                        </div>
                        <div className="border border-stone-200 p-5 rounded-2xl bg-stone-50/50 shadow-xs">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">মোট কোয়ান্ডিটি অর্ডার</span>
                          <h4 className="font-mono text-3xl font-black text-slate-950 mt-1">{dbOrders.length}</h4>
                          <p className="text-[10px] text-stone-500 mt-1">Shopping invoices received</p>
                        </div>
                        <div className="border border-stone-200 p-5 rounded-2xl bg-stone-50/50 shadow-xs">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">ডেলিভারি পেন্ডিং</span>
                          <h4 className="font-mono text-3xl font-black text-amber-600 mt-1">
                            {dbOrders.filter(o => o.status === 'pending').length}
                          </h4>
                          <p className="text-[10px] text-amber-600 mt-1">Awaiting delivery partners pickup</p>
                        </div>
                        <div className="border border-stone-200 p-5 rounded-2xl bg-stone-50/50 shadow-xs">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">লাইভ ক্লাউড সিঙ্ক স্ট্যাটাস</span>
                          <div className="mt-2 flex items-center gap-1.5">
                            {isFirebaseConnected ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span>Firebase Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs text-red-800 font-bold bg-red-50 px-2.5 py-1 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span>Offline Cache</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-stone-400 mt-1.5">Secure Firestore dynamic-serenity-tf4nj</p>
                        </div>
                      </div>

                      {/* Lower Analytics Section: Low Inventory alerts & Quick Guides */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Interactive Stock Depletion Alerts */}
                        <div className="border border-stone-200 rounded-2xl p-6 bg-white shadow-xs">
                          <h3 className="font-serif text-lg font-bold text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span>রিস্টক অ্যালার্ট (Low Stock Warning Inventory)</span>
                          </h3>
                          {products.filter(p => p.inventory < 10).length === 0 ? (
                            <div className="text-center py-6 text-stone-400 text-xs italic">
                              🎉 Alhamdulillah! All products are stocked well above the 10-unit minimum thresholds.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                              {products.filter(p => p.inventory < 10).map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                                  <div className="flex items-center gap-3">
                                    <img src={p.images[0]} alt="thumb" className="w-8 h-8 rounded object-cover shadow-sm" referrerPolicy="no-referrer" />
                                    <div>
                                      <span className="text-xs font-bold text-slate-900 block">{p.title}</span>
                                      <span className="text-[10px] text-stone-400 block font-mono">SKU: {p.sku} | Style: {p.category}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="bg-red-50 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                      {p.inventory} left
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Maisha Quick Guidelines admin task card */}
                        <div className="border border-stone-200 rounded-2xl p-6 bg-stone-50 shadow-xs">
                          <h3 className="font-serif text-lg font-bold text-slate-900 border-b pb-2 mb-3">
                            সিস্টেম সিকিউরিটি ও অপারেশন গাইডলাইন্স
                          </h3>
                          <ul className="text-xs text-stone-600 space-y-2.5 leading-relaxed">
                            <li className="flex gap-2">
                              <span className="text-emerald-800 font-bold font-mono">১.</span>
                              <span>কোনো কাস্টমার অর্ডার সাবমিট করলে তা সরাসরি <b>"অর্ডার ট্র্যাকিং"</b> ট্যাবে এসে রিয়াল-টাইম যুক্ত হবে।</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-emerald-800 font-bold font-mono">২.</span>
                              <span>পাঠাও বা ডেলিভারি পার্টনার কুরিয়ার মারফতে প্রোডাক্ট প্রেরণ করে স্ট্যাটাস আপডেট করুন।</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-emerald-800 font-bold font-mono">৩.</span>
                              <span>লাইভ ব্র্যান্ডিং সেটিংস এ গিয়ে যেকোনো সময় ওয়েবসাইটের ব্যানার টাইটেল, হিরো প্যারাগ্রাফ ও কালার স্কিম পরিবর্তন করা সম্ভব।</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-emerald-800 font-bold font-mono">৪.</span>
                              <span>এআই অপারেশনস এ গিয়ে জেমিনি ইন্টেলিজেন্স দ্বারা সেলস রিকমেন্ডেশন ও ফোরকাস্ট বিশ্লেষণ চালান।</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SUB-TAB: ORDERS MANAGEMENT */}
                  {adminSubTab === 'orders' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      
                      {/* Search & Filters Controls */}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-stone-100 p-4 rounded-2xl">
                        {/* Compact Search */}
                        <div className="relative w-full sm:w-72">
                          <Search className="absolute left-3 top-2.5 text-stone-400 w-4 h-4" />
                          <input 
                            type="text" 
                            placeholder="অর্ডার আইডি, কাস্টমার বা শহর খুঁজুন..." 
                            value={searchAdminQuery}
                            onChange={(e) => setSearchAdminQuery(e.target.value)}
                            className="bg-white text-xs rounded-xl w-full pl-9 pr-4 py-2 border border-stone-300 focus:outline-none"
                          />
                        </div>

                        {/* Dropdown status filters */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <span className="text-xs font-bold text-stone-500">ফিল্টার:</span>
                          {(['all', 'pending', 'processing', 'completed', 'cancelled'] as const).map((st) => (
                            <button 
                              key={st}
                              onClick={() => setOrderFilter(st)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize tracking-tight ${orderFilter === st ? 'bg-slate-900 text-white shadow-xs' : 'bg-white hover:bg-stone-50 text-stone-600 border border-stone-200'}`}
                            >
                              {st === 'all' ? 'সব অর্ডার' : st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Orders Log list table */}
                      <div className="overflow-x-auto rounded-2xl border shadow-xs bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#FAF9F5] text-stone-600 font-bold uppercase tracking-wider text-[10px] border-b">
                            <tr>
                              <th className="p-4 text-center">অর্ডার আইডি</th>
                              <th className="p-4">কাস্টমার নাম ও কন্টাক্ট</th>
                              <th className="p-4 text-right">টাকা (Grand Total)</th>
                              <th className="p-4">পেমেন্ট গেটওয়ে</th>
                              <th className="p-4">কুরিয়ার ঠিকানা</th>
                              <th className="p-4 text-center">ইনভয়েস অবস্থা (Status)</th>
                              <th className="p-4 text-center">স্ট্যাটাস পরিবর্তন (Actions)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-150">
                            {dbOrders.filter(o => {
                              const match = searchQuery || searchAdminQuery;
                              const matchesSearch = 
                                o.id.toLowerCase().includes(match.toLowerCase()) ||
                                o.customerName.toLowerCase().includes(match.toLowerCase()) ||
                                o.customerEmail.toLowerCase().includes(match.toLowerCase()) ||
                                o.shippingAddress.address.toLowerCase().includes(match.toLowerCase()) ||
                                o.shippingAddress.city.toLowerCase().includes(match.toLowerCase());
                              
                              if (orderFilter === 'all') return matchesSearch;
                              return matchesSearch && o.status === orderFilter;
                            }).length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-12 text-center text-stone-400 italic">
                                  No client checkout invoices match the chosen filters or search query.
                                </td>
                              </tr>
                            ) : (
                              dbOrders.filter(o => {
                                const match = searchQuery || searchAdminQuery;
                                const matchesSearch = 
                                  o.id.toLowerCase().includes(match.toLowerCase()) ||
                                  o.customerName.toLowerCase().includes(match.toLowerCase()) ||
                                  o.customerEmail.toLowerCase().includes(match.toLowerCase()) ||
                                  o.shippingAddress.address.toLowerCase().includes(match.toLowerCase()) ||
                                  o.shippingAddress.city.toLowerCase().includes(match.toLowerCase());
                                
                                if (orderFilter === 'all') return matchesSearch;
                                return matchesSearch && o.status === orderFilter;
                              }).map((o) => (
                                <tr key={o.id} className="hover:bg-stone-50/50">
                                  <td className="p-4 font-mono font-bold text-slate-800 text-center select-all">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button 
                                        onClick={() => setSelectedAdminOrder(o)}
                                        className="text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded"
                                        title="View detailed billing ticket"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <span>{o.id}</span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-semibold text-slate-900">{o.customerName}</div>
                                    <div className="text-[10px] text-stone-500">{o.shippingAddress.phone} | {o.customerEmail}</div>
                                  </td>
                                  <td className="p-4 text-right font-mono font-bold text-slate-800">BDT {o.totalAmount}</td>
                                  <td className="p-4">
                                    <span className="font-bold text-emerald-850 bg-emerald-50 text-[10px] px-2 py-0.5 rounded uppercase border border-emerald-100">{o.paymentMethod}</span>
                                  </td>
                                  <td className="p-4 max-w-[160px] truncate" title={`${o.shippingAddress.address}, ${o.shippingAddress.city}`}>
                                    {o.shippingAddress.address}, {o.shippingAddress.city}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase inline-block ${
                                      o.status === 'completed' ? 'bg-green-150 text-green-800' :
                                      o.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                      o.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {o.status}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                      <button 
                                        onClick={async () => {
                                          try {
                                            await setDoc(doc(db, "orders", o.id), { ...o, status: "processing" });
                                            alert("Invoiced as Processing status.");
                                          } catch (err: any) {
                                            handleFirestoreError(err, OperationType.WRITE, `orders/${o.id}`);
                                          }
                                        }}
                                        className="bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-850 text-[9px] font-bold px-2 py-1 rounded"
                                      >
                                        Process
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          try {
                                            await setDoc(doc(db, "orders", o.id), { ...o, status: "completed" });
                                            alert("Invoiced set to Completed successfully.");
                                          } catch (err: any) {
                                            handleFirestoreError(err, OperationType.WRITE, `orders/${o.id}`);
                                          }
                                        }}
                                        className="bg-green-100 hover:bg-green-205 border border-green-250 text-green-900 text-[9px] font-bold px-2 py-1 rounded"
                                      >
                                        Complete
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          try {
                                            await setDoc(doc(db, "orders", o.id), { ...o, status: "cancelled" });
                                            alert("Invoiced cancelled.");
                                          } catch (err: any) {
                                            handleFirestoreError(err, OperationType.WRITE, `orders/${o.id}`);
                                          }
                                        }}
                                        className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-[9px] font-bold px-2 py-1 rounded"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Selected Order Detailed Bill / Invoice Inspector Modal Overlay */}
                      <AnimatePresence>
                        {selectedAdminOrder && (
                          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                            <motion.div 
                              initial={{ scale: 0.95, opacity: 0 }} 
                              animate={{ scale: 1, opacity: 1 }} 
                              exit={{ scale: 0.95, opacity: 0 }}
                              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden text-slate-800"
                            >
                              <button 
                                onClick={() => setSelectedAdminOrder(null)}
                                className="absolute right-4 top-4 bg-stone-100 hover:bg-stone-200 p-2 rounded-full cursor-pointer text-stone-600"
                              >
                                <X className="w-5 h-5" />
                              </button>

                              <h3 className="font-serif text-2xl font-black text-slate-900 border-b pb-3 mb-4">অর্ডার ডিটেইলস ও বিলিং চালান</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6 bg-stone-50 p-4 rounded-xl">
                                <div>
                                  <h4 className="font-bold text-[10px] text-stone-400 uppercase tracking-wider">কাস্টমার তথ্য (Customer details)</h4>
                                  <p className="font-bold mt-1 text-slate-950 text-sm">{selectedAdminOrder.customerName}</p>
                                  <p className="mt-1">ইমেইল: {selectedAdminOrder.customerEmail}</p>
                                  <p className="mt-0.5">রিসিভার ফোন: <b>{selectedAdminOrder.shippingAddress.phone}</b></p>
                                </div>
                                <div>
                                  <h4 className="font-bold text-[10px] text-stone-400 uppercase tracking-wider">ডেলিভারি ঠিকানা (Courier zone)</h4>
                                  <p className="mt-1">{selectedAdminOrder.shippingAddress.address}</p>
                                  <p className="mt-0.5">শহর/জেলা: <b>{selectedAdminOrder.shippingAddress.city} ({selectedAdminOrder.shippingAddress.district})</b></p>
                                  {selectedAdminOrder.orderNotes && (
                                    <p className="text-[10px] text-stone-500 italic mt-2 bg-stone-100 p-2 rounded">
                                      নোট বা কাস্টমাইজড উচ্চতা: {selectedAdminOrder.orderNotes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2 mb-6">
                                <h4 className="font-bold text-[10px] text-stone-400 uppercase tracking-wider mb-2">ক্রয়কৃত ডিজাইনার আইটেমস (Ordered catalog)</h4>
                                {selectedAdminOrder.items.map((it, j) => (
                                  <div key={j} className="flex justify-between items-center text-xs border-b pb-2">
                                    <div>
                                      <span className="font-semibold text-slate-950 block">{it.title}</span>
                                      <span className="text-[10px] text-stone-500">কালার: {it.color} | সাইজ: {it.size} ইঞ্চি</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-bold">{it.quantity}টি</span>
                                      <span className="font-mono text-stone-500 ml-4">BDT {it.price * it.quantity}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-between items-center border-t pt-4 text-right">
                                <span className="text-sm font-bold">একত্রিত পেইড গ্র্যান্ড টোটাল:</span>
                                <span className="text-xl font-mono font-black text-emerald-990">BDT {selectedAdminOrder.totalAmount}</span>
                              </div>

                              <div className="mt-6 flex justify-end">
                                <button 
                                  onClick={() => {
                                    window.print();
                                  }}
                                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow inline-flex items-center gap-1.5"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>প্রিন্ট মেমো (Print Invoice)</span>
                                </button>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  )}

                  {/* SUB-TAB: CATALOG PRODUCT MANAGEMENT */}
                  {adminSubTab === 'products' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      
                      {/* Left Block - Dynamic Inventory Listing */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 bg-stone-50 p-4 rounded-2xl border">
                          <div>
                            <h4 className="font-serif text-md font-bold text-slate-900">ডিজাইনার আইটেম রেজিস্ট্রি ({products.length}টি)</h4>
                            <p className="text-[10px] text-stone-500">সরাসরি বা CSV আপলোড করে নতুন ক্যাটালগ প্রডাক্ট অ্যাড করুন।</p>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                              type="button"
                              onClick={() => setShowCsvImporter(!showCsvImporter)}
                              className="bg-[#CEEAE0] hover:bg-[#B6DFD0] text-emerald-955 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-emerald-400/30 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>CSV ইম্পোর্ট</span>
                            </button>
                            <input 
                              type="text" 
                              placeholder="ক্যাটালগ পণ্য খুঁজি..." 
                              value={searchAdminQuery}
                              onChange={(e) => setSearchAdminQuery(e.target.value)}
                              className="bg-white text-xs px-3 py-1.5 border rounded-lg flex-1 sm:w-44"
                            />
                          </div>
                        </div>

                        {/* Expandable CSV Import Module */}
                        {showCsvImporter && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: "auto", height: "auto" }}
                            className="bg-[#FAF9F5] rounded-2xl p-5 border-2 border-dashed border-emerald-600/30 text-xs overflow-hidden space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-serif font-black text-slate-900 flex items-center gap-1.5 text-sm">
                                  <PlusCircle className="w-4 h-4 text-emerald-800" />
                                  <span>CSV ফাইল থেকে ক্যাটালগ প্রোডাক্ট সরাসরি বা বাল্ক ইম্পোর্ট</span>
                                </h5>
                                <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                                  নিচের উইন্ডোতে আপনার স্প্রেডশিট (যেমন Excel বা Google Sheets) থেকে কপি করা CSV ডেটা পেস্ট করতে পারেন অথবা নিচে দেওয়া <b>📂 CSV ফাইল বাছুন</b> চেপে কম্পিউটার থেকে <b>.csv</b> বা <b>.txt</b> ফাইল লোড করতে পারেন।
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-stone-200/60 p-2.5 rounded-lg text-[10px] text-emerald-990 leading-relaxed font-mono">
                              <span className="font-bold uppercase tracking-wider block text-[9px] text-stone-500 mb-1">প্রয়োজনীয় CSV কলাম হেডার (Headers):</span>
                              title,sku,category,price,discountPrice,inventory,colors,sizes,imageUrl,shortDescription,description
                            </div>

                            <textarea
                              value={csvText}
                              onChange={(e) => setCsvText(e.target.value)}
                              placeholder={`যেমন নমুনা ফরম্যাট:\ntitle,sku,category,price,discountPrice,inventory,colors,sizes,imageUrl,shortDescription,description\nজোহরা রাজকীয় দুবাই বোরকা,MB-ZH-09,Borka,4500,3900,15,"Black, Emerald","52, 54, 56",https://example.com/abaya.png,"দুবাই চেরি ফেব্রিকের বোরকা","সুতি ও জরি সুতার কাজ করা চমৎকার বোরকা"`}
                              className="w-full h-40 bg-white border rounded-xl p-3 font-mono text-[10px] shadow-inner focus:outline-emerald-800"
                            />

                            <div className="flex justify-between items-center gap-2 flex-wrap pt-2">
                              {/* Option for physical file upload that reads into text-area */}
                              <div className="flex items-center gap-2">
                                <label className="bg-stone-250 hover:bg-stone-300 text-stone-800 border font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer inline-flex items-center gap-1 transition-all">
                                  <span>📂 CSV ফাইল বাছুন</span>
                                  <input 
                                    type="file" 
                                    accept=".csv,.txt"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          if (typeof reader.result === 'string') {
                                            setCsvText(reader.result);
                                          }
                                        };
                                        reader.readAsText(file);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                                {csvText && (
                                  <span className="text-[10px] text-green-700 italic font-semibold">✓ ফাইল সফলভাবে লোড হয়েছে!</span>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setShowCsvImporter(false)}
                                  className="text-stone-500 hover:underline px-3 py-1 text-[10px]"
                                >
                                  বাতিল করুন
                                </button>
                                <button
                                  type="button"
                                  onClick={handleImportCsv}
                                  disabled={isImportingCsv}
                                  className="bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl hover:bg-emerald-850 shadow transition-all cursor-pointer text-[11px] disabled:opacity-50"
                                >
                                  {isImportingCsv ? "ইম্পোর্ট করা হচ্ছে..." : "✓ ইম্পোর্ট করুন (Import Clean Data)"}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin">
                          {products.filter(p => !searchAdminQuery || p.title.toLowerCase().includes(searchAdminQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchAdminQuery.toLowerCase())).map((p) => (
                            <div key={p.id} className="border border-stone-200 bg-white p-4 rounded-2xl flex justify-between items-center shadow-xs">
                              <div className="flex items-center gap-3">
                                <img src={p.images[0]} alt="img" className="w-12 h-12 rounded-xl object-cover border shadow-sm" referrerPolicy="no-referrer" />
                                <div>
                                  <span className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-100 font-extrabold uppercase px-2 py-0.5 rounded text-[9px] inline-block">{p.category}</span>
                                  <h4 className="font-bold text-xs text-slate-900 mt-1">{p.title}</h4>
                                  <div className="flex gap-2 text-[10px] text-stone-500 font-mono mt-0.5">
                                    <span>SKU: {p.sku}</span>
                                    <span>•</span>
                                    <span>রানিং রিটেইল: BDT {p.price}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.inventory > 15 ? 'bg-green-50 text-green-800' : p.inventory > 5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-800'}`}>
                                  স্টক: {p.inventory} টি
                                </span>
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => prepareEditProduct(p)}
                                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                                  >
                                    সম্পাদনা
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded-lg"
                                  >
                                    মুছে ফেলুন
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Block - Add / Edit Product Form */}
                      <form onSubmit={handleAddProduct} className="lg:col-span-5 bg-stone-50 border border-stone-200 p-6 rounded-2xl shadow-xs">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                          <h4 className="font-serif text-md font-bold text-[#0F4C3A]">
                            {isEditingProduct ? `ডিজাইনার আইটেম সম্পাদন` : `নতুন ডিজাইনার পণ্য যোগ`}
                          </h4>
                          {isEditingProduct && (
                            <button 
                              type="button"
                              onClick={() => {
                                setIsEditingProduct(null);
                                setProdForm({
                                  title: "",
                                  sku: "",
                                  category: "Borka",
                                  price: 3200,
                                  discountPrice: 0,
                                  inventory: 15,
                                  description: "",
                                  imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600",
                                  colors: "Emerald Green, Midnight Black",
                                  sizes: "52, 54, 56, 58",
                                  shortDescription: "Premium handtailored original Dubai fabric with custom embroidery."
                                });
                              }}
                              className="text-red-700 font-bold hover:underline text-[10px]"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>

                        <div className="space-y-3.5 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase">পণ্যের নাম (Title)</label>
                            <input 
                              type="text" 
                              value={prodForm.title}
                              onChange={(e) => setProdForm({ ...prodForm, title: e.target.value })}
                              placeholder="যেমন: জোহরা রাজকীয় দুবাই বোরকা"
                              className="w-full bg-white mt-1 border px-3 py-2 rounded-lg"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase">ইউনিক SKU কোড</label>
                              <input 
                                type="text" 
                                value={prodForm.sku}
                                onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                                placeholder="MBH-ZH-08"
                                className="w-full bg-white mt-1 border px-3 py-2 rounded-lg"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase">ক্যাটাগরি</label>
                              <select 
                                value={prodForm.category}
                                onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                                className="w-full bg-white mt-1 border px-2 py-2 rounded-lg"
                              >
                                <option value="Borka">Borka</option>
                                <option value="Abaya">Abaya</option>
                                <option value="Kaftan">Kaftan</option>
                                <option value="Hijab">Hijab</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase">রিটেইল দাম BDT</label>
                              <input 
                                type="number" 
                                value={prodForm.price}
                                onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                                className="w-full bg-white mt-1 border px-3 py-2 rounded-lg"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase">ছাড় মূল্য</label>
                              <input 
                                type="number" 
                                value={prodForm.discountPrice}
                                onChange={(e) => setProdForm({ ...prodForm, discountPrice: Number(e.target.value) })}
                                className="w-full bg-white mt-1 border px-3 py-2 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase">স্টক ইনভেন্টরি</label>
                              <input 
                                type="number" 
                                value={prodForm.inventory}
                                onChange={(e) => setProdForm({ ...prodForm, inventory: Number(e.target.value) })}
                                className="w-full bg-white mt-1 border px-3 py-2 rounded-lg"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase">উপলব্ধ কালারসমূহ (Comma Separated)</label>
                            <input 
                              type="text" 
                              value={prodForm.colors}
                              onChange={(e) => setProdForm({ ...prodForm, colors: e.target.value })}
                              placeholder="Emerald Green, Midnight Black, Soft Gold"
                              className="w-full bg-white mt-1 border px-3 py-2 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase">সাইজসমূহ ইঞ্চি (Comma Separated)</label>
                            <input 
                              type="text" 
                              value={prodForm.sizes}
                              onChange={(e) => setProdForm({ ...prodForm, sizes: e.target.value })}
                              placeholder="52, 54, 56, 58"
                              className="w-full bg-white mt-1 border px-3 py-2 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase">পণ্যের ছবি (Product Image - PNG/JPG Upload or URL Link)</label>
                            <div className="mt-1.5 space-y-2">
                              {/* Drag & drop/click base64 PNG/JPG file upload input */}
                              <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer bg-white hover:bg-stone-50/70 transition-all p-4">
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <Upload className="w-6 h-6 text-emerald-800 mb-1" />
                                    <p className="text-[11px] font-bold text-slate-700">ডিভাইস থেকে ছবি (PNG/JPG) আপলোড করুন</p>
                                    <p className="text-[9px] text-stone-400 mt-0.5">ড্র্যাগ-অ্যান্ড-ড্রপ বা এখানে ক্লিক করুন</p>
                                  </div>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          if (typeof reader.result === 'string') {
                                            setProdForm({ ...prodForm, imageUrl: reader.result });
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="hidden" 
                                  />
                                </label>
                              </div>

                              {/* Manual Link Input */}
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 text-[10px] font-bold">
                                  অথবা ছবি URL লিংক:
                                </div>
                                <input 
                                  type="text" 
                                  value={prodForm.imageUrl.startsWith("data:") ? "[ডিভাইস থেকে আপলোডকৃত ছবি]" : prodForm.imageUrl}
                                  onChange={(e) => {
                                    if (e.target.value !== "[ডিভাইস থেকে আপলোডকৃত ছবি]") {
                                      setProdForm({ ...prodForm, imageUrl: e.target.value });
                                    }
                                  }}
                                  placeholder="যেমন: https://images.unsplash.com/..."
                                  className="w-full bg-white border pl-28 pr-3 py-2 rounded-lg font-mono text-[10px]"
                                />
                              </div>

                              {/* Image Preview Window */}
                              {prodForm.imageUrl && (
                                <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-xl border border-stone-200">
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-300">
                                    <img 
                                      src={prodForm.imageUrl} 
                                      alt="Uploaded preview" 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-stone-600 truncate font-semibold">
                                      {prodForm.imageUrl.startsWith("data:") ? "PNG/JPG Image Loaded in memory" : prodForm.imageUrl}
                                    </p>
                                    <button 
                                      type="button" 
                                      onClick={() => setProdForm({ ...prodForm, imageUrl: "" })}
                                      className="text-red-650 hover:underline text-[9px] font-bold mt-0.5"
                                    >
                                      ছবি মুছে ফেলুন (Remove)
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase">সংক্ষিপ্ত বর্ণনা (Short Pitch)</label>
                            <input 
                              type="text" 
                              value={prodForm.shortDescription}
                              onChange={(e) => setProdForm({ ...prodForm, shortDescription: e.target.value })}
                              className="w-full bg-white mt-1 border px-3 py-2 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase">বিস্তারিত ডেসক্রিপশন</label>
                            <textarea 
                              value={prodForm.description}
                              onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                              className="w-full bg-white mt-1 border px-3 py-2 rounded-lg h-20"
                              placeholder="দুবাই চেরি ফেব্রিক দিয়ে তৈরী, সুনিপুণ সুতি বা জরি সুতার নকশা..."
                            />
                          </div>

                          <button 
                            type="submit"
                            style={{ backgroundColor: themePrimaryColor }}
                            className="w-full text-white py-3 rounded-lg text-xs font-bold shadow hover:scale-102 transition-all cursor-pointer"
                          >
                            {isEditingProduct ? "✓ প্রোডাক্ট আপডেট সেভ করুন" : "➕ নতুন ডিজাইনার প্রোডাক্ট ক্যাটালগে রেজিস্টার করুন"}
                          </button>
                        </div>
                      </form>

                    </motion.div>
                  )}

                  {/* SUB-TAB: AI OPERATIONS & INTELLIGENCE */}
                  {adminSubTab === 'ai_ops' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Gemini Assistant Panel */}
                        <div className="lg:col-span-2 border border-[#E5D5A8] p-6 rounded-2xl bg-[#FFFDF0]">
                          <h4 className="font-serif text-lg font-bold text-slate-900 border-b pb-2 mb-4 flex items-center gap-1.5">
                            <Sparkles className="w-5 h-5 text-purple-700 animate-pulse" />
                            <span>Sister Maisha's AI Operations Assistant</span>
                          </h4>
                          
                          <div className="space-y-4">
                            <p className="text-xs text-stone-605">
                              Our built-in Gemini LLM model analyses historic Dhanmondi sales trends, currency variations, and regional modesty fashion demand shifts to plan your catalog.
                            </p>
                            
                            <div className="flex flex-wrap gap-2 pt-2">
                              <button 
                                onClick={handleGetSalesInsights}
                                className="bg-purple-900 hover:bg-purple-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                {adminInsightsLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                                <span>Generate Campaign Growth Analysis</span>
                              </button>
                              <button 
                                onClick={handlePredictInventory}
                                className="bg-purple-950 hover:bg-purple-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Forecast Stock Depletion Speed
                              </button>
                            </div>

                            {/* Display Outputs */}
                            {adminInsights && (
                              <div className="bg-white p-5 rounded-xl border border-stone-200 mt-2 text-xs leading-relaxed text-slate-850">
                                <span className="font-bold block text-purple-950 mb-1">AI Recommendation Insight:</span>
                                <p className="whitespace-pre-wrap">{adminInsights}</p>
                              </div>
                            )}

                            {inventoryPrediction && (
                              <div className="bg-white p-5 rounded-xl border border-stone-200 mt-2 text-xs leading-relaxed text-slate-850">
                                <span className="font-bold block text-[#0F4C0A] mb-1">AI Stock Forecast Analysis:</span>
                                <p className="whitespace-pre-wrap">{inventoryPrediction}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* AI Campaigns creation */}
                        <div className="lg:col-span-1 border border-[#E5D5A8] p-6 rounded-2xl bg-[#FFFDF0] flex flex-col justify-between">
                          <div>
                            <h4 className="font-serif text-md font-bold text-slate-900 border-b pb-2 mb-3">
                              এআই ক্যাম্পেইন রাইটার (Promotion Creator)
                            </h4>
                            <div className="space-y-3.5 text-xs">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">প্রচারণার বিষয় (Campaign Subject)</label>
                                <input 
                                  type="text" 
                                  value={activeCampaign.name} 
                                  onChange={(e) => setActiveCampaign({ ...activeCampaign, name: e.target.value })}
                                  className="w-full p-2 border rounded-lg bg-white mt-1"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">ডিস্কাউন্ট পার্সেন্টেজ</label>
                                <input 
                                  type="number" 
                                  value={activeCampaign.discount} 
                                  onChange={(e) => setActiveCampaign({ ...activeCampaign, discount: Number(e.target.value) })}
                                  className="w-full p-2 border rounded-lg bg-white mt-1"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <button 
                              onClick={handleGenerateMarketing}
                              className="bg-slate-950 hover:bg-slate-905 text-white text-xs font-bold px-4 py-2.5 rounded-xl w-full flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              {marketingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                              <span>AI Autowrite Social Copy</span>
                            </button>

                            {marketingCopy && (
                              <div className="bg-white p-4 rounded border text-[10px] mt-3 whitespace-pre-wrap leading-relaxed select-all max-h-[180px] overflow-y-auto">
                                {marketingCopy}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* SUB-TAB: WEBSITE BRANDING CUSTOMIZATION */}
                  {adminSubTab === 'branding' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      
                      {/* Section 1: Core Company Profile */}
                      <div className="border border-stone-200 p-6 rounded-2xl bg-white shadow-sm space-y-6">
                        <div className="border-b pb-2 flex items-center justify-between">
                          <h3 className="font-serif text-lg font-bold text-[#0F4C3A] flex items-center gap-1.5">
                            <Palette className="w-5 h-5 text-emerald-800" />
                            <span>১. মূল ব্র্যান্ডিং ও কোম্পানির প্রোফাইল (Core Profile)</span>
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">কোম্পানির নাম (Company Name)</label>
                            <input 
                              type="text" 
                              value={custForm.companyName || ""} 
                              onChange={(e) => setCustForm({ ...custForm, companyName: e.target.value })}
                              placeholder="e.g. Maisha Borka House"
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">কোম্পানির লোগো ইমেজ URL (Logo URL)</label>
                            <input 
                              type="text" 
                              value={custForm.companyLogoUrl || ""} 
                              onChange={(e) => setCustForm({ ...custForm, companyLogoUrl: e.target.value })}
                              placeholder="e.g. https://domain.com/logo.png"
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800 font-mono"
                            />
                            <p className="text-[9px] text-stone-500 mt-0.5">ফাঁকা রাখলে নামের প্রথম অক্ষর দিয়ে ব্র্যান্ড লোগো ইমেজ অটো তৈরি হবে।</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">হেল্পলাইন নাম্বার (Helpline Phone)</label>
                            <input 
                              type="text" 
                              value={custForm.companyHelpline || ""} 
                              onChange={(e) => setCustForm({ ...custForm, companyHelpline: e.target.value })}
                              placeholder="e.g. +880 1712-345678"
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">অফিশিয়াল জিমেইল (Gmail Address)</label>
                            <input 
                              type="text" 
                              value={custForm.companyGmail || ""} 
                              onChange={(e) => setCustForm({ ...custForm, companyGmail: e.target.value })}
                              placeholder="e.g. maisha@gmail.com"
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">হোয়াটসঅ্যাপ নাম্বার (WhatsApp Link No)</label>
                            <input 
                              type="text" 
                              value={custForm.companyWhatsapp || ""} 
                              onChange={(e) => setCustForm({ ...custForm, companyWhatsapp: e.target.value })}
                              placeholder="e.g. +8801712345678"
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800 font-mono"
                            />
                            <p className="text-[9px] text-stone-500 mt-0.5">কোনো স্পেস বা ড্যাশ (-) ছাড়া কান্ট্রি কোড সহ লিখুন।</p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Website Texts Panel */}
                      <div className="border border-stone-200 p-6 rounded-2xl bg-white shadow-sm space-y-6">
                        <h3 className="font-serif text-lg font-bold text-[#0F4C3A] border-b pb-2 flex items-center gap-1.5">
                          <Sparkles className="w-5 h-5 text-emerald-800" />
                          <span>২. ওয়েবসাইটের টেক্সট ও কন্টেন্ট কাস্টমাইজেশন (Website Texts)</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">ব্যানার প্রধান শিরোনাম (Hero Title Text)</label>
                            <input 
                              type="text" 
                              value={custForm.heroTitle} 
                              onChange={(e) => setCustForm({ ...custForm, heroTitle: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">ব্যানার উপ-শিরোনাম (Hero Subtitle Text)</label>
                            <input 
                              type="text" 
                              value={custForm.heroSubtitle} 
                              onChange={(e) => setCustForm({ ...custForm, heroSubtitle: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">এনাউন্সমেন্ট নোটিশ টেক্সট (Top Announcement Bar Notice)</label>
                            <textarea 
                              rows={2}
                              value={custForm.announcementText} 
                              onChange={(e) => setCustForm({ ...custForm, announcementText: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">আমাদের সম্পর্কে (About Story Text)</label>
                            <textarea 
                              rows={3}
                              value={custForm.aboutText} 
                              onChange={(e) => setCustForm({ ...custForm, aboutText: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-1 focus:outline-emerald-800"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Dynamic Informative Fields Manager (Add and Delete Custom fields) */}
                      <div className="border border-stone-200 p-6 rounded-2xl bg-white shadow-sm space-y-6">
                        <div className="border-b pb-2">
                          <h3 className="font-serif text-lg font-bold text-[#0F4C3A] flex items-center gap-1.5">
                            <PlusCircle className="w-5 h-5 text-emerald-800" />
                            <span>৩. কাস্টম ওভারভিউ ফিল্ডস ও অতিরিক্ত কন্টাক্টসমূহ (Dynamic Fields Editor)</span>
                          </h3>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            এখানে আপনি যেকোনো নতুন তথ্য টাইটেল ও ভ্যালু হিসেবে সহজেই অ্যাড অথবা ডিলিট করতে পারবেন (যেমন: ডেলিভারি চার্জ, অন্যান্য শাখা বা বিকাশ পেমেন্ট তথ্য)। এগুলো ওয়েবসাইটের ফুটার ফুটনোটে দৃশ্যমান হবে।
                          </p>
                        </div>

                        {/* Current Lists */}
                        <div className="space-y-2 max-w-2xl">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">বর্তমান অতিরিক্ত তথ্য তালিকা (Current Custom Fields List)</label>
                          
                          {(!custForm.customFields || custForm.customFields.length === 0) ? (
                            <p className="text-stone-400 text-xs italic">কোনো অতিরিক্ত কাস্টম তথ্য যুক্ত করা নেই।</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {custForm.customFields.map((field) => (
                                <div key={field.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 p-3 rounded-xl gap-4">
                                  <div className="text-xs">
                                    <span className="font-bold text-slate-900 block">{field.key}</span>
                                    <span className="text-stone-600 font-mono text-[11px]">{field.value}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomField(field.id)}
                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                                    title="মুছুন করুন (Delete)"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add Form inputs */}
                        <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl max-w-2xl space-y-3">
                          <p className="text-xs font-bold text-emerald-800">নতুন তথ্য লাইন তৈরি করুন (Add New Extra details):</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <input 
                                type="text"
                                placeholder="যেমন: বিকাশ মার্চেন্ট / ডেলিভারি চার্জ"
                                value={newFieldKey}
                                onChange={(e) => setNewFieldKey(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-emerald-800"
                              />
                            </div>
                            <div>
                              <input 
                                type="text"
                                placeholder="যেমন: 017XXXXXXXX (মার্চেন্ট) / ৬০ টাকা"
                                value={newFieldValue}
                                onChange={(e) => setNewFieldValue(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-emerald-800"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddCustomField}
                            style={{ backgroundColor: themePrimaryColor }}
                            className="text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:brightness-110 cursor-pointer transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>তালিকায় যুক্ত করুন (Add to List)</span>
                          </button>
                        </div>
                      </div>

                      {/* Section 4: Live Theme Styles & Submit Trigger */}
                      <div className="border border-stone-200 p-6 rounded-2xl bg-white shadow-sm space-y-6">
                        <h3 className="font-serif text-lg font-bold text-[#0F4C3A] border-b pb-2 flex items-center gap-1.5">
                          <Palette className="w-5 h-5 text-emerald-800" />
                          <span>৪. লাইভ থিম কালার কাস্টমাইজেশন (Live Color Theme Editor)</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">ব্র্যান্ড প্রাইমারি কালার (Primary Theme Color Hex)</label>
                            <div className="flex gap-2 items-center mt-1">
                              <input 
                                type="color" 
                                value={custForm.primaryColor} 
                                onChange={(e) => setCustForm({ ...custForm, primaryColor: e.target.value })}
                                className="w-10 h-8 rounded border"
                              />
                              <input 
                                type="text" 
                                value={custForm.primaryColor} 
                                onChange={(e) => setCustForm({ ...custForm, primaryColor: e.target.value })}
                                className="border px-3 py-1.5 text-xs rounded-lg uppercase flex-1 font-mono focus:outline-emerald-800"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">থিম অ্যাকসেন্ট কালার (Accent Color Hex)</label>
                            <div className="flex gap-2 items-center mt-1">
                              <input 
                                type="color" 
                                value={custForm.accentColor} 
                                onChange={(e) => setCustForm({ ...custForm, accentColor: e.target.value })}
                                className="w-10 h-8 rounded border"
                              />
                              <input 
                                type="text" 
                                value={custForm.accentColor} 
                                onChange={(e) => setCustForm({ ...custForm, accentColor: e.target.value })}
                                className="border px-3 py-1.5 text-xs rounded-lg uppercase flex-1 font-mono focus:outline-emerald-800"
                              />
                            </div>
                          </div>

                          <div className="flex items-end shadow-sm">
                            <button 
                              type="button"
                              onClick={saveCustomizationSettings}
                              style={{ backgroundColor: themePrimaryColor }}
                              className="w-full text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:brightness-110 active:scale-98 transition-all hover:underline cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
                              <span>সকল লাইভ পরিবর্তন সেভ করুন (Save & Publish)</span>
                            </button>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  )}

                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FLOAT WHATSAPP QUICK CHAT ASSISTANCE BUBBLE */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
        
        {/* Sizing Advisor Floating Hint bubble */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 border border-[#E5D5A8] rounded-2xl overflow-hidden shadow-lg p-3 max-w-[200px] text-white hidden md:block">
          <p className="text-[10px] leading-relaxed">
            🌿 Not sure if <b>Size 52, 54, 56 or 58</b> matches your height perfectly? Confined custom length? Configure it live!
          </p>
          <button 
            onClick={() => {
              setShowSizingModal(true);
              handleRequestAdvisorAdvice();
            }}
            className="text-[10px] font-serif font-bold text-yellow-300 flex items-center gap-1 mt-1.5 hover:underline"
          >
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span>Launch Smart Config</span>
          </button>
        </div>

        {/* WhatsApp & Live Chat Buttons */}
        <div className="flex gap-2">
          {/* Quick AI support assistant trigger */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{ backgroundColor: themePrimaryColor }}
            className="text-white p-4 rounded-full shadow-xl hover:scale-110 transition-all border-2 border-white/60 text-center cursor-pointer flex items-center justify-center "
          >
            <MessageSquare className="w-6 h-6 animate-pulse" />
          </button>
          
          {/* Static Quick WhatsApp redirection */}
          <a 
            href={`https://wa.me/${(customization.companyWhatsapp || "8801700000000").replace(/[^0-9]/g, "")}?text=Assalamu+Alaikum,+I+am+interested+in+your+designs.`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-emerald-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-all border-2 border-white flex items-center justify-center cursor-pointer"
          >
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.472 5.14 1.473 5.372 0 9.742-4.31 9.746-9.613.002-2.569-1.002-4.984-2.825-6.808C16.828 2.38 14.432 1.38 12.01 1.38c-5.38 0-9.75 4.31-9.754 9.612-.002 1.899.497 3.754 1.446 5.4l-.993 3.634 3.714-.962z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* CHATBOT DRAWER WINDOW POPUP */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-full max-w-[350px] bg-white rounded-3xl shadow-2xl border border-stone-250 z-50 overflow-hidden flex flex-col h-[420px]"
          >
            {/* Drawer Header */}
            <div style={{ backgroundColor: themePrimaryColor }} className="p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div style={{ borderColor: themeAccentColor }} className="w-8 h-8 rounded-full bg-white/20 border-2 items-center justify-center font-bold text-center pt-0.5 text-sm font-serif">M</div>
                <div>
                  <h4 className="text-xs font-bold leading-none">Sister Maisha's Assistant</h4>
                  <span className="text-[9px] text-[#A6E8D4]">● Online Support</span>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:text-stone-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF9F5] scrollbar-thin text-xs">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${msg.sender === 'user' ? 'bg-[#0F4C3A] text-white rounded-tr-none' : 'bg-white text-slate-800 border border-stone-150 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="text-[10px] text-stone-400 italic">Sister Maisha is writing insights...</div>
              )}
            </div>

            {/* Conversational Inputs footer */}
            <div className="p-3 border-t bg-stone-50 flex gap-2">
              <input 
                type="text" 
                placeholder="Ask sizes, fabric quality, discounts..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 border border-stone-300 rounded-full px-3 py-1.5 text-xs bg-white focus:outline-none"
              />
              <button 
                onClick={handleSendChat}
                style={{ backgroundColor: themePrimaryColor }}
                className="text-white p-2 rounded-full cursor-pointer hover:bg-emerald-850"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL LAYOUTS PRODUCT EXPANDED DETAIL VIEW DIALOG POPUP */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute right-4 top-4 hover:bg-stone-100 p-2 rounded-full transition-all text-stone-500 hover:text-stone-800 z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-[280px] md:h-full bg-stone-50">
                  <img src={selectedProduct.images[0]} alt="product zoom" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-6 flex flex-col justify-between max-h-[500px] overflow-y-auto">
                  <div>
                    <span style={{ color: themeAccentColor }} className="text-[10px] font-bold uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded inline-block">{selectedProduct.category}</span>
                    <h3 className="font-serif text-xl font-bold text-slate-900 mt-2">{selectedProduct.title}</h3>
                    <p className="text-[11px] text-stone-400 mt-1">SKU identifier: <b>{selectedProduct.sku}</b></p>
                    
                    <div className="font-mono text-lg font-bold text-emerald-990 mt-3 flex items-center gap-2">
                      <span>BDT {selectedProduct.discountPrice || selectedProduct.price}</span>
                      {selectedProduct.discountPrice && (
                        <span className="line-through text-stone-400 text-xs font-normal">BDT {selectedProduct.price}</span>
                      )}
                    </div>

                    <p className="text-xs text-stone-500 mt-4 leading-relaxed">{selectedProduct.description}</p>
                    
                    {/* Sizing dropdown selectors */}
                    <div className="mt-5 space-y-3">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Size (Height in Inches)</span>
                        <div className="flex gap-2">
                          {selectedProduct.sizes.map(sz => (
                            <span key={sz} className="border border-stone-300 px-2.5 py-1 text-xs rounded-lg bg-stone-50 text-slate-800 font-bold">{sz}" fits</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Color Options</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {selectedProduct.colors.map(col => (
                            <span key={col} className="bg-emerald-50 text-emerald-900 border border-emerald-250 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">{col}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 border-t pt-4">
                    <button 
                      onClick={() => {
                        addToCart(selectedProduct, selectedProduct.colors[0], selectedProduct.sizes[0]);
                        setSelectedProduct(null);
                      }}
                      style={{ backgroundColor: themePrimaryColor }}
                      className="text-white text-xs font-bold px-6 py-3 rounded-full flex-1 hover:scale-103 transition-all cursor-pointer shadow"
                    >
                      Instant Add to bag
                    </button>
                    <button 
                      onClick={() => {
                        toggleWishlist(selectedProduct.id);
                        alert("Curated inside your wishlisted logs.");
                      }}
                      className="border border-stone-300 p-3 rounded-full hover:bg-stone-50"
                    >
                      kurze <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'fill-red-500 text-red-500' : 'text-stone-500'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSONAL STYLIST / CUSTOM SIZING INPUT DIALOG POPUP */}
      <AnimatePresence>
        {showSizingModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full relative"
            >
              <button 
                onClick={() => setShowSizingModal(false)}
                className="absolute right-4 top-4 hover:bg-stone-100 p-2 rounded-full text-stone-500 hover:text-stone-800"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-700 animate-spin" />
                <span>Your AI Styling & Sizing Advisor</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1 mb-6">Our generative style consult is optimized for standard South Asian heights (Inches 52 to 58) and color combinations.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Your height in feet/inches</label>
                  <select 
                    value={advisorForm.size}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, size: e.target.value })}
                    className="w-full text-xs p-2 border rounded-lg bg-stone-50/50"
                  >
                    <option value="52">Fits heights 5'0\" to 5'2\" (Size 52)</option>
                    <option value="54">Fits heights 5'3\" to 5'4\" (Size 54)</option>
                    <option value="56">Fits heights 5'5\" to 5'6\" (Size 56)</option>
                    <option value="58">Fits heights 5'7\" or above (Size 58)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Occasion / Theme Select</label>
                  <select 
                    value={advisorForm.occasion}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, occasion: e.target.value })}
                    className="w-full text-xs p-2 border rounded-lg bg-stone-50/50"
                  >
                    <option value="Daily Classroom">University & Classroom minimal</option>
                    <option value="Eid Festive">Grand Eid Modest Festive</option>
                    <option value="Wedding Formal">Walima & Wedding premium</option>
                    <option value="Casual Walk">Breathable daily outerwear</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Favorite Color Accent</label>
                  <select 
                    value={advisorForm.favoriteColor}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, favoriteColor: e.target.value })}
                    className="w-full text-xs p-2 border rounded-lg bg-stone-50/50"
                  >
                    <option value="Emerald Green">Dark Emerald / Emerald Green</option>
                    <option value="Soft Gold">Luxury Soft Gold Cream</option>
                    <option value="Midnight Black">Pure Midnight Black Classic</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleRequestAdvisorAdvice}
                    style={{ backgroundColor: themePrimaryColor }}
                    className="w-full text-white text-xs font-bold py-2.5 rounded-lg shadow inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {aiStylingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                    <span>Get AI recommendation</span>
                  </button>
                </div>
              </div>

              {aiStylingResult && (
                <div className="mt-6 p-4 bg-purple-50/50 rounded-2xl border border-purple-200 text-xs text-purple-950 font-serif leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                  {aiStylingResult}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-slate-900 text-stone-400 text-xs py-10 mt-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              {customization.companyLogoUrl && (
                <img 
                  src={customization.companyLogoUrl} 
                  className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]" 
                  alt="footer-logo" 
                  referrerPolicy="no-referrer"
                />
              )}
              <h4 className="font-serif text-lg font-bold text-white">{customization.companyName || "Maisha Borka House"}</h4>
            </div>
            <p className="leading-relaxed text-stone-400 text-xs max-w-xs">{customization.aboutText ? customization.aboutText.slice(0, 150) + "..." : ""}</p>
          </div>
          <div>
            <h4 className="font-serif text-md font-bold text-white mb-3">Modesty Collections</h4>
            <ul className="space-y-1.5 text-xs">
              {["Borka", "Abaya", "Kaftan", "Hijab"].map((c) => (
                <li key={c} onClick={() => { setSelectedCategory(c); setActiveTab('shop'); }} className="hover:text-yellow-400 cursor-pointer">
                  Premium {c} tailoring catalog
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-md font-bold text-white mb-3">Dhaka Central Hub & Contacts</h4>
            <div className="leading-relaxed text-stone-400 text-xs space-y-1">
              <p>helpline হেল্পলাইন: <span className="text-white font-bold">{customization.companyHelpline || "+880 1712-345678"}</span></p>
              <p>Email জিমেইল: <span className="text-white font-mono break-all">{customization.companyGmail || "maishaborkahouse@gmail.com"}</span></p>
              <p>WhatsApp হোয়াটসঅ্যাপ: <span className="text-white font-bold">{customization.companyWhatsapp || "+8801712345678"}</span></p>
              {customization.customFields && customization.customFields.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-800 space-y-1.5">
                  {customization.customFields.map((f) => (
                    <p key={f.id} className="text-[11px]">
                      <span className="text-amber-400 font-bold">{f.key}:</span> <span className="text-slate-300">{f.value}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 border-t border-stone-800 mt-8 pt-4 flex flex-col sm:flex-row justify-between text-[11px] text-stone-500">
          <span>© 2026 {customization.companyName || "Maisha Borka House"}. Developed under luxury Islamic fashion guidelines. All Rights Reserved.</span>
          <span className="hidden sm:inline">Made with devotion in Bangladesh</span>
        </div>
      </footer>

    </div>
  );
}

// COMPACT REUSABLE CARD DESIGN FOR PREMIUM GRID LAYOUT
function ProductCard({ 
  product, 
  themeAccent, 
  themePrimary, 
  onSelect, 
  onWishlist, 
  isWishlisted,
  onInstantAdd
}: {
  key?: string | number;
  product: Product;
  themeAccent: string;
  themePrimary: string;
  onSelect: () => void;
  onWishlist: () => void;
  isWishlisted: boolean;
  onInstantAdd: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl border border-stone-150 shadow-sm hover:shadow-md hover:scale-101 transition-all overflow-hidden flex flex-col justify-between group">
      
      {/* Upper image slot */}
      <div className="relative aspect-square bg-stone-100 overflow-hidden cursor-pointer" onClick={onSelect}>
        <img 
          src={product.images[0]} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
          referrerPolicy="no-referrer"
        />
        
        {/* Wishlist floating heart */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onWishlist();
          }}
          className="absolute top-3.5 right-3.5 p-2 bg-white/80 hover:bg-white backdrop-blur rounded-full shadow transition-all duration-300"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-500'}`} />
        </button>

        {/* Promo tags */}
        {product.isNewArrival && (
          <span className="absolute top-3.5 left-3.5 bg-[#0F4C3B] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            New Arrival
          </span>
        )}
        {product.isFlashSale && (
          <span className="absolute bottom-3.5 left-3.5 bg-yellow-500 text-emerald-990 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            Early Eid Sale 🌟
          </span>
        )}
      </div>

      {/* Downer descriptions details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span style={{ color: themeAccent }} className="text-[10px] uppercase font-bold tracking-widest">{product.category} weave</span>
          <h4 
            onClick={onSelect}
            className="font-serif text-md font-bold text-slate-900 mt-1 cursor-pointer hover:underline hover:text-[#0F4C3A] leading-snug line-clamp-1"
          >
            {product.title}
          </h4>
          <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed h-11">{product.shortDescription}</p>

          <div className="flex items-center gap-1.5 mt-3.5 text-amber-500">
            <span className="text-xs font-bold">{product.rating}</span>
            <div className="flex text-amber-400">★ ★ ★ ★ ★</div>
            <span className="text-[10px] text-stone-400">({product.reviewsCount} reviews)</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5 border-t border-stone-100 pt-4 mt-5">
          <div className="font-mono text-sm sm:text-base font-black text-slate-800">
            BDT {product.discountPrice || product.price}
            {product.discountPrice && (
              <span className="block text-[11px] line-through text-stone-400 font-normal">BDT {product.price}</span>
            )}
          </div>
          <button 
            onClick={onInstantAdd}
            style={{ backgroundColor: themePrimary }}
            className="text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 shadow-sm hover:scale-103 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buy now</span>
          </button>
        </div>
      </div>

    </div>
  );
}
