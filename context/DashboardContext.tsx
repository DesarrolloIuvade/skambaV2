'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import {
    skambaConseguirProyectos,
    skambaConseguirProyectosGrupoUsuarioPorUsuario,
    skambaCrearProyecto,
    skambaEditarProyecto,
    skambaEliminarProyecto,
    type Workspace,
    type Folder,
    type Lista,
    type Space,
    type Grupo,
} from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from './useAuthStore';
import { TASKS_UPDATED_EVENT, type TasksUpdatedDetail } from '../lib/task-events';

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
    createItem: (parentId: string, type: 'space' | 'folder' | 'list', name: string, estIdes?: number[]) => Promise<boolean>;
    renameItem: (pro_ide: string, newName: string) => Promise<boolean>;
    deleteItem: (pro_ide: string) => Promise<boolean>;
    selectGrupo: (grupo: Grupo) => void;
    logout: () => void;
    loadProyectos: () => Promise<void>;
    creatingWs: boolean;
    setCreatingWs: (v: boolean) => void;
    wsLoading: boolean;
    wsError: string;
    miembros: any[];
    setMiembros: (miembros: any[]) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

function collectSpaces(ws: Workspace): Space[] {
    return ws.spaces;
}

function collectFolders(ws: Workspace): Folder[] {
    return ws.spaces.flatMap((s) => s.contenido?.folders ?? []);
}

function collectListas(ws: Workspace): Lista[] {
    const listasFromSpaces = ws.spaces.flatMap((s) => s.contenido?.listas ?? []);
    const listasFromFolders = collectFolders(ws).flatMap((f) => f.listas ?? []);
    return [...listasFromSpaces, ...listasFromFolders];
}

function normalizeWorkspace(raw: Workspace): Workspace {
    const spaces = raw.spaces ?? [];
    const normalizedSpaces = spaces.map((space) => ({
        ...space,
        contenido: {
            folders: space.contenido?.folders ?? [],
            listas: space.contenido?.listas ?? [],
        },
    }));

    return {
        ...raw,
        spaces: normalizedSpaces || [],
    };
}

