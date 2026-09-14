import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Check,
  CheckCircle2,
  Copy,
  Code,
  FileText,
  Layers,
  Activity,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Save,
  X,
  Shield,
  Users,
  DollarSign,
  Calendar,
  PiggyBank,
  Music,
  Heart,
  UserCheck,
  Drama,
  ClipboardList,
  Settings as SettingsIcon,
  Tent,
  FileJson,
  Eye,
  Info,
  FileVideo,
  Image as ImageIcon,
  Monitor,
  Vote,
  Play,
} from 'lucide-react';
import {
  syncFirestoreCollection,
  saveFirestoreDoc,
  deleteFirestoreDoc,
  cleanFirestoreData,
} from '../lib/firebase';

interface FirestoreDatabaseExplorerProps {
  onShowToast?: (message: string, type?: 'success' | 'danger' | 'info') => void;
  initialCollection?: string;
}

function safeJsonStringify(val: any, space?: number): string {
  if (val === undefined) return '';
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      val,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (
            typeof window !== 'undefined' &&
            (value instanceof Node || value instanceof Event || (typeof Window !== 'undefined' && value instanceof Window))
          ) {
            return '[DOM Element]';
          }
          if (key.startsWith('__react') || key.startsWith('$$')) {
            return undefined;
          }
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      },
      space
    );
  } catch {
    return String(val);
  }
}

interface CollectionMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
}

