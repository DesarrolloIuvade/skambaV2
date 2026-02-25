'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
    skambaConseguirProyectos,
    skambaConseguirProyectosUsuario,
    skambaCrearProyecto,
    type Workspace,
    type Folder,
    type Lista,
    type Space,
    type Grupo,
} from '../lib/api';

export type SelectedView =
    | { type: 'workspace'; workspace: Workspace }
    | { type: 'space'; space: Space }
    | { type: 'folder'; folder: Folder }
    | { type: 'list'; lista: Lista }
    | { type: 'group'; grupo: Grupo }
    | null;

export type ViewMode = 'rows' | 'kanban';

interface User {
    name: string;
    email: string;
}

interface DashboardContextType {
    user: User | null;
    workspaces: Workspace[];
    groupWorkspaces: Workspace[];
    activeWorkspace: Workspace | null;
    setActiveWorkspaceId: (id: string) => void;
    loading: boolean;
    loadError: string;
    selectedLista: Lista | null;
    setSelectedLista: (lista: Lista | null) => void;
    selectedView: SelectedView;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    selectWorkspace: (ws: Workspace) => void;
    selectSpace: (space: Space, workspaceId?: string) => void;
    selectFolder: (folder: Folder) => void;
    selectLista: (lista: Lista) => void;
    openWorkspaces: Set<string>;
    toggleWorkspace: (id: string) => void;
    openSpaces: Set<string>;
    toggleSpace: (id: string) => void;
    openFolders: Set<string>;
    toggleFolder: (id: string) => void;
    createWorkspace: (name: string) => Promise<boolean>;
    createItem: (parentId: string, type: 'space' | 'folder' | 'list', name: string) => Promise<boolean>;
    selectGrupo: (grupo: Grupo) => void;
    logout: () => void;
    loadProyectos: () => Promise<void>;
    creatingWs: boolean;
    setCreatingWs: (v: boolean) => void;
    wsLoading: boolean;
    wsError: string;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

function collectSpaces(ws: Workspace): Space[] {
    return ws.spaces ?? [];
}

function collectFolders(ws: Workspace): Folder[] {
    const foldersFromSpaces = collectSpaces(ws).flatMap((s) => s.contenido?.folders ?? []);
    if (foldersFromSpaces.length > 0) return foldersFromSpaces;
    return ws.folders ?? [];
}

function collectListas(ws: Workspace): Lista[] {
    const listasFromSpaces = collectSpaces(ws).flatMap((s) => s.contenido?.listas ?? []);
    const listasFromFolders = collectFolders(ws).flatMap((f) => f.listas ?? []);
    return [...listasFromSpaces, ...listasFromFolders];
}

function normalizeWorkspace(raw: Workspace): Workspace {
    const spaces = (raw as Workspace & { spaces?: Space[] }).spaces ?? [];
    const normalizedSpaces = spaces.map((space) => ({
        ...space,
        contenido: {
            folders: space.contenido?.folders ?? [],
            listas: space.contenido?.listas ?? [],
        },
    }));

    const directFolders = (raw as Workspace & { folders?: Folder[] }).folders ?? [];
    const foldersFromSpaces = normalizedSpaces.flatMap((s) => s.contenido.folders ?? []);
    const mergedFolders = foldersFromSpaces.length > 0 ? foldersFromSpaces : directFolders;

    return {
        ...raw,
        spaces: normalizedSpaces,
        folders: mergedFolders,
    };
}

export function DashboardProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [groupWorkspaces, setGroupWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [selectedLista, setSelectedLista] = useState<Lista | null>(null);
    const [selectedView, setSelectedView] = useState<SelectedView>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('rows');
    const [openWorkspaces, setOpenWorkspaces] = useState<Set<string>>(new Set());
    const [openSpaces, setOpenSpaces] = useState<Set<string>>(new Set());
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

    // Create workspace state
    const [creatingWs, setCreatingWs] = useState(false);
    const [wsLoading, setWsLoading] = useState(false);
    const [wsError, setWsError] = useState('');

    // Persist activeWorkspaceId automatically whenever it changes
    useEffect(() => {
        if (activeWorkspaceId) {
            localStorage.setItem('sk_active_workspace', String(activeWorkspaceId));
        }
    }, [activeWorkspaceId]);

    useEffect(() => {
        const token = localStorage.getItem('sk_token');
        if (!token) {
            router.replace('/');
            return;
        }

        const raw = localStorage.getItem('sk_user');
        if (raw) {
            try {
                const u = JSON.parse(raw);
                setUser({
                    name: u.usu_nom ?? u.usuario ?? '',
                    email: u.usu_ema ?? u.usuario ?? '',
                });
            } catch {
                // ignore
            }
        }

        loadProyectosInternal(token).finally(() => setLoading(false));
    }, [router]);

    async function loadProyectosInternal(token: string) {
        const usu_ide = Number(localStorage.getItem('sk_usu_ide') ?? '0');
        setLoadError('');
        try {
            const [res, groupRes] = await Promise.all([
                skambaConseguirProyectos(token, usu_ide),
                skambaConseguirProyectosUsuario(token, usu_ide).catch(() => ({ success: false, data: [] as Workspace[] })),
            ]);

            let normalizedGroup: Workspace[] = [];
            if (groupRes.success && groupRes.data) {
                normalizedGroup = groupRes.data.map(normalizeWorkspace);
                setGroupWorkspaces(normalizedGroup);
            }

            let normalized: Workspace[] = [];
            if (res.success && res.data) {
                normalized = res.data.map(normalizeWorkspace);
                setWorkspaces(normalized);
            }

            // Set default active workspace if none selected or current is invalid
            if (normalized.length > 0 || normalizedGroup.length > 0) {
                setActiveWorkspaceId((prev) => {
                    const inPersonal = normalized.find((w) => w.pro_ide === prev);
                    if (inPersonal) return prev;
                    const inGroup = normalizedGroup.find((w) => w.pro_ide === prev);
                    if (inGroup) return prev;
                    // Restore from localStorage (page refresh)
                    const savedActiveWs = localStorage.getItem('sk_active_workspace');
                    if (savedActiveWs) {
                        const inPersonalSaved = normalized.find((w) => String(w.pro_ide) === String(savedActiveWs));
                        if (inPersonalSaved) return inPersonalSaved.pro_ide;
                        const inGroupSaved = normalizedGroup.find((w) => String(w.pro_ide) === String(savedActiveWs));
                        if (inGroupSaved) return inGroupSaved.pro_ide;
                    }
                    // Default to first personal, or first group if user has no personal workspaces
                    return normalized[0]?.pro_ide ?? normalizedGroup[0].pro_ide;
                });
            }

            // Sync selectedView and selectedLista with fresh data, or restore from localStorage on F5
            const allWorkspaces = [...normalized, ...normalizedGroup];
            const allSpaces = allWorkspaces.flatMap((w) => collectSpaces(w));
            const allFolders = allWorkspaces.flatMap((w) => collectFolders(w));
            const allListas = allWorkspaces.flatMap((w) => collectListas(w));

            setSelectedView((prev) => {
                if (prev !== null) {
                    if (prev.type === 'list') {
                        const fresh = allListas.find((l) => l.pro_ide === prev.lista.pro_ide);
                        return fresh ? { type: 'list', lista: fresh } : prev;
                    }
                    if (prev.type === 'folder') {
                        const fresh = allFolders.find((f) => f.pro_ide === prev.folder.pro_ide);
                        return fresh ? { type: 'folder', folder: fresh } : prev;
                    }
                    if (prev.type === 'workspace') {
                        const fresh = normalized.find((w) => w.pro_ide === prev.workspace.pro_ide)
                            ?? normalizedGroup.find((w) => w.pro_ide === prev.workspace.pro_ide);
                        return fresh ? { type: 'workspace', workspace: fresh } : prev;
                    }
                    if (prev.type === 'space') {
                        const fresh = allSpaces.find((s) => s.pro_ide === prev.space.pro_ide);
                        return fresh ? { type: 'space', space: fresh } : prev;
                    }
                    return prev;
                }
                // Restore from localStorage (F5 / hard refresh)
                try {
                    const saved = localStorage.getItem('sk_selected_view');
                    if (saved) {
                        const { type, id } = JSON.parse(saved) as { type: string; id: string };
                        if (type === 'list') {
                            const lista = allListas.find((l) => String(l.pro_ide) === String(id));
                            if (lista) return { type: 'list', lista };
                        }
                        if (type === 'folder') {
                            const folder = allFolders.find((f) => String(f.pro_ide) === String(id));
                            if (folder) return { type: 'folder', folder };
                        }
                        if (type === 'space') {
                            const space = allSpaces.find((s) => String(s.pro_ide) === String(id));
                            if (space) return { type: 'space', space };
                        }
                        if (type === 'workspace') {
                            const ws = normalized.find((w) => String(w.pro_ide) === String(id))
                                ?? normalizedGroup.find((w) => String(w.pro_ide) === String(id));
                            if (ws) return { type: 'workspace', workspace: ws };
                        }
                    }
                } catch {
                    // ignore
                }
                return prev;
            });

            setSelectedLista((prev) => {
                if (prev !== null) {
                    const fresh = allListas.find((l) => l.pro_ide === prev.pro_ide);
                    return fresh ?? prev;
                }
                // Restore selectedLista if the saved view is a list
                try {
                    const saved = localStorage.getItem('sk_selected_view');
                    if (saved) {
                        const { type, id } = JSON.parse(saved) as { type: string; id: string };
                        if (type === 'list') {
                            const lista = allListas.find((l) => String(l.pro_ide) === String(id));
                            if (lista) return lista;
                        }
                    }
                } catch {
                    // ignore
                }
                return prev;
            });

            // Auto-expand on load
            if (openWorkspaces.size === 0) {
                const ws = new Set(allWorkspaces.map((w) => w.pro_ide));
                const sp = new Set(allWorkspaces.flatMap((w) => collectSpaces(w).map((s) => s.pro_ide)));
                const fs = new Set(allWorkspaces.flatMap((w) => collectFolders(w).map((f) => f.pro_ide)));
                setOpenWorkspaces(ws);
                setOpenSpaces(sp);
                setOpenFolders(fs);
            }
        } catch {
            setLoadError('Error al cargar proyectos');
        }
    }

    async function loadProyectos() {
        const token = localStorage.getItem('sk_token');
        if (token) await loadProyectosInternal(token);
    }

    function toggleWorkspace(id: string) {
        setOpenWorkspaces((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleSpace(id: string) {
        setOpenSpaces((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleFolder(id: string) {
        setOpenFolders((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    async function createWorkspace(name: string) {
        if (!name.trim()) return false;
        const token = localStorage.getItem('sk_token') ?? '';
        const usu_ide = Number(localStorage.getItem('sk_usu_ide') ?? '0');

        setWsLoading(true);
        setWsError('');

        try {
            const res = await skambaCrearProyecto(0, name.trim(), usu_ide, token, 'workspace');
            if (!res.success) {
                setWsError(res.message || 'Error al crear workspace');
                return false;
            }
            setCreatingWs(false);
            await loadProyectosInternal(token);
            return true;
        } catch {
            setWsError('No se pudo conectar con el servidor');
            return false;
        } finally {
            setWsLoading(false);
        }
    }

    async function createItem(parentId: string, type: 'space' | 'folder' | 'list', name: string) {
        if (!name.trim()) return false;
        const token = localStorage.getItem('sk_token') ?? '';
        const usu_ide = Number(localStorage.getItem('sk_usu_ide') ?? '0');

        try {
            const res = await skambaCrearProyecto(
                Number(parentId),
                name.trim(),
                usu_ide,
                token,
                type,
            );
            if (!res.success) {
                return false;
            }

            const createdId = String(res.pro_ide ?? '');
            if (type === 'space') setOpenSpaces((p) => new Set([...p, createdId]));
            if (type === 'folder') {
                setOpenSpaces((p) => new Set([...p, parentId]));
                if (createdId) setOpenFolders((p) => new Set([...p, createdId]));
            }
            if (type === 'list') setOpenFolders((p) => new Set([...p, parentId]));

            await loadProyectosInternal(token);
            return true;
        } catch {
            return false;
        }
    }

    function selectWorkspace(ws: Workspace) {
        setActiveWorkspaceId(ws.pro_ide);
        setSelectedView({ type: 'workspace', workspace: ws });
        setSelectedLista(null);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'workspace', id: ws.pro_ide }));
        router.push('/dashboard');
    }

    function selectSpace(space: Space, workspaceId?: string) {
        if (workspaceId) setActiveWorkspaceId(workspaceId);
        setSelectedView({ type: 'space', space });
        setSelectedLista(null);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'space', id: space.pro_ide }));
        router.push('/dashboard');
    }

    function selectFolder(folder: Folder) {
        setSelectedView({ type: 'folder', folder });
        setSelectedLista(null);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'folder', id: folder.pro_ide }));
        router.push('/dashboard');
    }

    function selectLista(lista: Lista) {
        setSelectedView({ type: 'list', lista });
        setSelectedLista(lista);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'list', id: lista.pro_ide }));
        router.push('/dashboard');
    }

    function selectGrupo(grupo: Grupo) {
        setSelectedView({ type: 'group', grupo });
        setSelectedLista(null);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'group', id: String(grupo.gru_ide) }));
        router.push('/dashboard');
    }

    function logout() {
        localStorage.removeItem('sk_token');
        localStorage.removeItem('sk_usu_ide');
        localStorage.removeItem('sk_user');
        localStorage.removeItem('sk_selected_view');
        localStorage.removeItem('sk_active_workspace');
        router.replace('/');
    }

    const activeWorkspace =
        workspaces.find((w) => w.pro_ide === activeWorkspaceId) ||
        groupWorkspaces.find((w) => w.pro_ide === activeWorkspaceId) ||
        null;

    return (
        <DashboardContext.Provider value={{
            user,
            workspaces,
            groupWorkspaces,
            activeWorkspace,
            setActiveWorkspaceId,
            loading,
            loadError,
            selectedLista,
            setSelectedLista,
            selectedView,
            viewMode,
            setViewMode,
            selectWorkspace,
            selectSpace,
            selectFolder,
            selectLista,
            openWorkspaces,
            toggleWorkspace,
            openSpaces,
            toggleSpace,
            openFolders,
            toggleFolder,
            createWorkspace,
            createItem,
            selectGrupo,
            logout,
            loadProyectos,
            creatingWs,
            setCreatingWs,
            wsLoading,
            wsError,
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
