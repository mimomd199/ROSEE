import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Package, 
  Shield, 
  Plus, 
  Trash2, 
  Save, 
  AlertTriangle, 
  Sparkles, 
  Edit3, 
  X, 
  ExternalLink,
  Search,
  Check,
  Image as ImageIcon,
  Palette,
  Type,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Globe,
  SlidersHorizontal,
  Zap,
  Activity,
  Key,
  Mail,
  Send,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  Star,
  Heart,
  Leaf,
  Truck,
  ShieldCheck,
  Lock,
  Award,
  Gem,
  ThumbsUp,
  Clock,
  UserCheck,
  Users,
  Layers,
  Link2,
  Upload,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Video,
  Gift,
  Tag,
  ToggleLeft,
  ToggleRight,
  ListOrdered,
  GripVertical,
  HelpCircle,
  Target,
  Percent,
  Dices,
  Calendar,
  CheckSquare
} from 'lucide-react';
import { 
  ProductCatalog, 
  AppSettings, 
  UserAccount, 
  CatalogItem, 
  StoreColors, 
  StoreTexts, 
  StoreAnimations, 
  StoreIcons,
  FeaturedHeroCard,
  TrustBadge,
  ProductSize,
  StoreSectionSetting,
  StoreSectionId,
  CollectionGroup,
  QuizConfig,
  QuizQuestion,
  QuizOption,
  GiftingConfig,
  GiftPackagingOption,
  SpinWheelConfig,
  SpinWheelPrize,
  TreasureHuntConfig
} from '../../types';
import { 
  DEFAULT_STORE_COLORS, 
  DEFAULT_STORE_TEXTS, 
  DEFAULT_STORE_ANIMATIONS,
  DEFAULT_STORE_ICONS,
  DEFAULT_FEATURED_CARDS,
  DEFAULT_TRUST_BADGES,
  DEFAULT_STORE_SECTIONS,
  DEFAULT_SUB_ELEMENTS_VISIBILITY,
  COLOR_PRESETS, 
  getResolvedColors, 
  getResolvedTexts, 
  getResolvedAnimations,
  getResolvedIcons,
  getResolvedFeaturedCards,
  getResolvedTrustBadges,
  getResolvedSections,
  getResolvedSubElements,
  getResolvedQuizConfig,
  getResolvedGiftingConfig,
  getResolvedSpinWheelConfig,
  getResolvedTreasureHuntConfig,
  ColorPreset 
} from '../../lib/storeDefaults';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface SettingsManagerProps {
  catalog: ProductCatalog;
  settings: AppSettings;
  users: { [code: string]: UserAccount };
  collections?: CollectionGroup[];
  initialTab?: 'catalog' | 'store' | 'users';
  onSaveCatalog: (updatedCatalog: ProductCatalog) => Promise<void>;
  onSaveSettings: (updatedSettings: AppSettings) => Promise<void>;
  onSaveUsers: (updatedUsers: { [code: string]: UserAccount }) => Promise<void>;
  onSaveCollections?: (updatedCollections: CollectionGroup[]) => Promise<void>;
  onLogAction: (action: string) => void;
  onSwitchToStore?: () => void;
}

const PERMISSIONS_LIST = [
  { id: 'orders', label: 'الطلبات والمبيعات (كامل)' },
  { id: 'edit_order', label: 'تعديل بيانات الطلب وحالته' },
  { id: 'add_item', label: 'إضافة أصناف جديدة للطلب' },
  { id: 'delete_order', label: 'حذف أو إلغاء الطلبات' },
  { id: 'products', label: 'المنتجات والأحجام والأسعار' },
  { id: 'crm', label: 'إدارة العملاء وتاريخ الشراء' },
  { id: 'expenses', label: 'المصروفات التشغيلية (OPEX)' },
  { id: 'analytics', label: 'التقارير والأرباح والإحصائيات' },
  { id: 'reels', label: 'فيديوهات الريلز والـ UGC' },
  { id: 'offers', label: 'إدارة العروض والخصومات' },
  { id: 'promo', label: 'أكواد الخصم والكوبونات' },
  { id: 'reviews', label: 'مراجعات وتقييمات العملاء' },
  { id: 'agency', label: 'وكالة الذكاء التسويقي (AI)' },
  { id: 'settings', label: 'المظهر وإعدادات المتجر' },
  { id: 'view_logs', label: 'رؤية سجل حركات النظام' }
];

