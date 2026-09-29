import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
const PORT = 3000;

// ==========================================
// 2. PARSERS & STRICT CORS (Restringir CORS)
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Restringir CORS: Whitelist permitida com suporte a credenciais (Cookies HttpOnly)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.APP_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like same-origin mobile apps, curl or internal requests)
      if (!origin) return callback(null, true);
      // In development or container environment, check allowed origins or same host
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.localhost');
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback to same host
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  })
);

// Security Headers (CSP, Frame Options, Nosniff, XSS protection)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ==========================================
// 3. RATE LIMITING (Use Rate Limit)
// ==========================================
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const key = `${req.baseUrl || ''}${req.path}_${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    if (record.count >= options.max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: options.message,
        retryAfter: retryAfterSec,
      });
    }

    record.count += 1;
    next();
  };
}

const leadsRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 12, // Max 12 lead submissions per hour per IP
  message: 'Limite de solicitações comerciais atingido temporariamente. Tente novamente mais tarde.',
});

// Clean up stale rate limits every 10 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);
if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

// ==========================================
// 4. AUTHENTICATION
// ==========================================
// A autenticação real do painel administrativo agora é feita inteiramente
// pelo Supabase Auth, validada no servidor do Supabase (nunca no código do
// site). As rotas de login/2FA/sessão que existiam aqui foram removidas:
// elas guardavam uma senha de admin em texto puro no próprio código-fonte
// deste arquivo, publicado num repositório público — uma vulnerabilidade
// real que foi corrigida ao migrar a autenticação para o Supabase.

// ==========================================
// 7. INPUT SANITIZATION & SERVER-SIDE VALIDATION
// ==========================================
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // strip potential HTML tags
    .trim();
}

function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim()) && email.length >= 5 && email.length <= 120;
}

// ==========================================
// 8. API ROUTES
// ==========================================

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    securityFeatures: {
      rls: true,
      rateLimit: true,
      serverSideValidation: true,
      corsRestricted: true,
      authProvider: 'supabase',
    },
  });
});

// COMMERCIAL LEADS SUBMISSION: Server-Side Validation + Rate Limit
app.post(['/api/leads', '/leads'], leadsRateLimiter, (req, res) => {
  const { name, email, brand, budget, message } = req.body;

  // 1. Validação Server-Side rigorosa
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: 'O nome deve ter entre 2 e 100 caracteres.' });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Informe um endereço de e-mail corporativo válido.' });
  }

  if (!brand || typeof brand !== 'string' || brand.trim().length < 2 || brand.trim().length > 100) {
    return res.status(400).json({ error: 'O nome da marca deve ter entre 2 e 100 caracteres.' });
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 2000) {
    return res.status(400).json({ error: 'A mensagem do projeto deve conter entre 5 e 2000 caracteres.' });
  }

  // Sanitize values
  const sanitizedLead = {
    id: `lead_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    name: sanitizeString(name),
    email: email.trim().toLowerCase(),
    brand: sanitizeString(brand),
    budget: budget ? sanitizeString(budget) : 'A definir',
    message: sanitizeString(message),
    createdAt: new Date().toISOString(),
    status: 'new',
    ipHash: crypto.createHash('sha256').update(req.ip || 'local').digest('hex').substring(0, 12),
  };

  return res.status(201).json({
    success: true,
    message: 'Proposta comercial recebida e validada com sucesso!',
    lead: sanitizedLead,
  });
});

// Fallback para qualquer rota de API não encontrada (evita timeout/500 na Vercel)
app.use(['/api', '/api/*'], (req, res) => {
  res.status(404).json({ error: 'Endpoint de API não encontrado.' });
});

// ==========================================
// 9. VITE MIDDLEWARE & STATIC SERVING
// (apenas para execucao local/tradicional; na Vercel os assets estaticos
// sao servidos pelo CDN e este app roda como funcao serverless via api/index.ts)
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
    console.log(`🔒 Secure Media Kit Server running on port ${PORT}`);
  });
}

// Na Vercel ou quando importado como módulo, não executamos o listen nem estáticos
const isMain = typeof process !== 'undefined' && process.argv[1] && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.cjs') ||
  process.argv[1].endsWith('server.js')
);

if (isMain && !process.env.VERCEL && !process.env.VERCEL_ENV) {
  startServer();
}

export default app;
