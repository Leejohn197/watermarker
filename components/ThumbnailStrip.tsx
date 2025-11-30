import React from 'react';
import { FileData, AppState, Language } from '../types';
import { translations } from '../utils/translations';

interface ThumbnailStripProps {
  files: FileData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  language: Language;
}

export const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({ 
  files, 
  selectedId, 
  onSelect, 
  onRemove,
  language
}) => {
  const t = translations[language];

  if (files.length === 0) return null;

  return (
    <div className="w-full bg-white border-t border-gray-200 p-4 overflow-x-auto">
      <div className="flex space-x-4 min-w-min mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {files.map((file) => (
          <div 
            key={file.id} 
            className={`
              relative group flex-shrink-0 w-24 h-24 rounded-lg cursor-pointer border-2 transition-all overflow-hidden
              ${selectedId === file.id ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() => onSelect(file.id)}
          >
            <img 
              src={file.processedUrl || file.previewUrl} 
              alt="Thumbnail" 
              className="w-full h-full object-cover"
            />
            
            {/* Status Indicator */}
            {file.status === AppState.PROCESSING && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                 <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            
            {/* Success Indicator */}
            {file.status === AppState.COMPLETED && (
              <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-0.5 border border-white">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Remove Button */}
            <button 
              onClick={(e) => onRemove(file.id, e)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100"
              title={t.remove}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};