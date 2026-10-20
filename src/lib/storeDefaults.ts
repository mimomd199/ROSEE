import { 
  StoreColors, 
  StoreTexts, 
  StoreAnimations, 
  StoreIcons, 
  AppSettings, 
  FeaturedHeroCard, 
  TrustBadge, 
  SocialDockSettings, 
  StoreSectionSetting, 
  StoreSectionId,
  QuizConfig,
  GiftingConfig,
  SpinWheelConfig,
  TreasureHuntConfig
} from '../types';

export const DEFAULT_SOCIAL_DOCK_SETTINGS: SocialDockSettings = {
  size: 'compact',
  theme: 'gold_luxury',
  position: 'left',
  motionEffect: 'luxury_pulse',
  showOnMobile: true
};

export const DARK_STORE_COLORS: StoreColors = {
  primaryAccent: '#C5A059',
  secondaryAccent: '#DFB76C',
  marqueeBg: '#080808',
  marqueeText: '#C5A059',
  headerBg: '#0D0D0D',
  headerBrandColor: '#C5A059',
  headerTitleColor: '#F9FAFB',
  headerSubtitleColor: '#C5A059',
  headerSloganColor: '#9CA3AF',
  headerNavColor: '#E5E7EB',
  heroBgStart: '#111111',
  heroBgEnd: '#080808',
  heroBadgeBg: '#2A200B',
  heroBadgeText: '#DFB76C',
  heroBrandColor: '#C5A059',
  heroTitleColor: '#F9FAFB',
  heroSubtitleColor: '#C5A059',
  heroHeadlineColor: '#F3F4F6',
  heroDescColor: '#9CA3AF',
  heroBtnBg: '#C5A059',
  heroBtnText: '#0A0A0A',
  heroSecondaryBtnBg: '#1C1C1C',
  heroSecondaryBtnText: '#F3F4F6',
  cardBg: '#141414',
  cardBorder: '#262626',
  cardTitleColor: '#F9FAFB',
  cardCategoryBg: '#222222',
  cardCategoryText: '#C5A059',
  cardPriceColor: '#F9FAFB',
  cardBtnBg: '#C5A059',
  cardBtnText: '#0A0A0A',
  groupHeaderBg: '#141414',
  groupHeaderTextColor: '#F9FAFB',
  groupHeaderBorder: '#2A2A2A',
  trustBg: '#0D0D0D',
  trustCardBg: '#161616',
  trustTextColor: '#F9FAFB',
  reviewsBg: '#101010',
  reviewsStarColor: '#C5A059',
  offersPopupBg: '#141414',
  offersPopupHeaderBg: '#0A0A0A',
  offersPopupAccent: '#C5A059',
  footerBg: '#080808',
  footerBrandColor: '#F9FAFB',
  footerTaglineColor: '#C5A059',
  footerTextColor: '#9CA3AF'
};

export const DEFAULT_STORE_COLORS: StoreColors = {
  primaryAccent: '#C5A059',
  secondaryAccent: '#8C6D2D',
  marqueeBg: '#111111',
  marqueeText: '#C5A059',
  headerBg: '#FFFFFF',
  headerBrandColor: '#C5A059',
  headerTitleColor: '#111111',
  headerSubtitleColor: '#C5A059',
  headerSloganColor: '#6B7280',
  headerNavColor: '#374151',
  heroBgStart: '#FFFFFF',
  heroBgEnd: '#FAF9F6',
  heroBadgeBg: '#FAF3E0',
  heroBadgeText: '#8C6D2D',
  heroBrandColor: '#C5A059',
  heroTitleColor: '#111111',
  heroSubtitleColor: '#8C6D2D',
  heroHeadlineColor: '#1F2937',
  heroDescColor: '#4B5563',
  heroBtnBg: '#111111',
  heroBtnText: '#FFFFFF',
  heroSecondaryBtnBg: '#FFFFFF',
  heroSecondaryBtnText: '#111111',
  cardBg: '#FFFFFF',
  cardBorder: '#F3F4F6',
  cardTitleColor: '#111111',
  cardCategoryBg: '#111111',
  cardCategoryText: '#C5A059',
  cardPriceColor: '#111111',
  cardBtnBg: '#111111',
  cardBtnText: '#FFFFFF',
  groupHeaderBg: '#FFFFFF',
  groupHeaderTextColor: '#111111',
  groupHeaderBorder: '#E5E7EB',
  trustBg: '#FAF9F6',
  trustCardBg: '#FFFFFF',
  trustTextColor: '#111111',
  reviewsBg: '#FFFFFF',
  reviewsStarColor: '#C5A059',
  offersPopupBg: '#FFFFFF',
  offersPopupHeaderBg: '#111111',
  offersPopupAccent: '#C5A059',
  footerBg: '#111111',
  footerBrandColor: '#FFFFFF',
  footerTaglineColor: '#C5A059',
  footerTextColor: '#9CA3AF'
};

