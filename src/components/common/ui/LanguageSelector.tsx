"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Languages } from "lucide-react";
import { languages, navigateToLanguage, getCurrentLanguageFromContext } from "@/utils/language-storage";

interface LanguageSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function LanguageSelector({ value, onValueChange, className }: LanguageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Get current language from URL or localStorage
  const currentLanguage = value || getCurrentLanguageFromContext();

  // Filter languages based on search query
  const filteredLanguages = languages.filter((language) =>
    language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    language.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    language.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = (languageCode: string) => {
    if (onValueChange) {
      onValueChange(languageCode);
    } else {
      // Default behavior: navigate to language URL
      navigateToLanguage(languageCode as any);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className={`flex items-center gap-3 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors ${className}`}>
          <Languages className="h-4 w-4 text-black flex-shrink-0" />
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-black">Language</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedLanguage?.code.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Language</DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="mb-4">
          <Input
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Language List */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filteredLanguages.map((language) => (
            <div
              key={language.code}
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
                currentLanguage === language.code ? 'bg-gray-100 border border-gray-300' : ''
              }`}
              onClick={() => handleLanguageSelect(language.code)}
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium text-sm">{language.name}</div>
                  <div className="text-xs text-gray-600">{language.nativeName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase">{language.code}</span>
                {currentLanguage === language.code && (
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredLanguages.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No languages found matching "{searchQuery}"
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
