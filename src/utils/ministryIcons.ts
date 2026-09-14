import React from 'react';
import {
  Music,
  Sparkles,
  Heart,
  UserCheck,
  Drama,
  Flame,
  BookOpen,
  Baby,
  Video,
  Mic,
  Users,
  Church,
  Shield,
  Smile,
  Radio,
  Globe,
  Megaphone,
  Star,
  Palette,
  Cross,
  Gift,
  Sun,
  Layers,
  Compass,
  DollarSign,
  HeartHandshake,
  CreditCard,
  Landmark,
  Coins,
  Tv,
  FileText,
  Download,
  Phone,
  MapPin,
  Send,
  HelpCircle,
  Award,
  Zap,
  Bookmark,
  Share2,
  FolderHeart,
  LayoutDashboard,
  Calendar,
  PiggyBank,
  MessageSquare,
  Settings,
  Terminal,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  Bell,
  Info,
  PhoneCall,
  Mail,
  HelpCircle as HelpIcon,
  Vote,
  Ticket,
  Trophy,
  LucideIcon,
} from 'lucide-react';

export interface MinistryIconOption {
  key: string;
  label: string;
  icon: LucideIcon;
  category: 'Módulos del Sistema' | 'Donaciones & Finanzas' | 'Artes & Música' | 'Grupos & Familias' | 'Servicio & Protocolo' | 'Espiritual & Misiones' | 'Media & Creatividad' | 'Acciones & Botones' | 'Recursos & Varios';
}

export const MINISTRY_ICON_OPTIONS: MinistryIconOption[] = [
  // Módulos del Sistema
  { key: 'LayoutDashboard', label: 'Inicio / Panel', icon: LayoutDashboard, category: 'Módulos del Sistema' },
  { key: 'Users', label: 'Directorio / Membresía', icon: Users, category: 'Módulos del Sistema' },
  { key: 'Calendar', label: 'Agendas y Eventos', icon: Calendar, category: 'Módulos del Sistema' },
  { key: 'DollarSign', label: 'Finanzas y Tesorería', icon: DollarSign, category: 'Módulos del Sistema' },
  { key: 'PiggyBank', label: 'Minicooperativa / Ahorro', icon: PiggyBank, category: 'Módulos del Sistema' },
  { key: 'MessageSquare', label: 'Grupos & Mensajería', icon: MessageSquare, category: 'Módulos del Sistema' },
  { key: 'Sparkles', label: 'Ministerios Eclesiales', icon: Sparkles, category: 'Módulos del Sistema' },
  { key: 'Vote', label: 'Encuestas & Votaciones', icon: Vote, category: 'Módulos del Sistema' },
  { key: 'Ticket', label: 'Sorteos & Rifas', icon: Ticket, category: 'Módulos del Sistema' },
  { key: 'Trophy', label: 'Premios & Ganadores', icon: Trophy, category: 'Módulos del Sistema' },
  { key: 'Settings', label: 'Configuración', icon: Settings, category: 'Módulos del Sistema' },
  { key: 'Terminal', label: 'Desarrollador / Consola', icon: Terminal, category: 'Módulos del Sistema' },

  // Donaciones & Finanzas
  { key: 'HeartHandshake', label: 'Donaciones / Ofrendas', icon: HeartHandshake, category: 'Donaciones & Finanzas' },
  { key: 'CreditCard', label: 'Tarjeta / Pago Online', icon: CreditCard, category: 'Donaciones & Finanzas' },
  { key: 'Landmark', label: 'Banco / Cuentas', icon: Landmark, category: 'Donaciones & Finanzas' },
  { key: 'Coins', label: 'Monedas / Aportes', icon: Coins, category: 'Donaciones & Finanzas' },
  { key: 'FolderHeart', label: 'Pro-Templo / Caridad', icon: FolderHeart, category: 'Donaciones & Finanzas' },

  // Artes & Música
  { key: 'Music', label: 'Música / Alabanza', icon: Music, category: 'Artes & Música' },
  { key: 'Drama', label: 'Teatro & Drama', icon: Drama, category: 'Artes & Música' },
  { key: 'Mic', label: 'Vocalistas / Locución', icon: Mic, category: 'Artes & Música' },
  { key: 'Palette', label: 'Artes & Diseño', icon: Palette, category: 'Artes & Música' },

  // Grupos & Familias
  { key: 'Heart', label: 'Damas / Femenil', icon: Heart, category: 'Grupos & Familias' },
  { key: 'Flame', label: 'Jóvenes / Avivamiento', icon: Flame, category: 'Grupos & Familias' },
  { key: 'Baby', label: 'Niños / Escuela Infantil', icon: Baby, category: 'Grupos & Familias' },
  { key: 'Smile', label: 'Párvulos / Alegría', icon: Smile, category: 'Grupos & Familias' },

  // Servicio & Protocolo
  { key: 'UserCheck', label: 'Servidores & Ujieres', icon: UserCheck, category: 'Servicio & Protocolo' },
  { key: 'Shield', label: 'Protocolo & Seguridad', icon: Shield, category: 'Servicio & Protocolo' },
  { key: 'Gift', label: 'Acción Social & Caridad', icon: Gift, category: 'Servicio & Protocolo' },
  { key: 'Layers', label: 'Logística & Montaje', icon: Layers, category: 'Servicio & Protocolo' },

  // Espiritual & Misiones
  { key: 'Church', label: 'Santuario & Altar', icon: Church, category: 'Espiritual & Misiones' },
  { key: 'Cross', label: 'Evangelismo / Cruz', icon: Cross, category: 'Espiritual & Misiones' },
  { key: 'BookOpen', label: 'Estudio Bíblico & Doctrina', icon: BookOpen, category: 'Espiritual & Misiones' },
  { key: 'Globe', label: 'Misiones & Expansión', icon: Globe, category: 'Espiritual & Misiones' },
  { key: 'Compass', label: 'Consejería & Guía', icon: Compass, category: 'Espiritual & Misiones' },
  { key: 'Sun', label: 'Oración Matutina & Altar', icon: Sun, category: 'Espiritual & Misiones' },

  // Media & Creatividad
  { key: 'Tv', label: 'Transmisión en Vivo', icon: Tv, category: 'Media & Creatividad' },
  { key: 'Video', label: 'Videos & Grabaciones', icon: Video, category: 'Media & Creatividad' },
  { key: 'Radio', label: 'Radio Online & Sonido', icon: Radio, category: 'Media & Creatividad' },
  { key: 'Megaphone', label: 'Comunicaciones & Avisos', icon: Megaphone, category: 'Media & Creatividad' },
  { key: 'Share2', label: 'Redes & Enlaces', icon: Share2, category: 'Media & Creatividad' },
  { key: 'Star', label: 'Liderazgo & Excelencia', icon: Star, category: 'Media & Creatividad' },

  // Acciones & Botones
  { key: 'MessageCircle', label: 'WhatsApp / Chat Directo', icon: MessageCircle, category: 'Acciones & Botones' },
  { key: 'PhoneCall', label: 'Llamada Directa', icon: PhoneCall, category: 'Acciones & Botones' },
  { key: 'ExternalLink', label: 'Enlace Externo', icon: ExternalLink, category: 'Acciones & Botones' },
  { key: 'ArrowRight', label: 'Flecha / Ir a Módulo', icon: ArrowRight, category: 'Acciones & Botones' },
  { key: 'Mail', label: 'Correo Electrónico', icon: Mail, category: 'Acciones & Botones' },
  { key: 'Bell', label: 'Notificación / Aviso', icon: Bell, category: 'Acciones & Botones' },

  // Recursos & Varios
  { key: 'FileText', label: 'Documentos & Guías', icon: FileText, category: 'Recursos & Varios' },
  { key: 'Download', label: 'Descargas & Materiales', icon: Download, category: 'Recursos & Varios' },
  { key: 'MapPin', label: 'Sedes & Ubicación', icon: MapPin, category: 'Recursos & Varios' },
  { key: 'Phone', label: 'Contacto & Atención', icon: Phone, category: 'Recursos & Varios' },
  { key: 'Bookmark', label: 'Marcadores / Secciones', icon: Bookmark, category: 'Recursos & Varios' },
  { key: 'Zap', label: 'Acción Rápida / Dinámico', icon: Zap, category: 'Recursos & Varios' },
];

