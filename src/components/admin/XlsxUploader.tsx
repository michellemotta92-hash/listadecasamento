import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { addGift } from '@/lib/services/gifts';
import { parseBRLPrice, guessRoom } from '@/lib/utils';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  onImportComplete?: () => void;
}

export default function XlsxUploader({ onImportComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setResult({ success: false, count: 0, message: 'Por favor, envie um arquivo .xlsx ou .xls' });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Find header row
      let headerIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (row && row.some((cell: any) => typeof cell === 'string' && /[ií]tem/i.test(cell))) {
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
    } catch (err) {
      setResult({ success: false, count: 0, message: 'Erro ao processar a planilha.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
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
          if (file) handleFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="space-y-3">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary-500 mx-auto animate-spin" />
              <p className="text-sm text-slate-500">Importando presentes...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Arraste sua planilha .xlsx aqui ou clique para selecionar
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formato: Item | Preço | Link | Descrição | Cor/Variação
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {result && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm ${
          result.success
            ? 'bg-sage-50 border border-sage-100 text-sage-700'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          {result.message}
        </div>
      )}
    </div>
  );
}
