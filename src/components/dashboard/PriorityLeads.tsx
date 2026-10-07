"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { PRIORITY_LEADS } from '../../data/mockData';
import { LeadBadge } from '../common/LeadBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  Star,
  Phone,
  Building,
  ChevronRight,
  ExternalLink,
  Home
} from 'lucide-react';

export const PriorityLeads: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Leads Prioritários</h3>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
              Demonstração Ponta Grossa/PR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Oportunidades ativas no funil de vendas</p>
        </div>

        <button
          onClick={() => router.push('/leads')}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          Ver todos os leads <ChevronRight size={14} />
        </button>
      </div>

      {/* Table View */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-3">Cliente</th>
              <th className="py-3 px-3">Imóvel Procurado</th>
              <th className="py-3 px-3">Entrada Informada</th>
              <th className="py-3 px-3">Temperatura</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PRIORITY_LEADS.slice(0, 5).map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 font-bold text-white text-xs shadow-2xs">
                      {lead.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs group-hover:text-brand-600 transition-colors">
                        {lead.name}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Phone size={10} /> {lead.phone}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
                    <Home size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-[200px]">{lead.demand.propertyType} - {lead.demand.city}</span>
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  <span className="font-bold text-slate-900 text-xs">
                    R$ {lead.financial.downPaymentAmount.toLocaleString('pt-BR')}
                  </span>
                </td>

                <td className="py-3.5 px-3">
                  <LeadBadge classification={lead.classification} size="sm" />
                </td>

                <td className="py-3.5 px-3">
                  <StatusBadge status={lead.status} size="sm" />
                </td>

                <td className="py-3.5 px-3 text-right">
                  <button
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all shadow-2xs"
                  >
                    <span>Ver Ficha</span>
                    <ExternalLink size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
