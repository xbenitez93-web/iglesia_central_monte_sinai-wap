import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Download,
  FileText,
  Trash2,
  Edit2,
  X,
  Search,
  ExternalLink,
  BookMarked,
} from 'lucide-react';
import { SubTabLibraryResource, CustomSectionSubTab } from '../../../types';

interface SubTabLibraryViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

export const SubTabLibraryView: React.FC<SubTabLibraryViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const resources = subTab.libraryData?.resources || [];
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<SubTabLibraryResource>>({
    title: '',
    author: '',
    category: 'Libros & Guías',
    fileUrl: '',
    coverUrl: '',
    pagesOrSize: 'PDF • 5 MB',
    description: '',
    format: 'PDF',
  });

  const categories = Array.from(new Set(resources.map((r) => r.category).filter(Boolean))) as string[];

  const filteredResources = resources.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.author && r.author.toLowerCase().includes(search.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleOpenAdd = () => {
    setForm({
      title: '',
      author: '',
      category: 'Libros & Guías',
      fileUrl: '',
      coverUrl: '',
      pagesOrSize: 'PDF • 5 MB',
      description: '',
      format: 'PDF',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: SubTabLibraryResource) => {
    setForm({ ...res });
    setEditingId(res.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = resources.filter((r) => r.id !== id);
    onUpdateSubTab({
      ...subTab,
      libraryData: { resources: updated },
    });
    onShowToast('Recurso eliminado de la biblioteca', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.fileUrl?.trim()) {
      onShowToast('El título y el enlace del archivo son obligatorios', 'danger');
      return;
    }

    const newRes: SubTabLibraryResource = {
      id: editingId || `lib_${Date.now()}`,
      title: form.title.trim(),
      author: form.author || '',
      category: form.category || 'General',
      fileUrl: form.fileUrl.trim(),
      coverUrl: form.coverUrl || '',
      pagesOrSize: form.pagesOrSize || 'PDF',
      description: form.description || '',
      format: form.format || 'PDF',
      dateAdded: form.dateAdded || new Date().toISOString().split('T')[0],
    };

    let updatedList: SubTabLibraryResource[];
    if (editingId) {
      updatedList = resources.map((r) => (r.id === editingId ? newRes : r));
      onShowToast('Recurso actualizado con éxito', 'success');
    } else {
      updatedList = [...resources, newRes];
      onShowToast('Recurso agregado a la biblioteca', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      libraryData: { resources: updatedList },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {subTab.name || 'Biblioteca Digital & Recursos'}
            </h3>
            <p className="text-xs text-slate-500">
              {resources.length} libros y documentos disponibles
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
              placeholder="Buscar por libro o autor..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40 sm:w-48"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Libro / PDF</span>
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
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({resources.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <BookMarked className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay libros o recursos en esta biblioteca</h4>
          <p className="text-xs text-slate-500">Sube libros digitales, guías o manuales con el botón "Nuevo Libro / PDF".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-3">
                {/* Book Cover or Icon Box */}
                <div className="relative aspect-[3/4] max-h-48 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  {res.coverUrl ? (
                    <img
                      src={res.coverUrl}
                      alt={res.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <BookOpen className="w-12 h-12 text-amber-500 opacity-60" />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 line-clamp-2">
                        {res.title}
                      </span>
                    </div>
                  )}

                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-extrabold uppercase shadow-sm">
                    {res.format || 'PDF'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
                    {res.category || 'Biblioteca'}
                  </span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {res.title}
                  </h4>
                  {res.author && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Por: <strong>{res.author}</strong>
                    </p>
                  )}
                  {res.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {res.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {res.pagesOrSize || 'PDF'}
                </span>

                <div className="flex items-center space-x-1.5">
                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </a>

                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(res)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(res.id)}
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
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Recurso' : 'Nuevo Libro / Documento'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Modifica los datos del material digital' : 'Sube enlaces de libros, PDFs o manuales'}
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
                    Título del Libro o Material *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Fundamentos de la Vida Cristiana"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Autor / Editorial
                    </label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      placeholder="Ej: C.S. Lewis"
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
                      placeholder="Ej: Teología, Devocionales"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enlace URL de Descarga (PDF / Drive / Dropbox) *
                  </label>
                  <input
                    type="url"
                    required
                    value={form.fileUrl}
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/... o enlace directo al PDF"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Formato
                    </label>
                    <select
                      value={form.format}
                      onChange={(e) => setForm({ ...form, format: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="PDF">PDF</option>
                      <option value="EPUB">EPUB</option>
                      <option value="DOCX">DOCX</option>
                      <option value="PPTX">PPTX</option>
                      <option value="ZIP">ZIP</option>
                      <option value="Enlace">Enlace</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tamaño / Páginas
                    </label>
                    <input
                      type="text"
                      value={form.pagesOrSize}
                      onChange={(e) => setForm({ ...form, pagesOrSize: e.target.value })}
                      placeholder="Ej: 150 págs • 3.2 MB"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Imagen de Portada URL (Opcional)
                  </label>
                  <input
                    type="url"
                    value={form.coverUrl}
                    onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                    placeholder="https://ejemplo.com/portada-libro.jpg"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción o Sinopsis
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Breve reseña del contenido..."
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar en Biblioteca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
