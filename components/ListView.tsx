'use client';

import { Lista } from '../lib/api';
import { KanbanBoard } from './KanbanBoard';
import { RowView } from './RowView';
import { useDashboard } from '../context/DashboardContext';

interface ListViewProps {
    lista: Lista;
    onRefresh?: () => void;
}

export function ListView({ lista, onRefresh }: ListViewProps) {
    const { viewMode } = useDashboard();

    return (
        <div className="p-6 h-full flex flex-col">
            {/* View content */}
            <div className="flex-1 min-h-0 overflow-auto">
                {viewMode === 'rows' ? (
                    <RowView lista={lista} onRefresh={onRefresh} />
                ) : (
                    <KanbanBoard lista={lista} onRefresh={onRefresh} />
                )}
            </div>
        </div>
    );
}
