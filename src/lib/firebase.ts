import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove } from 'firebase/database';
import { 
  RoseeDatabase, 
  AppSettings, 
  ProductCatalog, 
  UserAccount, 
  Order, 
  CustomerReview, 
  ReelItem, 
  CollectionGroup,
  AbandonedCart,
  BackInStockRequest
} from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyD6yrJSnHm_ATTNoRB5q_Wi0_jeKvh4c-g",
  authDomain: "rosee-erp.firebaseapp.com",
  databaseURL: "https://rosee-erp-default-rtdb.firebaseio.com",
  projectId: "rosee-erp",
  storageBucket: "rosee-erp.firebasestorage.app",
  messagingSenderId: "182782113100",
  appId: "1:182782113100:web:59b71aa20c56286d9e0be9",
  measurementId: "G-H4DRX7B92B"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

export const DEFAULT_SETTINGS: AppSettings = {
  loyaltyPointValue: 1,
  instapayAccount: "rosee.cosmo@instapay",
  socialLinks: {
    insta: "https://www.instagram.com/rosee_cosmo?stkn=dHp3ZmZoY2QwNHRn&utm_source=qr",
    fb: "https://www.facebook.com/share/19ku6pTCYz/?mibextid=wwXIfr",
    whatsapp: "201117237246",
    tiktok: "https://www.tiktok.com/@rose.cosmetics822"
  },
  marqueeText: "✨ توصيل سريع لجميع المحافظات ✨ خصومات حصرية على تشكيلة العطور الجديدة ✨ الدفع عند الاستلام وانستاباي متاح ✨ تسوقي الآن من ROSÉE ✨",
  trustBadges: [
    { icon: 'leaf', text: 'مكونات طبيعية آمنة' },
    { icon: 'truck', text: 'شحن سريع لكافة المحافظات' },
    { icon: 'shield', text: 'جودة استثنائية مضمونة' },
    { icon: 'lock', text: 'دفع آمن عند الاستلام' }
  ],
  resendApiKey: '',
  resendSenderEmail: 'Rosée Security <onboarding@resend.dev>'
};

export const DEFAULT_CATALOG: ProductCatalog = {
  'المجموعة الأساسية: Bunny Rose (FOR WOMEN)': {
    defaultPrice: 280,
    cost: 110,
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80'
    ],
    stockQty: 25,
    alertLimit: 5,
    showStock: true,
    isOutOfStock: false,
    isBestseller: true,
    hasSizes: true,
    sizes: [
      { name: '50 مل (عبوة أنيقة)', price: 280, originalPrice: 350 },
      { name: '100 مل (حجم ملكي مضاعف)', price: 490, originalPrice: 600 }
    ],
    collectionName: 'مجموعة العطور النسائية الفاخرة',
    description: 'عطر زهري منعش مع نفحات الورد الدمشقي والمسك الأبيض الرقيق، يمنحكِ إحساساً بالنقاء طوال اليوم.',
    batchNumber: 'ROSEE-B2025-01',
    expiryDate: '2026-06-30',
    productionDate: '2024-06-01'
  },
  'المجموعة الأساسية: Velvet Noir (FOR MEN)': {
    defaultPrice: 320,
    cost: 130,
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80'
    ],
    stockQty: 18,
    alertLimit: 4,
    showStock: true,
    isOutOfStock: false,
    isBestseller: true,
    hasSizes: true,
    sizes: [
      { name: '50 مل (تركيز عالي)', price: 320, originalPrice: 400 },
      { name: '100 مل (حجم مكثف)', price: 560, originalPrice: 700 }
    ],
    collectionName: 'تشكيلة العطور الشرقية والرجالية',
    description: 'مزيج شرقي دافئ من خشب الصندل والعنبر والعود الفاخر، يعكس حضوراً آسراً وشخصية واثقة.',
    batchNumber: 'ROSEE-B2024-09',
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    productionDate: '2023-11-15'
  },
  'مجموعة العناية: Rose Gold Elixir (UNISEX)': {
    defaultPrice: 240,
    cost: 95,
    image: 'https://images.unsplash.com/photo-1608248597359-0f6667115858?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1608248597359-0f6667115858?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
    ],
    stockQty: 30,
    alertLimit: 6,
    showStock: true,
    isOutOfStock: false,
    isBestseller: true,
    hasSizes: true,
    sizes: [
      { name: '30 مل (قطارة ذهبية)', price: 240, originalPrice: 300 },
      { name: '50 مل (عبوة عناية كاملة)', price: 380, originalPrice: 480 }
    ],
    collectionName: 'مجموعة العناية بالبشرة والذهب',
    description: 'سيروم زيتي مخملي يغذي البشرة بقطرات الذهب عيار 24 ومستخلص ثمر الورد النقي، لإشراقة صحية تدوم.',
    batchNumber: 'ROSEE-B2025-03',
    expiryDate: '2026-12-31',
    productionDate: '2024-12-01'
  },
  'المجموعة الأساسية: Pure Jasmine Glow (FOR WOMEN)': {
    defaultPrice: 260,
    cost: 105,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80'
    ],
    stockQty: 14,
    alertLimit: 3,
    showStock: true,
    isOutOfStock: false,
    isBestseller: false,
    hasSizes: false,
    collectionName: 'مجموعة العطور النسائية الفاخرة',
    description: 'عبير الياسمين الملكي مع لمسات الفانيليا مدعوماً بزيوت ترطيب عميقة تدوم لساعات طويلة.',
    batchNumber: 'ROSEE-B2024-11',
    expiryDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    productionDate: '2024-01-10'
  }
};

