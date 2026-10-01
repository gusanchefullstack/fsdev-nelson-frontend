import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: ComboOption[];
  placeholder: string;
  searchPlaceholder?: string;
  invalid?: boolean;
  describedBy?: string;
}

/** Searchable select for long lists (countries, time zones). */
export function Combobox({ id, value, onChange, options, placeholder, searchPlaceholder = 'Search…', invalid, describedBy }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground')}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            {options.map((o) => (
              <CommandItem
                key={o.value}
                value={`${o.label} ${o.value}`}
                onSelect={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <Check className={cn('size-4', o.value === value ? 'opacity-100' : 'opacity-0')} aria-hidden />
                <span className="truncate">{o.label}</span>
                {o.hint && <span className="ml-auto text-xs text-muted-foreground">{o.hint}</span>}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