export const MINISTRY_COLOR_PRESETS = [
  { name: 'Esmeralda Vida', hex: '#059669', class: 'bg-emerald-600' },
  { name: 'Púrpura Real', hex: '#7c3aed', class: 'bg-purple-600' },
  { name: 'Rosa Profético', hex: '#db2777', class: 'bg-pink-600' },
  { name: 'Rojo Carmesí', hex: '#e11d48', class: 'bg-rose-600' },
  { name: 'Azul Cielo', hex: '#0284c7', class: 'bg-sky-600' },
  { name: 'Violeta Noble', hex: '#9333ea', class: 'bg-violet-600' },
  { name: 'Ámbar Fuego', hex: '#d97706', class: 'bg-amber-600' },
  { name: 'Índigo Profundo', hex: '#4f46e5', class: 'bg-indigo-600' },
  { name: 'Naranja Cosecha', hex: '#ea580c', class: 'bg-orange-600' },
  { name: 'Turquesa Mar', hex: '#0d9488', class: 'bg-teal-600' },
  { name: 'Azul Marino', hex: '#1e40af', class: 'bg-blue-800' },
  { name: 'Fucsia Brillante', hex: '#c026d3', class: 'bg-fuchsia-600' },
  { name: 'Dorado Real', hex: '#ca8a04', class: 'bg-yellow-600' },
];

export function getMinistryIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return Sparkles;
  const match = MINISTRY_ICON_OPTIONS.find(
    (item) => (item.key || '').toLowerCase() === (iconName || '').toLowerCase()
  );
  return match ? match.icon : Sparkles;
}

