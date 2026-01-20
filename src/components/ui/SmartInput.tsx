import { Check, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  suggestions?: string[];
  storageKey?: string;
}

// ✅ Equipamentos comuns (SEM smartphones / celulares / iPhone)
const DEFAULT_EQUIPMENT = [
  // Computadores e Notebooks
  'Notebook',
  'Computador Desktop',
  'Ultrabook',
  'Chromebook',
  'MacBook',
  'iMac',

  // Consoles - PlayStation
  'PlayStation 5 (PS5)',
  'PlayStation 4 (PS4)',
  'PlayStation 3 (PS3)',
  'PlayStation 2 (PS2)',
  'PlayStation 1 (PS1)',
  'PSP',
  'PS Vita',

  // Consoles - Xbox
  'Xbox Series X',
  'Xbox Series S',
  'Xbox One',
  'Xbox 360',
  'Xbox Classic',

  // Consoles - Nintendo
  'Nintendo Switch',
  'Nintendo Switch Lite',
  'Nintendo Wii U',
  'Nintendo Wii',
  'Nintendo GameCube',
  'Nintendo 64',
  'Super Nintendo (SNES)',
  'Nintendo DS',
  'Nintendo 3DS',

  // Consoles - Outros
  'Atari 2600',
  'Sega Genesis',
  'Sega Dreamcast',
  'Steam Deck',

  // TVs / Vídeo
  'Smart TV',
  'TV',
  'Monitor',

  // Periféricos
  'Impressora',
  'Scanner',
  'Mouse',
  'Teclado',
  'Webcam',
  'Roteador',
  'Modem',
  'Controle/Joystick',

  // Áudio
  'Headset',
  'Fone de Ouvido',
  'Headphone',
  'Caixa de Som',
  'Soundbar',
  'Microfone',

  // Armazenamento
  'HD Externo',
  'SSD',
  'Pen Drive',
  'Cartão de Memória',

  // Componentes
  'Fonte de Alimentação',
  'Placa de Vídeo',
  'Placa-Mãe',
  'Memória RAM',
  'Processador',

  // Acessórios
  'Carregador',
  'Cabo HDMI',
  'Adaptador',
  'Teclado Gamer',
  'Mouse Gamer',
];

const MAX_HISTORY = 15;

export function SmartInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  suggestions = DEFAULT_EQUIPMENT,
  storageKey = 'smart_input_equipment_history',
}: SmartInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isInteractingWithSuggestions, setIsInteractingWithSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setHistory(JSON.parse(saved));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, [storageKey]);

  const saveToHistory = (text: string) => {
    if (!text.trim() || text.length < 3) return;

    const normalized = text.trim();

    setHistory((prev) => {
      const next = [normalized, ...prev.filter((x) => x !== normalized)].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const updateFiltered = (text: string) => {
    const q = text.trim().toLowerCase();
    if (!q) {
      setFilteredSuggestions([]);
      return;
    }

    // Prioriza histórico, depois lista default
    const combined = [...history, ...suggestions].filter(Boolean);
    const uniq = Array.from(new Set(combined));

    const filtered = uniq
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 10);

    setFilteredSuggestions(filtered);
  };

  useEffect(() => {
    updateFiltered(value);
    setSelectedIndex(-1);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!t) return;
      if (suggestionsRef.current?.contains(t)) return;
      if (inputRef.current?.contains(t)) return;
      setShowSuggestions(false);
      setSelectedIndex(-1);
    };

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const onPick = (text: string) => {
    onChange(text);
    saveToHistory(text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((p) => Math.min(p + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        e.preventDefault();
        onPick(filteredSuggestions[selectedIndex]);
      } else {
        saveToHistory(value);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={onKeyDown}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            if (value.trim()) saveToHistory(value);
            setShowSuggestions(true);
            inputRef.current?.focus();
          }}
          title="Sugestões"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-2 w-full rounded-md border border-border bg-card/95 backdrop-blur shadow-lg overflow-hidden"
          onMouseEnter={() => setIsInteractingWithSuggestions(true)}
          onMouseLeave={() => setIsInteractingWithSuggestions(false)}
        >
          {filteredSuggestions.map((s, idx) => (
            <button
              key={s}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors',
                idx === selectedIndex && 'bg-muted/50'
              )}
              onMouseMove={() => setSelectedIndex(idx)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(s)}
            >
              <span>{s}</span>
              {s === value && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}

      {/* Se usuário está digitando e tem histórico/sugestões, mantém dropdown vivo */}
      {showSuggestions && filteredSuggestions.length === 0 && value.trim().length >= 2 && !isInteractingWithSuggestions && (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-border bg-card/95 backdrop-blur shadow-lg px-3 py-2 text-sm text-muted-foreground">
          Continue digitando para ver sugestões…
        </div>
      )}
    </div>
  );
}
