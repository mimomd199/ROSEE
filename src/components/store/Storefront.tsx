import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart,
  ShoppingBasket,
  Search, 
  Sparkles, 
  Star, 
  Heart,
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus, 
  MessageCircle, 
  Leaf, 
  Truck, 
  ShieldCheck, 
  Lock,
  Instagram,
  Facebook,
  ExternalLink,
  Eye,
  Tag,
  Gift,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  Award,
  Gem,
  ThumbsUp,
  Zap,
  RefreshCw,
  Clock,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { ProductCatalog, AppSettings, Offer, CustomerReview, StoreColors, ReelItem, CollectionGroup, ProductSize, StoreSectionSetting, StoreSectionId } from '../../types';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';
import { FloatingSocialDock } from './FloatingSocialDock';
import { ReelsSection } from './ReelsSection';
import { CollectionsSection } from './CollectionsSection';
import confetti from 'canvas-confetti';
import { ProductQuizModal } from './ProductQuizModal';
import { SpinWheelModal } from './SpinWheelModal';
import { TreasureHuntBadge } from './TreasureHuntBadge';
import { 
  getResolvedColors, 
  getResolvedTexts, 
  getResolvedAnimations, 
  getResolvedIcons,
  getResolvedFeaturedCards,
  getResolvedTrustBadges,
  getResolvedSections,
  getResolvedSubElements,
  getResolvedQuizConfig,
  getResolvedSpinWheelConfig,
  getResolvedTreasureHuntConfig,
  DARK_STORE_COLORS
} from '../../lib/storeDefaults';

interface FlyingParticle {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

const FlyingParticleItem: React.FC<{
  particle: FlyingParticle;
  durationMs: number;
  accentColor: string;
}> = ({ particle, durationMs, accentColor }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // 2-step requestAnimationFrame ensures start coordinates are painted before transition triggers
    let frame1: number;
    let frame2: number;
    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        setActive(true);
      });
    });
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, []);

  return (
    <div
      className="fixed z-[99999] pointer-events-none select-none flex items-center justify-center rounded-full font-bold shadow-2xl border-2 border-white"
      style={{
        width: 38,
        height: 38,
        backgroundColor: accentColor,
        color: '#FFFFFF',
        left: 0,
        top: 0,
        transform: active
          ? `translate3d(${particle.targetX - 19}px, ${particle.targetY - 19}px, 0) scale(0.65)`
          : `translate3d(${particle.startX - 19}px, ${particle.startY - 19}px, 0) scale(1.25)`,
        opacity: active ? 0.95 : 1,
        transition: `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${durationMs}ms ease-out`,
        boxShadow: `0 8px 25px ${accentColor}CC, 0 0 15px ${accentColor}80`
      }}
    >
      <span className="font-arabic font-extrabold text-xs drop-shadow-sm leading-none">+1</span>
    </div>
  );
};

function fixImageLink(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?id=${match[1]}`;
    }
  }
  if (trimmed.includes('postimg.cc/') && !trimmed.includes('i.postimg.cc')) {
    const match = trimmed.match(/postimg\.cc\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://i.postimg.cc/${match[1]}/image.jpg`;
    }
  }
  return trimmed;
}

interface StorefrontProps {
  catalog: ProductCatalog;
  settings: AppSettings;
  globalAlert: string;
  offers: Offer[];
  reels?: ReelItem[];
  collections?: CollectionGroup[];
  reviews: { [id: string]: CustomerReview };
  cart: { [key: string]: number };
  onUpdateCartQty: (productKey: string, newQty: number) => void;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onOpenAdmin?: () => void;
  onSubmitReview?: (review: CustomerReview) => Promise<void>;
  onRecordBackInStock?: (request: { productKey: string; productName: string; customerPhone: string }) => void;
  onClaimPromoCode?: (code: string) => void;
}

