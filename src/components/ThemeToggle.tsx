import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme';

interface Props {
  /** Called after the user changes theme, e.g. to persist it on the server */
  onChange?: (theme: 'LIGHT' | 'DARK') => void;
}

export function ThemeToggle({ onChange }: Props) {
  const resolved = useThemeStore((s) => s.resolved);
  const setPreference = useThemeStore((s) => s.setPreference);
  const next = resolved === 'dark' ? 'LIGHT' : 'DARK';
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Switch to ${next === 'LIGHT' ? 'light' : 'dark'} theme`}
      onClick={() => {
        setPreference(next);
        onChange?.(next);
      }}
    >
      {resolved === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
