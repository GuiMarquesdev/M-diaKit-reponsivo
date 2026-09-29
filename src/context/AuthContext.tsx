import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { CommercialLead } from '../types';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role?: 'ADMIN' | 'EDITOR' | 'VIEWER';
  twoFactorEnabled?: boolean;
  permissions?: string[];
}

// Mantido apenas para compatibilidade de tipos com a UI existente do painel.
// O login real nunca gera um desafio de 2FA: a senha já é validada no
// servidor do Supabase, então este objeto sempre fica com isPending: false.
export interface TwoFaChallenge {
  isPending: boolean;
  challengeId: string | null;
  email: string | null;
  maskedEmail?: string;
  expiresInSeconds?: number;
  code?: string;
  isSimulated?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  twoFaChallenge: TwoFaChallenge;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<{ requires2FA: boolean }>;
  verify2FACode: (code: string) => Promise<boolean>;
  resend2FACode: () => Promise<{ success: boolean; message?: string }>;
  fetchCurrent2FACode: () => Promise<string | null>;
  cancel2FA: () => void;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  submitLead: (lead: Omit<CommercialLead, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
}

const NO_CHALLENGE: TwoFaChallenge = { isPending: false, challengeId: null, email: null };

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  twoFaChallenge: NO_CHALLENGE,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => ({ requires2FA: false }),
  verify2FACode: async () => false,
  resend2FACode: async () => ({ success: false }),
  fetchCurrent2FACode: async () => null,
  cancel2FA: () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  submitLead: async () => ({ success: false }),
});

const sessionToAppUser = (session: Session | null): AppUser | null => {
  if (!session?.user) return null;
  const { user: su } = session;
  return {
    uid: su.id,
    email: su.email || null,
    displayName: (su.user_metadata?.full_name as string) || 'Sophia Menezes',
    photoURL: (su.user_metadata?.avatar_url as string) || null,
    // Não há cadastro público (ver registerWithEmail abaixo): toda conta que
    // existir no projeto Supabase foi criada manualmente pelo desenvolvedor
    // no painel, então qualquer sessão válida aqui já é uma conta de admin.
    role: 'ADMIN',
    twoFactorEnabled: false,
    permissions: ['EDIT_CONTENT', 'MANAGE_LEADS', 'MANAGE_BRANDS', 'MANAGE_SETTINGS', 'MANAGE_USERS'],
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setUser(sessionToAppUser(data.session));
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(sessionToAppUser(session));
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Login real: a senha é validada pelo Supabase Auth no servidor.
  // Nada de senha ou hash fica no código do site.
  const loginWithEmail = async (email: string, pass: string): Promise<{ requires2FA: boolean }> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass,
    });

    if (error || !data.session) {
      throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    setUser(sessionToAppUser(data.session));
    return { requires2FA: false };
  };

  // Sem cadastro público: as únicas contas de admin são criadas manualmente
  // pelo desenvolvedor no painel do Supabase. Isso evita que qualquer
  // visitante que descubra a URL do admin crie a própria conta e vire admin.
  const registerWithEmail = async (): Promise<void> => {
    throw new Error(
      'Cadastro de novos administradores está desabilitado. Peça ao desenvolvedor para criar seu acesso no painel do Supabase.'
    );
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) {
      throw new Error(
        'Login com Google ainda não está configurado no Supabase deste projeto. Use e-mail e senha, ou peça ao desenvolvedor para habilitar o provedor Google.'
      );
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Compatibilidade: o fluxo de 2FA simulado foi removido (não era real —
  // o código chegava a ser devolvido na própria resposta da API). O login
  // com senha validada pelo Supabase já cobre a autenticação de verdade.
  const verify2FACode = async (): Promise<boolean> => false;
  const resend2FACode = async (): Promise<{ success: boolean; message?: string }> => ({ success: false });
  const fetchCurrent2FACode = async (): Promise<string | null> => null;
  const cancel2FA = () => {};

  const submitLead = async (
    lead: Omit<CommercialLead, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const { error } = await supabase.from('leads').insert({
      name: lead.name,
      email: lead.email,
      brand: lead.brand,
      budget: lead.budget,
      message: lead.message,
    });

    if (error) throw error;
    return { success: true, message: 'Proposta comercial enviada com sucesso!' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        twoFaChallenge: NO_CHALLENGE,
        loginWithGoogle,
        loginWithEmail,
        verify2FACode,
        resend2FACode,
        fetchCurrent2FACode,
        cancel2FA,
        registerWithEmail,
        logout,
        submitLead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
