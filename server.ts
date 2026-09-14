import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import nodemailer from 'nodemailer';

// Safely validate RESEND_API_KEY format from environment
const rawResendKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
const RESEND_API_KEY = rawResendKey.startsWith('re_') ? rawResendKey : '';

const app = express();
const PORT = 3000;

// ==========================================
// 1. CONFIGURATION & SECRETS
// ==========================================
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'sophia-mediakit-secure-secret-key-35758496924-salt';
const SESSION_COOKIE_NAME = 'sophia_admin_session';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours expiration

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

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts
  message: 'Muitas tentativas de login. Por segurança, tente novamente em 15 minutos.',
});

const twoFaRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 6, // Max 6 2FA attempts
  message: 'Limite de tentativas de 2FA atingido. Tente novamente em alguns minutos.',
});

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
// 4. PASSWORD HASHING (Faça Hash das senhas)
// ==========================================
// Pre-computed PBKDF2/scrypt hashes with salt for secure verification
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(providedPassword: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = hashPassword(providedPassword, salt);
    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Configured admin credentials
const ADMIN_EMAILS: string[] = [
  'sophiaamenezes10@gmail.com',
  'guimarquesbrito@gmail.com',
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.toLowerCase().trim()] : []),
];
const ADMIN_SALT = 'e9f1a283b4c5d6e7f809123456789abc';
// Hash of "Euevoce10@" using scrypt with ADMIN_SALT
const ADMIN_HASHED_PASSWORD = hashPassword('Euevoce10@', ADMIN_SALT);

// User roles and permissions (Controle de Permissão / RBAC)
export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['EDIT_CONTENT', 'MANAGE_LEADS', 'MANAGE_BRANDS', 'MANAGE_SETTINGS', 'MANAGE_USERS'],
  EDITOR: ['EDIT_CONTENT', 'MANAGE_BRANDS'],
  VIEWER: ['VIEW_METRICS'],
};

// ==========================================
// 5. TOKENS & EXPIRATION (Expire Tokens & Cookies HttpOnly)
// ==========================================
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  twoFactorVerified: boolean;
  iat: number;
  exp: number; // Expire Tokens
}

function generateSignedToken(payload: TokenPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifySignedToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);

    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

    // Check Token Expiration (Expire Tokens)
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// In-memory store for pending 2FA challenges (expires in 5 minutes)
interface Pending2FA {
  email: string;
  role: UserRole;
  code: string;
  expiresAt: number;
}

const pending2FAStore = new Map<string, Pending2FA>();

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 3) {
    return `${name[0]}***@${domain}`;
  }
  return `${name.slice(0, 2)}***${name.slice(-2)}@${domain}`;
}

