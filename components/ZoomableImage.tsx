import React, { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon, ResetIcon } from './Icons';

interface ZoomableImageProps {
  src: string;
  alt?: string;
  children?: React.ReactNode;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt = '', children }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation(); 
    // Sensitivity factor for wheel zoom
    const delta = -Math.sign(e.deltaY) * 0.2;
    setScale(s => Math.min(Math.max(0.5, s + delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Reset view when image source changes
  useEffect(() => {
    handleReset();
  }, [src]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden group select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          transformOrigin: 'center',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Zoom Controls */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onMouseDown={e => e.stopPropagation()}
      >
        <button onClick={handleZoomOut} className="p-1 hover:text-banana-400 text-slate-300 transition-colors" title="Zoom Out">
          <MinusIcon className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono w-10 text-center text-slate-400">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="p-1 hover:text-banana-400 text-slate-300 transition-colors" title="Zoom In">
          <PlusIcon className="w-5 h-5" />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1"></div>
        <button onClick={handleReset} className="p-1 hover:text-banana-400 text-slate-300 transition-colors" title="Reset View">
          <ResetIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Children overlays (e.g. Download button) */}
      {children && (
        <div className="absolute inset-0 pointer-events-none">
           {children}
        </div>
      )}
    </div>
  );
};