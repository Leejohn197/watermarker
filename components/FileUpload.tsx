import React, { useCallback, useState } from 'react';
import { validateFile } from '../utils/fileHelpers';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  language: Language;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, language }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-primary-500 bg-primary-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 bg-white'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragging ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}
          `}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {isDragging ? 'Drop image here' : t.uploadTitle}
            </h3>
            <p className="text-sm text-gray-500">
              {t.uploadSubtitle}
            </p>
          </div>

          <label className="cursor-pointer">
            <input 
              type="file" 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleFileInput}
            />
            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              {t.browse}
            </span>
          </label>
        </div>
        
        {error && (
          <div className="absolute -bottom-12 left-0 right-0">
             <div className="bg-red-50 text-red-600 text-sm py-2 px-4 rounded-md inline-block shadow-sm border border-red-100">
               {error}
             </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "✨", title: t.features.ai.title, desc: t.features.ai.desc },
          { icon: "⚡", title: t.features.fast.title, desc: t.features.fast.desc },
          { icon: "🔒", title: t.features.secure.title, desc: t.features.secure.desc },
        ].map((feat, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <span className="text-2xl mb-2">{feat.icon}</span>
            <h4 className="font-medium text-gray-900">{feat.title}</h4>
            <p className="text-xs text-gray-500">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};