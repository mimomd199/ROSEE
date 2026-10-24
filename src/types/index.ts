export type OrderStatus = 'pending' | 'processing' | 'packaged' | 'delivered' | 'rejected' | 'blocked';
export type PaymentStatus = 'unpaid' | 'deposit' | 'paid';

export interface ProductSize {
  name: string;
  price: number;
  cost?: number;
  originalPrice?: number;
}

export interface CatalogItem {
  defaultPrice: number;
  cost: number;
  image: string;
  images?: string[];
  description?: string;
  stockQty?: number;
  alertLimit?: number;
  showStock?: boolean;
  isOutOfStock?: boolean;
  isBestseller?: boolean;
  hasSizes?: boolean;
  sizes?: ProductSize[];
  collectionName?: string;
  collectionImage?: string;
  batchNumber?: string; // رقم التشغيلة
  expiryDate?: string;  // تاريخ الانتهاء (YYYY-MM-DD)
  productionDate?: string; // تاريخ الإنتاج
}

export interface ProductCatalog {
  [key: string]: CatalogItem;
}

export interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  selectedSize?: string;
}

export interface OrderHistoryEntry {
  timestamp: string;
  user: string;
  action: string;
}

export interface Order {
  id: string;
  date: string;
  name: string;
  phone: string;
  customerPhone?: string;
  address: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  depositAmount?: number;
  remainingAmount?: number;
  discountVal: number;
  discountType: 'fixed' | 'percent';
  discountReason: string;
  paymentMethod: 'cod' | 'instapay';
  paymentRef?: string;
  paymentImage?: string;
  lastModifiedBy?: string;
  source: 'يدوي' | 'أونلاين';
  archived: boolean;
  history: OrderHistoryEntry[];
  items: OrderItem[];
  rejectionReason?: string;
  // Luxury Gifting Module Fields
  isGift?: boolean;
  giftPackagingId?: string;
  giftPackagingName?: string;
  giftPackagingPrice?: number;
  giftMessage?: string;
  hidePriceOnInvoice?: boolean;
}

export interface Offer {
  id: string;
  title: string;
  text: string;
  image?: string;
  status: 'scheduled' | 'published';
}

export interface PromoCode {
  discountPercent: number;
  expiryDate: string | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  allowedPhones?: string[];
}

