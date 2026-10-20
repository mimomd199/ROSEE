import React, { useState } from 'react';
import { Video, Plus, Trash2, Edit3, Eye, EyeOff, Play, Tag, Sparkles, Check, Clock, Heart, ExternalLink } from 'lucide-react';
import { ReelItem, ProductCatalog } from '../../types';

interface ReelsManagerProps {
  reels: ReelItem[];
  catalog: ProductCatalog;
  onSaveReels: (updatedReels: ReelItem[]) => Promise<void>;
  onLogAction?: (action: string) => void;
}

export const ReelsManager: React.FC<ReelsManagerProps> = ({
  reels,
  catalog,
  onSaveReels,
  onLogAction
}) => {
  const [reelsList, setReelsList] = useState<ReelItem[]>(reels || []);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<Partial<ReelItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const productNames = Object.keys(catalog || {});

  const handleOpenAddModal = () => {
    setEditingReel({
      id: `REEL-${Date.now()}`,
      title: '',
      videoUrl: '',
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      productName: productNames[0] || '',
      duration: '00:15',
      likesCount: 500,
      creatorHandle: '@rosee_cosmetics',
      status: 'published'
    });
    setIsEditingModalOpen(true);
  };

  const handleOpenEditModal = (reel: ReelItem) => {
    setEditingReel({ ...reel });
    setIsEditingModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!editingReel || !editingReel.title) {
      alert('يرجى كتابة عنوان جذاب للريل');
      return;
    }
    setIsSaving(true);
    const existingIndex = reelsList.findIndex(r => r.id === editingReel.id);
    let updated: ReelItem[];
    if (existingIndex >= 0) {
      updated = [...reelsList];
      updated[existingIndex] = editingReel as ReelItem;
    } else {
      updated = [editingReel as ReelItem, ...reelsList];
    }
    setReelsList(updated);
    await onSaveReels(updated);
    setIsSaving(false);
    setIsEditingModalOpen(false);
    setEditingReel(null);
  };

  const handleDeleteReel = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الريل؟')) return;
    const updated = reelsList.filter(r => r.id !== id);
    setReelsList(updated);
    await onSaveReels(updated);
  };

  const handleToggleStatus = async (id: string) => {
    const updated = reelsList.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: r.status === 'published' ? ('hidden' as const) : ('published' as const)
        };
      }
      return r;
    });
    setReelsList(updated);
    await onSaveReels(updated);
  };

  return (
    <div className="space-y-6 font-arabic">
      
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#C5A059]" />
            إدارة فيديوهات الريلز والـ UGC (User-Generated Content)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            إضافة فيديوهات الريلز وتجارب العملاء والمؤثرين، تتحرك تلقائياً من اليمين لليسار في واجهة المتجر مع ربط كل فيديو بمنتجه المباشر.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059] hover:bg-[#b08d48] text-[#111111] font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ريل فيديو جديد</span>
        </button>
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {reelsList.length === 0 ? (
          <div className="col-span-full p-12 bg-white border border-gray-100 rounded-2xl text-center text-xs text-gray-400">
            لا توجد فيديوهات ريلز مضافة حالياً. انقر على "إضافة ريل فيديو جديد" للبدء.
          </div>
        ) : (
          reelsList.map((reel) => {
            const isPublished = reel.status === 'published';
            return (
              <div 
                key={reel.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs flex flex-col transition-all hover:shadow-md ${
                  isPublished ? 'border-gray-200' : 'border-amber-200 opacity-75'
                }`}
              >
                {/* 9:16 Video Thumbnail Container */}
                <div className="relative aspect-[9/14] bg-black overflow-hidden group">
                  <img
                    src={reel.thumbnail}
                    alt={reel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                  {/* Badges on top */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPublished ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
                    }`}>
                      {isPublished ? 'منشور في المتجر' : 'مخفي مؤقتاً'}
                    </span>

                    <span className="flex items-center gap-1 px-2 py-0.5 bg-black/60 text-white rounded-full text-[10px] font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {reel.duration || '00:15'}
                    </span>
                  </div>

                  {/* Play preview icon */}
                  {reel.videoUrl && (
                    <button
                      onClick={() => setPreviewVideoUrl(reel.videoUrl || null)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg"
                      title="معاينة الفيديو"
                    >
                      <Play className="w-5 h-5 fill-white text-white mr-0.5" />
                    </button>
                  )}

                  {/* Bottom Info on Thumbnail */}
                  <div className="absolute bottom-3 inset-x-3 space-y-1">
                    <p className="text-[11px] font-medium text-white/80 font-mono">
                      {reel.creatorHandle || '@rosee_cosmetics'}
                    </p>
                    <p className="text-xs font-bold text-white line-clamp-2">
                      {reel.title}
                    </p>
                    {reel.productName && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[10px] text-white">
                        <Tag className="w-2.5 h-2.5 text-[#C5A059]" />
                        <span className="truncate max-w-[150px]">{reel.productName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Controls */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(reel.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isPublished ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                      }`}
                      title={isPublished ? 'إخفاء الريل' : 'نشر الريل'}
                    >
                      {isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(reel)}
                      className="p-1.5 text-gray-500 hover:text-[#C5A059] hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="تعديل الريل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteReel(reel.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف الريل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Add Modal */}
      {isEditingModalOpen && editingReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-[#C5A059]" />
                {reelsList.some(r => r.id === editingReel.id) ? 'تعديل ريل فيديو' : 'إضافة ريل جديد'}
              </h3>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عنوان الفيديو / الوصف القصير *</label>
                <input
                  type="text"
                  value={editingReel.title || ''}
                  onChange={(e) => setEditingReel({ ...editingReel, title: e.target.value })}
                  placeholder="مثال: تجربة عطر Bunny Rose الوردي مع نضارة لا تقاوم ✨"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-[#C5A059] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رابط الفيديو (Direct MP4 URL / Video Link) *</label>
                <input
                  type="text"
                  value={editingReel.videoUrl || ''}
                  onChange={(e) => setEditingReel({ ...editingReel, videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4 أو رابط فيديو مباشر"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-[#C5A059] outline-none font-mono"
                  dir="ltr"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  يدعم روابط MP4 المباشرة وروابط التخزين السحابي. في حال ترك الرابط فارغاً سيتم عرض غلاف الصورة كفيديو ترويجي.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">صورة الغلاف / البوستر (Thumbnail Image) *</label>
                <input
                  type="text"
                  value={editingReel.thumbnail || ''}
                  onChange={(e) => setEditingReel({ ...editingReel, thumbnail: e.target.value })}
                  placeholder="رابط صورة الغلاف أو Base64"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-[#C5A059] outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">مدة الفيديو</label>
                  <input
                    type="text"
                    value={editingReel.duration || '00:15'}
                    onChange={(e) => setEditingReel({ ...editingReel, duration: e.target.value })}
                    placeholder="مثال: 00:15"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-[#C5A059] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم صانع المحتوى / الحساب</label>
                  <input
                    type="text"
                    value={editingReel.creatorHandle || '@rosee_cosmetics'}
                    onChange={(e) => setEditingReel({ ...editingReel, creatorHandle: e.target.value })}
                    placeholder="@rosee_cosmetics"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-[#C5A059] outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ربط بالمنتج المعروض بالفيديو</label>
                <select
                  value={editingReel.productName || ''}
                  onChange={(e) => setEditingReel({ ...editingReel, productName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-[#C5A059] outline-none bg-white"
                >
                  <option value="">بدون ربط بمنتج محدد</option>
                  {productNames.map((pName) => (
                    <option key={pName} value={pName}>{pName}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  عند مشاهدة العميل للريل، يظهر له زر مباشر لشراء هذا المنتج فوراً.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">حالة الظهور</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      checked={editingReel.status === 'published'}
                      onChange={() => setEditingReel({ ...editingReel, status: 'published' })}
                      className="text-[#C5A059]"
                    />
                    <span>منشور ومرئي في واجهة المتجر</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      checked={editingReel.status === 'hidden'}
                      onChange={() => setEditingReel({ ...editingReel, status: 'hidden' })}
                      className="text-[#C5A059]"
                    />
                    <span>مسودة / مخفي مؤقتاً</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveModal}
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold bg-[#C5A059] hover:bg-[#b08d48] text-[#111111] rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ ونشر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-sm w-full bg-black rounded-3xl overflow-hidden shadow-2xl aspect-[9/16]">
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer hover:bg-black/90"
            >
              ✕
            </button>
            <video
              src={previewVideoUrl}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

    </div>
  );
};
