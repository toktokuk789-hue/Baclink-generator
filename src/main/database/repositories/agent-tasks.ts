import crypto from 'crypto';
import { BaseRepository } from './index';

export interface AgentTask {
  id: string;
  project_id: string;
  agent_type: string;
  objective: string;
  priority?: number;
  dependencies?: string;
  inputs?: string;
  outputs?: string;
  status?: 'queued' | 'running' | 'waiting' | 'waiting_for_approval' | 'paused' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  retry_count?: number;
  max_retries?: number;
  timeout_seconds?: number;
  provider?: string;
  cost?: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgentEvent {
  id: string;
  task_id: string;
  agent_type: string;
  event_type: string;
  message?: string;
  data?: string;
  timestamp?: string;
}

export class AgentTaskRepository extends BaseRepository<AgentTask> {
  constructor() {
    super('agent_tasks');
  }

  public findByProject(projectId: string, opts?: { status?: string }): AgentTask[] {
    let query = 'SELECT * FROM agent_tasks WHERE project_id = ?';
    const values: any[] = [projectId];

    if (opts?.status) {
      query += ' AND status = ?';
      values.push(opts.status);
    }

    query += ' ORDER BY priority DESC, created_at ASC';
    return this.db.prepare(query).all(...values) as AgentTask[];
  }

  // create is inherited

  public updateStatus(id: string, status: AgentTask['status'], error?: string): AgentTask | undefined {
    const updateData: Partial<AgentTask> = { status };
    if (error !== undefined) {
      updateData.error_message = error;
    }
    if (status === 'running') {
      updateData.started_at = new Date().toISOString();
    } else if (['completed', 'failed', 'cancelled'].includes(status as string)) {
      updateData.completed_at = new Date().toISOString();
    }
    
    return this.update(id, updateData);
  }

  public findPending(): AgentTask[] {
    return this.db.prepare("SELECT * FROM agent_tasks WHERE status = 'queued' ORDER BY priority DESC, created_at ASC").all() as AgentTask[];
  }

  public findRunning(): AgentTask[] {
    return this.db.prepare("SELECT * FROM agent_tasks WHERE status = 'running'").all() as AgentTask[];
  }

  public addEvent(taskId: string, event: Omit<AgentEvent, 'id' | 'task_id'>): void {
    const id = crypto.randomUUID();
    this.db.prepare(
      'INSERT INTO agent_events (id, task_id, agent_type, event_type, message, data) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, taskId, event.agent_type, event.event_type, event.message || null, event.data || null);
  }

  public getEvents(taskId: string): AgentEvent[] {
    return this.db.prepare('SELECT * FROM agent_events WHERE task_id = ? ORDER BY timestamp ASC').all(taskId) as AgentEvent[];
  }
}