export interface CustomerReview {
  customerName: string;
  phone: string;
  productName: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved';
  image?: string;
  date: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface SystemLog {
  timestamp: string;
  user: string;
  action: string;
}

export interface UserPermission {
  id: string;
  label: string;
}

export interface UserAccount {
  name: string;
  role: 'admin' | 'user';
  password?: string;
  email?: string;
  permissions: string[];
  reset_otp?: string;
  reset_token?: string;
  reset_token_expires?: number | string;
}

export interface TrustBadge {
  id?: string;
  icon: string;
  text: string;
  description?: string;
  enabled?: boolean;
}

export interface FeaturedHeroCard {
  id: string;
  badge?: string;
  brandName?: string;
  mainHeading?: string;
  subtitle?: string;
  headline?: string;
  description?: string;
  primaryBtnText?: string;
  cardTag?: string;
  cardTitle: string;
  cardDesc?: string;
  image: string;
  enabled?: boolean;
}

export type StoreSectionId = 
  | 'marquee' 
  | 'hero' 
  | 'offers' 
  | 'reels' 
  | 'bestsellers' 
  | 'collections' 
  | 'catalog' 
  | 'trust_badges' 
  | 'reviews';

export interface StoreSectionSetting {
  id: StoreSectionId;
  label: string;
  description?: string;
  enabled: boolean;
  subElements?: { [key: string]: boolean };
}

export interface StoreColors {
  primaryAccent: string;
  secondaryAccent: string;
  marqueeBg: string;
  marqueeText: string;
  headerBg: string;
  headerBrandColor: string;
  headerTitleColor: string;
  headerSubtitleColor: string;
  headerSloganColor: string;
  headerNavColor: string;
  heroBgStart: string;
  heroBgEnd: string;
  heroBadgeBg: string;
  heroBadgeText: string;
  heroBrandColor: string;
  heroTitleColor: string;
  heroSubtitleColor: string;
  heroHeadlineColor: string;
  heroDescColor: string;
  heroBtnBg: string;
  heroBtnText: string;
  heroSecondaryBtnBg: string;
  heroSecondaryBtnText: string;
  cardBg: string;
  cardBorder: string;
  cardTitleColor: string;
  cardCategoryBg: string;
  cardCategoryText: string;
  cardPriceColor: string;
  cardBtnBg: string;
  cardBtnText: string;
  groupHeaderBg: string;
  groupHeaderTextColor: string;
  groupHeaderBorder: string;
  trustBg: string;
  trustCardBg: string;
  trustTextColor: string;
  reviewsBg: string;
  reviewsStarColor: string;
  offersPopupBg: string;
  offersPopupHeaderBg: string;
  offersPopupAccent: string;
  footerBg: string;
  footerBrandColor: string;
  footerTaglineColor: string;
  footerTextColor: string;
}

export interface StoreAnimations {
  enableAnimations: boolean;
  enableFlyToCart: boolean;
  flyToCartSpeed: 'fast' | 'normal' | 'smooth';
  heroEffect: 'fade-zoom' | 'slide-up' | 'float' | 'none';
  cardHoverEffect: 'lift' | 'glow' | 'scale' | 'none';
  marqueeSpeed: 'slow' | 'normal' | 'fast';
  offersPopupPanStyle: 'pan-left' | 'fade-zoom' | 'slide-bottom';
  buttonRipple: boolean;
  categoryAccordionSpeed: 'smooth' | 'instant';
}

export interface StoreIcons {
  cartIconStyle: 'bag' | 'cart' | 'basket' | 'sparkle';
  searchIconStyle: 'standard' | 'minimal' | 'rounded';
  badgePulseStyle: 'pulse' | 'glow' | 'bounce' | 'static';
  ratingIcon: 'star' | 'heart' | 'sparkle';
  categoryIconStyle: 'chevron' | 'arrow' | 'plus-minus' | 'minimal';
}

export interface StoreTexts {
  // Brand & Header
  brandName: string;
  headerMainTitle: string;
  headerTagline: string;
  headerArabicSlogan: string;
  navCollection: string;
  navBestsellers: string;
  navTracking: string;
  navReviews: string;
  btnOffers: string;
  btnTracking: string;
  btnCart: string;

  // Hero Section
  heroBadge: string;
  heroBrandName: string;
  heroMainHeading: string;
  heroSubtitle: string;
  heroArabicHeadline: string;
  heroDescription: string;
  heroPrimaryBtn: string;
  heroSecondaryBtn: string;
  heroSocialLabel: string;
  heroCardTag: string;
  heroCardTitle: string;
  heroCardDesc: string;
  heroCardImage: string;

  // Bestsellers Section
  bestsellersBadge: string;
  bestsellersTitle: string;

  // Catalog Section
  catalogBadge: string;
  catalogTitle: string;
  filterAll: string;
  filterWomen: string;
  filterMen: string;
  filterUnisex: string;
  searchPlaceholder: string;
  addCartBtn: string;

  // Reviews Section
  reviewsBadge: string;
  reviewsTitle: string;

  // Offers Pop-up Modal
  offersModalBadge: string;
  offersModalCta: string;
  offersModalSkip: string;

  // Footer Section
  footerBrandName: string;
  footerTagline: string;
  footerBio: string;

  // WhatsApp Message
  whatsappDefaultMsg: string;
}

export interface SocialDockSettings {
  size?: 'micro' | 'compact' | 'standard';
  theme?: 'gold_luxury' | 'glassmorphism' | 'brand_colors' | 'minimal_dark';
  position?: 'left' | 'right';
  motionEffect?: 'luxury_pulse' | 'glow_aura' | 'subtle_bounce' | 'static';
  showOnMobile?: boolean;
}

// --- MARKETING & CONVERSION FEATURES TYPES ---

export interface QuizOption {
  id: string;
  label: string;
  matchedProduct?: string; // Product key from catalog
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface QuizConfig {
  enabled: boolean;
  useAI: boolean; // Toggle: Gemini AI recommendation vs manual mapping
  title: string;
  subtitle: string;
  questions: QuizQuestion[];
}

export interface GiftPackagingOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  enabled: boolean;
}

export interface GiftingConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  packagingOptions: GiftPackagingOption[];
}