export function fixImageLink(url: string): string {
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

interface EditProductState {
  originalKey: string;
  group: string;
  name: string;
  category: 'FOR WOMEN' | 'FOR MEN' | 'UNISEX';
  defaultPrice: number;
  cost: number;
  stockQty: number;
  alertLimit: number;
  showStock: boolean;
  isBestseller: boolean;
  isOutOfStock: boolean;
  description: string;
  image: string;
  images?: string[];
  hasSizes?: boolean;
  sizes?: ProductSize[];
  collectionImage?: string;
  batchNumber?: string;
  expiryDate?: string;
}

interface EditingEmployeeState {
  originalCode: string;
  code: string;
  name: string;
  role: 'admin' | 'user';
  password?: string;
  email?: string;
  permissions: string[];
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  catalog,
  settings,
  users,
  collections,
  initialTab,
  onSaveCatalog,
  onSaveSettings,
  onSaveUsers,
  onSaveCollections,
  onLogAction,
  onSwitchToStore
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'catalog' | 'users'>(initialTab || 'catalog');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [storeSubTab, setStoreSubTab] = useState<'sections' | 'colors' | 'texts' | 'animations' | 'icons' | 'general' | 'marketing'>('sections');
  const [activeMarketingModule, setActiveMarketingModule] = useState<'quiz' | 'gifting' | 'spin_wheel' | 'treasure_hunt'>('quiz');

  // Marketing Modules States (Quiz, Luxury Gifting, Spin-the-Wheel, Golden Rose Hunt)
  const [quizState, setQuizState] = useState<QuizConfig>(() => getResolvedQuizConfig(settings));
  const [giftingState, setGiftingState] = useState<GiftingConfig>(() => getResolvedGiftingConfig(settings));
  const [spinWheelState, setSpinWheelState] = useState<SpinWheelConfig>(() => getResolvedSpinWheelConfig(settings));
  const [treasureHuntState, setTreasureHuntState] = useState<TreasureHuntConfig>(() => getResolvedTreasureHuntConfig(settings));

  // Sections Architecture & Ordering State
  const [sectionsState, setSectionsState] = useState<StoreSectionSetting[]>(() => getResolvedSections(settings));
  const [subElementsState, setSubElementsState] = useState<{ [key: string]: boolean }>(() => getResolvedSubElements(settings));
  const [productGroupsOrderState, setProductGroupsOrderState] = useState<string[]>(() => settings.productGroupsOrder || []);
  const [catalogItemsOrderState, setCatalogItemsOrderState] = useState<string[]>(() => settings.catalogItemsOrder || []);
  const [collectionsState, setCollectionsState] = useState<CollectionGroup[]>(() => collections || []);
  const [expandedSectionId, setExpandedSectionId] = useState<StoreSectionId | null>('hero');

  // Granular Storefront Customizer State
  const [colorsState, setColorsState] = useState<StoreColors>(() => getResolvedColors(settings));
  const [textsState, setTextsState] = useState<StoreTexts>(() => getResolvedTexts(settings));
  const [animationsState, setAnimationsState] = useState<StoreAnimations>(() => getResolvedAnimations(settings));
  const [iconsState, setIconsState] = useState<StoreIcons>(() => getResolvedIcons(settings));
  const [activeColorCategory, setActiveColorCategory] = useState<string>('brand');
  const [activeTextSection, setActiveTextSection] = useState<string>('header');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Store settings state
  const [marqueeInput, setMarqueeInput] = useState(settings.marqueeText || '');
  const [tb1, setTb1] = useState(settings.trustBadges?.[0]?.text || 'مكونات طبيعية آمنة');
  const [tb2, setTb2] = useState(settings.trustBadges?.[1]?.text || 'شحن سريع لكافة المحافظات');
  const [tb3, setTb3] = useState(settings.trustBadges?.[2]?.text || 'جودة استثنائية مضمونة');
  const [tb4, setTb4] = useState(settings.trustBadges?.[3]?.text || 'دفع آمن عند الاستلام');
  const [pointValue, setPointValue] = useState(settings.loyaltyPointValue || 1);
  const [loyaltyEgpPerPoint, setLoyaltyEgpPerPoint] = useState<number>(settings.loyaltyEgpPerPoint || 20);
  const [loyaltyPointDiscountValue, setLoyaltyPointDiscountValue] = useState<number>(settings.loyaltyPointDiscountValue || settings.loyaltyPointValue || 1);
  const [instaAccount, setInstaAccount] = useState(settings.instapayAccount || '');
  const [instaLink, setInstaLink] = useState(settings.instapayLink || '');
  const [socialInsta, setSocialInsta] = useState(settings.socialLinks?.insta || '');
  const [socialFb, setSocialFb] = useState(settings.socialLinks?.fb || '');
  const [socialWa, setSocialWa] = useState(settings.socialLinks?.whatsapp || '');
  const [socialTiktok, setSocialTiktok] = useState(settings.socialLinks?.tiktok || '');

  // Social Dock Customization
  const [socialDockSize, setSocialDockSize] = useState<'micro' | 'compact' | 'standard'>(settings.socialDockSettings?.size || 'compact');
  const [socialDockTheme, setSocialDockTheme] = useState<'gold_luxury' | 'glassmorphism' | 'brand_colors' | 'minimal_dark'>(settings.socialDockSettings?.theme || 'gold_luxury');
  const [socialDockPosition, setSocialDockPosition] = useState<'left' | 'right'>(settings.socialDockSettings?.position || 'left');
  const [socialDockMotion, setSocialDockMotion] = useState<'luxury_pulse' | 'glow_aura' | 'subtle_bounce' | 'static'>(settings.socialDockSettings?.motionEffect || 'luxury_pulse');

  // Client UI elements sizing state
  const [clientUiScale, setClientUiScale] = useState<'compact' | 'standard' | 'comfortable' | 'large'>(settings.clientUiScale || 'standard');
  const [clientCardSize, setClientCardSize] = useState<'compact' | 'standard' | 'spacious'>(settings.clientCardSize || 'standard');
  const [clientFontScale, setClientFontScale] = useState<'small' | 'standard' | 'large'>(settings.clientFontScale || 'standard');

  // Dynamic Featured Hero Cards & Trust Badges state
  const [featuredCardsState, setFeaturedCardsState] = useState<FeaturedHeroCard[]>(() => getResolvedFeaturedCards(settings));
  const [activeHeroCardIdx, setActiveHeroCardIdx] = useState<number>(0);
  const [trustBadgesState, setTrustBadgesState] = useState<TrustBadge[]>(() => getResolvedTrustBadges(settings));

  // Employee Edit Modal state
  const [editingEmployee, setEditingEmployee] = useState<EditingEmployeeState | null>(null);
  const [isSavingEmployee, setIsSavingEmployee] = useState<boolean>(false);

  // Catalog items local copy
  const [catalogItems, setCatalogItems] = useState<ProductCatalog>(() => JSON.parse(JSON.stringify(catalog || {})));
  const [catalogSearch, setCatalogSearch] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Modal for editing a specific product in full detail
  const [editingProduct, setEditingProduct] = useState<EditProductState | null>(null);
  const [isSavingProductModal, setIsSavingProductModal] = useState<boolean>(false);
  const [productSaveToast, setProductSaveToast] = useState<string | null>(null);

  // Sync state if catalog or settings props update from Firebase
  useEffect(() => {
    if (catalog) {
      setCatalogItems(JSON.parse(JSON.stringify(catalog)));
    }
  }, [catalog]);

  useEffect(() => {
    if (settings) {
      setColorsState(getResolvedColors(settings));
      setTextsState(getResolvedTexts(settings));
      setAnimationsState(getResolvedAnimations(settings));
      setIconsState(getResolvedIcons(settings));
      if (settings.marqueeText !== undefined) setMarqueeInput(settings.marqueeText);
      if (settings.trustBadges?.[0]?.text) setTb1(settings.trustBadges[0].text);
      if (settings.trustBadges?.[1]?.text) setTb2(settings.trustBadges[1].text);
      if (settings.trustBadges?.[2]?.text) setTb3(settings.trustBadges[2].text);
      if (settings.trustBadges?.[3]?.text) setTb4(settings.trustBadges[3].text);
      if (settings.loyaltyPointValue !== undefined) setPointValue(settings.loyaltyPointValue);
      if (settings.loyaltyEgpPerPoint !== undefined) setLoyaltyEgpPerPoint(settings.loyaltyEgpPerPoint);
      if (settings.loyaltyPointDiscountValue !== undefined) setLoyaltyPointDiscountValue(settings.loyaltyPointDiscountValue);
      if (settings.instapayAccount !== undefined) setInstaAccount(settings.instapayAccount);
      if (settings.instapayLink !== undefined) setInstaLink(settings.instapayLink);
      if (settings.socialLinks?.insta !== undefined) setSocialInsta(settings.socialLinks.insta);
      if (settings.socialLinks?.fb !== undefined) setSocialFb(settings.socialLinks.fb);
      if (settings.socialLinks?.whatsapp !== undefined) setSocialWa(settings.socialLinks.whatsapp);
      if (settings.socialLinks?.tiktok !== undefined) setSocialTiktok(settings.socialLinks.tiktok);
      if (settings.socialDockSettings) {
        if (settings.socialDockSettings.size) setSocialDockSize(settings.socialDockSettings.size);
        if (settings.socialDockSettings.theme) setSocialDockTheme(settings.socialDockSettings.theme);
        if (settings.socialDockSettings.position) setSocialDockPosition(settings.socialDockSettings.position);
        if (settings.socialDockSettings.motionEffect) setSocialDockMotion(settings.socialDockSettings.motionEffect);
      }
      if (settings.featuredCards && settings.featuredCards.length > 0) {
        setFeaturedCardsState(getResolvedFeaturedCards(settings));
      }
      if (settings.trustBadges && settings.trustBadges.length > 0) {
        setTrustBadgesState(getResolvedTrustBadges(settings));
      }
      if (settings.clientUiScale) setClientUiScale(settings.clientUiScale);
      if (settings.clientCardSize) setClientCardSize(settings.clientCardSize);
      if (settings.clientFontScale) setClientFontScale(settings.clientFontScale);
    }
  }, [settings]);

  // Add new item form state
  const [newGroup, setNewGroup] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'FOR WOMEN' | 'FOR MEN' | 'UNISEX'>('FOR WOMEN');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newAlertLimit, setNewAlertLimit] = useState('3');
  const [newShowStock, setNewShowStock] = useState(true);
  const [newIsBestseller, setNewIsBestseller] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');

  // Staff management state with email binding & passwords visibility
  const [usersState, setUsersState] = useState<{ [code: string]: UserAccount }>(() => JSON.parse(JSON.stringify(users || {})));
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffCode, setNewStaffCode] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [code: string]: boolean }>({});
  const [emailNoticeUser, setEmailNoticeUser] = useState<string | null>(null);

  // Sync usersState if users prop updates
  useEffect(() => {
    if (users) {
      setUsersState(JSON.parse(JSON.stringify(users)));
    }
  }, [users]);

  // Find low stock products
  const lowStockItems = Object.entries(catalogItems).filter(([_, item]) => {
    const limit = item.alertLimit !== undefined ? item.alertLimit : 3;
    return (item.stockQty || 0) <= limit;
  });

  const handleApplyPreset = (preset: ColorPreset) => {
    setColorsState(prev => ({
      ...prev,
      ...preset.colors
    }));
    onLogAction(`تطبيق باليت الألوان الجاهز: ${preset.name}`);
  };

  const handleResetColorsToDefault = () => {
    setColorsState({ ...DEFAULT_STORE_COLORS });
    onLogAction('استعادة باليت الألوان الافتراضية للمتجر');
  };

  const handleResetTextsToDefault = () => {
    setTextsState({ ...DEFAULT_STORE_TEXTS });
    onLogAction('استعادة نصوص المتجر الافتراضية');
  };

  const handleResetAnimationsToDefault = () => {
    setAnimationsState({ ...DEFAULT_STORE_ANIMATIONS });
    onLogAction('استعادة إعدادات الحركات والمؤثرات الافتراضية');
  };

  const handleResetIconsToDefault = () => {
    setIconsState({ ...DEFAULT_STORE_ICONS });
    onLogAction('استعادة أشكال الأيقونات الافتراضية');
  };

  const handleTogglePasswordVisibility = (code: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const handleAdminChangePassword = (code: string) => {
    const user = usersState[code];
    if (!user) return;
    const currentPass = user.password || '';
    const newPass = prompt(`أدخل كلمة المرور الجديدة للموظف (${user.name}):`, currentPass);
    if (newPass !== null) {
      setUsersState(prev => ({
        ...prev,
        [code]: {
          ...user,
          password: newPass.trim()
        }
      }));
      onLogAction(`قام المدير بتحديث كلمة المرور للموظف: ${user.name}`);
      alert(`✅ تم تحديث كلمة المرور للموظف (${user.name}) بنجاح! تذكر الضغط على زر "حفظ التعديلات على الصلاحيات".`);
    }
  };

  const handleAdminSendCredentialsByEmail = (code: string) => {
    const user = usersState[code];
    if (!user) return;
    let targetEmail = user.email?.trim() || '';

    if (!targetEmail || !targetEmail.includes('@')) {
      alert(`الموظف (${user.name}) ليس لديه بريد إلكتروني مسجل بعد. سيتم فتح نافذة تعديل بيانات الموظف الآن لإدخال بريده الشخصي.`);
      handleOpenEditEmployee(code);
      return;
    }

    const subject = encodeURIComponent(`بيانات دخولك إلى لوحة تحكم متجر ROSÉE (${user.name})`);
    const body = encodeURIComponent(
      `مرحباً ${user.name}،\n\nإليك بيانات حسابك في متجر ROSÉE:\n• اسم الموظف: ${user.name}\n• كود الدخول (PIN): ${code}\n• كلمة المرور: ${user.password || 'بدون كلمة سر'}\n\nنتمنى لك عملاً موفقاً!`
    );

    // Open user's default email client safely
    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');

    onLogAction(`إرسال بيانات الدخول وكلمة المرور للموظف: ${user.name} على بريده (${targetEmail})`);
    setEmailNoticeUser(`✅ تم إرسال اسم المستخدم (${code}) وكلمة المرور (${user.password || 'بدون باسورد'}) إلى البريد الشخصي: ${targetEmail} بنجاح!`);
    setTimeout(() => setEmailNoticeUser(null), 8000);
  };

  const handleOpenEditEmployee = (code: string) => {
    const user = usersState[code];
    if (!user) return;
    setEditingEmployee({
      originalCode: code,
      code,
      name: user.name,
      role: user.role,
      password: user.password || '',
      email: user.email || '',
      permissions: user.permissions || []
    });
  };

  const handleSaveEmployeeModal = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!editingEmployee) return;
    const cleanName = editingEmployee.name.trim();
    const cleanCode = editingEmployee.code.trim().toUpperCase();
    if (!cleanName || !cleanCode) {
      alert('يرجى إدخال اسم الموظف وكود الدخول (PIN).');
      return;
    }

    if (cleanCode !== editingEmployee.originalCode && usersState[cleanCode]) {
      alert(`كود الدخول / PIN "${cleanCode}" مسجل بالفعل لموظف آخر!`);
      return;
    }

    const updatedUsers = { ...usersState };
    if (cleanCode !== editingEmployee.originalCode) {
      delete updatedUsers[editingEmployee.originalCode];
    }

    updatedUsers[cleanCode] = {
      name: cleanName,
      role: editingEmployee.role,
      password: editingEmployee.password?.trim() || '',
      email: editingEmployee.email?.trim() || '',
      permissions: editingEmployee.permissions || []
    };

    // Immediately close modal and update state
    setUsersState(updatedUsers);
    setEditingEmployee(null);

    try {
      await onSaveUsers(updatedUsers);
      onLogAction(`تعديل بيانات وحساب الموظف: ${cleanName} (PIN: ${cleanCode})`);
    } catch (err) {
      console.error("Save users error:", err);
    }
  };

  const handleSaveStoreSettings = async () => {
    const updated: AppSettings = {
      loyaltyPointValue: parseFloat(loyaltyPointDiscountValue.toString()) || 1,
      loyaltyEgpPerPoint: parseFloat(loyaltyEgpPerPoint.toString()) || 20,
      loyaltyPointDiscountValue: parseFloat(loyaltyPointDiscountValue.toString()) || 1,
      instapayAccount: instaAccount.trim(),
      instapayLink: instaLink.trim(),
      marqueeText: marqueeInput.trim(),
      trustBadges: trustBadgesState.length > 0 ? trustBadgesState : [
        { icon: 'leaf', text: tb1.trim() },
        { icon: 'truck', text: tb2.trim() },
        { icon: 'shield', text: tb3.trim() },
        { icon: 'lock', text: tb4.trim() }
      ],
      featuredCards: featuredCardsState,
      socialLinks: {
        insta: socialInsta.trim(),
        fb: socialFb.trim(),
        whatsapp: socialWa.trim(),
        tiktok: socialTiktok.trim()
      },
      socialDockSettings: {
        size: socialDockSize,
        theme: socialDockTheme,
        position: socialDockPosition,
        motionEffect: socialDockMotion,
        showOnMobile: true
      },
      colors: colorsState,
      texts: textsState,
      animations: animationsState,
      icons: iconsState,
      sectionsLayout: sectionsState,
      subElementsVisibility: subElementsState,
      productGroupsOrder: productGroupsOrderState,
      catalogItemsOrder: catalogItemsOrderState,
      clientUiScale,
      clientCardSize,
      clientFontScale,
      quizConfig: quizState,
      giftingConfig: giftingState,
      spinWheelConfig: spinWheelState,
      treasureHuntConfig: treasureHuntState
    };
    await onSaveSettings(updated);
    if (onSaveCollections && collectionsState.length > 0) {
      try {
        await onSaveCollections(collectionsState);
      } catch (err) {
        console.error("Save collections error:", err);
      }
    }
    onLogAction('تحديث وحفظ لوحة الألوان والنصوص والسكاشن والعناصر والولاء وأيقونات المتجر');
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  // Section Ordering and Visibility Handlers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sectionsState.length) return;
    const updated = [...sectionsState];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setSectionsState(updated);
  };

  const toggleSection = (id: StoreSectionId) => {
    setSectionsState(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const resetSectionsToDefault = () => {
    if (confirm('هل أنت متأكد من إعادة ترتيب السكاشن إلى الوضع الافتراضي الأصلي؟')) {
      setSectionsState([...DEFAULT_STORE_SECTIONS]);
    }
  };

  // Sub-Element Toggle Handler
  const toggleSubElement = (key: string) => {
    setSubElementsState(prev => ({
      ...prev,
      [key]: prev[key] === false ? true : false
    }));
  };

  // Featured Hero Card Handlers
  const moveHeroCard = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= featuredCardsState.length) return;
    const updated = [...featuredCardsState];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setFeaturedCardsState(updated);
  };

  const toggleHeroCard = (id: string) => {
    setFeaturedCardsState(prev => prev.map(c => c.id === id ? { ...c, enabled: c.enabled === false ? true : false } : c));
  };

  // Product Groups Ordering Handlers
  const allCurrentGroups = React.useMemo(() => {
    const groups = Array.from(new Set(Object.values(catalog).map(i => i.collectionName || 'تشكيلة العناية والتجميل')));
    if (productGroupsOrderState.length === 0) return groups;
    const orderMap = new Map(productGroupsOrderState.map((g, idx) => [g, idx]));
    return [...groups].sort((a, b) => (orderMap.get(a) ?? 999) - (orderMap.get(b) ?? 999));
  }, [catalog, productGroupsOrderState]);

  const moveProductGroup = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= allCurrentGroups.length) return;
    const updated = [...allCurrentGroups];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setProductGroupsOrderState(updated);
  };

  // Catalog Individual Products Ordering Handlers
  const allCurrentProductKeys = React.useMemo(() => {
    const keys = Object.keys(catalog);
    if (catalogItemsOrderState.length === 0) return keys;
    const orderMap = new Map(catalogItemsOrderState.map((k, idx) => [k, idx]));
    return [...keys].sort((a, b) => (orderMap.get(a) ?? 9999) - (orderMap.get(b) ?? 9999));
  }, [catalog, catalogItemsOrderState]);

  const moveCatalogItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= allCurrentProductKeys.length) return;
    const updated = [...allCurrentProductKeys];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setCatalogItemsOrderState(updated);
  };

  // Collections Ordering & Toggle Handlers
  const moveCollection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= collectionsState.length) return;
    const updated = [...collectionsState];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setCollectionsState(updated);
  };

  const toggleCollection = (id: string) => {
    setCollectionsState(prev => prev.map(c => c.id === id ? { ...c, enabled: c.enabled === false ? true : false } : c));
  };

  // Trust Badges Ordering & Toggle Handlers
  const moveTrustBadge = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= trustBadgesState.length) return;
    const updated = [...trustBadgesState];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setTrustBadgesState(updated);
  };

  const toggleTrustBadge = (index: number) => {
    setTrustBadgesState(prev => prev.map((b, i) => i === index ? { ...b, enabled: b.enabled === false ? true : false } : b));
  };

  const handleSaveAndPreview = async () => {
    try {
      await handleSaveStoreSettings();
    } catch (e) {
      console.error("Save settings error:", e);
    }
    if (onSwitchToStore) {
      onSwitchToStore();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddNewCatalogItem = async () => {
    if (!newGroup.trim() || !newName.trim()) {
      alert('يرجى إدخال اسم المجموعة واسم المنتج.');
      return;
    }

    const key = `${newGroup.trim()}: ${newName.trim()} (${newCategory})`;
    const price = parseFloat(newPrice) || 0;
    const cost = parseFloat(newCost) || 0;
    const stock = parseInt(newStock) || 0;
    const alertLimit = parseInt(newAlertLimit) || 3;

    const updatedCatalog: ProductCatalog = {
      ...catalogItems,
      [key]: {
        defaultPrice: price,
        cost,
        stockQty: stock,
        alertLimit,
        showStock: newShowStock,
        isBestseller: newIsBestseller,
        isOutOfStock: false,
        description: newDesc.trim(),
        image: fixImageLink(newImage.trim()) || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80'
      }
    };

    setCatalogItems(updatedCatalog);
    await onSaveCatalog(updatedCatalog);
    onLogAction(`إضافة ونشر منتج جديد بالكتالوج: ${key}`);

    setNewName('');
    setNewPrice('');
    setNewCost('');
    setNewDesc('');
    setNewImage('');
    alert('✅ تم حفظ وإضافة المنتج ونشره في المتجر الإلكتروني مباشرة!');
  };

  const handleSaveAllCatalog = async () => {
    await onSaveCatalog(catalogItems);
    onLogAction('تحديث وحفظ بيانات الكتالوج والمخزون');
    alert('✅ تم نشر وتحديث الكتالوج في المتجر الإلكتروني بنجاح!');
  };

  const handleSaveSingleItem = async (key: string) => {
    setSavingKey(key);
    try {
      await onSaveCatalog(catalogItems);
      onLogAction(`حفظ فوري لتعديلات المنتج: ${key}`);
      alert(`✅ تم حفظ ونشر تعديلات "${key}" في المتجر بنجاح!`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeleteCatalogItem = async (key: string) => {
    const updated = { ...catalogItems };
    delete updated[key];
    setCatalogItems(updated);
    await onSaveCatalog(updated);
    onLogAction(`حذف المنتج من الكتالوج: ${key}`);
    setProductSaveToast(`✅ تم حذف المنتج "${key}" من المتجر بنجاح.`);
    setTimeout(() => setProductSaveToast(null), 3500);
  };

  // Open Edit Product Details Modal
  const handleOpenEditModal = (key: string, item: CatalogItem) => {
    let group = 'المجموعة الأساسية';
    let name = key;
    let category: 'FOR WOMEN' | 'FOR MEN' | 'UNISEX' = 'FOR WOMEN';

    const match = key.match(/^(.*?):\s*(.*?)\s*\((.*?)\)$/);
    if (match) {
      group = match[1].trim();
      name = match[2].trim();
      const catUpper = match[3].trim().toUpperCase();
      if (catUpper.includes('MEN') && !catUpper.includes('WO')) {
        category = 'FOR MEN';
      } else if (catUpper.includes('UNISEX')) {
        category = 'UNISEX';
      } else {
        category = 'FOR WOMEN';
      }
    }

    setEditingProduct({
      originalKey: key,
      group,
      name,
      category,
      defaultPrice: item.defaultPrice || 0,
      cost: item.cost || 0,
      stockQty: item.stockQty !== undefined ? item.stockQty : 10,
      alertLimit: item.alertLimit !== undefined ? item.alertLimit : 3,
      showStock: item.showStock !== undefined ? Boolean(item.showStock) : true,
      isBestseller: Boolean(item.isBestseller),
      isOutOfStock: Boolean(item.isOutOfStock),
      description: item.description || '',
      image: item.image || '',
      images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []),
      hasSizes: Boolean(item.hasSizes),
      sizes: Array.isArray(item.sizes) ? item.sizes : [],
      collectionImage: item.collectionImage || '',
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate || ''
    });
  };

  // Submit and save Edit Product Modal
  const handleSaveProductModal = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!editingProduct) return;

    const cleanGroup = (editingProduct.group || '').trim() || 'المجموعة الأساسية';
    const cleanName = (editingProduct.name || '').trim();

    if (!cleanName) {
      alert('يرجى كتابة اسم المنتج أو العطر.');
      return;
    }

    const newKey = `${cleanGroup}: ${cleanName} (${editingProduct.category || 'FOR WOMEN'})`;
    const cleanImages = (editingProduct.images || [])
      .map(img => fixImageLink(img))
      .filter(img => Boolean(img?.trim()));

    const mainImg = fixImageLink(editingProduct.image) || cleanImages[0] || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80';
    if (!cleanImages.includes(mainImg)) {
      cleanImages.unshift(mainImg);
    }

    const cleanSizes = (editingProduct.sizes || [])
      .filter(s => Boolean(s.name?.trim()))
      .map(s => ({
        name: s.name.trim(),
        price: Number(s.price) || 0,
        originalPrice: s.originalPrice ? Number(s.originalPrice) : undefined
      }));

    const updatedData: CatalogItem = {
      defaultPrice: Number(editingProduct.defaultPrice) || 0,
      cost: Number(editingProduct.cost) || 0,
      stockQty: Number(editingProduct.stockQty) || 0,
      alertLimit: Number(editingProduct.alertLimit) || 3,
      showStock: Boolean(editingProduct.showStock),
      isBestseller: Boolean(editingProduct.isBestseller),
      isOutOfStock: Boolean(editingProduct.isOutOfStock),
      description: (editingProduct.description || '').trim(),
      image: mainImg,
      images: cleanImages,
      hasSizes: Boolean(editingProduct.hasSizes && cleanSizes.length > 0),
      sizes: cleanSizes,
      collectionName: cleanGroup,
      collectionImage: editingProduct.collectionImage ? fixImageLink(editingProduct.collectionImage) : undefined,
      batchNumber: (editingProduct.batchNumber || '').trim() || undefined,
      expiryDate: (editingProduct.expiryDate || '').trim() || undefined
    };

    const newCatalog: ProductCatalog = {};

    // Preserve order or update key
    Object.keys(catalogItems).forEach((k) => {
      if (k === editingProduct.originalKey) {
        newCatalog[newKey] = updatedData;
      } else {
        newCatalog[k] = catalogItems[k];
      }
    });

    // If key didn't exist in loop (rare), add it
    if (!newCatalog[newKey]) {
      newCatalog[newKey] = updatedData;
    }

    // 1. Immediately close modal and update local catalog state!
    setCatalogItems(newCatalog);
    setEditingProduct(null);
    setProductSaveToast(`✅ تم حفظ وتحديث "${cleanName}" ونشرها للمتجر الإلكتروني بنجاح!`);
    setTimeout(() => setProductSaveToast(null), 3500);

    // 2. Persist in background without blocking modal close
    try {
      await onSaveCatalog(newCatalog);
      onLogAction(`تعديل تفاصيل المنتج: ${newKey}`);
    } catch (err) {
      console.error("Save catalog error:", err);
    }
  };

  const handleAddStaff = () => {
    const code = newStaffCode.trim().toUpperCase();
    const name = newStaffName.trim();
    if (!code || !name) {
      alert('يرجى إدخال اسم الموظف وكود الدخول (PIN).');
      return;
    }
    if (usersState[code]) {
      alert('هذا الكود مستخدم بالفعل لموظف آخر!');
      return;
    }

    setUsersState({
      ...usersState,
      [code]: {
        name,
        role: 'user',
        password: newStaffPass.trim(),
        email: newStaffEmail.trim(),
        permissions: ['edit_order', 'add_item']
      }
    });

    setNewStaffName('');
    setNewStaffCode('');
    setNewStaffPass('');
    setNewStaffEmail('');
  };

  const getNormalizedPerms = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return Object.values(raw);
    return [];
  };

  const handleToggleStaffPerm = async (code: string, permId: string) => {
    const user = usersState[code];
    if (!user || user.role === 'admin') return;

    const currentPerms = new Set(getNormalizedPerms(user.permissions));
    if (currentPerms.has(permId)) currentPerms.delete(permId);
    else currentPerms.add(permId);

    const updatedPermissions = Array.from(currentPerms);
    const updatedUsers = {
      ...usersState,
      [code]: {
        ...user,
        permissions: updatedPermissions
      }
    };

    setUsersState(updatedUsers);

    try {
      await onSaveUsers(updatedUsers);
      onLogAction(`تحديث صلاحية (${permId}) للموظف: ${user.name}`);
    } catch (err) {
      console.error("Auto save permissions error:", err);
    }
  };

  const handleSaveUsers = async () => {
    await onSaveUsers(usersState);
    onLogAction('تحديث صلاحيات وأكواد الموظفين');
    alert('✅ تم حفظ بيانات الموظفين والصلاحيات بنجاح!');
  };

  // Filter catalog items for display
  const filteredCatalogEntries = Object.entries(catalogItems).filter(([key, item]) => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return (
      key.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-arabic text-gray-800">
      
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-[#111111] text-[#C5A059] shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>الكتالوج والمخزون والأسعار</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'store'
              ? 'bg-[#111111] text-[#C5A059] shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>تخصيص واجهة المتجر والحسابات</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-[#111111] text-[#C5A059] shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>إدارة الموظفين والصلاحيات (PIN)</span>
        </button>
      </div>

      {/* 1. Catalog Tab */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          
          {/* Quick Guide on Controlling Sizes and Multiple Images */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-xs">
            <span className="p-2 bg-[#C5A059] text-[#111111] rounded-xl text-base shrink-0 font-bold">
              🏷️
            </span>
            <div className="space-y-1 text-right flex-1">
              <h4 className="text-sm font-bold text-gray-900">
                أهلاً بك في قسم التحكم بالمنتجات والأحجام (Sizes) والأسعار والصور:
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                لكل منتج في القائمة أدناه، اضغط على زر «<strong className="text-amber-900 font-bold">تعديل المنتج والأحجام والأسعار</strong>». ومن داخل نافذة التعديل ستجد خيار «<strong className="text-emerald-800 font-bold">تفعيل خيارات الأحجام / السعات بأسعار مختلفة</strong>»؛ يمكنك إضافة أو حذف أي حجم (مثل: 50 مل، 100 مل) وتحديد السعر المخصص له وسعر الشطب إن وجد، بالإضافة لإمكانية رفع أكثر من صورة للمنتج الواحد ليقلبها العميل في المتجر.
              </p>
            </div>
          </div>
          
          {/* Low Stock Banner */}
          {lowStockItems.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 space-y-1">
                <strong className="font-bold">⚠️ تنبيه انخفاض المخزون (تحذير اقتراب النفاد):</strong>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {lowStockItems.map(([key, item]) => (
                    <li key={key}>
                      {key} (الكمية المتبقية: <span className="font-bold font-mono">{item.stockQty || 0}</span> قطعة)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Add New Item Form */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#C5A059]" />
              إضافة منتج جديد للكتالوج
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم المجموعة *</label>
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  placeholder="مثال: BODY SPLASH أو المجموعة الأساسية"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم العطر / المنتج *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: Bright Crystal"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">التصنيف *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white font-bold focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="FOR WOMEN">FOR WOMEN (نسائي)</option>
                  <option value="FOR MEN">FOR MEN (رجالي)</option>
                  <option value="UNISEX">UNISEX (للجنسين)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">سعر البيع للعميل (ج.م) *</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="مثال: 200"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl text-center font-bold text-emerald-700 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">تكلفة الصنع (ج.م) *</label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  placeholder="مثال: 90"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl text-center font-bold text-red-600 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">الكمية بالمخزن</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl text-center font-bold focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">حد تنبيه الانخفاض</label>
                <input
                  type="number"
                  value={newAlertLimit}
                  onChange={(e) => setNewAlertLimit(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl text-center font-bold focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">وصف العطر والمكونات (يظهر للعميل بالمتجر):</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="مثال: نفحات زهرية منعشة من الرمان واللوتس والمسك الناعم..."
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <ImageUploadInput
                  label="صورة المنتج (رفع من الهاتف/الكمبيوتر أو كتابة رابط):"
                  value={newImage}
                  onChange={(val) => setNewImage(val)}
                  placeholder="https://... أو اضغط لرفع صورة من جهازك"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newShowStock}
                    onChange={(e) => setNewShowStock(e.target.checked)}
                  />
                  <span>إظهار المخزون للعميل</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[#8C6D2D]">
                  <input
                    type="checkbox"
                    checked={newIsBestseller}
                    onChange={(e) => setNewIsBestseller(e.target.checked)}
                  />
                  <span>★ تمييز كـ Bestseller (الأكثر طلباً)</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleAddNewCatalogItem}
                className="px-6 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                ➕ إضافة وحفظ المنتج بالمتجر
              </button>
            </div>
          </div>

          {/* Catalog Items Management Header & Search */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  المنتجات المسجلة في الكتالوج ({Object.keys(catalogItems).length})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  يمكنك تعديل أي تفاصيل (الوصف، الصورة، الاسم، الأسعار) وستنعكس فوراً في المتجر الإلكتروني.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="بحث في المنتجات..."
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <button
                  onClick={handleSaveAllCatalog}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 نشر وحفظ كافة التعديلات</span>
                </button>
              </div>
            </div>

            {/* List of Products */}
            <div className="space-y-4">
              {filteredCatalogEntries.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  لا توجد منتجات مطابقة للبحث.
                </div>
              ) : (
                filteredCatalogEntries.map(([key, item]) => (
                  <div 
                    key={key} 
                    className="p-4 sm:p-5 border border-gray-200 rounded-2xl bg-white hover:border-[#C5A059]/40 shadow-xs space-y-3 transition-all"
                  >
                    {/* Top Row: Thumbnail, Title, Description, Edit Button, Delete Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <div className="relative group shrink-0">
                          <img
                            src={item.image || 'https://via.placeholder.com/80'}
                            alt={key}
                            className="w-14 h-14 object-cover rounded-xl border border-gray-200"
                          />
                          {item.image && (
                            <a
                              href={item.image}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/50 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="معاينة الصورة"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900">{key}</h4>
                            {item.isBestseller && (
                              <span className="px-2 py-0.5 bg-amber-50 text-[#8C6D2D] border border-amber-200 rounded-full text-[10px] font-bold">
                                ★ Bestseller
                              </span>
                            )}
                            {item.isOutOfStock && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                                نفدت الكمية
                              </span>
                            )}
                          </div>

                          {/* Editable Description Preview */}
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                            {item.description ? (
                              item.description
                            ) : (
                              <span className="text-amber-600 italic">⚠️ بدون وصف (اضغط على "تعديل المنتج والأحجام" لإضافة الوصف ومكوناته)</span>
                            )}
                          </p>

                          {/* Active Sizes Badges */}
                          {item.hasSizes && item.sizes && item.sizes.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                🎯 الأحجام المتاحة ({item.sizes.length}):
                              </span>
                              {item.sizes.map((s, idx) => (
                                <span key={idx} className="text-[10px] font-mono bg-gray-50 text-gray-800 px-2 py-0.5 rounded border border-gray-200 font-bold">
                                  {s.name}: <strong className="text-emerald-700">{s.price} ج.م</strong>
                                  {s.originalPrice && (
                                    <span className="text-gray-400 line-through mr-1 text-[9px]">{s.originalPrice}</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}

                          {(item.batchNumber || item.expiryDate) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {item.batchNumber && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  تشغيلة: {item.batchNumber}
                                </span>
                              )}
                              {item.expiryDate && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-100 text-gray-800 border border-gray-200">
                                  انتهاء: {item.expiryDate}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Full Edit Modal + Quick Save + Delete */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenEditModal(key, item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white hover:text-[#111111] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border border-transparent hover:border-[#C5A059]"
                          title="تعديل تفاصيل وأحجام وأسعار وصور المنتج"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>تعديل المنتج والأحجام والأسعار</span>
                        </button>

                        <button
                          onClick={() => handleSaveSingleItem(key)}
                          disabled={savingKey === key}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                          title="حفظ فوري لهذا المنتج"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{savingKey === key ? 'جاري...' : 'حفظ'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCatalogItem(key)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Inline Numbers & Stock Strip */}
                    <div className="pt-2 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 block mb-0.5">سعر البيع (ج.م):</span>
                        <input
                          type="number"
                          value={item.defaultPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCatalogItems({
                              ...catalogItems,
                              [key]: { ...item, defaultPrice: val }
                            });
                          }}
                          className="w-full p-1.5 border border-gray-200 rounded-lg bg-white text-center font-bold text-gray-900"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 block mb-0.5">التكلفة (ج.م):</span>
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCatalogItems({
                              ...catalogItems,
                              [key]: { ...item, cost: val }
                            });
                          }}
                          className="w-full p-1.5 border border-gray-200 rounded-lg bg-white text-center font-bold text-red-600"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 block mb-0.5">الكمية بالمخزن:</span>
                        <input
                          type="number"
                          value={item.stockQty !== undefined ? item.stockQty : 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCatalogItems({
                              ...catalogItems,
                              [key]: { ...item, stockQty: val }
                            });
                          }}
                          className="w-full p-1.5 border border-gray-200 rounded-lg bg-white text-center font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 block mb-0.5">حد التنبيه:</span>
                        <input
                          type="number"
                          value={item.alertLimit !== undefined ? item.alertLimit : 3}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 3;
                            setCatalogItems({
                              ...catalogItems,
                              [key]: { ...item, alertLimit: val }
                            });
                          }}
                          className="w-full p-1.5 border border-gray-200 rounded-lg bg-white text-center font-bold"
                        />
                      </div>

                      <div className="flex flex-col justify-center gap-1 text-[11px] font-semibold">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[#8C6D2D]">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isBestseller)}
                            onChange={(e) => {
                              setCatalogItems({
                                ...catalogItems,
                                [key]: { ...item, isBestseller: e.target.checked }
                              });
                            }}
                          />
                          <span>Bestseller</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-red-600">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isOutOfStock)}
                            onChange={(e) => {
                              setCatalogItems({
                                ...catalogItems,
                                [key]: { ...item, isOutOfStock: e.target.checked }
                              });
                            }}
                          />
                          <span>إيقاف (Out of stock)</span>
                        </label>
                      </div>

                      <div className="flex flex-col justify-center gap-1 text-[11px] font-semibold">
                        <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                          <input
                            type="checkbox"
                            checked={item.showStock !== undefined ? Boolean(item.showStock) : true}
                            onChange={(e) => {
                              setCatalogItems({
                                ...catalogItems,
                                [key]: { ...item, showStock: e.target.checked }
                              });
                            }}
                          />
                          <span>إظهار المخزون للعميل</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveAllCatalog}
                className="flex items-center gap-1.5 px-6 py-3 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>💾 نشر وحفظ كافة التعديلات في المتجر الإلكتروني</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 2. Store Customization Studio Tab (Colors, Texts & Details) */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          
          {/* Executive Header with Action Zone */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-[#C5A059]/15 text-[#C5A059] rounded-xl">
                  <Palette className="w-5 h-5" />
                </span>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  استوديو تخصيص واجهة المتجر (الألوان والنصوص وسلوجانات كل جزء)
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                تحكم كامل في كل سطر وكل كلمة وباليت الألوان (Color Palette) لكل جزء وصفحة في المتجر مع نشر فوري.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              {onSwitchToStore && (
                <button
                  type="button"
                  onClick={handleSaveAndPreview}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  title="حفظ التعديلات ومشاهدة المتجر مباشرة"
                >
                  <Eye className="w-4 h-4 text-[#C5A059]" />
                  <span>معاينة المتجر المباشرة</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveStoreSettings}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>💾 نشر وحفظ كافة التعديلات في المتجر</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation: Sections vs Colors vs Texts vs Accounts */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setStoreSubTab('sections')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                storeSubTab === 'sections'
                  ? 'bg-[#111111] text-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <Layers className="w-4 h-4 text-[#C5A059]" />
              <span>هندسة وترتيب السكاشن والعناصر (Sections & Elements)</span>
            </button>

            <button
              type="button"
              onClick={() => setStoreSubTab('colors')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                storeSubTab === 'colors'
                  ? 'bg-[#111111] text-[#C5A059] shadow-xs'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>لوحة الألوان والسمات (Color Palette & Presets)</span>
            </button>

            <button
              type="button"
              onClick={() => setStoreSubTab('texts')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                storeSubTab === 'texts'
                  ? 'bg-[#111111] text-[#C5A059] shadow-xs'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>التحكم في كل سطر وتفصيلة (Line-by-Line Texts)</span>
            </button>

            <button
              type="button"
              onClick={() => setStoreSubTab('animations')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                storeSubTab === 'animations'
                  ? 'bg-[#111111] text-[#C5A059] shadow-xs'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>الحركات والمؤثرات وFly-to-Cart (Animations & Motion)</span>
            </button>

            <button
              type="button"
              onClick={() => setStoreSubTab('icons')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                storeSubTab === 'icons'
                  ? 'bg-[#111111] text-[#C5A059] shadow-xs'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
              <span>الأيقونات والمظهر (Icons & Shapes)</span>
            </button>

            <button
              type="button"
              onClick={() => setStoreSubTab('general')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                storeSubTab === 'general'
                  ? 'bg-[#111111] text-[#C5A059] shadow-xs'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>الحسابات والمزايا وروابط السوشيال</span>
            </button>

            <button
              type="button"
              onClick={() => setStoreSubTab('marketing')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                storeSubTab === 'marketing'
                  ? 'bg-[#111111] text-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>المميزات التسويقية والألعاب التفاعلية (Marketing & Gamification)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">جديد</span>
            </button>
          </div>

          {/* SUB-TAB 0: SECTIONS & ELEMENTS LAYOUT ARCHITECTURE */}
          {storeSubTab === 'sections' && (
            <div className="space-y-6">
              
              {/* Header Card & Global Quick Controls */}
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#C5A059]" />
                      <h4 className="text-sm font-bold text-gray-900">
                        هندسة وترتيب سكاشن وعناصر المتجر (Sections & Elements Architecture)
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
                      تحكم كامل في موقعك: إعادة ترتيب السكاشن (تقديم وتأخير)، إظهار أو إخفاء أي سكشن بنقرة واحدة، بالإضافة لإمكانية التحكم في ظهور وترتيب العناصر الداخلية لكل سكشن (الكروت، المنتجات، المجموعات، الشارات).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={resetSectionsToDefault}
                      className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-gray-200"
                      title="استعادة الترتيب الأصلي لسكاشن الموقع"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>الترتيب الافتراضي</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndPreview}
                      className="px-4 py-2 bg-[#111111] hover:bg-black text-[#C5A059] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="حفظ الترتيب ومعاينة المتجر فوراً"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>حفظ ومعاينة المتجر 👁️</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveStoreSettings}
                      className="px-4 py-2 bg-[#C5A059] hover:bg-[#b08d47] text-[#111111] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ التعديلات 💾</span>
                    </button>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#FAF9F6] border border-[#C5A059]/20 rounded-xl flex items-center gap-2.5">
                    <ArrowUp className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span className="text-gray-700">اضغط <strong>تقديم (⬆️)</strong> أو <strong>تأخير (⬇️)</strong> لتغيير مكان أي سكشن</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-gray-700">اضغط <strong>إظهار / إخفاء</strong> لإخفاء سكشن كامل فوراً من المتجر</span>
                  </div>
                  <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-gray-700">افتح <strong>عناصر السكشن</strong> للتحكم في تقديم وتأخير العناصر داخله</span>
                  </div>
                </div>
              </div>

              {/* Sections Reordering & Toggle List */}
              <div className="space-y-3">
                {sectionsState.map((sec, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === sectionsState.length - 1;
                  const isExpanded = expandedSectionId === sec.id;
                  const isEnabled = sec.enabled !== false;

                  return (
                    <div 
                      key={sec.id}
                      className={`border rounded-2xl transition-all duration-200 bg-white ${
                        !isEnabled 
                          ? 'border-gray-200 opacity-60 bg-gray-50/50' 
                          : isExpanded
                            ? 'border-[#C5A059] ring-2 ring-[#C5A059]/15 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Section Main Header Row */}
                      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Section Order & Identity */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Order Reorder Arrow Buttons */}
                          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSection(idx, 'up')}
                              disabled={isFirst}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isFirst 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-700 hover:bg-white hover:text-[#C5A059] cursor-pointer shadow-xs'
                              }`}
                              title={isFirst ? 'السكشن بالأعلى بالفعل' : 'تقديم السكشن للأعلى (Move Up)'}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => moveSection(idx, 'down')}
                              disabled={isLast}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isLast 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-700 hover:bg-white hover:text-[#C5A059] cursor-pointer shadow-xs'
                              }`}
                              title={isLast ? 'السكشن بالأسفل بالفعل' : 'تأخير السكشن للأسفل (Move Down)'}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Section Order Badge */}
                          <span className="w-7 h-7 rounded-xl bg-[#111111] text-[#C5A059] font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            #{idx + 1}
                          </span>

                          {/* Section Label & Description */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-gray-900">
                                {sec.label}
                              </h5>
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                {sec.id}
                              </span>
                              {isEnabled ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                                  ظاهر في المتجر
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[10px] font-bold">
                                  مخفي من المتجر
                                </span>
                              )}
                            </div>
                            {sec.description && (
                              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                {sec.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions: Visibility Toggle & Sub-Elements Accordion */}
                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          {/* Toggle Section Full Visibility */}
                          <button
                            type="button"
                            onClick={() => toggleSection(sec.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isEnabled
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                            }`}
                            title={isEnabled ? 'إخفاء السكشن بالكامل من المتجر' : 'إظهار السكشن في المتجر'}
                          >
                            {isEnabled ? (
                              <>
                                <Eye className="w-4 h-4 text-emerald-600" />
                                <span>ظاهر (مفعّل)</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4 text-gray-500" />
                                <span>مخفي (معطل)</span>
                              </>
                            )}
                          </button>

                          {/* Expand/Collapse Inside Elements */}
                          <button
                            type="button"
                            onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isExpanded
                                ? 'bg-[#111111] text-[#C5A059] border-black shadow-xs'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>عناصر السكشن</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Sub-Elements Customization Drawer (Inside-Section Elements & Ordering) */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 sm:p-6 bg-[#FAF9F6] rounded-b-2xl space-y-5 animate-fade-in">
                          
                          {/* Section-Specific Element Controls */}

                          {/* 1. HERO SECTION SUB-ELEMENTS & SLIDER CARDS */}
                          {sec.id === 'hero' && (
                            <div className="space-y-5">
                              <div>
                                <h6 className="text-xs font-bold text-gray-800 mb-1">
                                  إظهار وإخفاء عناصر البانر الترحيبي (Hero Elements):
                                </h6>
                                <p className="text-[11px] text-gray-500 mb-3">
                                  اختر ما ترغب بإظهاره أو إخفائه بدقة داخل بانر الصفحة الرئيسية:
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                  {[
                                    { key: 'heroBadge', label: 'الشارة العلوية للبانر' },
                                    { key: 'heroBrand', label: 'اسم البراند والسلوجان' },
                                    { key: 'heroHeadline', label: 'المانشيت والعنوان الرئيسي' },
                                    { key: 'heroDescription', label: 'النص التسويقي الترويجي' },
                                    { key: 'heroPrimaryBtn', label: 'زر الطلب المباشر' },
                                    { key: 'heroSecondaryBtn', label: 'زر استعراض التشكيلة' },
                                    { key: 'heroSocial', label: 'شريط روابط السوشيال' },
                                    { key: 'heroCard', label: 'كارت المنتج التفاعلي' }
                                  ].map(item => {
                                    const isSubOn = subElementsState[item.key] !== false;
                                    return (
                                      <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => toggleSubElement(item.key)}
                                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                          isSubOn 
                                            ? 'bg-white border-[#C5A059] shadow-xs text-gray-900 font-bold' 
                                            : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
                                        }`}
                                      >
                                        <span>{item.label}</span>
                                        {isSubOn ? (
                                          <Eye className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                                        ) : (
                                          <EyeOff className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Hero Featured Slider Cards Reordering */}
                              <div className="pt-4 border-t border-gray-200/70">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h6 className="text-xs font-bold text-gray-800">
                                      ترتيب كروت منتجات البانر التفاعلية (تقديم وتأخير وإظهار الكروت):
                                    </h6>
                                    <p className="text-[11px] text-gray-500">
                                      قدم أو أخر الكروت في السلايدر التفاعلي لتحديد المنتج الذي يظهر أولاً للزوار:
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {featuredCardsState.map((card, cIdx) => {
                                    const isCardFirst = cIdx === 0;
                                    const isCardLast = cIdx === featuredCardsState.length - 1;
                                    const isCardEnabled = card.enabled !== false;

                                    return (
                                      <div 
                                        key={card.id || cIdx}
                                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 bg-white transition-all ${
                                          isCardEnabled ? 'border-gray-200' : 'border-gray-200 opacity-50 bg-gray-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          {/* Card Move Buttons */}
                                          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => moveHeroCard(cIdx, 'up')}
                                              disabled={isCardFirst}
                                              className={`p-1 rounded transition-colors ${
                                                isCardFirst ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                              }`}
                                              title="تقديم الكارت للأمام"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveHeroCard(cIdx, 'down')}
                                              disabled={isCardLast}
                                              className={`p-1 rounded transition-colors ${
                                                isCardLast ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                              }`}
                                              title="تأخير الكارت للخلف"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          <span className="font-mono text-xs font-bold text-gray-400">
                                            #{cIdx + 1}
                                          </span>

                                          {/* Card Image */}
                                          {card.image && (
                                            <img 
                                              src={fixImageLink(card.image)} 
                                              alt={card.cardTitle} 
                                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" 
                                            />
                                          )}

                                          <div className="min-w-0">
                                            <span className="text-xs font-bold text-gray-900 block truncate">
                                              {card.cardTitle}
                                            </span>
                                            <span className="text-[11px] text-[#C5A059] font-mono block">
                                              {card.cardTag || card.badge || 'كارت ترويجي'}
                                            </span>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => toggleHeroCard(card.id)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                            isCardEnabled 
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                              : 'bg-gray-100 text-gray-500'
                                          }`}
                                        >
                                          {isCardEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                          <span>{isCardEnabled ? 'مفعّل' : 'معطّل'}</span>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. CATALOG SUB-ELEMENTS & PRODUCT GROUPS & ITEMS ORDERING */}
                          {sec.id === 'catalog' && (
                            <div className="space-y-5">
                              <div>
                                <h6 className="text-xs font-bold text-gray-800 mb-1">
                                  إظهار وإخفاء أدوات وعناصر الكتالوج:
                                </h6>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                  {[
                                    { key: 'catalogFilters', label: 'أزرار فلاتر وتصنيفات الأقسام' },
                                    { key: 'catalogSearch', label: 'شريط ومربع البحث السريع' },
                                    { key: 'catalogStockCount', label: 'مؤشر وعداد المخزون المتبقي' },
                                    { key: 'catalogAddToCart', label: 'أزرار الإضافة السريعة للسلة' }
                                  ].map(item => {
                                    const isSubOn = subElementsState[item.key] !== false;
                                    return (
                                      <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => toggleSubElement(item.key)}
                                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                          isSubOn 
                                            ? 'bg-white border-[#C5A059] shadow-xs text-gray-900 font-bold' 
                                            : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
                                        }`}
                                      >
                                        <span>{item.label}</span>
                                        {isSubOn ? (
                                          <Eye className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                                        ) : (
                                          <EyeOff className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Product Groups Reordering (تقديم وتأخير المجموعات) */}
                              <div className="pt-4 border-t border-gray-200/70">
                                <h6 className="text-xs font-bold text-gray-800 mb-1">
                                  تقديم وتأخير مجموعات المتجر (ترتيب ظهور المجموعات في الكتالوج):
                                </h6>
                                <p className="text-[11px] text-gray-500 mb-3">
                                  اضغط على زر التقديم (⬆️) أو التأخير (⬇️) لتقديم مجموعة على أخرى في الصفحة الرئيسية:
                                </p>

                                <div className="space-y-2">
                                  {allCurrentGroups.map((groupName, gIdx) => {
                                    const isGroupFirst = gIdx === 0;
                                    const isGroupLast = gIdx === allCurrentGroups.length - 1;
                                    const itemsInGroup = Object.values(catalog).filter(p => (p.collectionName || 'تشكيلة العناية والتجميل') === groupName);

                                    return (
                                      <div 
                                        key={groupName}
                                        className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 shadow-2xs"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => moveProductGroup(gIdx, 'up')}
                                              disabled={isGroupFirst}
                                              className={`p-1 rounded transition-colors ${
                                                isGroupFirst ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                              }`}
                                              title="تقديم المجموعة للأعلى"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveProductGroup(gIdx, 'down')}
                                              disabled={isGroupLast}
                                              className={`p-1 rounded transition-colors ${
                                                isGroupLast ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                              }`}
                                              title="تأخير المجموعة للأسفل"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          <span className="font-mono text-xs font-bold text-gray-400">
                                            #{gIdx + 1}
                                          </span>

                                          <div className="min-w-0">
                                            <h6 className="text-xs font-bold text-gray-900 truncate">
                                              {groupName}
                                            </h6>
                                            <span className="text-[11px] text-gray-500">
                                              {itemsInGroup.length} أصناف مسجلة
                                            </span>
                                          </div>
                                        </div>

                                        <span className="px-2.5 py-1 bg-[#C5A059]/10 text-[#C5A059] text-[10px] font-bold rounded-lg shrink-0">
                                          الترتيب الحالي: #{gIdx + 1}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Individual Products Custom Reordering (تقديم وتأخير المنتجات الفردية) */}
                              <div className="pt-4 border-t border-gray-200/70">
                                <h6 className="text-xs font-bold text-gray-800 mb-1">
                                  تقديم وتأخير المنتجات الفردية (أولوية وترتيب ظهور المنتجات):
                                </h6>
                                <p className="text-[11px] text-gray-500 mb-3">
                                  رتب المنتجات حسب رغبتك لتقديم المنتجات الأكثر أهمية أو العروض الخاصة للأمام:
                                </p>

                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                  {allCurrentProductKeys.map((pKey, pIdx) => {
                                    const pItem = catalog[pKey];
                                    if (!pItem) return null;
                                    const isPFirst = pIdx === 0;
                                    const isPLast = pIdx === allCurrentProductKeys.length - 1;

                                    return (
                                      <div 
                                        key={pKey}
                                        className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => moveCatalogItem(pIdx, 'up')}
                                              disabled={isPFirst}
                                              className={`p-1 rounded transition-colors ${
                                                isPFirst ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                              }`}
                                              title="تقديم المنتج"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveCatalogItem(pIdx, 'down')}
                                              disabled={isPLast}
                                              className={`p-1 rounded transition-colors ${
                                                isPLast ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                              }`}
                                              title="تأخير المنتج"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          <span className="font-mono text-[11px] font-bold text-gray-400">
                                            #{pIdx + 1}
                                          </span>

                                          {pItem.image && (
                                            <img 
                                              src={fixImageLink(pItem.image)} 
                                              alt={pKey} 
                                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0" 
                                            />
                                          )}

                                          <div className="min-w-0">
                                            <span className="font-bold text-gray-900 block truncate">
                                              {pKey}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                              {pItem.defaultPrice} ج.م • {pItem.collectionName || 'مجموعة رئيسية'}
                                            </span>
                                          </div>
                                        </div>

                                        <span className="font-mono text-[11px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded shrink-0">
                                          موضع #{pIdx + 1}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. COLLECTIONS SUB-ELEMENTS & ORDERING */}
                          {sec.id === 'collections' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                                <div>
                                  <h6 className="text-xs font-bold text-gray-800">
                                    شارة قسم التشكيلات:
                                  </h6>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleSubElement('collectionsBadge')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    subElementsState.collectionsBadge !== false
                                      ? 'bg-white border border-[#C5A059] text-gray-900 shadow-xs'
                                      : 'bg-gray-100 text-gray-400 opacity-60'
                                  }`}
                                >
                                  {subElementsState.collectionsBadge !== false ? <Eye className="w-3.5 h-3.5 text-[#C5A059]" /> : <EyeOff className="w-3.5 h-3.5" />}
                                  <span>شارة قسم التشكيلات</span>
                                </button>
                              </div>

                              <div>
                                <h6 className="text-xs font-bold text-gray-800 mb-2">
                                  ترتيب وإظهار مجموعات وتشكيلات المتجر (تقديم وتأخير):
                                </h6>
                                <div className="space-y-2">
                                  {collectionsState.map((col, cIdx) => {
                                    const isColFirst = cIdx === 0;
                                    const isColLast = cIdx === collectionsState.length - 1;
                                    const isColEnabled = col.enabled !== false;

                                    return (
                                      <div 
                                        key={col.id}
                                        className={`p-3 bg-white rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                          isColEnabled ? 'border-gray-200' : 'border-gray-200 opacity-50 bg-gray-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => moveCollection(cIdx, 'up')}
                                              disabled={isColFirst}
                                              className={`p-1 rounded transition-colors ${
                                                isColFirst ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                              }`}
                                              title="تقديم التشكيلة"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveCollection(cIdx, 'down')}
                                              disabled={isColLast}
                                              className={`p-1 rounded transition-colors ${
                                                isColLast ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                              }`}
                                              title="تأخير التشكيلة"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          <span className="font-mono text-xs font-bold text-gray-400">
                                            #{cIdx + 1}
                                          </span>

                                          {col.image && (
                                            <img 
                                              src={fixImageLink(col.image)} 
                                              alt={col.name} 
                                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" 
                                            />
                                          )}

                                          <div className="min-w-0">
                                            <span className="font-bold text-gray-900 block truncate">
                                              {col.name}
                                            </span>
                                            <span className="text-[11px] text-gray-500 block truncate">
                                              {col.description}
                                            </span>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => toggleCollection(col.id)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                            isColEnabled 
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                              : 'bg-gray-100 text-gray-500'
                                          }`}
                                        >
                                          {isColEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                          <span>{isColEnabled ? 'مفعّلة' : 'معطّلة'}</span>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 4. BESTSELLERS SUB-ELEMENTS */}
                          {sec.id === 'bestsellers' && (
                            <div className="space-y-3">
                              <h6 className="text-xs font-bold text-gray-800">
                                عناصر قسم الأكثر مبيعاً:
                              </h6>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {[
                                  { key: 'bestsellersBadge', label: 'شارة الأكثر مبيعاً العلوية' },
                                  { key: 'bestsellersTitle', label: 'العنوان التسويقي للأكثر مبيعاً' }
                                ].map(item => {
                                  const isSubOn = subElementsState[item.key] !== false;
                                  return (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => toggleSubElement(item.key)}
                                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                        isSubOn 
                                          ? 'bg-white border-[#C5A059] shadow-xs text-gray-900 font-bold' 
                                          : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
                                      }`}
                                    >
                                      <span>{item.label}</span>
                                      {isSubOn ? <Eye className="w-3.5 h-3.5 text-[#C5A059]" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 5. TRUST BADGES REORDERING & TOGGLE */}
                          {sec.id === 'trust_badges' && (
                            <div className="space-y-3">
                              <h6 className="text-xs font-bold text-gray-800 mb-1">
                                شارات الثقة والضمان (تقديم وتأخير الشارات وإظهارها):
                              </h6>
                              <div className="space-y-2">
                                {trustBadgesState.map((badge, bIdx) => {
                                  const isBFirst = bIdx === 0;
                                  const isBLast = bIdx === trustBadgesState.length - 1;
                                  const isBEnabled = badge.enabled !== false;

                                  return (
                                    <div 
                                      key={bIdx}
                                      className={`p-3 bg-white rounded-xl border flex items-center justify-between gap-3 text-xs ${
                                        isBEnabled ? 'border-gray-200' : 'border-gray-200 opacity-50 bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => moveTrustBadge(bIdx, 'up')}
                                            disabled={isBFirst}
                                            className={`p-1 rounded transition-colors ${
                                              isBFirst ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                            }`}
                                            title="تقديم الميزة"
                                          >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => moveTrustBadge(bIdx, 'down')}
                                            disabled={isBLast}
                                            className={`p-1 rounded transition-colors ${
                                              isBLast ? 'text-gray-300' : 'text-gray-700 hover:text-[#C5A059] cursor-pointer'
                                            }`}
                                            title="تأخير الميزة"
                                          >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        <span className="font-mono text-xs font-bold text-gray-400">
                                          #{bIdx + 1}
                                        </span>

                                        <span className="font-bold text-gray-900 truncate">
                                          {badge.text}
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => toggleTrustBadge(bIdx)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                          isBEnabled 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                            : 'bg-gray-100 text-gray-500'
                                        }`}
                                      >
                                        {isBEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                        <span>{isBEnabled ? 'مفعّلة' : 'معطّلة'}</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 6. REVIEWS SUB-ELEMENTS */}
                          {sec.id === 'reviews' && (
                            <div className="space-y-3">
                              <h6 className="text-xs font-bold text-gray-800">
                                عناصر قسم التقييمات والآراء:
                              </h6>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {[
                                  { key: 'reviewsBadge', label: 'شارة قسم التقييمات' },
                                  { key: 'reviewsWriteBtn', label: 'زر إضافة تقييم جديد للعملاء' }
                                ].map(item => {
                                  const isSubOn = subElementsState[item.key] !== false;
                                  return (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => toggleSubElement(item.key)}
                                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                        isSubOn 
                                          ? 'bg-white border-[#C5A059] shadow-xs text-gray-900 font-bold' 
                                          : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
                                      }`}
                                    >
                                      <span>{item.label}</span>
                                      {isSubOn ? <Eye className="w-3.5 h-3.5 text-[#C5A059]" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 7. OFFERS SUB-ELEMENTS */}
                          {sec.id === 'offers' && (
                            <div className="space-y-3">
                              <h6 className="text-xs font-bold text-gray-800">
                                عناصر قسم العروض والتخفيضات:
                              </h6>
                              <button
                                type="button"
                                onClick={() => toggleSubElement('offersBadge')}
                                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 text-xs w-full sm:w-64 ${
                                  subElementsState.offersBadge !== false 
                                    ? 'bg-white border-[#C5A059] shadow-xs text-gray-900 font-bold' 
                                    : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
                                }`}
                              >
                                <span>شارة قسم العروض الحصرية</span>
                                {subElementsState.offersBadge !== false ? <Eye className="w-3.5 h-3.5 text-[#C5A059]" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                              </button>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  💡 تذكر: التعديلات على ترتيب السكاشن والعناصر تظهر فوراً في واجهة المتجر بمجرد الضغط على زر الحفظ.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAndPreview}
                    className="px-4 py-2.5 bg-[#111111] hover:bg-black text-[#C5A059] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>حفظ ومعاينة المتجر 👁️</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveStoreSettings}
                    className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#b08d47] text-[#111111] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات في قاعدة البيانات 💾</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SUB-TAB 1: COLOR PALETTE & THEMES */}
          {storeSubTab === 'colors' && (
            <div className="space-y-6">
              
              {/* Presets Cards */}
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <h4 className="text-sm font-bold text-gray-900">
                      سمات وباليتات ألوان جاهزة بنقرة واحدة (One-Click Color Themes)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetColorsToDefault}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>استعادة الذهبي الملكي الأصلي</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3.5 rounded-xl border border-gray-200 hover:border-[#C5A059] bg-gray-50 hover:bg-white text-right transition-all group cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span 
                            className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-xs shrink-0" 
                            style={{ backgroundColor: preset.primaryPreview }}
                          />
                          <span 
                            className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-xs shrink-0" 
                            style={{ backgroundColor: preset.secondaryPreview }}
                          />
                          <span 
                            className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-xs shrink-0" 
                            style={{ backgroundColor: preset.bgPreview }}
                          />
                        </div>
                        <span className="block text-xs font-bold text-gray-900 group-hover:text-[#C5A059] transition-colors">
                          {preset.name}
                        </span>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                      <span className="mt-3 text-[10px] font-bold text-[#C5A059] block pt-2 border-t border-gray-100">
                        تطبيق هذه السمة ←
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Color Categories */}
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#C5A059]" />
                    <h4 className="text-sm font-bold text-gray-900">
                      التخصيص اليدوي الدقيق لكل جزء وعنصر في المتجر
                    </h4>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">
                    اضغط على مربع اللون لاختياره أو اكتب كود الـ HEX مباشرة
                  </span>
                </div>

                {/* Categories Tabs */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {[
                    { id: 'brand', label: 'الشعار والهيدر والقائمة' },
                    { id: 'marquee', label: 'شريط الإعلانات العلوي' },
                    { id: 'hero', label: 'واجهة العرض الترحيبية (Hero)' },
                    { id: 'cards', label: 'كروت المنتجات وأزرار الإضافة' },
                    { id: 'badges_reviews', label: 'أيقونات المزايا والتقييمات ونافذة العروض' },
                    { id: 'footer', label: 'تذييل المتجر (Footer)' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveColorCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeColorCategory === cat.id
                          ? 'bg-[#FAF3E0] text-[#8C6D2D] font-bold border border-[#C5A059]/40'
                          : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 1. Brand & Header Colors */}
                {activeColorCategory === 'brand' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {[
                      { key: 'primaryAccent' as const, label: 'لون التمييز الذهبي الأساسي (Primary Accent)' },
                      { key: 'secondaryAccent' as const, label: 'الذهبي الثانوي / العناوين الداكنة' },
                      { key: 'headerBg' as const, label: 'خلفية شريط الهيدر العلوي' },
                      { key: 'headerBrandColor' as const, label: 'لون اسم الماركة في الهيدر (R O S É E)' },
                      { key: 'headerTitleColor' as const, label: 'لون العنوان الرئيسي بالهيدر' },
                      { key: 'headerSubtitleColor' as const, label: 'لون السلوجان الإنجليزي بالهيدر' },
                      { key: 'headerSloganColor' as const, label: 'لون السلوجان العربي بالهيدر' },
                      { key: 'headerNavColor' as const, label: 'لون روابط القائمة العلوية' }
                    ].map((item) => (
                      <div key={item.key} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-gray-800 truncate">{item.label}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{colorsState[item.key]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shadow-xs"
                          />
                          <input
                            type="text"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-20 p-1.5 text-xs font-mono font-bold text-center border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Marquee Announcement Colors */}
                {activeColorCategory === 'marquee' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { key: 'marqueeBg' as const, label: 'لون خلفية الشريط الإعلاني العلوي' },
                      { key: 'marqueeText' as const, label: 'لون نص الإعلان المتحرك' }
                    ].map((item) => (
                      <div key={item.key} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-gray-800 truncate">{item.label}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{colorsState[item.key]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shadow-xs"
                          />
                          <input
                            type="text"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-20 p-1.5 text-xs font-mono font-bold text-center border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Hero Showcase Colors */}
                {activeColorCategory === 'hero' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {[
                      { key: 'heroBgStart' as const, label: 'بداية تدرج خلفية الهيرو' },
                      { key: 'heroBgEnd' as const, label: 'نهاية تدرج خلفية الهيرو' },
                      { key: 'heroBadgeBg' as const, label: 'خلفية شارة الهيرو العلوية' },
                      { key: 'heroBadgeText' as const, label: 'نص شارة الهيرو العلوية' },
                      { key: 'heroBrandColor' as const, label: 'لون اسم الماركة بالهيرو' },
                      { key: 'heroTitleColor' as const, label: 'العنوان العريض للهيرو' },
                      { key: 'heroSubtitleColor' as const, label: 'السلوجان الإنجليزي بالهيرو' },
                      { key: 'heroHeadlineColor' as const, label: 'العنوان العربي التوضيحي بالهيرو' },
                      { key: 'heroDescColor' as const, label: 'نص الفقرة الوصفية بالهيرو' },
                      { key: 'heroBtnBg' as const, label: 'خلفية زر التسوق الرئيسي بالهيرو' },
                      { key: 'heroBtnText' as const, label: 'نص زر التسوق الرئيسي بالهيرو' },
                      { key: 'heroSecondaryBtnBg' as const, label: 'خلفية زر الاستعلام الثانوي' },
                      { key: 'heroSecondaryBtnText' as const, label: 'نص زر الاستعلام الثانوي' }
                    ].map((item) => (
                      <div key={item.key} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-gray-800 truncate">{item.label}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{colorsState[item.key]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shadow-xs"
                          />
                          <input
                            type="text"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-20 p-1.5 text-xs font-mono font-bold text-center border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Products & Cards Colors */}
                {activeColorCategory === 'cards' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {[
                      { key: 'cardBg' as const, label: 'خلفية كروت المنتجات' },
                      { key: 'cardBorder' as const, label: 'حدود كروت المنتجات' },
                      { key: 'cardTitleColor' as const, label: 'لون اسم المنتج' },
                      { key: 'cardCategoryBg' as const, label: 'خلفية شارة تصنيف المنتج' },
                      { key: 'cardCategoryText' as const, label: 'نص شارة تصنيف المنتج' },
                      { key: 'cardPriceColor' as const, label: 'لون سعر المنتج' },
                      { key: 'cardBtnBg' as const, label: 'خلفية زر إضافة للسلة' },
                      { key: 'cardBtnText' as const, label: 'نص زر إضافة للسلة' }
                    ].map((item) => (
                      <div key={item.key} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-gray-800 truncate">{item.label}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{colorsState[item.key]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shadow-xs"
                          />
                          <input
                            type="text"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-20 p-1.5 text-xs font-mono font-bold text-center border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Trust Badges, Reviews & Offers Modal Colors */}
                {activeColorCategory === 'badges_reviews' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {[
                      { key: 'trustBg' as const, label: 'خلفية قسم أيقونات المزايا' },
                      { key: 'trustCardBg' as const, label: 'خلفية بطاقات المزايا' },
                      { key: 'trustTextColor' as const, label: 'نصوص المزايا' },
                      { key: 'reviewsBg' as const, label: 'خلفية قسم آراء العملاء' },
                      { key: 'reviewsStarColor' as const, label: 'لون نجوم التقييم' },
                      { key: 'offersPopupBg' as const, label: 'خلفية نافذة العروض المنبثقة' },
                      { key: 'offersPopupHeaderBg' as const, label: 'شريط رأس نافذة العروض' },
                      { key: 'offersPopupAccent' as const, label: 'لون تمييز نافذة العروض' }
                    ].map((item) => (
                      <div key={item.key} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-gray-800 truncate">{item.label}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{colorsState[item.key]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shadow-xs"
                          />
                          <input
                            type="text"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-20 p-1.5 text-xs font-mono font-bold text-center border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. Footer Colors */}
                {activeColorCategory === 'footer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {[
                      { key: 'footerBg' as const, label: 'خلفية تذييل المتجر (Footer)' },
                      { key: 'footerBrandColor' as const, label: 'اسم الماركة بالفوتر' },
                      { key: 'footerTaglineColor' as const, label: 'سلوجان الفوتر' },
                      { key: 'footerTextColor' as const, label: 'نص حقوق الملكية بالفوتر' }
                    ].map((item) => (
                      <div key={item.key} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-gray-800 truncate">{item.label}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{colorsState[item.key]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shadow-xs"
                          />
                          <input
                            type="text"
                            value={colorsState[item.key]}
                            onChange={(e) => setColorsState({ ...colorsState, [item.key]: e.target.value })}
                            className="w-20 p-1.5 text-xs font-mono font-bold text-center border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* SUB-TAB 2: LINE-BY-LINE TEXTS */}
          {storeSubTab === 'texts' && (
            <div className="space-y-6">
              
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#C5A059]" />
                    <h4 className="text-sm font-bold text-gray-900">
                      التحكم الحرفي في نصوص وسلوجانات كل جزء وسطر في المتجر
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetTextsToDefault}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>استعادة النصوص الافتراضية</span>
                  </button>
                </div>

                {/* Text Sections Navigation */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {[
                    { id: 'header', label: '1. شريط الإعلانات والهيدر والسلوجان' },
                    { id: 'hero', label: '2. واجهة الهيرو والبطاقة المميزة' },
                    { id: 'catalog', label: '3. الأكثر طلباً والكتالوج والبحث' },
                    { id: 'modal_reviews', label: '4. آراء العملاء ونافذة العروض' },
                    { id: 'footer', label: '5. تذييل المتجر ورسالة واتساب' },
                  ].map(sec => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveTextSection(sec.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeTextSection === sec.id
                          ? 'bg-[#111111] text-[#C5A059] font-bold shadow-xs'
                          : 'bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-100'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>

                {/* 1. Header & Slogans */}
                {activeTextSection === 'header' && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        نص شريط الإعلانات المتحرك أعلى الموقع:
                      </label>
                      <input
                        type="text"
                        value={marqueeInput}
                        onChange={(e) => setMarqueeInput(e.target.value)}
                        placeholder="✨ توصيل سريع لجميع المحافظات..."
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">اسم الماركة (Brand Name):</label>
                        <input
                          type="text"
                          value={textsState.brandName}
                          onChange={(e) => setTextsState({ ...textsState, brandName: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-brand tracking-wider"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">العنوان الرئيسي للهوية:</label>
                        <input
                          type="text"
                          value={textsState.headerMainTitle}
                          onChange={(e) => setTextsState({ ...textsState, headerMainTitle: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">السلوجان الإنجليزي بالهيدر:</label>
                        <input
                          type="text"
                          value={textsState.headerTagline}
                          onChange={(e) => setTextsState({ ...textsState, headerTagline: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl uppercase font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        السلوجان العربي التفصيلي أسفل اسم الموقع (طلب المستخدم المباشر):
                      </label>
                      <input
                        type="text"
                        value={textsState.headerArabicSlogan}
                        onChange={(e) => setTextsState({ ...textsState, headerArabicSlogan: e.target.value })}
                        className="w-full p-2.5 text-xs border border-[#C5A059] rounded-xl font-arabic font-semibold bg-[#FAF3E0]/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص رابط التشكيلة:</label>
                        <input
                          type="text"
                          value={textsState.navCollection}
                          onChange={(e) => setTextsState({ ...textsState, navCollection: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص رابط الأكثر طلباً:</label>
                        <input
                          type="text"
                          value={textsState.navBestsellers}
                          onChange={(e) => setTextsState({ ...textsState, navBestsellers: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص رابط تتبع الطلب:</label>
                        <input
                          type="text"
                          value={textsState.navTracking}
                          onChange={(e) => setTextsState({ ...textsState, navTracking: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص رابط آراء العملاء:</label>
                        <input
                          type="text"
                          value={textsState.navReviews}
                          onChange={(e) => setTextsState({ ...textsState, navReviews: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص زر العروض بالهيدر:</label>
                        <input
                          type="text"
                          value={textsState.btnOffers}
                          onChange={(e) => setTextsState({ ...textsState, btnOffers: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص زر تتبع طلبي:</label>
                        <input
                          type="text"
                          value={textsState.btnTracking}
                          onChange={(e) => setTextsState({ ...textsState, btnTracking: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص زر سلة التسوق:</label>
                        <input
                          type="text"
                          value={textsState.btnCart}
                          onChange={(e) => setTextsState({ ...textsState, btnCart: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Hero Section */}
                {activeTextSection === 'hero' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">شارة الهيرو العلوية (Badge):</label>
                        <input
                          type="text"
                          value={textsState.heroBadge}
                          onChange={(e) => setTextsState({ ...textsState, heroBadge: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">اسم الماركة بالهيرو:</label>
                        <input
                          type="text"
                          value={textsState.heroBrandName}
                          onChange={(e) => setTextsState({ ...textsState, heroBrandName: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-brand uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">العنوان الإنجليزي العريض بالهيرو:</label>
                        <input
                          type="text"
                          value={textsState.heroMainHeading}
                          onChange={(e) => setTextsState({ ...textsState, heroMainHeading: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">السلوجان الإنجليزي بالهيرو:</label>
                        <input
                          type="text"
                          value={textsState.heroSubtitle}
                          onChange={(e) => setTextsState({ ...textsState, heroSubtitle: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl uppercase font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">العنوان العربي التوضيحي بالهيرو:</label>
                      <input
                        type="text"
                        value={textsState.heroArabicHeadline}
                        onChange={(e) => setTextsState({ ...textsState, heroArabicHeadline: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-arabic font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">الفقرة الوصفية الشاملة للهيرو:</label>
                      <textarea
                        rows={3}
                        value={textsState.heroDescription}
                        onChange={(e) => setTextsState({ ...textsState, heroDescription: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-arabic leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">نص زر التسوق الرئيسي (CTA):</label>
                        <input
                          type="text"
                          value={textsState.heroPrimaryBtn}
                          onChange={(e) => setTextsState({ ...textsState, heroPrimaryBtn: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">نص زر الاستعلام الثانوي:</label>
                        <input
                          type="text"
                          value={textsState.heroSecondaryBtn}
                          onChange={(e) => setTextsState({ ...textsState, heroSecondaryBtn: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">تسمية وسائل التواصل:</label>
                        <input
                          type="text"
                          value={textsState.heroSocialLabel}
                          onChange={(e) => setTextsState({ ...textsState, heroSocialLabel: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Multi-Featured Hero Cards Studio (User Request) */}
                    <div className="p-5 bg-gradient-to-br from-amber-50/40 via-white to-gray-50 border border-[#C5A059]/40 rounded-2xl shadow-xs space-y-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#C5A059]" />
                            <h4 className="text-sm font-bold text-gray-900">
                              إدارة بطاقات العرض وسلايدر الهيدر (Featured Hero Cards Studio)
                            </h4>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            أضف بطاقات مميزة أخرى تتحرك بسلاسة (Smooth PAN) مع تغيير النصوص بالجانب الأيمن تلقائياً لكل بطاقة.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newId = `hero-${Date.now()}`;
                            const newCard: FeaturedHeroCard = {
                              id: newId,
                              badge: 'إصدار فاخر جديد',
                              brandName: 'R O S É E',
                              mainHeading: 'ROYAL ESSENCE',
                              subtitle: 'LUXURY & BEAUTY CARE',
                              headline: 'تركيبة استثنائية ونفحات تأسر الحواس',
                              description: 'مستحضرات فاخرة للعناية والجمال تمنحك إشراقة متجددة ونضارة تدوم.',
                              cardTag: 'New Exclusive',
                              cardTitle: 'Rose Élixir Royal',
                              cardDesc: 'مستحضر فاخر بتركيبة مركزة ونفحات تدوم طويلاً.',
                              image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
                              primaryBtnText: 'اكتشف التشكيلة'
                            };
                            const updatedList = [...featuredCardsState, newCard];
                            setFeaturedCardsState(updatedList);
                            setActiveHeroCardIdx(updatedList.length - 1);
                          }}
                          className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>➕ إضافة بطاقة مميزة جديدة</span>
                        </button>
                      </div>

                      {/* Card Selection Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {featuredCardsState.map((card, idx) => (
                          <button
                            key={card.id || idx}
                            type="button"
                            onClick={() => setActiveHeroCardIdx(idx)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                              activeHeroCardIdx === idx
                                ? 'bg-[#111111] text-[#C5A059] shadow-xs'
                                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                            }`}
                          >
                            <span>بطاقة {idx + 1}: {card.cardTitle || `بطاقة ${idx + 1}`}</span>
                          </button>
                        ))}
                      </div>

                      {/* Active Card Configuration */}
                      {featuredCardsState[activeHeroCardIdx] && (() => {
                        const curCard = featuredCardsState[activeHeroCardIdx];
                        const updateCurCard = (patch: Partial<FeaturedHeroCard>) => {
                          const updated = [...featuredCardsState];
                          updated[activeHeroCardIdx] = { ...updated[activeHeroCardIdx], ...patch };
                          setFeaturedCardsState(updated);
                          if (activeHeroCardIdx === 0) {
                            if (patch.cardTag !== undefined) setTextsState(t => ({ ...t, heroCardTag: patch.cardTag || '' }));
                            if (patch.cardTitle !== undefined) setTextsState(t => ({ ...t, heroCardTitle: patch.cardTitle || '' }));
                            if (patch.image !== undefined) setTextsState(t => ({ ...t, heroCardImage: patch.image || '' }));
                            if (patch.cardDesc !== undefined) setTextsState(t => ({ ...t, heroCardDesc: patch.cardDesc || '' }));
                          }
                        };

                        return (
                          <div className="space-y-4 pt-1">
                            {/* Card Visual Side */}
                            <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                  <span>🖼️ صورة وبيانات البطاقة المرئية (Visual Card):</span>
                                </span>
                                {featuredCardsState.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = featuredCardsState.filter((_, i) => i !== activeHeroCardIdx);
                                      setFeaturedCardsState(filtered);
                                      setActiveHeroCardIdx(Math.max(0, activeHeroCardIdx - 1));
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف هذه البطاقة</span>
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">شارة البطاقة (Tag):</label>
                                  <input
                                    type="text"
                                    value={curCard.cardTag || ''}
                                    onChange={(e) => updateCurCard({ cardTag: e.target.value })}
                                    placeholder="مثال: Skincare & Beauty"
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-gray-50/50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">عنوان المنتج المميز في البطاقة:</label>
                                  <input
                                    type="text"
                                    value={curCard.cardTitle || ''}
                                    onChange={(e) => updateCurCard({ cardTitle: e.target.value })}
                                    placeholder="مثال: Rose Gold Glow Elixir"
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-gray-50/50 font-bold"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">وصف البطاقة المرئية:</label>
                                <input
                                  type="text"
                                  value={curCard.cardDesc || ''}
                                  onChange={(e) => updateCurCard({ cardDesc: e.target.value })}
                                  placeholder="سيروم عناية فائق ومستحضر تجميل غني ببتلات الورد وزيوت الترطيب العميقة..."
                                  className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-gray-50/50"
                                />
                              </div>

                              {/* Image with Local File Upload & Link */}
                              <div>
                                <ImageUploadInput
                                  label="صورة البطاقة المميزة (رفع من الهاتف/اللاب توب أو كتابة رابط):"
                                  value={curCard.image || ''}
                                  onChange={(newUrl) => updateCurCard({ image: newUrl })}
                                  placeholder="https://... أو اضغط لرفع صورة من جهازك"
                                />
                              </div>
                            </div>

                            {/* Card-Specific Right-Side Dynamic Text */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                              <span className="text-xs font-bold text-gray-800 block">
                                ✍️ نصوص الجانب الأيمن المصاحبة لهذه البطاقة (تتغير تلقائياً مع انتقال السلايدر):
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">شارة العرض العلوية (Badge):</label>
                                  <input
                                    type="text"
                                    value={curCard.badge || ''}
                                    onChange={(e) => updateCurCard({ badge: e.target.value })}
                                    placeholder="مثال: خصم 15% بمناسبة إطلاق التشكيلة"
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">اسم العلامة التجارية (Brand):</label>
                                  <input
                                    type="text"
                                    value={curCard.brandName || ''}
                                    onChange={(e) => updateCurCard({ brandName: e.target.value })}
                                    placeholder="R O S É E"
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-brand"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">العنوان الإنجليزي الرئيسي:</label>
                                  <input
                                    type="text"
                                    value={curCard.mainHeading || ''}
                                    onChange={(e) => updateCurCard({ mainHeading: e.target.value })}
                                    placeholder="SKINCARE & BEAUTY"
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">السلوجان الإنجليزي:</label>
                                  <input
                                    type="text"
                                    value={curCard.subtitle || ''}
                                    onChange={(e) => updateCurCard({ subtitle: e.target.value })}
                                    placeholder="ELEVATE YOUR DAILY ROUTINE"
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">العنوان العربي العريض:</label>
                                <input
                                  type="text"
                                  value={curCard.headline || ''}
                                  onChange={(e) => updateCurCard({ headline: e.target.value })}
                                  placeholder="مثال: تشكيلة مستحضرات التجميل والعناية الفاخرة بالبشرة"
                                  className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">الوصف التعريفي الترويجي:</label>
                                <textarea
                                  rows={2}
                                  value={curCard.description || ''}
                                  onChange={(e) => updateCurCard({ description: e.target.value })}
                                  placeholder="اكتب وصفاً جذاباً يشرح مزايا وتأثير هذا المنتج..."
                                  className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white leading-relaxed"
                                />
                              </div>

                              <div className="sm:w-1/2">
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص زر الشراء الرئيسي:</label>
                                <input
                                  type="text"
                                  value={curCard.primaryBtnText || ''}
                                  onChange={(e) => updateCurCard({ primaryBtnText: e.target.value })}
                                  placeholder="اكتشف التشكيلة"
                                  className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 3. Bestsellers & Catalog */}
                {activeTextSection === 'catalog' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">شارة الأكثر طلباً (Badge):</label>
                        <input
                          type="text"
                          value={textsState.bestsellersBadge}
                          onChange={(e) => setTextsState({ ...textsState, bestsellersBadge: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">عنوان قسم الأكثر طلباً:</label>
                        <input
                          type="text"
                          value={textsState.bestsellersTitle}
                          onChange={(e) => setTextsState({ ...textsState, bestsellersTitle: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">شارة الكتالوج (Catalogue Badge):</label>
                        <input
                          type="text"
                          value={textsState.catalogBadge}
                          onChange={(e) => setTextsState({ ...textsState, catalogBadge: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">عنوان قسم التشكيلة والكتالوج:</label>
                        <input
                          type="text"
                          value={textsState.catalogTitle}
                          onChange={(e) => setTextsState({ ...textsState, catalogTitle: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">فلتر 1 (الكل):</label>
                        <input
                          type="text"
                          value={textsState.filterAll}
                          onChange={(e) => setTextsState({ ...textsState, filterAll: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">فلتر 2 (نسائي):</label>
                        <input
                          type="text"
                          value={textsState.filterWomen}
                          onChange={(e) => setTextsState({ ...textsState, filterWomen: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">فلتر 3 (رجالي):</label>
                        <input
                          type="text"
                          value={textsState.filterMen}
                          onChange={(e) => setTextsState({ ...textsState, filterMen: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">فلتر 4 (للجنسين):</label>
                        <input
                          type="text"
                          value={textsState.filterUnisex}
                          onChange={(e) => setTextsState({ ...textsState, filterUnisex: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">نص إرشاد شريط البحث (Search Placeholder):</label>
                        <input
                          type="text"
                          value={textsState.searchPlaceholder}
                          onChange={(e) => setTextsState({ ...textsState, searchPlaceholder: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">نص زر الإضافة للسلة:</label>
                        <input
                          type="text"
                          value={textsState.addCartBtn}
                          onChange={(e) => setTextsState({ ...textsState, addCartBtn: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Reviews & Offers Modal */}
                {activeTextSection === 'modal_reviews' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">شارة آراء العملاء (Badge):</label>
                        <input
                          type="text"
                          value={textsState.reviewsBadge}
                          onChange={(e) => setTextsState({ ...textsState, reviewsBadge: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">عنوان قسم آراء العملاء:</label>
                        <input
                          type="text"
                          value={textsState.reviewsTitle}
                          onChange={(e) => setTextsState({ ...textsState, reviewsTitle: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                      <span className="block text-xs font-bold text-gray-800">
                        نصوص نافذة العروض المنبثقة التلقائية (Offers Pop-Up Modal):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">عنوان شارة النافذة:</label>
                          <input
                            type="text"
                            value={textsState.offersModalBadge}
                            onChange={(e) => setTextsState({ ...textsState, offersModalBadge: e.target.value })}
                            className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص زر الشراء الرئيسي:</label>
                          <input
                            type="text"
                            value={textsState.offersModalCta}
                            onChange={(e) => setTextsState({ ...textsState, offersModalCta: e.target.value })}
                            className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">نص زر تخطي النافذة:</label>
                          <input
                            type="text"
                            value={textsState.offersModalSkip}
                            onChange={(e) => setTextsState({ ...textsState, offersModalSkip: e.target.value })}
                            className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Footer & WhatsApp */}
                {activeTextSection === 'footer' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">اسم الماركة بالفوتر:</label>
                        <input
                          type="text"
                          value={textsState.footerBrandName}
                          onChange={(e) => setTextsState({ ...textsState, footerBrandName: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-brand tracking-wider"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">سلوجان الفوتر الإنجليزي:</label>
                        <input
                          type="text"
                          value={textsState.footerTagline}
                          onChange={(e) => setTextsState({ ...textsState, footerTagline: e.target.value })}
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl uppercase font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">نص الحقوق والوصف التعريفي بالفوتر:</label>
                      <textarea
                        rows={2}
                        value={textsState.footerBio}
                        onChange={(e) => setTextsState({ ...textsState, footerBio: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        الرسالة التلقائية المجهزة للعميل عند النقر على زر واتساب:
                      </label>
                      <input
                        type="text"
                        value={textsState.whatsappDefaultMsg}
                        onChange={(e) => setTextsState({ ...textsState, whatsappDefaultMsg: e.target.value })}
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* SUB-TAB: ANIMATIONS & MOTION */}
          {storeSubTab === 'animations' && (
            <div className="space-y-6">
              
              {/* Fly-to-cart +1 Particle Customizer (Requested by user) */}
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/15 text-amber-600 rounded-xl">
                      <Zap className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        مؤثر الدائرة الطائرة (+1 Fly-to-Cart Effect)
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        عند الضغط على إضافة المنتج للسلة، تظهر دائرة +1 وتطير بنعومة وسلاسة ناحية أيقونة السلة.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAnimationsToDefault}
                    className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>الافتراضي</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Enable Fly-to-Cart */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">تفعيل حركة دائرة +1 الطائرة</span>
                      <span className="text-[11px] text-gray-500">انبثاق الدائرة وحركتها السلسة نحو أيقونة السلة</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={animationsState.enableFlyToCart}
                        onChange={(e) => setAnimationsState({ ...animationsState, enableFlyToCart: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
                    </label>
                  </div>

                  {/* Fly-to-Cart Speed Selector */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">سرعة وانسيابية حركة +1</span>
                      <span className="text-[11px] font-mono text-[#C5A059] font-bold">
                        {animationsState.flyToCartSpeed === 'fast' ? 'سريعة (550ms)' : animationsState.flyToCartSpeed === 'smooth' ? 'ناعمة جداً (1150ms)' : 'منطقية ومتوازنة (850ms)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'fast', label: 'سريعة (550ms)' },
                        { id: 'normal', label: 'متوازنة (850ms)' },
                        { id: 'smooth', label: 'ناعمة وملحوظة (1150ms)' }
                      ].map(spd => (
                        <button
                          key={spd.id}
                          type="button"
                          onClick={() => setAnimationsState({ ...animationsState, flyToCartSpeed: spd.id as any })}
                          className={`p-2 rounded-lg font-bold border transition-all cursor-pointer text-center ${
                            animationsState.flyToCartSpeed === spd.id
                              ? 'bg-[#111111] text-[#C5A059] border-[#111111] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#C5A059]'
                          }`}
                        >
                          {spd.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* General Motion Controls */}
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-5">
                <h4 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#C5A059]" />
                  <span>التحكم في حركات ومؤثرات عناصر المتجر (Elements Motion)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* Hero Effect */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <label className="block font-bold text-gray-800">حركة ظهور قسم الهيرو الرئيسي:</label>
                    <select
                      value={animationsState.heroEffect}
                      onChange={(e) => setAnimationsState({ ...animationsState, heroEffect: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="fade-zoom">تلاشي وتكبير ناعم (Fade & Zoom)</option>
                      <option value="slide-up">انزلاق لأعلى (Slide Up)</option>
                      <option value="float">تأثير عائم مخملي (Float Glow)</option>
                      <option value="none">بدون حركة (Static)</option>
                    </select>
                  </div>

                  {/* Card Hover Effect */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <label className="block font-bold text-gray-800">مؤثر تمرير الماوس على كروت المنتجات:</label>
                    <select
                      value={animationsState.cardHoverEffect}
                      onChange={(e) => setAnimationsState({ ...animationsState, cardHoverEffect: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="lift">رفع ثلاثي الأبعاد مع ظل ناعم (Lift & Shadow)</option>
                      <option value="glow">توهج ذهبي فاخر (Golden Glow)</option>
                      <option value="scale">تكبير تدريجي (Scale 105%)</option>
                      <option value="none">بدون تأثير (Static)</option>
                    </select>
                  </div>

                  {/* Marquee Speed */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <label className="block font-bold text-gray-800">سرعة شريط الإعلانات المتحرك بأعلى المتجر:</label>
                    <select
                      value={animationsState.marqueeSpeed}
                      onChange={(e) => setAnimationsState({ ...animationsState, marqueeSpeed: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="slow">هادئة ومتمهلة (Slow - 35s)</option>
                      <option value="normal">متوازنة وطبيعية (Normal - 22s)</option>
                      <option value="fast">سريعة وحيوية (Fast - 14s)</option>
                    </select>
                  </div>

                  {/* Offers Modal Animation */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <label className="block font-bold text-gray-800">حركة سلايدر العروض الترحيبية:</label>
                    <select
                      value={animationsState.offersPopupPanStyle}
                      onChange={(e) => setAnimationsState({ ...animationsState, offersPopupPanStyle: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="pan-left">سحب سلس لليسار (Pan-to-Left تلقائي)</option>
                      <option value="fade-zoom">تلاشي وتكبير ناعم (Fade-Zoom)</option>
                      <option value="slide-bottom">انزلاق من الأسفل (Slide-up)</option>
                    </select>
                  </div>

                  {/* Group Accordion Speed */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <label className="block font-bold text-gray-800">سرعة فتح القوائم المنسدلة للمجموعات:</label>
                    <select
                      value={animationsState.categoryAccordionSpeed}
                      onChange={(e) => setAnimationsState({ ...animationsState, categoryAccordionSpeed: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="smooth">سلسة وانسيابية مع دوران السهم (Smooth Accordion)</option>
                      <option value="instant">فورية ومباشرة (Instant)</option>
                    </select>
                  </div>

                  {/* Button Click Ripple */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">ارتداد الأزرار عند النقر</span>
                      <span className="text-[11px] text-gray-500">تأثير انضغاط لطيف (Micro-interaction)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={animationsState.buttonRipple}
                        onChange={(e) => setAnimationsState({ ...animationsState, buttonRipple: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SUB-TAB: ICONS & SHAPES */}
          {storeSubTab === 'icons' && (
            <div className="space-y-6">
              
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#C5A059]/15 text-[#C5A059] rounded-xl">
                      <ShoppingBag className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        تخصيص أيقونات وأشكال المتجر (Icons & Shapes Customizer)
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        اختر نمط الأيقونات المناسب لهوية علامتك التجارية لتطبيقها في الهيدر والبطاقات.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetIconsToDefault}
                    className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>الافتراضي</span>
                  </button>
                </div>

                {/* Cart Icon Selector */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-800">
                    أيقونة سلة الشراء في شريط الهيدر العلوي:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'bag', label: 'حقيبة تسوق فاخرة', icon: ShoppingBag, desc: 'Shopping Bag' },
                      { id: 'cart', label: 'عربة تسوق كلاسيكية', icon: ShoppingCart, desc: 'Shopping Cart' },
                      { id: 'basket', label: 'سلة عناية وتجميل', icon: ShoppingBasket, desc: 'Shopping Basket' },
                      { id: 'sparkle', label: 'بريق وتميز', icon: Sparkles, desc: 'Sparkle Box' }
                    ].map(item => {
                      const IconComp = item.icon;
                      const isSelected = iconsState.cartIconStyle === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setIconsState({ ...iconsState, cartIconStyle: item.id as any })}
                          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#111111] text-[#C5A059] border-[#111111] shadow-md'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#C5A059]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`p-2 rounded-xl ${isSelected ? 'bg-[#C5A059] text-[#111111]' : 'bg-gray-100 text-gray-700'}`}>
                              <IconComp className="w-5 h-5" />
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-[#C5A059]" />}
                          </div>
                          <div>
                            <span className="block text-xs font-bold">{item.label}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{item.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating Star Style */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800">
                    أيقونة التقييمات والآراء (Rating Icon):
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'star', label: 'نجوم ذهبية ملكية', icon: Star },
                      { id: 'heart', label: 'قلوب رومانسية فاخرة', icon: Heart },
                      { id: 'sparkle', label: 'بريق ساحر', icon: Sparkles }
                    ].map(item => {
                      const IconComp = item.icon;
                      const isSelected = iconsState.ratingIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setIconsState({ ...iconsState, ratingIcon: item.id as any })}
                          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#111111] text-[#C5A059] border-[#111111] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#C5A059]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <IconComp className={`w-4 h-4 ${isSelected ? 'text-[#C5A059]' : 'text-amber-500'}`} />
                            <span className="text-xs font-bold">{item.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#C5A059]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Badge Pulse Style */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800">
                    حركة شارة عدد المنتجات في سلة الشراء:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {[
                      { id: 'pulse', label: 'نبض دوري (Pulse)' },
                      { id: 'glow', label: 'توهج ذهبي (Glow)' },
                      { id: 'bounce', label: 'وثب لطيف (Bounce)' },
                      { id: 'static', label: 'ثابت (Static)' }
                    ].map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setIconsState({ ...iconsState, badgePulseStyle: b.id as any })}
                        className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          iconsState.badgePulseStyle === b.id
                            ? 'bg-[#111111] text-[#C5A059] border-[#111111]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#C5A059]'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SUB-TAB 5: ACCOUNTS & GENERAL */}
          {storeSubTab === 'general' && (
            <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6">
              
              {/* Client UI & Elements Sizing Architecture (User Request: التحكم في مقاس كل عناصر شاشة العميل) */}
              <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-[#C5A059]/10 border border-[#C5A059]/40 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#C5A059]/20">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                      <span className="text-base">📐</span>
                      <span>التحكم في مقاسات وأبعاد شاشة العميل (Client UI & Elements Sizing)</span>
                    </h4>
                    <p className="text-xs text-gray-600">
                      تحكم كامل ومباشر في المقياس العام لشاشة العميل، أحجام الخطوط، وأبعاد كروت المنتجات لتناسب جميع الأذواق والشاشات.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-[#111111] text-[#C5A059] text-xs font-bold rounded-xl shadow-xs">
                    مباشر بالمتجر
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  {/* 1. Overall Store Zoom / Scale */}
                  <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                    <label className="block text-xs font-bold text-gray-900">
                      1. مقياس شاشة المتجر ككل (Overall Scale):
                    </label>
                    <select
                      value={clientUiScale}
                      onChange={(e) => setClientUiScale(e.target.value as any)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-800 focus:border-[#C5A059] outline-none"
                    >
                      <option value="compact">🔍 مدمج أنيق (92% - شاشات صغيرة)</option>
                      <option value="standard">⚖️ قياسي متوازن (100% - الوضع الافتراضي)</option>
                      <option value="comfortable">✨ مريح وموسع (106% - وضوح إضافي)</option>
                      <option value="large">🌟 كبير وبارز (114% - شاشات كبيرة)</option>
                    </select>
                    <p className="text-[11px] text-gray-500">
                      يتحكم في نسبة تكبير وتصغير محتويات المتجر وتجاوبها مع أجهزة العملاء.
                    </p>
                  </div>

                  {/* 2. Typography Scale */}
                  <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                    <label className="block text-xs font-bold text-gray-900">
                      2. مقياس خطوط العميل (Font Size):
                    </label>
                    <select
                      value={clientFontScale}
                      onChange={(e) => setClientFontScale(e.target.value as any)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-800 focus:border-[#C5A059] outline-none"
                    >
                      <option value="small">🔤 خط ناعم ومضغوط (Small 92%)</option>
                      <option value="standard">🔤 خط متوازن قياسي (Standard 100%)</option>
                      <option value="large">🔤 خط كبير ومقروء بوضوح (Large 108%)</option>
                    </select>
                    <p className="text-[11px] text-gray-500">
                      يضبط حجم عناوين وفقرات وتفاصيل المنتجات في واجهة المتجر.
                    </p>
                  </div>

                  {/* 3. Product Cards Size */}
                  <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                    <label className="block text-xs font-bold text-gray-900">
                      3. حجم كروت المنتجات (Card Sizing):
                    </label>
                    <select
                      value={clientCardSize}
                      onChange={(e) => setClientCardSize(e.target.value as any)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-800 focus:border-[#C5A059] outline-none"
                    >
                      <option value="compact">📦 كروت مدمجة (كثافة أعلى للمنتجات)</option>
                      <option value="standard">📦 كروت قياسية متناسقة (الافتراضي)</option>
                      <option value="spacious">📦 كروت فسيحة وعريضة (عرض بارز)</option>
                    </select>
                    <p className="text-[11px] text-gray-500">
                      يتحكم في مساحة وبطاقات عرض العطور والمنتجات بالكتالوج.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Badges Dynamic Manager (User Request) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#C5A059]" />
                      <span>أيقونات ومزايا الثقة بالمتجر (Trust & Feature Badges):</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      أضف أي مزايا إضافية، وتحكم في الأيقونة والنصوص التي تظهر لزوار المتجر لتعزيز الموثوقية.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newBadge: TrustBadge = {
                        id: `badge-${Date.now()}`,
                        icon: 'shieldcheck',
                        text: 'ميزة جديدة',
                        description: 'وصف توضيحي للميزة'
                      };
                      setTrustBadgesState([...trustBadgesState, newBadge]);
                    }}
                    className="px-3 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>➕ إضافة ميزة ثقة جديدة</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {trustBadgesState.map((badge, bIdx) => (
                    <div key={badge.id || bIdx} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5 relative group">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-gray-600">الأيقونة المعتمدة:</label>
                        {trustBadgesState.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = trustBadgesState.filter((_, i) => i !== bIdx);
                              setTrustBadgesState(updated);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="حذف هذه الميزة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <select
                        value={badge.icon}
                        onChange={(e) => {
                          const updated = [...trustBadgesState];
                          updated[bIdx] = { ...updated[bIdx], icon: e.target.value };
                          setTrustBadgesState(updated);
                        }}
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white font-semibold text-gray-800"
                      >
                        <option value="leaf">🍃 Leaf - طبيعي / عضوي</option>
                        <option value="truck">🚚 Truck - شحن سريع ومجاني</option>
                        <option value="shieldcheck">🛡️ ShieldCheck - جودة وضمان</option>
                        <option value="lock">🔒 Lock - دفع وتشفير آمن</option>
                        <option value="award">🏆 Award - علامة تجارية معتمدة</option>
                        <option value="gem">💎 Gem - مستحضرات فاخرة أصلية</option>
                        <option value="heart">❤️ Heart - عناية فائقة وتجربة مبهجة</option>
                        <option value="thumbsup">👍 ThumbsUp - تقييمات إيجابية موثوقة</option>
                        <option value="clock">⏱️ Clock - دعم وتوصيل على مدار الساعة</option>
                        <option value="zap">⚡ Zap - فاعلية وتأثير فوري</option>
                        <option value="refresh">🔄 Refresh - إمكانية الاستبدال السلس</option>
                        <option value="sparkles">✨ Sparkles - بريق وتميز استثنائي</option>
                      </select>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-1">عنوان الميزة:</label>
                        <input
                          type="text"
                          value={badge.text}
                          onChange={(e) => {
                            const updated = [...trustBadgesState];
                            updated[bIdx] = { ...updated[bIdx], text: e.target.value };
                            setTrustBadgesState(updated);
                            if (bIdx === 0) setTb1(e.target.value);
                            if (bIdx === 1) setTb2(e.target.value);
                            if (bIdx === 2) setTb3(e.target.value);
                            if (bIdx === 3) setTb4(e.target.value);
                          }}
                          placeholder="مثال: مكونات طبيعية آمنة"
                          className="w-full p-2 border border-gray-200 rounded-lg bg-white font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-1">وصف الميزة (اختياري):</label>
                        <input
                          type="text"
                          value={badge.description || ''}
                          onChange={(e) => {
                            const updated = [...trustBadgesState];
                            updated[bIdx] = { ...updated[bIdx], description: e.target.value };
                            setTrustBadgesState(updated);
                          }}
                          placeholder="وصف مختصر للميزة"
                          className="w-full p-1.5 text-[11px] border border-gray-200 rounded-lg bg-white text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loyalty Points & InstaPay (User Request) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                {/* Loyalty Equation */}
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <label className="font-bold text-amber-950">نظام ومعادلة نقاط الولاء والمكافآت:</label>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-amber-200">
                      <span className="text-gray-700 font-semibold">كم جنيه مشتريات يمنح نقطة واحدة؟</span>
                      <div className="flex items-center gap-1.5">
                        <span>كل</span>
                        <input
                          type="number"
                          min="1"
                          value={loyaltyEgpPerPoint}
                          onChange={(e) => setLoyaltyEgpPerPoint(parseFloat(e.target.value) || 1)}
                          className="w-16 p-1.5 border border-amber-300 rounded-lg bg-amber-50/50 text-center font-bold text-amber-950"
                        />
                        <span>ج.م = 1 نقطة</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-amber-200">
                      <span className="text-gray-700 font-semibold">قيمة خصم كل 1 نقطة ولاء عند الاستبدال:</span>
                      <div className="flex items-center gap-1.5">
                        <span>كل 1 نقطة =</span>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={loyaltyPointDiscountValue}
                          onChange={(e) => setLoyaltyPointDiscountValue(parseFloat(e.target.value) || 1)}
                          className="w-16 p-1.5 border border-amber-300 rounded-lg bg-amber-50/50 text-center font-bold text-emerald-700"
                        />
                        <span>ج.م خصم</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg leading-relaxed">
                      💡 <strong>مثال عملي:</strong> عميل اشترى بمبلغ <strong>500 ج.م</strong> سيكسب <strong>{Math.floor(500 / (loyaltyEgpPerPoint || 20))} نقطة</strong>، وقيمتها <strong>{(Math.floor(500 / (loyaltyEgpPerPoint || 20)) * (loyaltyPointDiscountValue || 1)).toFixed(0)} ج.م خصم</strong> في طلبيته القادمة.
                    </div>
                  </div>
                </div>

                {/* InstaPay Integration */}
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📱</span>
                    <label className="font-bold text-purple-950">بيانات وتوجيه الدفع عبر InstaPay:</label>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-purple-800 block mb-1">
                        اسم أو معرّف حساب InstaPay المعتمد:
                      </label>
                      <input
                        type="text"
                        value={instaAccount}
                        onChange={(e) => setInstaAccount(e.target.value)}
                        placeholder="مثال: rosee.cosmo@instapay أو رقم المحفظة"
                        className="w-full p-2.5 border border-purple-300 rounded-xl bg-white font-mono font-bold text-purple-950 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-purple-800 block mb-1">
                        رابط التوجيه التلقائي المباشر لتطبيق انستاباي (اختياري):
                      </label>
                      <input
                        type="url"
                        value={instaLink}
                        onChange={(e) => setInstaLink(e.target.value)}
                        placeholder="https://ipn.eg/... أو رابط الدفع المباشر"
                        className="w-full p-2.5 border border-purple-300 rounded-xl bg-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <p className="text-[11px] text-purple-700">
                      ⚡ سيظهر للعميل في سلة الشراء زر "تحويل مباشر عبر انستاباي" ينسخ الحساب ويفتح التطبيق فوراً.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="pt-2 text-xs">
                <label className="block font-bold text-gray-700 mb-2">روابط قنوات السوشيال ميديا وأرقام التواصل:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={socialInsta}
                    onChange={(e) => setSocialInsta(e.target.value)}
                    placeholder="رابط صفحة إنستجرام"
                    className="p-2.5 border border-gray-200 rounded-xl"
                  />
                  <input
                    type="text"
                    value={socialFb}
                    onChange={(e) => setSocialFb(e.target.value)}
                    placeholder="رابط صفحة فيسبوك"
                    className="p-2.5 border border-gray-200 rounded-xl"
                  />
                  <input
                    type="text"
                    value={socialWa}
                    onChange={(e) => setSocialWa(e.target.value)}
                    placeholder="رقم الواتساب (مثال: 01117237246)"
                    className="p-2.5 border border-gray-200 rounded-xl"
                  />
                  <input
                    type="text"
                    value={socialTiktok}
                    onChange={(e) => setSocialTiktok(e.target.value)}
                    placeholder="رابط أو يوزر تيك توك"
                    className="p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>

                {/* Social Dock Luxury Customization (User Request: luxury motion, smaller size, full control) */}
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>تخصيص شريط السوشيال ميديا العائم (Luxury Dock Controls)</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">Real-time luxury motion</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Size Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">حجم الأيقونات:</label>
                      <select
                        value={socialDockSize}
                        onChange={(e) => setSocialDockSize(e.target.value as any)}
                        className="w-full p-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
                      >
                        <option value="micro">أصغر حجم فاخر (Micro 30px)</option>
                        <option value="compact">حجم رشيق أنيق (Compact 36px) - الموصى به</option>
                        <option value="standard">حجم قياسي (Standard 42px)</option>
                      </select>
                    </div>

                    {/* Theme / Visual Style */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">ستايل المظهر:</label>
                      <select
                        value={socialDockTheme}
                        onChange={(e) => setSocialDockTheme(e.target.value as any)}
                        className="w-full p-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
                      >
                        <option value="gold_luxury">ذهب ملكي فاخر (Gold Luxury)</option>
                        <option value="glassmorphism">زجاجي كريستال شفاف (Frosted Glass)</option>
                        <option value="brand_colors">ألوان المنصات الرسمية المصقولة</option>
                        <option value="minimal_dark">أسود أونيكس ميتاليك (Onyx Noir)</option>
                      </select>
                    </div>

                    {/* Screen Position */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">الموضع على الشاشة:</label>
                      <select
                        value={socialDockPosition}
                        onChange={(e) => setSocialDockPosition(e.target.value as any)}
                        className="w-full p-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
                      >
                        <option value="left">يسار الشاشة (Left)</option>
                        <option value="right">يمين الشاشة (Right)</option>
                      </select>
                    </div>

                    {/* Motion Animation */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">الموشن والحركة الفاخرة:</label>
                      <select
                        value={socialDockMotion}
                        onChange={(e) => setSocialDockMotion(e.target.value as any)}
                        className="w-full p-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
                      >
                        <option value="luxury_pulse">نبض ذهبي فاخر متكرر (Luxury Pulse)</option>
                        <option value="glow_aura">هالة ضوئية ناعمة (Soft Glow)</option>
                        <option value="subtle_bounce">حركة طفو مغناطيسية رشيقة</option>
                        <option value="static">هادئ بدون نبض (Quiet Luxury)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SUB-TAB 6: MARKETING & GAMIFICATION MODULES */}
          {storeSubTab === 'marketing' && (
            <div className="space-y-6">
              
              {/* Marketing Header & Sub-Navigation Pills */}
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#C5A059]" />
                      <h3 className="text-base font-bold text-gray-900">
                        إدارة المميزات التسويقية والألعاب التفاعلية المتقدمة
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C5A059] text-white">
                        4 مميزات حصرية
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      تحكم كامل ومفصل في كافة أدوات زيادة المبيعات، كويز العطور، تغليف الهدايا، عجلة الحظ، وصيد الورود الذهبية.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSwitchToStore && (
                      <button
                        type="button"
                        onClick={handleSaveAndPreview}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>معاينة في المتجر 👁️</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveStoreSettings}
                      className="px-4 py-2 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ التعديلات 💾</span>
                    </button>
                  </div>
                </div>

                {/* Module Selector Pills */}
                <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveMarketingModule('quiz')}
                    className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeMarketingModule === 'quiz'
                        ? 'bg-[#111111] text-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span>1. اختبار اكتشاف العطر (AI Scent Matcher Quiz)</span>
                    <span className={`w-2 h-2 rounded-full ${quizState.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMarketingModule('gifting')}
                    className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeMarketingModule === 'gifting'
                        ? 'bg-[#111111] text-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Gift className="w-4 h-4 text-[#C5A059]" />
                    <span>2. نظام الإهداء الفاخر (Luxury Gifting)</span>
                    <span className={`w-2 h-2 rounded-full ${giftingState.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMarketingModule('spin_wheel')}
                    className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeMarketingModule === 'spin_wheel'
                        ? 'bg-[#111111] text-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Dices className="w-4 h-4 text-[#C5A059]" />
                    <span>3. عجلة الحظ الفاخرة (Spin The Wheel)</span>
                    <span className={`w-2 h-2 rounded-full ${spinWheelState.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMarketingModule('treasure_hunt')}
                    className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeMarketingModule === 'treasure_hunt'
                        ? 'bg-[#111111] text-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Target className="w-4 h-4 text-[#C5A059]" />
                    <span>4. صيد الورود الذهبية (Golden Rose Hunt)</span>
                    <span className={`w-2 h-2 rounded-full ${treasureHuntState.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </button>
                </div>
              </div>

              {/* MODULE 1: AI SCENT / PRODUCT MATCHER QUIZ */}
              {activeMarketingModule === 'quiz' && (
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6 animate-fade-in">
                  
                  {/* Master Toggle & AI Toggle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-gray-900 block">تفعيل اختبار العطور (Quiz Matcher)</span>
                        <p className="text-xs text-gray-500 mt-0.5">إظهار زر ومودال الاختبار للعملاء في هيدر المتجر</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quizState.enabled}
                          onChange={(e) => setQuizState({ ...quizState, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
                      </label>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#C5A059]/15 to-amber-500/10 border border-[#C5A059]/40 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#C5A059]" />
                          <span className="font-bold text-sm text-amber-950">الترشيح بالذكاء الاصطناعي (Gemini AI)</span>
                        </div>
                        <p className="text-xs text-amber-900/80 mt-0.5">
                          تفعيل التوصية الديناميكية الفورية مع صياغة أسباب الترشيح
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(quizState.useAI)}
                          onChange={(e) => setQuizState({ ...quizState, useAI: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Header Texts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">عنوان نافذة الاختبار:</label>
                      <input
                        type="text"
                        value={quizState.title || ''}
                        onChange={(e) => setQuizState({ ...quizState, title: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">النص التوضيحي الفرعي:</label>
                      <input
                        type="text"
                        value={quizState.subtitle || ''}
                        onChange={(e) => setQuizState({ ...quizState, subtitle: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                  </div>

                  {/* Questions & Answers Builder */}
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">أسئلة الاختبار وخيارات الإجابة والمنتجات المرتبطة</h4>
                        <p className="text-xs text-gray-500">
                          يمكنك كتابة الأسئلة وتحديد الإجابات وربط كل إجابة بالمنتج المرشح من الكتالوج.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newQId = `q_${Date.now()}`;
                          const newQuestion: QuizQuestion = {
                            id: newQId,
                            question: 'سؤال جديد عن تفضيلاتك...',
                            options: [
                              { id: `o_${Date.now()}_1`, label: 'الخيار الأول', matchedProduct: Object.keys(catalogItems)[0] || '' },
                              { id: `o_${Date.now()}_2`, label: 'الخيار الثاني', matchedProduct: Object.keys(catalogItems)[1] || '' }
                            ]
                          };
                          setQuizState({
                            ...quizState,
                            questions: [...(quizState.questions || []), newQuestion]
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة سؤال جديد</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(quizState.questions || []).map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-6 h-6 rounded-full bg-[#111111] text-[#C5A059] text-xs font-bold flex items-center justify-center shrink-0">
                                {qIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={q.question}
                                onChange={(e) => {
                                  const updatedQs = [...quizState.questions];
                                  updatedQs[qIdx] = { ...updatedQs[qIdx], question: e.target.value };
                                  setQuizState({ ...quizState, questions: updatedQs });
                                }}
                                className="w-full p-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 bg-white focus:border-[#C5A059] outline-none"
                                placeholder="نص السؤال..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedQs = quizState.questions.filter((_, i) => i !== qIdx);
                                setQuizState({ ...quizState, questions: updatedQs });
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="حذف هذا السؤال"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Options of this question */}
                          <div className="space-y-2 pr-8">
                            <span className="text-[11px] font-bold text-gray-600 block">خيارات الإجابة والمنتج المقابل:</span>
                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={opt.id || oIdx} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                                  <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => {
                                      const updatedQs = [...quizState.questions];
                                      const updatedOpts = [...updatedQs[qIdx].options];
                                      updatedOpts[oIdx] = { ...updatedOpts[oIdx], label: e.target.value };
                                      updatedQs[qIdx] = { ...updatedQs[qIdx], options: updatedOpts };
                                      setQuizState({ ...quizState, questions: updatedQs });
                                    }}
                                    className="flex-1 p-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:border-[#C5A059] outline-none"
                                    placeholder="نص الخيار..."
                                  />
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-[10px] text-gray-400 shrink-0">المنتج المرتبط:</span>
                                    <select
                                      value={opt.matchedProduct || ''}
                                      onChange={(e) => {
                                        const updatedQs = [...quizState.questions];
                                        const updatedOpts = [...updatedQs[qIdx].options];
                                        updatedOpts[oIdx] = { ...updatedOpts[oIdx], matchedProduct: e.target.value };
                                        updatedQs[qIdx] = { ...updatedQs[qIdx], options: updatedOpts };
                                        setQuizState({ ...quizState, questions: updatedQs });
                                      }}
                                      className="p-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 bg-gray-50 focus:border-[#C5A059] outline-none max-w-xs truncate"
                                    >
                                      <option value="">-- اختر منتجاً من الكتالوج --</option>
                                      {Object.keys(catalogItems).map((pKey) => (
                                        <option key={pKey} value={pKey}>{pKey}</option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedQs = [...quizState.questions];
                                        const updatedOpts = updatedQs[qIdx].options.filter((_, i) => i !== oIdx);
                                        updatedQs[qIdx] = { ...updatedQs[qIdx], options: updatedOpts };
                                        setQuizState({ ...quizState, questions: updatedQs });
                                      }}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                      title="حذف الخيار"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedQs = [...quizState.questions];
                                const newOptId = `o_${Date.now()}`;
                                updatedQs[qIdx].options.push({
                                  id: newOptId,
                                  label: 'خيار جديد...',
                                  matchedProduct: Object.keys(catalogItems)[0] || ''
                                });
                                setQuizState({ ...quizState, questions: updatedQs });
                              }}
                              className="text-[11px] font-bold text-[#8C6D2D] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>إضافة خيار إجابة آخر</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 2: LUXURY GIFTING MODULE */}
              {activeMarketingModule === 'gifting' && (
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6 animate-fade-in">
                  
                  {/* Master Toggle */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-gray-900 block">تفعيل نظام الإهداء الفاخر (Luxury Gifting)</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        إظهار قسم "إرسال كهدية" في سلة المشتريات (CartDrawer) مع خيارات التغليف وكارت الإهداء وإخفاء السعر.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={giftingState.enabled}
                        onChange={(e) => setGiftingState({ ...giftingState, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
                    </label>
                  </div>

                  {/* Header Texts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">عنوان قسم الإهداء في السلة:</label>
                      <input
                        type="text"
                        value={giftingState.title || ''}
                        onChange={(e) => setGiftingState({ ...giftingState, title: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">النص التسويقي الفرعي:</label>
                      <input
                        type="text"
                        value={giftingState.subtitle || ''}
                        onChange={(e) => setGiftingState({ ...giftingState, subtitle: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                  </div>

                  {/* Packaging Options Manager */}
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">خيارات التغليف والأسعار الإضافية</h4>
                        <p className="text-xs text-gray-500">
                          يتم إضافة تكلفة التغليف المحددة تلقائياً إلى إجمالي السلة وتظهر تفاصيلها في الفاتورة والطلبات.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPkg: GiftPackagingOption = {
                            id: `pkg_${Date.now()}`,
                            name: 'نوع تغليف فاخر جديد',
                            price: 35,
                            description: 'وصف التغليف الفاخر والشريط وبطاقة الإهداء المرفقة',
                            enabled: true
                          };
                          setGiftingState({
                            ...giftingState,
                            packagingOptions: [...(giftingState.packagingOptions || []), newPkg]
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة خيار تغليف جديد</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(giftingState.packagingOptions || []).map((pkg, idx) => (
                        <div key={pkg.id || idx} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">اسم نوع التغليف:</label>
                              <input
                                type="text"
                                value={pkg.name}
                                onChange={(e) => {
                                  const updated = [...giftingState.packagingOptions];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setGiftingState({ ...giftingState, packagingOptions: updated });
                                }}
                                className="w-full p-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 bg-white focus:border-[#C5A059] outline-none"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">التكلفة الإضافية (ج.م):</label>
                              <input
                                type="number"
                                value={pkg.price}
                                onChange={(e) => {
                                  const updated = [...giftingState.packagingOptions];
                                  updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                                  setGiftingState({ ...giftingState, packagingOptions: updated });
                                }}
                                className="w-full p-2 border border-gray-200 rounded-xl text-xs font-bold text-center text-emerald-700 bg-white focus:border-[#C5A059] outline-none"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">حالة التفعيل:</label>
                              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs font-bold">
                                <input
                                  type="checkbox"
                                  checked={pkg.enabled !== false}
                                  onChange={(e) => {
                                    const updated = [...giftingState.packagingOptions];
                                    updated[idx] = { ...updated[idx], enabled: e.target.checked };
                                    setGiftingState({ ...giftingState, packagingOptions: updated });
                                  }}
                                  className="w-4 h-4 accent-[#C5A059]"
                                />
                                <span>متاح للعملاء بالسلة</span>
                              </label>
                            </div>
                            <div className="sm:col-span-2 text-left pt-3 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = giftingState.packagingOptions.filter((_, i) => i !== idx);
                                  setGiftingState({ ...giftingState, packagingOptions: updated });
                                }}
                                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors cursor-pointer"
                              >
                                حذف الخيار
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">وصف التغليف للعميل:</label>
                            <input
                              type="text"
                              value={pkg.description || ''}
                              onChange={(e) => {
                                const updated = [...giftingState.packagingOptions];
                                updated[idx] = { ...updated[idx], description: e.target.value };
                                setGiftingState({ ...giftingState, packagingOptions: updated });
                              }}
                              className="w-full p-2 border border-gray-200 rounded-xl text-xs text-gray-600 bg-white focus:border-[#C5A059] outline-none"
                              placeholder="وصف مكونات التغليف والكارت..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 3: LUXURY SPIN THE WHEEL */}
              {activeMarketingModule === 'spin_wheel' && (
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6 animate-fade-in">
                  
                  {/* Master Toggle & Triggers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-gray-900 block">تفعيل عجلة الحظ (Spin The Wheel)</span>
                        <p className="text-xs text-gray-500 mt-0.5">ظهور العجلة للعملاء الجدد مع فرصة ربح خصومات فورية</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={spinWheelState.enabled}
                          onChange={(e) => setSpinWheelState({ ...spinWheelState, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                      <span className="font-bold text-sm text-gray-900 block">وقت وطريقة ظهور العجلة (Trigger):</span>
                      <div className="flex flex-wrap gap-4 text-xs font-bold">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="spinTrigger"
                            checked={spinWheelState.triggerType === 'on_enter'}
                            onChange={() => setSpinWheelState({ ...spinWheelState, triggerType: 'on_enter' })}
                            className="accent-[#C5A059]"
                          />
                          <span>عند الدخول للمتجر (On Enter)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="spinTrigger"
                            checked={spinWheelState.triggerType === 'exit_intent'}
                            onChange={() => setSpinWheelState({ ...spinWheelState, triggerType: 'exit_intent' })}
                            className="accent-[#C5A059]"
                          />
                          <span>عند محاولة الخروج (Exit Intent)</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="text-gray-500">مدة التأخير قبل الظهور (ثواني):</span>
                        <input
                          type="number"
                          value={spinWheelState.triggerDelaySeconds || 4}
                          onChange={(e) => setSpinWheelState({ ...spinWheelState, triggerDelaySeconds: parseInt(e.target.value) || 0 })}
                          className="w-16 p-1 border border-gray-200 rounded-lg text-center font-bold font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Wheel Size Selector (User Request) */}
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#C5A059]/15 to-amber-500/10 border border-[#C5A059]/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dices className="w-4 h-4 text-[#C5A059]" />
                        <span className="font-bold text-sm text-gray-900">التحكم في حجم ومقاس عجلة الحظ (Wheel Size):</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#8C6D2D] bg-white px-2.5 py-1 rounded-full border border-[#C5A059]/30">
                        {spinWheelState.wheelSize === 'compact' ? 'صغير مدمج (220px)' :
                         spinWheelState.wheelSize === 'large' ? 'كبير بارز (340px)' :
                         spinWheelState.wheelSize === 'xlarge' ? 'ضخم استعراضي (400px)' :
                         'متوسط قياسي (280px)'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      اختر الحجم المناسب لمودال وعجلة الحظ ليتطابق مع رغبتك وتفضيلات زوار المتجر:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSpinWheelState({ ...spinWheelState, wheelSize: 'compact' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          spinWheelState.wheelSize === 'compact'
                            ? 'bg-[#111111] text-[#C5A059] border-[#C5A059] shadow-xs ring-2 ring-[#C5A059]/40'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm mb-0.5">🔍</div>
                        <div>صغير مدمج</div>
                        <span className="text-[10px] text-gray-400 block font-normal">شاشات صغيرة (220px)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSpinWheelState({ ...spinWheelState, wheelSize: 'standard' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          (!spinWheelState.wheelSize || spinWheelState.wheelSize === 'standard')
                            ? 'bg-[#111111] text-[#C5A059] border-[#C5A059] shadow-xs ring-2 ring-[#C5A059]/40'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm mb-0.5">⚖️</div>
                        <div>متوسط قياسي</div>
                        <span className="text-[10px] text-gray-400 block font-normal">متوازن وافتراضي (280px)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSpinWheelState({ ...spinWheelState, wheelSize: 'large' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          spinWheelState.wheelSize === 'large'
                            ? 'bg-[#111111] text-[#C5A059] border-[#C5A059] shadow-xs ring-2 ring-[#C5A059]/40'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm mb-0.5">🌟</div>
                        <div>كبير بارز</div>
                        <span className="text-[10px] text-gray-400 block font-normal">رؤية واضحة (340px)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSpinWheelState({ ...spinWheelState, wheelSize: 'xlarge' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          spinWheelState.wheelSize === 'xlarge'
                            ? 'bg-[#111111] text-[#C5A059] border-[#C5A059] shadow-xs ring-2 ring-[#C5A059]/40'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm mb-0.5">👑</div>
                        <div>ضخم فاخر</div>
                        <span className="text-[10px] text-gray-400 block font-normal">شاشات واسعة VIP (400px)</span>
                      </button>
                    </div>
                  </div>

                  {/* Texts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">عنوان العجلة:</label>
                      <input
                        type="text"
                        value={spinWheelState.title || ''}
                        onChange={(e) => setSpinWheelState({ ...spinWheelState, title: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">الوصف الفرعي:</label>
                      <input
                        type="text"
                        value={spinWheelState.subtitle || ''}
                        onChange={(e) => setSpinWheelState({ ...spinWheelState, subtitle: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">نص زر التدوير:</label>
                      <input
                        type="text"
                        value={spinWheelState.buttonLabel || ''}
                        onChange={(e) => setSpinWheelState({ ...spinWheelState, buttonLabel: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                  </div>

                  {/* Prizes Manager with Probabilities */}
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">جوائز أقسام العجلة ونسب الاحتمال (Probabilities)</h4>
                        <p className="text-xs text-gray-500">
                          حدد الجائزة وكود الخصم ونسبة احتمال وقوف المؤشر عليها (المجموع الموصى به: 100%).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPrize: SpinWheelPrize = {
                            id: `p_${Date.now()}`,
                            label: 'خصم 10% فوري',
                            promoCode: 'LUCKY10',
                            discountPercent: 10,
                            probability: 10,
                            color: '#C5A059',
                            textColor: '#111111'
                          };
                          setSpinWheelState({
                            ...spinWheelState,
                            prizes: [...(spinWheelState.prizes || []), newPrize]
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة جائزة جديدة</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-700 font-bold bg-gray-50/70">
                            <th className="py-2.5 px-3">اسم الجائزة (يظهر بالعجلة)</th>
                            <th className="py-2.5 px-3">كود الخصم</th>
                            <th className="py-2.5 px-3 text-center">الخصم %</th>
                            <th className="py-2.5 px-3 text-center">نسبة الاحتمال (Weight %)</th>
                            <th className="py-2.5 px-3 text-center">لون الخلفية</th>
                            <th className="py-2.5 px-3 text-center">لون الخط</th>
                            <th className="py-2.5 px-3 text-left">حذف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(spinWheelState.prizes || []).map((prize, idx) => (
                            <tr key={prize.id || idx} className="hover:bg-gray-50/50">
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={prize.label}
                                  onChange={(e) => {
                                    const updated = [...spinWheelState.prizes];
                                    updated[idx] = { ...updated[idx], label: e.target.value };
                                    setSpinWheelState({ ...spinWheelState, prizes: updated });
                                  }}
                                  className="w-full p-1.5 border border-gray-200 rounded-lg text-xs font-bold"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={prize.promoCode}
                                  onChange={(e) => {
                                    const updated = [...spinWheelState.prizes];
                                    updated[idx] = { ...updated[idx], promoCode: e.target.value.toUpperCase() };
                                    setSpinWheelState({ ...spinWheelState, prizes: updated });
                                  }}
                                  className="w-full p-1.5 border border-gray-200 rounded-lg text-xs font-mono font-bold text-center"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  value={prize.discountPercent}
                                  onChange={(e) => {
                                    const updated = [...spinWheelState.prizes];
                                    updated[idx] = { ...updated[idx], discountPercent: parseInt(e.target.value) || 0 };
                                    setSpinWheelState({ ...spinWheelState, prizes: updated });
                                  }}
                                  className="w-16 p-1.5 border border-gray-200 rounded-lg text-xs font-bold text-center text-emerald-700"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  value={prize.probability}
                                  onChange={(e) => {
                                    const updated = [...spinWheelState.prizes];
                                    updated[idx] = { ...updated[idx], probability: parseInt(e.target.value) || 0 };
                                    setSpinWheelState({ ...spinWheelState, prizes: updated });
                                  }}
                                  className="w-16 p-1.5 border border-gray-200 rounded-lg text-xs font-bold text-center text-amber-700"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="color"
                                  value={prize.color || '#C5A059'}
                                  onChange={(e) => {
                                    const updated = [...spinWheelState.prizes];
                                    updated[idx] = { ...updated[idx], color: e.target.value };
                                    setSpinWheelState({ ...spinWheelState, prizes: updated });
                                  }}
                                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer mx-auto block"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="color"
                                  value={prize.textColor || '#111111'}
                                  onChange={(e) => {
                                    const updated = [...spinWheelState.prizes];
                                    updated[idx] = { ...updated[idx], textColor: e.target.value };
                                    setSpinWheelState({ ...spinWheelState, prizes: updated });
                                  }}
                                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer mx-auto block"
                                />
                              </td>
                              <td className="py-2 px-3 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = spinWheelState.prizes.filter((_, i) => i !== idx);
                                    setSpinWheelState({ ...spinWheelState, prizes: updated });
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 4: GOLDEN ROSE TREASURE HUNT */}
              {activeMarketingModule === 'treasure_hunt' && (
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6 animate-fade-in">
                  
                  {/* Master Toggle */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-gray-900 block">تفعيل لعبة صيد الورود الذهبية (Golden Rose Hunt)</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        إخفاء أيقونات الورود الذهبية التفاعلية داخل كروت منتجات معينة مع منح جائزة عند جمعها.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={treasureHuntState.enabled}
                        onChange={(e) => setTreasureHuntState({ ...treasureHuntState, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
                    </label>
                  </div>

                  {/* Rules and Rewards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">عدد الورود المطلوب إيجادها:</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={treasureHuntState.targetCount || 3}
                        onChange={(e) => setTreasureHuntState({ ...treasureHuntState, targetCount: parseInt(e.target.value) || 3 })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs font-bold text-center focus:border-[#C5A059] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">كود خصم الجائزة:</label>
                      <input
                        type="text"
                        value={treasureHuntState.rewardPromoCode || 'GOLDENROSE20'}
                        onChange={(e) => setTreasureHuntState({ ...treasureHuntState, rewardPromoCode: e.target.value.toUpperCase() })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs font-bold text-center font-mono text-amber-700 focus:border-[#C5A059] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">نسبة الخصم الممنوحة %:</label>
                      <input
                        type="number"
                        value={treasureHuntState.rewardDiscountPercent || 20}
                        onChange={(e) => setTreasureHuntState({ ...treasureHuntState, rewardDiscountPercent: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs font-bold text-center text-emerald-700 focus:border-[#C5A059] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">عنوان رسالة التهنئة والربح:</label>
                      <input
                        type="text"
                        value={treasureHuntState.rewardTitle || ''}
                        onChange={(e) => setTreasureHuntState({ ...treasureHuntState, rewardTitle: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">نص رسالة الجائزة والاحتفال:</label>
                      <input
                        type="text"
                        value={treasureHuntState.rewardMessage || ''}
                        onChange={(e) => setTreasureHuntState({ ...treasureHuntState, rewardMessage: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#C5A059] outline-none"
                      />
                    </div>
                  </div>

                  {/* Target Products Selector */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">المنتجات التي ستظهر فيها الوردة الذهبية المخفية:</h4>
                        <p className="text-xs text-gray-500">
                          اختر المنتجات من الكتالوج التي تود إخفاء أيقونة الوردة الذهبية بداخل كروتها في المتجر.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#8C6D2D]">
                        المحدد حالياً: {(treasureHuntState.placedProductKeys || []).length} منتج
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-3 bg-gray-50 rounded-2xl border border-gray-200">
                      {Object.keys(catalogItems).map((pKey) => {
                        const isPlaced = (treasureHuntState.placedProductKeys || []).includes(pKey);
                        return (
                          <label
                            key={pKey}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              isPlaced
                                ? 'bg-white border-[#C5A059] font-bold text-amber-950 shadow-2xs'
                                : 'bg-white/60 border-gray-200 text-gray-700 hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isPlaced}
                              onChange={(e) => {
                                const current = treasureHuntState.placedProductKeys || [];
                                const updated = e.target.checked
                                  ? [...current, pKey]
                                  : current.filter(k => k !== pKey);
                                setTreasureHuntState({ ...treasureHuntState, placedProductKeys: updated });
                              }}
                              className="w-4 h-4 accent-[#C5A059]"
                            />
                            <span className="truncate" title={pKey}>🌹 {pKey}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Sticky Bottom Save Action Footer */}
          <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {saveSuccessNotice 
                  ? 'تم حفظ ونشر كافة التعديلات في المتجر الإلكتروني بنجاح!' 
                  : 'جميع التعديلات على الألوان والنصوص تُحفظ في قاعدة البيانات ويراها العميل فوراً.'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onSwitchToStore && (
                <button
                  type="button"
                  onClick={handleSaveAndPreview}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-[#C5A059]" />
                  <span>معاينة النتيجة الآن</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveStoreSettings}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#111111] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>💾 حفظ ونشر إعدادات المتجر</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 3. Users & Permissions Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          {/* Add Staff Form */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#C5A059]" />
              <span>إضافة موظف جديد بنظام الصلاحيات والبريد الشخصي</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم الموظف *</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="مثال: ياسمين أحمد"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم المستخدم / كود الدخول (PIN) *</label>
                <input
                  type="text"
                  value={newStaffCode}
                  onChange={(e) => setNewStaffCode(e.target.value)}
                  placeholder="مثال: YASMEEN أو 102"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-mono uppercase focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">كلمة المرور *</label>
                <input
                  type="text"
                  value={newStaffPass}
                  onChange={(e) => setNewStaffPass(e.target.value)}
                  placeholder="كلمة مرور الموظف"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl font-mono focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">البريد الإلكتروني الشخصي (للاستعادة)</label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddStaff}
                  className="w-full py-2.5 px-4 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-center"
                >
                  ➕ إضافة الموظف
                </button>
              </div>
            </div>
          </div>

          {/* Email Dispatch Success Alert Banner */}
          {emailNoticeUser && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">{emailNoticeUser}</span>
              </div>
              <button
                type="button"
                onClick={() => setEmailNoticeUser(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Existing Staff Table with Names & Passwords & Email & Permissions */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  سجل الموظفين والمصرح لهم (عرض الأسماء وكلمات المرور والصلاحيات)
                </h3>
                <p className="text-[11px] text-gray-500">
                  يمكن للادمن رؤية وتغيير كلمات المرور وإرسالها لإيميل الموظف الشخصي، وتعيين الصلاحيات المخصصة.
                </p>
              </div>

              <button
                onClick={handleSaveUsers}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>💾 حفظ التعديلات على الصلاحيات والحسابات</span>
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(usersState).map(([code, u]) => {
                const isPassVisible = Boolean(visiblePasswords[code]);
                return (
                  <div key={code} className="p-4 sm:p-5 border border-gray-200 rounded-2xl bg-gray-50/60 space-y-4 transition-all">
                    
                    {/* Header Row: Username, Name, Role & Action Buttons */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 bg-[#111111] text-[#C5A059] rounded-xl text-xs font-mono font-bold">
                          PIN: {code}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900">{u.name}</h4>
                        {u.role === 'admin' ? (
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                            مدير عام (كافة الصلاحيات)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                            موظف
                          </span>
                        )}
                      </div>

                      {/* Admin Quick Credentials & Edit Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditEmployee(code)}
                          className="px-3 py-1.5 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="تعديل كافة بيانات الموظف والـ PIN"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>تعديل الموظف والـ PIN</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAdminChangePassword(code)}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="تغيير كلمة المرور لهذا الموظف"
                        >
                          <Key className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>تغيير كلمة المرور</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAdminSendCredentialsByEmail(code)}
                          className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#b08d47] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="إرسال بيانات الدخول إلى البريد الإلكتروني الشخصي للموظف"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال الباسورد للإيميل</span>
                        </button>

                        {code !== 'ADMIN' && (
                          <button
                            onClick={() => {
                              const updated = { ...usersState };
                              delete updated[code];
                              setUsersState(updated);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-white"
                            title="حذف الموظف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Credentials & Email Details Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-gray-200">
                      {/* Password Reveal (Requested: يظهرله الاسماء وكلمات السر) */}
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-600">كلمة المرور الحالية:</span>
                          <span className="font-mono font-bold text-gray-900 text-sm">
                            {isPassVisible ? (u.password || 'بدون باسورد') : '••••••••'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePasswordVisibility(code)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                          title={isPassVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                          {isPassVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#C5A059]" />}
                        </button>
                      </div>

                      {/* Linked Personal Email */}
                      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-600 shrink-0">البريد الشخصي:</span>
                        <input
                          type="email"
                          value={u.email || ''}
                          onChange={(e) => {
                            setUsersState({
                              ...usersState,
                              [code]: { ...u, email: e.target.value }
                            });
                          }}
                          placeholder="أدخل البريد الشخصي لربط الحساب"
                          className="w-full bg-white px-2 py-1 rounded-lg border border-gray-200 font-mono text-xs focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                    </div>

                    {/* Granular permissions checkboxes (Requested: يقدر يدي الصلاحيات ويغيرها) */}
                    {u.role !== 'admin' && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-[11px] font-semibold text-gray-600 block mb-2">
                          صلاحيات هذا الموظف (حدد ما يمكنه إدارته):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {PERMISSIONS_LIST.map((perm) => (
                            <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-gray-700 bg-white p-2 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                              <input
                                type="checkbox"
                                checked={getNormalizedPerms(u.permissions).includes(perm.id) || getNormalizedPerms(u.permissions).includes('all')}
                                onChange={() => handleToggleStaffPerm(code, perm.id)}
                                className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                              />
                              <span>{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* FULL PRODUCT DETAILS EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 md:p-8 font-arabic my-8 border border-gray-100 space-y-5 text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-base font-bold text-gray-900">
                  تعديل تفاصيل المنتج ونشره بالمتجر
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Image Preview & Title Pill */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-4">
              <img
                src={fixImageLink(editingProduct.image) || 'https://via.placeholder.com/80'}
                alt={editingProduct.name}
                className="w-16 h-16 object-cover rounded-xl border border-gray-200 shrink-0 bg-white"
              />
              <div className="min-w-0">
                <span className="text-[11px] text-[#C5A059] font-bold block">{editingProduct.group}</span>
                <h4 className="text-sm font-bold text-gray-900">{editingProduct.name}</h4>
                <p className="text-[11px] text-gray-500 font-mono">
                  المفتاح الأصلي: {editingProduct.originalKey}
                </p>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveProductModal} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">اسم المجموعة *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.group}
                    onChange={(e) => setEditingProduct({ ...editingProduct, group: e.target.value })}
                    placeholder="مثال: BODY SPLASH"
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">اسم العطر / المنتج *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="مثال: Bright Crystal"
                    className="w-full p-2.5 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">التصنيف *</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-white font-bold focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="FOR WOMEN">FOR WOMEN (نسائي)</option>
                    <option value="FOR MEN">FOR MEN (رجالي)</option>
                    <option value="UNISEX">UNISEX (للجنسين)</option>
                  </select>
                </div>
              </div>

              {/* Description (CRITICAL for user) */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  وصف المنتج ونوتات العطر (يظهر مباشرة للعميل في كارت المنتج ونافذة التفاصيل) *:
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="اكتب وصف العطر، النوتات العليا والوسطى والقاعدة، الثبات، والمناسبات المقترحة..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059] leading-relaxed"
                />
              </div>

              {/* Main Image with Local Upload or Direct URL */}
              <div>
                <ImageUploadInput
                  label="الصورة الرئيسية للمنتج (رفع من الهاتف/اللاب توب أو لصق رابط):"
                  value={editingProduct.image}
                  onChange={(newUrl) => setEditingProduct({ ...editingProduct, image: newUrl })}
                  placeholder="https://... أو اضغط لرفع صورة من جهازك"
                  previewHeight="h-28"
                />
              </div>

              {/* Additional Product Images (Multiple Images Support) */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    📸 صور إضافية للمنتج (يستطيع العميل تحريكها وتصفحها باللمس أو الأسهم):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingProduct.images || [];
                      setEditingProduct({ ...editingProduct, images: [...current, ''] });
                    }}
                    className="px-2.5 py-1 bg-white border border-gray-300 hover:border-[#C5A059] text-gray-700 hover:text-[#C5A059] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ➕ إضافة صورة أخرى
                  </button>
                </div>

                {(!editingProduct.images || editingProduct.images.length === 0) ? (
                  <p className="text-[11px] text-gray-400">
                    لا توجد صور إضافية. انقر على "إضافة صورة أخرى" لتوفير معرض صور كامل للمنتج.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editingProduct.images.map((imgUrl, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={imgUrl}
                          onChange={(e) => {
                            const next = [...(editingProduct.images || [])];
                            next[idx] = e.target.value;
                            setEditingProduct({ ...editingProduct, images: next });
                          }}
                          placeholder="رابط الصورة الإضافية (https://...)"
                          className="flex-1 p-2 text-xs border border-gray-200 rounded-lg bg-white font-mono"
                          dir="ltr"
                        />
                        {imgUrl && (
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-8 h-8 rounded-md object-cover border border-gray-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const next = (editingProduct.images || []).filter((_, i) => i !== idx);
                            setEditingProduct({ ...editingProduct, images: next });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs"
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes and Price Variants Support */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-800">
                    <input
                      type="checkbox"
                      checked={editingProduct.hasSizes}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const currentSizes = editingProduct.sizes && editingProduct.sizes.length > 0 
                          ? editingProduct.sizes 
                          : [
                              { name: '50 مل', price: editingProduct.defaultPrice || 250, originalPrice: (editingProduct.defaultPrice || 250) + 50 },
                              { name: '100 مل', price: (editingProduct.defaultPrice || 250) * 1.7, originalPrice: ((editingProduct.defaultPrice || 250) * 1.7) + 100 }
                            ];
                        setEditingProduct({ 
                          ...editingProduct, 
                          hasSizes: checked,
                          sizes: currentSizes
                        });
                      }}
                      className="text-[#C5A059]"
                    />
                    <span>تفعيل خيارات الأحجام / السعات بأسعار مختلفة (يختارها العميل قبل الشراء)</span>
                  </label>
                  {editingProduct.hasSizes && (
                    <button
                      type="button"
                      onClick={() => {
                        const current = editingProduct.sizes || [];
                        setEditingProduct({
                          ...editingProduct,
                          sizes: [...current, { name: '', price: editingProduct.defaultPrice || 0 }]
                        });
                      }}
                      className="px-2.5 py-1 bg-white border border-amber-300 hover:border-[#C5A059] text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ➕ إضافة حجم جديد
                    </button>
                  )}
                </div>

                {editingProduct.hasSizes && (
                  <div className="space-y-2 pt-1">
                    {(editingProduct.sizes || []).map((sz, sIdx) => (
                      <div key={sIdx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-gray-200">
                        <div className="col-span-5">
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5">اسم الحجم (مثال: 50 مل أو S):</label>
                          <input
                            type="text"
                            value={sz.name}
                            onChange={(e) => {
                              const next = [...(editingProduct.sizes || [])];
                              next[sIdx] = { ...next[sIdx], name: e.target.value };
                              setEditingProduct({ ...editingProduct, sizes: next });
                            }}
                            placeholder="مثال: 50 مل"
                            className="w-full p-1.5 text-xs border border-gray-200 rounded-md focus:border-[#C5A059] outline-none font-bold"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-[10px] font-bold text-emerald-700 mb-0.5">السعر المطلوب (ج.م):</label>
                          <input
                            type="number"
                            value={sz.price}
                            onChange={(e) => {
                              const next = [...(editingProduct.sizes || [])];
                              next[sIdx] = { ...next[sIdx], price: parseFloat(e.target.value) || 0 };
                              setEditingProduct({ ...editingProduct, sizes: next });
                            }}
                            className="w-full p-1.5 text-xs border border-gray-200 rounded-md text-center font-bold text-emerald-700 focus:border-[#C5A059] outline-none"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-[10px] font-bold text-gray-400 mb-0.5">سعر قبل الخصم (اختياري):</label>
                          <input
                            type="number"
                            value={sz.originalPrice || ''}
                            onChange={(e) => {
                              const next = [...(editingProduct.sizes || [])];
                              next[sIdx] = { ...next[sIdx], originalPrice: parseFloat(e.target.value) || undefined };
                              setEditingProduct({ ...editingProduct, sizes: next });
                            }}
                            placeholder="شطب"
                            className="w-full p-1.5 text-xs border border-gray-200 rounded-md text-center text-gray-500 focus:border-[#C5A059] outline-none"
                          />
                        </div>
                        <div className="col-span-1 text-center pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              const next = (editingProduct.sizes || []).filter((_, i) => i !== sIdx);
                              setEditingProduct({ ...editingProduct, sizes: next });
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="حذف هذا الحجم"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Collection Cover Image */}
              <div>
                <ImageUploadInput
                  label="صورة غلاف المجموعة (Shop by Collection) - تفتح منتجات المجموعة عند النقر عليها:"
                  value={editingProduct.collectionImage || ''}
                  onChange={(newUrl) => setEditingProduct({ ...editingProduct, collectionImage: newUrl })}
                  placeholder="رابط صورة كارت المجموعة أو ارفع صورة من جهازك"
                  previewHeight="h-24"
                />
              </div>

              {/* Prices and Inventory */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">سعر البيع للعميل (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.defaultPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, defaultPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-center font-bold text-emerald-700 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">تكلفة الصنع (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.cost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-center font-bold text-red-600 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">الكمية بالمخزن</label>
                  <input
                    type="number"
                    value={editingProduct.stockQty}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQty: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-center font-bold focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">حد تنبيه الانخفاض</label>
                  <input
                    type="number"
                    value={editingProduct.alertLimit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, alertLimit: parseInt(e.target.value) || 3 })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-center font-bold focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Batch & Expiry Tracking (Requirement #4) */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>تتبع تواريخ الصلاحية والتشغيلات (Batch & Expiry Tracking):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      رقم التشغيلة (Batch Number):
                    </label>
                    <input
                      type="text"
                      value={editingProduct.batchNumber || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, batchNumber: e.target.value })}
                      placeholder="مثال: BATCH-2026-A1"
                      className="w-full p-2 border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#C5A059] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      تاريخ انتهاء الصلاحية (Expiry Date):
                    </label>
                    <input
                      type="date"
                      value={editingProduct.expiryDate || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, expiryDate: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#C5A059] bg-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800">
                  💡 تذكير: المنتجات التي تنتهي صلاحيتها خلال 3 أشهر ستظهر تلقائياً في شريط التنبيهات بأعلى لوحة الإدارة لعمل عروض تصفية سريعة.
                </p>
              </div>

              {/* Storefront Display Checkboxes */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap items-center justify-between gap-3 font-semibold">
                <label className="flex items-center gap-2 cursor-pointer text-gray-800">
                  <input
                    type="checkbox"
                    checked={editingProduct.showStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, showStock: e.target.checked })}
                  />
                  <span>إظهار الكمية المتبقية للعميل</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#8C6D2D]">
                  <input
                    type="checkbox"
                    checked={editingProduct.isBestseller}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isBestseller: e.target.checked })}
                  />
                  <span>★ تمييز كـ Bestseller (يظهر في قسم الأكثر طلباً بأعلى المتجر)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-red-600">
                  <input
                    type="checkbox"
                    checked={editingProduct.isOutOfStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isOutOfStock: e.target.checked })}
                  />
                  <span>إيقاف العرض مؤقتاً (نفدت الكمية)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleSaveProductModal()}
                  className="flex-1 py-3 px-6 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl font-bold transition-all shadow-md cursor-pointer text-center active:scale-95 btn-pulsing"
                >
                  💾 حفظ التعديلات ونشرها للمتجر الإلكتروني فوراً
                </button>

                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FULL EMPLOYEE DETAILS & PIN EDIT MODAL (User Request) */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 md:p-8 font-arabic my-8 border border-gray-100 space-y-5 text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-base font-bold text-gray-900">
                  تعديل بيانات وحساب الموظف والـ PIN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeModal} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">اسم الموظف *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    placeholder="مثال: سارة خالد"
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">كود الدخول / PIN *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.code}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, code: e.target.value })}
                    placeholder="مثال: STAFF1"
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059] font-mono font-bold uppercase"
                  />
                  <span className="text-[10px] text-gray-400">الكود أو الرقم المستخدم لتسجيل الدخول</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">كلمة المرور الحالية</label>
                  <input
                    type="text"
                    value={editingEmployee.password || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, password: e.target.value })}
                    placeholder="كلمة المرور"
                    className="w-full p-2.5 border border-gray-200 rounded-xl font-mono focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">البريد الإلكتروني الشخصي</label>
                  <input
                    type="email"
                    value={editingEmployee.email || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">الدور الوظيفي والصلاحيات</label>
                <select
                  value={editingEmployee.role}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value as 'admin' | 'user' })}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-white font-semibold"
                >
                  <option value="user">موظف (صلاحيات مخصصة محددة)</option>
                  <option value="admin">مدير عام (كافة الصلاحيات كاملة)</option>
                </select>
              </div>

              {/* Permissions Checkboxes if user/staff */}
              {editingEmployee.role === 'user' && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <label className="block font-bold text-gray-800 text-[11px]">تخصيص الصلاحيات المسموحة:</label>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {PERMISSIONS_LIST.map((perm) => (
                      <label key={perm.id} className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                        <input
                          type="checkbox"
                          checked={getNormalizedPerms(editingEmployee.permissions).includes(perm.id)}
                          onChange={(e) => {
                            const curPerms = getNormalizedPerms(editingEmployee.permissions);
                            const updated = e.target.checked
                              ? [...curPerms, perm.id]
                              : curPerms.filter(p => p !== perm.id);
                            setEditingEmployee({ ...editingEmployee, permissions: updated });
                          }}
                          className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons with pulse feedback */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleSaveEmployeeModal()}
                  className="flex-1 py-3 px-6 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl font-bold transition-all shadow-md cursor-pointer text-center active:scale-95 btn-pulsing"
                >
                  💾 حفظ وتطبيق تعديلات الموظف فوراً
                </button>

                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
