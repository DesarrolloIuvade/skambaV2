'use client';

import { useState, useEffect, useRef, type DragEvent } from 'react';
import { Flag, Download, Trash2, Loader2, FileIcon, History, Maximize2, Minimize2, Play } from 'lucide-react';
import {
    type Tarea, type Lista, type EstadoProyecto, type Comentario, type Archivo, type Workspace,
    skambaEditarTarea, skambaVerTarea, skambaCopiarTarea, skambaConseguirProyecto, skambaConseguirProyectos, skambaConseguirProyectosGrupoUsuarioPorUsuario,
    skambaTareaComentarios, skambaHacerComentario, skambaEliminarComentario,
    skambaConseguirArchivos, skambaSubirArchivo, skambaEliminarArchivo, skambaConseguirArchivo,
    skambaLogsTareas, type TareaLog,
} from '../lib/api';
import type { Miembro } from '../lib/types/grupo';
import { QuillEditor } from './QuillEditor';
import { getCookie } from 'cookies-next';
import { useAuthStore } from '../context/useAuthStore';

interface TaskDetailModalProps {
    tarea: Tarea;
    lista: Lista;
    onClose: () => void;
    onUpdate: () => void;
    miembros?: Miembro[];
}

const priorityOptions = [
    { id: '', label: 'Sin prioridad', bg: '#a1a1aa' },
    { id: '1', label: 'Alta', bg: '#ef4444' },
    { id: '2', label: 'Media', bg: '#f59e0b' },
    { id: '3', label: 'Baja', bg: '#10b981' },
];

