"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { BROKER_INFO } from '../../data/mockData';

export default function LoginPage() {
  const { signInWithEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, informe o e-mail e a senha.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const { error } = await signInWithEmail(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('E-mail ainda não confirmado no Supabase.');
        } else {
          setErrorMsg(error.message || 'Erro ao realizar login. Tente novamente.');
        }
      }
    } catch (err: any) {
      setErrorMsg('Ocorreu um erro ao conectar ao Supabase Auth.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-navy-950 p-4 antialiased selection:bg-brand-600 selection:text-white">
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-navy-900 to-navy-950 pointer-events-none" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      {/* Main Login Container */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-blue-700 shadow-xl shadow-brand-600/30 ring-1 ring-white/20 mb-4">
            <Building2 size={32} className="text-white" />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-navy-950" title="Sistema Online" />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">GC SDR</h1>
            <span className="rounded-md bg-brand-500/20 px-2 py-0.5 text-xs font-extrabold text-brand-300 border border-brand-400/30">
              CRM
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400 font-medium">
            {BROKER_INFO.name} — {BROKER_INFO.title} (CRECI {BROKER_INFO.creci})
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-navy-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 border-b border-slate-800/80 pb-4 text-center">
            <h2 className="text-base font-bold text-white">Acesso ao Painel Comercial</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Entre com suas credenciais do Supabase Auth
            </p>
          </div>

          {/* Error Feedback Banner */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-950/80 p-3.5 text-xs text-rose-200 border border-rose-800/60 animate-fade-in">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Config Alert Banner */}
          {!isConfigured && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-amber-950/80 p-3.5 text-xs text-amber-200 border border-amber-800/60">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                As variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> ou <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> precisam ser configuradas no <code>.env.local</code>.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="gustavo@corretor.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-navy-950 py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-navy-950 py-2.5 pl-10 pr-10 text-xs font-medium text-white placeholder-slate-500 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white hover:bg-brand-500 shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Autenticando no Supabase...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Notice */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
              <ShieldCheck size={13} className="text-emerald-400" /> Sistema protegido por RLS e Supabase Auth
            </span>
          </div>
        </div>

        {/* Global Footer info */}
        <p className="text-center text-[11px] text-slate-500 font-medium">
          © {new Date().getFullYear()} GC SDR Imobiliário — Gustavo Carneiro (CRECI 52321)
        </p>
      </div>
    </div>
  );
}
