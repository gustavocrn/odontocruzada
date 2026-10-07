"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ModulePlaceholder } from '../../components/common/ModulePlaceholder';
import { MOCK_APPOINTMENTS } from '../../data/mockData';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Plus,
  Building,
  CheckCircle2,
  Calendar as CalendarIcon
} from 'lucide-react';

export default function AgendamentosPage() {
  const [filterType, setFilterType] = useState('todos');

  const features = [
    {
      title: 'Sincronização com Google Calendar & Outlook',
      description: 'Estrutura visual configurada para integrar a agenda pessoal de Gustavo Carneiro com lembretes automáticos.',
      status: 'pronto_ui' as const
    },
    {
      title: 'Confirmação Automática via WhatsApp',
      description: 'Disparo de lembrete de visita 2 horas antes com localização e dados do imóvel.',
      status: 'proxima_etapa' as const
    },
    {
      title: 'Gestão de Disponibilidade & Plantão',
      description: 'Definição de janelas livres para visitas em imóveis exclusivos no Jardins, Moema e Alphaville.',
      status: 'pronto_ui' as const
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <ModulePlaceholder
          title="Agendamentos & Agenda de Visitas"
          description="Gestão de reuniões e visitas presenciais com compradores em potencial."
          icon={CalendarDays}
          moduleBadge="Módulo de Agendamentos"
          features={features}
        >
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-700">Filtrar por:</span>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">
                  <button
                    onClick={() => setFilterType('todos')}
                    className={`rounded-lg px-2.5 py-1 ${filterType === 'todos' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterType('visita')}
                    className={`rounded-lg px-2.5 py-1 ${filterType === 'visita' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Visitas
                  </button>
                  <button
                    onClick={() => setFilterType('online')}
                    className={`rounded-lg px-2.5 py-1 ${filterType === 'online' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Reuniões Online
                  </button>
                </div>
              </div>

              <button
                onClick={() => alert("Novo Agendamento — Integração de calendário no backend.")}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-sm"
              >
                <Plus size={16} />
                <span>Agendar Nova Visita</span>
              </button>
            </div>

            {/* Upcoming Appointments List */}
            <div className="grid gap-4 md:grid-cols-3">
              {MOCK_APPOINTMENTS.map((app) => (
                <div key={app.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card hover:border-brand-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                        <CalendarIcon size={13} /> {app.date}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" /> {app.time}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="font-bold text-slate-900 text-sm">{app.property}</p>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <User size={13} className="text-slate-400" />
                        <span>Cliente: {app.leadName}</span>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-slate-500">
                        <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                        <span>{app.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={11} /> {app.status}
                    </span>
                    <button
                      onClick={() => alert(`Detalhes do agendamento de ${app.leadName} — Serão exibidos dinamicamente.`)}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModulePlaceholder>
      </div>
    </DashboardLayout>
  );
}
