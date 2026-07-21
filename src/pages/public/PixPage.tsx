import PixSection from '@/components/public/PixSection';
import { motion } from 'motion/react';
import { Navigate } from 'react-router';
import { useTenant } from '@/contexts/TenantContext';
import { useSiteConfig } from '@/hooks/useSiteConfig';

export default function PixPage() {
  const { slug } = useTenant();
  const { data: config = {} } = useSiteConfig();
  const pix = config.pix;

  if (!pix?.enabled || !pix.key) {
    return <Navigate to={`/${slug}`} replace />;
  }

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[#a89e95] font-medium">Presente em dinheiro</p>
        <div className="divider-ornament" />
      </motion.div>
      <PixSection pix={pix} />
    </div>
  );
}
