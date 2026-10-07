"use client";

import React from 'react';
import { RECENT_ACTIVITIES } from '../../data/mockData';
import { LeadBadge } from '../common/LeadBadge';
import {
  MessageSquare,
  Bot,
  CalendarCheck,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';

export const RecentActivities: React.FC = () => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare size={15} className="text-blue-600" />;
      case 'ai_sdr':
        return <Bot size={15} className="text-purple-600" />;
      case 'visit':
        return <CalendarCheck size={15} className="text-emerald-600" />;
      case 'status_change':
        return <RefreshCw size={15} className="text-amber-600" />;
      default:
        return <Clock size={15} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Atividades Recentes</h3>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
              Demonstração
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Últimas interações gravadas no funil SDR</p>
        </div>

        <span className="text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer flex items-center gap-1">
          Ver todas <ArrowRight size={14} />
        </span>
      </div>

      <div className="mt-4 flex-1 space-y-3">
        {RECENT_ACTIVITIES.map((act) => (
          <div
            key={act.id}
            className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:border-slate-200 hover:bg-slate-50/60 transition-colors"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 shadow-2xs">
              {getActivityIcon(act.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {act.leadName}
                </span>
                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  {act.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {act.action}
              </p>
              {act.classification && (
                <div className="mt-2">
                  <LeadBadge classification={act.classification} size="sm" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
