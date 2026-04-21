'use client';

import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { DashboardHeader } from '../../components/DashboardHeader';
import { Sidebar } from '../../components/Sidebar';
import { NavigationBar } from '../../components/NavigationBar';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { selectedView, viewMode, setViewMode } = useDashboard();

    // WARNING FOR FUTURE EDITS / LLMs:
    // This layout is intentionally the persistent dashboard shell.
    // The Sidebar must stay mounted here so changing workspace/project/view
    // only swaps the main content and does not remount or fully reload
    // the sidebar state (open nodes, cached selections, local UI state).
    // Do not move <Sidebar /> into page-level components and do not key this
    // shell by pathname, selectedView, workspace, or project identifiers.
    // If navigation behavior changes, preserve this persistent mounting model.

    // Mostrar NavigationBar en vistas de space, folder y list
    const showNavigationBar = selectedView?.type === 'space' || selectedView?.type === 'folder' || selectedView?.type === 'list';
    const showViewControls = selectedView?.type === 'list';

    return (
        <div className="flex flex-col h-screen bg-zinc-100 dark:bg-zinc-950">
            <DashboardHeader />
            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Sidebar />
                <div className="flex flex-col flex-1 min-w-0">
                    {showNavigationBar && (
                        <NavigationBar
                            showViewControls={showViewControls}
                            currentView={viewMode}
                            onViewChange={setViewMode}
                        />
                    )}
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        // WARNING FOR FUTURE EDITS / LLMs:
        // DashboardProvider lives at layout level on purpose so dashboard
        // navigation keeps shared state alive across page/content changes.
        <DashboardProvider>
            <DashboardContent>{children}</DashboardContent>
        </DashboardProvider>
    );
}
