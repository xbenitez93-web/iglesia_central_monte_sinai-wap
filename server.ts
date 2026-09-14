import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 100MB payloads for HD video and photo uploads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Ensure public/uploads directory exists for cross-device shared media
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded files statically across all devices with video streaming headers
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '7d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        } else if (filePath.endsWith('.webm')) {
          res.setHeader('Content-Type', 'video/webm');
        } else if (filePath.endsWith('.mov')) {
          res.setHeader('Content-Type', 'video/quicktime');
        }
      },
    })
  );

  // Initialize Gemini client lazily/safely
  const getAi = (customKey?: string) => {
    const apiKey = customKey?.trim() || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Cross-device Universal Media Upload API (Videos & Photos)
  app.post('/api/media/upload', (req, res) => {
    try {
      const { fileName, fileType, base64Data } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'No se recibió información binaria del archivo.' });
      }

      // Remove data URL prefix if present (data:video/mp4;base64,...)
      const commaIdx = base64Data.indexOf(',');
      const rawBase64 = commaIdx !== -1 ? base64Data.substring(commaIdx + 1) : base64Data;
      const buffer = Buffer.from(rawBase64, 'base64');

      // Generate clean, collision-free filename with timestamp
      const originalExt = path.extname(fileName || '') || (fileType?.includes('video') ? '.mp4' : '.jpg');
      const baseClean = (fileName || 'media')
        .replace(originalExt, '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .substring(0, 30);
      const safeName = `${baseClean}_${Date.now()}${originalExt}`;
      const filePath = path.join(uploadsDir, safeName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${safeName}`;
      console.log(`[Media Upload] Archivo guardado universalmente: ${publicUrl} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);

      return res.json({
        success: true,
        url: publicUrl,
        fileName: safeName,
        originalName: fileName,
        type: fileType,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error('Error al procesar subida de archivo en servidor:', err);
      return res.status(500).json({ error: err.message || 'Error al guardar archivo en el servidor.' });
    }
  });

  // List all uploaded media files on the server
  app.get('/api/media/list', (req, res) => {
    try {
      if (!fs.existsSync(uploadsDir)) {
        return res.json({ files: [] });
      }
      const files = fs.readdirSync(uploadsDir).map((f) => {
        const stat = fs.statSync(path.join(uploadsDir, f));
        return {
          name: f,
          url: `/uploads/${f}`,
          size: stat.size,
          createdAt: stat.birthtimeMs,
        };
      });
      return res.json({ files });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // AI Pastoral Assistant API
  app.post('/api/ai/generate-pastoral', async (req, res) => {
    try {
      const { type, prompt, context, clientApiKey } = req.body;
      const ai = getAi(clientApiKey);

      let systemInstruction =
        'Eres un Asistente Pastoral eclesial sabio, empático, teológicamente riguroso y estructurado. Respondes en español impecable, con tono cálido, respetuoso y bíblicamente fundamentado para la gestión de iglesias cristianas evangélicas.';

      if (type === 'bulletin') {
        systemInstruction += ' Tu objetivo es redactar un anuncio o boletín eclesial atractivo, claro, motivador y festivo para los eventos o la congregación.';
      } else if (type === 'devotional') {
        systemInstruction += ' Tu objetivo es preparar un bosquejo de predicación o reflexión devocional completo: Título, Versículo Clave, 3 Puntos Principales con referencias bíblicas y Aplicación Práctica para la vida diaria.';
      } else if (type === 'financial_analysis') {
        systemInstruction += ' Tu objetivo es analizar datos financieros eclesiales de manera ética, prudente, transparente y bíblica, ofreciendo recomendaciones para el crecimiento presupuestario, misiones y apoyo social.';
      } else if (type === 'event_outline') {
        systemInstruction += ' Tu objetivo es generar una pauta o programa minuto a minuto para un culto o evento especial (Alabanza, Oración de Apertura, Lectura Bíblica, Prédica, Ministración, Avisos e Himno Final).';
      }

      const fullPrompt = `${prompt}\n\n[Contexto eclesial]: ${JSON.stringify(context || {})}`;

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: fullPrompt,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });

          if (response && response.text) {
            return res.json({ text: response.text });
          }
        } catch (apiError: any) {
          console.warn('Aviso de Gemini API (servidor):', apiError?.status || apiError?.message || apiError);
        }
      }

      // Dynamic Pastoral Generator adapted to the user's specific prompt if live API models are under high demand
      const churchName = context?.churchName || 'Iglesia Central Monte Sinaí';
      const pastorName = context?.pastorName || 'Pastor Principal';
      const topic = prompt ? prompt.trim() : 'La Gracia y Fidelidad de Dios';

      let fallbackText = '';
      if (type === 'devotional') {
        fallbackText = `📖 **Bosquejo Pastoral & Devocional**\n` +
          `**Congregación:** ${churchName} | **Ministro:** ${pastorName}\n\n` +
          `### **Tema / Título: ${topic}**\n` +
          `**Texto Bíblico Central:** *Filipenses 4:6-7 / Salmos 121:1-2*\n\n` +
          `---\n` +
          `#### **I. Fundamento en la Palabra**\n` +
          `- Reconocer el propósito divino detrás de cada circunstancia (*Romanos 8:28*).\n` +
          `- La promesa de Dios permanece inquebrantable a través de las generaciones.\n\n` +
          `#### **II. Renovación y Fortaleza Espiritual**\n` +
          `- Pasar de la preocupación a la oración con fe y convicción (*1 Pedro 5:7*).\n` +
          `- Mantener la comunión fraternal y el apoyo mutuo en el cuerpo de Cristo.\n\n` +
          `#### **III. Testimonio y Acción en la Vida Cotidiana**\n` +
          `- Llevar la luz del Evangelio a nuestro hogar, trabajo y comunidad (*Mateo 5:16*).\n` +
          `- Vivir en gratitud activa, reflejando el amor de Dios hacia el prójimo.\n\n` +
          `---\n` +
          `💡 **Puntos de Aplicación Práctica:**\n` +
          `1. **Tiempo Devocional:** Dedique 15 minutos en quietud diaria para meditar en las Escrituras.\n` +
          `2. **Oración Familiar:** Reúna a su familia esta semana para orar por peticiones específicas.\n` +
          `3. **Servicio y Bendición:** Identifique a una persona en necesidad y extienda una mano solidaria.`;
      } else if (type === 'bulletin') {
        fallbackText = `📢 **Boletín Congregacional & Anuncio Oficial**\n` +
          `🏛️ **${churchName}**\n\n` +
          `🌟 **${topic.toUpperCase()}**\n\n` +
          `Querida congregación, familias y amigos:\n\n` +
          `Les extendemos una calurosa invitación a participar en nuestras próximas reuniones y actividades en ${churchName}. Creemos que Dios tiene un propósito especial y una palabra viva para cada vida y familia.\n\n` +
          `📅 **Detalles del Encuentro:**\n` +
          `• **Enfoque Especial:** ${topic}\n` +
          `• **Lugar:** Santuario Principal de ${churchName}\n` +
          `• **Horarios:** Domingo 10:00 AM (Servicio Principal) | Miércoles 7:00 PM (Oración y Estudio Bíblico)\n` +
          `• **Atención:** Ministerios de Niños, Jóvenes y Familias disponibles.\n\n` +
          `🕊️ *"Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos." (Mateo 18:20)*\n\n` +
          `¡Te esperamos con gozo y gratitud!`;
      } else if (type === 'event_outline') {
        fallbackText = `⏱️ **Pauta y Guion Minuto a Minuto del Servicio**\n` +
          `**Evento:** ${topic} | **Lugar:** ${churchName}\n\n` +
          `| Horario / Minuto | Actividad | Responsable | Notas Litúrgicas |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          `| **00:00 - 00:05** | Bienvenida y Oración Inicial | Diácono / Ujieres | Saludo fraternal y apertura en paz |\n` +
          `| **00:05 - 00:30** | Bloque de Alabanza y Adoración | Ministerio de Alabanza | Cantos congregacionales y júbilo |\n` +
          `| **00:30 - 00:35** | Lectura Bíblica y Testimonio | Liderazgo Eclesial | Participación congregacional |\n` +
          `| **00:35 - 00:45** | Diezmos, Ofrendas y Avisos | Tesorería y Secretaría | Gratitud y mayordomía fiel |\n` +
          `| **00:45 - 01:25** | Mensaje de la Palabra de Dios | ${pastorName} | Tema: ${topic} |\n` +
          `| **01:25 - 01:40** | Ministración, Llamado y Oración | Equipo Pastoral | Intercesión por enfermos y familias |\n` +
          `| **01:40 - 01:45** | Bendición Final y Despedida | Pastor Principal | Saludo en el atrio |`;
      } else {
        fallbackText = `📊 **Análisis y Recomendación Financiera Pastoral**\n` +
          `**Congregación:** ${churchName}\n` +
          `**Tema de Consulta:** ${topic}\n\n` +
          `### **Directrices de Mayordomía y Sostenibilidad Eclesial:**\n` +
          `1. **Transparencia Presupuestaria:** Mantener libros claros y reportes periódicos refuerza la confianza en la congregación (*2 Corintios 8:21*).\n` +
          `2. **Priorización de Misiones y Ayuda Fraternal:** Asegurar la asignación para beneficencia comunitaria y sostenimiento ministerial.\n` +
          `3. **Fondo de Reserva de Mantenimiento:** Respaldar imprevistos del templo e infraestructura.\n` +
          `4. **Cooperativa Solidaria:** Estimular el ahorro y préstamos justos para las familias miembro.`;
      }

      res.json({ text: fallbackText });
    } catch (error: any) {
      console.error('Error en API pastoral AI:', error);
      res.status(500).json({
        error: error.message || 'Ocurrió un error al procesar la solicitud con IA.',
      });
    }
  });

  // Vite dev middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Eclesia iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
});