export const DEFAULT_REELS: ReelItem[] = [
  {
    id: 'REEL-1',
    title: 'تجربة ثبات وفوحان عطر Bunny Rose الوردي ✨',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-spraying-perfume-on-her-neck-41484-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    productName: 'المجموعة الأساسية: Bunny Rose (FOR WOMEN)',
    duration: '00:15',
    likesCount: 1420,
    creatorHandle: '@rosee_cosmetics',
    status: 'published'
  },
  {
    id: 'REEL-2',
    title: 'سر نضارة البشرة مع قطرات سيروم الذهب 24k 🌟',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-applying-a-face-cream-at-home-41481-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
    productName: 'مجموعة العناية: Rose Gold Elixir (UNISEX)',
    duration: '00:18',
    likesCount: 980,
    creatorHandle: '@sara_reviews',
    status: 'published'
  },
  {
    id: 'REEL-3',
    title: 'فخامة العود والعنبر مع Velvet Noir الملكي 🖤',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-putting-on-his-perfume-41485-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    productName: 'المجموعة الأساسية: Velvet Noir (FOR MEN)',
    duration: '00:12',
    likesCount: 2310,
    creatorHandle: '@rosee_fragrance',
    status: 'published'
  },
  {
    id: 'REEL-4',
    title: 'أنوثة ورقة الياسمين الفواحة مع Pure Jasmine 🌸',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-flowers-in-her-hair-41490-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    productName: 'المجموعة الأساسية: Pure Jasmine Glow (FOR WOMEN)',
    duration: '00:14',
    likesCount: 1150,
    creatorHandle: '@nour_beauty',
    status: 'published'
  }
];

export const DEFAULT_COLLECTIONS: CollectionGroup[] = [
  {
    id: 'COL-1',
    name: 'مجموعة العطور النسائية الفاخرة',
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
    description: 'نفحات الورد الدمشقي، الزهور البيضاء، ومسك الروم بتوليفات راقية تدوم طويلاً.',
    categoryTag: 'WOMEN'
  },
  {
    id: 'COL-2',
    name: 'تشكيلة العطور الشرقية والرجالية',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
    description: 'قوة خشب الصندل، أخشاب الأرز، والعود الملكي للشخصيات الواثقة والفريدة.',
    categoryTag: 'MEN'
  },
  {
    id: 'COL-3',
    name: 'مجموعة العناية بالبشرة والذهب',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    description: 'سيرومات مخملية بقطرات الذهب عيار 24 وخلاصات طبيعية لإشراقة ونقاء فائق.',
    categoryTag: 'UNISEX'
  }
];

export const DEFAULT_USERS: { [code: string]: UserAccount } = {
  'ADMIN': {
    name: 'أحمد مجدي (المدير العام)',
    role: 'admin',
    password: '123',
    email: 'mimomd199@gmail.com',
    permissions: ['all']
  },
  'STAFF1': {
    name: 'سارة خالد',
    role: 'user',
    password: '2025',
    email: 'sara@example.com',
    permissions: ['orders', 'crm', 'reviews']
  }
};

