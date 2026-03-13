"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { skambaConseguirEstados } from "../lib/api";
import type { Estado } from "../lib/types/tarea";

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemType: "space" | "folder" | "list" | "workspace";
    onCreate: (name: string, estIdes?: number[]) => void;
}

const DEFAULT_EST_IDES = [1, 2, 3];

export default function CreateModal({
    isOpen,
    onClose,
    itemType,
    onCreate,
}: CreateModalProps) {
    const [name, setName] = useState("");
    const [estados, setEstados] = useState<Estado[]>([]);
    const [selectedEstados, setSelectedEstados] = useState<Set<number>>(new Set(DEFAULT_EST_IDES));
    const [loadingEstados, setLoadingEstados] = useState(false);

    useEffect(() => {
        if (isOpen && itemType === "list") {
            setLoadingEstados(true);
            skambaConseguirEstados("")
                .then((res) => {
                    if (res.success) {
                        setEstados(res.data);
                        setSelectedEstados(new Set(DEFAULT_EST_IDES));
                    }
                })
                .catch(() => { })
                .finally(() => setLoadingEstados(false));
        }
    }, [isOpen, itemType]);

    useEffect(() => {
        if (!isOpen) {
            setName("");
            setEstados([]);
            setSelectedEstados(new Set(DEFAULT_EST_IDES));
        }
    }, [isOpen]);

    function toggleEstado(estIde: number) {
        setSelectedEstados((prev) => {
            const next = new Set(prev);
            next.has(estIde) ? next.delete(estIde) : next.add(estIde);
            return next;
        });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        const estIdes =
            itemType === "list" && selectedEstados.size > 0
                ? Array.from(selectedEstados)
                : undefined;
        onCreate(name, estIdes);
        onClose();
        setName("");
    };

    const title =
        itemType === "space" ? "Nuevo Space" :
            itemType === "folder" ? "Nueva Carpeta" :
                itemType === "list" ? "Nueva Lista" :
                    "Nuevo Workspace";
    const label =
        itemType === "space" ? "Nombre del space" :
            itemType === "folder" ? "Nombre de la carpeta" :
                itemType === "list" ? "Nombre de la lista" :
                    "Nombre del workspace";

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md dark:bg-zinc-700">
                                <form onSubmit={handleSubmit}>
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-600 px-4 py-3">
                                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {title}
                                        </Dialog.Title>
                                        <button
                                            type="button"
                                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-600"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Cerrar</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-zinc-200">
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                className="block w-full rounded-md border border-gray-300 dark:border-zinc-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 dark:bg-zinc-800 dark:text-white"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder={label}
                                                autoFocus
                                            />
                                        </div>

                                        {/* State selector — only for lists */}
                                        {itemType === "list" && (
                                            <div>
                                                <p className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-2">
                                                    Estados
                                                </p>
                                                {loadingEstados ? (
                                                    <p className="text-xs text-zinc-400">Cargando estados...</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {estados.map((estado) => {
                                                            const id = Number(estado.est_ide);
                                                            const isSelected = selectedEstados.has(id);
                                                            return (
                                                                <button
                                                                    key={estado.est_ide}
                                                                    type="button"
                                                                    onClick={() => toggleEstado(id)}
                                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${isSelected
                                                                            ? "border-transparent text-white shadow-sm"
                                                                            : "border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 bg-transparent hover:border-zinc-400"
                                                                        }`}
                                                                    style={isSelected ? { backgroundColor: estado.color } : undefined}
                                                                >
                                                                    <span
                                                                        className={`w-2 h-2 rounded-full shrink-0`}
                                                                        style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.7)" : estado.color }}
                                                                    />
                                                                    {estado.est_nom}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {selectedEstados.size === 0 && (
                                                    <p className="text-xs text-amber-500 mt-1">Selecciona al menos un estado</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex p-5 space-x-4">
                                        <button
                                            type="button"
                                            className="flex-1 justify-center rounded-lg bg-white dark:bg-zinc-600 px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-500"
                                            onClick={onClose}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 justify-center rounded-lg bg-indigo-700 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50"
                                            disabled={!name.trim() || (itemType === "list" && selectedEstados.size === 0)}
                                        >
                                            Crear
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
