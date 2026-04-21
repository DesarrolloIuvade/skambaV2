'use client';

import { useDashboard } from '../../context/DashboardContext';
import { ListView } from '../../components/ListView';
import { WorkspaceView } from '../../components/WorkspaceView';
import { SpaceView } from '../../components/SpaceView';
import { FolderView } from '../../components/FolderView';
import { GrupoView } from '../../components/GrupoView';
import { WorkspaceEmptyState } from '../../components/WorkspaceEmptyState';

export default function DashboardPage() {
  const { workspaces, groupWorkspaces, loading, selectedView, selectFolder, selectLista, activeWorkspace, loadProyectos } = useDashboard();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-zinc-400 text-sm">Cargando...</p>
      </div>
    );
  }

  if (workspaces.length === 0 && groupWorkspaces.length === 0) {
    return <WorkspaceEmptyState />;
  }

  if (!selectedView) {
    // Default: show workspace overview if one is active, otherwise prompt
    if (activeWorkspace) {
      return (
        <WorkspaceView
          workspace={activeWorkspace}
          onSelectList={selectLista}
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Selecciona un workspace</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Elige un workspace del menú lateral para comenzar</p>
        </div>
      </div>
    );
  }

  switch (selectedView.type) {
    case 'workspace':
      return (
        <WorkspaceView
          workspace={selectedView.workspace}
          onSelectList={selectLista}
        />
      );
    case 'space':
      return (
        <SpaceView
          space={selectedView.space}
          onSelectFolder={selectFolder}
          onSelectList={selectLista}
        />
      );
    case 'folder':
      return (
        <FolderView
          folder={selectedView.folder}
          onSelectList={selectLista}
        />
      );
    case 'list':
      return (
        <ListView
          key={selectedView.lista.pro_ide}
          lista={selectedView.lista}
          onRefresh={loadProyectos}
        />
      );
    case 'group':
      return <GrupoView grupo={selectedView.grupo} />;
  }
}
