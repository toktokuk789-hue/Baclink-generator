import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, EmptyState } from '../../components/ui';
import { FolderKanban, Link as LinkIcon, Lightbulb, CheckSquare, Plus } from 'lucide-react';

export function DashboardPage() {
  const projects = []; // Fetch from API soon

  if (projects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <EmptyState 
          icon={<FolderKanban size={48} />}
          title="No projects yet"
          description="Create your first project to start analyzing backlinks and identifying opportunities."
          actionLabel="Create Project"
          onAction={() => console.log('Create project...')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button iconLeft={<Plus size={16} />}>New Project</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-[var(--text-muted)]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">4</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Total Backlinks</CardTitle>
            <LinkIcon className="h-4 w-4 text-[var(--text-muted)]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">12,450</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Opportunities</CardTitle>
            <Lightbulb className="h-4 w-4 text-[var(--text-muted)]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-[var(--success)]">142</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-[var(--text-muted)]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">8</div></CardContent>
        </Card>
      </div>
    </div>
  );
}