interface CopyDestinationOption {
    pro_ide: string;
    label: string;
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

function collectPersonalListOptions(workspaces: Workspace[]): CopyDestinationOption[] {
    const options: CopyDestinationOption[] = [];

    for (const workspace of workspaces) {
        for (const space of workspace.spaces ?? []) {
            for (const list of space.contenido?.listas ?? []) {
                options.push({
                    pro_ide: String(list.pro_ide),
                    label: `${workspace.pro_nom} / ${space.pro_nom} / ${list.pro_nom}`,
                });
            }

            for (const folder of space.contenido?.folders ?? []) {
                for (const list of folder.listas ?? []) {
                    options.push({
                        pro_ide: String(list.pro_ide),
                        label: `${workspace.pro_nom} / ${space.pro_nom} / ${folder.pro_nom} / ${list.pro_nom}`,
                    });
                }
            }
        }
    }

    return options;
}

function collectGroupListOptions(nodes: unknown[], path: string[] = []): CopyDestinationOption[] {
    const options: CopyDestinationOption[] = [];

    for (const node of nodes ?? []) {
        const current = (node ?? {}) as Record<string, unknown>;
        const nodeName = String(current.pro_nom ?? 'Sin nombre');
        const nextPath = [...path, nodeName];
        const tip = String(current.pro_tip ?? '').toLowerCase();
        const children = Array.isArray(current.children) ? current.children : [];

        if (tip === 'list') {
            options.push({
                pro_ide: String(current.pro_ide ?? ''),
                label: nextPath.join(' / '),
            });
        }

        if (children.length > 0) {
            options.push(...collectGroupListOptions(children, nextPath));
        }
    }

    return options;
}

export function TaskDetailModal({ tarea, lista, onClose, onUpdate, miembros = [] }: TaskDetailModalProps) {
    const { user, token } = useAuthStore();
    const [availableStates, setAvailableStates] = useState<EstadoProyecto[]>(lista.estados ?? []);
    const [nombre, setNombre] = useState(tarea.tar_nom ?? '');
    const [descripcion, setDescripcion] = useState(tarea.tar_des ?? '');
    const [estadoId, setEstadoId] = useState(resolveEstadoId(tarea, lista.estados));
    const [fecha, setFecha] = useState(tarea.tar_fch ?? '');
    const [usuDesId, setUsuDesId] = useState(tarea.usu_des ? String(tarea.usu_des) : '');
    const [priId, setPriId] = useState(tarea.pri_ide ? String(tarea.pri_ide) : '');
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [showRunSelector, setShowRunSelector] = useState(false);
    const [copyOptions, setCopyOptions] = useState<CopyDestinationOption[]>([]);
    const [copyOptionsLoading, setCopyOptionsLoading] = useState(false);
    const [selectedCopyProjectId, setSelectedCopyProjectId] = useState('');
    const [isMaximized, setIsMaximized] = useState(false);
    const [taskLoading, setTaskLoading] = useState(true);

    const [logs, setLogs] = useState<TareaLog[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);

    const [usuarios, setUsuarios] = useState<Miembro[]>(miembros);

    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [sendingComment, setSendingComment] = useState(false);

    const [archivos, setArchivos] = useState<Archivo[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedEstado = availableStates.find(e => String(e.p_e_ide) === estadoId);
    const selectedPriority = priorityOptions.find(p => p.id === priId) ?? priorityOptions[0];



    const initialized = useRef(false);

    useEffect(() => {
        if (miembros.length > 0) {
            setUsuarios(miembros);
        }
    }, [miembros]);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            setTaskLoading(true);
            try {
                const result = await skambaVerTarea('', Number(tarea.tar_ide), Number(lista.pro_ide ?? tarea.pro_ide));
                if (result.success && result.data) {
                    const refreshed = result.data;
                    const nextStates = result.estados && result.estados.length > 0 ? result.estados : lista.estados;
                    setAvailableStates(nextStates);
                    setNombre(refreshed.tar_nom ?? '');
                    setDescripcion(refreshed.tar_des ?? '');
                    setEstadoId(resolveEstadoId(refreshed, nextStates));
                    setFecha(refreshed.tar_fch ?? '');

                    let resolvedUsuDesId = refreshed.usu_des ? String(refreshed.usu_des) : '';
                    if (!resolvedUsuDesId && refreshed.designado_nombre && result.miembros) {
                        const member = result.miembros.find(m => m.usu_nom === refreshed.designado_nombre);
                        if (member) resolvedUsuDesId = String(member.usu_ide);
                    }
                    if (!resolvedUsuDesId && refreshed.designado_nombre && !result.miembros) {
                        // Respaldo por si no vinieron miembros en la API
                        const member = usuarios.find(m => m.usu_nom === refreshed.designado_nombre);
                        if (member) resolvedUsuDesId = String(member.usu_ide);
                    }
                    setUsuDesId(resolvedUsuDesId);

                    setPriId(refreshed.pri_ide ? String(refreshed.pri_ide) : '');

                    if (result.miembros && result.miembros.length > 0) {
                        setUsuarios(result.miembros);
                    } else if (miembros && miembros.length > 0) {
                        setUsuarios(miembros);
                    } else {
                        const projectRes = await skambaConseguirProyecto('', Number(lista.pro_ide ?? tarea.pro_ide));
                        if (projectRes.success && projectRes.data && 'miembros' in projectRes.data) {
                            setUsuarios((projectRes.data as Lista).miembros ?? []);
                        }
                    }
                } else {
                    setAvailableStates(lista.estados ?? []);
                    setEstadoId(resolveEstadoId(tarea, lista.estados));
                    if (miembros && miembros.length > 0) {
                        setUsuarios(miembros);
                    } else {
                        const projectRes = await skambaConseguirProyecto('', Number(lista.pro_ide ?? tarea.pro_ide));
                        if (projectRes.success && projectRes.data && 'miembros' in projectRes.data) {
                            setUsuarios((projectRes.data as Lista).miembros ?? []);
                        }
                    }
                }
            } catch {
                setAvailableStates(lista.estados ?? []);
                setEstadoId(resolveEstadoId(tarea, lista.estados));
                if (miembros && miembros.length > 0) {
                    setUsuarios(miembros);
                } else {
                    try {
                        const projectRes = await skambaConseguirProyecto('', Number(lista.pro_ide ?? tarea.pro_ide));
                        if (projectRes.success && projectRes.data && 'miembros' in projectRes.data) {
                            setUsuarios((projectRes.data as Lista).miembros ?? []);
                        }
                    } catch { }
                }
            } finally {
                setTaskLoading(false);
            }

            loadComentarios();
            loadArchivos();
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const usuIde = user?.usu_ide;
        if (!usuIde) return;

        const loadCopyOptions = async () => {
            setCopyOptionsLoading(true);
            try {
                const [personalRes, groupRes] = await Promise.all([
                    skambaConseguirProyectos(token ?? ''),
                    skambaConseguirProyectosGrupoUsuarioPorUsuario('', Number(usuIde)),
                ]);

                const personalOptions = personalRes.success ? collectPersonalListOptions(personalRes.data ?? []) : [];
                const groupOptions = groupRes.success ? collectGroupListOptions(groupRes.data ?? []) : [];

                const merged = [...personalOptions, ...groupOptions]
                    .filter((opt) => opt.pro_ide)
                    .filter((opt, index, arr) => arr.findIndex((item) => item.pro_ide === opt.pro_ide) === index)
                    .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));

                setCopyOptions(merged);
            } catch {
                setCopyOptions([]);
            } finally {
                setCopyOptionsLoading(false);
            }
        };

