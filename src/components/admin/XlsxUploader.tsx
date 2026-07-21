import { useRef, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Loader2, XCircle } from 'lucide-react';
import { addGift } from '@/lib/services/gifts';
import { guessRoom, parseBRLPrice } from '@/lib/utils';

interface Props {
  onImportComplete: () => void;
}

export default function XlsxUploader({ onImportComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setResult({ success: false, count: 0, message: 'Por favor, envie um arquivo .xlsx' });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const { readSheet } = await import('read-excel-file/browser');
      const rows = await readSheet(file);

      let headerIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (row && row.some((cell) => typeof cell === 'string' && /[ií]tem/i.test(cell))) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) {
        setResult({ success: false, count: 0, message: 'Cabeçalho "Item" não encontrado na planilha.' });
        return;
      }

      const dataRows = rows.slice(headerIdx + 1).filter(row => row && row.length > 1 && row[1]);
      let importedCount = 0;

      for (const row of dataRows) {
        const name = (row[1] || '').toString().trim();
        const priceRaw = (row[2] || '').toString().trim();
        const link = (row[3] || '').toString().trim();
        const description = (row[4] || '').toString().trim();
        const color = (row[5] || '').toString().trim();

        if (!name) continue;

        const price = parseBRLPrice(priceRaw);
        const room = guessRoom(name, description);

        await addGift({
          tenant_id: 'tenant-1',
          name,
          description: description || name,
          price,
          room,
          color: color || null,
          store_name: link.includes('shopee') ? 'Shopee' : link.includes('mercadolivre') ? 'Mercado Livre' : link.includes('amazon') ? 'Amazon' : 'Loja Online',
          store_link: link || null,
          status: 'disponivel',
          is_featured: false,
          image_url: `https://picsum.photos/seed/${encodeURIComponent(name.slice(0, 20))}${importedCount}/800/800`,
        });
        importedCount++;
      }

      setResult({ success: true, count: importedCount, message: `${importedCount} presentes importados com sucesso!` });
      onImportComplete?.();
    } catch {
      setResult({ success: false, count: 0, message: 'Erro ao processar a planilha.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-slate-50/50 hover:border-primary-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="space-y-3">
          {isUploading ? (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
              <p className="text-sm text-slate-500">Importando presentes...</p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <FileSpreadsheet className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Arraste sua planilha .xlsx aqui ou clique para selecionar
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Formato: Item | Preço | Link | Descrição | Cor/Variação
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {result && (
        <div className={`flex items-center gap-3 rounded-xl p-4 text-sm ${
          result.success ? 'border border-sage-100 bg-sage-50 text-sage-700' : 'border border-red-200 bg-red-50 text-red-800'
        }`}>
          {result.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
          {result.message}
        </div>
      )}
    </div>
  );
}
