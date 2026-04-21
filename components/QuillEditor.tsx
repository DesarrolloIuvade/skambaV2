'use client';

import { useEffect, useRef } from 'react';

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

export function QuillEditor({
  value,
  onChange,
  placeholder,
  minHeight = 160,
  className = '',
}: QuillEditorProps) {
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
          history: false,
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean'],
          ],
        },
        formats: [
          'header',
          'size',
          'bold',
          'italic',
          'underline',
          'strike',
          'list',
          'align',
          'blockquote',
          'code-block',
          'link',
          'image',
        ],
      });

      if (value) {
        q.clipboard.dangerouslyPasteHTML(0, value);
      }

      q.on('text-change', () => {
        onChangeRef.current(q.root.innerHTML);
      });

      // Prevent browser's native undo/redo with both beforeinput and keydown
      const preventUndo = (e: Event) => {
        const inputEvent = e as InputEvent;
        if (inputEvent.inputType === 'historyUndo' || inputEvent.inputType === 'historyRedo') {
          e.preventDefault();
        }
      };

      const preventUndoKeydown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y')) {
          e.preventDefault();
        }
      };

      q.root.addEventListener('beforeinput', preventUndo);
      q.root.addEventListener('keydown', preventUndoKeydown, true);

      // Store handlers for cleanup
      (q as any).__preventUndo = preventUndo;
      (q as any).__preventUndoKeydown = preventUndoKeydown;

      quillRef.current = q;
    });

    return () => {
      cancelled = true;
      if (quillRef.current && quillRef.current.root) {
        const preventUndo = (quillRef.current as any).__preventUndo;
        const preventUndoKeydown = (quillRef.current as any).__preventUndoKeydown;
        if (preventUndo) quillRef.current.root.removeEventListener('beforeinput', preventUndo);
        if (preventUndoKeydown) quillRef.current.root.removeEventListener('keydown', preventUndoKeydown, true);
      }
      if (wrapperRef.current) wrapperRef.current.innerHTML = '';
      quillRef.current = null;
    };
  }, [placeholder]);

  useEffect(() => {
    if (!quillRef.current) return;

    const currentHtml = quillRef.current.root.innerHTML;

    if (value !== currentHtml && value !== '<p><br></p>') {
      const isJustEmpty = value === '' && currentHtml === '<p><br></p>';
      if (!isJustEmpty) {
        quillRef.current.clipboard.dangerouslyPasteHTML(0, value || '');
      }
    }
  }, [value]);

  return (
    <>
      <style jsx global>{`
              .quill-theme .ql-toolbar {
                border: 1px solid rgb(228 228 231);
                border-bottom: none;
                background: rgb(255 255 255);
                border-radius: 0.5rem 0.5rem 0 0;
              }
            
              .quill-theme .ql-container {
                border: 1px solid rgb(228 228 231);
                background: rgb(255 255 255);
                border-radius: 0 0 0.5rem 0.5rem;
              }
            
              .quill-theme .ql-editor {
                color: rgb(55 65 81);
                min-height: ${minHeight}px;
              }
            
              .quill-theme .ql-editor.ql-blank::before {
                color: rgb(156 163 175);
                font-style: normal;
              }
            
              /* Dark by class */
              .dark .quill-theme .ql-toolbar {
                border-color: rgb(63 63 70);
                background: rgb(24 24 27);
              }
            
              .dark .quill-theme .ql-container {
                border-color: rgb(63 63 70);
                background: rgb(9 9 11);
              }
            
              .dark .quill-theme .ql-editor {
                color: rgb(228 228 231);
              }
            
              .dark .quill-theme .ql-editor.ql-blank::before {
                color: rgb(113 113 122);
              }
            
              .dark .quill-theme .ql-stroke {
                stroke: rgb(228 228 231);
              }
            
              .dark .quill-theme .ql-fill {
                fill: rgb(228 228 231);
              }
            
              .dark .quill-theme .ql-picker {
                color: rgb(228 228 231);
              }
            
              .dark .quill-theme .ql-picker-options {
                background: rgb(24 24 27);
                border-color: rgb(63 63 70);
              }
            
              .dark .quill-theme .ql-tooltip {
                background: rgb(24 24 27);
                color: rgb(228 228 231);
                border: 1px solid rgb(63 63 70);
              }
            
              /* Dark by system preference */
              @media (prefers-color-scheme: dark) {
                .quill-theme .ql-toolbar {
                  border-color: rgb(63 63 70);
                  background: rgb(24 24 27);
                }
            
                .quill-theme .ql-container {
                  border-color: rgb(63 63 70);
                  background: rgb(9 9 11);
                }
            
                .quill-theme .ql-editor {
                  color: rgb(228 228 231);
                }
            
                .quill-theme .ql-editor.ql-blank::before {
                  color: rgb(113 113 122);
                }
            
                .quill-theme .ql-stroke {
                  stroke: rgb(228 228 231);
                }
            
                .quill-theme .ql-fill {
                  fill: rgb(228 228 231);
                }
            
                .quill-theme .ql-picker {
                  color: rgb(228 228 231);
                }
            
                .quill-theme .ql-picker-options {
                  background: rgb(24 24 27);
                  border-color: rgb(63 63 70);
                }
            
                .quill-theme .ql-tooltip {
                  background: rgb(24 24 27);
                  color: rgb(228 228 231);
                  border: 1px solid rgb(63 63 70);
                }
              }
            `}</style>
      <div
        ref={wrapperRef}
        className={`quill-theme rounded-md overflow-hidden ${className}`}
        style={{ minHeight: minHeight + 42 }}
      />
    </>
  );
}