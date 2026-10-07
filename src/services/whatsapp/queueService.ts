import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { WebhookQueueJob } from './types';
import { SupabaseClient } from '@supabase/supabase-js';
import { leadService } from '../leadService';

// Fallback em memória para testes offline e execução local
let localQueueJobs: WebhookQueueJob[] = [];

export function clearLocalQueueJobsForTest(): void {
  localQueueJobs = [];
}

export function getLocalQueueJobsForTest(): WebhookQueueJob[] {
  return [...localQueueJobs];
}

/**
 * Enfileira um trabalho assíncrono na webhook_queue vinculado ao conversation_message_id.
 * Garante unicidade composta por (conversation_message_id, job_type).
 */
export async function enqueueWebhookJob(
  conversationMessageId: string,
  jobType: 'process_inbound_sdr' | 'send_outbound_whatsapp' | 'handle_status_update',
  client?: SupabaseClient | null
): Promise<WebhookQueueJob | null> {
  const db = client || supabase;
  const now = new Date().toISOString();

  // Verificação de Unicidade Composta em modo local/fallback
  if (!isSupabaseConfigured() || !db) {
    const existing = localQueueJobs.find(
      (j) => j.conversationMessageId === conversationMessageId && j.jobType === jobType
    );
    if (existing) {
      return null; // Bloqueia duplicação de job
    }
    const newJob: WebhookQueueJob = {
      id: crypto.randomUUID(),
      conversationMessageId,
      jobType,
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      availableAt: now,
      createdAt: now
    };
    localQueueJobs.push(newJob);
    return newJob;
  }

  const newJobId = crypto.randomUUID();
  const { data, error } = await db
    .from('webhook_queue')
    .insert([
      {
        id: newJobId,
        conversation_message_id: conversationMessageId,
        job_type: jobType,
        status: 'pending',
        retry_count: 0,
        max_retries: 5,
        available_at: now
      }
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('uq_webhook_queue_msg_job')) {
      // Rejeitado por UNIQUE constraint no PostgreSQL (conversation_message_id, job_type)
      return null;
    }
    console.error('Erro ao enfileirar job na webhook_queue:', error);
    // Fallback local se falhar por conectividade
    const existing = localQueueJobs.find(
      (j) => j.conversationMessageId === conversationMessageId && j.jobType === jobType
    );
    if (existing) return null;
    const fallbackJob: WebhookQueueJob = {
      id: newJobId,
      conversationMessageId,
      jobType,
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      availableAt: now,
      createdAt: now
    };
    localQueueJobs.push(fallbackJob);
    return fallbackJob;
  }

  return {
    id: data.id,
    conversationMessageId: data.conversation_message_id,
    jobType: data.job_type,
    status: data.status,
    retryCount: data.retry_count,
    maxRetries: data.max_retries || 5,
    availableAt: data.available_at,
    lockedAt: data.locked_at,
    lockedBy: data.locked_by,
    processedAt: data.processed_at,
    lastErrorCode: data.last_error_code,
    lastErrorMessage: data.last_error_message,
    createdAt: data.created_at
  };
}

/**
 * Realiza o Claim Atômico dos próximos jobs disponíveis na fila.
 * Reutiliza FOR UPDATE SKIP LOCKED via RPC no Supabase e concorrência segura em memória para local/teste.
 */
export async function claimWebhookJobs(
  workerId: string,
  batchSize: number = 1,
  lockTimeoutSeconds: number = 300,
  client?: SupabaseClient | null
): Promise<WebhookQueueJob[]> {
  const db = client || supabase;
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (!isSupabaseConfigured() || !db) {
    const claimed: WebhookQueueJob[] = [];
    for (const job of localQueueJobs) {
      if (claimed.length >= batchSize) break;

      const isPending = job.status === 'pending' && new Date(job.availableAt).getTime() <= nowMs;
      const isLockExpired =
        job.status === 'processing' &&
        job.lockedAt &&
        nowMs - new Date(job.lockedAt).getTime() > lockTimeoutSeconds * 1000;

      if (isPending || isLockExpired) {
        job.status = 'processing';
        job.lockedAt = nowIso;
        job.lockedBy = workerId;
        claimed.push({ ...job });
      }
    }
    return claimed;
  }

  // Tenta invocar a função RPC claim_webhook_jobs no PostgreSQL
  const { data, error } = await db.rpc('claim_webhook_jobs', {
    p_worker_id: workerId,
    p_batch_size: batchSize,
    p_lock_timeout_seconds: lockTimeoutSeconds
  });

  if (error) {
    console.error('Erro na RPC claim_webhook_jobs do Supabase:', error);
    // Fallback local caso a RPC ainda não esteja disponível no banco
    const claimed: WebhookQueueJob[] = [];
    for (const job of localQueueJobs) {
      if (claimed.length >= batchSize) break;
      const isPending = job.status === 'pending' && new Date(job.availableAt).getTime() <= nowMs;
      if (isPending) {
        job.status = 'processing';
        job.lockedAt = nowIso;
        job.lockedBy = workerId;
        claimed.push({ ...job });
      }
    }
    return claimed;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    conversationMessageId: row.conversation_message_id,
    jobType: row.job_type,
    status: row.status,
    retryCount: row.retry_count,
    maxRetries: row.max_retries || 5,
    availableAt: row.available_at,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by,
    processedAt: row.processed_at,
    lastErrorCode: row.last_error_code,
    lastErrorMessage: row.last_error_message,
    createdAt: row.created_at
  }));
}

