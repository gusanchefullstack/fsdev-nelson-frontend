import { useMutation } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { useId, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export const PRESET_AVATARS = Array.from({ length: 8 }, (_, i) => `/avatars/avatar-${i + 1}.svg`);

interface Props {
  value: string;
  onChange: (url: string) => void;
  invalid?: boolean;
}

/** Preset avatars as a radio group, plus photo upload (FR-004). */
export function AvatarPicker({ value, onChange, invalid }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const name = useId();
  const upload = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.append('file', file);
      return api.put<{ avatarUrl: string }>('/me/avatar', data);
    },
    onSuccess: ({ avatarUrl }) => onChange(avatarUrl),
    onError: (e) => toast.error(isApiError(e) ? e.message : 'Upload failed. Please try again.'),
  });
  const isCustom = value !== '' && !PRESET_AVATARS.includes(value);

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Avatar" aria-invalid={invalid || undefined} className="flex flex-wrap gap-3">
        {isCustom && (
          <label className="cursor-pointer">
            <input type="radio" name={name} className="peer sr-only" checked readOnly />
            <img src={value} alt="Your upload" className="size-14 rounded-full object-cover ring-2 ring-primary ring-offset-2 ring-offset-card" />
          </label>
        )}
        {PRESET_AVATARS.map((url, i) => (
          <label key={url} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={url}
              checked={value === url}
              onChange={() => onChange(url)}
              className="peer sr-only"
            />
            <img
              src={url}
              alt={`Avatar ${i + 1}`}
              className={cn(
                'size-14 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                value === url ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : 'opacity-80 hover:opacity-100',
              )}
            />
          </label>
        ))}
      </div>
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = '';
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
          <Upload aria-hidden /> {upload.isPending ? 'Uploading…' : 'Upload a photo'}
        </Button>
        <span className="ml-2 text-xs text-muted-foreground">JPEG, PNG or WebP, up to 2 MB</span>
      </div>
    </div>
  );
}