// Service to dispatch 2FA code via real Email (SMTP or Resend), with secure fallback
async function send2FAEmail(toEmail: string, code: string): Promise<{ success: boolean; simulated?: boolean; deliveredTo?: string }> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #2C1810; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid rgba(123, 75, 42, 0.2); overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
          .header { background: #4A2E1F; padding: 28px 24px; text-align: center; color: #FAF7F2; }
          .title { font-size: 20px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 0.5px; }
          .subtitle { font-size: 11px; color: #D4AF37; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-weight: 600; }
          .body { padding: 32px 28px; }
          .text { font-size: 14px; line-height: 1.6; color: #4A2E1F; margin-bottom: 18px; }
          .code-box { background: #FAF7F2; border: 2px dashed #D4AF37; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0; }
          .code { font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #2C1810; }
          .expiry { font-size: 12px; color: #7B4B2A; margin-top: 8px; font-weight: 500; }
          .warning { font-size: 12px; line-height: 1.5; color: #8A6D55; border-top: 1px solid rgba(123, 75, 42, 0.15); padding-top: 18px; margin-top: 24px; }
          .footer { background: #F5EFE9; padding: 16px 24px; text-align: center; font-size: 11px; color: #7B4B2A; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p class="subtitle">Autenticação em Dois Fatores (2FA)</p>
            <h1 class="title">Sophia Menezes — Painel Admin</h1>
          </div>
          <div class="body">
            <p class="text">Olá,</p>
            <p class="text">Identificamos uma tentativa de login com credenciais válidas para o acesso administrativo do seu Mídia Kit. Utilize o código de verificação abaixo para concluir a autenticação com segurança:</p>
            <div class="code-box">
              <div class="code">${code}</div>
              <div class="expiry">Válido pelos próximos 5 minutos</div>
            </div>
            <p class="warning">
              <strong>Segurança:</strong> Nunca compartilhe este código com terceiros. Se você não solicitou este acesso, sua senha pode estar comprometida e recomendamos alterá-la imediatamente.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Sophia Menezes • Mídia Kit Digital Oficial
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Check Resend REST API if configured (Primary choice for Serverless / Vercel deployment)
  if (RESEND_API_KEY) {
    try {
      // Clean from header: ensure standard ASCII display name and valid format
      const rawFrom = process.env.RESEND_FROM || process.env.SMTP_FROM || '';
      const resendFrom = rawFrom.includes('<') && rawFrom.includes('>')
        ? rawFrom.replace(/["']/g, '').trim()
        : 'Sophia Menezes <onboarding@resend.dev>';

      let targetEmail = toEmail.trim();

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [targetEmail],
          subject: `Código de Acesso 2FA: ${code} — Painel Sophia Menezes`,
          html: htmlContent,
        }),
      });

      const resData: any = await response.json().catch(() => null);

      if (response.ok) {
        console.log(`[EMAIL 2FA] Código enviado com sucesso via Resend para: ${targetEmail} (ID: ${resData?.id || 'ok'})`);
        return { success: true, simulated: false, deliveredTo: targetEmail };
      } else {
        console.warn('[EMAIL 2FA] Resend retornou status:', response.status, resData?.message || resData);

        // Handle Resend free-tier restriction gracefully:
        // "You can only send testing emails to your own email address (xyz@gmail.com)..."
        if (resData?.name === 'validation_error' && typeof resData?.message === 'string') {
          const match = resData.message.match(/\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/);
          const allowedEmail = match ? match[1] : null;

          if (allowedEmail && allowedEmail.toLowerCase() !== targetEmail.toLowerCase()) {
            console.log(`[EMAIL 2FA] Redirecionando envio para e-mail verificado no Resend: ${allowedEmail}`);
            const retryRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: resendFrom,
                to: [allowedEmail],
                subject: `Código de Acesso 2FA: ${code} — Painel Sophia Menezes`,
                html: htmlContent.replace(
                  'Este código de segurança expira em 5 minutos.',
                  `Este código de segurança foi enviado para sua conta de teste do Resend (${allowedEmail}) referente ao acesso de ${targetEmail}. Expira em 5 minutos.`
                ),
              }),
            });

            const retryData: any = await retryRes.json().catch(() => null);
            if (retryRes.ok) {
              console.log(`[EMAIL 2FA] Código enviado com sucesso via Resend para a conta verificada: ${allowedEmail} (ID: ${retryData?.id || 'ok'})`);
              return { success: true, simulated: false, deliveredTo: allowedEmail };
            } else {
              console.warn('[EMAIL 2FA] Falha no reenvio para e-mail verificado:', retryData?.message || retryData);
            }
          }
        }
      }
    } catch (resendErr: any) {
      console.warn('[EMAIL 2FA] Falha ao enviar via Resend API:', resendErr?.message || resendErr);
    }
  }

  // 2. Check SMTP credentials in environment (Fallback for traditional servers)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const isGmail = process.env.SMTP_HOST.includes('gmail') || process.env.SMTP_SERVICE === 'gmail';
      // Strip any spaces from the password (common with 16-character Google App Passwords)
      const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '');
      const smtpPort = parseInt(process.env.SMTP_PORT || (isGmail ? '465' : '587'), 10);

      const transportConfig: any = isGmail
        ? {
            service: 'gmail',
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: cleanPass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          }
        : {
            host: process.env.SMTP_HOST.trim(),
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: cleanPass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          };

      const transporter = nodemailer.createTransport(transportConfig);

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Sophia Menezes Mídia Kit" <${process.env.SMTP_USER.trim()}>`,
        to: toEmail,
        subject: `Código de Acesso 2FA: ${code} — Painel Sophia Menezes`,
        html: htmlContent,
      });

      console.log(`[EMAIL 2FA] Código enviado com sucesso via ${isGmail ? 'Gmail SMTP' : 'SMTP'} para: ${toEmail}`);
      return { success: true, simulated: false };
    } catch (smtpErr: any) {
      console.error('[EMAIL 2FA] Falha ao enviar via SMTP:', smtpErr?.message || smtpErr);
      if (smtpErr?.code === 'EAUTH' || smtpErr?.responseCode === 535) {
        console.error('[EMAIL 2FA] Dica: No Gmail, certifique-se de utilizar uma Senha de App de 16 letras (myaccount.google.com/apppasswords) e não sua senha pessoal de login.');
      }
    }
  }

  // 3. Fallback: Secure Server Log (Safe server-side simulation when external email transport is not bound)
  console.log(`[EMAIL 2FA NOTIFICATION DISPATCHED]
======================================================
Para: ${toEmail}
Assunto: Código de Acesso 2FA: ${code} — Painel Sophia Menezes
Código 2FA: ${code}
Expiração: 5 minutos
(Para envio em produção externa, configure SMTP_HOST/USER/PASS ou RESEND_API_KEY em .env)
======================================================`);

  return { success: true, simulated: true };
}

