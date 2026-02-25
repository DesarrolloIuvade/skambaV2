'use client';

import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { DashboardHeader } from '../../components/DashboardHeader';
import { Sidebar } from '../../components/Sidebar';
import { NavigationBar } from '../../components/NavigationBar';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { selectedView, viewMode, setViewMode } = useDashboard();

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
        <DashboardProvider>
            <DashboardContent>{children}</DashboardContent>
        </DashboardProvider>
    );
}