export const DEFAULT_STORE_TEXTS: StoreTexts = {
  // Brand & Header
  brandName: 'R O S É E',
  headerMainTitle: 'SKINCARE & BEAUTY',
  headerTagline: 'ELEVATE YOUR DAILY ROUTINE',
  headerArabicSlogan: 'احنا مش موقع برفانات احنا مستحضرات تجميل وعناية بالبشرة ومستحضرات تجميل',
  navCollection: 'تشكيلة العناية والتجميل',
  navBestsellers: 'الأكثر طلباً',
  navTracking: 'تتبع الطلب',
  navReviews: 'آراء العملاء',
  btnOffers: 'العروض المتاحة',
  btnTracking: 'تتبع طلبي',
  btnCart: 'السلة',

  // Hero Section
  heroBadge: 'مستحضرات تجميل وعناية فائقة بالبشرة',
  heroBrandName: 'ROSÉE',
  heroMainHeading: 'SKINCARE & BEAUTY',
  heroSubtitle: 'ELEVATE YOUR DAILY ROUTINE',
  heroArabicHeadline: 'مستحضرات تجميل وعناية بالبشرة مصممة خصيصاً للارتقاء بروتين جمالكِ اليومي',
  heroDescription: 'نبتكر في ROSÉE أرقى تركيبات مستحضرات التجميل والعناية بالبشرة الغنية بالفيتامينات والزيوت الطبيعية النقية والمستخلصات الفعالة، لنمنح بشرتكِ إشراقة نضرة ولمسة جمالية ساحرة.',
  heroPrimaryBtn: 'تسوقي منتجات العناية والتجميل',
  heroSecondaryBtn: 'الاستعلام عن طلب سابق',
  heroSocialLabel: 'تابعينا:',
  heroCardTag: 'Skincare & Beauty',
  heroCardTitle: 'Rose Gold Glow Elixir',
  heroCardDesc: 'سيروم عناية فائق ومستحضر تجميل غني ببتلات الورد وزيوت الترطيب العميقة لنضارة وإشراقة طبيعية.',
  heroCardImage: 'https://images.unsplash.com/photo-1608248597359-0f6667115858?auto=format&fit=crop&w=800&q=80',

  // Bestsellers Section
  bestsellersBadge: 'Top Picks',
  bestsellersTitle: 'مستحضرات التجميل والعناية الأكثر طلباً',

  // Catalog Section
  catalogBadge: 'Catalogue',
  catalogTitle: 'تشكيلة مستحضرات التجميل والعناية بالبشرة',
  filterAll: 'الكل',
  filterWomen: 'نسائي',
  filterMen: 'رجالي',
  filterUnisex: 'للجنسين',
  searchPlaceholder: 'بحث عن مستحضر تجميل أو عناية...',
  addCartBtn: 'إضافة +',

  // Reviews Section
  reviewsBadge: 'Client Feedback',
  reviewsTitle: 'آراء وتجارب عملائنا المميزين',

  // Offers Pop-up Modal
  offersModalBadge: 'عروض وخصومات حصرية',
  offersModalCta: 'تسوقي العرض الآن ✨',
  offersModalSkip: 'تخطي ومتابعة تصفح المتجر',

  // Footer Section
  footerBrandName: 'R O S É E',
  footerTagline: 'SKINCARE & BEAUTY — ELEVATE YOUR DAILY ROUTINE',
  footerBio: 'العلامة الرائدة في ابتكار أرقى مستحضرات التجميل والعناية الفائقة بالبشرة. جميع الحقوق محفوظة ©',

  // WhatsApp Message
  whatsappDefaultMsg: 'مرحباً بك في ROSÉE ✨ أود الاستفسار عن مستحضرات التجميل والعناية بالبشرة والعروض المتاحة.'
};