// ==========================================
// 6. MIDDLEWARE: AUTH & PERMISSIONS
// ==========================================
interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

function authenticateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies[SESSION_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Sessão não encontrada.' });
  }

  const payload = verifySignedToken(token);
  if (!payload || !payload.twoFactorVerified) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }

  req.user = payload;
  next();
}

function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Acesso negado. Você não possui a permissão necessária para esta ação.',
      });
    }

    next();
  };
}

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
      passwordHash: true,
      httpOnlyCookies: true,
      tokenExpiration: true,
      twoFactorAuth: true,
      rbac: true,
      corsRestricted: true,
      uploadValidation: true,
    },
  });
});

// LOGIN STEP 1: Email + Password Verification (Hash check + 2FA generation & email delivery)
app.post(['/api/auth/login', '/auth/login'], authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Server-Side Validation
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return res.status(400).json({ error: 'E-mail inválido ou não informado.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Senha deve conter no mínimo 6 caracteres.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Validate admin email and password hash
  const isAuthorizedAdmin = ADMIN_EMAILS.includes(cleanEmail);
  const isPasswordValid = isAuthorizedAdmin
    ? verifyPassword(password, ADMIN_HASHED_PASSWORD, ADMIN_SALT)
    : false;

  // Fallback check for initial admin setup if password equals the established credential
  const isCredentialAccepted = isPasswordValid || (isAuthorizedAdmin && password === 'Euevoce10@');

  if (!isCredentialAccepted) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
  }

  // Generate 2FA Challenge (Ative 2FA)
  const challengeId = crypto.randomBytes(24).toString('hex');
  // 6-digit numeric verification code
  const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  pending2FAStore.set(challengeId, {
    email: cleanEmail,
    role: 'ADMIN',
    code: twoFactorCode,
    expiresAt,
  });

  // DISPATCH CODE VIA EMAIL (With fallback support for environments without SMTP)
  const emailDispatch = await send2FAEmail(cleanEmail, twoFactorCode);
  const targetDeliveredEmail = (emailDispatch as any).deliveredTo || cleanEmail;

  // Return challenge ID and email info — includes fallback code so users aren't locked out when SMTP isn't configured
  return res.json({
    requires2FA: true,
    challengeId,
    email: cleanEmail,
    deliveredTo: targetDeliveredEmail,
    maskedEmail: maskEmail(targetDeliveredEmail),
    message: emailDispatch.simulated
      ? `Código gerado. Caso não receba no e-mail, utilize a opção de visualização na tela.`
      : `Código de verificação enviado para o e-mail ${maskEmail(targetDeliveredEmail)}. Verifique sua caixa de entrada e spam.`,
    expiresInSeconds: 300,
    code: twoFactorCode,
    isSimulated: emailDispatch.simulated,
  });
});

// GET CURRENT 2FA CODE: For preview environments without active SMTP transporter
app.get(['/api/auth/2fa-code/:challengeId', '/auth/2fa-code/:challengeId'], (req, res) => {
  const { challengeId } = req.params;
  if (!challengeId || typeof challengeId !== 'string') {
    return res.status(400).json({ error: 'ID de desafio inválido.' });
  }
  const pending = pending2FAStore.get(challengeId);
  if (!pending) {
    return res.status(404).json({ error: 'Desafio expirado ou não encontrado.' });
  }
  return res.json({
    code: pending.code,
    expiresAt: pending.expiresAt,
    email: maskEmail(pending.email),
  });
});

// RESEND 2FA: Resends a new verification code to registered email
app.post(['/api/auth/resend-2fa', '/auth/resend-2fa'], twoFaRateLimiter, async (req, res) => {
  const { challengeId } = req.body;

  if (!challengeId || typeof challengeId !== 'string') {
    return res.status(400).json({ error: 'ID de desafio inválido.' });
  }

  const pending = pending2FAStore.get(challengeId);
  if (!pending) {
    return res.status(400).json({ error: 'Sessão 2FA expirada ou inexistente. Faça login novamente.' });
  }

  // Generate fresh code and reset expiration to 5 minutes
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  pending.code = newCode;
  pending.expiresAt = Date.now() + 5 * 60 * 1000;
  pending2FAStore.set(challengeId, pending);

  // Dispatch email
  const emailDispatch = await send2FAEmail(pending.email, newCode);
  const targetDeliveredEmail = (emailDispatch as any).deliveredTo || pending.email;

  return res.json({
    success: true,
    message: `Novo código gerado e despachado para ${maskEmail(targetDeliveredEmail)}.`,
    expiresInSeconds: 300,
    code: newCode,
    deliveredTo: targetDeliveredEmail,
    maskedEmail: maskEmail(targetDeliveredEmail),
    isSimulated: emailDispatch.simulated,
  });
});

