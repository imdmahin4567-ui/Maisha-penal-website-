export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice?: number;
  images: string[];
  colors: string[];
  sizes: string[];
  inventory: number;
  rating: number;
  reviewsCount: number;
  category: string;
  subcategory?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  isFlashSale?: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  imageUrl: string;
  quantity: number;
  color: string;
  size: string;
  price: number;
}

export interface ShippingAddress {
  address: string;
  phone: string;
  city: string;
  district: string;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket';
  shippingAddress: ShippingAddress;
  orderNotes?: string;
  createdAt: string;
  deliveryNotes?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Customization {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBanners: string[];
  accentColor: string;
  primaryColor: string;
  announcementText: string;
  aboutText: string;
  companyName?: string;
  companyLogoUrl?: string;
  companyHelpline?: string;
  companyGmail?: string;
  companyWhatsapp?: string;
  customFields?: { id: string; key: string; value: string }[];
}

export interface CartItem {
  id: string; // combination of productId_color_size
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
