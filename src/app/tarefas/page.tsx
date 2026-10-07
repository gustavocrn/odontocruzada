"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { leadService } from '../../services/leadService';
import { FollowUpTask, TaskType, TaskStatus, TaskPriority, Lead } from '../../types';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  User,
  AlertCircle,
  X,
  Send,
  Building
} from 'lucide-react';

export default function TarefasPage() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'todas'>('todas');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('Ligar');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Média');

  const loadData = async () => {
    setLoading(true);
    const allTasks = await leadService.getTasks();
    const allLeads = await leadService.getLeads();
    setTasks(allTasks);
    setLeads(allLeads);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const leadObj = leads.find((l) => l.id === selectedLeadId);

    await leadService.createTask({
      leadId: selectedLeadId,
      leadName: leadObj?.name || 'Sem Lead Vinculado',
      type: taskType,
      date,
      time,
      description,
      priority,
      status: 'Pendente'
    });

    setIsModalOpen(false);
    setDescription('');
    loadData();
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'Pendente' ? 'Concluído' : 'Pendente';
    await leadService.updateTaskStatus(taskId, nextStatus);
    loadData();
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'todas' && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-navy-900 p-3 text-brand-300 shadow-md">
              <CalendarDays size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tarefas & Follow-ups</h1>
              <p className="text-xs text-slate-500">Gestão de pendências e retornos comerciais do corretor Gustavo Carneiro (CRECI 52321)</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 shadow-sm"
          >
            <Plus size={16} />
            <span>+ Nova Tarefa</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Status:</span>
            <div className="flex gap-1">
              {['todas', 'Pendente', 'Concluído', 'Cancelado'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    statusFilter === s
                      ? 'bg-navy-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'todas' ? 'Todas' : s}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
        </div>

        {/* Task List Cards */}
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-white shadow-2xs transition-all ${
                  t.status === 'Concluído' ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200/80 hover:border-brand-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleTaskStatus(t.id, t.status)}
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg border transition-colors ${
                      t.status === 'Concluído' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-brand-500'
                    }`}
                  >
                    {t.status === 'Concluído' && <CheckCircle2 size={16} />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{t.type}</span>
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                        {t.leadName}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          t.priority === 'Alta'
                            ? 'bg-rose-100 text-rose-800'
                            : t.priority === 'Média'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Prioridade {t.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{t.description}</p>
                    <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                      Agendado para: {t.date} às {t.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      t.status === 'Concluído'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              Nenhuma tarefa cadastrada com os filtros selecionados.
            </div>
          )}
        </div>

        {/* Modal Nova Tarefa */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Nova Tarefa / Follow-up</h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vincular a um Lead</label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                  >
                    <option value="">Nenhum lead selecionado</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} - ({l.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Tarefa</label>
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value as TaskType)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                    >
                      <option value="Retornar WhatsApp">Retornar WhatsApp</option>
                      <option value="Ligar">Ligar</option>
                      <option value="Verificar financiamento">Verificar financiamento</option>
                      <option value="Enviar opções">Enviar opções</option>
                      <option value="Agendar visita">Agendar visita</option>
                      <option value="Cobrar retorno">Cobrar retorno</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prioridade</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Horário</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Instruções para o retorno..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                  >
                    Salvar Tarefa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