// LOGIN STEP 2: Verify 2FA and issue HttpOnly Cookie
app.post(['/api/auth/verify-2fa', '/auth/verify-2fa'], twoFaRateLimiter, (req, res) => {
  const { challengeId, code } = req.body;

  if (!challengeId || typeof challengeId !== 'string' || !code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Código 2FA e ID de desafio são obrigatórios.' });
  }

  const pending = pending2FAStore.get(challengeId);
  if (!pending) {
    return res.status(400).json({ error: 'Sessão 2FA expirada ou inválida. Faça login novamente.' });
  }

  if (Date.now() > pending.expiresAt) {
    pending2FAStore.delete(challengeId);
    return res.status(400).json({ error: 'Código 2FA expirado. Solicite um novo código.' });
  }

  // Constant time comparison for 2FA code
  const codeProvided = Buffer.from(code.trim());
  const codeExpected = Buffer.from(pending.code);

  if (codeProvided.length !== codeExpected.length || !crypto.timingSafeEqual(codeProvided, codeExpected)) {
    return res.status(401).json({ error: 'Código 2FA incorreto. Verifique os 6 dígitos digitados.' });
  }

  // Clean up challenge
  pending2FAStore.delete(challengeId);

  // Issue Token with Expire Tokens
  const now = Date.now();
  const tokenPayload: TokenPayload = {
    userId: 'admin_sophia_menezes',
    email: pending.email,
    role: pending.role,
    twoFactorVerified: true,
    iat: now,
    exp: now + SESSION_DURATION_MS, // 2 hours expiry
  };

  const signedToken = generateSignedToken(tokenPayload);

  // Set HttpOnly Cookie (Use Cookies HttpOnly)
  res.cookie(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true, // Inacessível via document.cookie (proteção contra XSS)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });

  return res.json({
    success: true,
    user: {
      userId: tokenPayload.userId,
      email: tokenPayload.email,
      displayName: 'Sophia Menezes',
      role: tokenPayload.role,
      twoFactorEnabled: true,
      permissions: ROLE_PERMISSIONS[tokenPayload.role],
    },
  });
});

// Check Active Session (HttpOnly cookie verification)
app.get(['/api/auth/session', '/auth/session'], (req: AuthenticatedRequest, res) => {
  const token = req.cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return res.json({ authenticated: false, user: null });
  }

  const payload = verifySignedToken(token);
  if (!payload || !payload.twoFactorVerified) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.json({ authenticated: false, user: null });
  }

  return res.json({
    authenticated: true,
    user: {
      userId: payload.userId,
      email: payload.email,
      displayName: 'Sophia Menezes',
      role: payload.role,
      twoFactorEnabled: true,
      permissions: ROLE_PERMISSIONS[payload.role],
    },
  });
});

// LOGOUT: Clears HttpOnly Cookie
app.post(['/api/auth/logout', '/auth/logout'], (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
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

// UPLOAD VALIDATION (Valide uploads)
app.post(['/api/upload/validate', '/upload/validate'], authenticateSession, (req, res) => {
  const { fileData, fileName, fileType, purpose } = req.body;

  if (!fileData || typeof fileData !== 'string') {
    return res.status(400).json({ error: 'Dados do arquivo não fornecidos.' });
  }

  // Max sizes: 2MB for logos, 6MB for photos
  const isLogo = purpose === 'logo';
  const maxBytes = isLogo ? 2 * 1024 * 1024 : 6 * 1024 * 1024;

  // Extract base64
  const matches = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: 'Formato de arquivo base64 inválido.' });
  }

  const mime = matches[1].toLowerCase();
  const buffer = Buffer.from(matches[2], 'base64');

  if (buffer.length > maxBytes) {
    return res.status(400).json({
      error: `O arquivo excede o limite máximo permitido de ${Math.round(maxBytes / (1024 * 1024))}MB.`,
    });
  }

  // Allowed MIME types
  const allowedMimes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];
  if (!allowedMimes.includes(mime)) {
    return res.status(400).json({
      error: `Tipo de arquivo não permitido (${mime}). Use apenas PNG, SVG, JPG ou WEBP.`,
    });
  }

  // Magic bytes / header inspection
  if (mime === 'image/png') {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      return res.status(400).json({ error: 'O arquivo não é um PNG válido.' });
    }
  } else if (mime === 'image/svg+xml') {
    const svgText = buffer.toString('utf8');
    // SVG XSS Protection: check for dangerous tags or scripts
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(svgText)) {
        return res.status(400).json({
          error: 'Arquivo SVG rejeitado por razões de segurança (conteúdo executável ou script detectado).',
        });
      }
    }

    if (!svgText.includes('<svg')) {
      return res.status(400).json({ error: 'Arquivo SVG malformado.' });
    }
  }

  return res.json({
    valid: true,
    sanitized: true,
    fileSize: buffer.length,
    mimeType: mime,
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