export interface AbandonedCart {
  id: string;
  phone: string;
  customerPhone?: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  updatedAt: string;
  lastUpdated?: string;
  createdAt?: string;
  recovered?: boolean;
  notes?: string;
}

export interface BackInStockRequest {
  id: string;
  productKey: string;
  productName: string;
  customerPhone: string;
  customerName?: string;
  createdAt: string;
  requestedAt?: string;
  notified?: boolean;
}

export interface SpinPrize {
  id: string;
  label: string; // e.g. "خصم 15% على طلبك"
  promoCode: string; // e.g. "ROSE15"
  discountPercent?: number;
  probability: number; // e.g. 25 (%)
  color: string;
  textColor?: string;
}

export type SpinWheelPrize = SpinPrize;

export interface SpinWheelConfig {
  enabled: boolean;
  triggerType: 'on_enter' | 'exit_intent' | 'button_only';
  triggerDelaySeconds?: number;
  title: string;
  subtitle: string;
  buttonLabel?: string;
  wheelSize?: 'compact' | 'standard' | 'large' | 'xlarge';
  prizes: SpinPrize[];
}

export interface TreasureHuntConfig {
  enabled: boolean;
  targetCount: number; // e.g. 3
  rewardPromoCode: string; // e.g. "GOLDENROSE20"
  rewardDiscountPercent?: number;
  rewardTitle?: string;
  rewardMessage?: string;
  placedProductKeys: string[]; // List of catalog item keys where roses are placed
}

export interface AppSettings {
  loyaltyPointValue: number;
  loyaltyEgpPerPoint?: number;
  loyaltyPointDiscountValue?: number;
  instapayAccount: string;
  instapayLink?: string;
  socialLinks: {
    insta: string;
    fb: string;
    whatsapp: string;
    tiktok: string;
  };
  socialDockSettings?: SocialDockSettings;
  marqueeText: string;
  trustBadges: TrustBadge[];
  featuredCards?: FeaturedHeroCard[];
  colors?: Partial<StoreColors>;
  texts?: Partial<StoreTexts>;
  animations?: Partial<StoreAnimations>;
  icons?: Partial<StoreIcons>;
  sectionsLayout?: StoreSectionSetting[];
  productGroupsOrder?: string[];
  catalogItemsOrder?: string[];
  subElementsVisibility?: { [key: string]: boolean };
  // Client UI elements sizing
  clientUiScale?: 'compact' | 'standard' | 'comfortable' | 'large';
  clientCardSize?: 'compact' | 'standard' | 'spacious';
  clientFontScale?: 'small' | 'standard' | 'large';
  // Marketing modules configs
  quizConfig?: QuizConfig;
  giftingConfig?: GiftingConfig;
  spinWheelConfig?: SpinWheelConfig;
  treasureHuntConfig?: TreasureHuntConfig;
  // Transactional Email Service
  resendApiKey?: string;
  resendSenderEmail?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure?: boolean;
    senderName?: string;
  };
}

export interface ReelItem {
  id: string;
  title: string;
  videoUrl?: string;
  thumbnail: string;
  productName?: string;
  duration?: string;
  likesCount?: number;
  creatorHandle?: string;
  status: 'published' | 'hidden';
  caption?: string;
}

export interface CollectionGroup {
  id: string;
  name: string;
  image: string;
  description?: string;
  categoryTag?: string;
  enabled?: boolean;
}

export interface RoseeDatabase {
  orders: Order[];
  catalog: ProductCatalog;
  offers: Offer[];
  reels?: ReelItem[];
  collections?: CollectionGroup[];
  users: { [code: string]: UserAccount };
  promoCodes: { [code: string]: PromoCode };
  globalAlert: string;
  reviews: { [id: string]: CustomerReview };
  expenses: Expense[];
  systemLogs: SystemLog[];
  settings: AppSettings;
  abandonedCarts?: AbandonedCart[];
  backInStockRequests?: BackInStockRequest[];
}
