import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Users, 
  DollarSign, 
  Gift, 
  Tag, 
  BarChart3, 
  Star, 
  Sparkles, 
  Settings, 
  Clock, 
  LogOut, 
  Store, 
  Lock,
  ShieldCheck,
  Menu,
  X,
  Key,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Video,
  ShoppingBag,
  Copy,
  Check,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { 
  RoseeDatabase, 
  Order, 
  Expense, 
  Offer, 
  PromoCode, 
  CustomerReview, 
  ProductCatalog, 
  AppSettings,
  UserAccount,
  ReelItem,
  CollectionGroup
} from '../../types';
import { OrdersManager } from './OrdersManager';
import { CrmManager } from './CrmManager';
import { ExpensesManager } from './ExpensesManager';
import { AnalyticsManager } from './AnalyticsManager';
import { OffersManager } from './OffersManager';
import { PromoManager } from './PromoManager';
import { ReviewsManager } from './ReviewsManager';
import { ReelsManager } from './ReelsManager';
import { AiAgencyManager } from './AiAgencyManager';
import { SettingsManager } from './SettingsManager';
import { SystemLogsModal } from './SystemLogsModal';
import { NotificationBell } from '../NotificationBell';
import { 
  approveReviewInFirebase, 
  deleteReviewInFirebase, 
  deleteCustomerOrdersInFirebase,
  updateRoseeField 
} from '../../lib/firebase';
import { 
  generateNumericOTP,
  generateSecureToken, 
  hashPassword, 
  sendPasswordResetEmail 
} from '../../lib/emailService';

