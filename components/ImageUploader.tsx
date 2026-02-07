import React, { useCallback, useRef } from 'react';
import { ImageFile } from '../types';
import { UploadIcon, PhotoIcon, CloseIcon } from './Icons';

interface ImageUploaderProps {
  currentImage: ImageFile | null;
  onImageSelected: (image: ImageFile | null) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageSelected, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Extract the base64 data part (remove data:image/jpeg;base64, prefix)
      const base64 = result.split(',')[1];
      
      onImageSelected({
        file,
        preview: result,
        base64,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (currentImage) {
    return (
      <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-700 group">
        <img 
          src={currentImage.preview} 
          alt="Original upload" 
          className="w-full h-full object-contain"
        />
        {!disabled && (
          <button 
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-sm"
            title="Remove image"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
        <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-md">
          Original
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`w-full h-64 md:h-96 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${disabled 
          ? 'border-slate-700 bg-slate-900 opacity-50 cursor-not-allowed' 
          : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800 hover:border-banana-400 hover:shadow-lg hover:shadow-banana-500/10'
        }`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept="image/*" 
        className="hidden" 
        disabled={disabled}
      />
      <div className="bg-slate-700/50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
        <PhotoIcon className={`w-8 h-8 ${disabled ? 'text-slate-500' : 'text-banana-400'}`} />
      </div>
      <p className={`text-sm font-medium ${disabled ? 'text-slate-500' : 'text-slate-300'}`}>
        Click to upload or drag & drop
      </p>
      <p className="text-xs text-slate-500 mt-2">
        Supports JPG, PNG, WEBP
      </p>
    </div>
  );
};
