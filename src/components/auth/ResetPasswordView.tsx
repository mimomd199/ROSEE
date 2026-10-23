import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles,
  Loader2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { RoseeDatabase, UserAccount } from '../../types';
import { hashPassword } from '../../lib/emailService';
import { updateRoseeField } from '../../lib/firebase';
import confetti from 'canvas-confetti';

interface ResetPasswordViewProps {
  data: RoseeDatabase;
  onSaveData?: (updated: RoseeDatabase) => Promise<void>;
  onNavigateToAdmin?: () => void;
  tokenFromProp?: string;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  data,
  onSaveData,
  onNavigateToAdmin,
  tokenFromProp
}) => {
  // Extract token or OTP from prop, query parameter, or hash
  const initialTokenOrOtp = useMemo(() => {
    if (tokenFromProp) return tokenFromProp;
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const q = params.get('token') || params.get('otp');
    if (q) return q.trim();
    const hash = window.location.hash;
    if (hash.includes('token=')) {
      const match = hash.match(/token=([^&]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]).trim();
    }
    if (hash.includes('otp=')) {
      const match = hash.match(/otp=([^&]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]).trim();
    }
    return '';
  }, [tokenFromProp]);

  const [manualOtpInput, setManualOtpInput] = useState('');
  const activeCode = initialTokenOrOtp || manualOtpInput.trim();

  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Locate user matching the token or OTP
  const matchedUserEntry = useMemo(() => {
    if (!activeCode || !data.users) return null;
    return Object.entries(data.users).find(([_, u]) => {
      return (u.reset_token && u.reset_token.trim() === activeCode) ||
             (u.reset_otp && u.reset_otp.trim() === activeCode);
    }) || null;
  }, [activeCode, data.users]);

  // Verify expiration (valid within 15 minutes)
  const tokenStatus = useMemo((): 'missing' | 'invalid' | 'expired' | 'valid' => {
    if (!activeCode) return 'missing';
    if (!matchedUserEntry) return 'invalid';

    const [_, u] = matchedUserEntry;
    if (!u.reset_token_expires) return 'invalid';

    const expiresTime = typeof u.reset_token_expires === 'string' 
      ? new Date(u.reset_token_expires).getTime() 
      : Number(u.reset_token_expires);

    if (isNaN(expiresTime) || Date.now() > expiresTime) {
      return 'expired';
    }

    return 'valid';
  }, [activeCode, matchedUserEntry]);

  // Remaining time in minutes
  const remainingMinutes = useMemo(() => {
    if (tokenStatus !== 'valid' || !matchedUserEntry) return 0;
    const [_, u] = matchedUserEntry;
    const expiresTime = typeof u.reset_token_expires === 'string' 
      ? new Date(u.reset_token_expires).getTime() 
      : Number(u.reset_token_expires);
    const diff = Math.max(0, expiresTime - Date.now());
    return Math.ceil(diff / (1000 * 60));
  }, [tokenStatus, matchedUserEntry]);

  // Password strength check
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword) || /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return Math.min(score, 4);
  }, [newPassword]);

  const handleGoToAdmin = () => {
    if (onNavigateToAdmin) {
      onNavigateToAdmin();
    } else {
      window.location.href = '/admin.html';
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!matchedUserEntry) {
      setErrorMessage('تعذر التحقق من الحساب المرتبط بهذا الرابط.');
      return;
    }

    const [userCode, user] = matchedUserEntry;

    if (newPassword.length < 4) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 4 خانات على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Hash new password using SHA-256 for absolute security
      const hashedPassword = await hashPassword(newPassword);

      // Create updated user object with cleared reset token and OTP
      const updatedUser: UserAccount = {
        ...user,
        password: hashedPassword,
        reset_otp: undefined,
        reset_token: undefined,
        reset_token_expires: undefined
      };

      const updatedUsers = {
        ...data.users,
        [userCode]: updatedUser
      };

      // Add audit log
      const newLogs = [
        {
          timestamp: new Date().toISOString(),
          user: user.name || userCode,
          action: `إعادة تعيين كلمة المرور بنجاح للمستخدم (${userCode}) وتشفيرها وحذف رمز الاستعادة`
        },
        ...(data.systemLogs || [])
      ].slice(0, 500);

      // Save directly to Firebase
      await updateRoseeField('users', updatedUsers);
      await updateRoseeField('systemLogs', newLogs);

      if (onSaveData) {
        await onSaveData({
          ...data,
          users: updatedUsers,
          systemLogs: newLogs
        });
      }

      setIsSuccess(true);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C5A059', '#DFBA73', '#FFFFFF']
        });
      } catch (_) {}

    } catch (err: any) {
      console.error('Password reset failure:', err);
      setErrorMessage('حدث خطأ أثناء حفظ كلمة المرور الجديدة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center p-4 sm:p-6 font-arabic selection:bg-[#C5A059]/20 selection:text-[#C5A059]">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C5A059]/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] mb-4 shadow-xl shadow-[#C5A059]/10">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-brand tracking-[0.25em] text-white">
            R O S É E
          </h1>
          <p className="text-xs font-display tracking-widest text-[#C5A059] mt-1 uppercase font-semibold">
            بوابة الأمان والتحقق المشفر • SECURE GATEWAY
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#141414] border border-[#C5A059]/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* CASE 1: SUCCESSFUL RESET */}
          {isSuccess ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">تم تغيير كلمة المرور بنجاح!</h2>
                <p className="text-xs text-gray-300 leading-relaxed">
                  تم تشفير وحفظ كلمة المرور الجديدة بحسابك، وحذف رمز الاستعادة بالكامل لضمان أمان حسابك.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-300">
                🔒 تم تسجيل هذا الإجراء بأمان في سجل النظام.
              </div>

              <button
                type="button"
                onClick={handleGoToAdmin}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#DFBA73] to-[#C5A059] hover:from-[#C5A059] hover:to-[#A38038] text-black font-extrabold rounded-2xl text-sm transition-all duration-300 shadow-xl shadow-[#C5A059]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>تسجيل الدخول إلى لوحة التحكم الآن</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : tokenStatus === 'missing' || tokenStatus === 'invalid' ? (
            /* CASE 2: INVALID OR MISSING TOKEN -> ALLOW MANUAL OTP ENTRY */
            <div className="space-y-5 py-2">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center mx-auto text-[#C5A059]">
                  <Key className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">التحقق بواسطة كود الـ OTP</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    أدخل كود التحقق (OTP) المكون من 6 أرقام المرسل إلى بريدك:
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  value={manualOtpInput}
                  onChange={(e) => setManualOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full py-3 px-4 bg-black/40 border-2 border-[#C5A059]/40 rounded-2xl text-center text-2xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-[#C5A059]"
                />
                {manualOtpInput.length > 0 && manualOtpInput.length < 6 && (
                  <p className="text-[10px] text-gray-400 text-center">أدخل باقي الأرقام الستة</p>
                )}
                {manualOtpInput.length === 6 && !matchedUserEntry && (
                  <p className="text-xs text-rose-400 text-center font-bold">كود التحقق غير صحيح أو منتهي الصلاحية.</p>
                )}
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGoToAdmin}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>العودة إلى تسجيل الدخول وطلب كود جديد</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : tokenStatus === 'expired' ? (
            /* CASE 3: EXPIRED TOKEN */
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Clock className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">انتهت صلاحية الرابط</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  انتهت صلاحية هذا الرابط (صالح لمدة 15 دقيقة فقط من وقت الطلب). حرصاً على سرية وأمان بيانات المتجر، يرجى طلب رابط جديد.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToAdmin}
                className="w-full py-3.5 px-6 bg-[#C5A059] hover:bg-[#A38038] text-black font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>طلب رابط جديد من شاشة الدخول</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* CASE 4: VALID TOKEN - ENTER NEW PASSWORD */
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">تعيين كلمة المرور الجديدة</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                    <Clock className="w-3 h-3" />
                    <span>متبقي {remainingMinutes} دقيقة</span>
                  </span>
                </div>
                {matchedUserEntry && (
                  <p className="text-xs text-gray-400 mt-1">
                    الحساب: <strong className="text-gray-200">{matchedUserEntry[1].name}</strong> ({matchedUserEntry[0]})
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور قوية"
                    required
                    minLength={4}
                    className="w-full py-3 px-4 pl-11 bg-black/40 border border-white/15 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <div className="grid grid-cols-4 gap-1.5 h-1">
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className={`h-full rounded-full transition-colors ${
                            passwordStrength >= idx 
                              ? passwordStrength <= 2 ? 'bg-amber-400' : 'bg-emerald-400'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {passwordStrength <= 1 && 'ضعيفة'}
                      {passwordStrength === 2 && 'متوسطة'}
                      {passwordStrength === 3 && 'جيدة جداً'}
                      {passwordStrength >= 4 && 'قوية وممتازة'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  className="w-full py-3 px-4 bg-black/40 border border-white/15 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[10px] text-rose-400">كلمتا المرور غير متطابقتين بعد</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>كلمتا المرور متطابقتان</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#DFBA73] to-[#C5A059] hover:from-[#C5A059] hover:to-[#A38038] disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold rounded-2xl text-sm transition-all duration-300 shadow-xl shadow-[#C5A059]/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التشفير والحفظ...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>حفظ كلمة المرور الجديدة وتأمين الحساب</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleGoToAdmin}
                  className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  إلغاء والعودة لصفحة الدخول
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-gray-500">
          متجر Rosée للعطور ومستحضرات التجميل • نظام الحماية السحابي المشفر
        </div>
      </div>
    </div>
  );
};
