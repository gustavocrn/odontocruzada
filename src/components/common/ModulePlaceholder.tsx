"use client";

import React from 'react';
import { LucideIcon, Layers, ChevronRight, CheckCircle, Clock, Database, Cpu, MessageSquare } from 'lucide-react';
import { DemoNoticeBanner } from './DemoNoticeBanner';

interface FeatureItem {
  title: string;
  description: string;
  status: 'pronto_ui' | 'proxima_etapa';
}

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  moduleBadge: string;
  features: FeatureItem[];
  children?: React.ReactNode;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  description,
  icon: IconComponent,
  moduleBadge,
  features,
  children
}) => {
  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Module Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-gradient-to-br from-brand-50 to-blue-100/40 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-navy-900 p-3.5 text-brand-400 shadow-md shadow-navy-900/10">
              <IconComponent size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200/60">
                  {moduleBadge}
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Clock size={12} /> Próxima Etapa
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Custom preview passed as children or default feature roadmap) */}
      {children ? (
        children
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Architecture Readiness Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-4 text-base">
              <Layers className="text-brand-600" size={20} />
              <span>Preparação Arquitetural do Módulo</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              A interface e os componentes visuais deste módulo foram desenhados na arquitetura atual e estão preparados para receber os motores de backend.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5 font-medium text-slate-700">
                  <Database size={16} className="text-blue-600" />
                  <span>Modelagem de Dados & Schema</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Pronto no Frontend
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5 font-medium text-slate-700">
                  <Cpu size={16} className="text-purple-600" />
                  <span>Motor de Inteligência Artificial</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                  Aguardando Conexão LLM
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5 font-medium text-slate-700">
                  <MessageSquare size={16} className="text-emerald-600" />
                  <span>API WhatsApp Web / Meta</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                  Aguardando Endpoint
                </span>
              </div>
            </div>
          </div>

          {/* Roadmap Features Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 text-base">Recursos Planejados para este Módulo</h3>
            <div className="space-y-3">
              {features.map((feat, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <ChevronRight size={14} className="text-brand-600" />
                      {feat.title}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Etapa Futura
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pl-5">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