export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  primaryPreview: string;
  secondaryPreview: string;
  bgPreview: string;
  colors: Partial<StoreColors>;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'royal_gold',
    name: 'الذهبي الملكي والأسود (الافتراضي)',
    description: 'أناقة كلاسيكية فاخرة تجمع بين الذهبي #C5A059 والأسود والأوف وايت',
    primaryPreview: '#C5A059',
    secondaryPreview: '#8C6D2D',
    bgPreview: '#FAF9F6',
    colors: { ...DEFAULT_STORE_COLORS }
  },
  {
    id: 'rose_blush',
    name: 'الذهب الوردي والبلاش الحالم',
    description: 'لمسة أنثوية ناعمة مع الذهب الوردي والبلاش الرقيق',
    primaryPreview: '#D48372',
    secondaryPreview: '#9E4A3B',
    bgPreview: '#FFF7F8',
    colors: {
      primaryAccent: '#D48372',
      secondaryAccent: '#9E4A3B',
      marqueeBg: '#2B1B1E',
      marqueeText: '#E8A598',
      headerBg: '#FFFFFF',
      headerBrandColor: '#D48372',
      headerTitleColor: '#2B1B1E',
      headerSubtitleColor: '#D48372',
      headerSloganColor: '#7C676A',
      headerNavColor: '#4A3B3E',
      heroBgStart: '#FFFFFF',
      heroBgEnd: '#FFF7F8',
      heroBadgeBg: '#FCE7EB',
      heroBadgeText: '#9E4A3B',
      heroBrandColor: '#D48372',
      heroTitleColor: '#2B1B1E',
      heroSubtitleColor: '#9E4A3B',
      heroHeadlineColor: '#2B1B1E',
      heroDescColor: '#5C4A4D',
      heroBtnBg: '#2B1B1E',
      heroBtnText: '#FFFFFF',
      heroSecondaryBtnBg: '#FFFFFF',
      heroSecondaryBtnText: '#2B1B1E',
      cardBg: '#FFFFFF',
      cardBorder: '#F9E5E9',
      cardTitleColor: '#2B1B1E',
      cardCategoryBg: '#2B1B1E',
      cardCategoryText: '#E8A598',
      cardPriceColor: '#2B1B1E',
      cardBtnBg: '#2B1B1E',
      cardBtnText: '#FFFFFF',
      trustBg: '#FFF7F8',
      trustCardBg: '#FFFFFF',
      trustTextColor: '#2B1B1E',
      reviewsBg: '#FFFFFF',
      reviewsStarColor: '#D48372',
      offersPopupBg: '#FFFFFF',
      offersPopupHeaderBg: '#2B1B1E',
      offersPopupAccent: '#D48372',
      footerBg: '#2B1B1E',
      footerBrandColor: '#FFFFFF',
      footerTaglineColor: '#D48372',
      footerTextColor: '#B39E9F'
    }
  },
  {
    id: 'imperial_emerald',
    name: 'الزمردي الإمبراطوري الراقي',
    description: 'فخامة البوتيكات الأوروبية مع الأخضر الزمردي واللمسات الذهبية',
    primaryPreview: '#D4AF37',
    secondaryPreview: '#1B4D3E',
    bgPreview: '#F4F8F6',
    colors: {
      primaryAccent: '#D4AF37',
      secondaryAccent: '#1B4D3E',
      marqueeBg: '#0F2C23',
      marqueeText: '#D4AF37',
      headerBg: '#FFFFFF',
      headerBrandColor: '#1B4D3E',
      headerTitleColor: '#0F2C23',
      headerSubtitleColor: '#D4AF37',
      headerSloganColor: '#4A6B60',
      headerNavColor: '#1B4D3E',
      heroBgStart: '#FFFFFF',
      heroBgEnd: '#F4F8F6',
      heroBadgeBg: '#E2EFEA',
      heroBadgeText: '#1B4D3E',
      heroBrandColor: '#1B4D3E',
      heroTitleColor: '#0F2C23',
      heroSubtitleColor: '#D4AF37',
      heroHeadlineColor: '#0F2C23',
      heroDescColor: '#365349',
      heroBtnBg: '#0F2C23',
      heroBtnText: '#FFFFFF',
      heroSecondaryBtnBg: '#FFFFFF',
      heroSecondaryBtnText: '#0F2C23',
      cardBg: '#FFFFFF',
      cardBorder: '#E0EDE7',
      cardTitleColor: '#0F2C23',
      cardCategoryBg: '#0F2C23',
      cardCategoryText: '#D4AF37',
      cardPriceColor: '#0F2C23',
      cardBtnBg: '#0F2C23',
      cardBtnText: '#FFFFFF',
      trustBg: '#F4F8F6',
      trustCardBg: '#FFFFFF',
      trustTextColor: '#0F2C23',
      reviewsBg: '#FFFFFF',
      reviewsStarColor: '#D4AF37',
      offersPopupBg: '#FFFFFF',
      offersPopupHeaderBg: '#0F2C23',
      offersPopupAccent: '#D4AF37',
      footerBg: '#0F2C23',
      footerBrandColor: '#FFFFFF',
      footerTaglineColor: '#D4AF37',
      footerTextColor: '#8FAAA0'
    }
  },
  {
    id: 'velvet_midnight',
    name: 'الكحلي الليلي واللؤلؤ',
    description: 'عمق وسحر مع الأزرق الكحلي الليلي والذهب المضيء',
    primaryPreview: '#C9A84C',
    secondaryPreview: '#172554',
    bgPreview: '#F8FAFC',
    colors: {
      primaryAccent: '#C9A84C',
      secondaryAccent: '#1E3A8A',
      marqueeBg: '#0B132B',
      marqueeText: '#C9A84C',
      headerBg: '#FFFFFF',
      headerBrandColor: '#0B132B',
      headerTitleColor: '#0B132B',
      headerSubtitleColor: '#C9A84C',
      headerSloganColor: '#64748B',
      headerNavColor: '#1E293B',
      heroBgStart: '#FFFFFF',
      heroBgEnd: '#F8FAFC',
      heroBadgeBg: '#EEF2FF',
      heroBadgeText: '#1E3A8A',
      heroBrandColor: '#0B132B',
      heroTitleColor: '#0B132B',
      heroSubtitleColor: '#C9A84C',
      heroHeadlineColor: '#0B132B',
      heroDescColor: '#475569',
      heroBtnBg: '#0B132B',
      heroBtnText: '#FFFFFF',
      heroSecondaryBtnBg: '#FFFFFF',
      heroSecondaryBtnText: '#0B132B',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      cardTitleColor: '#0B132B',
      cardCategoryBg: '#0B132B',
      cardCategoryText: '#C9A84C',
      cardPriceColor: '#0B132B',
      cardBtnBg: '#0B132B',
      cardBtnText: '#FFFFFF',
      trustBg: '#F8FAFC',
      trustCardBg: '#FFFFFF',
      trustTextColor: '#0B132B',
      reviewsBg: '#FFFFFF',
      reviewsStarColor: '#C9A84C',
      offersPopupBg: '#FFFFFF',
      offersPopupHeaderBg: '#0B132B',
      offersPopupAccent: '#C9A84C',
      footerBg: '#0B132B',
      footerBrandColor: '#FFFFFF',
      footerTaglineColor: '#C9A84C',
      footerTextColor: '#94A3B8'
    }
  },
  {
    id: 'enchanted_lavender',
    name: 'اللافندر الملكي واللؤلؤ',
    description: 'هدوء وجاذبية لا تُقاوم مع درجات اللافندر والبنفسج الفاخر',
    primaryPreview: '#9368B7',
    secondaryPreview: '#5B3782',
    bgPreview: '#FBF9FD',
    colors: {
      primaryAccent: '#9368B7',
      secondaryAccent: '#5B3782',
      marqueeBg: '#211330',
      marqueeText: '#C9A6E8',
      headerBg: '#FFFFFF',
      headerBrandColor: '#5B3782',
      headerTitleColor: '#211330',
      headerSubtitleColor: '#9368B7',
      headerSloganColor: '#7E6B8D',
      headerNavColor: '#39244E',
      heroBgStart: '#FFFFFF',
      heroBgEnd: '#FBF9FD',
      heroBadgeBg: '#F3E8FA',
      heroBadgeText: '#5B3782',
      heroBrandColor: '#5B3782',
      heroTitleColor: '#211330',
      heroSubtitleColor: '#9368B7',
      heroHeadlineColor: '#211330',
      heroDescColor: '#534363',
      heroBtnBg: '#211330',
      heroBtnText: '#FFFFFF',
      heroSecondaryBtnBg: '#FFFFFF',
      heroSecondaryBtnText: '#211330',
      cardBg: '#FFFFFF',
      cardBorder: '#F0E5F5',
      cardTitleColor: '#211330',
      cardCategoryBg: '#211330',
      cardCategoryText: '#C9A6E8',
      cardPriceColor: '#211330',
      cardBtnBg: '#211330',
      cardBtnText: '#FFFFFF',
      trustBg: '#FBF9FD',
      trustCardBg: '#FFFFFF',
      trustTextColor: '#211330',
      reviewsBg: '#FFFFFF',
      reviewsStarColor: '#9368B7',
      offersPopupBg: '#FFFFFF',
      offersPopupHeaderBg: '#211330',
      offersPopupAccent: '#9368B7',
      footerBg: '#211330',
      footerBrandColor: '#FFFFFF',
      footerTaglineColor: '#C9A6E8',
      footerTextColor: '#A899B8'
    }
  }
];

