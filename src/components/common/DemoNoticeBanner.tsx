"use client";

import React from 'react';
import { Info, Database, Bot, MessageSquare, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getSupabaseConfigStatus } from '../../lib/supabase';

export const DemoNoticeBanner: React.FC = () => {
  const status = getSupabaseConfigStatus();

  return (
    <div className="mb-6 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 p-4 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-lg p-2 text-white shadow-xs ${status.isConfigured ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            <Info size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${status.isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                {status.isConfigured ? 'Conexão Supabase Ativa' : 'Modo Local / Demonstração'}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {status.isConfigured ? `Chave: ${status.keyType}` : 'Aguardando credenciais no .env.local'}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-700">
              {status.isConfigured
                ? `O CRM está preparado para ler e gravar dados na instância Supabase (${status.url}). RLS configurado.`
                : 'O CRM está operando em Modo Local com armazenamento reativo. Insira NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local para ativar o Supabase real.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t border-blue-100 sm:border-t-0">
          <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-2xs ${status.isConfigured ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' : 'bg-white text-slate-600 border-slate-200'}`}>
            <Database size={13} className={status.isConfigured ? 'text-emerald-600' : 'text-slate-400'} />
            <span>{status.isConfigured ? 'PostgreSQL RLS Ready' : 'DB Ready'}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
            <Bot size={13} className="text-purple-500" />
            <span>IA SDR Ready</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
            <MessageSquare size={13} className="text-emerald-500" />
            <span>WhatsApp Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