const COLLECTIONS_REGISTRY: CollectionMeta[] = [
  // Membresía
  {
    id: 'members',
    name: 'Miembros de la Iglesia',
    description: 'Registro maestro de feligreses, datos de contacto, ministerios y estado',
    category: 'Membresía & Familias',
    icon: Users,
    color: 'from-indigo-600 to-blue-600',
  },
  {
    id: 'families',
    name: 'Núcleos Familiares',
    description: 'Familias registradas, cabeza de hogar, integrantes y domicilio',
    category: 'Membresía & Familias',
    icon: Heart,
    color: 'from-rose-600 to-pink-600',
  },
  // Finanzas
  {
    id: 'transactions',
    name: 'Transacciones Financieras',
    description: 'Ingresos, diezmos, ofrendas, donaciones y egresos/gastos con folio',
    category: 'Finanzas & Tesorería',
    icon: DollarSign,
    color: 'from-emerald-600 to-teal-600',
  },
  // Minicooperativa
  {
    id: 'coopAccounts',
    name: 'Cuentas de Ahorro Coop',
    description: 'Cuentas activas de la minicooperativa eclesial, balances y metas',
    category: 'Minicooperativa & Fondos',
    icon: PiggyBank,
    color: 'from-purple-600 to-indigo-600',
  },
  {
    id: 'coopTransactions',
    name: 'Movimientos de Ahorro',
    description: 'Depósitos, retiros y abonos de las cuentas de ahorro',
    category: 'Minicooperativa & Fondos',
    icon: DollarSign,
    color: 'from-violet-600 to-purple-600',
  },
  {
    id: 'microLoans',
    name: 'Micropréstamos Solidarios',
    description: 'Solicitudes, aprobaciones, saldos pendientes y cuotas de préstamos',
    category: 'Minicooperativa & Fondos',
    icon: ClipboardList,
    color: 'from-amber-600 to-orange-600',
  },
  {
    id: 'specialEvents',
    name: 'Proyectos & Campamentos',
    description: 'Campamentos, retiros, actividades especiales y cuotas por participante',
    category: 'Minicooperativa & Fondos',
    icon: Tent,
    color: 'from-orange-600 to-red-600',
  },
  {
    id: 'eventRegistrations',
    name: 'Inscripciones a Campamentos',
    description: 'Registro de inscritos, pagos acumulados y saldo restante',
    category: 'Minicooperativa & Fondos',
    icon: UserCheck,
    color: 'from-cyan-600 to-blue-600',
  },
  // Agenda
  {
    id: 'events',
    name: 'Agendas, Cultos & Eventos',
    description: 'Cultos dominicales, vigilias, ensayos generales y aniversarios',
    category: 'Agenda Eclesial',
    icon: Calendar,
    color: 'from-blue-600 to-indigo-600',
  },
  // Alabanza
  {
    id: 'worshipSongs',
    name: 'Cancionero de Alabanza',
    description: 'Repertorio musical, artista, tono, letras y enlaces multimedia',
    category: 'Ministerio de Alabanza',
    icon: Music,
    color: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'worshipMusicians',
    name: 'Músicos & Cantores',
    description: 'Integrantes del grupo de alabanza, instrumento y disponibilidad',
    category: 'Ministerio de Alabanza',
    icon: Users,
    color: 'from-purple-600 to-pink-600',
  },
  {
    id: 'worshipRehearsals',
    name: 'Ensayos de Alabanza',
    description: 'Programación de ensayos de alabanza, setlist y asistencia',
    category: 'Ministerio de Alabanza',
    icon: Calendar,
    color: 'from-pink-600 to-rose-600',
  },
  {
    id: 'worshipSchedules',
    name: 'Roles de Servicio Alabanza',
    description: 'Asignación de cantores e instrumentistas por cada culto',
    category: 'Ministerio de Alabanza',
    icon: ClipboardList,
    color: 'from-violet-600 to-indigo-600',
  },
  {
    id: 'worshipCastings',
    name: 'Audiciones de Alabanza',
    description: 'Convocatorias de audición para nuevos músicos y vocalistas',
    category: 'Ministerio de Alabanza',
    icon: Sparkles,
    color: 'from-amber-600 to-yellow-600',
  },
  // Danza
  {
    id: 'danceChoreos',
    name: 'Coreografías de Danza',
    description: 'Coreografías registradas, canción, nivel y vestuario',
    category: 'Ministerio de Danza',
    icon: Sparkles,
    color: 'from-pink-600 to-rose-600',
  },
  {
    id: 'danceDancers',
    name: 'Cuerpo de Danza',
    description: 'Integrantes del ministerio de danza e información de grupo',
    category: 'Ministerio de Danza',
    icon: Users,
    color: 'from-rose-600 to-pink-600',
  },
  {
    id: 'danceRehearsals',
    name: 'Ensayos de Danza',
    description: 'Horarios de ensayo, coreografías practicadas y asistencia',
    category: 'Ministerio de Danza',
    icon: Calendar,
    color: 'from-fuchsia-600 to-pink-600',
  },
  {
    id: 'danceWardrobe',
    name: 'Vestuario & Accesorios',
    description: 'Control de trajes, túnicas, mantos, panderos y banderas',
    category: 'Ministerio de Danza',
    icon: Layers,
    color: 'from-pink-600 to-purple-600',
  },
  {
    id: 'danceCastings',
    name: 'Audiciones de Danza',
    description: 'Convocatorias de audición para ministerio de danza',
    category: 'Ministerio de Danza',
    icon: Sparkles,
    color: 'from-amber-600 to-orange-600',
  },
  // Damas
  {
    id: 'womenActivities',
    name: 'Actividades de Damas',
    description: 'Desayunos, congresos, talleres y reuniones de intercesión',
    category: 'Sociedad de Damas',
    icon: Heart,
    color: 'from-rose-600 to-red-600',
  },
  {
    id: 'womenLeaders',
    name: 'Directiva de Damas',
    description: 'Líderes, coordinadoras y consejeras del ministerio femenino',
    category: 'Sociedad de Damas',
    icon: Users,
    color: 'from-pink-600 to-rose-600',
  },
  {
    id: 'womenCells',
    name: 'Células de Mujeres',
    description: 'Grupos pequeños en hogares, anfitrionas y sector',
    category: 'Sociedad de Damas',
    icon: Heart,
    color: 'from-rose-600 to-pink-600',
  },
  {
    id: 'womenPrayers',
    name: 'Peticiones de Oración',
    description: 'Motivos de oración, fecha y testimonios de respuestas',
    category: 'Sociedad de Damas',
    icon: Heart,
    color: 'from-red-600 to-rose-600',
  },
  // Servidores
  {
    id: 'usherServers',
    name: 'Servidores & Ujieres',
    description: 'Equipo de protocolo, bienvenida, orden y acomodación',
    category: 'Servidores & Ujieres',
    icon: UserCheck,
    color: 'from-teal-600 to-emerald-600',
  },
  {
    id: 'usherRosters',
    name: 'Turnos de Servicio',
    description: 'Asignación de puestos y puertas para cada culto',
    category: 'Servidores & Ujieres',
    icon: ClipboardList,
    color: 'from-emerald-600 to-cyan-600',
  },
  // Teatro
  {
    id: 'theaterPlays',
    name: 'Obras de Teatro & Dramas',
    description: 'Libretos, temática, personajes, actos y fechas de estreno',
    category: 'Ministerio de Teatro',
    icon: Drama,
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'theaterActors',
    name: 'Elenco de Actores',
    description: 'Actores del ministerio de artes dramáticas',
    category: 'Ministerio de Teatro',
    icon: Users,
    color: 'from-violet-600 to-indigo-600',
  },
  {
    id: 'theaterRehearsals',
    name: 'Ensayos de Teatro',
    description: 'Programación de ensayos de escenas y vestuario',
    category: 'Ministerio de Teatro',
    icon: Calendar,
    color: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'theaterCastings',
    name: 'Audiciones de Teatro',
    description: 'Casting de actores y personajes para obras',
    category: 'Ministerio de Teatro',
    icon: Sparkles,
    color: 'from-amber-600 to-yellow-600',
  },
  // Planes
  {
    id: 'ministryWorkPlans',
    name: 'Planes de Trabajo Ministerial',
    description: 'Planificación anual/trimestral, objetivos, metas y presupuestos',
    category: 'Planificación',
    icon: ClipboardList,
    color: 'from-indigo-600 to-slate-700',
  },
  // Sistema
  {
    id: 'systemUsers',
    name: 'Usuarios del Sistema',
    description: 'Cuentas de acceso, roles (Administrador, Pastor, etc.) y módulos autorizados',
    category: 'Configuración & Sistema',
    icon: Shield,
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'system',
    name: 'Configuración Global (Config)',
    description: 'Datos de la iglesia, lema, logo, colores, tema y opciones de notificación',
    category: 'Configuración & Sistema',
    icon: SettingsIcon,
    color: 'from-slate-700 to-slate-900',
  },
  {
    id: 'lockScreenMedia',
    name: 'Archivos y Fondos de Salvapantallas',
    description: 'Imágenes, videos y fondos multimedia subidos para el bloqueo de pantalla y salvapantallas',
    category: 'Configuración & Sistema',
    icon: FileVideo,
    color: 'from-violet-600 to-purple-700',
  },
  {
    id: 'lockScreenConfig',
    name: 'Configuración de Bloqueo & Salvapantalla',
    description: 'Parámetros del salvapantallas: tiempo de inactividad, PIN, temas, reloj y textos',
    category: 'Configuración & Sistema',
    icon: Monitor,
    color: 'from-indigo-600 to-blue-700',
  },
  {
    id: 'polls',
    name: 'Encuestas & Votaciones',
    description: 'Votaciones congregacionales, candidatos con fotos, conteo y cierre automático',
    category: 'Configuración & Sistema',
    icon: Vote,
    color: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'deletedItems',
    name: 'Papelera de Reciclaje',
    description: 'Elementos eliminados con payload completo para restauración segura',
    category: 'Configuración & Sistema',
    icon: Trash2,
    color: 'from-rose-700 to-slate-800',
  },
];

