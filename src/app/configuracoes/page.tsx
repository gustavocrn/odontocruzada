"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ModulePlaceholder } from '../../components/common/ModulePlaceholder';
import { isSupabaseConfigured } from '../../lib/supabase';
import { BROKER_INFO } from '../../data/mockData';
import {
  Settings,
  User,
  Sliders,
  MessageSquare,
  Bot,
  Bell,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  Database,
  Key
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'supabase' | 'whatsapp' | 'ia'>('perfil');

  const supabaseReady = isSupabaseConfigured();

  const features = [
    {
      title: 'Perfil do Corretor (Gustavo Carneiro - CRECI 52321)',
      description: 'Gestão dos dados cadastrais do corretor titular para Ponta Grossa/PR.',
      status: 'pronto_ui' as const
    },
    {
      title: 'Conexão do Banco de Dados Supabase (PostgreSQL)',
      description: 'Instruções e diagnóstico de conexão para variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e KEY.',
      status: 'pronto_ui' as const
    },
    {
      title: 'Chaves de API do WhatsApp Web & IA',
      description: 'Gerenciamento seguro preparado para a Etapa 3 (Comunicação & IA SDR).',
      status: 'proxima_etapa' as const
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <ModulePlaceholder
          title="Configurações & Banco de Dados"
          description="Painel de personalização da plataforma, variáveis do Supabase e perfil profissional de Gustavo Carneiro."
          icon={Settings}
          moduleBadge="Módulo de Configurações"
          features={features}
        >
          <div className="space-y-6">
            {/* Sub-tabs Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
              {[
                { id: 'perfil', label: 'Perfil do Corretor', icon: User },
                { id: 'supabase', label: 'Banco de Dados (Supabase)', icon: Database },
                { id: 'whatsapp', label: 'Integração WhatsApp', icon: MessageSquare },
                { id: 'ia', label: 'Inteligência Artificial', icon: Bot },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-tab Content Panels */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
              {activeSubTab === 'perfil' && (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 font-extrabold text-white text-xl shadow-md">
                      GC
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{BROKER_INFO.name}</h4>
                      <p className="text-xs text-slate-500">{BROKER_INFO.title} • {BROKER_INFO.city}</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} /> CRECI {BROKER_INFO.creci}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        defaultValue={BROKER_INFO.name}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registro CRECI</label>
                      <input
                        type="text"
                        defaultValue={BROKER_INFO.creci}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Comercial</label>
                      <input
                        type="email"
                        defaultValue={BROKER_INFO.email}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Telefone WhatsApp</label>
                      <input
                        type="text"
                        defaultValue={BROKER_INFO.phone}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'supabase' && (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${supabaseReady ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-3">
                      <Database className={supabaseReady ? 'text-emerald-600' : 'text-amber-600'} size={20} />
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          {supabaseReady ? 'Supabase Conectado com Sucesso' : 'Modo Híbrido Ativo (Armazenamento Local Operacional)'}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {supabaseReady
                            ? 'As operações de CRUD estão sincronizando diretamente com a sua instância do Supabase.'
                            : 'O sistema está funcionando 100% com persistência em memória/localStorage enquanto as chaves do Supabase são inseridas.'}
                        </p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${supabaseReady ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                      {supabaseReady ? 'Online Supabase' : 'Aguardando Env Vars'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Key size={14} className="text-brand-600" />
                      Variáveis de Ambiente Necessárias no arquivo <code className="bg-slate-200 px-1 py-0.5 rounded text-brand-700">.env.local</code>
                    </h5>

                    <pre className="p-3 rounded-lg bg-navy-900 text-slate-100 text-xs font-mono overflow-x-auto">
                      NEXT_PUBLIC_SUPABASE_URL=https://sua-instancia.supabase.co{"\n"}
                      NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-publica
                    </pre>

                    <p className="text-xs text-slate-500">
                      O script SQL completo para criação de tabelas, enums e políticas RLS encontra-se no projeto em <code className="text-brand-700 font-bold">supabase/schema.sql</code>.
                    </p>
                  </div>
                </div>
              )}

              {activeSubTab === 'whatsapp' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 mb-1">Módulo WhatsApp Cloud / Web API</p>
                  <p>A ser implementado nas etapas de integração de comunicação.</p>
                </div>
              )}

              {activeSubTab === 'ia' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 mb-1">Módulo de Atendimento IA SDR</p>
                  <p>A ser implementado nas etapas de automação de respostas LLM.</p>
                </div>
              )}
            </div>
          </div>
        </ModulePlaceholder>
      </div>
    </DashboardLayout>
  );
}
