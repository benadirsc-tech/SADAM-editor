import React, { useState } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { ImageUploader } from './components/ImageUploader';
import { SparklesIcon, LoadingSpinner, DownloadIcon, PhotoIcon, LightBulbIcon, ScissorsIcon } from './components/Icons';
import { ZoomableImage } from './components/ZoomableImage';
import { AppState, ImageFile } from './types';

const SUGGESTIONS = [
  { label: "Watercolor 🎨", prompt: "Convert this image into a watercolor painting style" },
  { label: "Sunglasses 🕶️", prompt: "Add a pair of cool sunglasses to the person" },
  { label: "Cyberpunk 🌆", prompt: "Change the background to a futuristic cyberpunk city with neon lights" },
  { label: "Sketch ✏️", prompt: "Turn this image into a charcoal sketch" },
  { label: "Vintage 📸", prompt: "Apply a vintage 90s film grain filter" },
  { label: "Snowy ❄️", prompt: "Make it look like it is snowing" },
];

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [inputImage, setInputImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for download format
  const [downloadFormat, setDownloadFormat] = useState<string>('png');

  const handleGenerate = async (overridePrompt?: string) => {
    // If a prompt override is provided (e.g. from a quick action button), use it.
    // Otherwise use the state prompt.
    const promptToUse = typeof overridePrompt === 'string' ? overridePrompt : prompt;

    if (!inputImage || !promptToUse.trim()) return;

    // If we're using an override, update the visual prompt state to match
    if (overridePrompt) {
      setPrompt(overridePrompt);
    }

    setAppState(AppState.PROCESSING);
    setError(null);
    setResultImage(null);
    setResultText(null);

    try {
      const response = await editImageWithGemini(
        inputImage.base64,
        inputImage.mimeType,
        promptToUse
      );

      if (response.imageUrl) {
        setResultImage(response.imageUrl);
      }
      if (response.text) {
        setResultText(response.text);
      }

      if (!response.imageUrl && !response.text) {
        throw new Error("The model didn't return an image or text. Try a different prompt.");
      }

      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleRemoveBackground = () => {
    handleGenerate("Remove the background");
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setInputImage(null);
    setResultImage(null);
    setResultText(null);
    setPrompt('');
    setError(null);
  };

  const handleDownload = () => {
    if (!resultImage) return;

    const img = new Image();
    img.src = resultImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill white background for JPEGs to handle transparency
      if (downloadFormat === 'jpg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mimeType = downloadFormat === 'jpg' ? 'image/jpeg' : `image/${downloadFormat}`;
      const extension = downloadFormat;

      const dataUrl = canvas.toDataURL(mimeType, 0.9);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `sadaam-edit.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const isProcessing = appState === AppState.PROCESSING;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-banana-400 to-banana-600 flex items-center justify-center shadow-lg shadow-banana-500/20">
              <SparklesIcon className="w-5 h-5 text-slate-900" />
            </div>
            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
              Sadaam Editor
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded">
            gemini-2.5-flash-image
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* Left Column: Input */}
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-sm text-slate-400 border border-slate-700">1</span>
                Upload Image
              </h2>
              <ImageUploader 
                currentImage={inputImage} 
                onImageSelected={setInputImage}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-sm text-slate-400 border border-slate-700">2</span>
                  Describe Edit
                </h2>
                
                {/* Remove Background Button */}
                <button
                  onClick={handleRemoveBackground}
                  disabled={!inputImage || isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Remove background from image"
                >
                  <ScissorsIcon className="w-3.5 h-3.5 text-banana-400 group-hover:text-banana-300" />
                  Remove Background
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isProcessing}
                  placeholder="e.g. Put me in a mosque and don't change the face (waxaad igeysaa masjid wajigana wax haka badelin)..."
                  className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-banana-500/50 focus:border-banana-500 outline-none resize-none transition-all"
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                  {prompt.length} chars
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <LightBulbIcon className="w-3 h-3" />
                  Try these ideas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => setPrompt(suggestion.prompt)}
                      disabled={isProcessing}
                      className="text-xs bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-banana-500/50 text-slate-400 hover:text-banana-100 px-3 py-1.5 rounded-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={!inputImage || !prompt.trim() || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                ${(!inputImage || !prompt.trim() || isProcessing)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700'
                  : 'bg-gradient-to-r from-banana-500 to-banana-600 hover:from-banana-400 hover:to-banana-500 text-slate-900 shadow-banana-500/20 hover:shadow-banana-500/40 hover:-translate-y-0.5'
                }`}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner className="w-5 h-5" />
                  Processing with Gemini...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Magic
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-200 rounded-xl text-sm flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col gap-4 h-full">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-sm text-slate-400 border border-slate-700">3</span>
              Result
            </h2>
            
            <div className={`flex-1 min-h-[400px] rounded-2xl border-2 flex items-center justify-center overflow-hidden relative transition-all duration-500
              ${resultImage 
                ? 'bg-slate-900 border-slate-700' 
                : 'bg-slate-900/50 border-slate-800 border-dashed'
              }`}>
              
              {resultImage ? (
                <ZoomableImage src={resultImage} alt="Generated result">
                  {/* Download Controls Overlay */}
                  <div 
                    onMouseDown={(e) => e.stopPropagation()} 
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-auto z-20"
                  >
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-lg shadow-xl flex items-center p-1 border border-slate-700/50">
                      <select 
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value)}
                        className="bg-transparent text-slate-300 text-xs font-medium focus:outline-none px-2 py-1.5 border-r border-slate-700 cursor-pointer hover:text-white"
                        aria-label="Download format"
                      >
                        <option value="png" className="bg-slate-800 text-slate-200">PNG</option>
                        <option value="jpg" className="bg-slate-800 text-slate-200">JPG</option>
                        <option value="webp" className="bg-slate-800 text-slate-200">WEBP</option>
                      </select>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 text-white px-3 py-1.5 hover:bg-banana-500 hover:text-slate-900 rounded-md transition-colors text-xs font-bold uppercase tracking-wider"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                </ZoomableImage>
              ) : isProcessing ? (
                <div className="flex flex-col items-center gap-4 text-slate-500 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                    <SparklesIcon className="w-8 h-8 text-banana-500/50" />
                  </div>
                  <p>Dreaming up pixels...</p>
                </div>
              ) : (
                <div className="text-center text-slate-600 p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <PhotoIcon className="w-10 h-10 opacity-50" />
                  </div>
                  <p>Your masterpiece will appear here</p>
                </div>
              )}
            </div>

            {/* If the model returned text along with (or instead of) the image, display it */}
            {resultText && (
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Response</h4>
                 <p className="text-slate-300 text-sm leading-relaxed">{resultText}</p>
              </div>
            )}

            {resultImage && (
              <button 
                onClick={handleReset}
                className="self-end text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
              >
                Start Over
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;