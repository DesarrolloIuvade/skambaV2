'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Users, X } from 'lucide-react';
import {
    skambaAgregarUsuariosLista,
    type Lista,
    type Miembro,
} from '../lib/api';
import { useAuthStore } from '../context/useAuthStore';
// quitamos esto el endpint skambaVerTareas ya lo pide 
// import { getProjectMembers } from '../lib/getProjectMembers';

interface ListMembersPanelProps {
    lista: Lista;
    miembros?: Miembro[];
}

export function ListMembersPanel({ lista, miembros = [] }: ListMembersPanelProps) {
    const { user: storeUser } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [listMembers, setListMembers] = useState<Miembro[]>(miembros);
    const [email, setEmail] = useState('');

    const usuIde = storeUser?.usu_ide ?? 0;

    useEffect(() => {
        setListMembers(miembros);
    }, [miembros]);

    async function refreshMembers() {
        // Miembros ya vienen de la respuesta de skambaVerTareas,
        // así que no necesitamos hacer una llamada separada
        // Esta función puede quedar como es por si futura necesidad
    }

    async function handleAddByEmail(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await skambaAgregarUsuariosLista(
                '',
                email.trim(),
                Number(lista.pro_ide),
            );

            if (!response.success) {
                setError(response.message || 'No se pudo agregar el usuario a la lista.');
                return;
            }

            setEmail('');
            setSuccess('Usuario agregado a la lista.');
            // No necesitamos refreshMembers aquí porque esperamos que
            // el padre llame a onRefresh que en ListView hace un nuevo skambaVerTareas
        } catch (submitError) {
            console.error('Error adding user by email:', submitError);
            setError('Error al agregar el usuario por email.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
            >
                <Users className="h-3.5 w-3.5" />
                {listMembers.length} miembro{listMembers.length === 1 ? '' : 's'}
            </button>

            {isOpen && (
                <>
                    <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                        Miembros de la lista
                                    </p>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                                        {lista.pro_nom}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-md p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <p className="py-4 text-center text-xs text-zinc-400">Cargando...</p>
                            ) : (
                                <>
                                    {/* Add User Section */}
                                    <div className="space-y-2 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <UserPlus className="h-3.5 w-3.5" />
                                            Agregar Usuario
                                        </p>

                                        <form onSubmit={handleAddByEmail} className="space-y-2">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="correo@ejemplo.com"
                                                disabled={submitting}
                                                className="w-full text-xs border border-zinc-300 dark:border-zinc-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!email.trim() || submitting}
                                                className="w-full text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                                            >
                                                {submitting ? 'Procesando...' : 'Agregar'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Members List */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                                Miembros
                                            </p>
                                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                                {listMembers.length}
                                            </span>
                                        </div>

                                        {listMembers.length === 0 ? (
                                            <p className="text-xs text-zinc-400 text-center py-2">Sin miembros asignados.</p>
                                        ) : (
                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                {listMembers.map((member) => (
                                                    <div
                                                        key={member.usu_ide}
                                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold shrink-0">
                                                            {member.usu_nom.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                                                {member.usu_nom}
                                                            </p>
                                                            {member.usu_ema && (
                                                                <p className="text-[10px] text-zinc-400 truncate">
                                                                    {member.usu_ema}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-300">
                                    {success}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Click outside handler */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                </>
            )}
        </div>
    );
}