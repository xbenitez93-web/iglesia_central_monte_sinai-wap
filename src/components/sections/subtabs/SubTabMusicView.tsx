import React, { useState } from 'react';
import {
  Music,
  Plus,
  FileMusic,
  Play,
  Trash2,
  Edit2,
  X,
  Search,
  ExternalLink,
  Mic2,
  FileText,
} from 'lucide-react';
import { SubTabSong, CustomSectionSubTab } from '../../../types';

interface SubTabMusicViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

export const SubTabMusicView: React.FC<SubTabMusicViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const songs = subTab.musicData?.songs || [];
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLyricsSong, setActiveLyricsSong] = useState<SubTabSong | null>(null);

  const [form, setForm] = useState<Partial<SubTabSong>>({
    title: '',
    artistOrAuthor: '',
    keyTone: 'Sol Mayor (G)',
    tempoBpm: 120,
    audioUrl: '',
    chordsUrlOrText: '',
    sheetMusicUrl: '',
    category: 'Alabanza',
    lyrics: '',
  });

  const categories = Array.from(new Set(songs.map((s) => s.category).filter(Boolean))) as string[];

  const filteredSongs = songs.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.artistOrAuthor && s.artistOrAuthor.toLowerCase().includes(search.toLowerCase())) ||
      (s.keyTone && s.keyTone.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleOpenAdd = () => {
    setForm({
      title: '',
      artistOrAuthor: '',
      keyTone: 'Sol Mayor (G)',
      tempoBpm: 120,
      audioUrl: '',
      chordsUrlOrText: '',
      sheetMusicUrl: '',
      category: 'Alabanza',
      lyrics: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (song: SubTabSong) => {
    setForm({ ...song });
    setEditingId(song.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = songs.filter((s) => s.id !== id);
    onUpdateSubTab({
      ...subTab,
      musicData: { songs: updated },
    });
    onShowToast('Canción eliminada del cancionero', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      onShowToast('El título de la canción es obligatorio', 'danger');
      return;
    }

    const newSong: SubTabSong = {
      id: editingId || `song_${Date.now()}`,
      title: form.title.trim(),
      artistOrAuthor: form.artistOrAuthor || '',
      keyTone: form.keyTone || 'Do (C)',
      tempoBpm: form.tempoBpm || 120,
      audioUrl: form.audioUrl || '',
      chordsUrlOrText: form.chordsUrlOrText || '',
      sheetMusicUrl: form.sheetMusicUrl || '',
      category: form.category || 'Alabanza',
      lyrics: form.lyrics || '',
    };

    let updatedList: SubTabSong[];
    if (editingId) {
      updatedList = songs.map((s) => (s.id === editingId ? newSong : s));
      onShowToast('Canción actualizada con éxito', 'success');
    } else {
      updatedList = [...songs, newSong];
      onShowToast('Canción agregada al repertorio', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      musicData: { songs: updatedList },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 flex items-center justify-center font-bold">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {subTab.name || 'Música, Cancionero & Repertorio'}
            </h3>
            <p className="text-xs text-slate-500">
              {songs.length} temas en el repertorio
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
              placeholder="Buscar por título, artista o tono..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40 sm:w-56"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Canción</span>
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
                ? 'bg-pink-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todas ({songs.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-pink-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Songs Grid */}
      {filteredSongs.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <Mic2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay canciones en este repertorio</h4>
          <p className="text-xs text-slate-500">Agrega canciones con sus acordes, letra y tono con el botón "Nueva Canción".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-extrabold text-xs font-mono">
                      {song.keyTone || 'Tono G'}
                    </span>
                    {song.tempoBpm && (
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {song.tempoBpm} BPM
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {song.category || 'Alabanza'}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                    {song.title}
                  </h4>
                  {song.artistOrAuthor && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Artista / Autor: <strong>{song.artistOrAuthor}</strong>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  {(song.lyrics || song.chordsUrlOrText) && (
                    <button
                      type="button"
                      onClick={() => setActiveLyricsSong(song)}
                      className="px-2.5 py-1 rounded-xl bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 text-pink-600 dark:text-pink-400 font-bold text-xs flex items-center space-x-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Letra / Acordes</span>
                    </button>
                  )}

                  {song.audioUrl && (
                    <a
                      href={song.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                      title="Escuchar Demo / Audio"
                    >
                      <Play className="w-3 h-3 text-pink-500" />
                    </a>
                  )}

                  {song.sheetMusicUrl && (
                    <a
                      href={song.sheetMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                      title="Descargar Partitura"
                    >
                      <FileMusic className="w-3 h-3 text-purple-500" />
                    </a>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(song)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(song.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lyrics & Chords Modal */}
      {activeLyricsSong && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300">
                  {activeLyricsSong.keyTone || 'Tono Libre'} • {activeLyricsSong.tempoBpm || 120} BPM
                </span>
                <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg mt-1">
                  {activeLyricsSong.title}
                </h3>
                {activeLyricsSong.artistOrAuthor && (
                  <p className="text-xs text-slate-500">{activeLyricsSong.artistOrAuthor}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveLyricsSong(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
              {activeLyricsSong.chordsUrlOrText && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-2">
                    Cifrado / Acordes
                  </h4>
                  <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {activeLyricsSong.chordsUrlOrText}
                  </pre>
                </div>
              )}

              {activeLyricsSong.lyrics && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-2">
                    Letra Completa
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {activeLyricsSong.lyrics}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/90 rounded-b-3xl">
              <span className="text-xs text-slate-400">Repertorio Oficial</span>
              <button
                type="button"
                onClick={() => setActiveLyricsSong(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Canción' : 'Nueva Canción / Repertorio'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Modifica letra, tono o enlaces de audio' : 'Registra un tema musical con acordes y tonalidad'}
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
                    Título de la Canción *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: La Bondad de Dios, Digno y Santo..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Artista / Autor
                    </label>
                    <input
                      type="text"
                      value={form.artistOrAuthor}
                      onChange={(e) => setForm({ ...form, artistOrAuthor: e.target.value })}
                      placeholder="Ej: Bethel Music, Miel San Marcos"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Ej: Alabanza, Adoración, Especial"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tono / Clave
                    </label>
                    <input
                      type="text"
                      value={form.keyTone}
                      onChange={(e) => setForm({ ...form, keyTone: e.target.value })}
                      placeholder="Ej: Sol Mayor (G), Re (D)"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempo (BPM)
                    </label>
                    <input
                      type="number"
                      value={form.tempoBpm}
                      onChange={(e) => setForm({ ...form, tempoBpm: parseInt(e.target.value) || 0 })}
                      placeholder="120"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Audio / Spotify / Demo URL
                    </label>
                    <input
                      type="url"
                      value={form.audioUrl}
                      onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                      placeholder="https://open.spotify.com/..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Partitura URL (PDF)
                    </label>
                    <input
                      type="url"
                      value={form.sheetMusicUrl}
                      onChange={(e) => setForm({ ...form, sheetMusicUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Acordes / Cifrado (Texto)
                  </label>
                  <textarea
                    rows={3}
                    value={form.chordsUrlOrText}
                    onChange={(e) => setForm({ ...form, chordsUrlOrText: e.target.value })}
                    placeholder="[Intro] G  C  Em  D..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Letra de la Canción
                  </label>
                  <textarea
                    rows={3}
                    value={form.lyrics}
                    onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
                    placeholder="Escribe o pega la letra..."
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
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Canción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
