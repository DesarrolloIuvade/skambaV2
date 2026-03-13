'use client';

import { useState } from 'react';
import { ChevronRight, Home, Folder, List, Building2, Pencil, Trash2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

interface BreadcrumbItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    isActive?: boolean;
    pro_ide?: string;
}

export function Breadcrumbs() {
    const { selectedView, selectWorkspace, selectSpace, selectFolder, activeWorkspace, renameItem, deleteItem } = useDashboard();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const getBreadcrumbItems = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [];

        if (activeWorkspace) {
            items.push({
                label: activeWorkspace.pro_nom,
                icon: Home,
                onClick: () => selectWorkspace(activeWorkspace),
                isActive: selectedView?.type === 'workspace',
                pro_ide: activeWorkspace.pro_ide,
            });
        }

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
                            pro_ide: parentSpace.pro_ide,
                        });
                    }
                    items.push({
                        label: selectedView.folder.pro_nom,
                        icon: Folder,
                        isActive: true,
                        pro_ide: selectedView.folder.pro_ide,
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
                        pro_ide: space.pro_ide,
                    });
                    break;
                }

                case 'list': {
                    // Find if it's in a folder or direct in a space
                    let parentFolder: any = null;
                    let parentSpace = activeWorkspace?.spaces?.find((s) => {
                        // Check if it's direct in space
                        if ((s.contenido?.listas ?? []).some(l => l.pro_ide === selectedView.lista.pro_ide)) {
                            return true;
                        }
                        // Check if it's in a folder
                        const folder = (s.contenido?.folders ?? []).find(f =>
                            f.listas.some(lista => lista.pro_ide === selectedView.lista.pro_ide)
                        );
                        if (folder) {
                            parentFolder = folder;
                            return true;
                        }
                        return false;
                    });

                    if (parentSpace) {
                        items.push({
                            label: parentSpace.pro_nom,
                            icon: Building2,
                            onClick: () => selectSpace(parentSpace, activeWorkspace?.pro_ide),
                            pro_ide: parentSpace.pro_ide,
                        });
                    }

                    if (parentFolder) {
                        items.push({
                            label: parentFolder.pro_nom,
                            icon: Folder,
                            onClick: () => selectFolder(parentFolder),
                            pro_ide: parentFolder.pro_ide,
                        });
                    }

                    items.push({
                        label: selectedView.lista.pro_nom,
                        icon: List,
                        isActive: true,
                        pro_ide: selectedView.lista.pro_ide,
                    });
                    break;
                }
            }
        }

        return items;
    };

    const breadcrumbItems = getBreadcrumbItems();
    const activeItem = breadcrumbItems.find(i => i.isActive);

    async function handleRename() {
        if (!activeItem?.pro_ide || !editValue.trim() || editValue.trim() === activeItem.label) {
            setIsEditing(false);
            return;
        }
        await renameItem(activeItem.pro_ide, editValue.trim());
        setIsEditing(false);
    }

    async function handleDelete() {
        if (!activeItem?.pro_ide) return;
        if (window.confirm(`¿Eliminar "${activeItem.label}"? Esta acción eliminará todo su contenido.`)) {
            await deleteItem(activeItem.pro_ide);
        }
    }

    if (breadcrumbItems.length <= 1) {
        return null;
    }

    return (
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                    {index > 0 && (
                        <ChevronRight className="w-4 h-4 mx-2 text-gray-400 shrink-0" />
                    )}

                    <div className="flex items-center gap-0.5">
                        {item.isActive && isEditing ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20">
                                <item.icon className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <input
                                    autoFocus
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleRename();
                                        if (e.key === 'Escape') setIsEditing(false);
                                    }}
                                    onBlur={handleRename}
                                    className="text-sm font-medium bg-transparent border-b border-indigo-400 outline-none min-w-0 w-32 text-indigo-600 dark:text-indigo-400"
                                />
                            </div>
                        ) : (
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
                        )}

                        {item.isActive && !isEditing && (
                            <div className="flex items-center gap-0.5 ml-0.5">
                                <button
                                    onClick={() => { setEditValue(item.label); setIsEditing(true); }}
                                    title="Renombrar"
                                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    title="Eliminar"
                                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </nav>
    );
}
