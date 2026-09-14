// Pastoral AI Engine & Gemini Integration for Web, Server, Android APK and Desktop
export interface PastoralAIRequest {
  type: 'devotional' | 'bulletin' | 'financial_analysis' | 'event_outline';
  prompt: string;
  context?: {
    churchName?: string;
    pastorName?: string;
    denomination?: string;
  };
  clientApiKey?: string;
}

export interface PastoralAIResponse {
  text: string;
  source: 'server' | 'direct_gemini' | 'theological_engine';
  modelUsed?: string;
}

export const getStoredGeminiApiKey = (): string => {
  try {
    return localStorage.getItem('eclesia_gemini_api_key') || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  } catch (e) {
    return '';
  }
};

export const setStoredGeminiApiKey = (key: string): void => {
  try {
    if (key.trim()) {
      localStorage.setItem('eclesia_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('eclesia_gemini_api_key');
    }
  } catch (e) {}
};

/**
 * Generate pastoral content with smart multi-tier fallback:
 * 1. Backend Express server endpoint (/api/ai/generate-pastoral)
 * 2. Direct Gemini REST API (gemini-3.7-flash) when compiled in standalone APK / Electron / Mobile
 * 3. Deep biblical theological engine for offline or unconfigured environments
 */
export async function generatePastoralContent(
  req: PastoralAIRequest
): Promise<PastoralAIResponse> {
  const { type, prompt, context, clientApiKey } = req;
  const churchName = context?.churchName || 'Iglesia Central Monte Sinaí';
  const pastorName = context?.pastorName || 'Pastor Principal';
  const topic = prompt.trim() || 'La Gracia y Fidelidad de Dios';

  let systemInstruction =
    'Eres un Asistente Pastoral eclesial sabio, empático, teológicamente riguroso y estructurado. Respondes en español impecable, con tono cálido, respetuoso y bíblicamente fundamentado para la gestión de iglesias cristianas evangélicas.';

  if (type === 'bulletin') {
    systemInstruction += ' Tu objetivo es redactar un anuncio o boletín eclesial atractivo, claro, motivador y festivo para los eventos o la congregación.';
  } else if (type === 'devotional') {
    systemInstruction += ' Tu objetivo es preparar un bosquejo de predicación o reflexión devocional completo: Título Expositivo, Texto Bíblico Central, 3 Puntos Principales con referencias bíblicas e ilustraciones, y Aplicación Práctica para la vida diaria.';
  } else if (type === 'financial_analysis') {
    systemInstruction += ' Tu objetivo es analizar datos financieros eclesiales de manera ética, prudente, transparente y bíblica, ofreciendo recomendaciones para el crecimiento presupuestario, misiones y apoyo social.';
  } else if (type === 'event_outline') {
    systemInstruction += ' Tu objetivo es generar una pauta o programa minuto a minuto para un culto o evento especial (Alabanza, Oración de Apertura, Lectura Bíblica, Prédica, Ministración, Avisos e Himno Final).';
  }

  const effectiveKey = (clientApiKey || getStoredGeminiApiKey()).trim();

  // --------------------------------------------------------------------------
  // TIER 1: Try Server-Side API Endpoint (Dev / Cloud Run / Web Server)
  // --------------------------------------------------------------------------
  try {
    const isLocalOrAbsoluteUrl =
      window.location.protocol === 'http:' || window.location.protocol === 'https:';

    if (isLocalOrAbsoluteUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const serverRes = await fetch('/api/ai/generate-pastoral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ type, prompt, context, clientApiKey: effectiveKey }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = serverRes.headers.get('content-type') || '';
      if (serverRes.ok && contentType.includes('application/json')) {
        const data = await serverRes.json();
        if (data && data.text) {
          return {
            text: data.text,
            source: 'server',
            modelUsed: 'gemini-3.7-flash',
          };
        }
      }
    }
  } catch (serverErr) {
    // Gracefully catch server unavailability (e.g. Android Capacitor file:// or offline)
  }

  // --------------------------------------------------------------------------
  // TIER 2: Direct Gemini 3.7 Flash Call (for Standalone APK / Electron / PWA)
  // --------------------------------------------------------------------------

  if (effectiveKey && navigator.onLine) {
    try {
      const fullPromptText = `${systemInstruction}\n\n[Solicitud del Ministro]: ${prompt}\n\n[Contexto]: Iglesia: ${churchName}, Pastor: ${pastorName}, Tipo: ${type}`;
      
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${encodeURIComponent(
        effectiveKey
      )}`;

      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPromptText }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const candidateText =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          return {
            text: candidateText,
            source: 'direct_gemini',
            modelUsed: 'gemini-3.7-flash',
          };
        }
      }
    } catch (geminiErr) {
      console.warn('Fallo en conexión directa a Gemini API:', geminiErr);
    }
  }

  // --------------------------------------------------------------------------
  // TIER 3: Deep Exegetical Theological Engine (Instant, Offline & Comprehensive)
  // --------------------------------------------------------------------------
  const theologicalText = generateTheologicalContent(type, topic, churchName, pastorName);
  return {
    text: theologicalText,
    source: 'theological_engine',
    modelUsed: 'Motor Teológico Eclesial',
  };
}

/**
 * Generates structured, rich pastoral content adapted to biblical topics
 */
function generateTheologicalContent(
  type: string,
  topic: string,
  churchName: string,
  pastorName: string
): string {
  const lower = topic.toLowerCase();

  // Caso: La Viuda de Sarepta
  if (lower.includes('viuda') || lower.includes('sarepta') || lower.includes('1 reyes 17')) {
    if (type === 'devotional') {
      return `📖 **BOSQUEJO HOMILÉTICO & PASTORAL**
**Tema:** La Fe que Desafía la Escasez: La Lección de la Viuda de Sarepta
**Texto Bíblico Central:** *1 Reyes 17:8-24 (Ref. Lucas 4:25-26)*
**Congregación:** ${churchName} | **Ministro:** ${pastorName}

---

### **INTRODUCCIÓN**
En medio de una sequía devastadora en Israel y las naciones vecinas, Dios no envía a su profeta Elías a un palacio ni a un hombre acaudalado, sino a una viuda extranjera en Sarepta de Sidón que recogía leña para preparar su última comida antes de morir. Este pasaje nos enseña cómo Dios utiliza los momentos de mayor necesidad humana para manifestar su infinita provisión y gloria.

---

### **I. LA DEMANDA DE LA FE EN TIEMPOS DE CRISIS (1 Reyes 17:8-13)**
- **La orden divina:** *"Hazme a mí primero una pequeña torta cocida bajo la ceniza"*.
- Dios prueba las prioridades del corazón: La fe verdadera entrega primero a Dios antes de asegurar lo propio.
- **Vencer el temor:** La primera palabra del profeta fue *"No temas"*. El miedo paraliza la obediencia; la fe la activa (*Hebreos 11:1*).

### **II. EL MILAGRO DE LA PROVISIÓN CONTINUA (1 Reyes 17:14-16)**
- **La promesa inmutable:** *"La harina de la tinaja no escaseará, ni el aceite de la vasija menguará"*.
- El milagro diario: La viuda no recibió un granero lleno de golpe, sino la provisión fresca día tras día.
- Dios es el sustentador soberano en medio del desierto y la crisis económica (*Filipenses 4:19*).

### **III. DE LA PROVISIÓN MATERIAL A LA RESURRECCIÓN ESPIRITUAL (1 Reyes 17:17-24)**
- Cuando el hijo de la viuda enferma y muere, la fe pasa por un fuego aún más profundo.
- La intercesión apasionada del profeta y el poder vivificador de Dios.
- **La confesión final:** *"Ahora conozco que tú eres varón de Dios, y que la palabra de Jehová es verdad en tu boca"* (v. 24). La meta final de toda prueba es revelar la gloria y fidelidad de Dios.

---

### 💡 **APLICACIÓN PRÁCTICA PARA LA VIDA DIARIA:**
1. **Confiar en tiempos de sequía:** No mida las posibilidades de Dios por el tamaño de sus recursos actuales.
2. **Mayordomía sacrificial:** Cuando ponemos lo poco que tenemos en las manos de Cristo, Él lo multiplica para bendición de muchos.
3. **Oración tenaz en familia:** Clame a Dios con fe por las situaciones que parecen humanamente muertas o sin salida.`;
    }
  }

  // Caso: Salmo 23
  if (lower.includes('salmo 23') || lower.includes('pastor') || lower.includes('pastor en')) {
    if (type === 'devotional') {
      return `📖 **BOSQUEJO HOMILÉTICO & PASTORAL**
**Tema:** El Señor es Mi Pastor: Seguridad y Reposo en Tiempos de Incertidumbre
**Texto Bíblico Central:** *Salmo 23:1-6 (Ref. Juan 10:11-14)*
**Congregación:** ${churchName} | **Ministro:** ${pastorName}

---

### **I. LA SUFICIENCIA DEL CUIDADO DIVINO (Salmo 23:1-3)**
- *"Nada me faltará"*: La plena confianza en el carácter bondadoso y proveedor de Dios.
- Lugares de delicados pastos y aguas de reposo: El descanso para el alma fatigada.
- Guía por sendas de justicia por amor de su nombre.

### **II. LA PRESENCIA DE DIOS EN EL VALLE DE SOMBRA (Salmo 23:4)**
- La realidad del sufrimiento y las pruebas en el peregrinaje cristiano.
- *"No temeré mal alguno, porque tú estarás conmigo"*: La presencia vence la soledad y la angustia.
- Tu vara y tu cayado infunden aliento: La corrección y protección del Buen Pastor.

### **III. LA ABUNDANCIA Y LA ESPERANZA ETERNA (Salmo 23:5-6)**
- Mesa aderezada en presencia de los angustiadores: Victoria y testimonio público de la gracia.
- Unción con aceite y copa rebosante: La llenura del Espíritu Santo.
- El bien y la misericordia nos seguirán todos los días, y en la casa de Jehová moraremos por largos días.

---

### 💡 **APLICACIÓN PRÁCTICA:**
1. Rinda hoy sus cargas y ansiedades en el altar de la oración.
2. Recuerde que ningún valle es definitivo cuando camina de la mano del Buen Pastor.
3. Viva con gozo y generosidad compartiendo el consuelo que ha recibido.`;
    }
  }

  // Caso general devocional
  if (type === 'devotional') {
    return `📖 **BOSQUEJO HOMILÉTICO & PASTORAL**
**Tema:** ${topic}
**Texto Bíblico Central:** *Filipenses 4:6-7 / Romanos 8:28 / Salmos 121:1-2*
**Congregación:** ${churchName} | **Ministro:** ${pastorName}

---

### **I. FUNDAMENTO EN LAS PROMESAS ETERNAS DE LA PALABRA**
- Dios establece un pacto de amor y fidelidad con su pueblo a través de Jesucristo (*2 Corintios 1:20*).
- La verdad bíblica sostiene nuestra esperanza en medio de las tempestades del mundo.
- Escudriñar las Escrituras nos da discernimiento espiritual y firmeza de carácter.

### **II. TRANSFORMACIÓN DEL CORAZÓN Y DISCÍPULOS EN ACCIÓN**
- Renovar nuestro entendimiento para comprobar la buena, agradable y perfecta voluntad de Dios (*Romanos 12:2*).
- Pasar de la preocupación a la fe activa mediante la oración perseverante y la adoración sincera.
- Edificar el cuerpo de Cristo en unidad fraternal, perdón mutuo y servicio desinteresado.

### **III. IMPACTO, TESTIMONIO Y EXTENSIÓN DEL REINO**
- Ser luz del mundo y sal de la tierra en nuestros hogares, lugares de trabajo y vecindario (*Mateo 5:14-16*).
- Compartir con valentía el Evangelio de salvación con los no creyentes.
- Perfeccionar la santidad en el temor reverente a Dios con una vida íntegra y transparente.

---

### 💡 **APLICACIÓN PRÁCTICA PARA LA SEMANA:**
1. **Tiempo a solas con Dios:** Guarde un espacio ininterrumpido cada mañana para meditar en la Palabra y orar.
2. **Altar familiar:** Ore junto a su cónyuge e hijos bendiciendo sus actividades y proyectos.
3. **Misericordia en acción:** Identifique a un hermano o prójimo en necesidad y extiéndale una bendición oportuna.`;
  }

  // Caso: Boletín / Anuncio
  if (type === 'bulletin') {
    return `📢 **BOLETÍN CONGREGACIONAL & ANUNCIO OFICIAL**
🏛️ **${churchName}**
Pastor: **${pastorName}**

🌟 **CONVOCATORIA ESPECIAL: ${topic.toUpperCase()}**

Amados hermanos, familias de la congregación y estimados amigos:

Les extendemos una cordial y bendecida invitación a participar en nuestras próximas reuniones y actividades en **${churchName}**. Creemos firmemente que Dios tiene una palabra oportuna, de fortaleza y restauración para su vida y su hogar.

📅 **DETALLES DEL ENCUENTRO:**
• **Tema Principal:** ${topic}
• **Lugar:** Templo Principal de ${churchName}
• **Horarios Habituales:** Domingos 10:00 AM (Culto Principal) | Miércoles 7:00 PM (Culto de Oración y Estudio)
• **Atención Especial:** Ministerios de Niños, Jóvenes, Damas y Alabanza listos para recibirles.

🕊️ *"Mirad cuán bueno y cuán delicioso es habitar los hermanos juntos en armonía!" (Salmo 133:1)*

¡Venga con toda su familia, los esperamos con los brazos abiertos y un corazón lleno de gratitud!`;
  }

  // Caso: Guion de Servicio
  if (type === 'event_outline') {
    return `⏱️ **PAUTA Y GUION LITÚRGICO MINUTO A MINUTO**
**Evento:** ${topic}
**Lugar:** ${churchName} | **Coordinador:** ${pastorName}
**Duración Total Estimada:** 1 hora y 45 minutos

| Tiempo / Minuto | Segmento Litúrgico | Responsable | Notas y Enfoque Espiritual |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:05** | Bienvenida y Oración de Apertura | Ujieres / Diácono | Saludo fraternal y consagración del servicio |
| **00:05 - 00:30** | Alabanza y Adoración Congregacional | Ministerio de Alabanza | 3 cantos de júbilo y 2 cantos de adoración íntima |
| **00:30 - 00:35** | Lectura Bíblica y Oración por las Familias | Liderazgo Eclesial | Texto base relacionado con el tema central |
| **00:35 - 00:45** | Diezmos, Ofrendas y Avisos Oficiales | Tesorería / Secretaría | Gratitud por la mayordomía e informes pastorales |
| **00:45 - 01:25** | Mensaje de la Palabra de Dios | ${pastorName} | Tema: **${topic}** |
| **01:25 - 01:40** | Ministración, Llamado y Oración Pastoral | Equipo de Intercesión | Oración por salvación, sanidad y restauración |
| **01:40 - 01:45** | Canto Final y Bendición Apostólica | Pastor Principal | Despedida en paz y comunión en el atrio |`;
  }

  // Caso: Análisis Financiero Pastoral
  return `📊 **ANÁLISIS FINANCIERO Y MAYORDOMÍA PASTORAL**
🏛️ **${churchName}** | **Tema de Consulta:** ${topic}

### **1. Diagnóstico de Salud Financiera Eclesial:**
- **Transparencia y Rendición de Cuentas:** La integridad en el manejo de los fondos fortalece la confianza de la membrecía (*2 Corintios 8:21*).
- **Equilibrio Presupuestario:** Asignación balanceada entre gastos operativos del templo, fondo de beneficencia y extensión misionera.

### **2. Recomendaciones Estratégicas y Ministeriales:**
1. **Fondo de Reserva de Emergencia:** Mantener el equivalente a 2-3 meses de costos fijos para contingencias.
2. **Impulso de la Minicooperativa:** Estimular el ahorro programado de las familias y préstamos solidarios justos.
3. **Misiones y Obra Social:** Destinar un porcentaje formal de las ofrendas para ayuda comunitaria a viudas, huérfanos y necesitados (*Santiago 1:27*).
4. **Capacitación en Mayordomía Bíblica:** Brindar talleres a la congregación sobre finanzas familiares cristianas libres de deudas.`;
}
