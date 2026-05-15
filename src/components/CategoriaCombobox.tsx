'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  opciones: string[];
  placeholder?: string;
  error?: boolean;
  ringColor?: string;
  selectedColor?: string;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900 rounded-sm px-0">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CategoriaCombobox({
  value,
  onChange,
  opciones,
  placeholder = '— Buscar o seleccionar —',
  error = false,
  ringColor = 'focus-within:ring-emerald-500',
  selectedColor = 'bg-emerald-50 text-emerald-700',
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtradas = search.trim()
    ? opciones.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : opciones;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
        setCursor(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const el = listRef.current.children[cursor] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [cursor]);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch('');
    setCursor(-1);
  };

  const handleOpen = () => {
    setOpen(true);
    // Pre-select cursor on current value
    if (value) {
      const idx = opciones.indexOf(value);
      setCursor(idx >= 0 ? idx : -1);
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      setCursor(c => Math.min(c + 1, filtradas.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setCursor(c => Math.max(c - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter' && cursor >= 0 && filtradas[cursor]) {
      select(filtradas[cursor]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
      setCursor(-1);
    }
  };

  const borderCls = error
    ? 'border-red-400 ring-2 ring-red-300'
    : open
    ? `border-gray-400 ring-2 ${ringColor}`
    : 'border-gray-300 hover:border-gray-400';

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center w-full px-3 py-3 bg-gray-50 border rounded-xl text-sm cursor-pointer transition-all ${borderCls}`}
        onClick={handleOpen}
      >
        {open ? (
          <input
            ref={inputRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setCursor(-1); }}
            onKeyDown={handleKeyDown}
            placeholder="Escribí para buscar..."
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 min-w-0"
          />
        ) : (
          <span className={`flex-1 truncate ${value ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
            {value || placeholder}
          </span>
        )}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {value && !open && (
            <button
              type="button"
              onMouseDown={e => { e.stopPropagation(); onChange(''); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto py-1"
          style={{ maxHeight: '14rem' }}
        >
          {filtradas.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-400 text-center italic">Sin resultados</li>
          ) : (
            filtradas.map((op, i) => (
              <li
                key={`${op}-${i}`}
                onMouseDown={() => select(op)}
                onMouseEnter={() => setCursor(i)}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                  i === cursor
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : op === value
                    ? `${selectedColor} font-semibold`
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Highlight text={op} query={search} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
