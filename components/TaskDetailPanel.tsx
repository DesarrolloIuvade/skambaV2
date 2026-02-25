'use client';

import { useState, useEffect, useRef } from 'react';
import {
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
    skambaUsuarios,
    skambaVerTareas,
} from '../lib/api';
import { QuillEditor } from './QuillEditor';

interface TaskDetailPanelProps {
    tarea: Tarea;
    estados: EstadoProyecto[];
    onClose: () => void;
    onUpdate: () => void;
}

export function TaskDetailPanel({ tarea, estados, onClose, onUpdate }: TaskDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<'detalle' | 'comentarios' | 'archivos'>('detalle');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
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

    // Editable fields
    const [nombre, setNombre] = useState(tarea.tar_nom);
    const [descripcion, setDescripcion] = useState(tarea.tar_des || '');
    const [fecha, setFecha] = useState(tarea.tar_fch || '');
    const [estadoId, setEstadoId] = useState(tarea.tar_est);
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    function getToken() {
        return localStorage.getItem('sk_token') ?? '';
    }

    useEffect(() => {
        skambaUsuarios(getToken())
            .then(res => { if (res.success) setUsuarios(Array.isArray(res.data) ? res.data : []); })
            .catch(() => { });
    }, []);

    useEffect(() => {
        setTareasLoading(true);
        skambaVerTareas(getToken(), Number(tarea.pro_ide))
            .then(res => { if (res.success) setTareas(res.data); })
            .catch(() => { })
            .finally(() => setTareasLoading(false));
    }, [tarea.pro_ide, tarea.tar_ide]);

    useEffect(() => {
        setNombre(tarea.tar_nom);
        setDescripcion(tarea.tar_des || '');
        setFecha(tarea.tar_fch || '');
        setEstadoId(tarea.tar_est);
        setUsuDesId(tarea.usu_des ?? '');
        setPriId(tarea.pri_ide ?? '');
        setTarPadId(tarea.tar_pad ?? '');
    }, [tarea]);

    // Eager load so tab badges appear immediately on panel open
    useEffect(() => {
        loadComments();
        loadFiles();
    }, [tarea.tar_ide]);

    async function loadComments() {
        setCommentsLoading(true);
        try {
            const res = await skambaTareaComentarios(getToken(), Number(tarea.tar_ide));
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
            const res = await skambaConseguirArchivos(getToken(), Number(tarea.tar_ide));
            if (res.success) setArchivos(res.archivos);
        } catch { /* ignore */ } finally {
            setFilesLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        try {
            const res = await skambaEditarTarea(getToken(), {
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
            const res = await skambaHacerComentario(getToken(), Number(tarea.tar_ide), newComment.trim());
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
            await skambaEliminarComentario(getToken(), t_a_ide);
            await loadComments();
        } catch { /* ignore */ }
    }

    async function handleUploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            await skambaSubirArchivo(getToken(), Number(tarea.tar_ide), Array.from(files));
            await loadFiles();
        } catch { /* ignore */ } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleDeleteFile(t_a_ide: number) {
        try {
            await skambaEliminarArchivo(getToken(), t_a_ide);
            await loadFiles();
        } catch { /* ignore */ }
    }

    async function handleDownloadFile(adj_ide: number, fil_nam: string) {
        try {
            const blob = await skambaConseguirArchivo(getToken(), adj_ide);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fil_nam;
            a.click();
            URL.revokeObjectURL(url);
        } catch { /* ignore */ }
    }

    const currentEstado = estados.find(e => e.p_e_ide === estadoId);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-end z-50" onClick={onClose}>
            <div
                className="h-full w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        {currentEstado && (
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentEstado.color ?? '#a1a1aa' }} />
                        )}
                        {priId && (
                            <span className={`inline-flex items-center ${priorityStyles[priId] ?? 'text-zinc-400'}`} title={`Prioridad ${priId}`}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M6 3h9.5a1 1 0 01.8.4l1.7 2.3a1 1 0 010 1.2l-1.7 2.3a1 1 0 01-.8.4H8v10a1 1 0 01-2 0V3z" />
                                </svg>
                            </span>
                        )}
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-white truncate">{tarea.tar_nom}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

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
                                        {estados.map(est => (
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
                                        <option value="">Sin prioridad</option>
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
                                            <p className="text-[10px] text-zinc-400 mt-1.5">{c.t_c_gen} &middot; {usuarios.find(u => u.usu_ide === c.usu_ide)?.usu_nom ?? `Usuario ${c.usu_ide}`}</p>
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
                                <label
                                    htmlFor="file-upload"
                                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading
                                        ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 opacity-50'
                                        : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
                                        }`}
                                >
                                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <span className="text-sm text-zinc-500">{uploading ? 'Subiendo...' : 'Subir archivos'}</span>
                                </label>
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
