import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  aspectRatio?: 'square' | 'wide';
  maxSizeMB?: number;
  label?: string;
}

export default function ImageUploader({
  currentUrl,
  onUpload,
  onRemove,
  aspectRatio = 'square',
  maxSizeMB = 5,
  label = 'Imagem',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass = aspectRatio === 'wide' ? 'aspect-[21/9]' : 'aspect-square';
  const displayUrl = preview || currentUrl;

  const validateAndUpload = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Arquivo deve ser uma imagem (JPG, PNG ou WebP).');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Imagem deve ter no máximo ${maxSizeMB}MB.`);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      await onUpload(file);
    } catch {
      setError('Erro ao enviar imagem. Tente novamente.');
      setPreview(null);
      URL.revokeObjectURL(localPreview);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    onRemove?.();
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-500">{label}</label>

      {displayUrl ? (
        <div className="relative group">
          <div className={`${aspectClass} rounded-xl overflow-hidden bg-slate-100 border border-slate-200`}>
            <img
              src={displayUrl}
              alt={label}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-white/90 shadow-sm hover:bg-white text-slate-600 hover:text-primary-600 transition-colors"
              title="Trocar imagem"
            >
              <Upload className="w-4 h-4" />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg bg-white/90 shadow-sm hover:bg-white text-slate-600 hover:text-red-600 transition-colors"
                title="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`${aspectClass} border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-slate-200 hover:border-primary-300 bg-slate-50/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) validateAndUpload(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-8 h-8 text-slate-300" />
          <p className="text-xs text-slate-400">Arraste ou clique para enviar</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validateAndUpload(file);
          e.target.value = '';
        }}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
