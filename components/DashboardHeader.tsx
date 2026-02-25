'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';

export function DashboardHeader() {
    const { user, logout } = useDashboard();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase();

    return (
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
            <span className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Skamba</span>

            <div className="relative" ref={ref}>
                <button
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                >
                    <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {initial}
                    </div>
                    <div className="text-left hidden sm:block">
                        {user?.name && (
                            <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-none">{user.name}</p>
                        )}
                        <p className="text-[11px] text-zinc-400 leading-none mt-0.5">{user?.email}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {open && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden">
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {initial}
                                </div>
                                <div className="min-w-0">
                                    {user?.name && (
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                    )}
                                    <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-1">
                            <button
                                onClick={() => { setOpen(false); logout(); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                </svg>
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
