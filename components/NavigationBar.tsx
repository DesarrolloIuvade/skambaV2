'use client';

import { ChevronRight, Home, Folder, List, LayoutGrid, Building2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { ViewMode } from '../context/DashboardContext';

interface BreadcrumbItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    isActive?: boolean;
}

interface NavigationBarProps {
    showViewControls?: boolean;
    currentView?: ViewMode;
    onViewChange?: (view: ViewMode) => void;
}

export function NavigationBar({ showViewControls = false, currentView, onViewChange }: NavigationBarProps) {
    const { selectedView, selectWorkspace, selectSpace, selectFolder, activeWorkspace } = useDashboard();

    const getBreadcrumbItems = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [];

        // Siempre mostrar el workspace activo como primer elemento
        if (activeWorkspace) {
            items.push({
                label: activeWorkspace.pro_nom,
                icon: Home,
                onClick: () => selectWorkspace(activeWorkspace),
                isActive: selectedView?.type === 'workspace'
            });
        }

        // Agregar elementos según la vista actual
        if (selectedView) {
            switch (selectedView.type) {
                case 'folder': {
                    const parentSpace = activeWorkspace?.spaces?.find((s) =>
                        (s.contenido?.folders ?? []).some((f) => f.pro_ide === selectedView.folder.pro_ide)
                    );
                    if (parentSpace) {
                        items.push({
                            label: parentSpace.pro_nom,
                            icon: Building2,
                            onClick: () => selectSpace(parentSpace, activeWorkspace?.pro_ide),
                        });
                    }
                    items.push({
                        label: selectedView.folder.pro_nom,
                        icon: Folder,
                        isActive: true
                    });
                    break;
                }

                case 'list': {
                    const parentFolder = activeWorkspace?.folders.find(folder =>
                        folder.listas.some(lista => lista.pro_ide === selectedView.lista.pro_ide)
                    );

                    if (parentFolder) {
                        const parentSpace = activeWorkspace?.spaces?.find((s) =>
                            (s.contenido?.folders ?? []).some((f) => f.pro_ide === parentFolder.pro_ide)
                        );
                        if (parentSpace) {
                            items.push({
                                label: parentSpace.pro_nom,
                                icon: Building2,
                                onClick: () => selectSpace(parentSpace, activeWorkspace?.pro_ide),
                            });
                        }
                        items.push({
                            label: parentFolder.pro_nom,
                            icon: Folder,
                            onClick: () => selectFolder(parentFolder)
                        });
                    }

                    items.push({
                        label: selectedView.lista.pro_nom,
                        icon: List,
                        isActive: true
                    });
                    break;
                }
            }
        }

        return items;
    };

    const breadcrumbItems = getBreadcrumbItems();

    return (
        <nav className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            {/* Breadcrumbs */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                {breadcrumbItems.map((item, index) => (
                    <div key={index} className="flex items-center">
                        {index > 0 && (
                            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        )}

                        <button
                            onClick={item.onClick}
                            disabled={!item.onClick || item.isActive}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${item.isActive
                                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                : item.onClick
                                    ? 'hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    : 'cursor-default'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* View Controls */}
            {showViewControls && currentView && onViewChange && (
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">Vista:</span>
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                        <button
                            onClick={() => onViewChange('rows')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${currentView === 'rows'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <List className="w-3.5 h-3.5" />
                            Lista
                        </button>
                        <button
                            onClick={() => onViewChange('kanban')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${currentView === 'kanban'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Tablero
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}