        void loadCopyOptions();
    }, [token, user?.usu_ide]);

    async function loadLogs() {
        setLogsLoading(true);
        try {
            const res = await skambaLogsTareas('', Number(tarea.tar_ide));
            if (res.success) setLogs(res.data ?? []);
        } catch { } finally {
            setLogsLoading(false);
        }
    }

    async function loadComentarios() {
        try {
            const res = await skambaTareaComentarios('', Number(tarea.tar_ide));
            if (res.success) setComentarios(res.comentarios ?? []);
        } catch { }
    }

    async function loadArchivos() {
        setFilesLoading(true);
        try {
            const res = await skambaConseguirArchivos('', Number(tarea.tar_ide));
            if (res.success) setArchivos(res.archivos ?? []);
        } catch { } finally {
            setFilesLoading(false);
        }
    }

    async function handleSave() {
        if (!nombre.trim()) return;
        setSaving(true);
        try {
            await skambaEditarTarea('', {
                tar_ide: Number(tarea.tar_ide),
                tar_nom: nombre.trim(),
                tar_des: descripcion,
                tar_est: estadoId ? Number(estadoId) : undefined,
                tar_fch: fecha || undefined,
                usu_des: usuDesId ? Number(usuDesId) : undefined,
                pri_ide: priId ? Number(priId) : undefined,
            });
            onUpdate();
        } catch { }
        finally { setSaving(false); }
    }

    async function handleRun() {
        if (running) return;
        if (!selectedCopyProjectId) return;
        setRunning(true);
        try {
            const cookieToken = getCookie('kamba_token') as string | undefined;
            await skambaCopiarTarea(token ?? cookieToken ?? '', Number(tarea.tar_ide), Number(selectedCopyProjectId));
            setShowRunSelector(false);
            onUpdate();
        } catch { }
        finally { setRunning(false); }
    }

    async function handleAddComment() {
        if (!nuevoComentario.trim()) return;
        setSendingComment(true);
        try {
            const res = await skambaHacerComentario('', Number(tarea.tar_ide), nuevoComentario.trim());
            if (res.success) {
                setNuevoComentario('');
                await loadComentarios();
            }
        } catch { }
        finally { setSendingComment(false); }
    }

    async function handleDeleteComment(t_a_ide: number) {
        try {
            await skambaEliminarComentario('', t_a_ide);
            await loadComentarios();
        } catch { }
    }

    async function uploadFiles(files: FileList | File[]) {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            await skambaSubirArchivo('', Number(tarea.tar_ide), Array.from(files));
            await loadArchivos();
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
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            void uploadFiles(e.dataTransfer.files);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        setIsDragging(false);
    }

    async function handleDeleteFile(t_a_ide: number) {
        try {
            await skambaEliminarArchivo('', t_a_ide);
            await loadArchivos();
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
        >
            <div
                className={`${isMaximized ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-5xl max-h-[90vh] rounded-2xl'} bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xl flex flex-col border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden transition-all duration-500 ease-in-out relative animate-in fade-in zoom-in duration-300`}
            >
                {taskLoading && (
                    <div className="absolute inset-0 z-[60] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300">
                        <div className="flex flex-col items-center gap-3 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in zoom-in">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className="text-sm font-medium text-zinc-500">Cargando detalles...</p>
                        </div>
                    </div>
                )}
                {/* ── TOP BAR: Estado · Prioridad · Cerrar (full width) ── */}
                <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">

                    {/* Estado chip */}
                    <div
                        className="flex items-center rounded-lg px-3 py-2"
                        style={{ backgroundColor: selectedEstado?.color ?? '#a1a1aa' }}
                    >
                        <select
                            value={estadoId}
                            onChange={e => setEstadoId(e.target.value)}
                            className="text-sm font-bold bg-transparent border-0 focus:ring-0 outline-none text-white cursor-pointer"
                        >
                            {availableStates.map((est: EstadoProyecto) => (
                                <option key={est.p_e_ide} value={est.p_e_ide} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800">{est.est_nom}</option>
                            ))}
                        </select>
                    </div>

                    <span className="text-zinc-200 dark:text-zinc-700 select-none text-lg">|</span>

                    {/* Priority chip */}
                    <div
                        className="flex items-center gap-2 rounded-lg px-3 py-2"
                        style={{ backgroundColor: selectedPriority.bg }}
                    >
                        <Flag className="w-4 h-4 shrink-0 text-white" fill="currentColor" />
                        <select
                            value={priId}
                            onChange={e => setPriId(e.target.value)}
                            className="text-sm font-bold bg-transparent border-0 focus:ring-0 outline-none cursor-pointer text-white"
                        >
                            {priorityOptions.map(opt => (
                                <option key={opt.id} value={opt.id} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <span className="text-zinc-200 dark:text-zinc-700 select-none text-lg">|</span>
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 relative" >
                        <button
                            type="button"
                            onClick={() => setShowRunSelector((prev) => !prev)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50 cursor-pointer z-[70]"
                        >
                            <Play className="w-4 h-4" />
                            Copiar Tarea
                        </button>
                        {showRunSelector && (
                            <div className="absolute left-0 top-full mt-1 w-[26rem] max-w-[70vw] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-3 z-[80] overflow-y-auto">
                                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                                    Copiar tarea a una lista
                                </p>
                                <select
                                    value={selectedCopyProjectId}
                                    onChange={(e) => setSelectedCopyProjectId(e.target.value)}
                                    disabled={copyOptionsLoading || running}
                                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                >
                                    <option value="" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800">
                                        {copyOptionsLoading ? 'Cargando listas...' : 'Selecciona una lista destino'}
                                    </option>
                                    {copyOptions.map((option) => (
                                        <option key={option.pro_ide} value={option.pro_ide}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowRunSelector(false)}
                                        className="px-3 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRun}
                                        disabled={running || copyOptionsLoading || !selectedCopyProjectId}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                        {running ? 'Copiando...' : 'Iniciar'}
                                    </button>
                                </div>
                            </div>
                        )}


                    </div>


                    <span className="text-zinc-200 dark:text-zinc-700 select-none text-lg">|</span>

                    {/* Botón de Historial tipo Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                if (!showLogs) loadLogs();
                                setShowLogs(!showLogs);
                            }}
                            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            title="Ver historial de cambios"
                        >
                            <History className="w-5 h-5" />
                        </button>

                        {/* Contenido del Dropdown */}
                        {showLogs && (
                            <div className="absolute left-0 top-full mt-1 w-80 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-3 z-[70] max-h-64 overflow-y-auto">
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Historial</h4>
                                {logsLoading ? (
                                    <p className="text-xs text-zinc-400 py-2 text-center">Cargando...</p>
                                ) : logs.length === 0 ? (
                                    <p className="text-xs text-zinc-400 py-2 text-center italic">Sin cambios aún</p>
                                ) : (
                                    <div className="space-y-4">
                                        {logs.map(log => {
                                            return (
                                                <div key={log.t_e_ide} className="flex gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
                                                            <span className="font-semibold">{log.usu_nom ?? `User#${log.usu_ide}`}</span>
                                                            {' movió a '}
                                                            <span className="font-semibold text-indigo-500">{log.est_nom ?? `Estado#${log.p_e_ide ?? log.tar_est}`}</span>
                                                        </p>
                                                        <p className="text-[9px] text-zinc-400 mt-0.5">{log.t_e_tim}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1" />

                    {/* Maximize/Minimize */}
                    <button
                        type="button"
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        title={isMaximized ? "Restaurar" : "Maximizar"}
                    >
                        {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>

                    {/* Cerrar */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ── MIDDLE: left content + right comments ── */}
                <div className="flex flex-1 min-h-0">

                    {/* LEFT */}
                    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">

                        {/* Nombre */}
                        <div className="px-5 py-3">
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Nombre de la tarea..."
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
                                    <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="">Sin asignar</option>
                                    {usuarios.map(u => (
                                        <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" key={u.usu_ide} value={String(u.usu_ide)}>{u.usu_nom}</option>
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
                                            Se adjuntarán a esta tarea
                                        </p>
                                    )}
                                </div>
                            </div>

                            {uploading && (
                                <div className="flex items-center gap-2 text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2 mb-3">
                                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                    <span>Subiendo archivos, por favor espera...</span>
                                </div>
                            )}

                            {filesLoading ? (
                                <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                    <span>Cargando archivos...</span>
                                </div>
                            ) : archivos.length === 0 && !uploading ? (
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
                        </div>
                    </div>

                    {/* RIGHT: comments */}
                    <div className="w-72 flex flex-col shrink-0 min-h-0">
                        <div className="px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Comentarios</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {comentarios.length === 0 ? (
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
                                onKeyDown={e => {
                                    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                                        e.preventDefault();
                                    }
                                }}
                                placeholder="Escribe un comentario..."
                                rows={3}
                                className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 text-zinc-700 dark:text-zinc-300 resize-none"
                            />
                            <button
                                type="button"
                                onClick={handleAddComment}
                                disabled={sendingComment || !nuevoComentario.trim()}
                                className="mt-2 w-full px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {sendingComment ? 'Enviando...' : 'Comentar'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── BOTTOM BAR: Cancelar · Guardar (full width) ── */}
                <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !nombre.trim()}
                        className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
