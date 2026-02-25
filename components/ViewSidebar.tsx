'use client';

import { useState } from 'react';
import { List, LayoutGrid } from 'lucide-react';

type ViewMode = 'rows' | 'kanban';

interface ViewSidebarProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

export function ViewSidebar({ currentView, onViewChange }: ViewSidebarProps) {
    const viewOptions = [
        {
            id: 'rows' as ViewMode,
            label: 'Lista',
            icon: List,
            description: 'Vista en filas'
        },
        {
            id: 'kanban' as ViewMode,
            label: 'Tablero',
            icon: LayoutGrid,
            description: 'Vista kanban'
        }
    ];

    return (
        <aside className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0">
            {/* Header */}
            <div className="px-3 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vistas</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Elige cómo mostrar el contenido</p>
            </div>

            {/* View Options */}
            <div className="flex-1 px-3 py-4">
                <div className="space-y-2">
                    {viewOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => onViewChange(option.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-3 text-left text-sm font-medium rounded-lg transition-all ${currentView === option.id
                                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100 shadow-sm border border-indigo-200 dark:border-indigo-800'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border border-transparent'
                                }`}
                        >
                            <option.icon className={`w-5 h-5 ${currentView === option.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                                }`} />
                            <div className="flex-1">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                            </div>
                            {currentView === option.id && (
                                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}