export const Storefront: React.FC<StorefrontProps> = ({
  catalog,
  settings,
  globalAlert,
  offers,
  reels = [],
  collections = [],
  reviews,
  cart,
  onUpdateCartQty,
  onOpenCart,
  onOpenTracking,
  onOpenAdmin,
  onSubmitReview,
  onRecordBackInStock,
  onClaimPromoCode
}) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Marketing modules configurations
  const quizConfig = getResolvedQuizConfig(settings);
  const spinWheelConfig = getResolvedSpinWheelConfig(settings);
  const treasureHuntConfig = getResolvedTreasureHuntConfig(settings);

  // Marketing states
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false);
  const [hasAutoOpenedSpinWheel, setHasAutoOpenedSpinWheel] = useState(false);

  // Golden Rose Treasure Hunt state
  const [collectedRoses, setCollectedRoses] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rosee_collected_roses');
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });

  // Back-in-stock alert phone inputs state
  const [backInStockPhones, setBackInStockPhones] = useState<{ [key: string]: string }>({});
  const [backInStockSuccess, setBackInStockSuccess] = useState<{ [key: string]: boolean }>({});

  const handleCollectRose = (productKey: string) => {
    if (collectedRoses.includes(productKey)) return;
    const next = [...collectedRoses, productKey];
    setCollectedRoses(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rosee_collected_roses', JSON.stringify(next));
      } catch (_) {}
    }
  };

  const handleBackInStockSubmit = (productKey: string, productName: string) => {
    const phone = (backInStockPhones[productKey] || '').trim();
    if (!phone || phone.length < 7) {
      alert('يرجى إدخال رقم هاتف صحيح لتنبيهك عند توفر المنتج.');
      return;
    }

    if (onRecordBackInStock) {
      onRecordBackInStock({ productKey, productName, customerPhone: phone });
    }
    setBackInStockSuccess(prev => ({ ...prev, [productKey]: true }));
    setTimeout(() => {
      setBackInStockSuccess(prev => ({ ...prev, [productKey]: false }));
      setBackInStockPhones(prev => ({ ...prev, [productKey]: '' }));
    }, 4000);
  };

  // Spin wheel automatic entrance or exit intent trigger
  useEffect(() => {
    if (!spinWheelConfig.enabled || hasAutoOpenedSpinWheel) return;

    if (spinWheelConfig.triggerType === 'on_enter') {
      const delay = (spinWheelConfig.triggerDelaySeconds || 4) * 1000;
      const timer = setTimeout(() => {
        setIsSpinWheelOpen(true);
        setHasAutoOpenedSpinWheel(true);
      }, delay);
      return () => clearTimeout(timer);
    } else if (spinWheelConfig.triggerType === 'exit_intent') {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 10 && !hasAutoOpenedSpinWheel) {
          setIsSpinWheelOpen(true);
          setHasAutoOpenedSpinWheel(true);
        }
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [spinWheelConfig, hasAutoOpenedSpinWheel]);

  // Customer Interface Modes: Arabic / English & Day / Night
  const [langMode, setLangMode] = useState<'ar' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rosee_store_lang');
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'ar';
  });

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rosee_store_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

  const handleToggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rosee_store_theme', next);
    }
  };

  const handleToggleLang = () => {
    const next = langMode === 'ar' ? 'en' : 'ar';
    setLangMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rosee_store_lang', next);
    }
  };

  // Dynamically resolve colors (Light vs Dark mode luxury presets)
  const colors = useMemo(() => {
    if (themeMode === 'dark') {
      return {
        ...DARK_STORE_COLORS,
        ...(settings?.colors?.primaryAccent ? { primaryAccent: settings.colors.primaryAccent } : {})
      };
    }
    return getResolvedColors(settings);
  }, [themeMode, settings]);

  // Dynamically resolve texts (Arabic vs English)
  const texts = useMemo(() => {
    return getResolvedTexts(settings, langMode);
  }, [settings, langMode]);

  const animations = getResolvedAnimations(settings);
  const icons = getResolvedIcons(settings);

  // Flying particles state for smooth +1 fly-to-cart effect
  const [particles, setParticles] = useState<FlyingParticle[]>([]);
  const [isCartBumping, setIsCartBumping] = useState(false);
  const durationMs = 
    animations.flyToCartSpeed === 'fast' ? 550 : 
    animations.flyToCartSpeed === 'smooth' ? 1150 : 850;

  // Collapsible product groups (accordions): ONLY first group is open by default
  const [openGroups, setOpenGroups] = useState<{ [group: string]: boolean }>({});

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected size per product key
  const [selectedProductSizes, setSelectedProductSizes] = useState<Record<string, ProductSize>>({});
  // Active photo index per product key for multiple image swipe
  const [productImageIndices, setProductImageIndices] = useState<Record<string, number>>({});

  // Welcome Offers Pop-up (Opens automatically when store opens if offers exist, as requested by user)
  const publishedOffers = (offers || []).filter(o => o.status === 'published');
  const [isOffersPopUpOpen, setIsOffersPopUpOpen] = useState<boolean>(false);
  const hasAutoOpenedOffersRef = useRef(false);

  useEffect(() => {
    if (!hasAutoOpenedOffersRef.current && publishedOffers.length > 0) {
      hasAutoOpenedOffersRef.current = true;
      setIsOffersPopUpOpen(true);
    }
  }, [publishedOffers.length]);

  const [currentOfferSlide, setCurrentOfferSlide] = useState<number>(0);
  const [isAutoPanPaused, setIsAutoPanPaused] = useState<boolean>(false);
  const [copiedOfferCode, setCopiedOfferCode] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Auto-pan to left every 4 seconds if more than 1 offer exists
  useEffect(() => {
    if (publishedOffers.length <= 1 || !isOffersPopUpOpen || isAutoPanPaused) return;

    const interval = setInterval(() => {
      setCurrentOfferSlide(prev => (prev + 1) % publishedOffers.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [publishedOffers.length, isOffersPopUpOpen, isAutoPanPaused]);

  // Ensure currentOfferSlide is within bounds if offers change
  useEffect(() => {
    if (currentOfferSlide >= publishedOffers.length && publishedOffers.length > 0) {
      setCurrentOfferSlide(0);
    }
  }, [publishedOffers.length, currentOfferSlide]);

  const handleNextOffer = () => {
    if (publishedOffers.length <= 1) return;
    setCurrentOfferSlide(prev => (prev + 1) % publishedOffers.length);
  };

  const handlePrevOffer = () => {
    if (publishedOffers.length <= 1) return;
    setCurrentOfferSlide(prev => (prev - 1 + publishedOffers.length) % publishedOffers.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsAutoPanPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    // In RTL, swipe left (finger moves right to left, diff > 40) means advance next offer
    if (diff > 40) {
      handleNextOffer();
    } else if (diff < -40) {
      handlePrevOffer();
    }
    setTouchStartX(null);
    setIsAutoPanPaused(false);
  };

  const [selectedProductDetails, setSelectedProductDetails] = useState<{
    key: string;
    group: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    image: string;
    images?: string[];
    stock?: number;
    showStock?: boolean;
    isOut?: boolean;
    isBestseller?: boolean;
    hasSizes?: boolean;
    sizes?: ProductSize[];
    selectedSize?: ProductSize;
    activeImageIdx?: number;
  } | null>(null);

  // Group and format catalog items
  const rawParsedProducts = Object.entries(catalog).map(([key, data]) => {
    let group = 'المجموعة الأساسية';
    let name = key;
    let category = 'UNISEX';

    const match = key.match(/^(.*?):\s*(.*?)\s*\((.*?)\)$/);
    if (match) {
      group = match[1].trim();
      name = match[2].trim();
      category = match[3].trim().toUpperCase();
    }

    const isOut = Boolean(data.isOutOfStock || (data.showStock && (data.stockQty || 0) <= 0));
    const cleanImages = Array.isArray(data.images) && data.images.length > 0 
      ? data.images 
      : (data.image ? [data.image] : ['https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80']);

    return {
      key,
      group: data.collectionName || group,
      name,
      category,
      price: data.defaultPrice,
      description: data.description,
      image: cleanImages[0],
      images: cleanImages,
      stock: data.stockQty,
      showStock: data.showStock,
      isOut,
      isBestseller: Boolean(data.isBestseller),
      hasSizes: Boolean(data.hasSizes && data.sizes && data.sizes.length > 0),
      sizes: data.sizes || [],
      collectionName: data.collectionName || group,
      collectionImage: data.collectionImage
    };
  });

  // Sort parsed products by custom catalog order if defined
  const parsedProducts = useMemo(() => {
    if (!settings.catalogItemsOrder || settings.catalogItemsOrder.length === 0) {
      return rawParsedProducts;
    }
    const orderMap = new Map(settings.catalogItemsOrder.map((k, idx) => [k, idx]));
    return [...rawParsedProducts].sort((a, b) => {
      const idxA = orderMap.has(a.key) ? orderMap.get(a.key)! : 9999;
      const idxB = orderMap.has(b.key) ? orderMap.get(b.key)! : 9999;
      return idxA - idxB;
    });
  }, [rawParsedProducts, settings.catalogItemsOrder]);

  // Store sections layout (User can show/hide and reorder sections)
  const storeSections = useMemo(() => {
    return getResolvedSections(settings);
  }, [settings]);

  const isSectionEnabled = (id: StoreSectionId): boolean => {
    const s = storeSections.find(sec => sec.id === id);
    return s ? s.enabled !== false : true;
  };

  // Sub-elements visibility resolution (Inside-sections controls)
  const subElements = useMemo(() => {
    return getResolvedSubElements(settings);
  }, [settings]);

  const isSubElementVisible = (key: string): boolean => {
    return subElements[key] !== false;
  };

  // Featured Hero Cards carousel & pan state (Respecting inner card enabled flags & order)
  const featuredCards = useMemo(() => {
    const cards = getResolvedFeaturedCards(settings);
    const filtered = cards.filter(c => c.enabled !== false);
    return filtered.length > 0 ? filtered : cards;
  }, [settings]);

  // Trust Badges state (Respecting inner badges enabled flags & order)
  const resolvedTrustBadges = useMemo(() => {
    const badges = getResolvedTrustBadges(settings);
    const filtered = badges.filter(b => b.enabled !== false);
    return filtered.length > 0 ? filtered : badges;
  }, [settings]);

  // Collections state (Respecting inner collection enabled flags & order)
  const activeCollections = useMemo(() => {
    return (collections || []).filter(c => c.enabled !== false);
  }, [collections]);

  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  useEffect(() => {
    if (featuredCards.length <= 1 || isHeroPaused) return;
    const interval = setInterval(() => {
      setActiveHeroSlide(prev => (prev + 1) % featuredCards.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredCards.length, isHeroPaused]);

  useEffect(() => {
    if (activeHeroSlide >= featuredCards.length && featuredCards.length > 0) {
      setActiveHeroSlide(0);
    }
  }, [featuredCards.length, activeHeroSlide]);

  const activeCard = featuredCards[activeHeroSlide] || featuredCards[0];

  const handleNextHeroCard = () => {
    if (featuredCards.length <= 1) return;
    setActiveHeroSlide(prev => (prev + 1) % featuredCards.length);
  };

  const handlePrevHeroCard = () => {
    if (featuredCards.length <= 1) return;
    setActiveHeroSlide(prev => (prev - 1 + featuredCards.length) % featuredCards.length);
  };

  // Filter products by category & search query (Fixed MEN vs WOMEN bug with strict keyword isolation)
  const filteredProducts = parsedProducts.filter(p => {
    const rawCat = (p.category || '').toUpperCase().trim();
    const rawKey = (p.key || '').toUpperCase();
    
    // Explicitly identify Women
    const isWomen = 
      rawCat.includes('WOMEN') || 
      rawCat.includes('نسائي') || 
      rawCat.includes('نساء') || 
      rawCat.includes('حريمي') || 
      rawCat.includes('FEMALE') ||
      rawKey.includes('(FOR WOMEN)') ||
      rawKey.includes('(نسائي)');

    // Explicitly identify Men (guaranteed NEVER to match Women)
    const isMen = 
      !isWomen && (
        rawCat === 'FOR MEN' || 
        rawCat === 'MEN' || 
        rawCat.includes('رجالي') || 
        rawCat.includes('رجال') || 
        rawCat.includes('MALE') ||
        rawKey.includes('(FOR MEN)') ||
        rawKey.includes('(رجالي)') ||
        (rawCat.includes('MEN') && !rawCat.includes('WOMEN'))
      );

    // Identify Unisex
    const isUnisex = 
      rawCat.includes('UNISEX') || 
      rawCat.includes('للجنسين') || 
      rawKey.includes('(UNISEX)') ||
      (!isWomen && !isMen);

    let matchesCategory = false;
    if (activeCategoryFilter === 'ALL') {
      matchesCategory = true;
    } else if (activeCategoryFilter === 'MEN') {
      matchesCategory = isMen;
    } else if (activeCategoryFilter === 'WOMEN') {
      matchesCategory = isWomen;
    } else if (activeCategoryFilter === 'UNISEX') {
      matchesCategory = isUnisex;
    } else {
      matchesCategory = true;
    }

    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.group.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const bestsellers = parsedProducts.filter(p => p.isBestseller && !p.isOut);
  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalCartPrice = Object.entries(cart).reduce((sum, [k, qty]) => {
    const prod = catalog[k];
    return sum + (prod ? (Number(prod.defaultPrice) || 0) * (Number(qty) || 0) : 0);
  }, 0);

  // Distinct groups for categorized view, sorted by custom order if set
  const rawProductGroups = useMemo(() => {
    return Array.from(new Set(filteredProducts.map(p => p.group)));
  }, [filteredProducts]);

  const productGroups = useMemo(() => {
    if (!settings.productGroupsOrder || settings.productGroupsOrder.length === 0) {
      return rawProductGroups;
    }
    const orderMap = new Map(settings.productGroupsOrder.map((g, idx) => [g, idx]));
    return [...rawProductGroups].sort((a, b) => {
      const idxA = orderMap.has(a) ? orderMap.get(a)! : 999;
      const idxB = orderMap.has(b) ? orderMap.get(b)! : 999;
      return idxA - idxB;
    });
  }, [rawProductGroups, settings.productGroupsOrder]);

  // Accordion: ONLY first group is open by default, all others closed!
  useEffect(() => {
    if (productGroups.length > 0) {
      setOpenGroups(prev => {
        if (Object.keys(prev).length === 0) {
          const init: { [group: string]: boolean } = {};
          productGroups.forEach((g, idx) => {
            init[g] = idx === 0;
          });
          return init;
        }
        return prev;
      });
    }
  }, [productGroups]);

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Smooth flying "+1" particle animation towards cart icon
  const handleAddToCartWithEffect = (
    e: React.MouseEvent<HTMLElement> | undefined,
    productKey: string,
    qtyDelta: number = 1
  ) => {
    if (e) e.stopPropagation();
    onUpdateCartQty(productKey, (cart[productKey] || 0) + qtyDelta);

    if (qtyDelta > 0 && animations.enableAnimations && animations.enableFlyToCart) {
      let startX = window.innerWidth / 2;
      let startY = window.innerHeight / 2;

      if (e && e.currentTarget) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      } else if (e && (e as any).clientX) {
        startX = (e as any).clientX;
        startY = (e as any).clientY;
      }

      const cartBtn = document.getElementById('store-header-cart-btn');
      // Responsive fallback destination based on direction
      let targetX = langMode === 'ar' ? 65 : (window.innerWidth - 65);
      let targetY = 40;
      if (cartBtn) {
        const cartRect = cartBtn.getBoundingClientRect();
        // If header is within viewport, use exact button coordinates
        if (cartRect.top >= 0 && cartRect.bottom <= window.innerHeight) {
          targetX = cartRect.left + cartRect.width / 2;
          targetY = cartRect.top + cartRect.height / 2;
        }
      }

      const pid = Date.now() + Math.random();
      setParticles(prev => [...prev, { id: pid, startX, startY, targetX, targetY }]);

      setTimeout(() => {
        setIsCartBumping(true);
        setTimeout(() => setIsCartBumping(false), 380);
        setParticles(prev => prev.filter(p => p.id !== pid));
      }, durationMs);
    }
  };

  const renderCartIcon = () => {
    switch (icons.cartIconStyle) {
      case 'cart': return <ShoppingCart className="w-4 h-4" />;
      case 'basket': return <ShoppingBasket className="w-4 h-4" />;
      case 'sparkle': return <Sparkles className="w-4 h-4" />;
      case 'bag':
      default: return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const renderRatingStar = () => {
    switch (icons.ratingIcon) {
      case 'heart': return <Heart className="w-3.5 h-3.5 fill-current text-[#C5A059]" />;
      case 'sparkle': return <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />;
      case 'star':
      default: return <Star className="w-3.5 h-3.5 fill-current text-[#C5A059]" />;
    }
  };

  const handleAddToCartWithSize = (
    e: React.MouseEvent<HTMLElement> | undefined,
    productKey: string,
    size?: ProductSize,
    qtyDelta: number = 1
  ) => {
    let resolvedKey = productKey;
    if (size) {
      resolvedKey = `${productKey}___SIZE___${size.name}___PRICE___${size.price}`;
    }
    if (e) {
      handleAddToCartWithEffect(e, resolvedKey, qtyDelta);
    } else {
      onUpdateCartQty(resolvedKey, (cart[resolvedKey] || 0) + qtyDelta);
    }
  };

  const renderProductCard = (product: typeof parsedProducts[0], keyPrefix: string = 'card') => {
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    const currentImgIdx = productImageIndices[product.key] || 0;
    const currentImg = images[currentImgIdx % images.length];

    const activeSize = product.hasSizes ? (selectedProductSizes[product.key] || product.sizes[0]) : null;
    const displayPrice = activeSize ? activeSize.price : product.price;

    const cartKey = activeSize ? `${product.key}___SIZE___${activeSize.name}___PRICE___${activeSize.price}` : product.key;
    const currentQty = cart[cartKey] || (activeSize ? 0 : (cart[product.key] || 0));

    const handlePrevImg = (e: React.MouseEvent) => {
      e.stopPropagation();
      setProductImageIndices(prev => ({
        ...prev,
        [product.key]: (currentImgIdx - 1 + images.length) % images.length
      }));
    };

    const handleNextImg = (e: React.MouseEvent) => {
      e.stopPropagation();
      setProductImageIndices(prev => ({
        ...prev,
        [product.key]: (currentImgIdx + 1) % images.length
      }));
    };

    return (
      <div 
        key={`${keyPrefix}-${product.key}`} 
        className="border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group relative"
        style={{ 
          backgroundColor: colors.cardBg, 
          borderColor: colors.cardBorder 
        }}
      >
        {/* Product Image Box with swipe / arrow controls */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 select-none">
          <img 
            src={currentImg} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Category Tag */}
          <span 
            className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-brand tracking-wider z-10"
            style={{ 
              backgroundColor: colors.cardCategoryBg, 
              color: colors.cardCategoryText 
            }}
          >
            {product.category}
          </span>

          {/* Golden Rose Treasure Hunt Icon */}
          {treasureHuntConfig.enabled && treasureHuntConfig.placedProductKeys.includes(product.key) && !collectedRoses.includes(product.key) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCollectRose(product.key);
                try {
                  confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.5 },
                    colors: ['#FFD700', '#C5A059']
                  });
                } catch (_) {}
              }}
              className="absolute top-2.5 left-2.5 z-20 p-1.5 bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-400 hover:to-amber-600 text-black rounded-full shadow-lg border border-white animate-pulse hover:scale-125 transition-all cursor-pointer"
              title="انقري لجمع الوردة الذهبية! 🌹"
            >
              <span className="text-sm select-none">🌹</span>
            </button>
          )}

          {/* Eye Quick View Button */}
          <button
            onClick={() => setSelectedProductDetails({
              ...product,
              selectedSize: activeSize || undefined,
              activeImageIdx: currentImgIdx
            })}
            className="absolute bottom-2.5 left-2.5 z-10 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="عرض التفاصيل والأحجام"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Image Navigation Arrows if multiple photos */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImg}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                title="الصورة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextImg}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                title="الصورة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 z-10 pointer-events-none">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === (currentImgIdx % images.length) ? 'w-4 bg-[#C5A059]' : 'w-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Details Content */}
        <div className="p-4 flex-1 flex flex-col justify-between text-right">
          <div>
            <h3 
              className="text-xs sm:text-sm font-bold truncate transition-colors cursor-pointer hover:text-[#C5A059]"
              style={{ color: colors.cardTitleColor }}
              onClick={() => setSelectedProductDetails({
                ...product,
                selectedSize: activeSize || undefined,
                activeImageIdx: currentImgIdx
              })}
            >
              {product.name}
            </h3>
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {product.description || 'مستحضر تجميل وعناية راقي ومثالي للاستخدام اليومي.'}
            </p>

            {/* Sizes selector pills if product has size options */}
            {product.hasSizes && product.sizes.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 block mb-1">اختر الحجم / السعة:</span>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((sz, sIdx) => {
                    const isSelected = (activeSize?.name) === sz.name;
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductSizes(prev => ({ ...prev, [product.key]: sz }));
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#111111] text-[#C5A059] border-[#C5A059] shadow-xs' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {sz.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div 
            className="mt-4 pt-3 border-t flex items-center justify-between"
            style={{ borderColor: colors.cardBorder }}
          >
            <div>
              <span 
                className="text-sm font-bold tabular-nums font-brand block"
                style={{ color: colors.cardPriceColor }}
              >
                {displayPrice} <span className="text-xs font-normal">ج.م</span>
              </span>
              {activeSize?.originalPrice && (
                <span className="text-[10px] text-gray-400 line-through tabular-nums">
                  {activeSize.originalPrice} ج.م
                </span>
              )}
            </div>

            {/* Quantity Controls / Add to cart OR Back in Stock alert */}
            {product.isOut ? (
              <div className="flex flex-col gap-1 items-end w-full sm:w-auto">
                <span className="text-[10px] font-bold text-red-500">نفدت الكمية</span>
                <div className="flex items-center gap-1">
                  <input
                    type="tel"
                    dir="ltr"
                    value={backInStockPhones[product.key] || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      setBackInStockPhones(prev => ({ ...prev, [product.key]: e.target.value }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="رقم الواتساب"
                    className="w-24 sm:w-28 px-2 py-1 text-[10px] border border-gray-200 rounded-lg text-center font-mono focus:outline-none focus:border-[#C5A059] bg-white"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBackInStockSubmit(product.key, product.name);
                    }}
                    className="px-2 py-1 bg-[#111111] hover:bg-[#C5A059] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    {backInStockSuccess[product.key] ? 'تم التنبيه ✓' : 'أعلمني 🔔'}
                  </button>
                </div>
              </div>
            ) : isSubElementVisible('catalogAddToCart') && (
              <div className="flex items-center gap-1.5">
                {currentQty === 0 ? (
                  <button
                    onClick={(e) => handleAddToCartWithSize(e, product.key, activeSize || undefined, 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-transform active:scale-95 cursor-pointer shadow-xs"
                    style={{ 
                      backgroundColor: colors.cardBtnBg, 
                      color: colors.cardBtnText 
                    }}
                  >
                    {texts.addCartBtn}
                  </button>
                ) : (
                  <div 
                    className="flex items-center border rounded-lg bg-gray-50 overflow-hidden"
                    style={{ borderColor: colors.cardBorder }}
                  >
                    <button
                      onClick={() => handleAddToCartWithSize(undefined, product.key, activeSize || undefined, -1)}
                      className="p-1 hover:bg-white text-gray-600 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span 
                      className="w-6 text-center text-xs font-bold tabular-nums"
                      style={{ color: colors.cardTitleColor }}
                    >
                      {currentQty}
                    </span>
                    <button
                      onClick={(e) => handleAddToCartWithSize(e, product.key, activeSize || undefined, 1)}
                      className="p-1 hover:bg-white text-gray-600 transition-colors active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const fallbackReviews: CustomerReview[] = [
    {
      customerName: 'مريم السيد',
      phone: '01098765432',
      productName: 'المجموعة الأساسية: Bunny Rose (FOR WOMEN)',
      rating: 5,
      text: 'المستحضر غاية في النعومة وأعطى بشرتي نضارة وإشراقة ساحرة، والتغليف راقي وفخم للغاية شكراً لكم!',
      status: 'approved',
      date: new Date().toISOString()
    },
    {
      customerName: 'سارة خالد',
      phone: '01123456789',
      productName: 'مجموعة العناية: Rose Gold Elixir (UNISEX)',
      rating: 5,
      text: 'السيروم رائع وخفيف على البشرة وملمسه مخملي جداً، فرق معايا كتير في النضارة.',
      status: 'approved',
      date: new Date().toISOString()
    },
    {
      customerName: 'نوران أحمد',
      phone: '01223456789',
      productName: 'مجموعة النقاء: White Musk Velvet',
      rating: 5,
      text: 'ثبات العطر خيالي وفواح جداً من أول رشة، وكل صاحباتي سألوني عنه!',
      status: 'approved',
      date: new Date().toISOString()
    },
    {
      customerName: 'هدى إبراهيم',
      phone: '01555554321',
      productName: 'مجموعة روزيه الملكية: Royal Oud & Rose',
      rating: 5,
      text: 'تجربة الشراء والتعامل راقية والتوصيل كان سريع جداً، والمنتج أصلي وفاخر.',
      status: 'approved',
      date: new Date().toISOString()
    }
  ];

  const approvedReviews = Object.values(reviews || {}).filter(r => r.status === 'approved');
  const activeReviewsList = approvedReviews.length > 0 ? approvedReviews : fallbackReviews;
  const repeatCount = Math.max(2, Math.ceil(8 / activeReviewsList.length));
  const marqueeReviews = Array.from({ length: repeatCount }).flatMap(() => activeReviewsList);

  const renderReviewCard = (rev: CustomerReview, keyId: string) => (
    <div 
      key={keyId} 
      dir="rtl"
      className="w-80 sm:w-96 shrink-0 p-6 rounded-3xl text-right flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-2xl border"
      style={{
        backgroundColor: '#1E1D1A',
        borderColor: `${colors.primaryAccent}35`,
        boxShadow: '0 12px 30px -10px rgba(0,0,0,0.6)'
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 items-center" style={{ color: colors.primaryAccent }}>
            {Array.from({ length: rev.rating || 5 }).map((_, i) => (
              <span key={i} className="inline-block">{renderRatingStar()}</span>
            ))}
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            {new Date(rev.date).toLocaleDateString('ar-EG')}
          </span>
        </div>

        <p className="text-xs text-gray-100 leading-relaxed font-arabic italic line-clamp-4">
          "{rev.text}"
        </p>
      </div>

      <div className="pt-3 mt-4 border-t border-[#C5A059]/20 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-bold text-white truncate">{rev.customerName}</h5>
          <p className="text-[11px] font-medium truncate" style={{ color: colors.primaryAccent }}>
            {rev.productName}
          </p>
        </div>
        {rev.image && (
          <img 
            src={rev.image} 
            alt="Review" 
            className="w-11 h-11 object-cover rounded-xl border border-[#C5A059]/40 shrink-0"
          />
        )}
      </div>
    </div>
  );

  const renderBadgeIcon = (iconName?: string) => {
    const normalized = (iconName || '').toLowerCase().trim();
    switch (normalized) {
      case 'leaf': return <Leaf className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'truck': return <Truck className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'shield': 
      case 'shieldcheck': return <ShieldCheck className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'lock': return <Lock className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'award': return <Award className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'gem': return <Gem className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'heart': return <Heart className="w-6 h-6 fill-current" style={{ color: colors.primaryAccent }} />;
      case 'thumbsup': return <ThumbsUp className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'clock': return <Clock className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'zap': return <Zap className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'refresh': 
      case 'refreshcw': return <RefreshCw className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
      case 'sparkles':
      default: return <Sparkles className="w-6 h-6" style={{ color: colors.primaryAccent }} />;
    }
  };

  return (
    <div 
      dir={langMode === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-screen font-arabic selection:bg-[#C5A059]/30 transition-colors relative w-full max-w-full overflow-x-clip ${
        settings.clientFontScale === 'small' ? 'text-[92%]' :
        settings.clientFontScale === 'large' ? 'text-[108%]' : ''
      }`}
      style={{ 
        backgroundColor: colors.heroBgEnd, 
        color: colors.headerTitleColor,
        zoom: settings.clientUiScale === 'compact' ? '0.92' :
              settings.clientUiScale === 'comfortable' ? '1.06' :
              settings.clientUiScale === 'large' ? '1.14' : undefined
      }}
    >
      {/* Dynamic Flying +1 Particles */}
      {particles.map(p => (
        <FlyingParticleItem
          key={p.id}
          particle={p}
          durationMs={durationMs}
          accentColor={colors.primaryAccent}
        />
      ))}
      
      {/* 1. Marquee Announcement Bar */}
      {isSectionEnabled('marquee') && (
        <div 
          className="py-2 overflow-hidden border-b text-xs font-semibold transition-colors"
          style={{ 
            backgroundColor: colors.marqueeBg, 
            color: colors.marqueeText, 
            borderColor: `${colors.primaryAccent}40` 
          }}
        >
          <div className="animate-marquee whitespace-nowrap">
            {settings.marqueeText || (langMode === 'ar' ? "✨ توصيل سريع لجميع المحافظات ✨ خصومات حصرية ✨ الدفع عند الاستلام متاح ✨" : "✨ Fast Nationwide Delivery ✨ Exclusive Offers ✨ Cash on Delivery Available ✨")}
          </div>
        </div>
      )}

      {/* 2. Top Bar Navigation Contract: [Brand title] - [Nav links] - [Theme/Lang + Bag] */}
      <header 
        className="sticky top-0 z-50 w-full backdrop-blur-md border-b shadow-sm transition-all duration-300"
        style={{ 
          backgroundColor: `${colors.headerBg}FC`, 
          borderColor: `${colors.primaryAccent}25` 
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
          
          {/* Brand Wordmark (Zone 1) - Luxury, Clean & Uncluttered */}
          <div 
            className="flex items-center min-w-0 cursor-pointer select-none shrink-0" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className={langMode === 'ar' ? 'text-right' : 'text-left'}>
              <span 
                className="text-lg sm:text-2xl lg:text-3xl font-bold font-brand tracking-[0.15em] sm:tracking-[0.22em] block transition-colors truncate leading-tight"
                style={{ 
                  color: colors.headerBrandColor,
                  textAlign: langMode === 'ar' ? 'right' : 'left'
                }}
              >
                {texts.brandName}
              </span>
              <span 
                className="text-[9px] sm:text-[11px] font-bold font-display tracking-[0.1em] block uppercase mt-0.5 transition-colors truncate"
                style={{ color: colors.headerTitleColor, textAlign: langMode === 'ar' ? 'right' : 'left' }}
              >
                {texts.headerMainTitle}
              </span>
            </div>
          </div>

          {/* Clean Nav Links (Zone 2) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wider">
            {isSectionEnabled('catalog') && (
              <a 
                href="#collection" 
                className="hover:opacity-80 transition-opacity whitespace-nowrap"
                style={{ color: colors.headerNavColor }}
              >
                {texts.navCollection}
              </a>
            )}
            {isSectionEnabled('bestsellers') && bestsellers.length > 0 && (
              <a 
                href="#bestsellers" 
                className="hover:opacity-80 transition-opacity whitespace-nowrap"
                style={{ color: colors.headerNavColor }}
              >
                {texts.navBestsellers}
              </a>
            )}
            <button
              onClick={onOpenTracking}
              className="hover:opacity-80 transition-opacity whitespace-nowrap cursor-pointer font-semibold"
              style={{ color: colors.headerNavColor }}
            >
              {texts.navTracking}
            </button>
            {isSectionEnabled('reviews') && approvedReviews.length > 0 && (
              <a 
                href="#reviews" 
                className="hover:opacity-80 transition-opacity whitespace-nowrap"
                style={{ color: colors.headerNavColor }}
              >
                {texts.navReviews}
              </a>
            )}
          </nav>

          {/* Action Zone (Zone 3) - Decluttered, elegant, comfortable to the eye */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* 1. Unified Utility Micro-Capsule (Theme + Language) */}
            <div 
              className="flex items-center rounded-lg border p-0.5 shadow-2xs backdrop-blur-xs"
              style={{ 
                backgroundColor: `${colors.cardBg}E6`, 
                borderColor: `${colors.primaryAccent}25` 
              }}
            >
              {/* Day / Night Mode Switcher */}
              <button
                onClick={handleToggleTheme}
                className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-all cursor-pointer hover:bg-black/5 active:scale-90"
                style={{ color: colors.primaryAccent }}
                title={themeMode === 'light' ? (langMode === 'ar' ? 'التحويل للوضع الليلي' : 'Switch to Dark Mode') : (langMode === 'ar' ? 'التحويل للوضع النهاري' : 'Switch to Light Mode')}
              >
                {themeMode === 'light' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3 text-[#F59E0B]" />}
              </button>

              <div className="w-[1px] h-3 bg-gray-200 dark:bg-gray-700 mx-0.5 opacity-50" />

              {/* Language Switcher */}
              <button
                onClick={handleToggleLang}
                className="px-1.5 h-6.5 sm:h-7 rounded-md flex items-center gap-0.5 text-[10px] font-bold font-brand transition-all cursor-pointer hover:bg-black/5 active:scale-90"
                style={{ color: colors.headerTitleColor }}
                title={langMode === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
              >
                <Globe className="w-2.5 h-2.5 text-[#C5A059]" />
                <span>{langMode === 'ar' ? 'EN' : 'عربي'}</span>
              </button>
            </div>

            {/* 2. Interactive Perks Group (Offers, Wheel, Quiz) - Compact & Elegant */}
            <div className="flex items-center gap-1">
              {publishedOffers.length > 0 && (
                <button
                  onClick={() => {
                    setCurrentOfferSlide(0);
                    setIsOffersPopUpOpen(true);
                  }}
                  className="relative w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-90 shrink-0"
                  style={{ 
                    backgroundColor: `${colors.primaryAccent}15`, 
                    borderColor: `${colors.primaryAccent}40` 
                  }}
                  title={`${texts.btnOffers} (${publishedOffers.length})`}
                >
                  <Gift className="w-3 h-3" style={{ color: colors.primaryAccent }} />
                  <span 
                    className="absolute -top-1 -right-1 text-white text-[7.5px] sm:text-[8px] w-3.5 h-3.5 rounded-full font-brand font-bold flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: colors.secondaryAccent }}
                  >
                    {publishedOffers.length}
                  </span>
                </button>
              )}

              {spinWheelConfig.enabled && (
                <button
                  onClick={() => setIsSpinWheelOpen(true)}
                  className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-90 shrink-0"
                  style={{ 
                    backgroundColor: colors.cardBg, 
                    borderColor: `${colors.primaryAccent}25` 
                  }}
                  title="عجلة هدايا ROSÉE 🎡"
                >
                  <span className="text-[11px] sm:text-xs">🎡</span>
                </button>
              )}

              {quizConfig.enabled && (
                <button
                  onClick={() => setIsQuizOpen(true)}
                  className="hidden md:flex w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg border items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-90 shrink-0"
                  style={{ 
                    backgroundColor: colors.cardBg, 
                    borderColor: `${colors.primaryAccent}25` 
                  }}
                  title="مستشارك العطري واختيار المنتج المناسب ✨"
                >
                  <Sparkles className="w-3 h-3 text-[#C5A059]" />
                </button>
              )}
            </div>

            {/* 3. Order Tracking (Desktop Pill) */}
            <button
              onClick={onOpenTracking}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border rounded-lg transition-all cursor-pointer shadow-2xs hover:border-[#C5A059] shrink-0"
              style={{ 
                color: colors.headerTitleColor, 
                backgroundColor: colors.cardBg,
                borderColor: `${colors.primaryAccent}20` 
              }}
              title="تتبع مسار شحنتك"
            >
              <span>{texts.btnTracking}</span>
            </button>

            {/* 4. Luxury Shopping Bag / Cart Pill */}
            <button
              id="store-header-cart-btn"
              onClick={onOpenCart}
              className={`relative px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 border transition-all duration-300 shadow-xs hover:border-[#C5A059] shrink-0 ${
                isCartBumping ? 'scale-105 shadow-md ring-2 ring-[#C5A059]' : ''
              }`}
              style={{ 
                backgroundColor: colors.cardBg, 
                borderColor: colors.cardBorder, 
                color: colors.headerTitleColor 
              }}
              title="سلة التسوق"
            >
              <span className={`transition-transform duration-300 ${isCartBumping ? 'scale-110 text-[#C5A059]' : ''}`}>
                {renderCartIcon()}
              </span>
              <span className="hidden sm:inline text-[11px] font-bold font-brand">{texts.btnCart}</span>
              {totalCartCount > 0 && (
                <span 
                  className={`w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center border shadow-xs transition-transform duration-300 ${
                    isCartBumping ? 'scale-110 bg-[#C5A059] text-white' : ''
                  }`}
                  style={{ 
                    backgroundColor: colors.heroBtnBg, 
                    color: colors.primaryAccent, 
                    borderColor: colors.primaryAccent 
                  }}
                >
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Global Alert Notification (if active) */}
      {globalAlert && (
        <div 
          className="border-b py-2 sm:py-2.5 px-3 sm:px-4 text-center text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-2 transition-colors w-full max-w-full overflow-hidden leading-relaxed"
          style={{ 
            backgroundColor: `${colors.primaryAccent}15`, 
            borderColor: `${colors.primaryAccent}30`, 
            color: colors.secondaryAccent 
          }}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: colors.primaryAccent }} />
          <span className="break-words max-w-3xl">{globalAlert}</span>
        </div>
      )}

      {/* 3. Dynamic Storefront Sections Architecture */}
      {storeSections
        .filter(sec => sec.id !== 'marquee' && isSectionEnabled(sec.id))
        .map(sec => {
          if (sec.id === 'hero') {
            return (
              <section 
                key="hero"
                className="relative overflow-hidden border-b py-16 md:py-24 transition-colors"
        style={{ 
          background: `linear-gradient(to bottom, ${colors.heroBgStart}, ${colors.heroBgEnd})`,
          borderColor: `${colors.primaryAccent}15`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Right Side: Active Card Dynamic Text */}
            <div 
              key={activeCard.id || activeHeroSlide} 
              className="lg:col-span-7 space-y-6 text-right transition-all duration-700 ease-out animate-hero-chic"
            >
                      {isSubElementVisible('heroBadge') && (
                        <div 
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors"
                          style={{ 
                            backgroundColor: colors.heroBadgeBg, 
                            color: colors.heroBadgeText, 
                            borderColor: `${colors.primaryAccent}40` 
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5" style={{ color: colors.primaryAccent }} />
                          <span>{activeCard.badge || texts.heroBadge}</span>
                        </div>
                      )}

                      {/* Slogan Banner */}
                      {isSubElementVisible('heroBrand') && (
                        <div className="space-y-1.5 pt-1">
                          <span 
                            className="text-sm font-brand tracking-[0.3em] font-bold uppercase block transition-colors"
                            style={{ color: colors.heroBrandColor }}
                          >
                            {activeCard.brandName || texts.heroBrandName}
                          </span>
                          <h1 
                            className="text-3xl sm:text-5xl font-display font-bold tracking-wide uppercase transition-colors"
                            style={{ color: colors.heroTitleColor }}
                          >
                            {activeCard.mainHeading || texts.heroMainHeading}
                          </h1>
                          <p 
                            className="text-xs sm:text-sm font-brand tracking-[0.25em] uppercase font-semibold transition-colors"
                            style={{ color: colors.heroSubtitleColor }}
                          >
                            {activeCard.subtitle || texts.heroSubtitle}
                          </p>
                        </div>
                      )}

                      {isSubElementVisible('heroHeadline') && (
                        <h2 
                          className="text-lg sm:text-xl font-medium leading-relaxed font-arabic transition-colors"
                          style={{ color: colors.heroHeadlineColor }}
                        >
                          {activeCard.headline || texts.heroArabicHeadline}
                        </h2>
                      )}

                      {isSubElementVisible('heroDescription') && (
                        <p 
                          className="text-sm md:text-base max-w-xl leading-relaxed font-arabic font-normal transition-colors"
                          style={{ color: colors.heroDescColor }}
                        >
                          {activeCard.description || texts.heroDescription}
                        </p>
                      )}

                      {(isSubElementVisible('heroPrimaryBtn') || isSubElementVisible('heroSecondaryBtn')) && (
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          {isSubElementVisible('heroPrimaryBtn') && (
                            <a
                              href="#collection"
                              className="px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                              style={{ 
                                backgroundColor: colors.heroBtnBg, 
                                color: colors.heroBtnText 
                              }}
                            >
                              {activeCard.primaryBtnText || texts.heroPrimaryBtn}
                            </a>
                          )}
                          {isSubElementVisible('heroSecondaryBtn') && (
                            <button
                              onClick={onOpenTracking}
                              className="px-6 py-3.5 border text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                              style={{ 
                                backgroundColor: colors.heroSecondaryBtnBg, 
                                color: colors.heroSecondaryBtnText, 
                                borderColor: `${colors.primaryAccent}30` 
                              }}
                            >
                              {texts.heroSecondaryBtn}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Social Channels */}
                      {isSubElementVisible('heroSocial') && (
                        <div className="flex items-center gap-3 pt-4 text-gray-400">
                          <span className="text-xs font-medium" style={{ color: colors.heroDescColor }}>
                            {texts.heroSocialLabel}
                          </span>
                          {settings.socialLinks?.insta && (
                            <a href={settings.socialLinks.insta} target="_blank" rel="noopener noreferrer" className="p-2 transition-colors rounded-full hover:bg-gray-100" style={{ color: colors.primaryAccent }}>
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {settings.socialLinks?.fb && (
                            <a href={settings.socialLinks.fb} target="_blank" rel="noopener noreferrer" className="p-2 transition-colors rounded-full hover:bg-gray-100" style={{ color: colors.primaryAccent }}>
                              <Facebook className="w-4 h-4" />
                            </a>
                          )}
                          {settings.socialLinks?.whatsapp && (
                            <a href={`https://wa.me/${settings.socialLinks.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(texts.whatsappDefaultMsg)}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:text-[#25D366] transition-colors rounded-full hover:bg-gray-100">
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Left Side: Visual Hero Card with Smooth PAN & Controls */}
                    {isSubElementVisible('heroCard') && (
                      <div 
                        className="lg:col-span-5 relative"
                        onMouseEnter={() => setIsHeroPaused(true)}
                        onMouseLeave={() => setIsHeroPaused(false)}
                      >
              <div 
                className="relative mx-auto max-w-sm rounded-3xl overflow-hidden shadow-2xl border-2 bg-white"
                style={{ borderColor: `${colors.primaryAccent}30` }}
              >
                <div className="aspect-4/5 overflow-hidden relative group">
                  <img
                    key={activeCard.image}
                    src={activeCard.image || texts.heroCardImage || "https://images.unsplash.com/photo-1608248597359-0f6667115858?auto=format&fit=crop&w=800&q=80"}
                    alt={activeCard.cardTitle || texts.heroCardTitle}
                    className="w-full h-full object-cover animate-pan-smooth transition-transform duration-[4000ms]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-6 text-white text-right">
                    <span className="text-xs font-brand tracking-widest uppercase font-bold" style={{ color: colors.primaryAccent }}>
                      {activeCard.cardTag || texts.heroCardTag}
                    </span>
                    <h3 className="text-xl font-bold font-brand mt-1">{activeCard.cardTitle || texts.heroCardTitle}</h3>
                    <p className="text-xs text-white/80 mt-1 line-clamp-2">{activeCard.cardDesc || texts.heroCardDesc}</p>

                    {/* Pagination Indicator Dots & Arrow Controls */}
                    {featuredCards.length > 1 && (
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/20">
                        <div className="flex items-center gap-1.5">
                          {featuredCards.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveHeroSlide(idx)}
                              className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                              style={{
                                width: idx === activeHeroSlide ? '1.5rem' : '0.4rem',
                                backgroundColor: idx === activeHeroSlide ? colors.primaryAccent : 'rgba(255,255,255,0.4)'
                              }}
                              title={`البطاقة المميزة ${idx + 1}`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={handlePrevHeroCard}
                            className="p-1 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
                            title="السابق"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleNextHeroCard}
                            className="p-1 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
                            title="التالي"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          </div>
        </div>
              </section>
            );
          }

          // --- B. ACTIVE OFFERS BANNER CARDS ---
          if (sec.id === 'offers') {
            if (publishedOffers.length === 0) return null;
            return (
              <section key="offers" className="py-8 bg-[#FAF3E0]/40 border-b border-[#C5A059]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publishedOffers.map((offer) => (
                <div key={offer.id} className="p-5 bg-white border border-[#C5A059]/30 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 items-center">
                  {offer.image && (
                    <img 
                      src={offer.image} 
                      alt={offer.title} 
                      className="w-full sm:w-28 h-28 object-cover rounded-xl shrink-0 border border-gray-100"
                    />
                  )}
                  <div className="flex-1 text-right">
                    {isSubElementVisible('offersBadge') && (
                      <span className="inline-block px-2.5 py-0.5 bg-[#C5A059]/20 text-[#8C6D2D] rounded-full text-[10px] font-bold mb-1">
                        {langMode === 'ar' ? 'عرض خاص' : 'Special Offer'}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-gray-900">{offer.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{offer.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
              </section>
            );
          }

          // --- C. REELS UGC VIDEO EXPERIENCES ---
          if (sec.id === 'reels') {
            return (
              <div key="reels">
                <ReelsSection
                  reels={reels}
                  catalog={catalog}
                  colors={colors}
                  lang={langMode}
                  onAddToCart={(k, sz, p, e) => handleAddToCartWithSize(e, k, sz ? { name: sz, price: p || 0 } : undefined, 1)}
                  onOpenCart={onOpenCart}
                />
              </div>
            );
          }

          // --- D. BESTSELLERS HIGHLIGHT SECTION ---
          if (sec.id === 'bestsellers') {
            if (bestsellers.length === 0) return null;
            return (
              <section key="bestsellers" id="bestsellers" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            {isSubElementVisible('bestsellersBadge') && (
              <span 
                className="text-xs font-bold tracking-widest uppercase font-brand block mb-1 transition-colors"
                style={{ color: colors.primaryAccent }}
              >
                {texts.bestsellersBadge}
              </span>
            )}
            {isSubElementVisible('bestsellersTitle') && (
              <h2 
                className="text-2xl sm:text-3xl font-display font-medium transition-colors"
                style={{ color: colors.headerTitleColor }}
              >
                {texts.bestsellersTitle}
              </h2>
            )}
            <div 
              className="w-12 h-0.5 mx-auto mt-3 transition-colors"
              style={{ backgroundColor: colors.primaryAccent }}
            />
          </div>

          <div className={`grid gap-4 sm:gap-6 ${
            settings.clientCardSize === 'compact'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              : settings.clientCardSize === 'spacious'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-4'
          }`}>
            {bestsellers.slice(0, settings.clientCardSize === 'compact' ? 5 : 4).map((product) => renderProductCard(product, 'bestseller'))}
          </div>
              </section>
            );
          }

          // --- E. SHOP BY COLLECTION SECTION ---
          if (sec.id === 'collections') {
            return (
              <div key="collections">
                <CollectionsSection
                  collections={activeCollections}
                  catalog={catalog}
                  colors={colors}
                  onAddToCart={(k, sz, p, e) => handleAddToCartWithSize(e, k, sz ? { name: sz, price: p || 0 } : undefined, 1)}
                  onOpenCart={onOpenCart}
                  onOpenQuickView={(key) => {
                    const p = parsedProducts.find(pr => pr.key === key);
                    if (p) {
                      const activeSz = p.hasSizes ? (selectedProductSizes[p.key] || p.sizes[0]) : undefined;
                      setSelectedProductDetails({
                        ...p,
                        selectedSize: activeSz
                      });
                    }
                  }}
                />
              </div>
            );
          }

          // --- F. COMPLETE CATALOG & CATEGORY FILTERS ---
          if (sec.id === 'catalog') {
            return (
              <section 
                key="catalog"
                id="collection" 
                className="py-16 border-y transition-colors"
        style={{ 
          backgroundColor: colors.heroBgStart, 
          borderColor: `${colors.primaryAccent}15` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <div className="text-center md:text-right">
              <span 
                className="text-xs font-bold tracking-widest uppercase font-brand block mb-1"
                style={{ color: colors.primaryAccent }}
              >
                {texts.catalogBadge}
              </span>
              <h2 
                className="text-2xl sm:text-3xl font-display font-medium"
                style={{ color: colors.headerTitleColor }}
              >
                {texts.catalogTitle}
              </h2>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Category Segmented Control */}
              {isSubElementVisible('catalogFilters') && (
                <div className="flex items-center p-1 bg-gray-100 rounded-xl text-xs font-bold">
                  {[
                    { id: 'ALL', label: texts.filterAll },
                    { id: 'WOMEN', label: texts.filterWomen },
                    { id: 'MEN', label: texts.filterMen },
                    { id: 'UNISEX', label: texts.filterUnisex },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategoryFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeCategoryFilter === tab.id
                          ? 'bg-white shadow-xs font-bold'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                      style={activeCategoryFilter === tab.id ? { color: colors.headerTitleColor } : {}}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Search Input */}
              {isSubElementVisible('catalogSearch') && (
                <div className="relative flex-1 md:w-56">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={texts.searchPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border rounded-xl focus:outline-none"
                    style={{ borderColor: colors.cardBorder }}
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              )}
            </div>
          </div>

          {/* Grouped Product Grid */}
          {productGroups.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm font-semibold">لم نجد أي منتجات تطابق الفلاتر المحددة.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {productGroups.map((group, idx) => {
                const groupItems = filteredProducts.filter(p => p.group === group);
                const isGroupOpen = Boolean(openGroups[group]);

                return (
                  <div 
                    key={group} 
                    className="rounded-3xl border overflow-hidden shadow-xs transition-all duration-300"
                    style={{
                      borderColor: colors.groupHeaderBorder || `${colors.primaryAccent}30`,
                      backgroundColor: colors.cardBg
                    }}
                  >
                    {/* Collapsible Dropdown Group Header Banner (Distinct background from site) */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-right cursor-pointer transition-colors select-none group focus:outline-none"
                      style={{
                        backgroundColor: colors.groupHeaderBg || '#FFFFFF',
                        color: colors.groupHeaderTextColor || colors.headerTitleColor
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <span 
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: `${colors.primaryAccent}20`,
                            color: colors.primaryAccent
                          }}
                        >
                          {idx + 1}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold font-brand tracking-wide">
                              {group}
                            </h3>
                            <span 
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                backgroundColor: isGroupOpen ? `${colors.primaryAccent}20` : '#F3F4F6',
                                color: isGroupOpen ? colors.primaryAccent : '#6B7280'
                              }}
                            >
                              {groupItems.length} صنف
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                            {isGroupOpen ? 'انقر لطي القائمة' : 'انقر لفتح واستعراض منتجات هذه المجموعة'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-gray-400 group-hover:text-gray-700 transition-colors hidden sm:inline">
                          {isGroupOpen ? 'إغلاق' : 'عرض المنتجات'}
                        </span>
                        <div 
                          className={`p-2 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            isGroupOpen 
                              ? 'rotate-180 bg-[#C5A059]/15 text-[#C5A059]' 
                              : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                          }`}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </button>

                    {/* Collapsible Body (Dropdown Content) - Silky Smooth CSS Grid Expansion */}
                    <div 
                      className={`grid ${
                        isGroupOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                      }`}
                      style={{
                        transition: 'grid-template-rows 420ms cubic-bezier(0.2, 0, 0, 1), opacity 360ms ease-in-out'
                      }}
                    >
                      <div className="overflow-hidden">
                          <div className={`grid gap-4 sm:gap-6 ${
                            settings.clientCardSize === 'compact'
                              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                              : settings.clientCardSize === 'spacious'
                              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                          }`}>
                            {groupItems.map(product => renderProductCard(product, group))}
                          </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct Checkout / Review Cart Button below groups (User Request - Screenshot 4) */}
          <div 
            className="mt-10 p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 transition-all"
            style={{ 
              backgroundColor: colors.cardBg, 
              borderColor: `${colors.primaryAccent}40` 
            }}
          >
            <div className="text-right">
              <span className="text-xs font-bold text-gray-400 block mb-1">انتهيت من اختياراتك؟</span>
              <h3 className="text-base sm:text-lg font-bold" style={{ color: colors.headerTitleColor }}>
                {totalCartCount > 0 
                  ? `لديك ${totalCartCount} قطعة في السلة بإجمالي ${totalCartPrice.toFixed(0)} ج.م`
                  : 'أضف ما يناسبك من التشكيلة واضغط للمتابعة إلى الدفع وإنهاء الطلب'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                توصيل سريع ودفع آمن عند الاستلام أو عبر تحويل انستاباي الفوري.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenCart}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 ${
                totalCartCount > 0 ? 'animate-pulse hover:animate-none' : ''
              }`}
              style={{
                backgroundColor: colors.heroBtnBg,
                color: colors.heroBtnText
              }}
            >
              {renderCartIcon()}
              <span>إتمام الطلب ومراجعة السلة</span>
              {totalCartCount > 0 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: colors.primaryAccent, color: colors.heroBgEnd }}
                >
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </section>
    );
  }

  // --- G. TRUST BADGES SECTION ---
  if (sec.id === 'trust_badges') {
    if (resolvedTrustBadges.length === 0) return null;
    return (
      <section 
        key="trust_badges"
        className="py-12 border-b transition-colors"
        style={{ 
          backgroundColor: colors.trustBg, 
          borderColor: `${colors.primaryAccent}15` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            {resolvedTrustBadges.map((badge, idx) => (
              <div key={badge.id || idx} className="p-4 flex flex-col items-center space-y-2 min-w-[140px] max-w-[220px]">
                <div 
                  className="w-12 h-12 rounded-2xl shadow-xs border flex items-center justify-center mb-1 transition-colors"
                  style={{ 
                    backgroundColor: colors.trustCardBg, 
                    borderColor: colors.cardBorder 
                  }}
                >
                  {renderBadgeIcon(badge.icon)}
                </div>
                <h4 
                  className="text-xs sm:text-sm font-bold transition-colors"
                  style={{ color: colors.trustTextColor }}
                >
                  {badge.text}
                </h4>
                {badge.description && (
                  <p className="text-[11px] text-gray-500 line-clamp-2">
                    {badge.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- H. CUSTOMER REVIEWS & TESTIMONIALS ---
  if (sec.id === 'reviews') {
    if (activeReviewsList.length === 0) return null;
    return (
      <section 
        key="reviews"
        id="reviews" 
        className="py-20 border-y transition-colors overflow-hidden relative"
        style={{ 
          backgroundColor: '#141413',
          borderColor: `${colors.primaryAccent}35`
        }}
      >
        <div className="text-center max-w-2xl mx-auto mb-10 px-4">
          {isSubElementVisible('reviewsBadge') && (
            <span 
              className="text-xs font-bold tracking-[0.25em] uppercase font-brand block mb-2"
              style={{ color: colors.primaryAccent }}
            >
              {texts.reviewsBadge || 'CLIENT FEEDBACK'}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-wide">
            {texts.reviewsTitle || 'آراء وتجارب عملائنا المميزين'}
          </h2>
          <div 
            className="w-16 h-0.5 mx-auto mt-3 rounded-full"
            style={{ backgroundColor: colors.primaryAccent }}
          />
          <p className="text-xs text-gray-400 mt-2.5 font-arabic">
            تجارب وانطباعات حقيقية يشاركها عملاؤنا مع مستحضرات وعطور ROSÉE الفاخرة
          </p>

          {/* Quick Button to open the Review Modal */}
          {onSubmitReview && isSubElementVisible('reviewsWriteBtn') && (
            <div className="mt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: colors.primaryAccent,
                  color: '#111111'
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>شاركنا رأيك وتجربتك</span>
              </button>
            </div>
          )}
        </div>

        {/* Continuous Right-to-Left Infinite Seamless Loop Marquee */}
        <div className="relative w-full overflow-hidden" dir="ltr">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#141413] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#141413] to-transparent z-10" />

          <div className="animate-reviews-marquee flex w-max cursor-grab hover:[animation-play-state:paused]">
            <div className="flex shrink-0 items-stretch gap-6 pr-6 py-4">
              {marqueeReviews.map((rev, index) => renderReviewCard(rev, `track1-${index}`))}
            </div>
            <div className="flex shrink-0 items-stretch gap-6 pr-6 py-4" aria-hidden="true">
              {marqueeReviews.map((rev, index) => renderReviewCard(rev, `track2-${index}`))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
})}

      {/* 9. Product Details Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 text-right">
            <div className="relative aspect-4/3 bg-gray-50">
              <img
                src={selectedProductDetails.image}
                alt={selectedProductDetails.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="absolute top-3 left-3 p-1.5 bg-black/50 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
              <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#111111] text-[#C5A059] text-xs font-bold rounded-md uppercase font-brand">
                {selectedProductDetails.category}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs text-[#C5A059] font-bold font-brand">{selectedProductDetails.group}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{selectedProductDetails.name}</h3>
                <p className="text-base font-bold text-[#111111] tabular-nums font-brand mt-1">
                  {selectedProductDetails.price} ج.م
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-gray-700">عن هذا المستحضر:</h5>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedProductDetails.description || 'مستحضر فاخر للعناية بالبشرة والتجميل مصمم بعناية فائقة ليمنح بشرتكِ نضارة وإشراقة طبيعية تدوم طوال اليوم.'}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                <button
                  onClick={(e) => {
                    handleAddToCartWithEffect(e, selectedProductDetails.key, 1);
                    setSelectedProductDetails(null);
                    onOpenCart();
                  }}
                  className="flex-1 py-3 px-4 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md text-center"
                >
                  إضافة إلى سلة الشراء ومتابعة الطلب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Welcome Available Offers Pop-up Modal (with Pan-to-Left effect) */}
      {isOffersPopUpOpen && publishedOffers.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOffersPopUpOpen(false);
          }}
        >
          <div 
            className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-2 text-right flex flex-col transition-colors"
            style={{ 
              backgroundColor: colors.offersPopupBg, 
              borderColor: `${colors.primaryAccent}40` 
            }}
          >
            
            {/* Modal Header Bar */}
            <div 
              className="px-5 py-3.5 text-white flex items-center justify-between border-b transition-colors"
              style={{ 
                backgroundColor: colors.offersPopupHeaderBg, 
                borderColor: `${colors.primaryAccent}30` 
              }}
            >
              <div className="flex items-center gap-2">
                <span 
                  className="p-1 rounded-lg"
                  style={{ 
                    backgroundColor: `${colors.primaryAccent}25`, 
                    color: colors.primaryAccent 
                  }}
                >
                  <Gift className="w-4 h-4" />
                </span>
                <span className="text-xs sm:text-sm font-bold text-white font-arabic">
                  {texts.offersModalBadge}
                </span>
                {publishedOffers.length > 1 && (
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full font-brand"
                    style={{ 
                      backgroundColor: colors.primaryAccent, 
                      color: colors.offersPopupHeaderBg 
                    }}
                  >
                    {currentOfferSlide + 1} / {publishedOffers.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {publishedOffers.length > 1 && (
                  <span className="text-[10px] text-gray-300 hidden sm:inline">
                    {isAutoPanPaused ? '⏸️ متوقف مؤقتاً' : '✨ يتحرك لليسار تلقائياً'}
                  </span>
                )}
                <button
                  onClick={() => setIsOffersPopUpOpen(false)}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Auto-pan animated progress bar if multiple offers */}
            {publishedOffers.length > 1 && !isAutoPanPaused && (
              <div className="w-full bg-gray-100 h-1 overflow-hidden">
                <div 
                  key={currentOfferSlide}
                  className="h-full"
                  style={{ 
                    backgroundColor: colors.primaryAccent,
                    animation: 'panProgress 4s linear' 
                  }}
                />
              </div>
            )}

            {/* Pan-to-Left Carousel Track */}
            <div 
              className="relative overflow-hidden w-full select-none"
              style={{ backgroundColor: colors.offersPopupBg }}
              onMouseEnter={() => setIsAutoPanPaused(true)}
              onMouseLeave={() => setIsAutoPanPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Slide Track with pan to left translation */}
              <div 
                dir="ltr"
                className="flex transition-transform duration-700 ease-out w-full"
                style={{
                  transform: `translateX(-${currentOfferSlide * 100}%)`
                }}
              >
                {publishedOffers.map((offer, idx) => (
                  <div 
                    key={offer.id || idx}
                    dir="rtl"
                    className="w-full shrink-0 flex-none flex flex-col justify-between"
                  >
                    {/* Offer Image */}
                    {offer.image ? (
                      <div className="relative aspect-16/9 w-full bg-gray-100 overflow-hidden group">
                        <img 
                          src={fixImageLink(offer.image)} 
                          alt={offer.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                          <span 
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm"
                            style={{ 
                              backgroundColor: colors.primaryAccent, 
                              color: colors.offersPopupHeaderBg 
                            }}
                          >
                            ✨ عرض خاص لفترة محدودة
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="h-32 flex items-center justify-center p-6 text-center"
                        style={{ backgroundColor: colors.offersPopupHeaderBg, color: colors.primaryAccent }}
                      >
                        <Sparkles className="w-10 h-10 animate-pulse" />
                      </div>
                    )}

                    {/* Offer Text & Details */}
                    <div className="p-6 space-y-3 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg sm:text-xl font-bold font-display" style={{ color: colors.headerTitleColor }}>
                          {offer.title}
                        </h3>
                        <span 
                          className="text-[10px] font-bold border px-2 py-0.5 rounded-full shrink-0 font-brand"
                          style={{ color: colors.primaryAccent, borderColor: `${colors.primaryAccent}40` }}
                        >
                          OFFER
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-arabic">
                        {offer.text}
                      </p>

                      {/* Promo Code Quick Copy if detected */}
                      {offer.text.includes('ROSE15') && (
                        <div 
                          className="pt-1 flex items-center justify-between p-2.5 border rounded-xl"
                          style={{ 
                            backgroundColor: `${colors.primaryAccent}15`, 
                            borderColor: `${colors.primaryAccent}30` 
                          }}
                        >
                          <div className="text-xs">
                            <span className="text-gray-500 block text-[10px]">كود الخصم الحصري:</span>
                            <span className="font-bold font-brand tracking-wider text-sm" style={{ color: colors.secondaryAccent }}>ROSE15</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('ROSE15');
                              setCopiedOfferCode('ROSE15');
                              setTimeout(() => setCopiedOfferCode(null), 2500);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-white shadow-xs"
                            style={{ backgroundColor: colors.primaryAccent }}
                          >
                            {copiedOfferCode === 'ROSE15' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>تم النسخ!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ الكود</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* CTA Button */}
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setIsOffersPopUpOpen(false);
                            const el = document.getElementById('collection');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="w-full py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-md text-center flex items-center justify-center gap-2"
                          style={{ 
                            backgroundColor: colors.heroBtnBg, 
                            color: colors.heroBtnText 
                          }}
                        >
                          <Sparkles className="w-4 h-4" style={{ color: colors.primaryAccent }} />
                          <span>{texts.offersModalCta}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows for Multiple Offers */}
              {publishedOffers.length > 1 && (
                <>
                  <button
                    onClick={handleNextOffer}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg border border-gray-200 transition-all cursor-pointer z-10"
                    title="العرض التالي (تحريك لليسار)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handlePrevOffer}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg border border-gray-200 transition-all cursor-pointer z-10"
                    title="العرض السابق"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Controls & Dismiss Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              {/* Pagination Dots */}
              {publishedOffers.length > 1 ? (
                <div className="flex items-center gap-1.5">
                  {publishedOffers.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentOfferSlide(idx)}
                      className="h-2 transition-all duration-300 rounded-full cursor-pointer"
                      style={{ 
                        width: idx === currentOfferSlide ? '1.75rem' : '0.5rem',
                        backgroundColor: idx === currentOfferSlide ? colors.primaryAccent : '#D1D5DB'
                      }}
                      title={`الانتقال للعرض ${idx + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-gray-400">ROSÉE Exclusive Boutique</span>
              )}

              <button
                onClick={() => setIsOffersPopUpOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer underline font-arabic"
              >
                {texts.offersModalSkip}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Multi-Social Media Dock (WhatsApp, Instagram, TikTok, Facebook) */}
      <FloatingSocialDock settings={settings} colors={colors} />

      {/* Storefront Footer */}
      <footer 
        className="py-12 border-t transition-colors"
        style={{ 
          backgroundColor: colors.footerBg, 
          borderColor: `${colors.primaryAccent}20` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span 
            className="text-2xl font-brand tracking-[0.3em] font-normal block transition-colors"
            style={{ color: colors.footerBrandColor }}
          >
            {texts.footerBrandName}
          </span>
          <span 
            className="text-xs font-display font-bold tracking-[0.2em] block uppercase transition-colors"
            style={{ color: colors.footerTaglineColor }}
          >
            {texts.footerTagline}
          </span>
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <p 
              className="leading-relaxed transition-colors"
              style={{ color: colors.footerTextColor }}
            >
              {texts.footerBio} {new Date().getFullYear()}
            </p>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <a
              href="/admin.html"
              onClick={(e) => {
                if (onOpenAdmin) {
                  e.preventDefault();
                  onOpenAdmin();
                }
              }}
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#C5A059] transition-colors cursor-pointer group py-1 px-2.5 rounded-lg hover:bg-white/5"
              title="بوابة إدارة المتجر والموظفين المعتمدين"
            >
              <Lock className="w-3 h-3 group-hover:text-[#C5A059] transition-colors" />
              <span>{langMode === 'ar' ? 'بوابة الإدارة والموظفين' : 'Staff Portal'}</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Review Submission Modal */}
      {onSubmitReview && (
        <ReviewSubmissionModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmitReview={onSubmitReview}
          catalog={catalog}
          primaryAccent={colors.primaryAccent}
        />
      )}

      {/* Quiz Matcher Modal */}
      {quizConfig.enabled && (
        <ProductQuizModal
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          config={quizConfig}
          catalog={catalog}
          onAddToCart={(productKey, size, qty) => handleAddToCartWithSize(undefined, productKey, size, qty)}
          onOpenCart={onOpenCart}
        />
      )}

      {/* Luxury Spin the Wheel Modal */}
      {spinWheelConfig.enabled && (
        <SpinWheelModal
          isOpen={isSpinWheelOpen}
          onClose={() => setIsSpinWheelOpen(false)}
          config={spinWheelConfig}
          onClaimPromo={(code) => {
            if (onClaimPromoCode) onClaimPromoCode(code);
          }}
        />
      )}

      {/* Golden Rose Treasure Hunt Badge & Celebratory Modal */}
      {treasureHuntConfig.enabled && (
        <TreasureHuntBadge
          config={treasureHuntConfig}
          collectedCount={collectedRoses.length}
          isCompleted={collectedRoses.length >= (treasureHuntConfig.targetCount || 3)}
          onClaimPromo={(code) => {
            if (onClaimPromoCode) onClaimPromoCode(code);
          }}
          onResetHunt={() => {
            setCollectedRoses([]);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('rosee_collected_roses');
            }
          }}
        />
      )}

    </div>
  );
};
