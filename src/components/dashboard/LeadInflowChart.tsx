"use client";

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { LEAD_INFLOW_DATA } from '../../data/mockData';
import { TrendingUp, Info } from 'lucide-react';

export const LeadInflowChart: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        Carregando gráfico de demonstração...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Entrada de Leads ao Longo do Tempo</h3>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
              Demonstração
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Evolução semanal de captação e qualificação</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <span className="rounded-md bg-white px-2.5 py-1 text-slate-900 shadow-2xs">Semanal</span>
          <span className="px-2.5 py-1 text-slate-400 cursor-not-allowed">Mensal</span>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={LEAD_INFLOW_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorQualificados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="period" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '12px',
                color: '#FFF',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
              }}
              itemStyle={{ color: '#FFF' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="total"
              name="Total Captados"
              stroke="#2563EB"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
            <Area
              type="monotone"
              dataKey="qualificados"
              name="Leads Qualificados"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorQualificados)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
