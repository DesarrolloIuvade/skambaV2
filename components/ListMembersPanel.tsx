'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, UserPlus, Users, X } from 'lucide-react';
import {
    skambaAgregarMiembro,
    skambaAgregarUsuarioProyectoMiembro,
    skambaConseguirGruposUsuario,
    skambaConseguirMiembros,
    skambaConseguirProyectosGrupo,
    type Lista,
    type Grupo,
    type Miembro,
} from '../lib/api';
import { useAuthStore } from '../context/useAuthStore';
import { getProjectMembers } from '../lib/getProjectMembers';

interface ListMembersPanelProps {
    lista: Lista;
}

export function ListMembersPanel({ lista }: ListMembersPanelProps) {
    const { user: storeUser } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [linkedGroups, setLinkedGroups] = useState<Grupo[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
    const [groupMembers, setGroupMembers] = useState<Miembro[]>([]);
    const [listMembers, setListMembers] = useState<Miembro[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
    const [email, setEmail] = useState('');

    const usuIde = storeUser?.usu_ide ?? 0;

    useEffect(() => {
        void loadPanelData();
    }, [lista.pro_ide, usuIde]);

    useEffect(() => {
        if (!selectedGroupId) {
            setGroupMembers([]);
            return;
        }

        void loadGroupMembers(selectedGroupId);
    }, [selectedGroupId]);

    const listMemberIds = useMemo(
        () => new Set(listMembers.map((member) => Number(member.usu_ide))),
        [listMembers],
    );

    const availableGroupMembers = useMemo(
        () => groupMembers.filter((member) => !listMemberIds.has(Number(member.usu_ide))),
        [groupMembers, listMemberIds],
    );

    async function loadPanelData() {
        if (!usuIde) {
            setLinkedGroups([]);
            setListMembers([]);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const gruposRes = await skambaConseguirGruposUsuario('', usuIde);
            const grupos = gruposRes.data ?? [];
            const proyectosPorGrupo = await Promise.all(
                grupos.map((group) => skambaConseguirProyectosGrupo('', usuIde, group.gru_ide)),
            );

            const matchingGroups = grupos.filter((group, index) =>
                (proyectosPorGrupo[index].data ?? []).some(
                    (project) => String(project.pro_ide) === String(lista.pro_ide),
                ),
            );

            setLinkedGroups(matchingGroups);
            setSelectedGroupId((previous) => {
                if (previous && matchingGroups.some((group) => group.gru_ide === previous)) {
                    return previous;
                }
                if (matchingGroups.length === 1) {
                    return matchingGroups[0].gru_ide;
                }
                return matchingGroups[0]?.gru_ide ?? '';
            });

            const members = await getProjectMembers('', lista.pro_ide);
            setListMembers(members);
        } catch (loadError) {
            console.error('Error loading list members panel:', loadError);
            setError('No se pudo cargar la configuración de miembros.');
        } finally {
            setLoading(false);
        }
    }

    async function loadGroupMembers(groupId: number) {
        try {
            const response = await skambaConseguirMiembros('', groupId);
            setGroupMembers(response.data ?? []);
        } catch (groupMembersError) {
            console.error('Error loading group members:', groupMembersError);
            setError('No se pudieron cargar los miembros del grupo.');
        }
    }

    async function refreshMembers() {
        await loadPanelData();
        if (selectedGroupId) {
            await loadGroupMembers(selectedGroupId);
        }
    }

    async function handleAddExistingMember() {
        if (!selectedGroupId || !selectedUserId) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await skambaAgregarUsuarioProyectoMiembro(
                '',
                Number(selectedGroupId),
                Number(selectedUserId),
                Number(lista.pro_ide),
            );

            if (!response.success) {
                setError(response.message || 'No se pudo asignar el usuario a la lista.');
                return;
            }

            setSelectedUserId('');
            setSuccess('Usuario agregado a la lista.');
            await refreshMembers();
        } catch (submitError) {
            console.error('Error assigning group member to list:', submitError);
            setError('Error al asignar el usuario a la lista.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAddByEmail(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedGroupId || !email.trim()) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const addMemberResponse = await skambaAgregarMiembro('', Number(selectedGroupId), email.trim());

            if (!addMemberResponse.success) {
                setError(addMemberResponse.message || 'No se pudo agregar el usuario al grupo.');
                return;
            }

            const assignResponse = await skambaAgregarUsuarioProyectoMiembro(
                '',
                Number(selectedGroupId),
                Number(addMemberResponse.usu_ide),
                Number(lista.pro_ide),
            );

            if (!assignResponse.success) {
                setError(assignResponse.message || 'El usuario se agregó al grupo, pero no a la lista.');
                return;
            }

            setEmail('');
            setSuccess('Usuario agregado al grupo y asignado a la lista.');
            await refreshMembers();
        } catch (submitError) {
            console.error('Error adding user by email:', submitError);
            setError('Error al agregar el usuario por email.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
            >
                <Users className="h-3.5 w-3.5" />
                {listMembers.length} miembro{listMembers.length === 1 ? '' : 's'}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px]" onClick={() => setIsOpen(false)}>
                    <aside
                        className="flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                                    Miembros de la lista
                                </p>
                                <h2 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    {lista.pro_nom}
                                </h2>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Administra quién puede trabajar en esta lista.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-5 overflow-y-auto p-5">
                            {loading ? (
                                <p className="py-8 text-center text-sm text-zinc-400">Cargando miembros...</p>
                            ) : linkedGroups.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Esta lista no está vinculada a ningún grupo.</p>
                                    <p className="mt-1 text-xs text-zinc-400">Vincúlala desde la vista de grupos para poder compartirla.</p>
                                </div>
                            ) : (
                                <>
                                    <section className="space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                            <UserPlus className="h-4 w-4 text-indigo-500" />
                                            Agregar usuarios del grupo
                                        </div>

                                        {linkedGroups.length > 1 && (
                                            <select
                                                value={selectedGroupId}
                                                onChange={(e) => setSelectedGroupId(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                            >
                                                <option value="">Seleccionar grupo...</option>
                                                {linkedGroups.map((group) => (
                                                    <option key={group.gru_ide} value={group.gru_ide}>
                                                        {group.gru_nom}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        <select
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value === '' ? '' : Number(e.target.value))}
                                            disabled={!selectedGroupId || availableGroupMembers.length === 0}
                                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                        >
                                            <option value="">{availableGroupMembers.length === 0 ? 'No hay miembros disponibles' : 'Seleccionar miembro...'}</option>
                                            {availableGroupMembers.map((member) => (
                                                <option key={member.usu_ide} value={member.usu_ide}>
                                                    {member.usu_nom}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={handleAddExistingMember}
                                            disabled={!selectedGroupId || !selectedUserId || submitting}
                                            className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {submitting ? 'Agregando...' : 'Agregar a la lista'}
                                        </button>
                                    </section>

                                    <section className="space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                            <Mail className="h-4 w-4 text-indigo-500" />
                                            Agregar por email
                                        </div>
                                        <p className="text-xs text-zinc-500">
                                            Se agregará al grupo seleccionado y también a esta lista.
                                        </p>

                                        <form onSubmit={handleAddByEmail} className="space-y-3">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="correo@empresa.com"
                                                disabled={!selectedGroupId || submitting}
                                                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!selectedGroupId || !email.trim() || submitting}
                                                className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                                            >
                                                {submitting ? 'Procesando...' : 'Agregar por email'}
                                            </button>
                                        </form>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                Miembros actuales
                                            </h3>
                                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                {listMembers.length}
                                            </span>
                                        </div>

                                        {listMembers.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no hay miembros asignados a esta lista.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {listMembers.map((member) => (
                                                    <div
                                                        key={member.usu_ide}
                                                        className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                                                    >
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                            {member.usu_nom.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                                {member.usu_nom}
                                                            </p>
                                                            <p className="truncate text-xs text-zinc-400">
                                                                {member.usu_ema || 'Sin correo'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}

                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                                    {success}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}