'use client';

import { useState, useEffect, useRef, type DragEvent } from 'react';
import { Flag, Download, Trash2, FileIcon, History } from 'lucide-react';
import {
    type Lista, type EstadoProyecto, type Comentario, type Archivo,
    skambaCrearTarea, skambaEditarTarea,
    skambaTareaComentarios, skambaHacerComentario, skambaEliminarComentario,
    skambaConseguirArchivos, skambaSubirArchivo, skambaEliminarArchivo, skambaConseguirArchivo,
    skambaLogsTareas, type TareaLog,
} from '../lib/api';
import type { Miembro } from '../lib/types/grupo';
import { getProjectMembers } from '../lib/getProjectMembers';
import { QuillEditor } from './QuillEditor';
import { getCookie } from 'cookies-next';

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
    const [saving, setSaving] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [error, setError] = useState('');
    const [usuarios, setUsuarios] = useState<Miembro[]>([]);

    // After creation
    const [createdTareaId, setCreatedTareaId] = useState<number | null>(null);
    const [logs, setLogs] = useState<TareaLog[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [archivos, setArchivos] = useState<Archivo[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedEstado = lista.estados.find(e => String(e.p_e_ide) === String(estadoId));
    const selectedPriority = priorityOptions.find(p => p.id === priId) ?? priorityOptions[0];


    useEffect(() => {
        getProjectMembers('', lista.pro_ide)
            .then(setUsuarios)
            .catch(() => { });
    }, [lista.pro_ide]);

    async function loadComentarios(tarId: number) {
        try {
            const res = await skambaTareaComentarios('', tarId);
            if (res.success) setComentarios(res.comentarios ?? []);
        } catch { }
    }

    async function loadLogs(tarId: number) {
        setLogsLoading(true);
        try {
            const res = await skambaLogsTareas('', tarId);
            if (res.success) setLogs(res.data ?? []);
        } catch { } finally {
            setLogsLoading(false);
        }
    }

    async function loadArchivos(tarId: number) {
        try {
            const res = await skambaConseguirArchivos('', tarId);
            if (res.success) setArchivos(res.archivos ?? []);
        } catch { }
    }

    async function handleSave() {
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
        setError('');
        setSaving(true);
        try {
            const token = getCookie('kamba_token') as string;
            if (!createdTareaId) {
                const res = await skambaCrearTarea(token, {
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
            } else {
                const res = await skambaEditarTarea('', {
                    tar_ide: createdTareaId,
                    tar_nom: nombre.trim(),
                    tar_des: descripcion,
                    tar_est: estadoId ? Number(estadoId) : undefined,
                    tar_fch: fecha || undefined,
                    usu_des: usuDesId ? Number(usuDesId) : undefined,
                    pri_ide: priId ? Number(priId) : undefined,
                });
                if (!res.success) {
                    setError('Error al guardar cambios');
                }
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setSaving(false);
        }
    }

    async function handleAddComment() {
        if (!createdTareaId || !nuevoComentario.trim()) return;
        setSendingComment(true);
        try {
            await skambaHacerComentario('', createdTareaId, nuevoComentario.trim());
            setNuevoComentario('');
            await loadComentarios(createdTareaId);
        } catch { }
        finally { setSendingComment(false); }
    }

    async function handleDeleteComment(t_a_ide: number) {
        if (!createdTareaId) return;
        try {
            await skambaEliminarComentario('', t_a_ide);
            await loadComentarios(createdTareaId);
        } catch { }
    }

    async function uploadFiles(files: FileList | File[]) {
        if (!createdTareaId || !files || files.length === 0) return;
        setUploading(true);
        try {
            await skambaSubirArchivo('', createdTareaId, Array.from(files));
            await loadArchivos(createdTareaId);
        } catch { }
        finally {
            setUploading(false);
            setIsDragging(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleFileUpload(files: FileList | null) {
        if (!files) return;
        await uploadFiles(files);
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        if (!createdTareaId) return;
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            void uploadFiles(e.dataTransfer.files);
        }
    }

    function handleDragOver(e: DragEvent) {
        if (!createdTareaId) return;
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave(e: DragEvent) {
        if (!createdTareaId) return;
        e.preventDefault();
        setIsDragging(false);
    }

    async function handleDeleteFile(t_a_ide: number) {
        if (!createdTareaId) return;
        try {
            await skambaEliminarArchivo('', t_a_ide);
            await loadArchivos(createdTareaId);
        } catch { }
    }

    async function handleDownloadFile(adj_ide: number, fil_nam: string, fil_ext: string) {
        try {
            const blob = await skambaConseguirArchivo('', adj_ide);
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
                className={`${isMaximized ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-5xl max-h-[90vh] rounded-xl'} bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300`}
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
                            className="text-sm font-bold bg-transparent border-0 focus:ring-0 outline-none text-white cursor-pointer"
                        >
                            {lista.estados.map((est: EstadoProyecto) => (
                                <option key={est.p_e_ide} value={est.p_e_ide} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800">{est.est_nom}</option>
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
                                <option key={opt.id} value={opt.id} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {createdTareaId && (
                        <>
                            <span className="text-zinc-200 dark:text-zinc-700 select-none text-lg">|</span>
                            {/* Logs Dropdown Toggle */}
                            <div className="relative group/logs">
                                <button
                                    type="button"
                                    onMouseEnter={() => loadLogs(createdTareaId)}
                                    className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                                    title="Ver historial de cambios"
                                >
                                    <History className="w-5 h-5" />
                                </button>
                                {/* Dropdown content on hover */}
                                <div className="absolute left-0 top-full mt-1 w-80 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-3 hidden group-hover/logs:block z-[70] max-h-64 overflow-y-auto">
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Historial</h4>
                                    {logsLoading ? (
                                        <p className="text-xs text-zinc-400 py-2 text-center">Cargando...</p>
                                    ) : logs.length === 0 ? (
                                        <p className="text-xs text-zinc-400 py-2 text-center italic">Sin cambios aún</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {logs.map(log => {
                                                const autor = usuarios.find(u => String(u.usu_ide) === String(log.usu_ide));
                                                const estado = lista.estados.find(e => String(e.p_e_ide) === String(log.tar_est));
                                                return (
                                                    <div key={log.t_e_ide} className="flex gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
                                                                <span className="font-semibold">{autor?.usu_nom ?? `User#${log.usu_ide}`}</span>
                                                                {' movió a '}
                                                                <span className="font-semibold text-indigo-500">{estado?.est_nom ?? `Estado#${log.tar_est}`}</span>
                                                            </p>
                                                            <p className="text-[9px] text-zinc-400 mt-0.5">{log.t_e_tim}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex-1" />

                    {/* Maximize/Minimize */}
                    <button
                        type="button"
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        title={isMaximized ? "Restaurar" : "Maximizar"}
                    >
                        {isMaximized ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6m-6 6h6m2-12a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>

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

                {/* ── LOGS POPUP ── */}
                {showLogs && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-60 p-4"
                        onClick={() => setShowLogs(false)}
                    >
                        <div
                            className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Historial de cambios
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowLogs(false)}
                                    className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="max-h-80 overflow-y-auto px-5 py-4">
                                {logsLoading ? (
                                    <p className="text-sm text-zinc-400 text-center py-6">Cargando...</p>
                                ) : logs.length === 0 ? (
                                    <p className="text-sm text-zinc-400 italic text-center py-6">Sin historial aún</p>
                                ) : (
                                    <ol className="relative border-l border-zinc-200 dark:border-zinc-700 space-y-4">
                                        {logs.map(log => {
                                            const autor = usuarios.find(u => String(u.usu_ide) === String(log.usu_ide));
                                            const estado = lista.estados.find(e => String(e.p_e_ide) === String(log.tar_est));
                                            return (
                                                <li key={log.t_e_ide} className="ml-4">
                                                    <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900" />
                                                    <p className="text-xs text-zinc-400 mb-0.5">{log.t_e_tim}</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                                        <span className="font-medium">{autor?.usu_nom ?? `Usuario #${log.usu_ide}`}</span>
                                                        {' cambió el estado a '}
                                                        <span
                                                            className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                                                            style={{ backgroundColor: estado?.color ?? '#a1a1aa' }}
                                                        >
                                                            {estado?.est_nom ?? `#${log.tar_est}`}
                                                        </span>
                                                    </p>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
                                className="w-full text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600"
                            />
                        </div>

                        {/* Dos cards */}
                        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1.5">Asignado a</p>
                                <select
                                    value={usuDesId}
                                    onChange={e => setUsuDesId(e.target.value)}
                                    className="w-full text-sm bg-transparent border-0 focus:ring-0 outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer"
                                >
                                    <option value="">Sin asignar</option>
                                    {usuarios.map(u => (
                                        <option key={u.usu_ide} value={String(u.usu_ide)}>{u.usu_nom}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1.5">Fecha límite</p>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    className="w-full text-sm bg-transparent border-0 focus:ring-0 outline-none text-zinc-700 dark:text-zinc-300"
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
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={e => handleFileUpload(e.target.files)}
                                />
                            </div>

                            {createdTareaId ? (
                                <>
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onClick={() => !uploading && fileInputRef.current?.click()}
                                        className={`flex flex-col items-center justify-center gap-3 w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all mb-3 ${uploading
                                            ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 opacity-50 cursor-wait'
                                            : isDragging
                                                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
                                            }`}
                                    >
                                        <svg className={`w-8 h-8 ${isDragging ? 'text-indigo-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <div className="text-center">
                                            <p className={`text-sm font-medium ${isDragging ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                {uploading ? 'Subiendo archivos...' : isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic'}
                                            </p>
                                            {!uploading && (
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                                    Se subirán a esta tarea
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {archivos.length === 0 && !uploading ? (
                                        <p className="text-xs text-zinc-400 italic">Sin archivos adjuntos</p>
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
                                </>
                            ) : (
                                <p className="text-xs text-zinc-400 italic">Crea la tarea para subir archivos</p>
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
                                    const autorNombre = c.usu_cre ?? usuarios.find(u => String(u.usu_ide) === String(c.usu_ide))?.usu_nom ?? String(c.usu_ide);
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
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !nombre.trim()}
                        className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? (createdTareaId ? 'Guardando...' : 'Creando...') : createdTareaId ? 'Guardar cambios' : 'Crear tarea'}
                    </button>
                </div>
            </div>
        </div>
    );
}
