'use client';

import { useEffect, useRef } from 'react';

interface QuillEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
}

export function QuillEditor({ value, onChange, placeholder, minHeight = 160 }: QuillEditorProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        if (!wrapperRef.current || quillRef.current) return;

        let cancelled = false;

        // Load Quill CSS once
        if (!document.querySelector('link[data-quill-snow]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css';
            link.setAttribute('data-quill-snow', '1');
            document.head.appendChild(link);
        }

        import('quill').then(({ default: Quill }) => {
            if (cancelled || !wrapperRef.current || quillRef.current) return;

            const editorEl = document.createElement('div');
            wrapperRef.current.appendChild(editorEl);

            const q = new Quill(editorEl, {
                theme: 'snow',
                placeholder: placeholder ?? 'Escribe una descripción...',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image', 'code-block'],
                        ['clean'],
                    ],
                },
            });

            if (value) {
                q.clipboard.dangerouslyPasteHTML(0, value);
            }

            q.on('text-change', () => {
                onChangeRef.current(q.root.innerHTML);
            });

            quillRef.current = q;
        });

        return () => {
            cancelled = true;
            if (wrapperRef.current) wrapperRef.current.innerHTML = '';
            quillRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sincronizar cambios de "value" que provienen desde fuera (ej: al terminar de cargar el API)
    useEffect(() => {
        if (!quillRef.current) return;
        const currentHtml = quillRef.current.root.innerHTML;
        // Si el valor cambia por el fetch externamente y no es el mismo que tiene el editor
        if (value !== currentHtml && value !== '<p><br></p>') {
            const isJustEmpty = value === '' && currentHtml === '<p><br></p>';
            if (!isJustEmpty) {
                quillRef.current.clipboard.dangerouslyPasteHTML(0, value || '');
            }
        }
    }, [value]);

    return (
        <div
            ref={wrapperRef}
            className="quill-wrapper rounded-md overflow-hidden"
            style={{ minHeight: minHeight + 42 }}
        />
    );
}
