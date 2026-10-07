"use client";

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-brand-600 selection:text-white overflow-x-hidden">
      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area Offset by Desktop Sidebar */}
      <div className="flex flex-1 flex-col lg:pl-72 transition-all duration-300">
        {/* Header Component */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              © {new Date().getFullYear()} <strong>GC SDR Imobiliário</strong> — Gustavo Carneiro Corretor de Imóveis
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Fase 1: UI & Arquitetura Visual | Next.js + Tailwind + TypeScript
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
