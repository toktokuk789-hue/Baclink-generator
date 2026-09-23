import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';
import { QueryOptions } from '../shared/types';

export const api = {
  projects: {
    getAll: (options?: QueryOptions) => ipcRenderer.invoke(IPC.PROJECTS.GET_ALL, options),
    getById: (id: string) => ipcRenderer.invoke(IPC.PROJECTS.GET_BY_ID, id),
    create: (data: any) => ipcRenderer.invoke(IPC.PROJECTS.CREATE, data),
    update: (id: string, data: any) => ipcRenderer.invoke(IPC.PROJECTS.UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.PROJECTS.DELETE, id),
  },
  backlinks: {
    getByProject: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.BACKLINKS.GET_BY_PROJECT, projectId, options),
    create: (data: any) => ipcRenderer.invoke(IPC.BACKLINKS.CREATE, data),
    bulkCreate: (data: any[]) => ipcRenderer.invoke(IPC.BACKLINKS.BULK_CREATE, data),
    count: (projectId: string) => ipcRenderer.invoke(IPC.BACKLINKS.COUNT, projectId),
    getReferringDomains: (projectId: string) => ipcRenderer.invoke(IPC.BACKLINKS.GET_REFERRING_DOMAINS, projectId),
  },
  opportunities: {
    getByProject: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.OPPORTUNITIES.GET_BY_PROJECT, projectId, options),
    create: (data: any) => ipcRenderer.invoke(IPC.OPPORTUNITIES.CREATE, data),
    update: (id: string, data: any) => ipcRenderer.invoke(IPC.OPPORTUNITIES.UPDATE, id, data),
    countByStatus: (projectId: string) => ipcRenderer.invoke(IPC.OPPORTUNITIES.COUNT_BY_STATUS, projectId),
  },
  competitors: {
    getByProject: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.COMPETITORS.GET_BY_PROJECT, projectId, options),
    create: (data: any) => ipcRenderer.invoke(IPC.COMPETITORS.CREATE, data),
    update: (id: string, data: any) => ipcRenderer.invoke(IPC.COMPETITORS.UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.COMPETITORS.DELETE, id),
  },
  domains: {
    getByProject: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.DOMAINS.GET_BY_PROJECT, projectId, options),
    create: (data: any) => ipcRenderer.invoke(IPC.DOMAINS.CREATE, data),
    update: (id: string, data: any) => ipcRenderer.invoke(IPC.DOMAINS.UPDATE, id, data),
  },
  pages: {
    getByProject: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.PAGES.GET_BY_PROJECT, projectId, options),
    create: (data: any) => ipcRenderer.invoke(IPC.PAGES.CREATE, data),
  },
  agentTasks: {
    getByProject: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.AGENT_TASKS.GET_BY_PROJECT, projectId, options),
    create: (data: any) => ipcRenderer.invoke(IPC.AGENT_TASKS.CREATE, data),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke(IPC.AGENT_TASKS.UPDATE_STATUS, id, status),
    getPending: (projectId: string) => ipcRenderer.invoke(IPC.AGENT_TASKS.GET_PENDING, projectId),
  },
  approvals: {
    getByProject: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.APPROVALS.GET_BY_PROJECT, projectId, options),
    create: (data: any) => ipcRenderer.invoke(IPC.APPROVALS.CREATE, data),
    update: (id: string, status: string) => ipcRenderer.invoke(IPC.APPROVALS.UPDATE, id, status),
  },
  monitoring: {
    getByProject: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.MONITORING.GET_BY_PROJECT, projectId, options),
    getRecent: (projectId: string, limit?: number) => ipcRenderer.invoke(IPC.MONITORING.GET_RECENT, projectId, limit),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke(IPC.SETTINGS.GET, key),
    set: (key: string, value: any) => ipcRenderer.invoke(IPC.SETTINGS.SET, key, value),
    getAll: () => ipcRenderer.invoke(IPC.SETTINGS.GET_ALL),
  },
  browser: {
    connect: (options?: any) => ipcRenderer.invoke(IPC.BROWSER.CONNECT, options),
    disconnect: () => ipcRenderer.invoke(IPC.BROWSER.DISCONNECT),
    getStatus: () => ipcRenderer.invoke(IPC.BROWSER.GET_STATUS),
    openUrl: (url: string) => ipcRenderer.invoke(IPC.BROWSER.OPEN_URL, url),
    getPageContent: () => ipcRenderer.invoke(IPC.BROWSER.GET_PAGE_CONTENT),
  },
  agents: {
    start: (agentId: string) => ipcRenderer.invoke(IPC.AGENTS.START, agentId),
    stop: (agentId: string) => ipcRenderer.invoke(IPC.AGENTS.STOP, agentId),
    pause: (agentId: string) => ipcRenderer.invoke(IPC.AGENTS.PAUSE, agentId),
    resume: (agentId: string) => ipcRenderer.invoke(IPC.AGENTS.RESUME, agentId),
    getStatus: (agentId: string) => ipcRenderer.invoke(IPC.AGENTS.GET_STATUS, agentId),
  },
  crawler: {
    crawlSite: (url: string, options?: any) => ipcRenderer.invoke(IPC.CRAWLER.CRAWL_SITE, url, options),
    getProgress: (taskId: string) => ipcRenderer.invoke(IPC.CRAWLER.GET_PROGRESS, taskId),
    stop: (taskId: string) => ipcRenderer.invoke(IPC.CRAWLER.STOP, taskId),
  },
  providers: {
    getAll: () => ipcRenderer.invoke(IPC.PROVIDERS.GET_ALL),
    configure: (providerId: string, config: any) => ipcRenderer.invoke(IPC.PROVIDERS.CONFIGURE, providerId, config),
    test: (providerId: string) => ipcRenderer.invoke(IPC.PROVIDERS.TEST, providerId),
    getStatus: (providerId: string) => ipcRenderer.invoke(IPC.PROVIDERS.GET_STATUS, providerId),
    testGroq: (apiKey: string, model?: string) => ipcRenderer.invoke(IPC.PROVIDERS.TEST_GROQ, apiKey, model),
    testOpenRouter: (apiKey: string, model?: string) => ipcRenderer.invoke(IPC.PROVIDERS.TEST_OPENROUTER, apiKey, model),
  },
  import: {
    csv: (filePath: string, mapping?: any) => ipcRenderer.invoke(IPC.IMPORT.CSV, filePath, mapping),
    preview: (filePath: string) => ipcRenderer.invoke(IPC.IMPORT.PREVIEW, filePath),
  },
  export: {
    csv: (projectId: string, entityType: string) => ipcRenderer.invoke(IPC.EXPORT.CSV, projectId, entityType),
    json: (projectId: string, entityType: string) => ipcRenderer.invoke(IPC.EXPORT.JSON, projectId, entityType),
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IPC.APP.GET_VERSION),
    getPlatform: () => ipcRenderer.invoke(IPC.APP.GET_PLATFORM),
    getTheme: () => ipcRenderer.invoke(IPC.APP.GET_THEME),
    setTheme: (theme: 'light' | 'dark' | 'system') => ipcRenderer.invoke(IPC.APP.SET_THEME, theme),
    minimize: () => ipcRenderer.invoke(IPC.APP.MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC.APP.MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC.APP.CLOSE),
    isMaximized: () => ipcRenderer.invoke(IPC.APP.IS_MAXIMIZED),
  },
  submissions: {
    getProfile: (projectId: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.GET_PROFILE, projectId),
    saveProfile: (projectId: string, data: any) => ipcRenderer.invoke(IPC.SUBMISSIONS.SAVE_PROFILE, projectId, data),
    getTargets: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.SUBMISSIONS.GET_TARGETS, projectId, options),
    discoverTargets: (projectId: string, options?: any) => ipcRenderer.invoke(IPC.SUBMISSIONS.DISCOVER_TARGETS, projectId, options),
    qualifyTargets: (projectId: string, targetIds?: string[]) => ipcRenderer.invoke(IPC.SUBMISSIONS.QUALIFY_TARGETS, projectId, targetIds),
    prepareSubmission: (targetId: string, profileId?: string, assetId?: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.PREPARE_SUBMISSION, targetId, profileId, assetId),
    executeSubmission: (targetId: string, options?: any) => ipcRenderer.invoke(IPC.SUBMISSIONS.EXECUTE_SUBMISSION, targetId, options),
    resumeAfterHuman: (attemptId: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.RESUME_AFTER_HUMAN, attemptId),
    verifyTarget: (targetId: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.VERIFY_TARGET, targetId),
    verifyAll: (projectId: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.VERIFY_ALL, projectId),
    getStats: (projectId: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.GET_STATS, projectId),
    getCampaigns: (projectId: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.GET_CAMPAIGNS, projectId),
    createCampaign: (data: any) => ipcRenderer.invoke(IPC.SUBMISSIONS.CREATE_CAMPAIGN, data),
    updateCampaign: (id: string, data: any) => ipcRenderer.invoke(IPC.SUBMISSIONS.UPDATE_CAMPAIGN, id, data),
    getAttempts: (targetId?: string, projectId?: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.GET_ATTEMPTS, targetId, projectId),
    bulkQueue: (projectId: string, targetIds: string[], policy?: string) => ipcRenderer.invoke(IPC.SUBMISSIONS.BULK_QUEUE, projectId, targetIds, policy),
  },
  assets: {
    getAll: (projectId: string, options?: QueryOptions) => ipcRenderer.invoke(IPC.ASSETS.GET_ALL, projectId, options),
    create: (data: any) => ipcRenderer.invoke(IPC.ASSETS.CREATE, data),
    analyzePdf: (filePath: string) => ipcRenderer.invoke(IPC.ASSETS.ANALYZE_PDF, filePath),
    generateBrief: (projectId: string, options: any) => ipcRenderer.invoke(IPC.ASSETS.GENERATE_BRIEF, projectId, options),
    delete: (id: string) => ipcRenderer.invoke(IPC.ASSETS.DELETE, id),
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
