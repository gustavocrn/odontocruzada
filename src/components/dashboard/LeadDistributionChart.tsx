"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LEAD_DISTRIBUTION_DATA } from '../../data/mockData';

export const LeadDistributionChart: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        Carregando gráfico de distribuição...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-base">Distribuição por Classificação</h3>
          <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
            Demonstração
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Proporção dos 248 leads ativos por temperatura</p>
      </div>

      <div className="mt-2 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={LEAD_DISTRIBUTION_DATA}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {LEAD_DISTRIBUTION_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFF" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '12px',
                color: '#FFF',
                fontSize: '12px'
              }}
              formatter={(value: any) => [`${value} leads`, 'Quantidade']}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
