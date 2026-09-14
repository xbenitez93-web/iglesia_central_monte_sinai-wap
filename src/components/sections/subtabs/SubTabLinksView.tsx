import React, { useState } from 'react';
import {
  Link2,
  Plus,
  ExternalLink,
  Trash2,
  Edit2,
  X,
  Search,
  Copy,
  Globe,
} from 'lucide-react';
import { SubTabLink, CustomSectionSubTab } from '../../../types';

interface SubTabLinksViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

export const SubTabLinksView: React.FC<SubTabLinksViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const links = subTab.linksData?.links || [];
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<SubTabLink>>({
    title: '',
    url: '',
    description: '',
    category: 'Enlaces Rápidos',
    badge: '',
  });

  const categories = Array.from(new Set(links.map((l) => l.category).filter(Boolean))) as string[];

  const filteredLinks = links.filter((l) => {
    const matchSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(search.toLowerCase())) ||
      l.url.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || l.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleOpenAdd = () => {
    setForm({
      title: '',
      url: '',
      description: '',
      category: 'Enlaces Rápidos',
      badge: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (link: SubTabLink) => {
    setForm({ ...link });
    setEditingId(link.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = links.filter((l) => l.id !== id);
    onUpdateSubTab({
      ...subTab,
      linksData: { links: updated },
    });
    onShowToast('Enlace eliminado', 'info');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    onShowToast('Enlace copiado al portapapeles', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.url?.trim()) {
      onShowToast('El título y la URL son obligatorios', 'danger');
      return;
    }

    let cleanUrl = form.url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const newLink: SubTabLink = {
      id: editingId || `lnk_${Date.now()}`,
      title: form.title.trim(),
      url: cleanUrl,
      description: form.description || '',
      category: form.category || 'General',
      badge: form.badge || '',
    };

    let updatedList: SubTabLink[];
    if (editingId) {
      updatedList = links.map((l) => (l.id === editingId ? newLink : l));
      onShowToast('Enlace actualizado con éxito', 'success');
    } else {
      updatedList = [...links, newLink];
      onShowToast('Enlace agregado', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      linksData: { links: updatedList },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {subTab.name || 'Enlaces de Interés & Accesos Rápidos'}
            </h3>
            <p className="text-xs text-slate-500">
              {links.length} enlaces configurados
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
              placeholder="Buscar enlace..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40 sm:w-48"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Enlace</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({links.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Links Grid */}
      {filteredLinks.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <Globe className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay enlaces en esta pestaña</h4>
          <p className="text-xs text-slate-500">Agrega páginas web, redes sociales o recursos externos con el botón "Nuevo Enlace".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((l) => (
            <div
              key={l.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                      <Link2 className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {l.category || 'Enlace'}
                    </span>
                  </div>

                  {l.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                      {l.badge}
                    </span>
                  )}
                </div>

                <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                  {l.title}
                </h4>

                {l.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {l.description}
                  </p>
                )}

                <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                  {l.url}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all"
                  >
                    <span>Visitar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(l.url)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                    title="Copiar Enlace"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(l)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(l.id)}
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

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Enlace' : 'Nuevo Enlace'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Modifica la dirección o datos del enlace' : 'Registra un nuevo enlace de interés o recurso web'}
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
                    Título o Nombre del Sitio *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Formulario de Inscripción, Portal Oficial..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL o Dirección Web *
                  </label>
                  <input
                    type="url"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://ejemplo.com o link de Google Drive/Forms"
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
                      placeholder="Ej: Trámites, Redes, Ministerios"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Insignia (Opcional)
                    </label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      placeholder="Ej: Nuevo, Importante, Oficial"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Instrucciones o contenido que encontrarán..."
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
