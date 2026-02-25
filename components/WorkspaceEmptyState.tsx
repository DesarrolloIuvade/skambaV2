'use client';

import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { WorkspaceIcon } from './Icons';

export function WorkspaceEmptyState() {
    const { creatingWs, setCreatingWs, wsLoading, wsError, createWorkspace } = useDashboard();
    const [wsName, setWsName] = useState('');

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        const success = await createWorkspace(wsName);
        if (success) {
            setWsName('');
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                <WorkspaceIcon large />
            </div>
            <div>
                <p className="text-base font-semibold text-zinc-700 dark:text-zinc-200">Sin workspaces</p>
                <p className="text-sm text-zinc-400 mt-1">Crea tu primer workspace para empezar</p>
            </div>
            {!creatingWs ? (
                <button
                    onClick={() => setCreatingWs(true)}
                    className="rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                >
                    + Crear workspace
                </button>
            ) : (
                <form onSubmit={handleCreate} className="flex flex-col gap-3 w-full max-w-xs">
                    <input
                        autoFocus
                        type="text"
                        required
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        placeholder="Nombre del workspace"
                        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                    {wsError && <p className="text-xs text-red-500">{wsError}</p>}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={wsLoading}
                            className="flex-1 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {wsLoading ? 'Creando...' : 'Crear'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setCreatingWs(false); setWsName(''); }}
                            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