export function getResolvedColors(settings?: AppSettings): StoreColors {
  if (!settings?.colors) return { ...DEFAULT_STORE_COLORS };
  return {
    ...DEFAULT_STORE_COLORS,
    ...settings.colors
  };
}

export const EN_STORE_TEXTS: StoreTexts = {
  brandName: 'R O S É E',
  headerMainTitle: 'SKINCARE & BEAUTY',
  headerTagline: 'ELEVATE YOUR DAILY ROUTINE',
  headerArabicSlogan: 'Luxury Skincare, Formulas & Everyday Radiance',
  navCollection: 'Collection',
  navBestsellers: 'Bestsellers',
  navTracking: 'Track Order',
  navReviews: 'Client Reviews',
  btnOffers: 'Offers',
  btnTracking: 'Track Order',
  btnCart: 'Bag',
  heroBadge: 'Pure Skincare & Beauty Formulations',
  heroBrandName: 'ROSÉE',
  heroMainHeading: 'SKINCARE & BEAUTY',
  heroSubtitle: 'ELEVATE YOUR DAILY ROUTINE',
  heroArabicHeadline: 'Premium Skincare & Cosmetics Tailored For Your Radiant Glow',
  heroDescription: 'Crafted with potent botanicals, nourishing elixirs, and clean actives for unmatched luminosity and velvety hydration.',
  heroPrimaryBtn: 'Shop Luxury Collection',
  heroSecondaryBtn: 'Track Existing Order',
  heroSocialLabel: 'Follow us:',
  heroCardTag: 'Skincare & Beauty',
  heroCardTitle: 'Rose Gold Glow Elixir',
  heroCardDesc: 'Infused with precious damask rose petals and deep hydrating oils for natural radiant brilliance.',
  heroCardImage: 'https://images.unsplash.com/photo-1608248597359-0f6667115858?auto=format&fit=crop&w=800&q=80',
  bestsellersBadge: 'Top Picks',
  bestsellersTitle: 'Most Loved Skincare & Beauty Best-Sellers',
  catalogBadge: 'Catalogue',
  catalogTitle: 'Full Skincare & Cosmetics Collection',
  filterAll: 'All',
  filterWomen: 'Women',
  filterMen: 'Men',
  filterUnisex: 'Unisex',
  searchPlaceholder: 'Search skincare, cosmetics, or shade...',
  addCartBtn: 'Add +',
  reviewsBadge: 'Client Feedback',
  reviewsTitle: 'Verified Customer Reviews & Love',
  offersModalBadge: 'Exclusive Flash Offers',
  offersModalCta: 'Claim Offer Now',
  offersModalSkip: 'Continue Shopping',
  footerBrandName: 'ROSÉE BEAUTY & CARE',
  footerTagline: 'Elevating Everyday Radiance & Confidence',
  footerBio: 'Authentic formulas, dermatologist-tested ingredients, and rapid nationwide delivery with cash on delivery.',
  whatsappDefaultMsg: 'Hello Rosée, I would like to inquire about current products and offers ✨'
};

