"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CONTACT_SOURCE_DATA } from '../../data/mockData';

export const ContactSourceChart: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const barColors = ['#2563EB', '#0284C7', '#E1306C', '#10B981', '#64748B'];

  if (!mounted) {
    return (
      <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        Carregando origens de contato...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-base">Origem dos Contatos</h3>
          <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
            Demonstração
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Canais de maior conversão de novos clientes</p>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CONTACT_SOURCE_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              dataKey="source"
              type="category"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '12px',
                color: '#FFF',
                fontSize: '12px'
              }}
              formatter={(value: any) => [`${value} leads`, 'Total']}
            />
            <Bar dataKey="quantidade" radius={[0, 8, 8, 0]} barSize={20}>
              {CONTACT_SOURCE_DATA.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