function readPendingCount(value: unknown): number | null {
    if (Array.isArray(value)) return value.length;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function toListaFromNode(node: any, parentId: string): Lista {
    const pending = readPendingCount(node?.tareas_pendientes);
    const totalPending = readPendingCount(node?.tareas_pendientes_total);

    return {
        pro_ide: String(node?.pro_ide ?? ''),
        pro_nom: String(node?.pro_nom ?? 'Lista'),
        usu_ide: String(node?.usu_ide ?? '0'),
        pro_pad: parentId,
        est_ado: String(node?.proyecto_estado ?? node?.pro_est_ado ?? node?.est_ado ?? '1'),
        pro_tip: 'list',
        tareas: Array.isArray(node?.tareas) ? node.tareas : [],
        estados: Array.isArray(node?.estados) ? node.estados : [],
        miembros: Array.isArray(node?.miembros) ? node.miembros : [],
        tareas_pendientes: pending ?? 0,
        tareas_pendientes_total: totalPending ?? pending ?? 0,
    };
}

function collectDescendantLists(node: any, parentId: string): Lista[] {
    const tip = String(node?.pro_tip ?? '').toLowerCase();
    if (tip === 'list') return [toListaFromNode(node, parentId)];

    const children = Array.isArray(node?.children) ? node.children : [];
    return children.flatMap((child: any) => collectDescendantLists(child, parentId));
}

function toFolderFromNode(node: any, parentId: string): Folder {
    const children = Array.isArray(node?.children) ? node.children : [];
    const listas: Lista[] = [];

    for (const child of children) {
        const tip = String(child?.pro_tip ?? '').toLowerCase();
        if (tip === 'list') {
            listas.push(toListaFromNode(child, String(node.pro_ide)));
        } else {
            listas.push(...collectDescendantLists(child, String(node.pro_ide)));
        }
    }

    const pending = readPendingCount(node?.tareas_pendientes);
    const totalPending = readPendingCount(node?.tareas_pendientes_total);
    const fallbackTotal = listas.reduce(
        (sum, lista) => sum + Number(lista.tareas_pendientes_total ?? lista.tareas_pendientes ?? 0),
        0,
    );

    return {
        pro_ide: String(node?.pro_ide ?? ''),
        pro_nom: String(node?.pro_nom ?? 'Folder'),
        usu_ide: String(node?.usu_ide ?? '0'),
        pro_pad: parentId,
        est_ado: String(node?.proyecto_estado ?? node?.pro_est_ado ?? node?.est_ado ?? '1'),
        pro_tip: 'folder',
        listas,
        tareas_pendientes: pending ?? fallbackTotal,
        tareas_pendientes_total: totalPending ?? pending ?? fallbackTotal,
    };
}

function toSpaceFromNode(node: any, parentId: string): Space {
    const children = Array.isArray(node?.children) ? node.children : [];
    const folders: Folder[] = [];
    const listas: Lista[] = [];

    for (const child of children) {
        const tip = String(child?.pro_tip ?? '').toLowerCase();
        if (tip === 'folder') {
            folders.push(toFolderFromNode(child, String(node.pro_ide)));
        }
        if (tip === 'list') {
            listas.push(toListaFromNode(child, String(node.pro_ide)));
        }
    }

    const pending = readPendingCount(node?.tareas_pendientes);
    const totalPending = readPendingCount(node?.tareas_pendientes_total);
    const fallbackTotal =
        folders.reduce(
            (sum, folder) => sum + Number(folder.tareas_pendientes_total ?? folder.tareas_pendientes ?? 0),
            0,
        ) +
        listas.reduce(
            (sum, lista) => sum + Number(lista.tareas_pendientes_total ?? lista.tareas_pendientes ?? 0),
            0,
        );

    return {
        pro_ide: String(node?.pro_ide ?? ''),
        pro_nom: String(node?.pro_nom ?? 'Space'),
        usu_ide: String(node?.usu_ide ?? '0'),
        pro_pad: parentId,
        est_ado: String(node?.proyecto_estado ?? node?.pro_est_ado ?? node?.est_ado ?? '1'),
        pro_tip: 'space',
        contenido: { folders, listas },
        tareas_pendientes: pending ?? fallbackTotal,
        tareas_pendientes_total: totalPending ?? pending ?? fallbackTotal,
    };
}

function createSyntheticSpaceForWorkspace(ws: Workspace): Space {
    return {
        pro_ide: `${ws.pro_ide}__root`,
        pro_nom: 'General',
        usu_ide: ws.usu_ide,
        pro_pad: ws.pro_ide,
        est_ado: ws.est_ado,
        pro_tip: 'space',
        contenido: { folders: [], listas: [] },
        tareas_pendientes: 0,
        tareas_pendientes_total: 0,
    };
}

function toWorkspaceFromTreeRoot(node: any): Workspace {
    const tip = String(node?.pro_tip ?? '').toLowerCase();
    const proIde = String(node?.pro_ide ?? '');
    const pending = readPendingCount(node?.tareas_pendientes);
    const totalPending = readPendingCount(node?.tareas_pendientes_total);
    const ws = {
        pro_ide: proIde,
        pro_nom: String(node?.pro_nom ?? 'Workspace'),
        usu_ide: String(node?.usu_ide ?? '0'),
        pro_pad: String(node?.pro_pad ?? '0'),
        est_ado: String(node?.proyecto_estado ?? node?.pro_est_ado ?? node?.est_ado ?? '1'),
        pro_tip: 'workspace',
        spaces: [],
        tareas_pendientes: pending ?? 0,
        tareas_pendientes_total: totalPending ?? pending ?? 0,
        pro_tip_original: (tip === 'workspace' || tip === 'space' || tip === 'folder' || tip === 'list') ? tip : 'workspace',
    } as Workspace & { pro_tip_original: 'workspace' | 'space' | 'folder' | 'list' };

    if (tip === 'workspace') {
        const children = Array.isArray(node?.children) ? node.children : [];
        for (const child of children) {
            const childTip = String(child?.pro_tip ?? '').toLowerCase();
            if (childTip === 'space') {
                ws.spaces.push(toSpaceFromNode(child, ws.pro_ide));
                continue;
            }

            // Si llegan folders/listas colgando directo del root, los agregamos en un space virtual.
            const synthetic = ws.spaces.find((s) => s.pro_ide === `${ws.pro_ide}__root`) ?? createSyntheticSpaceForWorkspace(ws);
            if (!ws.spaces.some((s) => s.pro_ide === synthetic.pro_ide)) ws.spaces.push(synthetic);

            if (childTip === 'folder') synthetic.contenido.folders.push(toFolderFromNode(child, synthetic.pro_ide));
            if (childTip === 'list') synthetic.contenido.listas.push(toListaFromNode(child, synthetic.pro_ide));
        }
        if (!totalPending && !pending) {
            ws.tareas_pendientes_total = ws.spaces.reduce(
                (sum, space) => sum + Number(space.tareas_pendientes_total ?? space.tareas_pendientes ?? 0),
                0,
            );
            ws.tareas_pendientes = ws.tareas_pendientes_total;
        }
        return ws;
    }

    if (tip === 'space') {
        ws.spaces.push(toSpaceFromNode(node, ws.pro_ide));
        if (!totalPending && !pending) {
            ws.tareas_pendientes_total = ws.spaces.reduce(
                (sum, space) => sum + Number(space.tareas_pendientes_total ?? space.tareas_pendientes ?? 0),
                0,
            );
            ws.tareas_pendientes = ws.tareas_pendientes_total;
        }
        return ws;
    }

    const synthetic = createSyntheticSpaceForWorkspace(ws);
    if (tip === 'folder') synthetic.contenido.folders.push(toFolderFromNode(node, synthetic.pro_ide));
    if (tip === 'list') synthetic.contenido.listas.push(toListaFromNode(node, synthetic.pro_ide));
    synthetic.tareas_pendientes_total =
        synthetic.contenido.folders.reduce(
            (sum, folder) => sum + Number(folder.tareas_pendientes_total ?? folder.tareas_pendientes ?? 0),
            0,
        ) +
        synthetic.contenido.listas.reduce(
            (sum, lista) => sum + Number(lista.tareas_pendientes_total ?? lista.tareas_pendientes ?? 0),
            0,
        );
    synthetic.tareas_pendientes = synthetic.tareas_pendientes_total;
    ws.spaces.push(synthetic);
    if (!totalPending && !pending) {
        ws.tareas_pendientes_total = synthetic.tareas_pendientes_total;
        ws.tareas_pendientes = synthetic.tareas_pendientes;
    }
    return ws;
}


function buildGroupWorkspacesFromResponse(rawItems: any[]): Workspace[] {
    const items = Array.isArray(rawItems) ? rawItems : [];
    if (items.length === 0) return [];

    const dedupRoots = new Map<string, any>();
    for (const root of items) {
        const id = String(root?.pro_ide ?? '');
        if (!id) continue;
        if (!dedupRoots.has(id)) dedupRoots.set(id, root);
    }

    const workspaces = Array.from(dedupRoots.values()).map((root) => normalizeWorkspace(toWorkspaceFromTreeRoot(root)));
    return workspaces.sort((a, b) => a.pro_nom.localeCompare(b.pro_nom, 'es', { sensitivity: 'base' }));
}

function findWorkspaceForSpace(workspaces: Workspace[], spaceId: string): Workspace | null {
    for (const workspace of workspaces) {
        if (workspace.spaces.some((space) => String(space.pro_ide) === String(spaceId))) {
            return workspace;
        }
    }
    return null;
}

function findWorkspaceForFolder(workspaces: Workspace[], folderId: string): Workspace | null {
    for (const workspace of workspaces) {
        if (workspace.spaces.some((space) =>
            (space.contenido?.folders ?? []).some((folder) => String(folder.pro_ide) === String(folderId))
        )) {
            return workspace;
        }
    }
    return null;
}

function findWorkspaceForList(workspaces: Workspace[], listId: string): Workspace | null {
    for (const workspace of workspaces) {
        for (const space of workspace.spaces) {
            if ((space.contenido?.listas ?? []).some((lista) => String(lista.pro_ide) === String(listId))) {
                return workspace;
            }
            if ((space.contenido?.folders ?? []).some((folder) =>
                (folder.listas ?? []).some((lista) => String(lista.pro_ide) === String(listId))
            )) {
                return workspace;
            }
        }
    }
    return null;
}

function updatePendingCountInListNode(lista: Lista, listId: string, pendingCount: number): Lista {
    if (String(lista.pro_ide) !== String(listId)) return lista;

    return {
        ...lista,
        tareas_pendientes: pendingCount,
        tareas_pendientes_total: pendingCount,
    };
}

function updatePendingCountInFolderNode(folder: Folder, listId: string, pendingCount: number): Folder {
    let changed = false;
    const listas = (folder.listas ?? []).map((lista) => {
        const updated = updatePendingCountInListNode(lista, listId, pendingCount);
        if (updated !== lista) changed = true;
        return updated;
    });

    if (!changed) return folder;

    return {
        ...folder,
        listas,
    };
}

function updatePendingCountInSpaceNode(space: Space, listId: string, pendingCount: number): Space {
    let changed = false;
    const directLists = (space.contenido?.listas ?? []).map((lista) => {
        const updated = updatePendingCountInListNode(lista, listId, pendingCount);
        if (updated !== lista) changed = true;
        return updated;
    });
    const folders = (space.contenido?.folders ?? []).map((folder) => {
        const updated = updatePendingCountInFolderNode(folder, listId, pendingCount);
        if (updated !== folder) changed = true;
        return updated;
    });

    if (!changed) return space;

    return {
        ...space,
        contenido: {
            folders,
            listas: directLists,
        },
    };
}

function updatePendingCountInWorkspaceNode(workspace: Workspace, listId: string, pendingCount: number): Workspace {
    let changed = false;
    const spaces = (workspace.spaces ?? []).map((space) => {
        const updated = updatePendingCountInSpaceNode(space, listId, pendingCount);
        if (updated !== space) changed = true;
        return updated;
    });

    if (!changed) return workspace;

    return {
        ...workspace,
        spaces,
    };
}

function updatePendingCountInWorkspaceCollection(
    workspaces: Workspace[],
    listId: string,
    pendingCount: number,
): Workspace[] {
    let changed = false;
    const next = workspaces.map((workspace) => {
        const updated = updatePendingCountInWorkspaceNode(workspace, listId, pendingCount);
        if (updated !== workspace) changed = true;
        return updated;
    });

    return changed ? next : workspaces;
}

const LAST_VIEW_PRO_IDE_COOKIE = 'last_view_pro_ide';
const WORKSPACES_CACHE_KEY = 'sk_workspaces_cache';
const GROUP_WORKSPACES_CACHE_KEY = 'sk_group_workspaces_cache';

export function DashboardProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
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
    const [miembros, setMiembros] = useState<any[]>([]);
    const { user: storeUser, token, isHydrated } = useAuthStore();

    // Track if we've already loaded data for the current session
    const hasLoadedRef = React.useRef(false);
    const lastTokenRef = React.useRef<string | null>(null);
    // Persist activeWorkspaceId automatically whenever it changes
    useEffect(() => {
        if (activeWorkspaceId) {
            localStorage.setItem('sk_active_workspace', String(activeWorkspaceId));
        }
    }, [activeWorkspaceId]);

    // Save expand state whenever it changes
    useEffect(() => {
        localStorage.setItem('sk_open_workspaces', JSON.stringify(Array.from(openWorkspaces)));
    }, [openWorkspaces]);

    useEffect(() => {
        localStorage.setItem('sk_open_spaces', JSON.stringify(Array.from(openSpaces)));
    }, [openSpaces]);

    useEffect(() => {
        localStorage.setItem('sk_open_folders', JSON.stringify(Array.from(openFolders)));
    }, [openFolders]);

    useEffect(() => {
        // Wait for store to hydrate before proceeding
        if (!isHydrated) {
            setLoading(true);
            return;
        }

        if (!token) {
            setLoading(false);
            return;
        }

        if (storeUser) {
            setUser({
                name: storeUser.usu_nom ?? storeUser.usuario ?? '',
                email: storeUser.usu_ema ?? storeUser.usuario ?? '',
            });
        }

        // Check if token changed (new login) or this is first load
        const isNewLogin = lastTokenRef.current !== null && lastTokenRef.current !== token;
        lastTokenRef.current = token;

        // If data already loaded in this session and same token, load from cache
        if (hasLoadedRef.current && !isNewLogin) {
            loadDataFromCache();
            setLoading(false);
            return;
        }

        // New login or first load - fetch from API
        hasLoadedRef.current = true;
        loadProyectosInternal(token).finally(() => setLoading(false));
    }, [token, storeUser, isHydrated]);

    useEffect(() => {
        function handleTasksUpdated(event: Event) {
            const customEvent = event as CustomEvent<TasksUpdatedDetail>;
            const proIde = String(customEvent.detail?.proIde ?? '');
            const pendingCount = customEvent.detail?.pendingCount;

            if (!proIde || typeof pendingCount !== 'number') return;

            setWorkspaces((prev) => updatePendingCountInWorkspaceCollection(prev, proIde, pendingCount));
            setGroupWorkspaces((prev) => updatePendingCountInWorkspaceCollection(prev, proIde, pendingCount));
            setSelectedLista((prev) => (
                prev && String(prev.pro_ide) === proIde
                    ? {
                        ...prev,
                        tareas_pendientes: pendingCount,
                        tareas_pendientes_total: pendingCount,
                    }
                    : prev
            ));
            setSelectedView((prev) => (
                prev?.type === 'list' && String(prev.lista.pro_ide) === proIde
                    ? {
                        type: 'list',
                        lista: {
                            ...prev.lista,
                            tareas_pendientes: pendingCount,
                            tareas_pendientes_total: pendingCount,
                        },
                    }
                    : prev
            ));
        }

        window.addEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated as EventListener);
        return () => {
            window.removeEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated as EventListener);
        };
    }, []);

    async function loadProyectosInternal(tk: string) {
        const usu_ide = storeUser?.usu_ide ?? 0;

        setLoadError('');

        try {
            const [res, groupRes] = await Promise.all([
                skambaConseguirProyectos(tk),
                skambaConseguirProyectosGrupoUsuarioPorUsuario('', usu_ide).catch(() => ({
                    success: false,
                    data: [] as any[],
                })),
            ]);

            let normalized: Workspace[] = [];
            if (res.success && res.data) {
                normalized = res.data.map(normalizeWorkspace);
            }
            setWorkspaces(normalized);

            let normalizedGroup: Workspace[] = [];
            if (groupRes.success && groupRes.data) {
                normalizedGroup = buildGroupWorkspacesFromResponse(groupRes.data);
            }
            setGroupWorkspaces(normalizedGroup);

            localStorage.setItem(WORKSPACES_CACHE_KEY, JSON.stringify(normalized));
            localStorage.setItem(GROUP_WORKSPACES_CACHE_KEY, JSON.stringify(normalizedGroup));

            const allWorkspaces = [...normalized, ...normalizedGroup];
            const allSpaces = allWorkspaces.flatMap((w) => collectSpaces(w));
            const allFolders = allWorkspaces.flatMap((w) => collectFolders(w));
            const allListas = allWorkspaces.flatMap((w) => collectListas(w));

            let nextActiveWorkspaceId: string | null = null;

            if (selectedView?.type === 'workspace') {
                nextActiveWorkspaceId = String(selectedView.workspace.pro_ide);
            }
            if (selectedView?.type === 'space') {
                nextActiveWorkspaceId = findWorkspaceForSpace(allWorkspaces, String(selectedView.space.pro_ide))?.pro_ide ?? null;
            }
            if (selectedView?.type === 'folder') {
                nextActiveWorkspaceId = findWorkspaceForFolder(allWorkspaces, String(selectedView.folder.pro_ide))?.pro_ide ?? null;
            }
            if (selectedView?.type === 'list') {
                nextActiveWorkspaceId = findWorkspaceForList(allWorkspaces, String(selectedView.lista.pro_ide))?.pro_ide ?? null;
            }

            if (!nextActiveWorkspaceId) {
                const cookieListId = String(getCookie(LAST_VIEW_PRO_IDE_COOKIE) ?? '');
                if (cookieListId) {
                    nextActiveWorkspaceId = findWorkspaceForList(allWorkspaces, cookieListId)?.pro_ide ?? null;
                }
            }

            if (!nextActiveWorkspaceId) {
                try {
                    const saved = localStorage.getItem('sk_selected_view');
                    if (saved) {
                        const { type, id } = JSON.parse(saved) as { type: string; id: string };
                        if (type === 'workspace') nextActiveWorkspaceId = String(id);
                        if (type === 'space') nextActiveWorkspaceId = findWorkspaceForSpace(allWorkspaces, String(id))?.pro_ide ?? null;
                        if (type === 'folder') nextActiveWorkspaceId = findWorkspaceForFolder(allWorkspaces, String(id))?.pro_ide ?? null;
                        if (type === 'list') nextActiveWorkspaceId = findWorkspaceForList(allWorkspaces, String(id))?.pro_ide ?? null;
                    }
                } catch { }
            }

            if (allWorkspaces.length > 0) {
                setActiveWorkspaceId((prev) => {
                    if (nextActiveWorkspaceId) {
                        const selectedWorkspace = allWorkspaces.find((w) => String(w.pro_ide) === String(nextActiveWorkspaceId));
                        if (selectedWorkspace) return String(selectedWorkspace.pro_ide);
                    }

                    const exists = allWorkspaces.find((w) => String(w.pro_ide) === String(prev));
                    if (exists) return String(exists.pro_ide);

                    const savedActiveWs = localStorage.getItem('sk_active_workspace');
                    if (savedActiveWs) {
                        const saved = allWorkspaces.find((w) => String(w.pro_ide) === String(savedActiveWs));
                        if (saved) return String(saved.pro_ide);
                    }

                    return String(allWorkspaces[0].pro_ide);
                });
            }

            setSelectedView((prev) => {
                if (prev !== null) {
                    if (prev.type === 'list') {
                        const fresh = allListas.find((l) => String(l.pro_ide) === String(prev.lista.pro_ide));
                        return fresh ? { type: 'list', lista: fresh } : prev;
                    }
                    if (prev.type === 'folder') {
                        const fresh = allFolders.find((f) => String(f.pro_ide) === String(prev.folder.pro_ide));
                        return fresh ? { type: 'folder', folder: fresh } : prev;
                    }
                    if (prev.type === 'workspace') {
                        const fresh = allWorkspaces.find((w) => String(w.pro_ide) === String(prev.workspace.pro_ide));
                        return fresh ? { type: 'workspace', workspace: fresh } : prev;
                    }
                    if (prev.type === 'space') {
                        const fresh = allSpaces.find((s) => String(s.pro_ide) === String(prev.space.pro_ide));
                        return fresh ? { type: 'space', space: fresh } : prev;
                    }
                    return prev;
                }

                try {
                    const cookieListId = String(getCookie(LAST_VIEW_PRO_IDE_COOKIE) ?? '');
                    if (cookieListId) {
                        const lista = allListas.find((l) => String(l.pro_ide) === cookieListId);
                        if (lista) {
                            const workspace = findWorkspaceForList(allWorkspaces, String(lista.pro_ide));
                            if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
                            return { type: 'list', lista };
                        }
                    }

                    const saved = localStorage.getItem('sk_selected_view');
                    if (saved) {
                        const { type, id } = JSON.parse(saved) as { type: string; id: string };

                        if (type === 'list') {
                            const lista = allListas.find((l) => String(l.pro_ide) === String(id));
                            if (lista) {
                                const workspace = findWorkspaceForList(allWorkspaces, String(lista.pro_ide));
                                if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
                                return { type: 'list', lista };
                            }
                        }
                        if (type === 'folder') {
                            const folder = allFolders.find((f) => String(f.pro_ide) === String(id));
                            if (folder) {
                                const workspace = findWorkspaceForFolder(allWorkspaces, String(folder.pro_ide));
                                if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
                                return { type: 'folder', folder };
                            }
                        }
                        if (type === 'space') {
                            const space = allSpaces.find((s) => String(s.pro_ide) === String(id));
                            if (space) {
                                const workspace = findWorkspaceForSpace(allWorkspaces, String(space.pro_ide));
                                if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
                                return { type: 'space', space };
                            }
                        }
                        if (type === 'workspace') {
                            const ws = allWorkspaces.find((w) => String(w.pro_ide) === String(id));
                            if (ws) {
                                setActiveWorkspaceId(String(ws.pro_ide));
                                return { type: 'workspace', workspace: ws };
                            }
                        }
                    }
                } catch { }

                return prev;
            });

            setSelectedLista((prev) => {
                if (prev !== null) {
                    const fresh = allListas.find((l) => String(l.pro_ide) === String(prev.pro_ide));
                    return fresh ?? prev;
                }

                const saved = localStorage.getItem('sk_selected_view');
                const cookieListId = String(getCookie(LAST_VIEW_PRO_IDE_COOKIE) ?? '');
                if (cookieListId) {
                    return allListas.find((l) => String(l.pro_ide) === cookieListId) ?? prev;
                }
                if (saved) {
                    const { type, id } = JSON.parse(saved);
                    if (type === 'list') {
                        return allListas.find((l) => String(l.pro_ide) === String(id)) ?? null;
                    }
                }

                return prev;
            });

            if (openWorkspaces.size === 0) {
                setOpenWorkspaces(new Set(allWorkspaces.map((w) => w.pro_ide)));
                setOpenSpaces(new Set(allSpaces.map((s) => s.pro_ide)));
                setOpenFolders(new Set(allFolders.map((f) => f.pro_ide)));
            }
        } catch {
            setLoadError('Error al cargar proyectos');
        }
    }

    function loadDataFromCache() {
        try {
            const cachedWorkspaces = localStorage.getItem(WORKSPACES_CACHE_KEY);
            const cachedGroupWs = localStorage.getItem(GROUP_WORKSPACES_CACHE_KEY);
            const personalData = cachedWorkspaces ? JSON.parse(cachedWorkspaces) as Workspace[] : [];
            const groupData = cachedGroupWs ? JSON.parse(cachedGroupWs) as Workspace[] : [];
            const allWorkspaces = [...personalData, ...groupData];
            if (allWorkspaces.length > 0) {
                setWorkspaces(personalData);
                setGroupWorkspaces(groupData);

                const cachedOpenWs = localStorage.getItem('sk_open_workspaces');
                const cachedOpenSpaces = localStorage.getItem('sk_open_spaces');
                const cachedOpenFolders = localStorage.getItem('sk_open_folders');

                if (cachedOpenWs) {
                    setOpenWorkspaces(new Set(JSON.parse(cachedOpenWs)));
                } else {
                    setOpenWorkspaces(new Set(allWorkspaces.map((w) => w.pro_ide)));
                }

                if (cachedOpenSpaces) {
                    setOpenSpaces(new Set(JSON.parse(cachedOpenSpaces)));
                } else {
                    const allSpaces = allWorkspaces.flatMap((w) => collectSpaces(w));
                    setOpenSpaces(new Set(allSpaces.map((s) => s.pro_ide)));
                }

                if (cachedOpenFolders) {
                    setOpenFolders(new Set(JSON.parse(cachedOpenFolders)));
                } else {
                    const allFolders = allWorkspaces.flatMap((w) => collectFolders(w));
                    setOpenFolders(new Set(allFolders.map((f) => f.pro_ide)));
                }

                const savedActiveWs = localStorage.getItem('sk_active_workspace');
                if (savedActiveWs) {
                    const exists = allWorkspaces.find((w) => String(w.pro_ide) === String(savedActiveWs));
                    if (exists) {
                        setActiveWorkspaceId(savedActiveWs);
                    }
                } else if (allWorkspaces.length > 0) {
                    setActiveWorkspaceId(allWorkspaces[0].pro_ide);
                }

                const savedView = localStorage.getItem('sk_selected_view');
                const cookieListId = String(getCookie(LAST_VIEW_PRO_IDE_COOKIE) ?? '');
                if (cookieListId) {
                    const allListas = allWorkspaces.flatMap((w) => collectListas(w));
                    const lista = allListas.find((l) => String(l.pro_ide) === cookieListId);
                    if (lista) {
                        const workspace = findWorkspaceForList(allWorkspaces, String(lista.pro_ide));
                        if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
                        setSelectedView({ type: 'list', lista });
                        setSelectedLista(lista);
                        return;
                    }
                }
                if (savedView) {
                    try {
                        const { type, id } = JSON.parse(savedView) as { type: string; id: string };
                        const allListas = allWorkspaces.flatMap((w) => collectListas(w));
                        const allFolders = allWorkspaces.flatMap((w) => collectFolders(w));
                        const allSpaces = allWorkspaces.flatMap((w) => collectSpaces(w));

                        if (type === 'list') {
                            const lista = allListas.find((l) => String(l.pro_ide) === String(id));
                            if (lista) {
                                const workspace = findWorkspaceForList(allWorkspaces, String(lista.pro_ide));
                                if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
                                setSelectedView({ type: 'list', lista });
                                setSelectedLista(lista);
                                return;
                            }
                        } else if (type === 'folder') {
                            const folder = allFolders.find((f) => String(f.pro_ide) === String(id));
                            if (folder) {
                                const workspace = findWorkspaceForFolder(allWorkspaces, String(folder.pro_ide));
                                if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
                                setSelectedView({ type: 'folder', folder });
                                setSelectedLista(null);
                                return;
                            }
                        } else if (type === 'space') {
                            const space = allSpaces.find((s) => String(s.pro_ide) === String(id));
                            if (space) {
                                const workspace = findWorkspaceForSpace(allWorkspaces, String(space.pro_ide));
                                if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
                                setSelectedView({ type: 'space', space });
                                setSelectedLista(null);
                                return;
                            }
                        } else if (type === 'workspace') {
                            const ws = allWorkspaces.find((w) => String(w.pro_ide) === String(id));
                            if (ws) {
                                setActiveWorkspaceId(String(ws.pro_ide));
                                setSelectedView({ type: 'workspace', workspace: ws });
                                setSelectedLista(null);
                                return;
                            }
                        } else if (type === 'group') {
                            // Groups are handled separately via selectGrupo
                            setSelectedView(null);
                            setSelectedLista(null);
                            return;
                        }
                    } catch {
                        // If parsing fails, just ignore
                    }
                }
            }
        } catch {
            // If cache is corrupted, ignore and let normal flow handle it
        }
    }
    async function loadProyectos() {
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
        if (!name.trim() || !token) return false;
        const usu_ide = storeUser?.usu_ide ?? 0;
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

    async function createItem(parentId: string, type: 'space' | 'folder' | 'list', name: string, estIdes?: number[]) {
        if (!name.trim() || !token) return false;
        const usu_ide = storeUser?.usu_ide ?? 0;
        try {
            const res = await skambaCrearProyecto(Number(parentId), name.trim(), usu_ide, token, type, type === 'list' ? estIdes : undefined);
            if (!res.success) return false;

            const createdId = String(res.pro_ide ?? '');
            if (type === 'space') setOpenSpaces((p) => new Set([...p, createdId]));
            if (type === 'folder') {
                setOpenSpaces((p) => new Set([...p, parentId]));
                if (createdId) setOpenFolders((p) => new Set([...p, createdId]));
            }
            if (type === 'list') setOpenFolders((p) => new Set([...p, parentId]));

            await loadProyectosInternal(token);
            return true;
        } catch { return false; }
    }

    async function renameItem(pro_ide: string, newName: string) {
        if (!newName.trim() || !token) return false;
        try {
            const res = await skambaEditarProyecto(token, Number(pro_ide), newName.trim());
            if (!res.success) return false;
            await loadProyectosInternal(token);
            return true;
        } catch { return false; }
    }

    async function deleteItem(pro_ide: string) {
        if (!token) return false;
        try {
            const res = await skambaEliminarProyecto(token, Number(pro_ide));
            if (!res.success) return false;
            setSelectedView(null);
            setSelectedLista(null);
            localStorage.removeItem('sk_selected_view');
            await loadProyectosInternal(token);
            return true;
        } catch { return false; }
    }

    function selectWorkspace(ws: Workspace) {
        setActiveWorkspaceId(ws.pro_ide);
        setSelectedView({ type: 'workspace', workspace: ws });
        setSelectedLista(null);
        deleteCookie(LAST_VIEW_PRO_IDE_COOKIE);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'workspace', id: ws.pro_ide }));
        // Keep selection changes inside the persistent /dashboard shell whenever possible.
        // For future edits / LLMs: avoid navigation patterns that remount the dashboard layout/sidebar.
        if (pathname !== '/dashboard') router.push('/dashboard');
    }

    function selectSpace(space: Space, workspaceId?: string) {
        if (workspaceId) setActiveWorkspaceId(workspaceId);
        setSelectedView({ type: 'space', space });
        setSelectedLista(null);
        deleteCookie(LAST_VIEW_PRO_IDE_COOKIE);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'space', id: space.pro_ide }));
        if (pathname !== '/dashboard') router.push('/dashboard');
    }

    function selectFolder(folder: Folder) {
        const allWorkspaces = [...workspaces, ...groupWorkspaces];
        const workspace = findWorkspaceForFolder(allWorkspaces, String(folder.pro_ide));
        if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
        setSelectedView({ type: 'folder', folder });
        setSelectedLista(null);
        deleteCookie(LAST_VIEW_PRO_IDE_COOKIE);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'folder', id: folder.pro_ide }));
        if (pathname !== '/dashboard') router.push('/dashboard');
    }

    function selectLista(lista: Lista) {
        const allWorkspaces = [...workspaces, ...groupWorkspaces];
        const workspace = findWorkspaceForList(allWorkspaces, String(lista.pro_ide));
        if (workspace) setActiveWorkspaceId(String(workspace.pro_ide));
        setCookie(LAST_VIEW_PRO_IDE_COOKIE, String(lista.pro_ide), { sameSite: 'lax' });
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'list', id: lista.pro_ide }));
        setSelectedView({ type: 'list', lista });
        setSelectedLista(lista);

        if (pathname !== '/dashboard') router.push('/dashboard');
    }

    function selectGrupo(grupo: Grupo) {
        setSelectedView({ type: 'group', grupo });
        setSelectedLista(null);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'group', id: String(grupo.gru_ide) }));
        if (pathname !== '/dashboard') router.push('/dashboard');
    }

    const { logout: authLogout } = useAuth();
    function logout() {
        // Clear all cached data on logout
        localStorage.removeItem('sk_group_workspaces_cache');
        localStorage.removeItem('sk_open_workspaces');
        localStorage.removeItem('sk_open_spaces');
        localStorage.removeItem('sk_open_folders');
        localStorage.removeItem('sk_active_workspace');
        localStorage.removeItem('sk_selected_view');

        // Reset state
        setGroupWorkspaces([]);
        setWorkspaces([]);
        setSelectedView(null);
        setSelectedLista(null);
        setOpenWorkspaces(new Set());
        setOpenSpaces(new Set());
        setOpenFolders(new Set());

        // Reset refs for next login
        hasLoadedRef.current = false;
        lastTokenRef.current = null;

        authLogout();
    }

    const activeWorkspace =
        workspaces.find((w) => String(w.pro_ide) === String(activeWorkspaceId)) ||
        groupWorkspaces.find((w) => String(w.pro_ide) === String(activeWorkspaceId)) ||
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
            renameItem,
            deleteItem,
            selectGrupo,
            logout,
            loadProyectos,
            creatingWs,
            setCreatingWs,
            wsLoading,
            wsError,
            miembros,
            setMiembros,
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