export const DEFAULT_DATABASE: RoseeDatabase = {
  orders: [],
  catalog: DEFAULT_CATALOG,
  offers: [],
  reels: DEFAULT_REELS,
  collections: DEFAULT_COLLECTIONS,
  users: DEFAULT_USERS,
  promoCodes: {
    'ROSE15': {
      discountPercent: 15,
      expiryDate: null,
      maxUses: 100,
      usedCount: 3,
      isActive: true
    },
    'VIP20': {
      discountPercent: 20,
      expiryDate: null,
      maxUses: 50,
      usedCount: 0,
      isActive: true
    }
  },
  globalAlert: "نود إعلامكم بأن جميع طلبات مستحضرات التجميل والعناية بالبشرة تشمل عينات مجانية للإهداء مع كل طلب!",
  reviews: {
    'REV-1': {
      customerName: 'مريم السيد',
      phone: '01098765432',
      productName: 'المجموعة الأساسية: Bunny Rose (FOR WOMEN)',
      rating: 5,
      text: 'المستحضر غاية في النعومة وأعطى بشرتي نضارة وإشراقة ساحرة، والتغليف راقي وفخم للغاية شكراً لكم!',
      status: 'approved',
      date: new Date().toISOString()
    },
    'REV-2': {
      customerName: 'سارة خالد',
      phone: '01123456789',
      productName: 'مجموعة العناية: Rose Gold Elixir (UNISEX)',
      rating: 5,
      text: 'السيروم رائع وخفيف على البشرة وملمسه مخملي جداً، فرق معايا كتير في النضارة.',
      status: 'approved',
      date: new Date().toISOString()
    }
  },
  expenses: [
    {
      id: 'EXP-1',
      title: 'إعلانات إنستجرام وتيك توك ممولة',
      amount: 1500,
      date: new Date().toISOString().split('T')[0],
      notes: 'حملة ترويج عطر Bunny Rose'
    },
    {
      id: 'EXP-2',
      title: 'علب وأكياس تغليف فاخرة بشعار Brand Rosée',
      amount: 850,
      date: new Date().toISOString().split('T')[0],
      notes: 'توريد عبوات كرتونية فاخرة'
    }
  ],
  systemLogs: [
    {
      timestamp: new Date().toISOString(),
      user: 'النظام',
      action: 'تهيئة النظام وتشغيل قاعدة البيانات السحابية'
    }
  ],
  settings: DEFAULT_SETTINGS,
  abandonedCarts: [
    {
      id: 'ABN-101',
      phone: '01019283746',
      customerName: 'رانيا منصور',
      items: [
        { name: 'المجموعة الأساسية: Bunny Rose (FOR WOMEN)', qty: 1, unitPrice: 280, selectedSize: '50 مل (عبوة أنيقة)' }
      ],
      totalAmount: 280,
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      recovered: false,
      notes: 'توقفت عند مرحلة إدخال العنوان'
    },
    {
      id: 'ABN-102',
      phone: '01198765432',
      customerName: 'ياسمين فؤاد',
      items: [
        { name: 'مجموعة العناية: Rose Gold Elixir (UNISEX)', qty: 2, unitPrice: 240 }
      ],
      totalAmount: 480,
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      recovered: false
    }
  ],
  backInStockRequests: [
    {
      id: 'BIS-1',
      productKey: 'المجموعة الأساسية: Pure Jasmine Glow (FOR WOMEN)',
      productName: 'Pure Jasmine Glow',
      customerPhone: '01065432109',
      customerName: 'دينا إبراهيم',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      notified: false
    },
    {
      id: 'BIS-2',
      productKey: 'المجموعة الأساسية: Pure Jasmine Glow (FOR WOMEN)',
      productName: 'Pure Jasmine Glow',
      customerPhone: '01234567890',
      customerName: 'منى عبد العزيز',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      notified: false
    }
  ]
};

