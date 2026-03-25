'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    skambaConseguirProyectos,
    skambaConseguirProyectosGrupoUsuarioPorUsuario,
    skambaConseguirProyecto,
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

function toListaFromNode(node: any, parentId: string): Lista {
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

    return {
        pro_ide: String(node?.pro_ide ?? ''),
        pro_nom: String(node?.pro_nom ?? 'Folder'),
        usu_ide: String(node?.usu_ide ?? '0'),
        pro_pad: parentId,
        est_ado: String(node?.proyecto_estado ?? node?.pro_est_ado ?? node?.est_ado ?? '1'),
        pro_tip: 'folder',
        listas,
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

    return {
        pro_ide: String(node?.pro_ide ?? ''),
        pro_nom: String(node?.pro_nom ?? 'Space'),
        usu_ide: String(node?.usu_ide ?? '0'),
        pro_pad: parentId,
        est_ado: String(node?.proyecto_estado ?? node?.pro_est_ado ?? node?.est_ado ?? '1'),
        pro_tip: 'space',
        contenido: { folders, listas },
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
    };
}

function toWorkspaceFromTreeRoot(node: any): Workspace {
    const tip = String(node?.pro_tip ?? '').toLowerCase();
    const proIde = String(node?.pro_ide ?? '');
    const ws = {
        pro_ide: proIde,
        pro_nom: String(node?.pro_nom ?? 'Workspace'),
        usu_ide: String(node?.usu_ide ?? '0'),
        pro_pad: String(node?.pro_pad ?? '0'),
        est_ado: String(node?.proyecto_estado ?? node?.pro_est_ado ?? node?.est_ado ?? '1'),
        pro_tip: 'workspace',
        spaces: [],
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
        return ws;
    }

    if (tip === 'space') {
        ws.spaces.push(toSpaceFromNode(node, ws.pro_ide));
        return ws;
    }

    const synthetic = createSyntheticSpaceForWorkspace(ws);
    if (tip === 'folder') synthetic.contenido.folders.push(toFolderFromNode(node, synthetic.pro_ide));
    if (tip === 'list') synthetic.contenido.listas.push(toListaFromNode(node, synthetic.pro_ide));
    ws.spaces.push(synthetic);
    return ws;
}

function buildGroupWorkspacesFromFlat(rawItems: any[]): Workspace[] {
    const dedupByProId = new Map<string, any>();
    for (const item of rawItems) {
        const id = String(item?.pro_ide ?? '');
        if (!id) continue;
        if (!dedupByProId.has(id)) dedupByProId.set(id, item);
    }

    const wsById = new Map<string, Workspace>();
    const spaceById = new Map<string, Space>();
    const folderById = new Map<string, Folder>();
    const listById = new Map<string, Lista>();

    for (const item of dedupByProId.values()) {
        const id = String(item.pro_ide);
        const parentId = String(item.pro_pad ?? '0');
        const estado = String(item.proyecto_estado ?? item.pro_est_ado ?? '1');
        const usuIde = String(item.usu_ide ?? '0');
        const tip = String(item.pro_tip ?? '').toLowerCase();

        if (tip === 'workspace') {
            wsById.set(id, {
                pro_ide: id,
                pro_nom: String(item.pro_nom ?? 'Workspace'),
                usu_ide: usuIde,
                pro_pad: parentId,
                est_ado: estado,
                pro_tip: 'workspace',
                spaces: [],
            });
        }

        if (tip === 'space') {
            spaceById.set(id, {
                pro_ide: id,
                pro_nom: String(item.pro_nom ?? 'Space'),
                usu_ide: usuIde,
                pro_pad: parentId,
                est_ado: estado,
                pro_tip: 'space',
                contenido: { folders: [], listas: [] },
            });
        }

        if (tip === 'folder') {
            folderById.set(id, {
                pro_ide: id,
                pro_nom: String(item.pro_nom ?? 'Folder'),
                usu_ide: usuIde,
                pro_pad: parentId,
                est_ado: estado,
                pro_tip: 'folder',
                listas: [],
            });
        }

        if (tip === 'list') {
            listById.set(id, {
                pro_ide: id,
                pro_nom: String(item.pro_nom ?? 'Lista'),
                usu_ide: usuIde,
                pro_pad: parentId,
                est_ado: estado,
                pro_tip: 'list',
                tareas: [],
                estados: [],
                miembros: [],
            });
        }
    }

    for (const space of spaceById.values()) {
        const parentWs = wsById.get(space.pro_pad);
        if (parentWs && !parentWs.spaces.some((s) => s.pro_ide === space.pro_ide)) {
            parentWs.spaces.push(space);
        }
    }

    for (const folder of folderById.values()) {
        const parentSpace = spaceById.get(folder.pro_pad);
        if (parentSpace && !parentSpace.contenido.folders.some((f) => f.pro_ide === folder.pro_ide)) {
            parentSpace.contenido.folders.push(folder);
        }
    }

    for (const lista of listById.values()) {
        const parentFolder = folderById.get(lista.pro_pad);
        if (parentFolder) {
            if (!parentFolder.listas.some((l) => l.pro_ide === lista.pro_ide)) {
                parentFolder.listas.push(lista);
            }
            continue;
        }

        const parentSpace = spaceById.get(lista.pro_pad);
        if (parentSpace && !parentSpace.contenido.listas.some((l) => l.pro_ide === lista.pro_ide)) {
            parentSpace.contenido.listas.push(lista);
        }
    }

    const sortByName = <T extends { pro_nom: string }>(arr: T[]) => {
        arr.sort((a, b) => a.pro_nom.localeCompare(b.pro_nom, 'es', { sensitivity: 'base' }));
    };

    for (const ws of wsById.values()) {
        sortByName(ws.spaces);
        for (const sp of ws.spaces) {
            sortByName(sp.contenido.folders);
            sortByName(sp.contenido.listas);
            for (const fo of sp.contenido.folders) sortByName(fo.listas);
        }
    }

    return Array.from(wsById.values()).sort((a, b) => a.pro_nom.localeCompare(b.pro_nom, 'es', { sensitivity: 'base' }));
}

function buildGroupWorkspacesFromResponse(rawItems: any[]): Workspace[] {
    const items = Array.isArray(rawItems) ? rawItems : [];
    if (items.length === 0) return [];

    const hasTreeResponse = items.some((item) => Array.isArray(item?.children));
    if (!hasTreeResponse) {
        return buildGroupWorkspacesFromFlat(items).map(normalizeWorkspace);
    }

    const dedupRoots = new Map<string, any>();
    for (const root of items) {
        const id = String(root?.pro_ide ?? '');
        if (!id) continue;
        if (!dedupRoots.has(id)) dedupRoots.set(id, root);
    }

    const workspaces = Array.from(dedupRoots.values()).map((root) => normalizeWorkspace(toWorkspaceFromTreeRoot(root)));
    return workspaces.sort((a, b) => a.pro_nom.localeCompare(b.pro_nom, 'es', { sensitivity: 'base' }));
}

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
    const { user: storeUser, token } = useAuthStore();

    // Persist activeWorkspaceId automatically whenever it changes
    useEffect(() => {
        if (activeWorkspaceId) {
            localStorage.setItem('sk_active_workspace', String(activeWorkspaceId));
        }
    }, [activeWorkspaceId]);

    useEffect(() => {
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

        loadProyectosInternal(token).finally(() => setLoading(false));
    }, [token, storeUser]);

    async function loadProyectosInternal(tk: string) {
        const usu_ide = storeUser?.usu_ide ?? 0;
        // Proceed even if usu_ide is missing, as the main call only needs the token

        setLoadError('');
        try {
            const [res, groupRes] = await Promise.all([
                skambaConseguirProyectos(tk),
                // Reemplaza al endpoint anterior que pintaba workspaces de grupo.
                skambaConseguirProyectosGrupoUsuarioPorUsuario('', usu_ide).catch(() => ({ success: false, data: [] as any[] })),
            ]);

            let normalizedGroup: Workspace[] = [];
            if (groupRes.success && groupRes.data) {
                const groupItems = Array.isArray(groupRes.data) ? groupRes.data : [];
                normalizedGroup = buildGroupWorkspacesFromResponse(groupItems);
            }
            setGroupWorkspaces(normalizedGroup);

            let normalized: Workspace[] = [];
            if (res.success && res.data) {
                normalized = res.data.map(normalizeWorkspace);
                setWorkspaces(normalized);
            }

            const allWorkspaces = [...normalized, ...normalizedGroup];
            const allSpaces = allWorkspaces.flatMap((w) => collectSpaces(w));
            const allFolders = allWorkspaces.flatMap((w) => collectFolders(w));
            const allListas = allWorkspaces.flatMap((w) => collectListas(w));

            // Set default active workspace if none selected or current is invalid
            if (allWorkspaces.length > 0) {
                setActiveWorkspaceId((prev) => {
                    const inPersonal = normalized.find((w) => w.pro_ide === prev);
                    if (inPersonal) return prev;
                    const inGroup = normalizedGroup.find((w) => w.pro_ide === prev);
                    if (inGroup) return prev;

                    const savedActiveWs = localStorage.getItem('sk_active_workspace');
                    if (savedActiveWs) {
                        const inAll = allWorkspaces.find((w) => String(w.pro_ide) === String(savedActiveWs));
                        if (inAll) return inAll.pro_ide;
                    }
                    return allWorkspaces[0].pro_ide;
                });
            }

            // Sync selectedView and selectedLista
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
                        const fresh = allWorkspaces.find((w) => w.pro_ide === prev.workspace.pro_ide);
                        return fresh ? { type: 'workspace', workspace: fresh } : prev;
                    }
                    if (prev.type === 'space') {
                        const fresh = allSpaces.find((s) => s.pro_ide === prev.space.pro_ide);
                        return fresh ? { type: 'space', space: fresh } : prev;
                    }
                    return prev;
                }

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
                            const ws = allWorkspaces.find((w) => String(w.pro_ide) === String(id));
                            if (ws) return { type: 'workspace', workspace: ws };
                        }
                    }
                } catch { /* ignore */ }
                return prev;
            });

            setSelectedLista((prev) => {
                if (prev !== null) {
                    const fresh = allListas.find((l) => l.pro_ide === prev.pro_ide);
                    return fresh ?? prev;
                }
                const saved = localStorage.getItem('sk_selected_view');
                if (saved) {
                    const { type, id } = JSON.parse(saved);
                    if (type === 'list') return allListas.find((l) => String(l.pro_ide) === String(id)) ?? null;
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
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'workspace', id: ws.pro_ide }));
        if (pathname !== '/dashboard') router.push('/dashboard');
    }

    function selectSpace(space: Space, workspaceId?: string) {
        if (workspaceId) setActiveWorkspaceId(workspaceId);
        setSelectedView({ type: 'space', space });
        setSelectedLista(null);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'space', id: space.pro_ide }));
        if (pathname !== '/dashboard') router.push('/dashboard');
    }

    function selectFolder(folder: Folder) {
        setSelectedView({ type: 'folder', folder });
        setSelectedLista(null);
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'folder', id: folder.pro_ide }));
        if (pathname !== '/dashboard') router.push('/dashboard');
    }

    function selectLista(lista: Lista) {
        localStorage.setItem('sk_selected_view', JSON.stringify({ type: 'list', id: lista.pro_ide }));

        // Para listas de grupo, el árbol puede venir sin tareas; intentamos traer el detalle real por pro_ide.
        if (token) {
            skambaConseguirProyecto(token, Number(lista.pro_ide))
                .then((res) => {
                    if (res.success && res.data && (res.data as any).pro_tip === 'list') {
                        const fresh = res.data as Lista;
                        setSelectedView({ type: 'list', lista: fresh });
                        setSelectedLista(fresh);
                        return;
                    }
                    setSelectedView({ type: 'list', lista });
                    setSelectedLista(lista);
                })
                .catch(() => {
                    setSelectedView({ type: 'list', lista });
                    setSelectedLista(lista);
                });
        } else {
            setSelectedView({ type: 'list', lista });
            setSelectedLista(lista);
        }

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
        authLogout();
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
