const fs = require('fs');
const content = fs.readFileSync('components/GrupoView.tsx', 'utf8');

const regex = /\s*\{\/\* ── Left panel: Miembros del grupo ── \*\/\}[\s\S]*?\{\/\* ── Right panel: Elementos del grupo ── \*\/\}/g;

const dropdownContent = `                    {/* ── Right panel: Elementos del grupo ── */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Elementos vinculados ({loadingProyectos ? '…' : proyectos.length})
                            </p>
                            
                            <div className="flex items-center gap-2">
                                {/* ── Members Dropdown ── */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowMembersDropdown(prev => !prev)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                        Miembros ({loadingMiembros ? '…' : miembros.length})
                                    </button>

                                    {showMembersDropdown && (
                                        <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 flex flex-col overflow-hidden">
                                            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                                                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                                                    Agregar miembros
                                                </h3>
                                                <form onSubmit={handleAddMember} className="flex flex-col gap-2">
                                                    <input
                                                        autoFocus
                                                        type="email"
                                                        placeholder="Correo electrónico del usuario..."
                                                        value={emailMiembro}
                                                        onChange={e => setEmailMiembro(e.target.value)}
                                                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={addingMember || !emailMiembro.trim()}
                                                        className="w-full px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        {addingMember ? 'Agregando...' : 'Agregar al grupo'}
                                                    </button>
                                                </form>
                                                {message && message.type === 'error' && (
                                                    <p className="mt-2 text-xs text-red-500">{message.text}</p>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 overflow-y-auto max-h-60 p-2">
                                                <p className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                                    Miembros actuales
                                                </p>
                                                {loadingMiembros ? (
                                                    <p className="text-xs text-zinc-400 px-2 py-1.5">Cargando...</p>
                                                ) : miembros.length === 0 ? (
                                                    <p className="text-xs text-zinc-400 px-2 py-1.5">Sin miembros adicionales</p>
                                                ) : (
                                                    miembros.map(m => (
                                                        <div key={m.usu_ide} className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg group">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-[10px] font-bold shrink-0">
                                                                    {m.usu_nom.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{m.usu_nom}</p>
                                                                    <p className="text-[10px] text-zinc-400 truncate">{m.usu_ema}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveMember(m.usu_ide); }}
                                                                className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all shrink-0"
                                                            >
                                                                Quitar
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
`;

if (!content.match(regex)) {
   console.log('Regex did not match.');
   process.exit(1);
}

// Ensure we also replace the old right panel start
const findRightPanel = /\{\/\* ── Right panel: Elementos del grupo ── \*\/\}[\s\S]*?\<div className="flex-1 flex flex-col overflow-hidden"\>\s*\<div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0"\>\s*\<p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider"\>\s*Elementos vinculados \(\{loadingProyectos \? '…' : proyectos\.length\}\)\s*\<\/p\>/;

let newContent = content.replace(regex, `{/* ── Right panel: Elementos del grupo ── */}`);
newContent = newContent.replace(findRightPanel, dropdownContent);

fs.writeFileSync('components/GrupoView.tsx', newContent);
console.log('Done replacing.');
