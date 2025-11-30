import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ImageCompare } from './components/ImageCompare';
import { Button } from './components/Button';
import { ThumbnailStrip } from './components/ThumbnailStrip';
import { AppState, FileData, Language, ProcessingMode } from './types';
import { processFile, validateFile, readFileAsBase64 } from './utils/fileHelpers';
import { removeWatermark } from './services/geminiService';
import { translations } from './utils/translations';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh');
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [processingMode, setProcessingMode] = useState<ProcessingMode>(ProcessingMode.WATERMARK);
  
  const t = translations[language];

  const selectedFile = files.find(f => f.id === selectedFileId);

  // Paste Event Handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const file = e.clipboardData.files[0];
        const validationError = validateFile(file);
        
        if (!validationError) {
          try {
            const data = await processFile(file);
            setFiles(prev => [...prev, data]);
            setSelectedFileId(data.id);
          } catch (err) {
            console.error("Paste error", err);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = async (file: File) => {
    try {
      const data = await processFile(file);
      setFiles(prev => [...prev, data]);
      setSelectedFileId(data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Revoke object URL to avoid memory leaks
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
      if (fileToRemove.processedUrl) {
        // processUrl is a base64 string usually, so no revoke needed unless we change to blob later
      }
    }

    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  const updateFileState = (id: string, updates: Partial<FileData>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleRemoveWatermark = async () => {
    if (!selectedFile) return;

    updateFileState(selectedFile.id, { status: AppState.PROCESSING, error: null });

    try {
      // Performance Optimization: Convert to base64 only when needed
      const base64 = await readFileAsBase64(selectedFile.file);

      const resultBase64 = await removeWatermark(
        base64,
        selectedFile.mimeType,
        processingMode,
        customInstruction
      );
      updateFileState(selectedFile.id, { 
        status: AppState.COMPLETED, 
        processedUrl: resultBase64 
      });
    } catch (err: any) {
      console.error(err);
      updateFileState(selectedFile.id, { 
        status: AppState.ERROR, 
        error: err.message || "Failed to process image."
      });
    }
  };

  const handleDownload = () => {
    if (!selectedFile?.processedUrl) return;
    const link = document.createElement('a');
    link.href = selectedFile.processedUrl;
    link.download = `clearview-edited-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetCurrent = () => {
    if (selectedFileId) {
       updateFileState(selectedFileId, { 
         status: AppState.IDLE, 
         processedUrl: null,
         error: null
       });
       setCustomInstruction('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header language={language} setLanguage={setLanguage} />

      <main className="flex-grow flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow flex flex-col">
          
          {/* Hero / Empty State */}
          {files.length === 0 && (
            <div className="flex-grow flex flex-col justify-center">
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                  {t.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">{t.titleSuffix}</span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-gray-600">
                  {t.subtitle}
                </p>
              </div>
              <FileUpload onFileSelect={handleFileSelect} language={language} />
            </div>
          )}

          {/* Editor Area */}
          {selectedFile && (
            <div className="flex flex-col items-center animate-fade-in space-y-6 flex-grow">
              
              {/* Toolbar */}
              <div className="w-full max-w-5xl bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                
                {/* Mode Selector */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.modeLabel}
                  </label>
                  <select 
                    value={processingMode}
                    onChange={(e) => setProcessingMode(e.target.value as ProcessingMode)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white"
                    disabled={selectedFile.status === AppState.PROCESSING}
                  >
                    <option value={ProcessingMode.WATERMARK}>{t.modes.watermark}</option>
                    <option value={ProcessingMode.STICKER}>{t.modes.sticker}</option>
                    <option value={ProcessingMode.TEXT}>{t.modes.text}</option>
                    <option value={ProcessingMode.GENERAL}>{t.modes.general}</option>
                  </select>
                </div>

                {/* Custom Instruction */}
                <div className="lg:col-span-5">
                  <label htmlFor="instruction" className="block text-sm font-medium text-gray-700 mb-1">
                    {t.customInstruction}
                  </label>
                  <input
                    type="text"
                    id="instruction"
                    placeholder={t.customPlaceholder}
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2 border"
                    disabled={selectedFile.status === AppState.PROCESSING}
                  />
                </div>
                
                {/* Actions */}
                <div className="lg:col-span-4 flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-gray-200 hover:border-red-200 px-3"
                    onClick={(e) => handleRemoveFile(selectedFile.id, e)}
                    disabled={selectedFile.status === AppState.PROCESSING}
                    title={t.delete}
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={handleResetCurrent}
                    disabled={selectedFile.status === AppState.PROCESSING || selectedFile.status === AppState.IDLE}
                    title={t.reset}
                  >
                    {t.reset}
                  </Button>
                  
                  {selectedFile.status !== AppState.COMPLETED ? (
                    <Button 
                      onClick={handleRemoveWatermark}
                      isLoading={selectedFile.status === AppState.PROCESSING}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      }
                    >
                      {t.process}
                    </Button>
                  ) : (
                     <Button 
                      variant="primary"
                      onClick={handleDownload}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      }
                    >
                      {t.download}
                    </Button>
                  )}
                </div>
              </div>

              {selectedFile.error && (
                 <div className="w-full max-w-5xl bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                    <p className="font-semibold">{t.error}:</p>
                    <p>{selectedFile.error}</p>
                 </div>
              )}

              {/* Image Display Area */}
              <div className="w-full flex justify-center flex-grow">
                {selectedFile.status === AppState.COMPLETED && selectedFile.processedUrl ? (
                  <ImageCompare 
                    beforeImage={selectedFile.previewUrl} 
                    afterImage={selectedFile.processedUrl} 
                  />
                ) : (
                  <div className="relative w-full max-w-5xl rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100 min-h-[400px] flex items-center justify-center">
                     <img 
                      src={selectedFile.previewUrl} 
                      alt="Original" 
                      className={`w-full h-auto max-h-[60vh] object-contain transition-opacity duration-500 ${selectedFile.status === AppState.PROCESSING ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                    />
                    {selectedFile.status === AppState.PROCESSING && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                         <div className="bg-white/90 backdrop-blur px-8 py-6 rounded-2xl shadow-xl flex flex-col items-center">
                            <svg className="animate-spin h-10 w-10 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-gray-900 font-semibold text-lg">{t.processing}</p>
                            <p className="text-gray-500 text-sm mt-1">{t.processingDesc}</p>
                         </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Upload More (Mini Dropzone) if files exist and not in empty state */}
           {files.length > 0 && !selectedFile && (
              <div className="flex-grow flex items-center justify-center">
                 <div className="text-gray-400 text-center">
                    <p>{t.emptyGallery}</p>
                    <FileUpload onFileSelect={handleFileSelect} language={language} />
                 </div>
              </div>
           )}

        </div>
      </main>

      {/* Thumbnail Strip (Gallery) */}
      <ThumbnailStrip 
        files={files} 
        selectedId={selectedFileId} 
        onSelect={setSelectedFileId} 
        onRemove={handleRemoveFile}
        language={language}
      />

      <footer className="bg-white border-t border-gray-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} {t.footer}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;