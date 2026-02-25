'use client';

import { useState } from 'react';
import { List, LayoutGrid } from 'lucide-react';

type ViewMode = 'rows' | 'kanban';

interface ViewNavigationProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
    className?: string;
}

export function ViewNavigation({ currentView, onViewChange, className = '' }: ViewNavigationProps) {
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
        <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 ${className}`}>
            <div className="space-y-1">
                {viewOptions.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onViewChange(option.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-sm font-medium rounded-md transition-all ${currentView === option.id
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <option.icon className={`w-4 h-4 ${currentView === option.id ? 'text-indigo-600 dark:text-indigo-400' : ''
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
    );
}