// Real-time synchronization
export function subscribeToRoseeData(callback: (data: RoseeDatabase) => void) {
  const dataRef = ref(db, 'rosee_data');
  return onValue(dataRef, (snapshot) => {
    const val = snapshot.val();
    if (!val) {
      // Seed default data if database is brand new
      set(dataRef, DEFAULT_DATABASE);
      callback(DEFAULT_DATABASE);
    } else {
      const rawOrders = Array.isArray(val.orders) ? val.orders : (val.orders ? Object.values(val.orders) : []);
      const cleanOrders: Order[] = rawOrders.map((o: any, idx: number) => ({
        id: o.id || `ORD-${1000 + idx}`,
        date: o.date || new Date().toISOString(),
        name: o.name || '',
        phone: o.phone || '',
        customerPhone: o.customerPhone || undefined,
        address: o.address || '',
        status: o.status || 'pending',
        paymentStatus: o.paymentStatus || (o.paymentMethod === 'instapay' ? 'paid' : 'unpaid'),
        depositAmount: o.depositAmount !== undefined ? Number(o.depositAmount) : undefined,
        remainingAmount: o.remainingAmount !== undefined ? Number(o.remainingAmount) : undefined,
        discountVal: Number(o.discountVal) || 0,
        discountType: o.discountType === 'percent' ? 'percent' : 'fixed',
        discountReason: o.discountReason || '',
        paymentMethod: o.paymentMethod === 'instapay' ? 'instapay' : 'cod',
        paymentRef: o.paymentRef,
        paymentImage: o.paymentImage,
        lastModifiedBy: o.lastModifiedBy,
        source: o.source === 'أونلاين' ? 'أونلاين' : 'يدوي',
        archived: Boolean(o.archived),
        rejectionReason: o.rejectionReason,
        history: Array.isArray(o.history) ? o.history : (o.history ? Object.values(o.history) : []),
        items: Array.isArray(o.items) ? o.items.map((it: any) => ({
          name: it.name || 'منتج',
          qty: Number(it.qty) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          selectedSize: it.selectedSize || undefined
        })) : [],
        isGift: Boolean(o.isGift),
        giftPackagingId: o.giftPackagingId,
        giftPackagingName: o.giftPackagingName,
        giftPackagingPrice: Number(o.giftPackagingPrice) || 0,
        giftMessage: o.giftMessage,
        hidePriceOnInvoice: Boolean(o.hidePriceOnInvoice)
      }));

      const rawExpenses = Array.isArray(val.expenses) ? val.expenses : (val.expenses ? Object.values(val.expenses) : []);
      const cleanExpenses = rawExpenses.map((e: any, idx: number) => ({
        id: e.id || `EXP-${idx}`,
        title: e.title || 'مصروف',
        amount: Number(e.amount) || 0,
        date: e.date || new Date().toISOString().split('T')[0],
        notes: e.notes || ''
      }));

      const rawReels = val.reels ? (Array.isArray(val.reels) ? val.reels : Object.values(val.reels)) : DEFAULT_REELS;
      const cleanReels: ReelItem[] = rawReels.map((r: any, idx: number) => ({
        id: r.id || `REEL-${idx + 1}`,
        title: r.title || 'ريل تجربة المنتج',
        videoUrl: r.videoUrl || '',
        thumbnail: r.thumbnail || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
        productName: r.productName || '',
        duration: r.duration || '00:15',
        likesCount: Number(r.likesCount) || 500,
        creatorHandle: r.creatorHandle || '@rosee_cosmetics',
        status: r.status === 'hidden' ? 'hidden' : 'published'
      }));

      const rawCollections = val.collections ? (Array.isArray(val.collections) ? val.collections : Object.values(val.collections)) : DEFAULT_COLLECTIONS;
      const cleanCollections: CollectionGroup[] = rawCollections.map((c: any, idx: number) => ({
        id: c.id || `COL-${idx + 1}`,
        name: c.name || `مجموعة رقم ${idx + 1}`,
        image: c.image || 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
        description: c.description || '',
        categoryTag: c.categoryTag || 'ALL'
      }));

      const rawAbandoned = val.abandonedCarts ? (Array.isArray(val.abandonedCarts) ? val.abandonedCarts : Object.values(val.abandonedCarts)) : (DEFAULT_DATABASE.abandonedCarts || []);
      const cleanAbandoned: AbandonedCart[] = rawAbandoned.map((a: any, idx: number) => ({
        id: a.id || `ABN-${idx + 1}`,
        phone: a.phone || '',
        customerName: a.customerName || '',
        items: Array.isArray(a.items) ? a.items : [],
        totalAmount: Number(a.totalAmount) || 0,
        updatedAt: a.updatedAt || new Date().toISOString(),
        recovered: Boolean(a.recovered),
        notes: a.notes || ''
      }));

      const rawBackInStock = val.backInStockRequests ? (Array.isArray(val.backInStockRequests) ? val.backInStockRequests : Object.values(val.backInStockRequests)) : (DEFAULT_DATABASE.backInStockRequests || []);
      const cleanBackInStock: BackInStockRequest[] = rawBackInStock.map((b: any, idx: number) => ({
        id: b.id || `BIS-${idx + 1}`,
        productKey: b.productKey || '',
        productName: b.productName || '',
        customerPhone: b.customerPhone || '',
        customerName: b.customerName || '',
        createdAt: b.createdAt || new Date().toISOString(),
        notified: Boolean(b.notified)
      }));

      const normalized: RoseeDatabase = {
        orders: cleanOrders,
        catalog: val.catalog || DEFAULT_CATALOG,
        offers: Array.isArray(val.offers) ? val.offers : (val.offers ? Object.values(val.offers) : []),
        reels: cleanReels,
        collections: cleanCollections,
        users: val.users || DEFAULT_USERS,
        promoCodes: val.promoCodes || {},
        globalAlert: val.globalAlert || '',
        reviews: val.reviews || {},
        expenses: cleanExpenses,
        systemLogs: Array.isArray(val.systemLogs) ? val.systemLogs : (val.systemLogs ? Object.values(val.systemLogs) : []),
        abandonedCarts: cleanAbandoned,
        backInStockRequests: cleanBackInStock,
        settings: {
          ...DEFAULT_SETTINGS,
          ...(val.settings || {})
        }
      };
      callback(normalized);
    }
  }, (err) => {
    console.error("Firebase fetch error:", err);
    callback(DEFAULT_DATABASE);
  });
}

