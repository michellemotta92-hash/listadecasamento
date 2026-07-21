import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, QrCode } from 'lucide-react';
import { PixConfig } from '@/types';
import { useToast } from '@/contexts/ToastContext';

const keyTypeLabels: Record<PixConfig['key_type'], string> = {
  cpf: 'CPF',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatória',
};

interface Props {
  pix: PixConfig;
  compact?: boolean;
}

export default function PixSection({ pix, compact }: Props) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(pix.key);
      setCopied(true);
      showToast('Chave Pix copiada!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Não foi possível copiar. Copie manualmente.', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${compact ? '' : 'max-w-lg mx-auto'} space-y-6`}
    >
      {!compact && (
        <div className="text-center space-y-2">
          <QrCode className="w-8 h-8 text-primary-500 mx-auto" />
          <h2 className="font-heading text-3xl font-light text-[#4a3f38]">
            {pix.title || 'Contribua com Pix'}
          </h2>
          {pix.description && (
            <p className="text-[#8a7e76] font-light leading-relaxed">{pix.description}</p>
          )}
        </div>
      )}

      {pix.qr_image_url && (
        <div className="flex justify-center">
          <img
            src={pix.qr_image_url}
            alt="QR Code Pix"
            className="w-48 h-48 md:w-56 md:h-56 rounded-xl border border-[#e0d0c8] shadow-soft object-contain bg-white p-2"
          />
        </div>
      )}

      <div className="glass-card p-6 space-y-4 shadow-soft">
        {pix.beneficiary_name && (
          <p className="text-center text-sm text-[#6a5d54]">
            <span className="text-[#a89e95]">Beneficiário: </span>
            <strong className="font-medium">{pix.beneficiary_name}</strong>
          </p>
        )}
        <p className="text-center text-xs uppercase tracking-wider text-[#a89e95]">
          {keyTypeLabels[pix.key_type]}
        </p>
        <p className="text-center font-mono text-sm md:text-base text-[#3d3530] break-all px-2">
          {pix.key}
        </p>
        <button
          type="button"
          onClick={copyKey}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-full transition-colors text-sm uppercase tracking-wider"
          aria-label="Copiar chave Pix"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar chave Pix'}
        </button>
      </div>
    </motion.div>
  );
}
