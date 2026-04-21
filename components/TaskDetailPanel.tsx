'use client';

import { useState, useEffect, useRef } from 'react';
import {
    type Lista,
    type Tarea,
    type EstadoProyecto,
    type Comentario,
    type Archivo,
    type Usuario,
    skambaEditarTarea,
    skambaTareaComentarios,
    skambaHacerComentario,
    skambaEliminarComentario,
    skambaConseguirArchivos,
    skambaSubirArchivo,
    skambaEliminarArchivo,
    skambaConseguirArchivo,
    skambaConseguirProyecto,
    skambaUsuarios,
    skambaVerTareas,
    skambaVerTarea,
    skambaLogsTareas,
    type TareaLog,
} from '../lib/api';
import { QuillEditor } from './QuillEditor';

interface TaskDetailPanelProps {
    tarea: Tarea;
    estados: EstadoProyecto[];
    onClose: () => void;
    onUpdate: () => void;
}

function resolveEstadoId(
    task: Partial<Tarea> & { est_ide?: string | number | null; est_nom?: string | null },
    estados: EstadoProyecto[],
) {
    const byProjectStateId = task.tar_est ? String(task.tar_est) : '';
    if (byProjectStateId && estados.some((estado) => String(estado.p_e_ide) === byProjectStateId)) {
        return byProjectStateId;
    }

    const byBaseStateId = task.est_ide ? String(task.est_ide) : '';
    if (byBaseStateId) {
        const match = estados.find((estado) => String(estado.est_ide) === byBaseStateId);
        if (match) return String(match.p_e_ide);
    }

    const byName = task.est_nom?.trim().toLowerCase();
    if (byName) {
        const match = estados.find((estado) => estado.est_nom.trim().toLowerCase() === byName);
        if (match) return String(match.p_e_ide);
    }

    return String(estados[0]?.p_e_ide ?? '');
}

