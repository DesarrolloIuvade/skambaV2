'use client';

import { useState } from 'react';
import { Space, Folder, Lista } from '../lib/api';
import { ListSection } from './FolderView';

interface SpaceViewProps {
    space: Space;
    onSelectFolder: (folder: Folder) => void;
    onSelectList: (lista: Lista) => void;
}

function FolderSection({
    folder,
    onSelectFolder,
    onSelectList,
}: {
    folder: Folder;
    onSelectFolder: () => void;
    onSelectList: (lista: Lista) => void;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const totalTasks = folder.listas.reduce((a, l) => a + l.tareas.length, 0);

    return (
        <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {/* Folder header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                <button
                    onClick={() => setIsOpen(v => !v)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                    <svg
                        className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{folder.pro_nom}</span>
                    <span className="ml-1 text-xs text-zinc-400 shrink-0">
                        {folder.listas.length} lista{folder.listas.length !== 1 ? 's' : ''} &middot; {totalTasks} tarea{totalTasks !== 1 ? 's' : ''}
                    </span>
                </button>
                <button
                    onClick={onSelectFolder}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                >
                    Abrir →
                </button>
            </div>

            {/* Lists inside folder */}
            {isOpen && (
                <div className="p-3 space-y-3">
                    {folder.listas.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-zinc-400 italic">Sin listas en esta carpeta</p>
                    ) : (
                        folder.listas.map(lista => (
                            <ListSection
                                key={lista.pro_ide}
                                lista={lista}
                                onSelectList={() => onSelectList(lista)}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export function SpaceView({ space, onSelectFolder, onSelectList }: SpaceViewProps) {
    const folders = space.contenido?.folders ?? [];
    const listas = space.contenido?.listas ?? [];
    const totalTasks = [
        ...listas,
        ...folders.flatMap(f => f.listas),
    ].reduce((a, l) => a + l.tareas.length, 0);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-zinc-900 dark:text-white">{space.pro_nom}</h1>
                        <p className="text-xs text-zinc-400">
                            {folders.length} carpeta{folders.length !== 1 ? 's' : ''} &middot;{' '}
                            {listas.length} lista{listas.length !== 1 ? 's' : ''} directa{listas.length !== 1 ? 's' : ''} &middot;{' '}
                            {totalTasks} tarea{totalTasks !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {folders.length === 0 && listas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                            </svg>
                        </div>
                        <p className="text-sm text-zinc-500">Este space no tiene contenido aún</p>
                        <p className="text-xs text-zinc-400 mt-1">Crea carpetas o listas desde el menú lateral</p>
                    </div>
                ) : (
                    <>
                        {/* Folders */}
                        {folders.length > 0 && (
                            <div className="space-y-4">
                                {folders.length > 0 && (
                                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                        Carpetas
                                    </p>
                                )}
                                {folders.map(folder => (
                                    <FolderSection
                                        key={folder.pro_ide}
                                        folder={folder}
                                        onSelectFolder={() => onSelectFolder(folder)}
                                        onSelectList={onSelectList}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Direct lists */}
                        {listas.length > 0 && (
                            <div className="space-y-4">
                                {folders.length > 0 && (
                                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                        Listas directas
                                    </p>
                                )}
                                {listas.map(lista => (
                                    <ListSection
                                        key={lista.pro_ide}
                                        lista={lista}
                                        onSelectList={() => onSelectList(lista)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
