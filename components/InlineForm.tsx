import React from 'react';

interface InlineFormProps {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    onCancel: () => void;
    loading: boolean;
    error: string;
}

export function InlineForm({
    placeholder, value, onChange, onSubmit, onCancel, loading, error,
}: InlineFormProps) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-1 px-2 py-1">
            <input
                autoFocus
                type="text"
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-1">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded bg-zinc-800 dark:bg-zinc-200 px-2 py-0.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
                >
                    {loading ? '...' : 'Crear'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                    ✕
                </button>
            </div>
        </form>
    );
}
