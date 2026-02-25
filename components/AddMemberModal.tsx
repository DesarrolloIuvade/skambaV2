'use client';

import { useState, useEffect } from 'react';
import {
    Grupo,
    Usuario,
    skambaConseguirGruposUsuario,
    skambaUsuarios,
    skambaAgregarUsuarioProyectoMiembro
} from '../lib/api';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    onSuccess: () => void;
}

export function AddMemberModal({ isOpen, onClose, workspaceId, onSuccess }: AddMemberModalProps) {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');

    const [selectedGrupoId, setSelectedGrupoId] = useState<number | ''>('');
    const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | ''>('');

    useEffect(() => {
        if (isOpen) {
            loadData();
        } else {
            // Reset al cerrar
            setSelectedGrupoId('');
            setSelectedUsuarioId('');
            setError('');
        }
    }, [isOpen]);

    async function loadData() {
        const token = localStorage.getItem('sk_token') ?? '';
        const usu_ide = Number(localStorage.getItem('sk_usu_ide') ?? '0');

        if (!token || !usu_ide) {
            setError('No se pudo autenticar');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const [gruposRes, usuariosRes] = await Promise.all([
                skambaConseguirGruposUsuario(token, usu_ide),
                skambaUsuarios(token)
            ]);

            if (gruposRes.success && gruposRes.data) {
                setGrupos(gruposRes.data);
                // Auto-seleccionar el primer grupo si solo hay uno
                if (gruposRes.data.length === 1) {
                    setSelectedGrupoId(gruposRes.data[0].gru_ide);
                }
            }

            if (usuariosRes.success && usuariosRes.data) {
                setUsuarios(usuariosRes.data);
            }
        } catch (err) {
            setError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd() {
        if (!selectedGrupoId || !selectedUsuarioId) return;

        const token = localStorage.getItem('sk_token') ?? '';
        setAdding(true);
        setError('');

        try {
            const res = await skambaAgregarUsuarioProyectoMiembro(
                token,
                Number(selectedGrupoId),
                Number(selectedUsuarioId),
                Number(workspaceId)
            );

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError(res.message || 'No se pudo agregar el miembro');
            }
        } catch (err) {
            setError('Error al agregar miembro al workspace');
        } finally {
            setAdding(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    Agregar Miembro al Workspace
                </h2>

                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-zinc-400">Cargando...</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-6">
                            {/* Selector de Grupo */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Grupo
                                </label>
                                <select
                                    value={selectedGrupoId}
                                    onChange={(e) => setSelectedGrupoId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={adding}
                                >
                                    <option value="">Seleccionar grupo</option>
                                    {grupos.map((grupo) => (
                                        <option key={grupo.gru_ide} value={grupo.gru_ide}>
                                            {grupo.gru_nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de Usuario */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Usuario
                                </label>
                                <select
                                    value={selectedUsuarioId}
                                    onChange={(e) => setSelectedUsuarioId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={adding || !selectedGrupoId}
                                >
                                    <option value="">Seleccionar usuario</option>
                                    {usuarios.map((usuario) => (
                                        <option key={usuario.usu_ide} value={usuario.usu_ide}>
                                            {usuario.usu_nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleAdd}
                                disabled={!selectedGrupoId || !selectedUsuarioId || adding}
                                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 px-4 py-2 text-sm font-semibold text-white disabled:text-zinc-500 transition-colors"
                            >
                                {adding ? 'Agregando...' : 'Agregar'}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={adding}
                                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
