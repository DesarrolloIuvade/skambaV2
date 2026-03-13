'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import {
    skambaConseguirGruposUsuario,
    skambaConseguirProyectosGrupo,
    skambaConseguirProyectosGrupoUsuario,
    skambaConseguirMiembros,
    skambaAgregarGrupoProyecto,
    skambaEliminarGrupoProyecto,
    skambaAgregarUsuarioProyectoMiembro,
    skambaCrearGrupo,
    skambaAgregarMiembro,
    skambaEliminarMiembro,
} from '../lib/api';
import { useAuthStore } from '../context/useAuthStore';
import type { Grupo, Miembro, ProyectoGrupo } from '../lib/types/grupo';
import type { Workspace, Space, Folder, Lista } from '../lib/types/proyecto';

export function GrupoView({ grupo }: { grupo?: Grupo }) {
    const { workspaces, loadProyectos } = useDashboard();

    // Lista de todos los grupos del usuario
    const [allGrupos, setAllGrupos] = useState<Grupo[]>([]);
    const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(grupo ?? null);
    const [loadingGrupos, setLoadingGrupos] = useState(true);

    // Proyectos del grupo seleccionado
    const [proyectos, setProyectos] = useState<ProyectoGrupo[]>([]);
    const [loadingProyectos, setLoadingProyectos] = useState(false);

    // Miembros del grupo seleccionado
    const [miembros, setMiembros] = useState<Miembro[]>([]);
    const [loadingMiembros, setLoadingMiembros] = useState(false);

    // Crear grupo
    const [showCreateGrupo, setShowCreateGrupo] = useState(false);
    const [newGrupoName, setNewGrupoName] = useState('');
    const [creatingGrupo, setCreatingGrupo] = useState(false);

    // Agregar miembro
    const [showAddMember, setShowAddMember] = useState(false);
    const [emailMiembro, setEmailMiembro] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    // Agregar proyecto
    const [showAddProyecto, setShowAddProyecto] = useState(false);
    const [selectedProyecto, setSelectedProyecto] = useState<string | ''>('');
    const [addingProyecto, setAddingProyecto] = useState(false);

    // Asignar miembro a proyecto (card inline)
    const [assigningKey, setAssigningKey] = useState<string | null>(null);

    // Modal de asignación: tras vincular workspace o agregar miembro
    type AssignModal =
        | { type: 'membersToProject'; pro_ide: number; pro_nom: string }
        | { type: 'projectsToMember'; usu_ide: number; usu_nom: string }
        | null;
    const [assignModal, setAssignModal] = useState<AssignModal>(null);
    const [assignSelected, setAssignSelected] = useState<Set<number>>(new Set());
    const [assigning, setAssigning] = useState(false);

    // Acceso de miembros a proyectos: Map<usu_ide, Set<pro_ide>>
    const [memberAccess, setMemberAccess] = useState<Map<number, Set<string>>>(new Map());

    const { user: storeUser } = useAuthStore();
    const usuIde = storeUser?.usu_ide ?? 0;

    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);


    useEffect(() => {
        loadGrupos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedGrupo) {
            loadProyectosGrupo();
            loadMiembros();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedGrupo?.gru_ide]);

    async function loadGrupos() {
        setLoadingGrupos(true);
        try {
            const res = await skambaConseguirGruposUsuario('', usuIde);
            if (res.success && res.data) {
                setAllGrupos(res.data);
                if (res.data.length > 0 && !selectedGrupo) {
                    setSelectedGrupo(res.data[0]);
                }
            }
        } catch {
            // silently ignore
        }
        setLoadingGrupos(false);
    }

    function collectProIds(node: unknown): Set<string> {
        const ids = new Set<string>();
        if (!node || typeof node !== 'object') return ids;
        if (Array.isArray(node)) {
            for (const item of node) for (const id of collectProIds(item)) ids.add(id);
            return ids;
        }
        const obj = node as Record<string, unknown>;
        if (obj.pro_ide != null) ids.add(String(obj.pro_ide));
        for (const val of Object.values(obj)) {
            if (val && typeof val === 'object') for (const id of collectProIds(val)) ids.add(id);
        }
        return ids;
    }

    interface FlatItem {
        pro_ide: string;
        pro_nom: string;
        pro_tip: string;
        path: string;
        depth: number;
    }

    function flattenAllItems(wss: Workspace[]): FlatItem[] {
        const items: FlatItem[] = [];
        for (const ws of wss) {
            items.push({ pro_ide: ws.pro_ide, pro_nom: ws.pro_nom, pro_tip: ws.pro_tip ?? 'workspace', path: ws.pro_nom, depth: 0 });
            for (const space of (ws.spaces ?? [])) {
                items.push({ pro_ide: space.pro_ide, pro_nom: space.pro_nom, pro_tip: space.pro_tip ?? 'space', path: `${ws.pro_nom} › ${space.pro_nom}`, depth: 1 });
                for (const folder of (space.contenido?.folders ?? [])) {
                    items.push({ pro_ide: folder.pro_ide, pro_nom: folder.pro_nom, pro_tip: folder.pro_tip ?? 'folder', path: `${ws.pro_nom} › ${space.pro_nom} › ${folder.pro_nom}`, depth: 2 });
                    for (const lista of (folder.listas ?? [])) {
                        items.push({ pro_ide: lista.pro_ide, pro_nom: lista.pro_nom, pro_tip: lista.pro_tip ?? 'list', path: `${ws.pro_nom} › ${space.pro_nom} › ${folder.pro_nom} › ${lista.pro_nom}`, depth: 3 });
                    }
                }
                for (const lista of (space.contenido?.listas ?? [])) {
                    items.push({ pro_ide: lista.pro_ide, pro_nom: lista.pro_nom, pro_tip: lista.pro_tip ?? 'list', path: `${ws.pro_nom} › ${space.pro_nom} › ${lista.pro_nom}`, depth: 2 });
                }
            }
        }
        return items;
    }

    function tipStyle(tip: string) {
        switch (tip) {
            case 'space': return { label: 'Space', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
            case 'folder': return { label: 'Folder', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
            case 'list': return { label: 'Lista', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
            default: return { label: 'Workspace', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' };
        }
    }

    async function loadProyectosGrupo() {
        if (!selectedGrupo) return;
        setLoadingProyectos(true);
        try {
            const res = await skambaConseguirProyectosGrupo('', usuIde, selectedGrupo.gru_ide);
            if (res.success && res.data) {
                setProyectos(res.data);
            }
        } catch {
            // silently ignore
        }
        setLoadingProyectos(false);
    }

    async function loadMiembros() {
        if (!selectedGrupo) return;
        setLoadingMiembros(true);
        try {
            const res = await skambaConseguirMiembros('', selectedGrupo.gru_ide);
            if (res.success && res.data) {
                setMiembros(res.data);
                // Cargar acceso de cada miembro a proyectos
                const entries = await Promise.all(
                    res.data.map(async (m): Promise<[number, Set<string>]> => {
                        try {
                            const r = await skambaConseguirProyectosGrupoUsuario('', selectedGrupo.gru_ide, m.usu_ide);
                            if (r.success && r.data) {
                                return [m.usu_ide, collectProIds(r.data)];
                            }
                        } catch {
                            // silently ignore
                        }
                        return [m.usu_ide, new Set<string>()];
                    })
                );
                setMemberAccess(new Map(entries));
            }
        } catch {
            // silently ignore
        }
        setLoadingMiembros(false);
    }

    async function handleCreateGrupo(e: React.FormEvent) {
        e.preventDefault();
        if (!newGrupoName.trim()) return;
        setCreatingGrupo(true);
        setMessage(null);
        try {
            const res = await skambaCrearGrupo('', newGrupoName.trim(), usuIde);
            if (res.success && res.gru_ide) {
                setMessage({ text: `Grupo "${newGrupoName}" creado exitosamente.`, type: 'success' });
                setNewGrupoName('');
                setShowCreateGrupo(false);
                await loadGrupos();
            } else {
                setMessage({ text: 'Error al crear grupo', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error al crear grupo', type: 'error' });
        }
        setCreatingGrupo(false);
    }

    async function handleAddMember(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedGrupo || !emailMiembro.trim()) return;
        setAddingMember(true);
        setMessage(null);
        try {
            const res = await skambaAgregarMiembro('', selectedGrupo.gru_ide, emailMiembro.trim());
            if (res.success) {
                const nuevoUsuIde = res.usu_ide;
                const nuevoUsuNom = res.usu_nom;
                setEmailMiembro('');
                setShowAddMember(false);
                await loadMiembros();
                // Abrir modal para asignar workspaces al nuevo miembro
                if (proyectos.length > 0) {
                    setAssignSelected(new Set(proyectos.map(p => p.pro_ide)));
                    setAssignModal({ type: 'projectsToMember', usu_ide: nuevoUsuIde, usu_nom: nuevoUsuNom });
                } else {
                    setMessage({ text: 'Miembro agregado al grupo.', type: 'success' });
                }
            } else {
                setMessage({ text: res.message || 'Error al agregar miembro', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error al agregar miembro', type: 'error' });
        }
        setAddingMember(false);
    }

    async function handleRemoveMember(usuIdeToRemove: number) {
        if (!selectedGrupo) return;
        setMessage(null);
        try {
            const res = await skambaEliminarMiembro('', selectedGrupo.gru_ide, usuIdeToRemove);
            if (res.success) {
                setMessage({ text: 'Miembro eliminado del grupo.', type: 'success' });
                await loadMiembros();
            } else {
                setMessage({ text: res.message || 'Error al eliminar miembro', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error al eliminar miembro', type: 'error' });
        }
    }

    async function handleAddProyecto(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedGrupo || !selectedProyecto) return;
        setAddingProyecto(true);
        setMessage(null);
        try {
            const proIde = Number(selectedProyecto);
            const res = await skambaAgregarGrupoProyecto('', selectedGrupo.gru_ide, proIde);
            if (res.success) {
                const wsName = flattenAllItems(workspaces).find(item => String(item.pro_ide) === String(selectedProyecto))?.pro_nom ?? '';
                const currentUserId = usuIde;

                // El usuario logeado se asigna automáticamente
                await skambaAgregarUsuarioProyectoMiembro('', selectedGrupo.gru_ide, currentUserId, proIde).catch(() => null);

                setSelectedProyecto('');
                setShowAddProyecto(false);
                await loadProyectosGrupo();
                await loadProyectos();

                // Modal solo para los otros miembros del grupo
                const otherMembers = miembros.filter(m => m.usu_ide !== currentUserId);
                if (otherMembers.length > 0) {
                    setAssignSelected(new Set(otherMembers.map(m => m.usu_ide)));
                    setAssignModal({ type: 'membersToProject', pro_ide: proIde, pro_nom: wsName });
                } else {
                    setMessage({ text: 'Elemento vinculado al grupo.', type: 'success' });
                }
            } else {
                setMessage({ text: res.message || 'Error al agregar proyecto', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error al agregar proyecto', type: 'error' });
        }
        setAddingProyecto(false);
    }

    async function handleAssignSubmit() {
        if (!assignModal || !selectedGrupo) return;
        setAssigning(true);
        try {
            if (assignModal.type === 'membersToProject') {
                await Promise.all(
                    [...assignSelected].map(uIde =>
                        skambaAgregarUsuarioProyectoMiembro('', selectedGrupo.gru_ide, uIde, assignModal.pro_ide).catch(() => null)
                    )
                );
            } else {
                await Promise.all(
                    [...assignSelected].map(pIde =>
                        skambaAgregarUsuarioProyectoMiembro('', selectedGrupo.gru_ide, assignModal.usu_ide, pIde).catch(() => null)
                    )
                );
            }
        } catch {
            // silently ignore
        }
        setAssigning(false);
        setAssignModal(null);
        setMessage({ text: 'Accesos asignados correctamente.', type: 'success' });
        await loadMiembros();
        await loadProyectos();
    }

    async function handleRemoveProyecto(gppIde: number) {
        setMessage(null);
        try {
            const res = await skambaEliminarGrupoProyecto('', gppIde);
            if (res.success) {
                setMessage({ text: 'Proyecto eliminado del grupo.', type: 'success' });
                await loadProyectosGrupo();
            } else {
                setMessage({ text: res.message || 'Error al eliminar proyecto', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error al eliminar proyecto', type: 'error' });
        }
    }

    async function handleAssignMemberToProject(uIde: number, proIde: number) {
        if (!selectedGrupo) return;
        const key = `${uIde}-${proIde}`;
        setAssigningKey(key);
        setMessage(null);
        try {
            const res = await skambaAgregarUsuarioProyectoMiembro('', selectedGrupo.gru_ide, uIde, proIde);
            if (res.success) {
                setMemberAccess(prev => {
                    const next = new Map(prev);
                    const current = new Set(next.get(usuIde) ?? []);
                    current.add(String(proIde));
                    next.set(usuIde, current);
                    return next;
                });
                setMessage({ text: 'Usuario asignado al proyecto.', type: 'success' });
            } else {
                setMessage({ text: res.message || 'Error al asignar usuario', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error al asignar usuario', type: 'error' });
        }
        setAssigningKey(null);
    }

    // Filtros
    const linkedProyectoIds = new Set(proyectos.map(p => String(p.pro_ide)));
    const allFlatItems = flattenAllItems(workspaces);
    const availableItems = allFlatItems.filter(item => !linkedProyectoIds.has(String(item.pro_ide)));

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Top bar ── */}
            <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800">
                {/* Header row */}
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-zinc-900 dark:text-white">Grupos</h1>
                            <p className="text-xs text-zinc-500">Gestiona grupos, sus miembros y workspaces</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateGrupo(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo grupo
                    </button>
                </div>

                {/* Feedback */}
                {message && (
                    <div className={`mx-6 mb-3 p-3 rounded-lg text-sm flex items-center justify-between ${message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} className="ml-3 text-xs opacity-60 hover:opacity-100">✕</button>
                    </div>
                )}

                {/* Create group form */}
                {showCreateGrupo && (
                    <form onSubmit={handleCreateGrupo} className="mx-6 mb-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Crear nuevo grupo</p>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Nombre del grupo"
                                value={newGrupoName}
                                onChange={e => setNewGrupoName(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={creatingGrupo || !newGrupoName.trim()}
                                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {creatingGrupo ? 'Creando...' : 'Crear grupo'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowCreateGrupo(false); setNewGrupoName(''); }}
                                className="px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}

                {/* Group tabs */}
                {loadingGrupos ? (
                    <p className="px-6 pb-3 text-xs text-zinc-400">Cargando grupos...</p>
                ) : allGrupos.length > 0 && (
                    <div className="flex gap-0 px-6 overflow-x-auto">
                        {allGrupos.map(g => (
                            <button
                                key={g.gru_ide}
                                onClick={() => setSelectedGrupo(g)}
                                className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${selectedGrupo?.gru_ide === g.gru_ide
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                            >
                                {g.gru_nom}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Body ── */}
            {allGrupos.length === 0 && !loadingGrupos ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm text-zinc-500">No tienes grupos todavía</p>
                    <button
                        onClick={() => setShowCreateGrupo(true)}
                        className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Crear primer grupo
                    </button>
                </div>
            ) : selectedGrupo ? (
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Left panel: Miembros del grupo ── */}
                    <div className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-900/40">
                        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Miembros ({loadingMiembros ? '…' : miembros.length})
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                            {loadingMiembros ? (
                                <p className="text-xs text-zinc-400 text-center py-6">Cargando...</p>
                            ) : miembros.length === 0 ? (
                                <p className="text-xs text-zinc-400 text-center py-8">Sin miembros en este grupo</p>
                            ) : (
                                miembros.map(m => (
                                    <div
                                        key={m.usu_ide}
                                        className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-xs font-bold shrink-0">
                                                {m.usu_nom.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{m.usu_nom}</p>
                                                <p className="text-[10px] text-zinc-400 truncate">{m.usu_ema}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveMember(m.usu_ide)}
                                            className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all shrink-0"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add member footer */}
                        <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 p-4">
                            {showAddMember ? (
                                <form onSubmit={handleAddMember} className="space-y-2">
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                        Agregar usuario al grupo
                                    </p>
                                    <input
                                        autoFocus
                                        type="email"
                                        placeholder="Email del usuario..."
                                        value={emailMiembro}
                                        onChange={e => setEmailMiembro(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={addingMember || !emailMiembro.trim()}
                                            className="flex-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            {addingMember ? 'Agregando...' : 'Agregar al grupo'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowAddMember(false); setEmailMiembro(''); }}
                                            className="px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowAddMember(true)}
                                    className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-dashed border-indigo-300 dark:border-indigo-700 justify-center"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Agregar usuario al grupo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Right panel: Elementos del grupo ── */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Elementos vinculados ({loadingProyectos ? '…' : proyectos.length})
                            </p>
                            <button
                                onClick={() => setShowAddProyecto(v => !v)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Vincular elemento
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Vincular form */}
                            {showAddProyecto && (
                                <form onSubmit={handleAddProyecto} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                                        Vincular elemento al grupo
                                    </p>
                                    <p className="text-xs text-zinc-400 mb-3">
                                        Selecciona un workspace, space, folder o lista para vincular.
                                    </p>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedProyecto}
                                            onChange={e => setSelectedProyecto(e.target.value)}
                                            className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Seleccionar elemento...</option>
                                            {availableItems.map(item => (
                                                <option key={item.pro_ide} value={item.pro_ide}>
                                                    {'\u00A0\u00A0'.repeat(item.depth)}{tipStyle(item.pro_tip).label}: {item.pro_nom}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={addingProyecto || !selectedProyecto}
                                            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            {addingProyecto ? 'Vinculando...' : 'Vincular'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowAddProyecto(false); setSelectedProyecto(''); }}
                                            className="px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            )}

                            {loadingProyectos ? (
                                <p className="text-sm text-zinc-400 text-center py-8">Cargando elementos...</p>
                            ) : proyectos.length === 0 ? (
                                <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
                                    <p className="text-sm text-zinc-500">No hay elementos vinculados a este grupo</p>
                                    <p className="text-xs text-zinc-400 mt-1">Usa "Vincular elemento" para agregar workspaces, spaces, folders o listas</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {proyectos.map(p => {
                                        const assignedMembers = miembros.filter(m => {
                                            const access = memberAccess.get(m.usu_ide) ?? new Set<string>();
                                            return access.has(String(p.pro_ide));
                                        });
                                        const unassignedMembers = miembros.filter(m => {
                                            const access = memberAccess.get(m.usu_ide) ?? new Set<string>();
                                            return !access.has(String(p.pro_ide));
                                        });

                                        return (
                                            <div key={p.gpp_ide} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg ${tipStyle(p.pro_tip).bg} flex items-center justify-center ${tipStyle(p.pro_tip).text} text-sm font-bold shrink-0`}>
                                                            {p.pro_nom.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{p.pro_nom}</p>
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${tipStyle(p.pro_tip).bg} ${tipStyle(p.pro_tip).text}`}>
                                                                {tipStyle(p.pro_tip).label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveProyecto(p.gpp_ide)}
                                                        className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                                                    >
                                                        Desvincular
                                                    </button>
                                                </div>

                                                {/* Acceso al workspace */}
                                                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                                                        Acceso
                                                    </p>
                                                    {miembros.length === 0 ? (
                                                        <p className="text-xs text-zinc-400 italic">
                                                            Agrega miembros al grupo para asignarlos.
                                                        </p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {assignedMembers.map(m => (
                                                                <span
                                                                    key={m.usu_ide}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full"
                                                                    title="Tiene acceso"
                                                                >
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                    {m.usu_nom}
                                                                </span>
                                                            ))}
                                                            {unassignedMembers.map(m => {
                                                                const key = `${m.usu_ide}-${p.pro_ide}`;
                                                                return (
                                                                    <button
                                                                        key={m.usu_ide}
                                                                        onClick={() => handleAssignMemberToProject(m.usu_ide, p.pro_ide)}
                                                                        disabled={assigningKey === key}
                                                                        className="px-2 py-0.5 text-[11px] font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 rounded-full hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
                                                                        title={`Asignar a ${m.usu_nom} a "${p.pro_nom}"`}
                                                                    >
                                                                        {assigningKey === key ? '...' : `+ ${m.usu_nom}`}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            ) : null}

            {/* ── Modal de asignación de accesos ── */}
            {assignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                {assignModal.type === 'membersToProject'
                                    ? `Asignar miembros a "${assignModal.pro_nom}"`
                                    : `Asignar elementos a ${assignModal.usu_nom}`}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Selecciona a quién dar acceso
                            </p>
                        </div>

                        {/* Lista con checkboxes */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-72">
                            {assignModal.type === 'membersToProject' ? (
                                miembros.filter(m => m.usu_ide !== usuIde).map(m => (
                                    <label key={m.usu_ide} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={assignSelected.has(m.usu_ide)}
                                            onChange={() => setAssignSelected(prev => {
                                                const next = new Set(prev);
                                                next.has(m.usu_ide) ? next.delete(m.usu_ide) : next.add(m.usu_ide);
                                                return next;
                                            })}
                                            className="w-4 h-4 accent-indigo-600 rounded"
                                        />
                                        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-xs font-bold shrink-0">
                                            {m.usu_nom.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{m.usu_nom}</p>
                                            <p className="text-xs text-zinc-400 truncate">{m.usu_ema}</p>
                                        </div>
                                    </label>
                                ))
                            ) : (
                                proyectos.map(p => (
                                    <label key={p.pro_ide} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={assignSelected.has(p.pro_ide)}
                                            onChange={() => setAssignSelected(prev => {
                                                const next = new Set(prev);
                                                next.has(p.pro_ide) ? next.delete(p.pro_ide) : next.add(p.pro_ide);
                                                return next;
                                            })}
                                            className="w-4 h-4 accent-indigo-600 rounded"
                                        />
                                        <div className={`w-7 h-7 rounded-lg ${tipStyle(p.pro_tip).bg} flex items-center justify-center ${tipStyle(p.pro_tip).text} text-xs font-bold shrink-0`}>
                                            {p.pro_nom.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{p.pro_nom}</p>
                                            <p className={`text-[10px] font-semibold ${tipStyle(p.pro_tip).text}`}>{tipStyle(p.pro_tip).label}</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 justify-end">
                            <button
                                onClick={() => setAssignModal(null)}
                                disabled={assigning}
                                className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Omitir
                            </button>
                            <button
                                onClick={handleAssignSubmit}
                                disabled={assigning || assignSelected.size === 0}
                                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {assigning ? 'Asignando...' : `Asignar (${assignSelected.size})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