interface FieldItem {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  value: any;
}

export const FirestoreDatabaseExplorer: React.FC<FirestoreDatabaseExplorerProps> = ({
  onShowToast,
  initialCollection,
}) => {
  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollection || 'members');

  useEffect(() => {
    if (initialCollection) {
      setSelectedCollection(initialCollection);
    }
  }, [initialCollection]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'fields' | 'json'>('fields');
  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({});
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [recentLiveEvents, setRecentLiveEvents] = useState<
    Array<{ id: string; time: string; type: string; docId: string }>
  >([]);

  // Editing modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingDocId, setEditingDocId] = useState<string>('');
  const [isCreatingNewDoc, setIsCreatingNewDoc] = useState<boolean>(false);
  const [editModeTab, setEditModeTab] = useState<'form' | 'rawJson'>('form');
  const [editFields, setEditFields] = useState<FieldItem[]>([]);
  const [rawJsonContent, setRawJsonContent] = useState<string>('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New field addition in edit modal
  const [newFieldKey, setNewFieldKey] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<'string' | 'number' | 'boolean' | 'json' | 'array'>('string');
  const [newFieldValue, setNewFieldValue] = useState<string>('');

  const currentMeta = useMemo(() => {
    return (
      COLLECTIONS_REGISTRY.find((c) => c.id === selectedCollection) || {
        id: selectedCollection,
        name: selectedCollection,
        description: `Colección Firestore: ${selectedCollection}`,
        category: 'Personalizada',
        icon: Database,
        color: 'from-indigo-600 to-purple-600',
      }
    );
  }, [selectedCollection]);

  const [selectedDocForDetail, setSelectedDocForDetail] = useState<any | null>(null);
  const [copiedDetailField, setCopiedDetailField] = useState<string | null>(null);

  // Quick actions: Expand All / Collapse All
  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    filteredDocs.forEach((d) => {
      next[d.id] = true;
    });
    setExpandedDocIds(next);
  };

  const handleCollapseAll = () => {
    setExpandedDocIds({});
  };
  useEffect(() => {
    setIsLoading(true);
    const unsub = syncFirestoreCollection<any>(
      selectedCollection,
      (items) => {
        setDocuments(items || []);
        setIsLoading(false);
        setLastSyncTime(new Date());

        // Push to real-time events feed
        const eventId = `ev_${Date.now()}_${Math.random()}`;
        setRecentLiveEvents((prev) => [
          {
            id: eventId,
            time: new Date().toLocaleTimeString('es-MX'),
            type: `Sincronización en vivo (${items ? items.length : 0} docs)`,
            docId: selectedCollection,
          },
          ...prev.slice(0, 9),
        ]);
      },
      () => {
        setDocuments([]);
        setIsLoading(false);
        setLastSyncTime(new Date());
      },
      (err) => {
        console.error(`Error syncing ${selectedCollection}:`, err);
        setIsLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [selectedCollection]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((doc) => {
      if (doc.id && String(doc.id).toLowerCase().includes(q)) return true;
      const str = safeJsonStringify(doc).toLowerCase();
      return str.includes(q);
    });
  }, [documents, searchQuery]);

  const toggleExpandDoc = (id: string) => {
    setExpandedDocIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyText = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
    if (onShowToast) onShowToast('Copiado al portapapeles', 'info');
  };

  // Prepare edit modal
  const handleOpenEditDoc = (doc: any) => {
    setIsCreatingNewDoc(false);
    setEditingDocId(doc.id);
    setSelectedDoc(doc);

    // Convert doc object into key-value field items
    const fields: FieldItem[] = [];
    Object.entries(doc).forEach(([k, v]) => {
      if (k === 'id') return; // ID is handled separately
      let t: FieldItem['type'] = 'string';
      if (typeof v === 'number') t = 'number';
      else if (typeof v === 'boolean') t = 'boolean';
      else if (Array.isArray(v)) t = 'array';
      else if (typeof v === 'object' && v !== null) t = 'json';

      fields.push({ key: k, type: t, value: v });
    });

    setEditFields(fields);
    setRawJsonContent(safeJsonStringify(doc, 2));
    setJsonError(null);
    setEditModeTab('form');
    setIsEditModalOpen(true);
  };

  // Prepare new document modal
  const handleOpenNewDoc = () => {
    setIsCreatingNewDoc(true);
    const newId = `${selectedCollection.slice(0, 3)}_${Date.now()}`;
    setEditingDocId(newId);
    setEditFields([
      { key: 'createdAt', type: 'string', value: new Date().toISOString() },
      { key: 'active', type: 'boolean', value: true },
    ]);
    const defaultObj = {
      id: newId,
      createdAt: new Date().toISOString(),
      active: true,
    };
    setRawJsonContent(JSON.stringify(defaultObj, null, 2));
    setJsonError(null);
    setEditModeTab('form');
    setIsEditModalOpen(true);
  };

  const handleAddFieldToEditor = () => {
    if (!newFieldKey.trim()) return;
    const trimmedKey = newFieldKey.trim();
    if (editFields.some((f) => f.key === trimmedKey) || trimmedKey === 'id') {
      if (onShowToast) onShowToast('El campo ya existe o es reservado', 'danger');
      return;
    }

    let parsedVal: any = newFieldValue;
    if (newFieldType === 'number') {
      parsedVal = Number(newFieldValue) || 0;
    } else if (newFieldType === 'boolean') {
      parsedVal = newFieldValue === 'true';
    } else if (newFieldType === 'array') {
      try {
        parsedVal = JSON.parse(newFieldValue);
        if (!Array.isArray(parsedVal)) parsedVal = [newFieldValue];
      } catch {
        parsedVal = newFieldValue.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else if (newFieldType === 'json') {
      try {
        parsedVal = JSON.parse(newFieldValue);
      } catch {
        parsedVal = {};
      }
    }

    const updatedFields = [...editFields, { key: trimmedKey, type: newFieldType, value: parsedVal }];
    setEditFields(updatedFields);

    // Sync raw JSON
    const updatedObj: Record<string, any> = { id: editingDocId };
    updatedFields.forEach((f) => {
      updatedObj[f.key] = f.value;
    });
    setRawJsonContent(JSON.stringify(updatedObj, null, 2));

    setNewFieldKey('');
    setNewFieldValue('');
    if (onShowToast) onShowToast(`Campo "${trimmedKey}" agregado al borrador`, 'info');
  };

  const handleRemoveFieldFromEditor = (keyToRemove: string) => {
    const updated = editFields.filter((f) => f.key !== keyToRemove);
    setEditFields(updated);
    const updatedObj: Record<string, any> = { id: editingDocId };
    updated.forEach((f) => {
      updatedObj[f.key] = f.value;
    });
    setRawJsonContent(JSON.stringify(updatedObj, null, 2));
  };

  const handleUpdateFieldValue = (key: string, val: any, type: FieldItem['type']) => {
    let normalizedVal = val;
    if (type === 'number') {
      normalizedVal = val === '' ? 0 : Number(val);
    } else if (type === 'boolean') {
      normalizedVal = val === 'true' || val === true;
    }

    const updated = editFields.map((f) => (f.key === key ? { ...f, value: normalizedVal } : f));
    setEditFields(updated);

    const updatedObj: Record<string, any> = { id: editingDocId };
    updated.forEach((f) => {
      updatedObj[f.key] = f.value;
    });
    setRawJsonContent(JSON.stringify(updatedObj, null, 2));
  };

  const handleRawJsonChange = (text: string) => {
    setRawJsonContent(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      if (parsed.id && parsed.id !== editingDocId) {
        setEditingDocId(parsed.id);
      }
      // Re-populate edit fields
      const fields: FieldItem[] = [];
      Object.entries(parsed).forEach(([k, v]) => {
        if (k === 'id') return;
        let t: FieldItem['type'] = 'string';
        if (typeof v === 'number') t = 'number';
        else if (typeof v === 'boolean') t = 'boolean';
        else if (Array.isArray(v)) t = 'array';
        else if (typeof v === 'object' && v !== null) t = 'json';
        fields.push({ key: k, type: t, value: v });
      });
      setEditFields(fields);
    } catch (e: any) {
      setJsonError(e.message || 'JSON inválido');
    }
  };

  // Save changes to Firestore
  const handleSaveDocToFirestore = async () => {
    if (!editingDocId.trim()) {
      if (onShowToast) onShowToast('El ID del documento no puede estar vacío', 'danger');
      return;
    }

    setIsSaving(true);
    try {
      let finalDocData: Record<string, any> = {};

      if (editModeTab === 'rawJson') {
        try {
          finalDocData = JSON.parse(rawJsonContent);
        } catch {
          if (onShowToast) onShowToast('Corrige los errores de sintaxis en el JSON antes de guardar', 'danger');
          setIsSaving(false);
          return;
        }
      } else {
        finalDocData = { id: editingDocId };
        editFields.forEach((f) => {
          finalDocData[f.key] = f.value;
        });
      }

      finalDocData.id = editingDocId;
      const sanitized = cleanFirestoreData(finalDocData);

      await saveFirestoreDoc(selectedCollection, editingDocId, sanitized);

      setIsSaving(false);
      setIsEditModalOpen(false);
      if (onShowToast) {
        onShowToast(
          `Documento "${editingDocId}" guardado y sincronizado en Firestore exitosamente.`,
          'success'
        );
      }
    } catch (err: any) {
      setIsSaving(false);
      console.error('Error saving Firestore doc:', err);
      if (onShowToast) onShowToast(`Error al guardar en Firestore: ${err.message}`, 'danger');
    }
  };

  // Confirm delete document
  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return;
    const docId = docToDelete.id;
    try {
      await deleteFirestoreDoc(selectedCollection, docId);
      setDocToDelete(null);
      if (onShowToast) {
        onShowToast(`Documento "${docId}" eliminado de Firestore correctamente.`, 'danger');
      }
    } catch (err: any) {
      console.error('Error deleting doc:', err);
      if (onShowToast) onShowToast(`Error al eliminar: ${err.message}`, 'danger');
    }
  };

  // Render value visually
  const renderFieldBadge = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-400 italic text-[11px]">null</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
            val
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {String(val)}
        </span>
      );
    }
    if (typeof val === 'number') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-mono text-[11px] font-bold">
          {val}
        </span>
      );
    }
    if (Array.isArray(val)) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-[11px]">
          Array ({val.length})
        </span>
      );
    }
    if (typeof val === 'object') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 font-mono text-[11px]">
          Object ({Object.keys(val).length} campos)
        </span>
      );
    }
    return (
      <span className="text-slate-800 dark:text-slate-200 break-all font-mono text-xs">
        {String(val).length > 80 ? `${String(val).substring(0, 80)}...` : String(val)}
      </span>
    );
  };

  // Group collections by category
  const categories = useMemo(() => {
    const map: Record<string, CollectionMeta[]> = {};
    COLLECTIONS_REGISTRY.forEach((col) => {
      if (!map[col.category]) map[col.category] = [];
      map[col.category].push(col);
    });
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Database className="w-6 h-6 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Explorador & Gestor de Base de Datos Firestore
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-extrabold text-[11px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE FIRESTORE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5">
              Visualiza en tiempo real cada registro guardado, inspecciona documentos y edita cualquier campo directamente en Firebase Firestore.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono text-indigo-200 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Última sincr: {lastSyncTime.toLocaleTimeString('es-MX')}</span>
          </div>
          <button
            type="button"
            onClick={handleOpenNewDoc}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Documento</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Collections Sidebar + Document Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Collection Selector by Categories (4 cols) */}
        <div className="lg:col-span-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg space-y-4 max-h-[800px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Colecciones ({COLLECTIONS_REGISTRY.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">Firestore DB</span>
          </div>

          {/* Grouped Collections */}
          <div className="space-y-4">
            {(Object.entries(categories) as [string, CollectionMeta[]][]).map(([catName, cols]) => (
              <div key={catName} className="space-y-1.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                  {catName}
                </div>
                <div className="space-y-1">
                  {cols.map((col) => {
                    const IconComp = col.icon;
                    const isSelected = selectedCollection === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setSelectedCollection(col.id)}
                        className={`w-full text-left p-2.5 rounded-2xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate leading-tight">
                              {col.name}
                            </div>
                            <div
                              className={`text-[10px] font-mono truncate ${
                                isSelected ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            >
                              /{col.id}
                            </div>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isSelected ? 'text-white translate-x-0.5' : 'text-slate-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Documents & Field Inspector (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Info of Selected Collection */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${currentMeta.color} text-white flex items-center justify-center shadow-md shrink-0`}
              >
                <currentMeta.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {currentMeta.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                    /{selectedCollection}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentMeta.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{documents.length} documentos</span>
              </span>
            </div>
          </div>

          {/* Search Bar & View Toggle */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar en ${currentMeta.name} por ID o contenido...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title="Expandir todos los registros"
              >
                Expandir Todo
              </button>

              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title="Contraer todos los registros"
              >
                Contraer
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => setViewMode('fields')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'fields'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Vista Campos</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'json'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Vista JSON</span>
              </button>
            </div>
          </div>

          {/* Documents Stream / List */}
          {isLoading ? (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-12 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Sincronizando colección /{selectedCollection} en tiempo real...
              </p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-12 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600">
                <Database className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white">
                {searchQuery ? 'No se encontraron documentos coincidentes' : 'Colección sin documentos'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {searchQuery
                  ? `No hay registros con la búsqueda "${searchQuery}".`
                  : `Aún no se han guardado registros en la colección "/${selectedCollection}". Puedes crear uno nuevo ahora.`}
              </p>
              <button
                type="button"
                onClick={handleOpenNewDoc}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all inline-flex items-center space-x-1.5 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Primer Documento</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc, idx) => {
                const isExpanded = expandedDocIds[doc.id] ?? (idx === 0);
                const keysCount = Object.keys(doc).length;
                const displayTitle =
                  doc.fullName ||
                  doc.familyName ||
                  doc.title ||
                  doc.name ||
                  doc.accountName ||
                  doc.memberId ||
                  doc.serviceType ||
                  doc.type ||
                  `Documento ${doc.id}`;

                const mediaThumbnail =
                  doc.thumbnail ||
                  (doc.type === 'image' && doc.url) ||
                  doc.imageUrl ||
                  (typeof doc.mediaUrl === 'string' && (doc.mediaType === 'image' || doc.backgroundType === 'image') ? doc.mediaUrl : null);
                const isVideoDoc =
                  doc.type === 'video' ||
                  doc.mediaType === 'video' ||
                  doc.backgroundType === 'video' ||
                  (typeof doc.mediaType === 'string' && doc.mediaType.startsWith('video/')) ||
                  (typeof doc.url === 'string' && (doc.url.endsWith('.mp4') || doc.url.endsWith('.webm')));

                return (
                  <div
                    key={doc.id || idx}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Document Header Card - Fully Clickable */}
                    <div
                      onClick={() => toggleExpandDoc(doc.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/30 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>

                        {/* Media Thumbnail if image/video exists */}
                        {mediaThumbnail ? (
                          <div className="w-12 h-10 rounded-lg overflow-hidden bg-black/40 border border-slate-300 dark:border-slate-700 shrink-0 relative group">
                            <img
                              src={mediaThumbnail}
                              alt={displayTitle}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                            {isVideoDoc && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                                <Play className="w-3 h-3 fill-current" />
                              </div>
                            )}
                          </div>
                        ) : isVideoDoc ? (
                          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-700 flex items-center justify-center text-indigo-400 shrink-0">
                            <FileVideo className="w-5 h-5" />
                          </div>
                        ) : null}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                              {displayTitle}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                              ID: {doc.id}
                            </span>
                            {doc.type === 'video' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30">
                                🎬 Video
                              </span>
                            )}
                            {doc.type === 'image' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-400/30">
                                🖼️ Imagen
                              </span>
                            )}
                            {doc.isActiveInLockScreen && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse">
                                ✓ Proyectando en Salvapantallas
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                              {isExpanded ? 'Clic para contraer' : 'Clic para ver todo'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{keysCount} campos</span>
                            {doc.sizeFormatted && <span>• Tamaño: {doc.sizeFormatted}</span>}
                            {doc.createdAt && <span>• Creado: {String(doc.createdAt).slice(0, 10)}</span>}
                            {doc.updatedAt && <span>• Actualizado: {String(doc.updatedAt).slice(0, 10)}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div
                        className="flex items-center space-x-2 self-end sm:self-auto shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedDocForDetail(doc)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                          title="Inspeccionar todos los detalles en ventana grande"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="hidden xs:inline">Inspeccionar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(safeJsonStringify(doc, 2), `doc_${doc.id}`)}
                          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                          title="Copiar JSON"
                        >
                          {copiedKey === `doc_${doc.id}` ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditDoc(doc)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDocToDelete(doc)}
                          className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/80 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar de Firestore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Document Content */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5">
                        {viewMode === 'fields' ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {Object.entries(doc).map(([k, v]) => (
                                <div
                                  key={k}
                                  onClick={() => setSelectedDocForDetail(doc)}
                                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/20 transition-all cursor-pointer"
                                  title="Clic para inspeccionar campo completo"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                      {k}
                                    </span>
                                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                                      {Array.isArray(v) ? 'array' : typeof v}
                                    </span>
                                  </div>
                                  <div className="text-xs overflow-hidden">
                                    {renderFieldBadge(v)}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setSelectedDocForDetail(doc)}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver detalle completo y valores estructurados ({keysCount} campos) →</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                              {safeJsonStringify(doc, 2)}
                            </pre>
                            <button
                              type="button"
                              onClick={() => handleCopyText(safeJsonStringify(doc, 2), `raw_${doc.id}`)}
                              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1 cursor-pointer"
                            >
                              {copiedKey === `raw_${doc.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>Copiar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* EDIT / CREATE DOCUMENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-800/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/80 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">
                    {isCreatingNewDoc ? 'Crear Nuevo Documento en Firestore' : 'Editar Documento Firestore'}
                  </h3>
                  <p className="text-xs text-indigo-200/80">
                    Colección: <span className="font-mono font-bold">/{selectedCollection}</span> • ID:{' '}
                    <span className="font-mono font-bold">{editingDocId}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs for Form vs Raw JSON */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModeTab('form')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    editModeTab === 'form'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Editor de Campos (Visual)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditModeTab('rawJson')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    editModeTab === 'rawJson'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Editor JSON Crudo</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                {editFields.length} campos detectados
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Document ID Field */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-1">
                <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  ID del Documento (Document Key):
                </label>
                <input
                  type="text"
                  value={editingDocId}
                  disabled={!isCreatingNewDoc}
                  onChange={(e) => setEditingDocId(e.target.value)}
                  placeholder="ej. mem_1710000000"
                  className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-mono text-xs sm:text-sm text-slate-900 dark:text-white disabled:opacity-75"
                />
                {!isCreatingNewDoc && (
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                    ℹ️ El ID del documento no se modifica para preservar las referencias de relaciones existentes.
                  </p>
                )}
              </div>

              {editModeTab === 'form' ? (
                <div className="space-y-4">
                  {/* List of Editable Fields */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Campos del Documento:
                    </h4>

                    {editFields.map((field) => (
                      <div
                        key={field.key}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="sm:w-1/3 min-w-0">
                          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                            {field.key}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            Tipo: {field.type}
                          </span>
                        </div>

                        <div className="flex-1 flex items-center space-x-2">
                          {field.type === 'boolean' ? (
                            <select
                              value={String(field.value)}
                              onChange={(e) =>
                                handleUpdateFieldValue(field.key, e.target.value === 'true', 'boolean')
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                            >
                              <option value="true">true (Verdadero)</option>
                              <option value="false">false (Falso)</option>
                            </select>
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              value={field.value ?? 0}
                              onChange={(e) =>
                                handleUpdateFieldValue(field.key, e.target.value, 'number')
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                            />
                          ) : field.type === 'array' || field.type === 'json' ? (
                            <input
                              type="text"
                              value={
                                typeof field.value === 'string'
                                  ? field.value
                                  : safeJsonStringify(field.value)
                              }
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  handleUpdateFieldValue(field.key, parsed, field.type);
                                } catch {
                                  handleUpdateFieldValue(field.key, e.target.value, field.type);
                                }
                              }}
                              placeholder='JSON: ["item1", "item2"] o {"k":"v"}'
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                            />
                          ) : (
                            <input
                              type="text"
                              value={field.value ?? ''}
                              onChange={(e) =>
                                handleUpdateFieldValue(field.key, e.target.value, 'string')
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveFieldFromEditor(field.key)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer shrink-0"
                            title="Eliminar este campo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Field Box */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-dashed border-indigo-300 dark:border-indigo-800 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                      <Plus className="w-4 h-4" />
                      <span>Agregar Nuevo Campo al Documento</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        placeholder="Nombre del campo (ej. notas)"
                        className="sm:col-span-4 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                      />

                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="sm:col-span-3 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="string">Texto (string)</option>
                        <option value="number">Número (number)</option>
                        <option value="boolean">Booleano (boolean)</option>
                        <option value="array">Arreglo (array)</option>
                        <option value="json">Objeto (JSON)</option>
                      </select>

                      <input
                        type="text"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="Valor inicial"
                        className="sm:col-span-3 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={handleAddFieldToEditor}
                        className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Editor de Código JSON Directo:</span>
                    {jsonError && (
                      <span className="text-rose-500 font-mono text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {jsonError}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={14}
                    value={rawJsonContent}
                    onChange={(e) => handleRawJsonChange(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-800 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500">
                    ℹ️ Modifica cualquier propiedad del JSON. Al guardar se limpiarán valores nulos/indefinidos y se guardará directamente en Firebase Firestore.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Sincronización bidireccional automática activada
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving || (editModeTab === 'rawJson' && !!jsonError)}
                  onClick={handleSaveDocToFirestore}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando en Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar en Firestore</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL DOCUMENT DETAIL INSPECTOR MODAL */}
      {selectedDocForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md">
                  <Database className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {selectedDocForDetail.fullName ||
                        selectedDocForDetail.familyName ||
                        selectedDocForDetail.title ||
                        selectedDocForDetail.name ||
                        selectedDocForDetail.accountName ||
                        `Detalle del Documento`}
                    </h3>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                      /{selectedCollection}/{selectedDocForDetail.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Inspección completa de campos, tipos de datos y estructura JSON sincronizada en Firestore.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDocForDetail(null)}
                className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(selectedDocForDetail).map(([key, val]) => {
                  const valString = typeof val === 'object' ? safeJsonStringify(val, 2) : String(val);
                  return (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {key}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {Array.isArray(val) ? 'array' : typeof val}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 max-h-32 overflow-y-auto break-all">
                        {typeof val === 'object' && val !== null ? (
                          <pre className="text-[11px] whitespace-pre-wrap">{valString}</pre>
                        ) : (
                          <span>{valString === '' ? '<vacío>' : valString}</span>
                        )}
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(valString);
                            setCopiedDetailField(key);
                            setTimeout(() => setCopiedDetailField(null), 2000);
                            if (onShowToast) onShowToast(`Campo "${key}" copiado`, 'info');
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedDetailField === key ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar valor</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Complete Raw JSON Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Estructura JSON Completa del Documento
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopyText(safeJsonStringify(selectedDocForDetail, 2), 'detail_modal_json')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    {copiedKey === 'detail_modal_json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Documento Completo</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed border border-slate-800 shadow-inner">
                  {safeJsonStringify(selectedDocForDetail, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const doc = selectedDocForDetail;
                  setSelectedDocForDetail(null);
                  handleOpenEditDoc(doc);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Este Documento</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDocForDetail(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar documento de Firestore?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción borrará el documento directamente de la base de datos remota de Firebase.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono">
              <div className="text-indigo-600 dark:text-indigo-400 font-bold">
                Colección: /{selectedCollection}
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                ID: {docToDelete.id}
              </div>
            </div>

            <div className="flex justify-end items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoc}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar de Firestore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
