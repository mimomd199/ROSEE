import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, ShoppingBag, Tag, Sparkles, ChevronRight, ChevronLeft, Heart, Clock } from 'lucide-react';
import { ReelItem, ProductCatalog, StoreColors } from '../../types';

interface ReelsSectionProps {
  reels?: ReelItem[];
  catalog: ProductCatalog;
  colors?: Partial<StoreColors>;
  lang?: 'ar' | 'en';
  onAddToCart?: (productKey: string, sizeName?: string, unitPrice?: number, e?: React.MouseEvent<HTMLElement>) => void;
  onOpenCart?: () => void;
}

export const ReelsSection: React.FC<ReelsSectionProps> = ({
  reels = [],
  catalog,
  colors,
  lang = 'ar',
  onAddToCart,
  onOpenCart
}) => {
  const publishedReels = reels.filter(r => r.status === 'published');
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [isPausedByHover, setIsPausedByHover] = useState(false);
  const marqueeContainerRef = useRef<HTMLDivElement | null>(null);

  if (publishedReels.length === 0) return null;

  // Ensure enough items in base list so a single track is comfortably wider than viewport
  let baseReels = [...publishedReels];
  while (baseReels.length < 8) {
    baseReels = [...baseReels, ...publishedReels];
  }

  const primaryAccent = colors?.primaryAccent || '#C5A059';
  const isAr = lang === 'ar';

  const t = {
    badge: isAr ? 'فيديوهات وتجارب حية ملهمة' : 'Live Beauty Stories & Reels',
    title: isAr ? 'ريلز ROSÉE الحصرية بالفيديو ✨' : 'Rosée Exclusive Reels & Looks ✨',
    subtitle: isAr 
      ? 'شاهدي روتين الجمال وتجارب استخدام مستحضراتنا على الطبيعة واطلبي إطلالتكِ فوراً بنقرة واحدة.' 
      : 'Watch real beauty routines & texture previews, and shop your favorite look with one tap.',
    orderLook: isAr ? 'طلب الإطلالة' : 'Shop Look',
    orderNow: isAr ? 'طلب فوراً' : 'Order Now',
    featuredProduct: isAr ? 'المنتج المعروض بالفيديو' : 'Featured in this Reel',
    prev: isAr ? 'السابق' : 'Previous',
    next: isAr ? 'التالي' : 'Next',
    close: isAr ? 'إغلاق' : 'Close',
    currency: isAr ? 'ج.م' : 'EGP'
  };

  const handleOpenReel = (reel: ReelItem) => {
    const idx = publishedReels.findIndex(r => r.id === reel.id);
    setActiveReelIndex(idx >= 0 ? idx : 0);
    setIsPlaying(true);
    setIsMuted(false);
  };

  const activeReel = activeReelIndex !== null ? publishedReels[activeReelIndex] : null;
  const taggedProduct = activeReel?.productName ? catalog[activeReel.productName] : null;

  const handleNextReel = () => {
    if (activeReelIndex !== null) {
      setActiveReelIndex((activeReelIndex + 1) % publishedReels.length);
      setIsPlaying(true);
    }
  };

  const handlePrevReel = () => {
    if (activeReelIndex !== null) {
      setActiveReelIndex((activeReelIndex - 1 + publishedReels.length) % publishedReels.length);
      setIsPlaying(true);
    }
  };

  const handleToggleLike = (id: string) => {
    const next = new Set(likedReels);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLikedReels(next);
  };

  const renderReelCard = (reel: ReelItem, uniqueKey: string) => {
    const isLiked = likedReels.has(reel.id);

    return (
      <div
        key={uniqueKey}
        onClick={() => handleOpenReel(reel)}
        className="relative w-44 sm:w-60 aspect-[9/15] rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl cursor-pointer shrink-0 transition-all duration-300 hover:scale-103 hover:border-[#C5A059]/70 group/card"
      >
        {/* Poster / Thumbnail Image */}
        <img
          src={reel.thumbnail}
          alt={reel.title}
          className="w-full h-full object-cover group-hover/card:scale-108 transition-transform duration-700"
          loading="lazy"
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-mono text-gray-200 border border-white/10">
            <Clock className="w-3 h-3 text-[#C5A059]" />
            {reel.duration || '00:15'}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLike(reel.id);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${
              isLiked ? 'bg-red-500 text-white' : 'bg-black/50 text-white/80 hover:bg-black/70'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Central Play Icon */}
        <div className="absolute inset-0 m-auto w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover/card:scale-110 group-hover/card:bg-[#C5A059] group-hover/card:text-black transition-all shadow-xl">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>

        {/* Bottom Info & Quick Add Action */}
        <div className="absolute bottom-3 inset-x-3 z-10 space-y-1.5 text-right">
          <span className="text-[10px] font-bold text-[#C5A059] font-mono block">
            {reel.creatorHandle || '@rosee_cosmetics'}
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 leading-snug">
            {reel.title}
          </h4>
          
          {reel.productName && (
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
              <div className="flex items-center gap-1 min-w-0">
                <Tag className="w-3 h-3 text-[#C5A059] shrink-0" />
                <span className="text-[10px] text-gray-300 truncate">{reel.productName}</span>
              </div>

              {/* Direct 1-Click Buy button passing click event for flying particle dot */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAddToCart && reel.productName) {
                    onAddToCart(reel.productName, undefined, undefined, e);
                  }
                }}
                className="p-1.5 bg-[#C5A059] hover:bg-white text-black rounded-lg transition-transform hover:scale-110 active:scale-95 shadow-md cursor-pointer shrink-0 flex items-center gap-1"
                title={t.orderLook}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section 
      id="reels"
      className="py-14 sm:py-20 bg-[#070707] text-white overflow-hidden relative border-y border-white/10 select-none max-w-full"
    >
      {/* Background Ambience */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#8C6D2D]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-brand">
          {t.title}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Truly Infinite & Continuous Seamless Marquee Track (Duplicated Track Pattern) */}
      <div 
        dir="ltr"
        ref={marqueeContainerRef}
        className="relative w-full overflow-hidden group/marquee py-3"
        onMouseEnter={() => setIsPausedByHover(true)}
        onMouseLeave={() => setIsPausedByHover(false)}
        onTouchStart={() => setIsPausedByHover(true)}
        onTouchEnd={() => setTimeout(() => setIsPausedByHover(false), 500)}
        onTouchCancel={() => setIsPausedByHover(false)}
      >
        <div 
          className="flex w-max animate-reels-marquee"
          style={{ 
            animationPlayState: isPausedByHover ? 'paused' : 'running'
          }}
        >
          {/* Primary Track */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 pr-4 sm:pr-6" dir="ltr">
            {baseReels.map((reel, index) => renderReelCard(reel, `track1-${reel.id}-${index}`))}
          </div>

          {/* Secondary Track (Cloned for 100% mathematical seamless loop) */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 pr-4 sm:pr-6" aria-hidden="true" dir="ltr">
            {baseReels.map((reel, index) => renderReelCard(reel, `track2-${reel.id}-${index}`))}
          </div>
        </div>
      </div>

      {/* Reel Fullscreen Modal Viewer */}
      {activeReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/92 backdrop-blur-lg animate-fade-in">
          
          {/* Main Reel Card Container */}
          <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col justify-between">
            
            {/* Top Bar Controls */}
            <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono bg-black/70 px-2.5 py-1 rounded-full border border-white/10">
                  {activeReel.creatorHandle || '@rosee_cosmetics'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/10 cursor-pointer"
                  title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setActiveReelIndex(null)}
                  className="w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/10 cursor-pointer"
                  title={t.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video or Animated Preview Frame */}
            <div 
              className="absolute inset-0 bg-zinc-950 flex items-center justify-center cursor-pointer"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {activeReel.videoUrl ? (
                <video
                  src={activeReel.videoUrl}
                  poster={activeReel.thumbnail}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  playsInline
                  muted={isMuted}
                />
              ) : (
                <img
                  src={activeReel.thumbnail}
                  alt={activeReel.title}
                  className="w-full h-full object-cover animate-pulse"
                />
              )}

              {/* Center Play/Pause Indicator when paused */}
              {!isPlaying && (
                <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              )}
            </div>

            {/* Navigation Arrows for Previous / Next Reel */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevReel();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C5A059] text-white hover:text-black flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-white/10"
              title={t.prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextReel();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C5A059] text-white hover:text-black flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-white/10"
              title={t.next}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Card Footer: Tagged Product & Direct 1-Click Order */}
            <div className="absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-black via-black/80 to-transparent space-y-3 text-right">
              <div>
                <h3 className="text-sm font-bold text-white drop-shadow-md">
                  {activeReel.title}
                </h3>
                {activeReel.caption && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                    {activeReel.caption}
                  </p>
                )}
              </div>

              {/* Tagged Product Box */}
              {taggedProduct && (
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={taggedProduct.image}
                      alt={activeReel.productName}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#C5A059]/40"
                    />
                    <div className="text-right truncate">
                      <span className="text-[10px] font-bold text-[#C5A059] block">
                        {t.featuredProduct}
                      </span>
                      <span className="text-xs font-bold text-white block truncate">
                        {activeReel.productName}
                      </span>
                      <span className="text-xs font-bold text-[#C5A059] block tabular-nums">
                        {taggedProduct.defaultPrice} {t.currency}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      if (onAddToCart && activeReel.productName) {
                        onAddToCart(activeReel.productName, undefined, undefined, e);
                      }
                      setActiveReelIndex(null);
                      if (onOpenCart) onOpenCart();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#C5A059] hover:bg-white text-[#111111] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer shrink-0"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t.orderNow}</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </section>
  );
};