interface AdminDashboardProps {
  data: RoseeDatabase;
  onSaveData: (updated: RoseeDatabase) => Promise<void>;
  onSwitchToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  onSaveData,
  onSwitchToStore
}) => {
  const [activeTab, setActiveTab] = useState<string>('orders');
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  const handleCopyAdminUrl = () => {
    const adminUrl = `${window.location.origin}/admin.html`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(adminUrl);
    }
    setCopiedAdminLink(true);
    setTimeout(() => setCopiedAdminLink(false), 2500);
  };

  // Authentication & session (Strict Security Gate: Must login with valid credentials)
  const [currentUser, setCurrentUser] = useState<{ code: string; name: string; role: string } | null>(() => {
    const saved = localStorage.getItem('rosee_active_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot password modal state (3-Step Interactive OTP Wizard)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'identify' | 'otp' | 'new_password'>('identify');
  const [forgotInput, setForgotInput] = useState('');
  const [forgotTargetUser, setForgotTargetUser] = useState<{ code: string; user: UserAccount; email: string } | null>(null);
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [needsEmailBinding, setNeedsEmailBinding] = useState<string | null>(null);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentGeneratedOtp, setCurrentGeneratedOtp] = useState<string>('');
  const [revealedOtp, setRevealedOtp] = useState<string | null>(null);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Employee profile modal state (Change password & link personal email)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileCurrentPass, setProfileCurrentPass] = useState('');
  const [profileNewPass, setProfileNewPass] = useState('');
  const [profileConfirmPass, setProfileConfirmPass] = useState('');
  const [showProfilePass, setShowProfilePass] = useState(false);
  const [profileModalFeedback, setProfileModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(null);

  // Batch & Expiry Alert Banner State
  const [isExpiryBannerDismissed, setIsExpiryBannerDismissed] = useState(false);
  const [isExpiryDetailsExpanded, setIsExpiryDetailsExpanded] = useState(false);

  const expiringProducts = useMemo(() => {
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setDate(now.getDate() + 90);

    const items: Array<{
      key: string;
      name: string;
      batchNumber: string;
      expiryDate: string;
      daysRemaining: number;
      isExpired: boolean;
      stockQty: number;
      price: number;
    }> = [];

    Object.entries(data.catalog || {}).forEach(([key, item]) => {
      if (!item.expiryDate) return;
      const exp = new Date(item.expiryDate);
      if (isNaN(exp.getTime())) return;

      if (exp <= threeMonthsLater) {
        const diffMs = exp.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        items.push({
          key,
          name: key,
          batchNumber: item.batchNumber || 'تشغيلة غير مسجلة',
          expiryDate: item.expiryDate,
          daysRemaining,
          isExpired: daysRemaining <= 0,
          stockQty: item.stockQty ?? 0,
          price: item.defaultPrice ?? 0
        });
      }
    });

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [data.catalog]);

  // Handle staff login with username/code or email + password (supports both plain & SHA-256 hashed passwords)
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const idClean = loginIdentifier.trim();
    const passClean = loginPassword.trim();

    if (!idClean) {
      setLoginError('يرجى إدخال اسم المستخدم أو كود الدخول أو البريد الإلكتروني.');
      return;
    }

    // Match by code/username or email
    const matchedEntry = Object.entries(data.users).find(([code, u]) => {
      return (
        code.toUpperCase() === idClean.toUpperCase() ||
        (u.email && u.email.trim().toLowerCase() === idClean.toLowerCase()) ||
        u.name.trim().toLowerCase() === idClean.toLowerCase()
      );
    });

    if (!matchedEntry) {
      setLoginError('اسم المستخدم أو البريد الإلكتروني غير مسجل في النظام. تواصل مع المدير العام.');
      return;
    }

    const [code, u] = matchedEntry;
    const requiredPass = (u.password || '').trim();

    if (requiredPass) {
      const hashedAttempt = await hashPassword(passClean);
      const isMatch = (requiredPass === passClean) || (requiredPass === hashedAttempt);
      if (!isMatch) {
        setLoginError('كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى أو النقر على "نسيت كلمة المرور".');
        return;
      }
    }

    const newSession = {
      code,
      name: u.name,
      role: u.role
    };

    setCurrentUser(newSession);
    localStorage.setItem('rosee_active_session', JSON.stringify(newSession));
    addSystemLog(`تسجيل دخول ناجح إلى لوحة التحكم: ${u.name} (${code})`);
    setLoginIdentifier('');
    setLoginPassword('');
  };

  // Helper to mask email for security display (e.g. m***9@gmail.com)
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  };

  // Step 1: Submit username or email to generate & send 6-digit OTP
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);
    const query = forgotInput.trim();
    if (!query) return;

    setIsForgotSubmitting(true);

    try {
      const matched = Object.entries(data.users).find(([code, u]) => {
        return (
          code.toUpperCase() === query.toUpperCase() ||
          (u.email && u.email.trim().toLowerCase() === query.toLowerCase()) ||
          u.name.trim().toLowerCase() === query.toLowerCase()
        );
      });

      if (!matched) {
        setForgotFeedback({
          type: 'error',
          message: 'لم يتم العثور على أي حساب مسجل بهذا الاسم أو الكود أو البريد.'
        });
        setIsForgotSubmitting(false);
        return;
      }

      const [code, u] = matched;
      let targetEmail = (u.email || manualEmailInput || '').trim();

      // If account has no linked email yet, prompt user to bind one immediately
      if (!targetEmail || !targetEmail.includes('@')) {
        setNeedsEmailBinding(code);
        setForgotFeedback({
          type: 'info',
          message: `الحساب (${code}) غير مقترن ببريد إلكتروني بعد. يرجى كتابة بريدك الشخصي أدناه لربطه واستلام كود الـ OTP فوراً.`
        });
        setIsForgotSubmitting(false);
        return;
      }

      // 1. Generate 6-digit numeric OTP & secure token
      const otpCode = generateNumericOTP(6);
      const secureToken = generateSecureToken();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
      setCurrentGeneratedOtp(otpCode);
      setRevealedOtp(null);

      // 2. Save reset_otp and reset_token to Firebase Database
      const updatedUser: UserAccount = {
        ...u,
        email: targetEmail,
        reset_otp: otpCode,
        reset_token: secureToken,
        reset_token_expires: expiresAt
      };

      const updatedUsers = {
        ...data.users,
        [code]: updatedUser
      };

      await updateRoseeField('users', updatedUsers);

      // 3. Construct reset URL
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rosee-store.vercel.app';
      const resetLink = `${origin}/reset-password?token=${secureToken}`;

      // 4. Send real email via Resend & Serverless queue
      await sendPasswordResetEmail({
        toEmail: targetEmail,
        userName: u.name,
        otp: otpCode,
        resetLink,
        resendApiKey: data.settings?.resendApiKey,
        senderEmail: data.settings?.resendSenderEmail
      });

      addSystemLog(`إرسال كود تحقق OTP لاستعادة كلمة المرور للمستخدم ${u.name} (${targetEmail})`);

      // 5. Advance to Step 2 (OTP Entry)
      setForgotTargetUser({ code, user: updatedUser, email: targetEmail });
      setForgotStep('otp');
      setResendCooldown(60);
      setForgotFeedback({
        type: 'success',
        message: `تم إرسال كود التحقق (OTP) المكون من 6 أرقام إلى بريدك: ${maskEmail(targetEmail)}`
      });

    } catch (err) {
      console.error('Forgot password submission error:', err);
      setForgotFeedback({
        type: 'error',
        message: 'حدث خطأ مؤقت أثناء معالجة الطلب. يرجى المحاولة بعد قليل.'
      });
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Step 2: Verify the 6-digit OTP code entered by user
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);

    if (!forgotTargetUser) return;
    const cleanOtp = forgotOtpInput.trim();

    if (cleanOtp.length < 6) {
      setForgotFeedback({
        type: 'error',
        message: 'يرجى إدخال كود التحقق (OTP) كاملاً (6 أرقام).'
      });
      return;
    }

    const currentSavedUser = data.users[forgotTargetUser.code];
    if (!currentSavedUser || !currentSavedUser.reset_otp) {
      setForgotFeedback({
        type: 'error',
        message: 'انتهت صلاحية الرمز أو لم يتم العثور على طلب استعادة نشط. يرجى طلب كود جديد.'
      });
      return;
    }

    const expiresTime = typeof currentSavedUser.reset_token_expires === 'string'
      ? new Date(currentSavedUser.reset_token_expires).getTime()
      : Number(currentSavedUser.reset_token_expires);

    if (isNaN(expiresTime) || Date.now() > expiresTime) {
      setForgotFeedback({
        type: 'error',
        message: 'انتهت صلاحية كود التحقق (صالح لمدة 15 دقيقة فقط). يرجى الضغط على "إعادة إرسال كود جديد".'
      });
      return;
    }

    if (cleanOtp !== currentSavedUser.reset_otp.trim()) {
      setForgotFeedback({
        type: 'error',
        message: 'كود التحقق (OTP) غير صحيح! يرجى مراجعة بريدك الإلكتروني وكتابة الكود بدقة.'
      });
      return;
    }

    // Success: advance to Step 3
    setForgotStep('new_password');
    setForgotFeedback({
      type: 'success',
      message: '✅ تم التحقق من هويتك بنجاح! يمكنك الآن إدخال كلمة المرور الجديدة لحسابك.'
    });
  };

  // Resend fresh OTP
  const handleResendOtp = async () => {
    if (!forgotTargetUser || resendCooldown > 0 || isForgotSubmitting) return;
    setIsForgotSubmitting(true);
    setForgotFeedback(null);

    try {
      const { code, user, email } = forgotTargetUser;
      const otpCode = generateNumericOTP(6);
      const secureToken = generateSecureToken();
      const expiresAt = Date.now() + 15 * 60 * 1000;
      setCurrentGeneratedOtp(otpCode);
      setRevealedOtp(null);

      const updatedUser: UserAccount = {
        ...user,
        email,
        reset_otp: otpCode,
        reset_token: secureToken,
        reset_token_expires: expiresAt
      };

      await updateRoseeField('users', {
        ...data.users,
        [code]: updatedUser
      });

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rosee-store.vercel.app';
      const resetLink = `${origin}/reset-password?token=${secureToken}`;

      await sendPasswordResetEmail({
        toEmail: email,
        userName: user.name,
        otp: otpCode,
        resetLink,
        resendApiKey: data.settings?.resendApiKey,
        senderEmail: data.settings?.resendSenderEmail
      });

      setForgotTargetUser({ code, user: updatedUser, email });
      setResendCooldown(60);
      setForgotFeedback({
        type: 'success',
        message: `تم إرسال كود OTP جديد بنجاح إلى بريدك: ${maskEmail(email)}`
      });
    } catch (err) {
      console.error('Error resending OTP:', err);
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Step 3: Save new password, hash it with SHA-256, and clear OTP tokens
  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);

    if (!forgotTargetUser) return;
    const { code, user } = forgotTargetUser;

    if (forgotNewPass.trim().length < 4) {
      setForgotFeedback({
        type: 'error',
        message: 'كلمة المرور الجديدة يجب ألا تقل عن 4 خانات.'
      });
      return;
    }

    if (forgotNewPass.trim() !== forgotConfirmPass.trim()) {
      setForgotFeedback({
        type: 'error',
        message: 'كلمتا المرور غير متطابقتين.'
      });
      return;
    }

    setIsForgotSubmitting(true);

    try {
      const hashedPassword = await hashPassword(forgotNewPass.trim());

      const updatedUser: UserAccount = {
        ...user,
        password: hashedPassword,
        reset_otp: undefined,
        reset_token: undefined,
        reset_token_expires: undefined
      };

      const updatedUsers = {
        ...data.users,
        [code]: updatedUser
      };

      await updateRoseeField('users', updatedUsers);
      addSystemLog(`إعادة تعيين كلمة المرور بنجاح للمستخدم ${user.name} (${code}) عبر كود التحقق OTP`);

      // Automatically sign in or finish
      const newSession = {
        code,
        name: user.name,
        role: user.role
      };
      setCurrentUser(newSession);
      localStorage.setItem('rosee_active_session', JSON.stringify(newSession));

      setIsForgotModalOpen(false);
      setForgotStep('identify');
      setForgotInput('');
      setForgotOtpInput('');
      setForgotNewPass('');
      setForgotConfirmPass('');
      setForgotFeedback(null);

    } catch (err) {
      console.error('Error saving new password:', err);
      setForgotFeedback({
        type: 'error',
        message: 'حدث خطأ أثناء حفظ كلمة المرور الجديدة. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Open profile modal and populate current email
  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    const u = data.users[currentUser.code];
    setProfileEmail(u?.email || '');
    setProfileCurrentPass('');
    setProfileNewPass('');
    setProfileConfirmPass('');
    setProfileModalFeedback(null);
    setIsProfileModalOpen(true);
  };

  // Save profile changes (Password change & Email binding with SHA-256)
  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileModalFeedback(null);
    if (!currentUser) return;
    const u = data.users[currentUser.code];
    if (!u) return;

    const currentSavedPass = (u.password || '').trim();

    // If changing password, verify old password
    if (profileNewPass.trim()) {
      const hashedCurrent = await hashPassword(profileCurrentPass.trim());
      const isCurrentValid = (currentSavedPass === profileCurrentPass.trim()) || (currentSavedPass === hashedCurrent);
      if (currentSavedPass && !isCurrentValid) {
        setProfileModalFeedback({
          type: 'error',
          message: 'كلمة المرور الحالية غير صحيحة! يرجى التأكد والمحاولة مجدداً.'
        });
        return;
      }
      if (profileNewPass.trim().length < 4) {
        setProfileModalFeedback({
          type: 'error',
          message: 'كلمة المرور الجديدة يجب ألا تقل عن 4 خانات.'
        });
        return;
      }
      if (profileNewPass.trim() !== profileConfirmPass.trim()) {
        setProfileModalFeedback({
          type: 'error',
          message: 'كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور!'
        });
        return;
      }
    }

    const newPassToSave = profileNewPass.trim() ? await hashPassword(profileNewPass.trim()) : u.password;
    const updatedUsers = {
      ...data.users,
      [currentUser.code]: {
        ...u,
        email: profileEmail.trim(),
        password: newPassToSave
      }
    };

    await onSaveData({ ...data, users: updatedUsers });
    addSystemLog(`قام الموظف ${currentUser.name} (${currentUser.code}) بتحديث كلمة المرور الخاصة به وتشفيرها`);
    setProfileModalFeedback({
      type: 'success',
      message: '✅ تم تحديث كلمة المرور وحفظ البيانات بنجاح في قاعدة البيانات!'
    });
    setTimeout(() => {
      setIsProfileModalOpen(false);
      setProfileModalFeedback(null);
    }, 1600);
  };

  const createLog = (action: string) => ({
    timestamp: new Date().toISOString(),
    user: currentUser?.name || 'المدير',
    action
  });

  const appendLog = (action: string, baseLogs?: typeof data.systemLogs) => {
    return [createLog(action), ...(baseLogs || data.systemLogs || [])].slice(0, 500);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('rosee_active_session');
    const updatedLogs = appendLog(`تسجيل خروج من لوحة التحكم: ${currentUser?.name || ''}`);
    onSaveData({
      ...data,
      systemLogs: updatedLogs
    });
    setCurrentUser(null);
    onSwitchToStore();
  };

  const addSystemLog = (action: string) => {
    const updatedLogs = appendLog(action);
    updateRoseeField('systemLogs', updatedLogs);
  };

  // Helper authorization check
  const checkPermission = (permId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    // Find user record with case-insensitive code matching or email/name
    const userEntry = Object.entries(data.users || {}).find(([c, val]) => 
      c.trim().toUpperCase() === currentUser.code.trim().toUpperCase() ||
      (val.email && val.email.trim().toLowerCase() === currentUser.code.trim().toLowerCase()) ||
      (val.name && val.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
    );
    const u = userEntry ? userEntry[1] : (data.users ? data.users[currentUser.code] : null);
    if (!u) return false;
    if (u.role === 'admin') return true;

    // Normalize permissions: Firebase RTDB can serialize arrays as Objects like { "0": "orders", "1": "crm" }
    const rawPerms = u.permissions;
    const perms: string[] = Array.isArray(rawPerms) 
      ? rawPerms 
      : (rawPerms && typeof rawPerms === 'object' ? Object.values(rawPerms as any) : []);

    if (perms.includes('all')) return true;

    // Granular tab permissions matching with aliases
    switch (permId) {
      case 'orders':
        return perms.includes('orders') || perms.includes('edit_order') || perms.includes('add_item') || perms.includes('delete_order') || perms.includes('delete_item');
      case 'products':
        return perms.includes('products') || perms.includes('edit_catalog') || perms.includes('catalog');
      case 'crm':
        return perms.includes('crm') || perms.includes('marketing') || perms.includes('delete_customer');
      case 'expenses':
        return perms.includes('expenses');
      case 'analytics':
        return perms.includes('analytics') || perms.includes('expenses');
      case 'reels':
        return perms.includes('reels') || perms.includes('marketing');
      case 'offers':
        return perms.includes('offers') || perms.includes('marketing');
      case 'promo':
        return perms.includes('promo') || perms.includes('marketing');
      case 'reviews':
        return perms.includes('reviews') || perms.includes('marketing');
      case 'agency':
        return perms.includes('agency') || perms.includes('marketing');
      case 'settings':
        return perms.includes('settings') || perms.includes('view_logs');
      default:
        return perms.includes(permId);
    }
  };

  // 1. Orders handlers (Atomic)
  const handleSaveOrder = async (updatedOrder: Order) => {
    const updatedOrders = (data.orders || []).map(o => 
      (o.id === updatedOrder.id || String(o.id).trim() === String(updatedOrder.id).trim()) 
        ? { ...o, ...updatedOrder } 
        : o
    );
    const updatedLogs = appendLog(`تعديل وحفظ بيانات الطلب #${updatedOrder.id}`);
    await onSaveData({ ...data, orders: updatedOrders, systemLogs: updatedLogs });
    try {
      await updateRoseeField('orders', updatedOrders);
      await updateRoseeField('systemLogs', updatedLogs);
    } catch (err) {
      console.warn("Direct field sync notice:", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const updatedOrders = data.orders.filter(o => o.id !== orderId);
    const updatedLogs = appendLog(`حذف الطلب #${orderId} نهائياً`);
    await onSaveData({ ...data, orders: updatedOrders, systemLogs: updatedLogs });
  };

  const handleCreateOrder = async (newOrder: Order) => {
    const updatedOrders = [newOrder, ...data.orders];
    const updatedLogs = appendLog(`إنشاء طلب يدوي جديد #${newOrder.id}`);
    await onSaveData({ ...data, orders: updatedOrders, systemLogs: updatedLogs });
  };

  // 2. CRM Handlers (Atomic with normalization)
  const normalizePhone = (p: string) => {
    let clean = (p || '').split('-')[0].replace(/\D/g, '');
    if (clean.startsWith('20')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
  };

  const handleArchiveCustomer = async (phone: string) => {
    const targetNorm = normalizePhone(phone);
    const updatedOrders = data.orders.map(o => {
      if (normalizePhone(o.phone || '') === targetNorm) {
        return { ...o, archived: true };
      }
      return o;
    });
    const updatedLogs = appendLog(`أرشفة سجلات طلبات العميل صاحب الهاتف ${phone}`);
    await onSaveData({ ...data, orders: updatedOrders, systemLogs: updatedLogs });
  };

  const handleDeleteCustomer = async (phone: string) => {
    const updatedOrders = await deleteCustomerOrdersInFirebase(phone, data.orders);
    const updatedLogs = appendLog(`حذف العميل (${phone}) وجميع سجلاته نهائياً`);
    await onSaveData({ ...data, orders: updatedOrders, systemLogs: updatedLogs });
  };

  // Abandoned Carts Handlers
  const handleDeleteAbandonedCart = async (id: string) => {
    const updated = (data.abandonedCarts || []).filter(c => c.id !== id);
    const updatedLogs = appendLog(`حذف السلة المتروكة رقم (${id})`);
    await onSaveData({ ...data, abandonedCarts: updated, systemLogs: updatedLogs });
  };

  const handleRecoverAbandonedCart = async (id: string) => {
    const updated = (data.abandonedCarts || []).map(c => 
      c.id === id ? { ...c, recovered: true, lastUpdated: new Date().toISOString() } : c
    );
    const updatedLogs = appendLog(`تحديد السلة المتروكة رقم (${id}) كمسترجعة بنجاح`);
    await onSaveData({ ...data, abandonedCarts: updated, systemLogs: updatedLogs });
  };

  // Back in Stock Handlers
  const handleDeleteBackInStockRequest = async (id: string) => {
    const updated = (data.backInStockRequests || []).filter(r => r.id !== id);
    const updatedLogs = appendLog(`حذف طلب تنبيه توفر المنتج رقم (${id})`);
    await onSaveData({ ...data, backInStockRequests: updated, systemLogs: updatedLogs });
  };

  const handleNotifyBackInStock = async (productKey: string) => {
    const updated = (data.backInStockRequests || []).map(r => 
      r.productKey === productKey ? { ...r, notified: true } : r
    );
    const updatedLogs = appendLog(`إرسال إشعار توفر المنتج بالواتساب للمنتظرين: ${productKey}`);
    await onSaveData({ ...data, backInStockRequests: updated, systemLogs: updatedLogs });
  };

  // 3. Expenses Handlers (Atomic)
  const handleAddExpense = async (newExp: Expense) => {
    const updatedExpenses = [newExp, ...data.expenses];
    const updatedLogs = appendLog(`تسجيل مصروف تشغيلي جديد: ${newExp.title} بمبلغ ${newExp.amount} ج.م`);
    await onSaveData({ ...data, expenses: updatedExpenses, systemLogs: updatedLogs });
  };

  const handleDeleteExpense = async (expId: string) => {
    const deleted = data.expenses.find(e => e.id === expId);
    const updatedExpenses = data.expenses.filter(e => e.id !== expId);
    const updatedLogs = appendLog(`حذف المصروف: ${deleted?.title || expId}`);
    await onSaveData({ ...data, expenses: updatedExpenses, systemLogs: updatedLogs });
  };

  // 4. Offers & Global Alert Handlers
  const handleSaveOffers = async (updatedOffers: Offer[]) => {
    await onSaveData({ ...data, offers: updatedOffers });
  };

  const handleSaveGlobalAlert = async (alertText: string) => {
    await onSaveData({ ...data, globalAlert: alertText });
  };

  // 5. Promo Codes Handlers
  const handleSavePromoCodes = async (updatedPromos: { [code: string]: PromoCode }) => {
    await onSaveData({ ...data, promoCodes: updatedPromos });
  };

  // 6. Reviews Handlers (Atomic & Direct in Firebase)
  const handleApproveReview = async (revId: string) => {
    try {
      await approveReviewInFirebase(revId);
    } catch (e) {
      console.warn("Direct approve error, saving via onSaveData:", e);
    }
    const updatedReviews = {
      ...data.reviews,
      [revId]: {
        ...data.reviews[revId],
        status: 'approved' as const
      }
    };
    const updatedLogs = appendLog(`اعتماد ونشر تقييم عميل #${revId}`);
    await onSaveData({ ...data, reviews: updatedReviews, systemLogs: updatedLogs });
  };

  const handleDeleteReview = async (revId: string) => {
    try {
      await deleteReviewInFirebase(revId);
    } catch (e) {
      console.warn("Direct delete error, saving via onSaveData:", e);
    }
    const updatedReviews = { ...data.reviews };
    delete updatedReviews[revId];
    const updatedLogs = appendLog(`حذف تقييم عميل #${revId}`);
    await onSaveData({ ...data, reviews: updatedReviews, systemLogs: updatedLogs });
  };

  // 7. Settings, Catalog, Users Handlers
  const handleSaveCatalog = async (updatedCatalog: ProductCatalog) => {
    await onSaveData({ ...data, catalog: updatedCatalog });
  };

  const handleSaveSettings = async (updatedSettings: AppSettings) => {
    await onSaveData({ ...data, settings: updatedSettings });
  };

  const handleSaveUsers = async (updatedUsers: { [code: string]: UserAccount }) => {
    await onSaveData({ ...data, users: updatedUsers });
  };

  // 8. Reels Handlers (Atomic)
  const handleSaveReels = async (updatedReels: ReelItem[]) => {
    const updatedLogs = appendLog(`تحديث قائمة فيديوهات UGC والريلز`);
    await onSaveData({ ...data, reels: updatedReels, systemLogs: updatedLogs });
  };

  // 9. Collections Handlers (Atomic)
  const handleSaveCollections = async (updatedCollections: CollectionGroup[]) => {
    const updatedLogs = appendLog(`تحديث ترتيب ومجموعات المتجر`);
    await onSaveData({ ...data, collections: updatedCollections, systemLogs: updatedLogs });
  };

  const allNavItems = [
    { id: 'orders', label: 'الطلبات والمبيعات', icon: Package, badge: data.orders.filter(o => !o.archived && o.status === 'pending').length },
    { id: 'products', label: 'المنتجات والأحجام والأسعار', icon: ShoppingBag, badge: Object.keys(data.catalog || {}).length, accent: true },
    { id: 'crm', label: 'العملاء (CRM)', icon: Users },
    { id: 'expenses', label: 'المصروفات (OPEX)', icon: DollarSign },
    { id: 'analytics', label: 'التقارير والأرباح', icon: BarChart3 },
    { id: 'reels', label: 'فيديوهات الريلز (UGC)', icon: Video },
    { id: 'offers', label: 'العروض والإعلانات', icon: Gift },
    { id: 'promo', label: 'أكواد الخصم', icon: Tag },
    { id: 'reviews', label: 'التقييمات والآراء', icon: Star, badge: Object.values(data.reviews).filter(r => r.status === 'pending').length },
    { id: 'agency', label: 'وكالة الذكاء (AI)', icon: Sparkles, accent: true },
    { id: 'settings', label: 'المظهر وهوية المتجر والصلاحيات', icon: Settings }
  ];

  // Auto-switch to first permitted section if default activeTab is locked for this employee
  useEffect(() => {
    if (currentUser && !checkPermission(activeTab)) {
      const firstAllowed = allNavItems.find(item => checkPermission(item.id));
      if (firstAllowed) {
        setActiveTab(firstAllowed.id);
      }
    }
  }, [currentUser, activeTab, data.users]);

  // ----------------------------------------------------
  // GUEST / LOGGED-OUT STATE: RENDER LOGIN SCREEN
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col justify-center items-center p-4 sm:p-6 font-arabic relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#8C6D2D]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          
          {/* Brand Wordmark & Header */}
          <div className="text-center space-y-2">
            <span className="text-3xl font-brand font-bold tracking-[0.3em] text-[#C5A059] block">
              R O S É E
            </span>
            <h1 className="text-lg font-bold text-gray-200">
              بوابة تسجيل دخول الموظفين والإدارة
            </h1>
            <p className="text-xs text-gray-400">
              أدخل اسم المستخدم وكلمة المرور المحددة من الإدارة للوصول للنظام
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#181818] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            {loginError && (
              <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-red-300 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  اسم المستخدم أو كود الدخول (PIN) أو البريد:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="مثال: ADMIN أو STAFF1 أو البريد"
                    required
                    className="w-full p-3 pl-10 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                  <Users className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    كلمة المرور:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotFeedback(null);
                      setForgotInput(loginIdentifier.trim());
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] text-[#C5A059] hover:underline cursor-pointer"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    required
                    className="w-full p-3 pl-10 pr-10 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                  <Lock className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="p-1 text-gray-400 hover:text-gray-200 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#C5A059] hover:bg-[#b08d47] text-[#111111] rounded-xl text-xs font-bold transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>تسجيل الدخول إلى النظام</span>
              </button>
            </form>

            {/* Security Notice */}
            <div className="pt-3 border-t border-gray-800 text-center">
              <span className="block text-[11px] text-gray-500 font-medium">
                🔒 الدخول مقتصر حصرياً على موظفي وإدارة المتجر المصرح لهم
              </span>
            </div>

            {/* Return to Store */}
            <div className="pt-3 border-t border-gray-800 text-center">
              <button
                type="button"
                onClick={onSwitchToStore}
                className="text-xs text-gray-400 hover:text-[#C5A059] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة إلى واجهة المتجر الإلكتروني</span>
              </button>
            </div>
          </div>

        </div>

        {/* Forgot Password Modal (3-Step Interactive OTP Recovery Wizard) */}
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#161616] border border-[#C5A059]/30 rounded-3xl w-full max-w-md p-6 text-right space-y-4 shadow-2xl shadow-black/80">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-[#C5A059]/15 text-[#C5A059] rounded-xl border border-[#C5A059]/30">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">استعادة كلمة المرور عبر كود التحقق (OTP)</h3>
                    <p className="text-[10px] text-gray-400">
                      {forgotStep === 'identify' && 'الخطوة 1 من 3: تحديد الحساب والبريد'}
                      {forgotStep === 'otp' && 'الخطوة 2 من 3: التحقق من كود الـ OTP'}
                      {forgotStep === 'new_password' && 'الخطوة 3 من 3: تعيين كلمة المرور الجديدة'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotStep('identify');
                    setForgotFeedback(null);
                  }}
                  className="text-gray-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Progress Indicators */}
              <div className="grid grid-cols-3 gap-1.5 py-1">
                <div className={`h-1.5 rounded-full transition-colors ${forgotStep === 'identify' || forgotStep === 'otp' || forgotStep === 'new_password' ? 'bg-[#C5A059]' : 'bg-gray-800'}`} />
                <div className={`h-1.5 rounded-full transition-colors ${forgotStep === 'otp' || forgotStep === 'new_password' ? 'bg-[#C5A059]' : 'bg-gray-800'}`} />
                <div className={`h-1.5 rounded-full transition-colors ${forgotStep === 'new_password' ? 'bg-[#C5A059]' : 'bg-gray-800'}`} />
              </div>

              {/* Feedback Alert Box */}
              {forgotFeedback && (
                <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                  forgotFeedback.type === 'success' 
                    ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-200'
                    : forgotFeedback.type === 'info'
                    ? 'bg-amber-950/70 border border-amber-800 text-amber-200'
                    : 'bg-red-950/70 border border-red-800 text-red-200'
                }`}>
                  {forgotFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : forgotFeedback.type === 'info' ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{forgotFeedback.message}</span>
                </div>
              )}

              {/* STEP 1: IDENTIFY ACCOUNT */}
              {forgotStep === 'identify' && (
                <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    أدخل اسم المستخدم أو كود الدخول أو البريد الإلكتروني، وسيقوم النظام فوراً بإرسال كود تحقق رقمي (OTP) مكون من 6 أرقام إلى بريدك الشخصي.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      اسم المستخدم أو كود الدخول أو البريد:
                    </label>
                    <input
                      type="text"
                      value={forgotInput}
                      onChange={(e) => {
                        setForgotInput(e.target.value);
                        setNeedsEmailBinding(null);
                      }}
                      placeholder="مثال: ADMIN أو mimomd199@gmail.com"
                      required
                      disabled={isForgotSubmitting}
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A059] disabled:opacity-50"
                    />
                  </div>

                  {needsEmailBinding && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <label className="block text-xs font-bold text-amber-300">
                        📧 اكتب بريدك الإلكتروني الشخصي لربطه بهذا الحساب:
                      </label>
                      <input
                        type="email"
                        value={manualEmailInput}
                        onChange={(e) => setManualEmailInput(e.target.value)}
                        placeholder="your-email@gmail.com"
                        required
                        className="w-full p-2 bg-gray-900 border border-amber-500/40 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      disabled={isForgotSubmitting}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotSubmitting || !forgotInput.trim()}
                      className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#b08d47] disabled:opacity-40 disabled:cursor-not-allowed text-[#111111] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{isForgotSubmitting ? 'جاري التحقق والإرسال...' : 'إرسال كود التحقق (OTP) للبريد'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: ENTER & VERIFY 6-DIGIT OTP */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-300">
                      يرجى مراجعة بريدك الإلكتروني وإدخال كود الـ OTP المكون من 6 أرقام:
                    </p>
                    {forgotTargetUser && (
                      <p className="text-xs text-[#C5A059] font-mono font-bold direction-ltr">
                        {forgotTargetUser.email}
                      </p>
                    )}
                  </div>

                  {/* 6-Digit OTP Input */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtpInput}
                      onChange={(e) => setForgotOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      autoFocus
                      required
                      className="w-full py-3 px-4 bg-gray-900 border-2 border-[#C5A059]/40 rounded-2xl text-center text-2xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                    />
                    <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C5A059]" />
                        <span>صالح لمدة 15 دقيقة</span>
                      </span>
                      <span>أدخل الأرقام الستة</span>
                    </div>
                  </div>

                  {/* Smart Emergency OTP Reveal Box (in case external email is delayed or filtered by spam) */}
                  <div className="p-3 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-2xl space-y-2 text-right">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-300 font-semibold">لم تصلك الرسالة في البريد أو الـ Spam؟</span>
                      <button
                        type="button"
                        onClick={() => {
                          const otpToReveal = (forgotTargetUser && data.users[forgotTargetUser.code]?.reset_otp) || currentGeneratedOtp;
                          setRevealedOtp(otpToReveal);
                          setForgotOtpInput(otpToReveal);
                        }}
                        className="px-2.5 py-1.5 bg-[#C5A059] hover:bg-[#b08d47] text-black text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>إظهار وملء الكود فوراً 🔑</span>
                      </button>
                    </div>
                    {revealedOtp && (
                      <div className="p-3 bg-black/70 border border-[#C5A059]/50 rounded-xl text-center space-y-1 animate-fade-in">
                        <p className="text-[10px] text-gray-400">كود التحقق (OTP) الصادر لحسابك:</p>
                        <p className="text-3xl font-mono font-bold tracking-[0.4em] text-[#C5A059]">{revealedOtp}</p>
                        <p className="text-[10px] text-emerald-400">✅ تم نسخ وملء الكود في الخانات. اضغط الزر الذهبي بالأسفل للمتابعة.</p>
                      </div>
                    )}
                  </div>

                  {/* Submit OTP Verification Button */}
                  <button
                    type="submit"
                    disabled={forgotOtpInput.trim().length < 6 || isForgotSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#DFBA73] to-[#C5A059] hover:from-[#C5A059] hover:to-[#A38038] disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد كود التحقق ومتابعة التعيين 🔒</span>
                  </button>

                  {/* Secondary Quick Action Links */}
                  <div className="pt-2 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isForgotSubmitting}
                      className="text-[#C5A059] hover:underline disabled:text-gray-500 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 
                        ? `إعادة إرسال كود جديد (${resendCooldown} ث)` 
                        : '🔄 إعادة إرسال كود OTP جديد'}
                    </button>

                    <a
                      href="https://mail.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <span>فتح Gmail</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('identify');
                        setForgotOtpInput('');
                        setForgotFeedback(null);
                      }}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      تغيير الحساب
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SET NEW PASSWORD */}
              {forgotStep === 'new_password' && (
                <form onSubmit={handleResetPasswordWithOtp} className="space-y-3.5">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    تم تأكيد هويتك بنجاح. أدخل الآن كلمة المرور الجديدة لحسابك:
                  </p>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-300">
                      كلمة المرور الجديدة (4 خانات على الأقل):
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPass ? 'text' : 'password'}
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        placeholder="أدخل كلمة مرور جديدة"
                        required
                        minLength={4}
                        className="w-full p-2.5 pl-9 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                        className="p-1 text-gray-400 hover:text-gray-200 absolute left-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        {showForgotNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-300">
                      تأكيد كلمة المرور الجديدة:
                    </label>
                    <input
                      type={showForgotNewPass ? 'text' : 'password'}
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور"
                      required
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                    />
                    {forgotConfirmPass && forgotNewPass !== forgotConfirmPass && (
                      <p className="text-[10px] text-red-400">كلمتا المرور غير متطابقتين بعد</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      disabled={isForgotSubmitting}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotSubmitting || !forgotNewPass || forgotNewPass !== forgotConfirmPass}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#DFBA73] to-[#C5A059] hover:from-[#C5A059] hover:to-[#A38038] disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>{isForgotSubmitting ? 'جاري التشفير والحفظ...' : 'حفظ كلمة المرور وتأمين الحساب 🚀'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    );
  }

  // ----------------------------------------------------
  // LOGGED-IN STATE: RENDER EXECUTIVE DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-arabic text-gray-800">
      
      {/* Top Executive Header */}
      <header className="h-16 bg-[#111111] text-white border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0">
        
        {/* Brand and Mobile Toggle - Aligned with desktop sidebar */}
        <div className="flex items-center gap-3 lg:w-64 lg:border-l lg:border-gray-800/80 lg:pl-4 shrink-0">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1.5 text-gray-300 hover:text-white lg:hidden rounded-lg hover:bg-gray-800 transition-colors"
            title="القائمة الجانبية"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-xl font-brand font-bold tracking-[0.25em] text-[#C5A059] select-none">
              R O S É E
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 bg-gray-800/80 text-gray-300 border border-gray-700/60 rounded">
              ERP V2
            </span>
          </div>
        </div>

        {/* Right Side: Quick Actions & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Direct Admin URL Quick Copy Button */}
          <button
            onClick={handleCopyAdminUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-700 cursor-pointer shadow-xs"
            title="نسخ رابط لوحة التحكم المباشر المنفصل"
          >
            {copiedAdminLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#C5A059]" />
            )}
            <span className="hidden sm:inline">
              {copiedAdminLink ? 'تم نسخ رابط /admin!' : 'رابط الإدارة المباشر (/admin)'}
            </span>
            <span className="sm:hidden">
              {copiedAdminLink ? 'تم النسخ!' : 'رابط /admin'}
            </span>
          </button>

          {/* Switch to Storefront Button */}
          <button
            onClick={onSwitchToStore}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059] hover:bg-[#d6af63] text-[#111111] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="معاينة المتجر للعملاء"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">معاينة المتجر (العملاء)</span>
            <span className="sm:hidden">المتجر</span>
          </button>

          {/* Audit Logs Trigger */}
          <button
            onClick={() => setIsLogsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="سجل الحركات"
          >
            <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden md:inline">سجل الحركات</span>
          </button>

          {/* Real-time Order Notification Bell */}
          <NotificationBell
            orders={data.orders}
            onSelectOrder={() => {
              setActiveTab('orders');
            }}
          />

          {/* User Profile Pill & Staff Management Controls */}
          <div className="flex items-center gap-2 pr-2 border-r border-gray-800 text-xs">
            <div className="w-8 h-8 rounded-full bg-[#C5A059] text-[#111111] flex items-center justify-center font-bold font-brand text-xs">
              {currentUser?.name?.[0] || 'A'}
            </div>
            <div className="hidden sm:block text-right">
              <span className="block font-bold text-white text-xs">{currentUser?.name}</span>
              <span className="block text-[10px] text-gray-400 font-mono">
                {currentUser?.role === 'admin' ? 'مدير عام' : 'موظف'} ({currentUser?.code})
              </span>
            </div>

            {/* Profile / Change Password & Link Email Button */}
            <button
              onClick={handleOpenProfileModal}
              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-[#C5A059] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="تغيير كلمة المرور والبريد الشخصي"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden md:inline">تغيير كلمة المرور</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 bg-red-950/50 hover:bg-red-900 text-red-300 rounded-lg transition-colors cursor-pointer"
              title="تسجيل الخروج من لوحة التحكم"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className={`fixed lg:static inset-y-16 right-0 z-20 w-64 bg-white border-l border-gray-200 shadow-lg lg:shadow-none flex flex-col justify-between transition-transform duration-300 ${
          isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}>
          
          <div className="p-4 space-y-1.5 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              أقسام الإدارة والتحكم
            </div>

            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const hasAccess = checkPermission(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (hasAccess) {
                      setActiveTab(item.id);
                      setIsMobileSidebarOpen(false);
                    } else {
                      setAccessDeniedNotice(`⚠️ قسم "${item.label}" مغلق: يتطلب تفعيل الصلاحية من المدير العام.`);
                      setTimeout(() => setAccessDeniedNotice(null), 3500);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !hasAccess 
                      ? 'opacity-40 hover:bg-gray-50 text-gray-400'
                      : isActive
                        ? 'bg-[#111111] text-[#C5A059] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={!hasAccess ? 'مغلق: يتطلب صلاحية من الإدارة' : item.label}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${!hasAccess ? 'text-gray-300' : isActive ? 'text-[#C5A059]' : (item.accent ? 'text-[#C5A059]' : 'text-gray-400')}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!hasAccess && (
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-gray-100 bg-[#FAF9F6]">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>متصل بالنظام</span>
              </span>
              <span className="font-mono text-[10px]">v2.5</span>
            </div>
          </div>

        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-4">
          
          {/* Automatic Expiry & Batch Alert Banner (Requirement #4) */}
          {expiringProducts.length > 0 && !isExpiryBannerDismissed && (
            <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-400/60 rounded-2xl p-4 sm:p-5 shadow-sm text-gray-900 transition-all animate-fade-in space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-amber-950">
                        ⚠️ تنبيه مراقبة الصلاحية والتشغيلات (Batch & Expiry Alert)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shadow-xs">
                        {expiringProducts.length} منتج
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/90 mt-0.5">
                      يوجد {expiringProducts.length} منتج بالكتالوج تنتهي صلاحيتها خلال 3 أشهر أو أقل (أو انتهت صلاحيتها). يُوصى بتطبيق خصومات تصفية فورية عليها!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsExpiryDetailsExpanded(!isExpiryDetailsExpanded)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 text-amber-950 hover:bg-amber-50 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>{isExpiryDetailsExpanded ? 'إخفاء التفاصيل' : 'عرض المنتجات والتشغيلات'}</span>
                    {isExpiryDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>إدارة الكتالوج والتصفية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpiryBannerDismissed(true)}
                    className="p-1.5 text-amber-700 hover:text-amber-950 rounded-lg hover:bg-amber-100/50 cursor-pointer"
                    title="إغلاق التنبيه مؤقتاً"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Itemized Table of Products Expiring Soon */}
              {isExpiryDetailsExpanded && (
                <div className="pt-2 border-t border-amber-200/80 overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="border-b border-amber-200 text-amber-950 font-bold">
                        <th className="py-2 px-2.5">المنتج</th>
                        <th className="py-2 px-2.5">رقم التشغيلة (Batch)</th>
                        <th className="py-2 px-2.5">تاريخ الانتهاء</th>
                        <th className="py-2 px-2.5">المدة المتبقية</th>
                        <th className="py-2 px-2.5">المخزون الحالي</th>
                        <th className="py-2 px-2.5 text-left">إجراء سريع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/80">
                      {expiringProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/60 transition-colors">
                          <td className="py-2 px-2.5 font-bold text-gray-900">{p.name}</td>
                          <td className="py-2 px-2.5 font-mono text-amber-900 font-semibold">{p.batchNumber}</td>
                          <td className="py-2 px-2.5 font-mono text-gray-700">{p.expiryDate}</td>
                          <td className="py-2 px-2.5">
                            {p.isExpired ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                منتهي الصلاحية ⛔
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                متبقي {p.daysRemaining} يوم ⏳
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-bold font-mono">{p.stockQty} قطعة</td>
                          <td className="py-2 px-2.5 text-left">
                            <button
                              type="button"
                              onClick={() => setActiveTab('products')}
                              className="text-[11px] font-bold text-amber-900 hover:text-black underline cursor-pointer"
                            >
                              تعديل وتصفية
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {accessDeniedNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between text-xs animate-fade-in shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">{accessDeniedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAccessDeniedNotice(null)}
                className="text-amber-700 hover:text-amber-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!checkPermission(activeTab) ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">هذا القسم يتطلب صلاحيات إضافية</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                حسابك الحالي ({currentUser?.name}) ليس لديه إذن الوصول لهذا التبويب. يرجى التواصل مع المدير العام (ADMIN) لمنحك الصلاحيات اللازمة.
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'orders' && (
                <OrdersManager
                  orders={data.orders}
                  catalog={data.catalog}
                  onSaveOrder={handleSaveOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onCreateOrder={handleCreateOrder}
                  currentUserName={currentUser?.name || 'المدير'}
                />
              )}

              {activeTab === 'crm' && (
                <CrmManager
                  orders={data.orders}
                  catalog={data.catalog}
                  promoCodes={data.promoCodes}
                  onArchiveCustomer={handleArchiveCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  abandonedCarts={data.abandonedCarts || []}
                  onDeleteAbandonedCart={handleDeleteAbandonedCart}
                  onRecoverAbandonedCart={handleRecoverAbandonedCart}
                  backInStockRequests={data.backInStockRequests || []}
                  onDeleteBackInStockRequest={handleDeleteBackInStockRequest}
                  onNotifyBackInStock={handleNotifyBackInStock}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesManager
                  expenses={data.expenses}
                  orders={data.orders}
                  catalog={data.catalog}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsManager
                  orders={data.orders}
                  expenses={data.expenses}
                  catalog={data.catalog}
                />
              )}

              {activeTab === 'reels' && (
                <ReelsManager
                  reels={data.reels || []}
                  catalog={data.catalog}
                  onSaveReels={handleSaveReels}
                  onLogAction={addSystemLog}
                />
              )}

              {activeTab === 'offers' && (
                <OffersManager
                  offers={data.offers}
                  globalAlert={data.globalAlert}
                  onSaveOffers={handleSaveOffers}
                  onSaveGlobalAlert={handleSaveGlobalAlert}
                  onLogAction={addSystemLog}
                />
              )}

              {activeTab === 'promo' && (
                <PromoManager
                  promoCodes={data.promoCodes}
                  orders={data.orders}
                  onSavePromoCodes={handleSavePromoCodes}
                  onLogAction={addSystemLog}
                />
              )}

              {activeTab === 'reviews' && (
                <ReviewsManager
                  reviews={data.reviews}
                  onApproveReview={handleApproveReview}
                  onDeleteReview={handleDeleteReview}
                />
              )}

              {activeTab === 'agency' && (
                <AiAgencyManager
                  orders={data.orders}
                  catalog={data.catalog}
                  onLogAction={addSystemLog}
                />
              )}

              {activeTab === 'products' && (
                <SettingsManager
                  catalog={data.catalog}
                  settings={data.settings}
                  users={data.users}
                  collections={data.collections}
                  initialTab="catalog"
                  onSaveCatalog={handleSaveCatalog}
                  onSaveSettings={handleSaveSettings}
                  onSaveUsers={handleSaveUsers}
                  onSaveCollections={handleSaveCollections}
                  onLogAction={addSystemLog}
                  onSwitchToStore={onSwitchToStore}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsManager
                  catalog={data.catalog}
                  settings={data.settings}
                  users={data.users}
                  collections={data.collections}
                  initialTab="store"
                  onSaveCatalog={handleSaveCatalog}
                  onSaveSettings={handleSaveSettings}
                  onSaveUsers={handleSaveUsers}
                  onSaveCollections={handleSaveCollections}
                  onLogAction={addSystemLog}
                  onSwitchToStore={onSwitchToStore}
                />
              )}
            </>
          )}
        </main>

      </div>

      {/* Employee Profile Modal: Change Password & Link Personal Email */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 text-right space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#C5A059]/20 text-[#8C6D2D] rounded-xl">
                  <Key className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">إدارة حسابي وبيانات الدخول</h3>
                  <span className="text-xs text-gray-500 font-mono">
                    المستخدم: {currentUser?.name} ({currentUser?.code})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileChanges} className="space-y-4 text-xs">
              {profileModalFeedback && (
                <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs animate-fade-in ${
                  profileModalFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}>
                  {profileModalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span className="font-semibold">{profileModalFeedback.message}</span>
                </div>
              )}

              {/* Personal Email Section */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <label className="block font-bold text-gray-800">
                  ربط البريد الإلكتروني الشخصي (لاستعادة كلمة المرور):
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full p-2.5 pl-8 bg-white border border-gray-200 rounded-xl font-mono text-gray-800 focus:outline-none focus:border-[#C5A059]"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">
                  في حال نسيان كلمة المرور مستقبلاً، يمكنك النقر على "نسيت كلمة المرور" وسيتم إرسالها فوراً لهذا البريد.
                </p>
              </div>

              {/* Password Change Section */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-800">تغيير كلمة المرور الخاصة بك:</label>
                  <button
                    type="button"
                    onClick={() => setShowProfilePass(!showProfilePass)}
                    className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showProfilePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showProfilePass ? 'إخفاء' : 'إظهار'}</span>
                  </button>
                </div>

                <div>
                  <span className="block text-gray-600 mb-1">كلمة المرور الحالية:</span>
                  <input
                    type={showProfilePass ? 'text' : 'password'}
                    value={profileCurrentPass}
                    onChange={(e) => setProfileCurrentPass(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <span className="block text-gray-600 mb-1">كلمة المرور الجديدة:</span>
                  <input
                    type={showProfilePass ? 'text' : 'password'}
                    value={profileNewPass}
                    onChange={(e) => setProfileNewPass(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <span className="block text-gray-600 mb-1">تأكيد كلمة المرور الجديدة:</span>
                  <input
                    type={showProfilePass ? 'text' : 'password'}
                    value={profileConfirmPass}
                    onChange={(e) => setProfileConfirmPass(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور الجديدة للتأكيد"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111111] hover:bg-[#C5A059] text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
                >
                  💾 حفظ التعديلات على حسابي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Audit Logs Modal */}
      <SystemLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={data.systemLogs || []}
      />

    </div>
  );
};