export function getResolvedTexts(settings?: AppSettings, lang: 'ar' | 'en' = 'ar'): StoreTexts {
  if (lang === 'en') {
    return {
      ...EN_STORE_TEXTS,
      ...(settings?.texts?.brandName ? { brandName: settings.texts.brandName } : {})
    };
  }
  if (!settings?.texts) return { ...DEFAULT_STORE_TEXTS };
  return {
    ...DEFAULT_STORE_TEXTS,
    ...settings.texts
  };
}

export function getResolvedSocialDockSettings(settings?: AppSettings): SocialDockSettings {
  if (!settings?.socialDockSettings) return { ...DEFAULT_SOCIAL_DOCK_SETTINGS };
  return {
    ...DEFAULT_SOCIAL_DOCK_SETTINGS,
    ...settings.socialDockSettings
  };
}

export const DEFAULT_STORE_ANIMATIONS: StoreAnimations = {
  enableAnimations: true,
  enableFlyToCart: true,
  flyToCartSpeed: 'normal',
  heroEffect: 'fade-zoom',
  cardHoverEffect: 'lift',
  marqueeSpeed: 'normal',
  offersPopupPanStyle: 'pan-left',
  buttonRipple: true,
  categoryAccordionSpeed: 'smooth'
};

export const DEFAULT_STORE_ICONS: StoreIcons = {
  cartIconStyle: 'bag',
  searchIconStyle: 'standard',
  badgePulseStyle: 'pulse',
  ratingIcon: 'star',
  categoryIconStyle: 'chevron'
};

export function getResolvedAnimations(settings?: AppSettings): StoreAnimations {
  if (!settings?.animations) return { ...DEFAULT_STORE_ANIMATIONS };
  return {
    ...DEFAULT_STORE_ANIMATIONS,
    ...settings.animations
  };
}

export function getResolvedIcons(settings?: AppSettings): StoreIcons {
  if (!settings?.icons) return { ...DEFAULT_STORE_ICONS };
  return {
    ...DEFAULT_STORE_ICONS,
    ...settings.icons
  };
}

export const DEFAULT_TRUST_BADGES: TrustBadge[] = [
  { id: 'tb-1', icon: 'Leaf', text: 'مكونات طبيعية آمنة', description: 'خالية من المواد الضارة' },
  { id: 'tb-2', icon: 'Truck', text: 'شحن سريع لكافة المحافظات', description: 'توصيل لباب بيتك' },
  { id: 'tb-3', icon: 'Award', text: 'جودة استثنائية مضمونة', description: 'أعلى معايير النقاء' },
  { id: 'tb-4', icon: 'ShieldCheck', text: 'دفع آمن عند الاستلام', description: 'معاينة قبل الاستلام' }
];

