// Entry point das funcoes serverless da Vercel.
// Reaproveita o mesmo app Express de server.ts (autenticacao, 2FA, leads, upload)
// sem chamar app.listen() - a Vercel invoca o app exportado a cada requisicao.
import app from '../server';

export default app;
