'use client';

import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Building2,
    Folder,
    List,
    Home,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { Workspace, Space, Folder as FolderType, Lista } from '../lib/api';

interface ProjectTreeProps {
    onClose?: () => void;
}

export function ProjectTree({ onClose }: ProjectTreeProps) {
    const {
        workspaces,
        groupWorkspaces,
        activeWorkspace,
        openWorkspaces,
        toggleWorkspace,
        openSpaces,
        toggleSpace,
        openFolders,
        toggleFolder,
        selectWorkspace,
        selectSpace,
        selectFolder,
        selectLista,
    } = useDashboard();

    const allWorkspaces = [...workspaces, ...groupWorkspaces];

    const renderListItem = (lista: Lista, depth: number) => {
        const isActive = activeWorkspace?.pro_ide === lista.pro_ide;
        return (
            <button
                key={lista.pro_ide}
                onClick={() => {
                    selectLista(lista);
                    onClose?.();
                }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${isActive
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 16}px` }}
            >
                <List className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{lista.pro_nom}</span>
            </button>
        );
    };

    const renderFolder = (folder: FolderType, parentSpaceId: string | number, depth: number) => {
        const isOpen = openFolders.has(folder.pro_ide);
        const lists = folder.listas || [];
        const isActive = activeWorkspace?.pro_ide === folder.pro_ide;

        return (
            <div key={folder.pro_ide}>
                <button
                    onClick={() => {
                        selectFolder(folder);
                        onClose?.();
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors group ${isActive
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    style={{ paddingLeft: `${depth * 16 + 16}px` }}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(folder.pro_ide);
                        }}
                        className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm p-0.5"
                    >
                        {lists.length > 0 &&
                            (isOpen ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            ))}
                        {lists.length === 0 && <div className="w-4 h-4" />}
                    </button>
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{folder.pro_nom}</span>
                </button>
                {isOpen && lists.map((lista) => renderListItem(lista, depth + 1))}
            </div>
        );
    };

    const renderSpace = (space: Space, workspaceId: string | number, depth: number) => {
        const isOpen = openSpaces.has(space.pro_ide);
        const folders = space.contenido?.folders || [];
        const lists = space.contenido?.listas || [];
        const children = [...folders, ...lists];
        const isActive = activeWorkspace?.pro_ide === space.pro_ide;

        return (
            <div key={space.pro_ide}>
                <button
                    onClick={() => {
                        selectSpace(space, String(workspaceId));
                        onClose?.();
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${isActive
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    style={{ paddingLeft: `${depth * 16 + 16}px` }}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSpace(space.pro_ide);
                        }}
                        className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm p-0.5"
                    >
                        {children.length > 0 &&
                            (isOpen ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            ))}
                        {children.length === 0 && <div className="w-4 h-4" />}
                    </button>
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{space.pro_nom}</span>
                </button>
                {isOpen && (
                    <>
                        {folders.map((folder) => renderFolder(folder, space.pro_ide, depth + 1))}
                        {lists.map((lista) => renderListItem(lista, depth + 1))}
                    </>
                )}
            </div>
        );
    };

    const renderWorkspace = (workspace: Workspace) => {
        const isOpen = openWorkspaces.has(workspace.pro_ide);
        const spaces = workspace.spaces || [];
        const isActive = activeWorkspace?.pro_ide === workspace.pro_ide;

        return (
            <div key={workspace.pro_ide} className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <button
                    onClick={() => {
                        selectWorkspace(workspace);
                        onClose?.();
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors font-medium ${isActive
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkspace(workspace.pro_ide);
                        }}
                        className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm p-0.5"
                    >
                        {spaces.length > 0 &&
                            (isOpen ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            ))}
                        {spaces.length === 0 && <div className="w-4 h-4" />}
                    </button>
                    <Home className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{workspace.pro_nom}</span>
                </button>
                {isOpen && spaces.map((space) => renderSpace(space, workspace.pro_ide, 1))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {/* Personal workspaces */}
            {workspaces.length > 0 && (
                <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mis Proyectos
                    </div>
                    {workspaces.map((ws) => renderWorkspace(ws))}
                </div>
            )}

            {/* Group workspaces */}
            {groupWorkspaces.length > 0 && (
                <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Proyectos de Grupos
                    </div>
                    {groupWorkspaces.map((ws) => renderWorkspace(ws))}
                </div>
            )}

            {allWorkspaces.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay proyectos disponibles
                </div>
            )}
        </div>
    );
}
