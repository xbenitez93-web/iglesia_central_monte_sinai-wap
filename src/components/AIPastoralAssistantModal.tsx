import React, { useState, useEffect } from 'react';
import { ChurchConfig, ChurchEvent } from '../types';
import {
  X,
  Sparkles,
  BookOpen,
  Megaphone,
  BarChart3,
  Clock,
  Copy,
  Check,
  Loader2,
  Send,
  RotateCcw,
  Sliders,
  FileText,
  Key,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Image as ImageIcon,
  Church,
} from 'lucide-react';
import {
  generatePastoralContent,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
} from '../lib/pastoralAIService';
import { exportAIToPdf, exportAIToJpg } from '../lib/aiExportHelper';

interface AIPastoralAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChurchConfig;
  events: ChurchEvent[];
}

export const AIPastoralAssistantModal: React.FC<AIPastoralAssistantModalProps> = ({
  isOpen,
  onClose,
  config,
  events,
}) => {
  const [activeMode, setActiveMode] = useState<
    'devotional' | 'bulletin' | 'financial_analysis' | 'event_outline'
  >('devotional');
  const [prompt, setPrompt] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [resultSource, setResultSource] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'result'>('editor');
  
  // Custom API key configuration for standalone compiled APKs / Desktop
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomApiKey(getStoredGeminiApiKey());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getModeTitle = () => {
    switch (activeMode) {
      case 'devotional':
        return 'Bosquejo de Sermón Homilético';
      case 'bulletin':
        return 'Boletín Eclesial & Anuncio Litúrgico';
      case 'event_outline':
        return 'Guion Litúrgico de Servicio';
      case 'financial_analysis':
        return 'Análisis Financiero & Mayordomía';
      default:
        return 'Documento Pastoral';
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportAIToPdf('ai-pastoral-printable-sheet', getModeTitle(), config);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportJpg = async () => {
    setIsExportingJpg(true);
    try {
      await exportAIToJpg('ai-pastoral-printable-sheet', getModeTitle());
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingJpg(false);
    }
  };

  const handleSaveApiKey = () => {
    setStoredGeminiApiKey(customApiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');

    let requestPrompt = prompt;
    const selectedEvent = events.find((e) => e.id === selectedEventId);

    if (activeMode === 'bulletin' && selectedEvent) {
      requestPrompt = `Redacta un boletín o anuncio eclesial para el evento: "${selectedEvent.title}" del tipo ${selectedEvent.type} programado para la fecha ${selectedEvent.date} a las ${selectedEvent.time}. Predicador o encargado: ${selectedEvent.speaker}. Descripción: ${selectedEvent.description}. ${prompt ? `Notas adicionales: ${prompt}` : ''}`;
    } else if (activeMode === 'event_outline' && selectedEvent) {
      requestPrompt = `Genera un programa minuciosamente detallado minuto a minuto para el evento eclesial: "${selectedEvent.title}" (${selectedEvent.type}) que durará 1 hora y 45 minutos. Predicador: ${selectedEvent.speaker}. Incluye tiempos sugeridos para alabanza, avisos, prédica, oración e himno final. ${prompt}`;
    }

    if (!requestPrompt.trim() && !selectedEvent) {
      requestPrompt = 'Genera un devocional inspirador sobre la fe y la esperanza cristiana para este domingo.';
    }

    try {
      const response = await generatePastoralContent({
        type: activeMode,
        prompt: requestPrompt,
        context: {
          churchName: config.name,
          pastorName: config.pastorName,
          denomination: config.denomination,
        },
        clientApiKey: customApiKey,
      });

      setResultText(response.text || 'Sin respuesta generada.');
      setResultSource(
        response.source === 'server'
          ? 'Servidor Eclesia (Gemini 3.7 Flash)'
          : response.source === 'direct_gemini'
          ? 'Gemini 3.7 Flash Directo'
          : 'Motor Teológico Homilético'
      );
      setActiveTab('result');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con la IA pastoral.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setResultText('');
    setResultSource('');
    setPrompt('');
    setSelectedEventId('');
    setErrorMsg('');
    setActiveTab('editor');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Fixed Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-2">
                <span>Asistente Pastoral IA</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-amber-100 font-semibold uppercase tracking-wider hidden sm:inline-block">
                  {config.name}
                </span>
              </h2>
              <p className="text-xs text-amber-100/90 leading-tight">
                Generador inteligente de sermones, boletines y guiones litúrgicos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer text-white"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View switcher when there is a result */}
        {resultText && (
          <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab('result')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'result'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Respuesta Generada</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Opciones y Parámetros</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold flex items-center space-x-1 cursor-pointer"
              title="Iniciar nueva consulta"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Consulta</span>
            </button>
          </div>
        )}

        {/* Scrollable Container with Permanent Visibility */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* MODES MENU SELECTOR - ALWAYS CRISP & ACCESSIBLE */}
          {(!resultText || activeTab === 'editor') && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Seleccione el Tipo de Contenido:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('devotional')}
                  className={`flex flex-col items-center p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                    activeMode === 'devotional'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-1.5 text-amber-600 dark:text-amber-400" />
                  <span>Bosquejo Sermón</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('bulletin')}
                  className={`flex flex-col items-center p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                    activeMode === 'bulletin'
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <Megaphone className="w-5 h-5 mb-1.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Anuncio / Boletín</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('event_outline')}
                  className={`flex flex-col items-center p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                    activeMode === 'event_outline'
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-200 shadow-xs ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <Clock className="w-5 h-5 mb-1.5 text-purple-600 dark:text-purple-400" />
                  <span>Guion de Servicio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('financial_analysis')}
                  className={`flex flex-col items-center p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                    activeMode === 'financial_analysis'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <BarChart3 className="w-5 h-5 mb-1.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Análisis Financiero</span>
                </button>
              </div>
            </div>
          )}

          {/* Prompt Form Controls */}
          {(!resultText || activeTab === 'editor') && (
            <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {/* Quick Suggestions Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Sugerencias rápidas (haga clic para usar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeMode === 'devotional' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPrompt('Salmo 23: El Buen Pastor en tiempos de prueba y necesidad')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Salmo 23 (El Buen Pastor)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrompt('Mateo 28:19-20: La Gran Comisión y discipulado en la vida diaria')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Gran Comisión & Discipulado
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrompt('1 Corintios 13: La excelencia del amor cristiano en la familia')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Amor en la Familia (1 Cor 13)
                      </button>
                    </>
                  )}
                  {activeMode === 'bulletin' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPrompt('Culto especial de Santa Cena y acción de gracias para todas las familias')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-800 dark:hover:text-indigo-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Santa Cena & Acción de Gracias
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrompt('Convocatoria de Campamento y Retiro Juvenil anual de avivamiento')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-800 dark:hover:text-indigo-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Campamento Juvenil
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrompt('Bienvenida cordial a nuevos visitantes y miembros de primera vez')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-800 dark:hover:text-indigo-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Bienvenida a Nuevos Visitantes
                      </button>
                    </>
                  )}
                  {activeMode === 'event_outline' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPrompt('Culto Dominical Principal de 1h 45m con ministración especial')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 hover:text-purple-800 dark:hover:text-purple-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Culto Dominical Completo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrompt('Noche de Alabanza y Oración e Intercesión por las familias y enfermos')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 hover:text-purple-800 dark:hover:text-purple-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Noche de Alabanza & Oración
                      </button>
                    </>
                  )}
                  {activeMode === 'financial_analysis' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPrompt('Plan de presupuesto anual equilibrado para misiones, templo y beneficencia')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Presupuesto Misiones & Templo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrompt('Estrategia de fortalecimiento del fondo de préstamos solidarios de la cooperativa')}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Microcréditos y Ahorro
                      </button>
                    </>
                  )}
                </div>
              </div>

              {(activeMode === 'bulletin' || activeMode === 'event_outline') && events.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Seleccionar Evento (Opcional):
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-2xs"
                  >
                    <option value="">-- Seleccionar evento registrado --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date} {ev.time})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {activeMode === 'devotional' && 'Tema o Pasaje Bíblico para el Bosquejo:'}
                  {activeMode === 'bulletin' && 'Detalles o tono adicional para el Boletín:'}
                  {activeMode === 'event_outline' && 'Anotaciones o énfasis especial para el programa:'}
                  {activeMode === 'financial_analysis' && 'Pregunta o aspecto financiero a analizar:'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeMode === 'devotional'
                      ? 'Ej: Juan 3:16, El amor incondicional en tiempos de incertidumbre para jóvenes...'
                      : activeMode === 'bulletin'
                      ? 'Ej: Invitar con entusiasmo a las familias al culto dominical de Santa Cena...'
                      : activeMode === 'event_outline'
                      ? 'Ej: Enfatizar 20 minutos de alabanza contemporánea y oración especial por sanidad...'
                      : 'Ej: Recomendar estrategia de presupuesto para misiones y mantenimiento de templo...'
                  }
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-2xs"
                />
              </div>

              {/* Quick API Key configuration for compiled APK/Desktop */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center space-x-1 font-semibold cursor-pointer"
                >
                  <Key className="w-3 h-3 text-amber-500" />
                  <span>Configuración de API Key Gemini (Para APK Android / Escritorio)</span>
                  {showKeyConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showKeyConfig && (
                  <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      En la app web alojada, la IA funciona automáticamente con el servidor. Si compilas la aplicación en APK para Android o instalable .exe sin servidor backend, puedes guardar aquí tu clave gratuita de Google AI Studio / Gemini:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Pega tu Gemini API Key aquí (AIzaSy...)"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        {keySaved ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-300" />
                            <span>Guardado</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>Guardar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redactando con IA pastoral...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Generar Contenido Pastoral</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Result Output Display */}
          {resultText && (activeTab === 'result' || resultText) && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                        Resultado Pastoral Generado
                      </span>
                      {resultSource && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold">
                          {resultSource}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Listo para copiar, proyectar o compartir con el ministerio
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Exportar como documento PDF con membrete y formato editorial"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generando PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJpg}
                    disabled={isExportingJpg}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Exportar como imagen JPG de alta resolución"
                  >
                    {isExportingJpg ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generando JPG...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Exportar JPG</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scrollable Result Body */}
              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans max-h-[48vh] sm:max-h-[52vh] overflow-y-auto pr-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 selection:bg-amber-200 selection:text-amber-900">
                {resultText}
              </div>

              {/* Hidden High-Definition Printable / Capture Sheet for PDF & JPG */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div
                  id="ai-pastoral-printable-sheet"
                  className="w-[800px] bg-white text-slate-900 p-10 font-sans border-8 border-slate-100"
                  style={{ minHeight: '1100px' }}
                >
                  {/* Letterhead */}
                  <div className="border-b-2 border-amber-600 pb-5 mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {config.logoUrl ? (
                        <img
                          src={config.logoUrl}
                          alt={config.name}
                          className="w-16 h-16 object-contain rounded-2xl border border-slate-200 p-1"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
                          <Church className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                          {config.name || 'Iglesia Central Monte Sinaí'}
                        </h1>
                        <p className="text-xs text-slate-600 italic">
                          {config.verse || config.slogan || 'Fe, Esperanza y Amor para la comunidad'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {config.address} • {config.phone} • {config.denomination}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs uppercase tracking-wider mb-1 border border-amber-300">
                        {getModeTitle()}
                      </span>
                      <p className="text-xs font-semibold text-slate-700">
                        Pastor: {config.pastorName || 'Pastoral General'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Fecha: {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Document Body */}
                  <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed py-2 font-normal">
                    {resultText}
                  </div>

                  {/* Document Footer */}
                  <div className="mt-10 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Documento Eclesiástico Oficial • Generado con Asistente Pastoral</span>
                    </div>
                    <span>{config.name}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer inside result */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('editor');
                  }}
                  className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Modificar o generar otra versión</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Nueva Consulta
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    Listo / Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span className="truncate">
            Sugerencia: Puedes seleccionar un evento registrado para autocompletar los datos.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold cursor-pointer shrink-0 ml-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