export function TaskDetailPanel({ tarea, estados, onClose, onUpdate }: TaskDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<'detalle' | 'comentarios' | 'archivos'>('detalle');
    const [saving, setSaving] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [error, setError] = useState('');

    const [logs, setLogs] = useState<TareaLog[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);
    const priorityOptions = [
        { id: '1', label: 'Alta', color: 'text-red-600', bg: 'bg-red-100' },
        { id: '2', label: 'Media', color: 'text-amber-600', bg: 'bg-amber-100' },
        { id: '3', label: 'Baja', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    ];
    const priorityStyles: Record<string, string> = {
        '1': 'text-red-500',
        '2': 'text-amber-500',
        '3': 'text-emerald-500',
    };
    const [availableStates, setAvailableStates] = useState<EstadoProyecto[]>(estados ?? []);

    // Editable fields
    const [nombre, setNombre] = useState(tarea.tar_nom ?? '');
    const [descripcion, setDescripcion] = useState(tarea.tar_des || '');
    const [fecha, setFecha] = useState(tarea.tar_fch || '');
    const [estadoId, setEstadoId] = useState(resolveEstadoId(tarea, estados));
    const [usuDesId, setUsuDesId] = useState(tarea.usu_des ?? '');
    const [priId, setPriId] = useState(tarea.pri_ide ?? '');
    const [tarPadId, setTarPadId] = useState(tarea.tar_pad ?? '');
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [tareasLoading, setTareasLoading] = useState(false);

    // Comments
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [addingComment, setAddingComment] = useState(false);

    // Files
    const [archivos, setArchivos] = useState<Archivo[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        skambaUsuarios('')
            .then(res => { if (res.success) setUsuarios(Array.isArray(res.data) ? res.data : []); })
            .catch(() => { });
    }, []);

    useEffect(() => {
        setTareasLoading(true);
        skambaVerTareas('', Number(tarea.pro_ide))
            .then(res => { if (res.success) setTareas(res.data); })
            .catch(() => { })
            .finally(() => setTareasLoading(false));
    }, [tarea.pro_ide, tarea.tar_ide]);

    useEffect(() => {
        setAvailableStates(estados ?? []);
        setNombre(tarea.tar_nom ?? '');
        setDescripcion(tarea.tar_des || '');
        setFecha(tarea.tar_fch || '');
        setEstadoId(resolveEstadoId(tarea, estados));

        let resolvedUsuDesId = tarea.usu_des ? String(tarea.usu_des) : '';
        if (!resolvedUsuDesId && tarea.designado_nombre) {
            const member = usuarios.find(m => m.usu_nom === tarea.designado_nombre);
            if (member) resolvedUsuDesId = String(member.usu_ide);
        }
        setUsuDesId(resolvedUsuDesId);

        setPriId(tarea.pri_ide ?? '');
        setTarPadId(tarea.tar_pad ?? '');
    }, [tarea, usuarios, estados]);

    useEffect(() => {
        let active = true;

        async function loadTaskDetail() {
            try {
                const res = await skambaVerTarea('', Number(tarea.tar_ide), Number(tarea.pro_ide));
                if (!active || !res.success || !res.data) return;

                const nextStates = res.estados && res.estados.length > 0 ? res.estados : estados;
                setAvailableStates(nextStates);
                setNombre(res.data.tar_nom ?? '');
                setDescripcion(res.data.tar_des || '');
                setFecha(res.data.tar_fch || '');
                setEstadoId(resolveEstadoId(res.data, nextStates));

                let resolvedUsuDesId = res.data.usu_des ? String(res.data.usu_des) : '';
                if (!resolvedUsuDesId && res.data.designado_nombre) {
                    const member = (res.miembros ?? []).find(m => m.usu_nom === res.data?.designado_nombre);
                    if (member) resolvedUsuDesId = String(member.usu_ide);
                }
                setUsuDesId(resolvedUsuDesId);
                setPriId(res.data.pri_ide ?? '');

                if (res.miembros && res.miembros.length > 0) {
                    setUsuarios(res.miembros as unknown as Usuario[]);
                } else {
                    const projectRes = await skambaConseguirProyecto('', Number(tarea.pro_ide));
                    if (projectRes.success && projectRes.data && 'miembros' in projectRes.data) {
                        setUsuarios(((projectRes.data as Lista).miembros ?? []) as unknown as Usuario[]);
                    }
                }
            } catch {
                if (!active) return;
                setAvailableStates(estados ?? []);
            }
        }

        void loadTaskDetail();

        return () => {
            active = false;
        };
    }, [tarea.tar_ide, tarea.pro_ide, estados]);

    // Eager load so tab badges appear immediately on panel open
    useEffect(() => {
        loadComments();
        loadFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tarea.tar_ide]);

    async function loadComments() {
        setCommentsLoading(true);
        try {
            const res = await skambaTareaComentarios('', Number(tarea.tar_ide));
            console.log('skambaTareaComentarios response:', JSON.stringify(res));
            if (res.success) {
                setComentarios(res.comentarios ?? []);
            } else {
                console.error('loadComments: success=false', res);
                setComentarios([]);
            }
        } catch (err) {
            console.error('loadComments error:', err);
            setComentarios([]);
        } finally {
            setCommentsLoading(false);
        }
    }

    async function loadFiles() {
        setFilesLoading(true);
        try {
            const res = await skambaConseguirArchivos('', Number(tarea.tar_ide));
            if (res.success) setArchivos(res.archivos);
        } catch { /* ignore */ } finally {
            setFilesLoading(false);
        }
    }

    async function loadLogs() {
        setLogsLoading(true);
        try {
            const res = await skambaLogsTareas('', Number(tarea.tar_ide));
            if (res.success) setLogs(res.data ?? []);
        } catch { } finally {
            setLogsLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        try {
            const res = await skambaEditarTarea('', {
                tar_ide: Number(tarea.tar_ide),
                tar_nom: nombre.trim() || undefined,
                tar_des: descripcion,
                tar_fch: fecha || undefined,
                tar_est: estadoId ? Number(estadoId) : undefined,
                usu_des: usuDesId ? Number(usuDesId) : undefined,
                pri_ide: priId ? Number(priId) : undefined,
                tar_pad: tarPadId ? Number(tarPadId) : undefined,
            });
            if (res.success) {
                onUpdate();
            } else {
                setError('Error al guardar');
            }
        } catch {
            setError('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    }

    async function handleAddComment(e: React.FormEvent) {
        e.preventDefault();
        if (!newComment.trim()) return;
        setAddingComment(true);
        try {
            const res = await skambaHacerComentario('', Number(tarea.tar_ide), newComment.trim());
            if (res.success) {
                setNewComment('');
                await loadComments();
            }
        } catch { /* ignore */ } finally {
            setAddingComment(false);
        }
    }

    async function handleDeleteComment(t_a_ide: number) {
        try {
            await skambaEliminarComentario('', t_a_ide);
            await loadComments();
        } catch { /* ignore */ }
    }

    async function uploadFiles(files: FileList | File[]) {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            await skambaSubirArchivo('', Number(tarea.tar_ide), Array.from(files));
            await loadFiles();
        } catch { /* ignore */ } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleUploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (files) await uploadFiles(files);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            uploadFiles(e.dataTransfer.files);
        }
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
    }

    async function handleDeleteFile(t_a_ide: number) {
        try {
            await skambaEliminarArchivo('', t_a_ide);
            await loadFiles();
        } catch { /* ignore */ }
    }

    async function handleDownloadFile(adj_ide: number, fil_nam: string) {
        try {
            const blob = await skambaConseguirArchivo('', adj_ide);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fil_nam;
            a.click();
            URL.revokeObjectURL(url);
        } catch { /* ignore */ }
    }

    const currentEstado = availableStates.find(e => e.p_e_ide === estadoId);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-end z-50">
            <div
                className={`h-full ${isMaximized ? 'w-full' : 'w-full max-w-3xl'} bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right transition-all duration-300`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        {currentEstado && (
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentEstado.color ?? '#a1a1aa' }} />
                        )}
                        {priId && (
                            <div className="relative group/logs inline-flex items-center">
                                <span className={`inline-flex items-center ${priorityStyles[priId] ?? 'text-zinc-400'} cursor-help`} title={`Prioridad ${priId}`} onMouseEnter={() => loadLogs()}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M6 3h9.5a1 1 0 01.8.4l1.7 2.3a1 1 0 010 1.2l-1.7 2.3a1 1 0 01-.8.4H8v10a1 1 0 01-2 0V3z" />
                                    </svg>
                                </span>
                                {/* Mini logs dropdown next to priority */}
                                <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-3 hidden group-hover/logs:block z-[70] max-h-64 overflow-y-auto">
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Historial</h4>
                                    {logsLoading ? (
                                        <p className="text-xs text-zinc-400 py-2 text-center">Cargando...</p>
                                    ) : logs.length === 0 ? (
                                        <p className="text-xs text-zinc-400 py-2 text-center italic">Sin cambios aún</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {logs.map(log => {
                                                const autor = usuarios.find(u => String(u.usu_ide) === String(log.usu_ide));
                                                const estado = availableStates.find(e => String(e.p_e_ide) === String(log.tar_est));
                                                return (
                                                    <div key={log.t_e_ide} className="flex gap-2 text-left">
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
                        )}
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-white truncate">{tarea.tar_nom}</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Maximize/Minimize */}
                        <button
                            type="button"
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                            title={isMaximized ? "Restaurar" : "Maximizar"}
                        >
                            {isMaximized ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6m-1 7H4a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2v-3" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            )}
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
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
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                                            const estado = availableStates.find(e => String(e.p_e_ide) === String(log.tar_est));
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

                {/* Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 shrink-0">
                    {(['detalle', 'comentarios', 'archivos'] as const).map(tab => {
                        const badge =
                            tab === 'comentarios' && comentarios.length > 0 ? comentarios.length
                                : tab === 'archivos' && archivos.length > 0 ? archivos.length
                                    : null;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {badge !== null && (
                                    <span className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums leading-none px-1.5 py-0.5 ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'detalle' && (
                        <div className="p-5 space-y-4">
                            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}

                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1 block">Nombre</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    onKeyDown={e => {
                                        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1 block">Descripción</label>
                                <QuillEditor
                                    key={tarea.tar_ide}
                                    value={descripcion}
                                    onChange={setDescripcion}
                                    minHeight={140}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Estado</label>
                                    <select
                                        value={estadoId}
                                        onChange={e => setEstadoId(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {availableStates.map(est => (
                                            <option key={est.p_e_ide} value={est.p_e_ide}>{est.est_nom}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Fecha límite</label>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={e => setFecha(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 mb-1 block">Prioridad</label>
                                    <select
                                        value={priId}
                                        onChange={e => setPriId(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="">Sin prioridad</option>
                                        {priorityOptions.map((opt) => (
                                            <option key={opt.id} value={opt.id} className={opt.color}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Asignado a */}
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1 block">Asignado a</label>
                                <select
                                    value={usuDesId}
                                    onChange={e => setUsuDesId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Sin asignar</option>
                                    {usuarios.map(u => (
                                        <option key={u.usu_ide} value={u.usu_ide}>{u.usu_nom}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dependencia */}
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1 block">Depende de</label>
                                <select
                                    value={tarPadId}
                                    onChange={e => setTarPadId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={tareasLoading}
                                >
                                    <option value="">Sin dependencia</option>
                                    {tareas
                                        .filter(t => t.tar_ide !== tarea.tar_ide)
                                        .map(t => (
                                            <option key={t.tar_ide} value={t.tar_ide}>{t.tar_nom}</option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <span>ID: {tarea.tar_ide}</span>
                                <span>&middot;</span>
                                <span>Creada: {tarea.tar_gen}</span>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'comentarios' && (
                        <div className="flex flex-col h-full">
                            {/* Comments list */}
                            <div className="flex-1 p-5 space-y-3">
                                {commentsLoading ? (
                                    <p className="text-sm text-zinc-400 text-center py-4">Cargando...</p>
                                ) : comentarios.length === 0 ? (
                                    <p className="text-sm text-zinc-400 text-center py-8">Sin comentarios</p>
                                ) : (
                                    comentarios.map(c => (
                                        <div key={c.t_a_ide} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 group">
                                            <div className="flex items-start justify-between">
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{c.t_c_com}</p>
                                                <button
                                                    onClick={() => handleDeleteComment(c.t_a_ide)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity shrink-0"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 mt-1.5">{c.t_c_gen} &middot; {usuarios.find(u => Number(u.usu_ide) === Number(c.usu_ide))?.usu_nom ?? 'Usuario'}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add comment */}
                            <form onSubmit={handleAddComment} className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Escribe un comentario..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        onKeyDown={e => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                                                e.preventDefault();
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={addingComment || !newComment.trim()}
                                        className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {addingComment ? '...' : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'archivos' && (
                        <div className="p-5">
                            {/* Upload */}
                            <div className="mb-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleUploadFiles}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                    className={`flex flex-col items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${uploading
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
                                            {uploading ? 'Subiendo archivos...' : isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
                                        </p>
                                        {!uploading && (
                                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                                o haz clic para seleccionar
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Files list */}
                            {filesLoading ? (
                                <p className="text-sm text-zinc-400 text-center py-4">Cargando...</p>
                            ) : archivos.length === 0 ? (
                                <p className="text-sm text-zinc-400 text-center py-8">Sin archivos adjuntos</p>
                            ) : (
                                <div className="space-y-2">
                                    {archivos.map(a => (
                                        <div key={a.t_a_ide} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg group">
                                            <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase shrink-0">
                                                {a.fil_ext}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{a.fil_nam}</p>
                                                <p className="text-[10px] text-zinc-400">{(a.fil_siz / 1024).toFixed(1)} KB &middot; {a.fil_typ}</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDownloadFile(a.adj_ide, a.fil_nam)}
                                                    className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                                    title="Descargar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFile(a.t_a_ide)}
                                                    className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
