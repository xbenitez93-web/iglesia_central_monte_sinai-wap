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

  // Resolve social media video URLs (Facebook, Instagram, TikTok, Twitter/X, YouTube, etc.)
  app.post('/api/media/resolve-social-url', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ error: 'URL no proporcionada o vacía.' });
      }

      const inputUrl = url.trim();
      let canonicalUrl = inputUrl;
      let platform = 'unknown';
      let title = '';
      let thumbnailUrl = '';
      let directVideoUrl = '';
      let isReel = false;
      let videoId = '';

      const lower = inputUrl.toLowerCase();

      // 1. YouTube
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        platform = 'youtube';
        let ytId = '';
        const shortMatch = inputUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
        if (shortMatch) ytId = shortMatch[1];
        if (!ytId) {
          const vMatch = inputUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
          if (vMatch) ytId = vMatch[1];
        }
        if (!ytId) {
          const embedMatch = inputUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/i);
          if (embedMatch) ytId = embedMatch[1];
        }
        if (!ytId) {
          const shortsMatch = inputUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
          if (shortsMatch) {
            ytId = shortsMatch[1];
            isReel = true;
          }
        }
        if (ytId) {
          videoId = ytId;
          canonicalUrl = `https://www.youtube.com/watch?v=${ytId}`;
          thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          try {
            const oembedRes = await fetch(
              `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`,
              { signal: AbortSignal.timeout(3500) }
            );
            if (oembedRes.ok) {
              const data = (await oembedRes.json()) as any;
              if (data.title) title = data.title;
              if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
            }
          } catch (_) {}
        }
      }
      // 2. Facebook (share links /share/v/, /share/r/, fb.watch, reels, mobile URLs)
      else if (lower.includes('facebook.com') || lower.includes('fb.watch')) {
        platform = 'facebook';
        isReel = lower.includes('/reel') || lower.includes('/share/r/');

        try {
          const fbRes = await fetch(inputUrl, {
            headers: {
              'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(5000),
          });

          if (fbRes.ok) {
            const finalUrl = fbRes.url;
            if (finalUrl && !finalUrl.includes('/login')) {
              canonicalUrl = finalUrl;
            }
            const html = await fbRes.text();

            const ogUrlMatch = html.match(/<meta property=["']og:url["'] content=["']([^"']+)["']/i);
            if (ogUrlMatch && !ogUrlMatch[1].includes('/login')) {
              canonicalUrl = ogUrlMatch[1];
            }

            const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
            if (ogTitleMatch) {
              title = ogTitleMatch[1]
                .replace(/&#xb7;/g, '•')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"');
            }

            const ogImageMatch = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
            if (ogImageMatch) {
              thumbnailUrl = ogImageMatch[1].replace(/&amp;/g, '&');
            }

            const ogVideoMatch = html.match(
              /<meta property=["']og:video(?::secure_url)?["'] content=["']([^"']+)["']/i
            );
            if (ogVideoMatch) {
              directVideoUrl = ogVideoMatch[1].replace(/&amp;/g, '&');
            }
          }
        } catch (_) {}

        const vidMatch =
          canonicalUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/i) ||
          canonicalUrl.match(/\/videos\/([a-zA-Z0-9_-]+)/i);
        const rMatch =
          canonicalUrl.match(/\/reel\/([a-zA-Z0-9_-]+)/i) ||
          inputUrl.match(/\/reel\/([a-zA-Z0-9_-]+)/i);
        const shareMatch = inputUrl.match(/\/share\/[vr]\/([a-zA-Z0-9_-]+)/i);

        if (rMatch) {
          videoId = rMatch[1];
          isReel = true;
          canonicalUrl = `https://www.facebook.com/reel/${rMatch[1]}`;
        } else if (vidMatch) {
          videoId = vidMatch[1];
          canonicalUrl = `https://www.facebook.com/watch/?v=${vidMatch[1]}`;
        } else if (shareMatch) {
          videoId = shareMatch[1];
          if (isReel) {
            canonicalUrl = `https://www.facebook.com/reel/${shareMatch[1]}`;
          } else {
            canonicalUrl = `https://www.facebook.com/watch/?v=${shareMatch[1]}`;
          }
        }
      }
      // 3. TikTok (including vm.tiktok.com, vt.tiktok.com and short links)
      else if (lower.includes('tiktok.com')) {
        platform = 'tiktok';
        isReel = true;

        // 3a. Consultar oEmbed oficial de TikTok
        try {
          const oembedRes = await fetch(
            `https://www.tiktok.com/oembed?url=${encodeURIComponent(inputUrl)}`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              signal: AbortSignal.timeout(4000),
            }
          );
          if (oembedRes.ok) {
            const data = await oembedRes.json();
            if (data.title) title = data.title;
            if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
            if (data.author_name && !title) title = `TikTok de @${data.author_name}`;
            if (data.embed_product_id) videoId = String(data.embed_product_id);
            if (videoId) {
              const authorSlug = data.author_unique_id ? `@${data.author_unique_id}` : '@video';
              canonicalUrl = `https://www.tiktok.com/${authorSlug}/video/${videoId}`;
            }
          }
        } catch (_) {}

        // 3b. Si oEmbed no resolvió el ID (enlaces móviles acortados vm.tiktok.com o vt.tiktok.com), seguir redirección
        if (!videoId) {
          try {
            const ttRes = await fetch(inputUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
              redirect: 'follow',
              signal: AbortSignal.timeout(5000),
            });
            if (ttRes.ok) {
              if (ttRes.url) canonicalUrl = ttRes.url;
              const html = await ttRes.text();
              const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
              if (ogTitleMatch && !title) title = ogTitleMatch[1];
              const ogImageMatch = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
              if (ogImageMatch && !thumbnailUrl) thumbnailUrl = ogImageMatch[1];

              // Reintentar oEmbed con la URL expandida si aún falta miniatura o id
              if (canonicalUrl && canonicalUrl !== inputUrl && (!thumbnailUrl || !videoId)) {
                try {
                  const subOembed = await fetch(
                    `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`,
                    { signal: AbortSignal.timeout(3000) }
                  );
                  if (subOembed.ok) {
                    const subData = await subOembed.json();
                    if (subData.title && !title) title = subData.title;
                    if (subData.thumbnail_url && !thumbnailUrl) thumbnailUrl = subData.thumbnail_url;
                    if (subData.embed_product_id) videoId = String(subData.embed_product_id);
                  }
                } catch (_) {}
              }
            }
          } catch (_) {}

          const ttVideoMatch =
            canonicalUrl.match(/\/video\/(\d{15,22})/i) || inputUrl.match(/\/video\/(\d{15,22})/i);
          if (ttVideoMatch) {
            videoId = ttVideoMatch[1];
            canonicalUrl = `https://www.tiktok.com/@video/video/${videoId}`;
          }
        }
      }
      // 4. Instagram (reels and posts)
      else if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
        platform = 'instagram';
        const reelMatch = inputUrl.match(/reels?\/([a-zA-Z0-9_-]+)/i);
        const pMatch = inputUrl.match(/(?:p|tv)\/([a-zA-Z0-9_-]+)/i);
        const code = reelMatch?.[1] || pMatch?.[1];
        if (code) {
          videoId = code;
          isReel = !!reelMatch;
          canonicalUrl = isReel
            ? `https://www.instagram.com/reel/${code}/`
            : `https://www.instagram.com/p/${code}/`;
        }
        try {
          const igRes = await fetch(inputUrl, {
            headers: { 'User-Agent': 'facebookexternalhit/1.1' },
            redirect: 'follow',
            signal: AbortSignal.timeout(4000),
          });
          if (igRes.ok) {
            const html = await igRes.text();
            const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
            if (ogTitleMatch) title = ogTitleMatch[1];
            const ogImageMatch = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
            if (ogImageMatch) thumbnailUrl = ogImageMatch[1];
          }
        } catch (_) {}
      }
      // 5. Twitter / X
      else if (lower.includes('twitter.com') || lower.includes('x.com')) {
        platform = 'twitter';
        const tweetMatch = inputUrl.match(/status\/(\d+)/i);
        if (tweetMatch) {
          videoId = tweetMatch[1];
          canonicalUrl = `https://twitter.com/i/status/${videoId}`;
        }
      }
      // 6. Direct MP4 / WebM / Media
      else if (
        lower.endsWith('.mp4') ||
        lower.endsWith('.webm') ||
        lower.endsWith('.mov') ||
        lower.startsWith('/uploads/')
      ) {
        platform = 'direct';
        directVideoUrl = inputUrl;
        title = path.basename(inputUrl.split('?')[0]);
      }

      return res.json({
        success: true,
        originalUrl: inputUrl,
        canonicalUrl,
        platform,
        videoId,
        title:
          title ||
          (platform !== 'unknown' ? `${platform.toUpperCase()} Video` : 'Video en Línea'),
        thumbnailUrl,
        directVideoUrl,
        isReel,
      });
    } catch (err: any) {
      console.error('[Resolve Social URL] Error:', err);
      return res.status(500).json({ error: err.message || 'Error al resolver URL' });
    }
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
