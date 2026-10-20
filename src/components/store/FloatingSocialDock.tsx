import React, { useState } from 'react';
import { MessageCircle, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppSettings, StoreColors, SocialDockSettings } from '../../types';
import { getResolvedSocialDockSettings } from '../../lib/storeDefaults';

interface FloatingSocialDockProps {
  settings: AppSettings;
  colors?: Partial<StoreColors>;
}

export const FloatingSocialDock: React.FC<FloatingSocialDockProps> = ({
  settings,
  colors
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dockConfig: SocialDockSettings = getResolvedSocialDockSettings(settings);

  const social = settings.socialLinks || {
    whatsapp: '201117237246',
    insta: 'https://www.instagram.com/rosee_cosmo',
    fb: 'https://www.facebook.com/share/19ku6pTCYz',
    tiktok: 'https://www.tiktok.com/@rose.cosmetics822'
  };

  const whatsappPhone = (social.whatsapp || '201117237246').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent('مرحباً Rosée، أود الاستفسار عن المستحضرات والعروض المتوفرة ✨')}`;

  const primaryAccent = colors?.primaryAccent || '#C5A059';

  // Size styling classes
  const sizeClasses = {
    micro: {
      btn: 'w-7 h-7 sm:w-8 sm:h-8',
      icon: 'w-3.5 h-3.5',
      dock: 'gap-1.5 p-1'
    },
    compact: {
      btn: 'w-8 h-8 sm:w-9 sm:h-9',
      icon: 'w-4 h-4',
      dock: 'gap-2 p-1.5'
    },
    standard: {
      btn: 'w-10 h-10',
      icon: 'w-5 h-5',
      dock: 'gap-2.5 p-1.5'
    }
  }[dockConfig.size || 'compact'];

  // Theme styling classes
  const getThemeClasses = (type: 'whatsapp' | 'insta' | 'tiktok' | 'fb') => {
    const theme = dockConfig.theme || 'gold_luxury';

    if (theme === 'gold_luxury') {
      return {
        bg: 'bg-black/90 hover:bg-[#C5A059] text-[#C5A059] hover:text-black border border-[#C5A059]/40 hover:border-[#C5A059]',
        shadow: 'hover:shadow-[0_0_15px_rgba(197,160,89,0.5)]'
      };
    }

    if (theme === 'glassmorphism') {
      return {
        bg: 'bg-white/10 hover:bg-white/25 text-white backdrop-blur-xl border border-white/20 hover:border-white/40',
        shadow: 'hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)]'
      };
    }

    if (theme === 'minimal_dark') {
      return {
        bg: 'bg-[#181818] hover:bg-white text-gray-300 hover:text-black border border-white/10 hover:border-white',
        shadow: 'hover:shadow-lg'
      };
    }

    // brand_colors with refined luxury look
    switch (type) {
      case 'whatsapp':
        return {
          bg: 'bg-[#25D366] text-white hover:brightness-110 border border-emerald-400/40',
          shadow: 'hover:shadow-[0_0_12px_rgba(37,211,102,0.4)]'
        };
      case 'insta':
        return {
          bg: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:brightness-110 border border-pink-400/30',
          shadow: 'hover:shadow-[0_0_12px_rgba(221,42,123,0.4)]'
        };
      case 'tiktok':
        return {
          bg: 'bg-black text-white hover:bg-zinc-800 border border-white/25',
          shadow: 'hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]'
        };
      case 'fb':
        return {
          bg: 'bg-[#1877F2] text-white hover:brightness-110 border border-blue-400/30',
          shadow: 'hover:shadow-[0_0_12px_rgba(24,119,242,0.4)]'
        };
    }
  };

  // Motion styling classes
  const motionClass = {
    luxury_pulse: 'animate-pulse hover:animate-none',
    glow_aura: 'shadow-[0_0_10px_rgba(197,160,89,0.25)]',
    subtle_bounce: 'hover:-translate-y-0.5',
    static: ''
  }[dockConfig.motionEffect || 'luxury_pulse'];

  const isLeft = dockConfig.position !== 'right';

  return (
    <aside 
      aria-label="روابط التواصل الاجتماعي الفاخرة"
      className={`fixed ${isLeft ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} top-1/2 -translate-y-1/2 z-40 flex flex-col items-center ${sizeClasses.dock} bg-black/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 transition-all duration-300 select-none hover:border-[#C5A059]/50`}
      style={{
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(197, 160, 89, 0.15)'
      }}
    >
      {/* Mini Toggle for Mobile Comfort */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer"
        title={isCollapsed ? 'إظهار الروابط' : 'تصغير'}
      >
        {isLeft ? (
          isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />
        ) : (
          isCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
        )}
      </button>

      {!isCollapsed && (
        <>
          {/* WhatsApp Action */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="محادثة واتساب مباشرة"
            className={`group relative ${sizeClasses.btn} rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${getThemeClasses('whatsapp').bg} ${getThemeClasses('whatsapp').shadow} ${motionClass}`}
          >
            <MessageCircle className={`${sizeClasses.icon} fill-current`} />
            
            {/* Pulsing luxury dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#C5A059] rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#C5A059] rounded-full" />
            
            {/* Safe Tooltip on inner side */}
            <span 
              className={`hidden sm:group-hover:block pointer-events-none absolute ${isLeft ? 'left-full ml-3' : 'right-full mr-3'} px-2.5 py-1 bg-black/95 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap font-arabic border border-[#C5A059]/30 transition-all z-50`}
            >
              واتساب فوري ✨
            </span>
          </a>

          {/* Instagram Action */}
          <a
            href={social.insta || 'https://www.instagram.com/'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="حساب إنستغرام"
            className={`group relative ${sizeClasses.btn} rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${getThemeClasses('insta').bg} ${getThemeClasses('insta').shadow} ${motionClass}`}
          >
            <svg className={`${sizeClasses.icon} fill-current`} viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span 
              className={`hidden sm:group-hover:block pointer-events-none absolute ${isLeft ? 'left-full ml-3' : 'right-full mr-3'} px-2.5 py-1 bg-black/95 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap font-arabic border border-[#C5A059]/30 transition-all z-50`}
            >
              إنستغرام ROSÉE
            </span>
          </a>

          {/* TikTok Action */}
          <a
            href={social.tiktok || 'https://www.tiktok.com/'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="حساب تيك توك"
            className={`group relative ${sizeClasses.btn} rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${getThemeClasses('tiktok').bg} ${getThemeClasses('tiktok').shadow} ${motionClass}`}
          >
            <svg className={`${sizeClasses.icon} fill-current`} viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
            <span 
              className={`hidden sm:group-hover:block pointer-events-none absolute ${isLeft ? 'left-full ml-3' : 'right-full mr-3'} px-2.5 py-1 bg-black/95 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap font-arabic border border-[#C5A059]/30 transition-all z-50`}
            >
              تيك توك ROSÉE
            </span>
          </a>

          {/* Facebook Action */}
          <a
            href={social.fb || 'https://www.facebook.com/'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="صفحة فيسبوك"
            className={`group relative ${sizeClasses.btn} rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${getThemeClasses('fb').bg} ${getThemeClasses('fb').shadow} ${motionClass}`}
          >
            <svg className={`${sizeClasses.icon} fill-current`} viewBox="0 0 24 24">
              <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.456 5 15.688 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/>
            </svg>
            <span 
              className={`hidden sm:group-hover:block pointer-events-none absolute ${isLeft ? 'left-full ml-3' : 'right-full mr-3'} px-2.5 py-1 bg-black/95 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap font-arabic border border-[#C5A059]/30 transition-all z-50`}
            >
              فيسبوك ROSÉE
            </span>
          </a>
        </>
      )}
    </aside>
  );
};
