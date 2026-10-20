import React, { useState, useRef } from 'react';
import { Layers, ChevronRight, ChevronLeft, ShoppingBag, X, Sparkles, ArrowLeft, Eye } from 'lucide-react';
import { CollectionGroup, ProductCatalog, CatalogItem, StoreColors } from '../../types';

interface CollectionsSectionProps {
  collections?: CollectionGroup[];
  catalog: ProductCatalog;
  colors?: Partial<StoreColors>;
  onAddToCart: (productKey: string, sizeName?: string, unitPrice?: number, e?: React.MouseEvent<HTMLElement>) => void;
  onOpenCart: () => void;
  onOpenQuickView: (productKey: string) => void;
}

export const CollectionsSection: React.FC<CollectionsSectionProps> = ({
  collections = [],
  catalog,
  colors,
  onAddToCart,
  onOpenCart,
  onOpenQuickView
}) => {
  const [selectedCollection, setSelectedCollection] = useState<CollectionGroup | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (!collections || collections.length === 0) return null;

  const primaryAccent = colors?.primaryAccent || '#C5A059';

  // Get products belonging to the selected collection
  const getCollectionProducts = (col: CollectionGroup): Array<{ key: string; item: CatalogItem }> => {
    return Object.entries(catalog).map(([key, item]) => ({ key, item })).filter(({ key, item }) => {
      if (item.collectionName && item.collectionName.toLowerCase() === col.name.toLowerCase()) return true;
      if (col.categoryTag && col.categoryTag !== 'ALL') {
        if (key.includes(col.categoryTag)) return true;
      }
      return key.toLowerCase().includes(col.name.toLowerCase());
    });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      handleScroll(diff > 0 ? 'right' : 'left');
    }
    setTouchStartX(null);
  };

  const activeProducts = selectedCollection ? getCollectionProducts(selectedCollection) : [];

  return (
    <section id="collections" className="py-16 bg-[#FAF9F6] border-b border-gray-100 font-arabic select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C5A059]/15 text-[#8C6D2D] mb-2 border border-[#C5A059]/30">
              <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>تشكيلات فاخرة متناسقة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              تسوقي حسب المجموعات (Shop by Collection)
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              انقري على أي مجموعة لعرض منتجاتها المتناسقة والتنقل بينها باللمس أو الأسهم.
            </p>
          </div>
        </div>

        {/* Collections Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => setSelectedCollection(col)}
              className="group relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-200"
            >
              {/* Cover Image */}
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 group-hover:from-black/90 transition-colors" />

              {/* Card Badges */}
              <div className="absolute top-4 right-4 z-10">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">
                  {col.categoryTag || 'مجموعة فاخرة'}
                </span>
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-6 inset-x-6 z-10 text-right space-y-2 text-white">
                <h3 className="text-xl sm:text-2xl font-bold leading-tight group-hover:text-[#C5A059] transition-colors">
                  {col.name}
                </h3>
                {col.description && (
                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed font-normal">
                    {col.description}
                  </p>
                )}
                
                <div className="pt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C5A059] group-hover:translate-x-[-4px] transition-transform">
                    <span>استعراض منتجات المجموعة</span>
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                  
                  <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#C5A059] group-hover:text-[#111111] transition-colors">
                    <Layers className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Interactive Collection Products Modal / Slider */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-arabic">
          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#111111] text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCollection.image}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-[#C5A059]/40"
                />
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#C5A059] block">تشكيلة ROSÉE الحصرية</span>
                  <h3 className="text-base sm:text-lg font-bold text-white">{selectedCollection.name}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Arrow navigation for laptops */}
                <button
                  onClick={() => handleScroll('right')}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#C5A059] hover:text-[#111111] text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="المنتج السابق (اليمين)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleScroll('left')}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#C5A059] hover:text-[#111111] text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="المنتج التالي (اليسار)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setSelectedCollection(null)}
                  className="w-9 h-9 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 flex items-center justify-center transition-colors cursor-pointer mr-2"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Gesture Hint for Phone / Laptop */}
            <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>
                💡 اسحبي لليمين أو اليسار للتنقل بين منتجات المجموعة (باللمس على الهاتف، أو بالأسهم على اللاب توب).
              </span>
              <span className="font-bold text-[#8C6D2D]">
                {activeProducts.length} منتجات في هذه المجموعة
              </span>
            </div>

            {/* Horizontal Swipeable Products Slider */}
            <div
              ref={scrollContainerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="p-6 overflow-x-auto overflow-y-hidden flex gap-5 no-scrollbar scroll-smooth"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {activeProducts.length === 0 ? (
                <div className="w-full py-16 text-center text-xs text-gray-400">
                  لا توجد منتجات مسجلة في هذه المجموعة حالياً.
                </div>
              ) : (
                activeProducts.map(({ key, item }) => {
                  const hasSizes = Boolean(item.hasSizes && item.sizes && item.sizes.length > 0);
                  const displayPrice = hasSizes ? item.sizes![0].price : item.defaultPrice;

                  return (
                    <div
                      key={key}
                      style={{ scrollSnapAlign: 'start' }}
                      className="w-64 sm:w-72 shrink-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      {/* Product Image */}
                      <div 
                        className="relative aspect-square bg-gray-100 cursor-pointer overflow-hidden group"
                        onClick={() => onOpenQuickView(key)}
                      >
                        <img
                          src={item.image}
                          alt={key}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 bg-white/90 text-gray-900 rounded-xl text-xs font-bold shadow-md flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة وتفاصيل</span>
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-2 text-right flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 
                            onClick={() => onOpenQuickView(key)}
                            className="text-xs sm:text-sm font-bold text-gray-900 hover:text-[#C5A059] transition-colors cursor-pointer line-clamp-2"
                          >
                            {key}
                          </h4>
                          {item.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">السعر:</span>
                            <span className="text-sm font-bold font-brand text-[#111111]">
                              {displayPrice} ج.م
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                onAddToCart(key, undefined, undefined, e);
                                onOpenCart();
                              }}
                              className="flex-1 py-2 px-3 bg-[#111111] hover:bg-[#C5A059] text-white hover:text-[#111111] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>إضافة للسلة</span>
                            </button>

                            <button
                              onClick={() => onOpenQuickView(key)}
                              className="p-2 border border-gray-200 hover:border-[#C5A059] text-gray-600 rounded-xl transition-colors cursor-pointer"
                              title="معاينة الأحجام والتفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                يمكنكِ أيضاً تصفح باقي المنتجات في الكتالوج العام بالأسفل.
              </span>
              <button
                onClick={() => setSelectedCollection(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
