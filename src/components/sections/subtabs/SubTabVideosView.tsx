import React, { useState } from 'react';
import {
  Tv,
  Plus,
  Play,
  Trash2,
  Edit2,
  X,
  Search,
  ExternalLink,
  Video,
} from 'lucide-react';
import { SubTabVideo, CustomSectionSubTab } from '../../../types';

interface SubTabVideosViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

// Convert common YouTube URLs to embed format
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('watch?v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com/')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${vimeoId}`;
  }
  return url;
};

export const SubTabVideosView: React.FC<SubTabVideosViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const videos = subTab.videosData?.videos || [];
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activePlayerVideo, setActivePlayerVideo] = useState<SubTabVideo | null>(null);

  const [form, setForm] = useState<Partial<SubTabVideo>>({
    title: '',
    videoUrl: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    duration: '45 min',
    speakerOrChannel: '',
    thumbnailUrl: '',
    category: 'Prédicas',
  });

  const categories = Array.from(new Set(videos.map((v) => v.category).filter(Boolean))) as string[];

  const filteredVideos = videos.filter((v) => {
    const matchSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(search.toLowerCase())) ||
      (v.speakerOrChannel && v.speakerOrChannel.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === 'all' || v.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleOpenAdd = () => {
    setForm({
      title: '',
      videoUrl: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      duration: '45 min',
      speakerOrChannel: '',
      thumbnailUrl: '',
      category: 'Prédicas',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (video: SubTabVideo) => {
    setForm({ ...video });
    setEditingId(video.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = videos.filter((v) => v.id !== id);
    onUpdateSubTab({
      ...subTab,
      videosData: { videos: updated },
    });
    onShowToast('Video eliminado', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.videoUrl?.trim()) {
      onShowToast('El título y la URL del video son obligatorios', 'danger');
      return;
    }

    const newVideo: SubTabVideo = {
      id: editingId || `vid_${Date.now()}`,
      title: form.title.trim(),
      videoUrl: form.videoUrl.trim(),
      description: form.description || '',
      date: form.date || new Date().toISOString().split('T')[0],
      duration: form.duration || '',
      speakerOrChannel: form.speakerOrChannel || '',
      thumbnailUrl: form.thumbnailUrl || '',
      category: form.category || 'General',
    };

    let updatedList: SubTabVideo[];
    if (editingId) {
      updatedList = videos.map((v) => (v.id === editingId ? newVideo : v));
      onShowToast('Video actualizado con éxito', 'success');
    } else {
      updatedList = [...videos, newVideo];
      onShowToast('Video agregado a la galería', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      videosData: { videos: updatedList },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center font-bold">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {subTab.name || 'Galería de Videos & Grabaciones'}
            </h3>
            <p className="text-xs text-slate-500">
              {videos.length} videos disponibles
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar video..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40 sm:w-48"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({videos.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <Video className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay videos en esta sección</h4>
          <p className="text-xs text-slate-500">Agrega enlaces de YouTube, Vimeo o videos con el botón "Agregar Video".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((v) => (
            <div
              key={v.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Thumbnail / Video Preview */}
              <div
                className="relative aspect-video bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden group-hover:opacity-95"
                onClick={() => setActivePlayerVideo(v)}
              >
                {v.thumbnailUrl ? (
                  <img
                    src={v.thumbnailUrl}
                    alt={v.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-slate-500 p-4">
                    <Tv className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-[11px] text-center font-bold text-slate-300 line-clamp-1">
                      {v.title}
                    </span>
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-all group-hover:bg-black/20">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                    <Play className="w-6 h-6 ml-0.5 fill-current" />
                  </div>
                </div>

                {v.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-bold">
                    {v.duration}
                  </span>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                      {v.category || 'Video'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{v.date}</span>
                  </div>

                  <h4
                    className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 cursor-pointer hover:text-red-600"
                    onClick={() => setActivePlayerVideo(v)}
                  >
                    {v.title}
                  </h4>

                  {v.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {v.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                    {v.speakerOrChannel || 'Iglesia Central'}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setActivePlayerVideo(v)}
                      className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Ver</span>
                    </button>

                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {activePlayerVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl w-full max-w-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between text-white shrink-0 bg-slate-950/40">
              <h3 className="font-bold text-sm sm:text-base truncate max-w-md">
                {activePlayerVideo.title}
              </h3>
              <button
                type="button"
                onClick={() => setActivePlayerVideo(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                <iframe
                  src={getEmbedUrl(activePlayerVideo.videoUrl)}
                  title={activePlayerVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {activePlayerVideo.description && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activePlayerVideo.description}
                </p>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 bg-slate-950/40 rounded-b-3xl">
              <span>{activePlayerVideo.speakerOrChannel || 'Iglesia Central'} • {activePlayerVideo.date}</span>
              <a
                href={activePlayerVideo.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Abrir en fuente original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Video' : 'Nuevo Video'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Actualiza los datos del video' : 'Agrega un video de YouTube o URL directa'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título del Video *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Culto Dominical - Fe Inquebrantable"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enlace URL del Video (YouTube / Vimeo / MP4) *
                  </label>
                  <input
                    type="url"
                    required
                    value={form.videoUrl}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Ej: Prédicas, Alabanzas"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Duración Aprox.
                    </label>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="Ej: 45 min, 1h 20m"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Predicador / Canal
                    </label>
                    <input
                      type="text"
                      value={form.speakerOrChannel}
                      onChange={(e) => setForm({ ...form, speakerOrChannel: e.target.value })}
                      placeholder="Ej: Pastor Juan"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Miniatura / Portada URL (Opcional)
                  </label>
                  <input
                    type="url"
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                    placeholder="https://ejemplo.com/portada.jpg"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Resumen del mensaje o sermón..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 shrink-0 bg-slate-50/70 dark:bg-slate-900/90 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
