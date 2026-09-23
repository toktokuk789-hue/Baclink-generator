import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { BacklinksPage } from './pages/backlinks/BacklinksPage';
import { DomainsPage } from './pages/domains/DomainsPage';
import { OpportunitiesPage } from './pages/opportunities/OpportunitiesPage';
import { CompetitorsPage } from './pages/competitors/CompetitorsPage';
import { AgentCenterPage } from './pages/agents/AgentCenterPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { ChromeHubPage } from './pages/browser/ChromeHubPage';
import { OutreachPage } from './pages/outreach/OutreachPage';
import { MonitoringPage } from './pages/monitoring/MonitoringPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SiteExplorerPage } from './pages/site-explorer/SiteExplorerPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { SubmissionCenterPage } from './pages/submissions/SubmissionCenterPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="site-explorer" element={<SiteExplorerPage />} />
            <Route path="backlinks" element={<BacklinksPage />} />
            <Route path="domains" element={<DomainsPage />} />
            <Route path="competitors" element={<CompetitorsPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="submissions" element={<SubmissionCenterPage />} />
            <Route path="agent-center" element={<AgentCenterPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="chrome-hub" element={<ChromeHubPage />} />
            <Route path="outreach" element={<OutreachPage />} />
            <Route path="monitoring" element={<MonitoringPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}