export const DEFAULT_FEATURED_CARDS: FeaturedHeroCard[] = [
  {
    id: 'hero-1',
    badge: 'إصدار حصري 2026',
    brandName: 'ROSÉE PARIS',
    mainHeading: 'EAU DE BEAUTÉ & SOIN',
    subtitle: 'LUXURY SKINCARE & COSMETICS',
    headline: 'عناية فائقة تمنح بشرتك إشراقة دائمة وملمساً مخملياً',
    description: 'مستحضرات تجميل وعناية طبيعية وراقية تلامس حواسك بنقاء استثنائي وجودة فرنسية تدوم طوال اليوم.',
    primaryBtnText: 'تسوق التشكيلة الآن',
    cardTag: 'BESTSELLER',
    cardTitle: 'مجموعة الورد الملكي',
    cardDesc: 'ترطيب عميق وإشراقة طبيعية مفعمة بالأنوثة والحيوية',
    image: 'https://images.unsplash.com/photo-1608248597359-0f6667115858?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'hero-2',
    badge: 'الأكثر طلباً ومبيعاً',
    brandName: 'ROSÉE BOTANIQUE',
    mainHeading: 'PURE RADIANCE SERUM',
    subtitle: 'VELVET TOUCH & NOURISHMENT',
    headline: 'تركيبة غنية بالخلاصات الطبيعية لتغذية ونضارة متكاملة',
    description: 'مزيج فاخر من الفيتامينات والزيوت العطرية النقية يمنحك حضوراً آسراً وبشرة ناعمة كالحرير.',
    primaryBtnText: 'استكشف الآن',
    cardTag: 'EXCLUSIVE',
    cardTitle: 'سيروم الإشراقة الفوري',
    cardDesc: 'ملمس ناعم وعناية فائقة تدوم طوال اليوم',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'hero-3',
    badge: 'تشكيلة الصيف المنعشة',
    brandName: 'ROSÉE BODY SPLASH',
    mainHeading: 'MIST & GLOW LUXURY',
    subtitle: 'FRESHNESS ALL DAY LONG',
    headline: 'انتعاش مبهج وعطور ناعمة تملأ يومك بالثقة والجمال',
    description: 'بادي سبلاش راقي يدوم لساعات مع رذاذ خفيف وترطيب لطيف لا يترك أي أثر دهني.',
    primaryBtnText: 'اكتشف البادي سبلاش',
    cardTag: 'TRENDING',
    cardTitle: 'بادي سبلاش بيور بلوم',
    cardDesc: 'روائح زهرية فاكهية لا تقاوم لجميع الأوقات',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80'
  }
];

export function getResolvedFeaturedCards(settings?: AppSettings): FeaturedHeroCard[] {
  if (settings?.featuredCards && settings.featuredCards.length > 0) {
    return settings.featuredCards;
  }
  return DEFAULT_FEATURED_CARDS;
}

export function getResolvedTrustBadges(settings?: AppSettings): TrustBadge[] {
  if (settings?.trustBadges && settings.trustBadges.length > 0) {
    return settings.trustBadges;
  }
  return DEFAULT_TRUST_BADGES;
}

export const DEFAULT_STORE_SECTIONS: StoreSectionSetting[] = [
  { id: 'marquee', label: 'الشريط الإعلاني العلوي المتحرك', description: 'شريط التنبيهات والعروض والخصومات بأعلى الصفحة', enabled: true },
  { id: 'hero', label: 'البانر الترحيبي الرئيسي (Hero Showcase)', description: 'واجهة العرض الكبرى مع صور الموديلات وزر الشراء المباشر', enabled: true },
  { id: 'offers', label: 'شريط العروض والخصومات الفورية', description: 'كروت العروض الفعالة مع كود الخصم والمدة', enabled: true },
  { id: 'reels', label: 'فيديوهات الريلز وتجارب الاستخدام (UGC)', description: 'معرض الريلز الدوار اللانهائي مع إمكانية طلب الإطلالة فوراً', enabled: true },
  { id: 'bestsellers', label: 'الأكثر مبيعاً ورواجاً (Bestsellers)', description: 'أبرز 4 منتجات حازت على إقبال العملاء', enabled: true },
  { id: 'collections', label: 'تصفح حسب المجموعات المتناسقة (Collections)', description: 'مجموعات المنتجات الفاخرة المترابطة', enabled: true },
  { id: 'catalog', label: 'كتالوج المنتجات الكامل وقوائم التصنيفات المنسدلة', description: 'كافة الأصناف مقسمة لمجموعات مع إمكانية الطي والتصفية', enabled: true },
  { id: 'trust_badges', label: 'شارات الثقة والضمان والشحن', description: 'أيقونات مميزات المتجر (مكونات طبيعية، شحن سريع، دفع عند الاستلام)', enabled: true },
  { id: 'reviews', label: 'آراء ومراجعات العملاء (Reviews Marquee)', description: 'شريط تقييمات العملاء الدوار والتجارب الحقيقية', enabled: true }
];

export function getResolvedSections(settings?: AppSettings): StoreSectionSetting[] {
  if (!settings?.sectionsLayout || settings.sectionsLayout.length === 0) {
    return DEFAULT_STORE_SECTIONS;
  }
  const existingMap = new Map(settings.sectionsLayout.map(s => [s.id, s]));
  const result: StoreSectionSetting[] = [];
  
  // Keep saved order
  for (const saved of settings.sectionsLayout) {
    const def = DEFAULT_STORE_SECTIONS.find(d => d.id === saved.id);
    if (def) {
      result.push({
        ...def,
        ...saved,
        enabled: saved.enabled !== false
      });
    }
  }

  // Append any missing defaults at the end
  for (const def of DEFAULT_STORE_SECTIONS) {
    if (!existingMap.has(def.id)) {
      result.push({ ...def });
    }
  }

  return result;
}

