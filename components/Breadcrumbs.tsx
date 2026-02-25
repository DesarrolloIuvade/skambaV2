'use client';

import { ChevronRight, Home, Folder, List, Building2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { Workspace, Folder as FolderType, Lista } from '../lib/api';

interface BreadcrumbItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    isActive?: boolean;
}

export function Breadcrumbs() {
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

                case 'space': {
                    const space = selectedView.space;
                    items.push({
                        label: space.pro_nom,
                        icon: Building2,
                        isActive: true,
                        onClick: () => selectSpace(space, activeWorkspace?.pro_ide),
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

    if (breadcrumbItems.length <= 1) {
        return null; // No mostrar breadcrumbs si solo hay el workspace
    }

    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
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
        </nav>
    );
}