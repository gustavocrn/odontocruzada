"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { leadService } from '../../services/leadService';
import { Lead, LeadStatus } from '../../types';
import { LeadBadge } from '../../components/common/LeadBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Kanban as KanbanIcon,
  ChevronRight,
  User,
  Phone,
  DollarSign,
  ArrowRightLeft
} from 'lucide-react';

export default function FunilPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    setLoading(true);
    const data = await leadService.getLeads();
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const funnelColumns: LeadStatus[] = [
    'Novo',
    'Em atendimento',
    'Qualificando',
    'Qualificado',
    'Visita agendada',
    'Negociação',
    'Convertido'
  ];

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await leadService.updateLead(leadId, { status: newStatus });
    loadLeads();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-navy-900 p-3 text-brand-300 shadow-md">
              <KanbanIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Funil de Vendas Imobiliário</h1>
              <p className="text-xs text-slate-500">Visualização Kanban por status de atendimento em Ponta Grossa/PR</p>
            </div>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[600px]">
          {funnelColumns.map((colStatus) => {
            const columnLeads = leads.filter((l) => l.status === colStatus);
            return (
              <div
                key={colStatus}
                className="w-72 shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-2xs flex flex-col"
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5 px-1">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <StatusBadge status={colStatus} size="sm" />
                  </span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[650px]">
                  {columnLeads.length > 0 ? (
                    columnLeads.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-brand-400 hover:shadow-xs transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <p
                            onClick={() => router.push(`/leads/${item.id}`)}
                            className="font-bold text-xs text-slate-900 group-hover:text-brand-600 cursor-pointer transition-colors"
                          >
                            {item.name}
                          </p>
                          <LeadBadge classification={item.classification} size="sm" />
                        </div>

                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {item.demand.propertyType} - {item.demand.city}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                          <span className="font-bold text-slate-900">
                            R$ {item.financial.downPaymentAmount.toLocaleString('pt-BR')} (Entrada)
                          </span>
                          <span className="text-slate-400 font-semibold">{item.source}</span>
                        </div>

                        {/* Move status picker */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as LeadStatus)}
                            className="rounded-lg border border-slate-200 bg-slate-50 py-0.5 px-1.5 text-[10px] font-semibold text-slate-700 focus:outline-hidden"
                          >
                            {funnelColumns.map((s) => (
                              <option key={s} value={s}>
                                Mover: {s}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => router.push(`/leads/${item.id}`)}
                            className="text-[11px] font-bold text-brand-600 hover:text-brand-700"
                          >
                            Ficha →
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400 font-medium">
                      Nenhum lead nesta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