export const DEFAULT_SUB_ELEMENTS_VISIBILITY: { [key: string]: boolean } = {
  heroBadge: true,
  heroBrand: true,
  heroHeadline: true,
  heroDescription: true,
  heroPrimaryBtn: true,
  heroSecondaryBtn: true,
  heroCard: true,
  heroSocial: true,
  catalogFilters: true,
  catalogSearch: true,
  catalogStockCount: true,
  catalogAddToCart: true,
  bestsellersBadge: true,
  bestsellersTitle: true,
  collectionsBadge: true,
  reviewsBadge: true,
  reviewsWriteBtn: true,
  offersBadge: true
};

export function getResolvedSubElements(settings?: AppSettings): { [key: string]: boolean } {
  return {
    ...DEFAULT_SUB_ELEMENTS_VISIBILITY,
    ...(settings?.subElementsVisibility || {})
  };
}

// --- MARKETING FEATURE DEFAULTS & RESOLVERS ---

export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  enabled: true,
  useAI: true,
  title: 'مستشارك العطري الذكي ✨',
  subtitle: 'أجيبي عن 3 أسئلة سريعة لنكتشف معاً العطر أو المستحضر الأكثر ملاءمة لذوقك وشخصيتك',
  questions: [
    {
      id: 'q1',
      question: 'ما هي المناسبة الأساسية التي تبحثين عن عطر لها؟',
      options: [
        { id: 'o1_1', label: 'إطلالة يومية وعمل منعش هادئ', matchedProduct: 'المجموعة الأساسية: Bunny Rose (FOR WOMEN)' },
        { id: 'o1_2', label: 'سهرات خاصة ومناسبات فخمة', matchedProduct: 'المجموعة الأساسية: Velvet Noir (FOR MEN)' },
        { id: 'o1_3', label: 'عناية وترطيب فائق ونضارة للبشرة', matchedProduct: 'مجموعة العناية: Rose Gold Elixir (UNISEX)' },
        { id: 'o1_4', label: 'لحظات استرخاء وأنوثة ناعمة', matchedProduct: 'المجموعة الأساسية: Pure Jasmine Glow (FOR WOMEN)' }
      ]
    },
    {
      id: 'q2',
      question: 'ما هي عائلة الروائح والنفحات الأقرب إلى قلبكِ؟',
      options: [
        { id: 'o2_1', label: 'الورد الدمشقي والزهور الفرنسية الرقيقة', matchedProduct: 'المجموعة الأساسية: Bunny Rose (FOR WOMEN)' },
        { id: 'o2_2', label: 'العود الشرقي الفاخر وخشب الصندل والعنبر', matchedProduct: 'المجموعة الأساسية: Velvet Noir (FOR MEN)' },
        { id: 'o2_3', label: 'الياسمين والمسك الأبيض والفانيلا الناعمة', matchedProduct: 'المجموعة الأساسية: Pure Jasmine Glow (FOR WOMEN)' },
        { id: 'o2_4', label: 'إكسير الذهب الطبيعي والزيوت العطرية المغذية', matchedProduct: 'مجموعة العناية: Rose Gold Elixir (UNISEX)' }
      ]
    },
    {
      id: 'q3',
      question: 'ما هو الأثر الذي ترغبين في تركه عند استخدام المنتج؟',
      options: [
        { id: 'o3_1', label: 'فوحان أنثوي ساحر يلفت الأنظار فوراً', matchedProduct: 'المجموعة الأساسية: Bunny Rose (FOR WOMEN)' },
        { id: 'o3_2', label: 'هيبة وثبات ملكي غامض ومميز', matchedProduct: 'المجموعة الأساسية: Velvet Noir (FOR MEN)' },
        { id: 'o3_3', label: 'بشرة متوهجة كالحرير بمظهر ذهبي أخّاذ', matchedProduct: 'مجموعة العناية: Rose Gold Elixir (UNISEX)' },
        { id: 'o3_4', label: 'انتعاش نقي يدوم طوال اليوم', matchedProduct: 'المجموعة الأساسية: Pure Jasmine Glow (FOR WOMEN)' }
      ]
    }
  ]
};

export function getResolvedQuizConfig(settings?: AppSettings): QuizConfig {
  if (!settings?.quizConfig) return DEFAULT_QUIZ_CONFIG;
  return {
    ...DEFAULT_QUIZ_CONFIG,
    ...settings.quizConfig,
    questions: Array.isArray(settings.quizConfig.questions) && settings.quizConfig.questions.length > 0
      ? settings.quizConfig.questions
      : DEFAULT_QUIZ_CONFIG.questions
  };
}

