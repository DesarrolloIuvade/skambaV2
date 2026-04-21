'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useDashboard } from '../context/DashboardContext';
import { ChevronIcon, FolderIcon, ListIcon, PlusIcon, CheckIcon } from './Icons';
import { Pencil, Trash2, Building2, Layers3, Folder as LucideFolder, ClipboardList } from 'lucide-react';
import {
    Folder, Lista, Space, Grupo, Plantilla,
    skambaConseguirGruposUsuario, skambaMostrarPlantillas,
    skambaCrearGrupo, skambaCrearPlantilla,
} from '../lib/api';
import { TASKS_UPDATED_EVENT, type TasksUpdatedDetail } from '../lib/task-events';
import CreateModal from './CreateModal';
import { AddMemberModal } from './AddMemberModal';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../context/useAuthStore';

export function Sidebar() {
    const pathname = usePathname();
    const {
        workspaces,
        groupWorkspaces,
        activeWorkspace,
        loading,
        loadError,
        openSpaces,
        toggleSpace,
        openFolders,
        toggleFolder,
        selectedView,
        selectWorkspace,
        selectSpace,
        selectFolder,
        selectLista,
        createItem,
        createWorkspace,
        loadProyectos,
    } = useDashboard();

    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const switcherRef = useRef<HTMLDivElement>(null);

    // Close switcher when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setIsSwitcherOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [createModalConfig, setCreateModalConfig] = useState<{ parentId?: string; type: 'space' | 'folder' | 'list' | 'workspace' } | null>(null);
    const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);

    async function handleCreateItem(name: string, estIdes?: number[]) {
        if (!name.trim() || !createModalConfig) return;

        let success: boolean;
        if (createModalConfig.type === 'workspace') {
            success = await createWorkspace(name.trim());
        } else {
            success = await createItem(createModalConfig.parentId!, createModalConfig.type, name.trim(), estIdes);
        }

        if (success) {
            setCreateModalOpen(false);
            setCreateModalConfig(null);
        }
    }

    async function handleMemberAdded() {
        // Recargar proyectos después de agregar un miembro
        await loadProyectos();
    }

    // Helper for rendering
    function getWorkspaceInitial(name: string) {
        return name.charAt(0).toUpperCase() || 'W';
    }

    const isActiveGroupWorkspace = !!activeWorkspace && groupWorkspaces.some((w) => String(w.pro_ide) === String(activeWorkspace.pro_ide));

    function getGroupProTip(ws: any): 'workspace' | 'space' | 'folder' | 'list' {
        const tip = String(ws?.pro_tip_original ?? ws?.pro_tip ?? 'workspace').toLowerCase();
        if (tip === 'space' || tip === 'folder' || tip === 'list' || tip === 'workspace') return tip;
        return 'workspace';
    }

    function GroupTipIcon({ tip }: { tip: 'workspace' | 'space' | 'folder' | 'list' }) {
        if (tip === 'folder') return <LucideFolder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
        if (tip === 'list') return <ClipboardList className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
        if (tip === 'space') return <Layers3 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
        return <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    }

    return (
        <aside className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0">
            {/* Workspace Switcher Header */}
            <div className="relative px-3 py-3 border-b border-zinc-200 dark:border-zinc-800" ref={switcherRef}>
                <button
                    onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                    className="w-full flex items-center justify-between p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left group"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {activeWorkspace ? getWorkspaceInitial(activeWorkspace.pro_nom) : '?'}
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                {activeWorkspace?.pro_nom || 'Seleccionar Workspace'}
                            </span>
                            {isActiveGroupWorkspace && (
                                <GroupTipIcon tip={getGroupProTip(activeWorkspace as any)} />
                            )}
                        </div>
                    </div>
                    <div className={`transition-transform duration-200 ${isSwitcherOpen ? 'rotate-180' : ''} text-zinc-500`}>
                        <ChevronIcon open={false} />
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isSwitcherOpen && (
                    <div className="absolute top-full left-3 right-3 mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden flex flex-col max-h-75">
                        <div className="overflow-y-auto flex-1 p-1">
                            {loading && <p className="text-xs text-zinc-400 p-2">Cargando...</p>}

                            {/* Personal workspaces */}
                            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pt-1 pb-0.5">Mis workspaces</p>
                            <div className="space-y-0.5 mb-1">
                                {workspaces.map(ws => (
                                    <button
                                        key={ws.pro_ide}
                                        onClick={() => { selectWorkspace(ws); setIsSwitcherOpen(false); }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left text-sm"
                                    >
                                        <div className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-[10px] font-bold">
                                            {getWorkspaceInitial(ws.pro_nom)}
                                        </div>
                                        <span className={`flex-1 truncate ${activeWorkspace?.pro_ide === ws.pro_ide ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {ws.pro_nom}
                                        </span>
                                        {activeWorkspace?.pro_ide === ws.pro_ide && <CheckIcon />}
                                    </button>
                                ))}
                            </div>

                            {/* Group workspaces */}
                            {groupWorkspaces.length > 0 && (
                                <>
                                    <div className="border-t border-zinc-100 dark:border-zinc-700 mt-1 pt-1">
                                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-0.5">Workspaces de grupo</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        {groupWorkspaces.map(ws => (
                                            <button
                                                key={ws.pro_ide}
                                                onClick={() => { selectWorkspace(ws); setIsSwitcherOpen(false); }}
                                                className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left text-sm"
                                            >
                                                <div className="min-w-0 flex items-center gap-2 flex-1">
                                                    <div className="w-5 h-5 rounded bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                                        {getWorkspaceInitial(ws.pro_nom)}
                                                    </div>
                                                    <span className={`flex-1 truncate ${activeWorkspace?.pro_ide === ws.pro_ide ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                        {ws.pro_nom}
                                                    </span>
                                                </div>
                                                <GroupTipIcon tip={getGroupProTip(ws as any)} />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 space-y-0.5">
                            <button
                                onClick={() => {
                                    setCreateModalConfig({ type: 'workspace' });
                                    setCreateModalOpen(true);
                                    setIsSwitcherOpen(false);
                                }}
                                className="w-full flex items-center justify-start gap-2 px-2 py-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>Nuevo workspace</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Content (Spaces, Folders & Lists) */}
            <div className="flex-1 overflow-y-auto px-2 py-3">
                {loadError && (
                    <div className="p-4 text-center">
                        <p className="text-xs text-red-500 mb-2">{loadError}</p>
                    </div>
                )}

                {activeWorkspace ? (
                    <div className="space-y-0.5">
                        {/* Workspace overview link */}
                        <button
                            onClick={() => selectWorkspace(activeWorkspace)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors mb-1 ${selectedView?.type === 'workspace' && selectedView.workspace.pro_ide === activeWorkspace.pro_ide
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            <span className="truncate">Vista general</span>
                        </button>

                        {/* Spaces */}
                        {activeWorkspace.spaces.length > 0 ? (
                            activeWorkspace.spaces.map((space) => (
                                <div key={space.pro_ide}>
                                    <SpaceItem
                                        space={space}
                                        isGroupWorkspace={isActiveGroupWorkspace}
                                        isOpen={openSpaces.has(space.pro_ide)}
                                        onToggle={() => toggleSpace(space.pro_ide)}
                                        selectedView={selectedView}
                                        onSelectSpace={() => selectSpace(space, activeWorkspace.pro_ide)}
                                        onSelectFolder={selectFolder}
                                        onSelectList={selectLista}
                                        openFolders={openFolders}
                                        toggleFolder={toggleFolder}
                                        onStartCreating={(parentId, type) => {
                                            setCreateModalConfig({ parentId, type });
                                            setCreateModalOpen(true);
                                        }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-sm text-zinc-400 mb-2">Este workspace no tiene spaces</p>
                                <button
                                    onClick={() => {
                                        setCreateModalConfig({ parentId: activeWorkspace.pro_ide, type: 'space' });
                                        setCreateModalOpen(true);
                                    }}
                                    className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1 mx-auto"
                                >
                                    <PlusIcon className="w-3 h-3" /> Crear space
                                </button>
                            </div>
                        )}

                        {/* Button to add space at root level of workspace */}
                        <button
                            onClick={() => {
                                setCreateModalConfig({ parentId: activeWorkspace.pro_ide, type: 'space' });
                                setCreateModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 mt-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm transition-colors group"
                        >
                            <div className="w-5 h-5 flex items-center justify-center rounded border border-dashed border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400">
                                <PlusIcon className="w-3 h-3" />
                            </div>
                            <span className="text-xs">Nuevo space</span>
                        </button>

                    </div>
                ) : (
                    !loading && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm text-zinc-400">Selecciona o crea un workspace para comenzar.</p>
                        </div>
                    )
                )}

                {/* Grupos section */}
                <GruposSection />

                {/* Plantillas section */}
                <PlantillasSection />

            </div>

            {/* Navigation Links */}
            <div className="px-2 py-3 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 px-2">Configuración</p>
                <nav className="space-y-0.5">
                    <Link
                        href="/dashboard/estados"
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${pathname === '/dashboard/estados'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                        Estados
                    </Link>

                </nav>
            </div>

            {createModalConfig && (
                <CreateModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    itemType={createModalConfig.type}
                    onCreate={handleCreateItem}
                />
            )}

            {activeWorkspace && (
                <AddMemberModal
                    isOpen={isAddMemberModalOpen}
                    onClose={() => setAddMemberModalOpen(false)}
                    workspaceId={activeWorkspace.pro_ide}
                    onSuccess={handleMemberAdded}
                />
            )}
        </aside>
    );
}

// Sub-component for individual list items
type SidebarTaskLike = Lista['tareas'][number] & { est_nom?: string | null };

function categorizeStatusName(name?: string | null): 'pending' | 'inprogress' | 'completed' | 'other' {
    const normalized = name?.trim().toLowerCase() ?? '';
    if (!normalized) return 'other';
    if (normalized.includes('proceso') || normalized.includes('progreso')) return 'inprogress';
    if (normalized.includes('pendiente')) return 'pending';
    if (normalized.includes('complet') || normalized.includes('finaliz') || normalized.includes('cerrad')) return 'completed';
    return 'other';
}

function readPendingCount(value: unknown): number | null {
    if (Array.isArray(value)) return value.length;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function getPendingTaskCount(lista: Lista) {
    const fromTree = readPendingCount(lista.tareas_pendientes_total) ?? readPendingCount(lista.tareas_pendientes);
    if (fromTree !== null) return fromTree;

    return (lista.tareas ?? []).filter((tarea) => {
        const estado = lista.estados.find((item) => String(item.p_e_ide) === String(tarea.tar_est));
        const statusName = estado?.est_nom ?? (tarea as SidebarTaskLike).est_nom;
        return categorizeStatusName(statusName) === 'pending';
    }).length;
}

function getPendingTaskCountFromTasks(tareas: SidebarTaskLike[]) {
    return tareas.filter((tarea) => categorizeStatusName(tarea.est_nom) === 'pending').length;
}

function ListPendingBadge({ lista, isGroupWorkspace }: { lista: Lista; isGroupWorkspace: boolean }) {
    const initialCount = getPendingTaskCount(lista);
    const [pendingCount, setPendingCount] = useState(initialCount);

    useEffect(() => {
        setPendingCount(initialCount);
    }, [
        initialCount,
        lista.pro_ide,
        lista.tareas_pendientes,
        lista.tareas_pendientes_total,
    ]);

    useEffect(() => {
        function handleTasksUpdated(event: Event) {
            const customEvent = event as CustomEvent<TasksUpdatedDetail>;
            if (String(customEvent.detail?.proIde ?? '') !== String(lista.pro_ide)) return;
            if (typeof customEvent.detail?.pendingCount !== 'number') return;
            setPendingCount(customEvent.detail.pendingCount);
        }

        window.addEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated as EventListener);
        return () => {
            window.removeEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated as EventListener);
        };
    }, [lista.pro_ide]);

    if (pendingCount <= 0) return null;

    return (
        <span className="ml-auto rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-300 group-hover:hidden">
            {pendingCount}
        </span>
    );
}

function ListItem({
    lista,
    isGroupWorkspace,
    selectedView,
    onSelectList,
}: {
    lista: Lista;
    isGroupWorkspace: boolean;
    selectedView: import('../context/DashboardContext').SelectedView;
    onSelectList: (l: Lista) => void;
}) {
    const { renameItem, deleteItem } = useDashboard();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const isSelected = selectedView?.type === 'list' && selectedView.lista.pro_ide === lista.pro_ide;

    async function handleRename() {
        if (!editValue.trim() || editValue.trim() === lista.pro_nom) { setIsEditing(false); return; }
        await renameItem(lista.pro_ide, editValue.trim());
        setIsEditing(false);
    }

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (window.confirm(`¿Eliminar lista "${lista.pro_nom}" y todas sus tareas?`)) {
            await deleteItem(lista.pro_ide);
        }
    }

    return (
        <div className={`group flex items-center rounded-md transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
            {isEditing ? (
                <div className="flex flex-1 items-center gap-2 px-2 py-1.5">
                    <ListIcon />
                    <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
                        onBlur={handleRename}
                        className="flex-1 min-w-0 text-sm bg-transparent border-b border-indigo-400 outline-none text-zinc-700 dark:text-zinc-300"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            ) : (
                <button
                    onClick={() => onSelectList(lista)}
                    className={`flex flex-1 items-center gap-2 px-2 py-1.5 text-sm min-w-0 text-left transition-colors ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-600 dark:text-zinc-400'}`}
                >
                    <ListIcon />
                    <span className="truncate flex-1">{lista.pro_nom}</span>
                    <ListPendingBadge lista={lista} isGroupWorkspace={isGroupWorkspace} />
                </button>
            )}
            {!isEditing && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-1 shrink-0">
                    <button
                        onClick={e => { e.stopPropagation(); setEditValue(lista.pro_nom); setIsEditing(true); }}
                        title="Renombrar"
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 transition-colors"
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
    );
}

// Sub-component for Folder rendering
function FolderItem({
    folder,
    isGroupWorkspace,
    isOpen,
    onToggle,
    selectedView,
    onSelectFolder,
    onSelectList,
    onStartCreating
}: {
    folder: Folder;
    isGroupWorkspace: boolean;
    isOpen: boolean;
    onToggle: () => void;
    selectedView: import('../context/DashboardContext').SelectedView;
    onSelectFolder: (f: Folder) => void;
    onSelectList: (l: Lista) => void;
    onStartCreating: (parentId: string, type: 'folder' | 'list') => void;
}) {
    const { renameItem, deleteItem } = useDashboard();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const isFolderSelected = selectedView?.type === 'folder' && selectedView.folder.pro_ide === folder.pro_ide;

    async function handleRename() {
        if (!editValue.trim() || editValue.trim() === folder.pro_nom) { setIsEditing(false); return; }
        await renameItem(folder.pro_ide, editValue.trim());
        setIsEditing(false);
    }

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (window.confirm(`¿Eliminar carpeta "${folder.pro_nom}" y todo su contenido?`)) {
            await deleteItem(folder.pro_ide);
        }
    }

    return (
        <div className="mb-0.5">
            <div className="group flex items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 pr-1">
                <button
                    onClick={onToggle}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 shrink-0"
                >
                    <ChevronIcon open={isOpen} />
                </button>
                {isEditing ? (
                    <div className="flex flex-1 items-center gap-2 py-1.5 pr-1 min-w-0">
                        <FolderIcon />
                        <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
                            onBlur={handleRename}
                            className="flex-1 min-w-0 text-sm font-medium bg-transparent border-b border-indigo-400 outline-none text-zinc-700 dark:text-zinc-300"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => onSelectFolder(folder)}
                        className={`flex flex-1 items-center gap-2 min-w-0 text-left py-1.5 pr-1 text-sm font-medium transition-colors ${isFolderSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}
                    >
                        <FolderIcon />
                        <span className="truncate flex-1">{folder.pro_nom}</span>
                    </button>
                )}
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                        <button
                            onClick={e => { e.stopPropagation(); setEditValue(folder.pro_nom); setIsEditing(true); }}
                            title="Renombrar"
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 transition-colors"
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

            {isOpen && (
                <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-2 mt-0.5 space-y-0.5">
                    {folder.listas.map(lista => (
                        <ListItem
                            key={lista.pro_ide}
                            lista={lista}
                            isGroupWorkspace={isGroupWorkspace}
                            selectedView={selectedView}
                            onSelectList={onSelectList}
                        />
                    ))}
                    <button
                        onClick={() => onStartCreating(folder.pro_ide, 'list')}
                        className="w-full flex items-center justify-center gap-1 py-1 text-xs text-zinc-300 dark:text-zinc-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded transition-colors"
                    >
                        <PlusIcon className="w-3 h-3 shrink-0" />
                    </button>
                </div>
            )}
        </div>
    );
}

// Sub-component for Space rendering
function SpaceItem({
    space,
    isGroupWorkspace,
    isOpen,
    onToggle,
    selectedView,
    onSelectSpace,
    onSelectFolder,
    onSelectList,
    openFolders,
    toggleFolder,
    onStartCreating,
}: {
    space: Space;
    isGroupWorkspace: boolean;
    isOpen: boolean;
    onToggle: () => void;
    selectedView: import('../context/DashboardContext').SelectedView;
    onSelectSpace: () => void;
    onSelectFolder: (f: Folder) => void;
    onSelectList: (l: Lista) => void;
    openFolders: Set<string>;
    toggleFolder: (id: string) => void;
    onStartCreating: (parentId: string, type: 'folder' | 'list') => void;
}) {
    const { renameItem, deleteItem } = useDashboard();
    const isSpaceSelected = selectedView?.type === 'space' && selectedView.space.pro_ide === space.pro_ide;
    const [showPicker, setShowPicker] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    async function handleRename() {
        if (!editValue.trim() || editValue.trim() === space.pro_nom) { setIsEditing(false); return; }
        await renameItem(space.pro_ide, editValue.trim());
        setIsEditing(false);
    }

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (window.confirm(`¿Eliminar space "${space.pro_nom}" y todo su contenido?`)) {
            await deleteItem(space.pro_ide);
        }
    }

    return (
        <div className="mb-1">
            <div className="group flex items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 pr-1">
                <button
                    onClick={onToggle}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 shrink-0"
                >
                    <ChevronIcon open={isOpen} />
                </button>
                {isEditing ? (
                    <div className="flex flex-1 items-center gap-2 py-1.5 pr-1 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
                            onBlur={handleRename}
                            className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b border-indigo-400 outline-none text-zinc-800 dark:text-zinc-200"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                ) : (
                    <button
                        onClick={onSelectSpace}
                        className={`flex flex-1 items-center gap-2 min-w-0 text-left py-1.5 pr-1 text-sm font-semibold transition-colors ${isSpaceSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-800 dark:text-zinc-200'}`}
                    >
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="truncate flex-1">{space.pro_nom}</span>
                    </button>
                )}
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                        <button
                            onClick={e => { e.stopPropagation(); setEditValue(space.pro_nom); setIsEditing(true); }}
                            title="Renombrar"
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 transition-colors"
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

            {isOpen && (
                <div className="ml-3 border-l border-zinc-200 dark:border-zinc-800 pl-2 mt-0.5 space-y-0.5">
                    {(space.contenido?.folders ?? []).map((folder) => (
                        <FolderItem
                            key={folder.pro_ide}
                            folder={folder}
                            isGroupWorkspace={isGroupWorkspace}
                            isOpen={openFolders.has(folder.pro_ide)}
                            onToggle={() => toggleFolder(folder.pro_ide)}
                            selectedView={selectedView}
                            onSelectFolder={onSelectFolder}
                            onSelectList={onSelectList}
                            onStartCreating={onStartCreating}
                        />
                    ))}
                    {(space.contenido?.listas ?? []).map((lista) => (
                        <ListItem
                            key={lista.pro_ide}
                            lista={lista}
                            isGroupWorkspace={isGroupWorkspace}
                            selectedView={selectedView}
                            onSelectList={onSelectList}
                        />
                    ))}
                    {showPicker ? (
                        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <button
                                onClick={() => { onStartCreating(space.pro_ide, 'folder'); setShowPicker(false); }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-white dark:bg-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-md transition-colors shadow-sm"
                            >
                                <FolderIcon />
                                Carpeta
                            </button>
                            <button
                                onClick={() => { onStartCreating(space.pro_ide, 'list'); setShowPicker(false); }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400 bg-white dark:bg-zinc-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors shadow-sm"
                            >
                                <ListIcon />
                                Lista
                            </button>
                            <button
                                onClick={() => setShowPicker(false)}
                                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowPicker(true)}
                            className="w-full flex items-center justify-center py-1 text-zinc-300 dark:text-zinc-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded transition-colors"
                        >
                            <PlusIcon className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Grupos collapsible section — navigation only, detail in dashboard
function GruposSection() {
    const { selectGrupo, selectedView } = useDashboard();
    const [isOpen, setIsOpen] = useState(false);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newGrupoName, setNewGrupoName] = useState('');
    const [creatingGrupo, setCreatingGrupo] = useState(false);

    const { logout } = useAuth();
    const { user, token } = useAuthStore();

    function getToken() { return token ?? ''; }
    function getUsuIde() { return user?.usu_ide ?? 0; }

    async function loadGrupos() {
        setLoading(true);
        try {
            const res = await skambaConseguirGruposUsuario(getToken(), getUsuIde());
            if (res.success) setGrupos(res.data);
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    }

    function handleToggleSection() {
        if (!isOpen && !loaded) loadGrupos();
        setIsOpen(v => !v);
    }

    async function handleCreateGrupo(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!newGrupoName.trim()) return;
        setCreatingGrupo(true);
        try {
            const res = await skambaCrearGrupo(getToken(), newGrupoName.trim());
            if (res.success) {
                setNewGrupoName('');
                setShowCreateForm(false);
                setLoaded(false);
                await loadGrupos();
            }
        } catch {
            // silently ignore
        } finally {
            setCreatingGrupo(false);
        }
    }

    return (
        <div className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-2">
            <div className="flex items-center">
                <button
                    onClick={handleToggleSection}
                    className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                    <ChevronIcon open={isOpen} />
                    <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Grupos</span>
                </button>
                <button
                    onClick={e => { e.stopPropagation(); setShowCreateForm(v => !v); if (!isOpen) setIsOpen(true); if (!loaded) loadGrupos(); }}
                    title="Crear grupo"
                    className="p-1 mr-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                    <PlusIcon className="w-3.5 h-3.5" />
                </button>
            </div>

            {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                    {loading && <p className="text-xs text-zinc-400 px-4 py-1">Cargando...</p>}

                    {showCreateForm && (
                        <form onSubmit={handleCreateGrupo} className="px-2 py-1.5">
                            <div className="flex gap-1">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Nombre del grupo"
                                    value={newGrupoName}
                                    onChange={e => setNewGrupoName(e.target.value)}
                                    className="flex-1 min-w-0 px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={creatingGrupo || !newGrupoName.trim()}
                                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                                >
                                    {creatingGrupo ? '...' : 'OK'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateForm(false); setNewGrupoName(''); }}
                                    className="px-1.5 py-1 text-xs text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                                >
                                    ✕
                                </button>
                            </div>
                        </form>
                    )}

                    {!loading && loaded && grupos.length === 0 && !showCreateForm && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center gap-1 px-3 py-1.5 text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                        >
                            <PlusIcon className="w-3 h-3" />
                            <span>Crear grupo</span>
                        </button>
                    )}

                    {grupos.map(g => {
                        const gruId = String(g.gru_ide);
                        const isSelected = selectedView?.type === 'group' && String(selectedView.grupo.gru_ide) === gruId;
                        return (
                            <button
                                key={gruId}
                                onClick={() => selectGrupo(g)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${isSelected
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="truncate">{g.gru_nom}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Plantillas collapsible section
function PlantillasSection() {
    const [isOpen, setIsOpen] = useState(false);
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPlantillaName, setNewPlantillaName] = useState('');
    const [creatingPlantilla, setCreatingPlantilla] = useState(false);

    const { token, user } = useAuthStore();
    function getToken() { return token ?? ''; }
    function getUsuIde() { return user?.usu_ide ?? 0; }

    async function loadPlantillas() {
        setLoading(true);
        try {
            const res = await skambaMostrarPlantillas(getToken());
            if (res.success) setPlantillas(res.data);
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    }

    function handleToggle() {
        if (!isOpen && !loaded) loadPlantillas();
        setIsOpen(v => !v);
    }

    async function handleCreatePlantilla(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!newPlantillaName.trim()) return;
        setCreatingPlantilla(true);
        try {
            const res = await skambaCrearPlantilla(getToken(), newPlantillaName.trim(), getUsuIde());
            if (res.success) {
                setNewPlantillaName('');
                setShowCreateForm(false);
                setLoaded(false);
                await loadPlantillas();
            }
        } catch {
            // silently ignore
        } finally {
            setCreatingPlantilla(false);
        }
    }

    return (
        <div className="mt-1 border-t border-zinc-200 dark:border-zinc-800 pt-2">
            {/* Section header */}
            <div className="flex items-center">
                <button
                    onClick={handleToggle}
                    className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                    <ChevronIcon open={isOpen} />
                    <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Plantillas</span>
                </button>
                <button
                    onClick={e => { e.stopPropagation(); setShowCreateForm(v => !v); if (!isOpen) setIsOpen(true); if (!loaded) loadPlantillas(); }}
                    title="Nueva plantilla"
                    className="p-1 mr-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                    <PlusIcon className="w-3.5 h-3.5" />
                </button>
            </div>

            {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                    {loading && (
                        <p className="text-xs text-zinc-400 px-4 py-1">Cargando...</p>
                    )}

                    {/* Inline create form */}
                    {showCreateForm && (
                        <form onSubmit={handleCreatePlantilla} className="px-2 py-1.5">
                            <div className="flex gap-1">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Nombre de la plantilla"
                                    value={newPlantillaName}
                                    onChange={e => setNewPlantillaName(e.target.value)}
                                    className="flex-1 min-w-0 px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={creatingPlantilla || !newPlantillaName.trim()}
                                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                                >
                                    {creatingPlantilla ? '...' : 'OK'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateForm(false); setNewPlantillaName(''); }}
                                    className="px-1.5 py-1 text-xs text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                                >
                                    ✕
                                </button>
                            </div>
                        </form>
                    )}

                    {!loading && loaded && plantillas.length === 0 && !showCreateForm && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center gap-1 px-3 py-1.5 text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                        >
                            <PlusIcon className="w-3 h-3" />
                            <span>Crear plantilla</span>
                        </button>
                    )}

                    {plantillas.map(p => (
                        <Link
                            key={p.pla_ide}
                            href="/dashboard/plantillas"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <svg className="w-3 h-3 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="truncate flex-1">{p.pla_nom}</span>
                            <span className="text-xs text-zinc-400">{p.tareas.length}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
