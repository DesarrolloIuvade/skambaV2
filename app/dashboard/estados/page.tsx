'use client';

import { useState, useEffect } from 'react';
import {
    skambaConseguirEstados,
    skambaCrearEstado,
    skambaEditarEstado,
    skambaEliminarEstado,
    type Estado,
} from '../../../lib/api';

const PRESET_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#a1a1aa'];

export default function EstadosPage() {
    const [estados, setEstados] = useState<Estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
    const [newOrd, setNewOrd] = useState('');
    const [creating, setCreating] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editOrd, setEditOrd] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEstados();
    }, []);

    async function loadEstados() {
        setLoading(true);
        setError('');
        try {
            const res = await skambaConseguirEstados('');
            if (res.success) {
                setEstados(res.data);
            }
        } catch {
            setError('Error al cargar estados');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const res = await skambaCrearEstado('', newName.trim(), newColor, newOrd ? Number(newOrd) : undefined);
            if (res.success) {
                setNewName('');
                setNewColor(PRESET_COLORS[0]);
                setNewOrd('');
                setShowCreate(false);
                await loadEstados();
            }
        } catch {
            setError('Error al crear estado');
        } finally {
            setCreating(false);
        }
    }

    function startEditing(est: Estado) {
        setEditingId(est.est_ide);
        setEditName(est.est_nom);
        setEditColor(est.color);
        setEditOrd(String(est.est_ord));
    }

    async function handleSaveEdit() {
        if (editingId === null) return;
        setSaving(true);
        try {
            await skambaEditarEstado('', {
                est_ide: editingId,
                est_nom: editName.trim() || undefined,
                color: editColor || undefined,
                est_ord: editOrd ? Number(editOrd) : undefined,
            });
            setEditingId(null);
            await loadEstados();
        } catch {
            setError('Error al editar estado');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(est_ide: number) {
        try {
            await skambaEliminarEstado('', est_ide);
            await loadEstados();
        } catch {
            setError('Error al eliminar estado');
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Estados</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Gestiona los estados globales para tus listas de tareas.</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    + Nuevo estado
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Create Form */}
            {showCreate && (
                <form onSubmit={handleCreate} className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Crear estado</h3>
                    <div className="flex flex-col gap-3">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nombre del estado"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1 block">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setNewColor(c)}
                                        className={`w-7 h-7 rounded-full border-2 transition-all ${newColor === c ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                        <input
                            type="number"
                            placeholder="Orden (opcional)"
                            value={newOrd}
                            onChange={e => setNewOrd(e.target.value)}
                            className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                        />
                        <div className="flex gap-2">
                            <button type="submit" disabled={creating || !newName.trim()} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                {creating ? 'Creando...' : 'Crear'}
                            </button>
                            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* States List */}
            {loading ? (
                <div className="text-center py-8">
                    <p className="text-sm text-zinc-400">Cargando estados...</p>
                </div>
            ) : estados.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500">No hay estados creados</p>
                    <p className="text-xs text-zinc-400 mt-1">Crea tu primer estado para empezar</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {estados.map(est => (
                        <div key={est.est_ide} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 group">
                            {editingId === est.est_ide ? (
                                <>
                                    <div
                                        className="w-4 h-4 rounded-full shrink-0 cursor-pointer"
                                        style={{ backgroundColor: editColor }}
                                        onClick={() => {
                                            const idx = PRESET_COLORS.indexOf(editColor);
                                            setEditColor(PRESET_COLORS[(idx + 1) % PRESET_COLORS.length]);
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="number"
                                        value={editOrd}
                                        onChange={e => setEditOrd(e.target.value)}
                                        className="w-16 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Ord"
                                    />
                                    <button onClick={handleSaveEdit} disabled={saving} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
                                        {saving ? '...' : 'Guardar'}
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: est.color }} />
                                    <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{est.est_nom}</span>
                                    <span className="text-xs text-zinc-400">Orden: {est.est_ord}</span>
                                    <button
                                        onClick={() => startEditing(est)}
                                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-opacity"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(est.est_ide)}
                                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-opacity"
                                    >
                                        Eliminar
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
