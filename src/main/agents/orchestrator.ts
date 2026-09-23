import {
  AgentTask,
  CreateAgentTask,
  AgentTaskStatus,
  AgentType,
  AgentEvent
} from '../../shared/types';
import { AgentTaskRepository } from '../database/repositories/agent-tasks';
import crypto from 'crypto';

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private taskRepo: AgentTaskRepository;
  private activeWorkers = new Map<string, boolean>();

  private constructor() {
    this.taskRepo = new AgentTaskRepository();
  }

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  /**
   * Enqueues a new autonomous agent task
   */
  public enqueueTask(task: CreateAgentTask): AgentTask {
    const created = this.taskRepo.create({
      ...task,
      status: 'queued',
      retry_count: 0,
      cost: 0,
    });

    this.logEvent(created.id, created.agent_type, 'TASK_ENQUEUED', `Task queued: ${created.objective}`);
    return created;
  }

  /**
   * Starts or resumes processing of queued tasks for a project
   */
  public async processNextTask(projectId: string): Promise<AgentTask | null> {
    const pending = this.taskRepo.findPending();
    const projectTask = pending.find(t => t.project_id === projectId);

    if (!projectTask) return null;

    // Check if dependencies are satisfied
    if (projectTask.dependencies) {
      try {
        const depIds = JSON.parse(projectTask.dependencies) as string[];
        for (const depId of depIds) {
          const dep = this.taskRepo.findById(depId);
          if (!dep || dep.status !== 'completed') {
            this.taskRepo.updateStatus(projectTask.id, 'waiting');
            return projectTask;
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    // Set to running
    this.taskRepo.updateStatus(projectTask.id, 'running');
    this.logEvent(projectTask.id, projectTask.agent_type, 'TASK_STARTED', `Execution started for task ${projectTask.id}`);

    return this.taskRepo.findById(projectTask.id) || null;
  }

  public completeTask(taskId: string, outputs?: any): void {
    const task = this.taskRepo.findById(taskId);
    if (!task) return;

    this.taskRepo.update(taskId, {
      status: 'completed',
      outputs: outputs ? JSON.stringify(outputs) : null,
      completed_at: new Date().toISOString(),
    });

    this.logEvent(taskId, task.agent_type, 'TASK_COMPLETED', `Task completed successfully`);
  }

  public failTask(taskId: string, error: string): void {
    const task = this.taskRepo.findById(taskId);
    if (!task) return;

    const newRetryCount = (task.retry_count || 0) + 1;
    if (newRetryCount <= task.max_retries) {
      this.taskRepo.update(taskId, {
        retry_count: newRetryCount,
        status: 'queued',
        error_message: `Retry ${newRetryCount}/${task.max_retries}: ${error}`,
      });
      this.logEvent(taskId, task.agent_type, 'TASK_RETRYING', `Task failed, scheduling retry (${newRetryCount}/${task.max_retries})`);
    } else {
      this.taskRepo.updateStatus(taskId, 'failed', error);
      this.logEvent(taskId, task.agent_type, 'TASK_FAILED', `Task permanently failed: ${error}`);
    }
  }

  public pauseTask(taskId: string): void {
    this.taskRepo.updateStatus(taskId, 'paused');
  }

  public cancelTask(taskId: string): void {
    this.taskRepo.updateStatus(taskId, 'cancelled');
  }

  public logEvent(taskId: string, agentType: string, eventType: string, message: string, data?: any): void {
    try {
      this.taskRepo.addEvent(taskId, {
        id: crypto.randomUUID(),
        task_id: taskId,
        agent_type: agentType,
        event_type: eventType,
        message,
        data: data ? JSON.stringify(data) : null,
      });
    } catch (e) {
      console.error('Failed to record agent event:', e);
    }
  }
}
