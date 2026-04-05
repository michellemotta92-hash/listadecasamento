import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical, Check, Move } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  aspectRatio: number; // width / height, e.g. 21/9 or 1
  onSave: (file: File) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageUrl, aspectRatio, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [loaded, setLoaded] = useState(false);

  // Load the image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw to canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const container = containerRef.current;
    if (!container) return;

    const containerW = container.clientWidth;
    const containerH = containerW / aspectRatio;

    canvas.width = containerW * 2; // 2x for retina
    canvas.height = containerH * 2;
    canvas.style.width = `${containerW}px`;
    canvas.style.height = `${containerH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Move to center
    ctx.translate(canvas.width / 2 + offset.x * 2, canvas.height / 2 + offset.y * 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flips
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Scale image to fill the canvas area, then apply zoom
    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    const baseScale = Math.max(scaleX, scaleY);
    const scale = baseScale * zoom;

    ctx.drawImage(
      img,
      -img.width / 2,
      -img.height / 2,
      img.width,
      img.height,
    );

    // We need to scale before drawing
    ctx.restore();

    // Redraw with proper scaling
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.translate(canvas.width / 2 + offset.x * 2, canvas.height / 2 + offset.y * 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale((flipH ? -1 : 1) * scale, (flipV ? -1 : 1) * scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, [zoom, rotation, flipH, flipV, offset, brightness, contrast, aspectRatio, loaded]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Mouse drag for repositioning
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.001)));
  };

  // Export
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create an export canvas at a good resolution
    const exportCanvas = document.createElement('canvas');
    const maxDim = 1920;
    exportCanvas.width = aspectRatio >= 1 ? maxDim : Math.round(maxDim * aspectRatio);
    exportCanvas.height = aspectRatio >= 1 ? Math.round(maxDim / aspectRatio) : maxDim;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx || !imgRef.current) return;

    const img = imgRef.current;
    const scaleX = exportCanvas.width / img.width;
    const scaleY = exportCanvas.height / img.height;
    const baseScale = Math.max(scaleX, scaleY);
    const scale = baseScale * zoom;

    // Ratio between export and display canvas
    const displayCanvas = canvasRef.current;
    const ratioX = exportCanvas.width / displayCanvas.width;
    const ratioY = exportCanvas.height / displayCanvas.height;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.translate(exportCanvas.width / 2 + offset.x * 2 * ratioX, exportCanvas.height / 2 + offset.y * 2 * ratioY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale((flipH ? -1 : 1) * scale, (flipV ? -1 : 1) * scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    exportCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
        onSave(file);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">Editar Imagem</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="bg-slate-900 p-4">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg mx-auto cursor-move"
            style={{ maxWidth: '100%' }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              className="block w-full touch-none"
              style={{ aspectRatio: String(aspectRatio) }}
            />
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '33.33% 33.33%',
            }} />
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 space-y-4 border-t border-slate-200">
          {/* Toolbar */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="50"
              max="300"
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
              className="w-32 accent-primary-600"
            />
            <button
              onClick={() => setZoom(prev => Math.min(5, prev + 0.1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="Girar 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlipH(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${flipH ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
              title="Espelhar horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlipV(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${flipV ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
              title="Espelhar vertical"
            >
              <FlipVertical className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <button
              onClick={() => { setZoom(1); setRotation(0); setFlipH(false); setFlipV(false); setOffset({ x: 0, y: 0 }); setBrightness(100); setContrast(100); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              Resetar
            </button>
          </div>

          {/* Brightness & Contrast */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-1 block">
                Brilho: {brightness}%
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-1 block">
                Contraste: {contrast}%
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Move className="w-3 h-3" /> Arraste a imagem para reposicionar · Use o scroll do mouse para zoom
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Aplicar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