/**
 * Conclui um trabalho com sucesso.
 */
export async function completeWebhookJob(
  jobId: string,
  client?: SupabaseClient | null
): Promise<boolean> {
  const db = client || supabase;
  const now = new Date().toISOString();

  const localIndex = localQueueJobs.findIndex((j) => j.id === jobId);
  if (localIndex !== -1) {
    localQueueJobs[localIndex].status = 'completed';
    localQueueJobs[localIndex].processedAt = now;
    localQueueJobs[localIndex].lockedAt = null;
    localQueueJobs[localIndex].lockedBy = null;
  }

  if (isSupabaseConfigured() && db) {
    const { error } = await db
      .from('webhook_queue')
      .update({
        status: 'completed',
        processed_at: now,
        locked_at: null,
        locked_by: null
      })
      .eq('id', jobId);

    if (error) {
      console.error('Erro ao concluir job no Supabase:', error);
    }
  }

  return true;
}

/**
 * Registra falha de um trabalho, aplicando Exponential Backoff ou movendo para Dead Letter.
 */
export async function failWebhookJob(
  jobId: string,
  errorCode: string,
  errorMessage: string,
  backoffSeconds: number = 10,
  leadIdForAlert?: string,
  client?: SupabaseClient | null
): Promise<WebhookQueueJob | null> {
  const db = client || supabase;

  let currentJob: WebhookQueueJob | null = null;
  const localIndex = localQueueJobs.findIndex((j) => j.id === jobId);
  if (localIndex !== -1) {
    currentJob = localQueueJobs[localIndex];
  }

  if (isSupabaseConfigured() && db) {
    const { data } = await db.from('webhook_queue').select('*').eq('id', jobId).single();
    if (data) {
      currentJob = {
        id: data.id,
        conversationMessageId: data.conversation_message_id,
        jobType: data.job_type,
        status: data.status,
        retryCount: data.retry_count,
        maxRetries: data.max_retries || 5,
        availableAt: data.available_at,
        lockedAt: data.locked_at,
        lockedBy: data.locked_by,
        processedAt: data.processed_at,
        lastErrorCode: data.last_error_code,
        lastErrorMessage: data.last_error_message,
        createdAt: data.created_at
      };
    }
  }

  if (!currentJob) return null;

  const newRetryCount = currentJob.retryCount + 1;
  const maxRetries = currentJob.maxRetries || 5;

  if (newRetryCount >= maxRetries) {
    // Mover para Dead Letter e gerar alerta/tarefa de alta prioridade
    const deadLetterJob: WebhookQueueJob = {
      ...currentJob,
      status: 'dead_letter',
      retryCount: newRetryCount,
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage
    };

    if (localIndex !== -1) {
      localQueueJobs[localIndex] = deadLetterJob;
    }

    if (isSupabaseConfigured() && db) {
      await db
        .from('webhook_queue')
        .update({
          status: 'dead_letter',
          retry_count: newRetryCount,
          locked_at: null,
          locked_by: null,
          last_error_code: errorCode,
          last_error_message: errorMessage
        })
        .eq('id', jobId);
    }

    // Criar alerta / tarefa de alta prioridade para o Gustavo
    if (leadIdForAlert) {
      await leadService.createTask({
        leadId: leadIdForAlert,
        leadName: 'Lead WhatsApp',
        type: 'Alerta de Ingestão WhatsApp',
        description: `🚨 Job da webhook_queue entrou em DEAD_LETTER após ${maxRetries} tentativas. Erro: [${errorCode}] ${errorMessage}`,
        dueAt: new Date().toISOString()
      }, client);
    }

    return deadLetterJob;
  }

  // Backoff exponencial: disponivel em NOW + backoffSeconds
  const nextAvailable = new Date(Date.now() + backoffSeconds * 1000).toISOString();
  const retriedJob: WebhookQueueJob = {
    ...currentJob,
    status: 'pending',
    retryCount: newRetryCount,
    availableAt: nextAvailable,
    lockedAt: null,
    lockedBy: null,
    lastErrorCode: errorCode,
    lastErrorMessage: errorMessage
  };

  if (localIndex !== -1) {
    localQueueJobs[localIndex] = retriedJob;
  }

  if (isSupabaseConfigured() && db) {
    await db
      .from('webhook_queue')
      .update({
        status: 'pending',
        retry_count: newRetryCount,
        available_at: nextAvailable,
        locked_at: null,
        locked_by: null,
        last_error_code: errorCode,
        last_error_message: errorMessage
      })
      .eq('id', jobId);
  }

  return retriedJob;
}
