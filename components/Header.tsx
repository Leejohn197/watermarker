import React from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ language, setLanguage }) => {
  const t = translations[language];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 rounded-lg p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">ClearView<span className="text-primary-600">AI</span></span>
          </div>
          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
               className="text-sm font-medium text-gray-700 hover:text-primary-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 transition-colors flex items-center gap-1.5"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
               </svg>
               {language === 'en' ? 'English' : '中文'}
             </button>
             <a href="#" className="hidden sm:inline-block text-sm font-medium text-gray-500 hover:text-gray-900">{t.nav.howItWorks}</a>
             <a href="#" className="hidden sm:inline-block text-sm font-medium text-gray-500 hover:text-gray-900">{t.nav.pricing}</a>
          </div>
        </div>
      </div>
    </header>
  );
};