export const DEFAULT_GIFTING_CONFIG: GiftingConfig = {
  enabled: true,
  title: 'إرسال كهدية فاخرة 🎁 (Luxury Gifting)',
  subtitle: 'حوّل طلبك إلى تجربة إهداء ملكية لا تُنسى مع تغليف شريطي فاخر وبطاقة مطبوعة بكلماتك الخاصة',
  packagingOptions: [
    {
      id: 'ribbon_gold',
      name: 'شريط ستان ملكي ذهبي مع كارت إهداء مطبوع',
      price: 25,
      description: 'شريط ستان حريري فاخر يلف علبة المنتج وبطاقة كرتونية مخملية بكلماتك',
      enabled: true
    },
    {
      id: 'luxury_box',
      name: 'صندوق هدايا روزيه المخملي الفاخر مع بتلات ورد',
      price: 65,
      description: 'صندوق هدايا صلب مبطن بالمخمل الأسود والذهبي مع كيس إهداء فاخر',
      enabled: true
    },
    {
      id: 'deluxe_hamper',
      name: 'باكج VIP مخصص (علبة جلدية + كيس براند + كارت مختوم)',
      price: 110,
      description: 'أعلى درجات الفخامة مع ختم شمعي ملكي وشريطة براند روزيه',
      enabled: true
    }
  ]
};

export function getResolvedGiftingConfig(settings?: AppSettings): GiftingConfig {
  if (!settings?.giftingConfig) return DEFAULT_GIFTING_CONFIG;
  return {
    ...DEFAULT_GIFTING_CONFIG,
    ...settings.giftingConfig,
    packagingOptions: Array.isArray(settings.giftingConfig.packagingOptions) && settings.giftingConfig.packagingOptions.length > 0
      ? settings.giftingConfig.packagingOptions
      : DEFAULT_GIFTING_CONFIG.packagingOptions
  };
}

export const DEFAULT_SPIN_WHEEL_CONFIG: SpinWheelConfig = {
  enabled: true,
  triggerType: 'on_enter',
  triggerDelaySeconds: 4,
  title: 'عجلة هدايا ROSÉE الفاخرة 🎡✨',
  subtitle: 'أدخلي بياناتكِ وجربي حظكِ الآن للفوز بهدايا وخصومات فورية على طلبك اليوم!',
  buttonLabel: 'جرّب حظك الآن 🎁',
  wheelSize: 'standard',
  prizes: [
    { id: 'p1', label: 'خصم 10% فوري', promoCode: 'ROSE10', discountPercent: 10, probability: 35, color: '#C5A059', textColor: '#111111' },
    { id: 'p2', label: 'خصم 15% VIP', promoCode: 'ROSE15', discountPercent: 15, probability: 25, color: '#1B1B1B', textColor: '#C5A059' },
    { id: 'p3', label: 'شحن مجاني للطلب', promoCode: 'FREESHIP', discountPercent: 10, probability: 20, color: '#8C6D2D', textColor: '#FFFFFF' },
    { id: 'p4', label: 'خصم 20% حصري', promoCode: 'VIP20', discountPercent: 20, probability: 10, color: '#2A200B', textColor: '#DFB76C' },
    { id: 'p5', label: 'عينة عطر مجانية', promoCode: 'GIFTSAMPLE', discountPercent: 5, probability: 10, color: '#E8D5A3', textColor: '#111111' }
  ]
};

export function getResolvedSpinWheelConfig(settings?: AppSettings): SpinWheelConfig {
  if (!settings?.spinWheelConfig) return DEFAULT_SPIN_WHEEL_CONFIG;
  return {
    ...DEFAULT_SPIN_WHEEL_CONFIG,
    ...settings.spinWheelConfig,
    prizes: Array.isArray(settings.spinWheelConfig.prizes) && settings.spinWheelConfig.prizes.length > 0
      ? settings.spinWheelConfig.prizes
      : DEFAULT_SPIN_WHEEL_CONFIG.prizes
  };
}

export const DEFAULT_TREASURE_HUNT_CONFIG: TreasureHuntConfig = {
  enabled: true,
  targetCount: 3,
  rewardPromoCode: 'GOLDENROSE20',
  rewardDiscountPercent: 20,
  rewardTitle: 'مبروك! عثرتِ على الورود الذهبية الثلاثة 🏆🌹',
  rewardMessage: 'تهانينا لاكتشافكِ جميع الورود الذهبية المخفية! لقد حصلتِ على كود خصم حصري 20% لتسوقك اليوم.',
  placedProductKeys: [
    'المجموعة الأساسية: Bunny Rose (FOR WOMEN)',
    'مجموعة العناية: Rose Gold Elixir (UNISEX)',
    'المجموعة الأساسية: Pure Jasmine Glow (FOR WOMEN)'
  ]
};

export function getResolvedTreasureHuntConfig(settings?: AppSettings): TreasureHuntConfig {
  if (!settings?.treasureHuntConfig) return DEFAULT_TREASURE_HUNT_CONFIG;
  return {
    ...DEFAULT_TREASURE_HUNT_CONFIG,
    ...settings.treasureHuntConfig,
    placedProductKeys: Array.isArray(settings.treasureHuntConfig.placedProductKeys)
      ? settings.treasureHuntConfig.placedProductKeys
      : DEFAULT_TREASURE_HUNT_CONFIG.placedProductKeys
  };
}
