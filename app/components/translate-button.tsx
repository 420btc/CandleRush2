"use client";

import { useState, useEffect } from "react";

import { Globe } from "lucide-react";
import axios from "axios";

interface TranslateButtonProps {
  text: string;
  onTranslated?: (translatedText: string) => void;
}

export function TranslateButton({ text, onTranslated }: TranslateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  const translatePage = async () => {
    try {
      setIsLoading(true);
      
      // Aquí podríamos implementar la lógica para traducir toda la página
      // Por ahora, solo cambiamos el estado para mostrar que se tradujo
      setIsTranslated(true);
      
      // Si hay una función onTranslated, la llamamos
      if (onTranslated) {
        onTranslated('Página traducida al español');
      }
    } catch (error) {
      console.error('Error al traducir:', error);
      if (onTranslated) {
        onTranslated('Error al traducir');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={translatePage}
      disabled={isLoading || isTranslated}
      className={`flex items-center gap-2 p-2 rounded-md ${
        isLoading || isTranslated ? 'bg-yellow-300' : 'bg-yellow-400'
      } text-black hover:bg-yellow-300 transition-colors cursor-pointer`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
      ) : isTranslated ? (
        <>
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="text-green-400"
          >
            <path
              d="M9 12.75L15 18.75M9 12.75l6-6M9 12.75l-6.75-4.5M9 12.75l-2.25 3.75M9 12.75l-2.25 3.75M9 12.75l-6.75-4.5M9 12.75L9 19.5M9 12.75L9 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Traducido
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            className="text-yellow-400"
          >
            <path
              d="M12 2a10 10 0 0 0-9.95 9h11.61a8 8 0 1 1 0 12H2.05a10 10 0 1 0 0-18h10z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {text}
        </>
      )}
    </button>
  );
}
