"use client";

import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ModulePlaceholder } from '../../components/common/ModulePlaceholder';
import {
  BarChart3,
  TrendingUp,
  Download,
  PieChart as PieChartIcon,
  CheckCircle,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export default function RelatoriosPage() {
  const features = [
    {
      title: 'Funil de Conversão Comercial',
      description: 'Métricas detalhadas da taxa de passagem entre Captação -> Qualificação SDR -> Visita -> Proposta -> Fechamento.',
      status: 'pronto_ui' as const
    },
    {
      title: 'Relatórios Exportáveis em PDF & Excel',
      description: 'Preparado para gerar relatórios mensais formatados para apresentação de resultados.',
      status: 'proxima_etapa' as const
    },
    {
      title: 'Tempo Médio de Resposta (SLA SDR)',
      description: 'Acompanhamento do tempo entre a entrada do lead no site/WhatsApp e o primeiro contato automatizado.',
      status: 'pronto_ui' as const
    }
  ];

  const conversionFunnel = [
    { stage: 'Leads Captados', value: 248, percent: '100%', color: 'bg-blue-600' },
    { stage: 'Triados pelo SDR', value: 180, percent: '72.5%', color: 'bg-brand-500' },
    { stage: 'Leads Qualificados', value: 28, percent: '11.2%', color: 'bg-purple-600' },
    { stage: 'Visitas Agendadas', value: 12, percent: '4.8%', color: 'bg-emerald-600' },
    { stage: 'Propostas em Fechamento', value: 4, percent: '1.6%', color: 'bg-amber-600' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <ModulePlaceholder
          title="Relatórios & Análise de Desempenho"
          description="Relatórios visuais e indicadores-chave de desempenho comercial para Gustavo Carneiro."
          icon={BarChart3}
          moduleBadge="Módulo de Relatórios"
          features={features}
        >
          <div className="space-y-6">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Período:</span>
                <select className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden">
                  <option>Últimos 30 Dias (Setembro/Outubro)</option>
                  <option>Último Trimestre</option>
                  <option>Ano Atual (2026)</option>
                </select>
              </div>

              <button
                onClick={() => alert("Exportação visual — A geração de relatórios PDF/Excel será ativada com o banco de dados.")}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <Download size={15} />
                <span>Exportar Relatório (PDF)</span>
              </button>
            </div>

            {/* Funnel Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Funil de Conversão SDR (Demonstração)</h3>
                  <p className="text-xs text-slate-500">Taxa de conversão por etapa do processo de vendas</p>
                </div>
                <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  Taxa Global: 4.8%
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {conversionFunnel.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{item.stage}</span>
                      <span>{item.value} leads ({item.percent})</span>
                    </div>
                    <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: item.percent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModulePlaceholder>
      </div>
    </DashboardLayout>
  );
}