// Clean undefined properties so Firebase Realtime Database set() never rejects
export function cleanForFirebase(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirebase);

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirebase(value);
    }
  }
  return cleaned;
}

export async function saveRoseeData(data: RoseeDatabase) {
  try {
    const dataRef = ref(db, 'rosee_data');
    const cleaned = cleanForFirebase(data);
    await set(dataRef, cleaned);
    try {
      localStorage.setItem('rosee_backup_data', JSON.stringify(cleaned));
    } catch (_) {}
  } catch (err) {
    console.warn("Firebase remote sync notice:", err);
    try {
      localStorage.setItem('rosee_backup_data', JSON.stringify(data));
    } catch (_) {}
  }
}

export async function updateRoseeField(fieldPath: string, value: any) {
  try {
    const dataRef = ref(db, `rosee_data/${fieldPath}`);
    const cleaned = cleanForFirebase(value);
    await set(dataRef, cleaned);
  } catch (err) {
    console.warn(`Firebase update notice for ${fieldPath}:`, err);
  }
}

export async function approveReviewInFirebase(reviewId: string) {
  try {
    const revRef = ref(db, `rosee_data/reviews/${reviewId}/status`);
    await set(revRef, 'approved');
  } catch (err) {
    console.error("Firebase error approving review:", err);
    throw err;
  }
}

export async function deleteReviewInFirebase(reviewId: string) {
  try {
    const revRef = ref(db, `rosee_data/reviews/${reviewId}`);
    await remove(revRef);
  } catch (err) {
    console.error("Firebase error deleting review:", err);
    throw err;
  }
}

export async function deleteCustomerOrdersInFirebase(targetPhone: string, currentOrders: Order[]): Promise<Order[]> {
  const norm = (p: string) => {
    let clean = (p || '').split('-')[0].replace(/\D/g, '');
    if (clean.startsWith('20')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
  };
  const targetNorm = norm(targetPhone);
  const remainingOrders = currentOrders.filter(o => norm(o.phone || '') !== targetNorm);
  
  try {
    const ordersRef = ref(db, 'rosee_data/orders');
    await set(ordersRef, cleanForFirebase(remainingOrders));
  } catch (err) {
    console.error("Firebase error deleting customer orders:", err);
  }
  return remainingOrders;
}

