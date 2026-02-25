"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemType: "space" | "folder" | "list" | "workspace";
    onCreate: (name: string) => void;
}

export default function CreateModal({
    isOpen,
    onClose,
    itemType,
    onCreate,
}: CreateModalProps) {
    const [name, setName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name);
            onClose();
            setName("");
        }
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
                    <div className="fixed inset-0 bg-black/50 bg-opacity-75 transition-opacity" />
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
                                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {title}
                                        </Dialog.Title>
                                        <button
                                            type="button"
                                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Cerrar</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                                            Nombre
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 dark:bg-zinc-800"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={label}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Footer */}
                                    <div className="flex p-5 space-x-4">
                                        <button
                                            type="button"
                                            className="flex-1 justify-center rounded-lg bg-white px-3 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                            onClick={onClose}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 justify-center rounded-lg bg-indigo-700 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50"
                                            disabled={!name.trim()}
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
