'use client';

import { useState, useEffect, useRef } from 'react';
import { Flag, Download, Trash2, Upload, Loader2, FileIcon } from 'lucide-react';
import {
    type Lista, type EstadoProyecto, type Usuario, type Comentario, type Archivo,
    skambaCrearTarea, skambaUsuarios,
    skambaTareaComentarios, skambaHacerComentario, skambaEliminarComentario,
    skambaConseguirArchivos, skambaSubirArchivo, skambaEliminarArchivo, skambaConseguirArchivo,
} from '../lib/api';
import { QuillEditor } from './QuillEditor';

interface TaskCreateModalProps {
    lista: Lista;
    defaultEstadoId?: string;
    onClose: () => void;
    onCreated: () => void;
}

const priorityOptions = [
    { id: '', label: 'Sin prioridad', bg: '#a1a1aa' },
    { id: '1', label: 'Alta', bg: '#ef4444' },
    { id: '2', label: 'Media', bg: '#f59e0b' },
    { id: '3', label: 'Baja', bg: '#10b981' },
];

export function TaskCreateModal({ lista, defaultEstadoId, onClose, onCreated }: TaskCreateModalProps) {
    const initialEstado = defaultEstadoId ?? lista.estados[0]?.p_e_ide ?? '';

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [estadoId, setEstadoId] = useState<string>(initialEstado);
    const [fecha, setFecha] = useState('');
    const [usuDesId, setUsuDesId] = useState('');
    const [priId, setPriId] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    // After creation
    const [createdTareaId, setCreatedTareaId] = useState<number | null>(null);
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [archivos, setArchivos] = useState<Archivo[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedEstado = lista.estados.find(e => String(e.p_e_ide) === String(estadoId));
    const selectedPriority = priorityOptions.find(p => p.id === priId) ?? priorityOptions[0];

    function getToken() { return localStorage.getItem('sk_token') ?? ''; }

    useEffect(() => {
        skambaUsuarios(getToken())
            .then(res => { if (res.success) setUsuarios(Array.isArray(res.data) ? res.data : []); })
            .catch(() => { });
    }, []);

    async function loadComentarios(tarId: number) {
        try {
            const res = await skambaTareaComentarios(getToken(), tarId);
            if (res.success) setComentarios(res.comentarios ?? []);
        } catch { }
    }

    async function loadArchivos(tarId: number) {
        try {
            const res = await skambaConseguirArchivos(getToken(), tarId);
            if (res.success) setArchivos(res.archivos ?? []);
        } catch { }
    }

    async function handleCreate() {
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
        setError('');
        setCreating(true);
        try {
            const res = await skambaCrearTarea(getToken(), {
                pro_ide: Number(lista.pro_ide),
                tar_nom: nombre.trim(),
                tar_des: descripcion,
                tar_est: estadoId ? Number(estadoId) : undefined,
                tar_fch: fecha || undefined,
                usu_des: usuDesId ? Number(usuDesId) : undefined,
                pri_ide: priId ? Number(priId) : undefined,
            });
            if (res.success) {
                setCreatedTareaId(res.tar_ide);
                await Promise.all([loadComentarios(res.tar_ide), loadArchivos(res.tar_ide)]);
            } else {
                setError('Error al crear la tarea');
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setCreating(false);
        }
    }

    async function handleAddComment() {
        if (!createdTareaId || !nuevoComentario.trim()) return;
        setSendingComment(true);
        try {
            await skambaHacerComentario(getToken(), createdTareaId, nuevoComentario.trim());
            setNuevoComentario('');
            await loadComentarios(createdTareaId);
        } catch { }
        finally { setSendingComment(false); }
    }

    async function handleDeleteComment(t_a_ide: number) {
        if (!createdTareaId) return;
        try {
            await skambaEliminarComentario(getToken(), t_a_ide);
            await loadComentarios(createdTareaId);
        } catch { }
    }

    async function handleFileUpload(files: FileList | null) {
        if (!createdTareaId || !files || files.length === 0) return;
        setUploading(true);
        try {
            await skambaSubirArchivo(getToken(), createdTareaId, Array.from(files));
            await loadArchivos(createdTareaId);
        } catch { }
        finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleDeleteFile(t_a_ide: number) {
        if (!createdTareaId) return;
        try {
            await skambaEliminarArchivo(getToken(), t_a_ide);
            await loadArchivos(createdTareaId);
        } catch { }
    }

    async function handleDownloadFile(adj_ide: number, fil_nam: string, fil_ext: string) {
        try {
            const blob = await skambaConseguirArchivo(getToken(), adj_ide);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fil_nam}.${fil_ext}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { }
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={createdTareaId ? onCreated : onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* ── TOP BAR: Estado · Prioridad · Cerrar ── */}
                <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">

                    <div
                        className="flex items-center rounded-lg px-3 py-2"
                        style={{ backgroundColor: selectedEstado?.color ?? '#a1a1aa' }}
                    >
                        <select
                            value={estadoId}
                            onChange={e => setEstadoId(e.target.value)}
                            disabled={!!createdTareaId}
                            className="text-sm font-bold bg-transparent border-0 focus:ring-0 outline-none text-white cursor-pointer disabled:cursor-default"
                        >
                            {lista.estados.map((est: EstadoProyecto) => (
                                <option key={est.p_e_ide} value={est.p_e_ide}>{est.est_nom}</option>
                            ))}
                        </select>
                    </div>

                    <span className="text-zinc-200 dark:text-zinc-700 select-none text-lg">|</span>

                    <div
                        className="flex items-center gap-2 rounded-lg px-3 py-2"
                        style={{ backgroundColor: selectedPriority.bg }}
                    >
                        <Flag className="w-4 h-4 shrink-0 text-white" fill="currentColor" />
                        <select
                            value={priId}
                            onChange={e => setPriId(e.target.value)}
                            disabled={!!createdTareaId}
                            className="text-sm font-bold bg-transparent border-0 focus:ring-0 outline-none cursor-pointer text-white disabled:cursor-default"
                        >
                            {priorityOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1" />

                    <button
                        type="button"
                        onClick={createdTareaId ? onCreated : onClose}
                        className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ── MIDDLE: left + right ── */}
                <div className="flex flex-1 min-h-0">

                    {/* LEFT */}
                    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">

                        {/* Nombre */}
                        <div className="px-5 py-3">
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Escribe el nombre de la tarea..."
                                autoFocus
                                disabled={!!createdTareaId}
                                className="w-full text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600 disabled:opacity-70"
                            />
                        </div>

                        {/* Dos cards */}
                        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1.5">Asignado a</p>
                                <select
                                    value={usuDesId}
                                    onChange={e => setUsuDesId(e.target.value)}
                                    disabled={!!createdTareaId}
                                    className="w-full text-sm bg-transparent border-0 focus:ring-0 outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:cursor-default"
                                >
                                    <option value="">Sin asignar</option>
                                    {usuarios.map(u => (
                                        <option key={u.usu_ide} value={u.usu_ide}>{u.usu_nom}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1.5">Fecha límite</p>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    disabled={!!createdTareaId}
                                    className="w-full text-sm bg-transparent border-0 focus:ring-0 outline-none text-zinc-700 dark:text-zinc-300 disabled:opacity-70"
                                />
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 pt-4 pb-2">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300 mb-3">Descripción</h3>
                            <QuillEditor
                                value={descripcion}
                                onChange={setDescripcion}
                                placeholder="Describe la tarea, agrega imágenes, listas..."
                                minHeight={120}
                            />
                        </div>

                        {/* Archivos */}
                        <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 pt-4 pb-5 mt-2">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300">Archivos</h3>
                                {createdTareaId ? (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {uploading
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Subiendo...</>
                                            : <><Upload className="w-3.5 h-3.5" />Subir archivo</>
                                        }
                                    </button>
                                ) : (
                                    <span className="text-xs text-zinc-400 italic">Disponible al crear la tarea</span>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={e => handleFileUpload(e.target.files)}
                                />
                            </div>

                            {uploading && (
                                <div className="flex items-center gap-2 text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2 mb-3">
                                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                    <span>Subiendo archivos, por favor espera...</span>
                                </div>
                            )}

                            {archivos.length === 0 && !uploading ? (
                                <p className="text-xs text-zinc-400 italic">
                                    {createdTareaId ? 'Sin archivos adjuntos' : 'Crea la tarea para subir archivos'}
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {archivos.map(arc => (
                                        <div key={arc.t_a_ide} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5">
                                            <FileIcon className="w-5 h-5 shrink-0 text-zinc-400" />
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1">
                                                {arc.fil_nam}.{arc.fil_ext}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadFile(arc.adj_ide, arc.fil_nam, arc.fil_ext)}
                                                className="p-1.5 rounded-md text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                                title="Descargar"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteFile(arc.t_a_ide)}
                                                className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="mx-5 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* RIGHT: comentarios */}
                    <div className="w-72 flex flex-col shrink-0 min-h-0">
                        <div className="px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Comentarios</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {!createdTareaId ? (
                                <p className="text-xs text-zinc-400 italic">Crea la tarea para agregar comentarios</p>
                            ) : comentarios.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic">Sin comentarios aún</p>
                            ) : (
                                comentarios.map(c => {
                                    const autorNombre = usuarios.find(u => u.usu_ide === c.usu_ide)?.usu_nom ?? String(c.usu_ide);
                                    return (
                                        <div key={c.t_a_ide} className="group bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0">
                                                    <span className="text-[8px] font-bold text-indigo-700 dark:text-indigo-300">
                                                        {autorNombre.slice(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">{autorNombre}</span>
                                                <span className="text-[10px] text-zinc-400 ml-auto">{c.t_c_gen}</span>
                                            </div>
                                            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{c.t_c_com}</p>
                                            <div className="flex justify-end mt-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteComment(c.t_a_ide)}
                                                    className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 shrink-0">
                            <textarea
                                value={nuevoComentario}
                                onChange={e => setNuevoComentario(e.target.value)}
                                placeholder={createdTareaId ? 'Escribe un comentario...' : 'Crea la tarea primero...'}
                                disabled={!createdTareaId}
                                rows={3}
                                className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 text-zinc-700 dark:text-zinc-300 resize-none disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={handleAddComment}
                                disabled={!createdTareaId || sendingComment || !nuevoComentario.trim()}
                                className="mt-2 w-full px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {sendingComment ? 'Enviando...' : 'Comentar'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── BOTTOM BAR ── */}
                <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                    <button
                        type="button"
                        onClick={createdTareaId ? onCreated : onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                        {createdTareaId ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!createdTareaId && (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={creating || !nombre.trim()}
                            className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {creating ? 'Creando...' : 'Crear tarea'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
