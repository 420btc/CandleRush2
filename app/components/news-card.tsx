"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { TranslateButton } from './translate-button';

interface NewsCardProps {
  title?: string;
  description?: string;
  pubDate?: string;
  link?: string;
}

export function NewsCard({ title, description, pubDate, link }: NewsCardProps) {
  const [translatedTitle, setTranslatedTitle] = useState(title || 'Título no disponible');
  const [translatedDescription, setTranslatedDescription] = useState(description?.substring(0, 150) || 'Contenido no disponible');

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {translatedTitle}
            </CardTitle>
            {pubDate && (
              <CardDescription>
                {new Date(pubDate).toLocaleDateString('es-ES', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </CardDescription>
            )}
          </div>
          <TranslateButton
            text={title || 'Título no disponible'}
            onTranslated={setTranslatedTitle}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between items-start">
          <p className="text-sm text-muted-foreground">
            {translatedDescription}
            {description && description.length > 150 ? '...' : ''}
          </p>
          <TranslateButton
            text={description?.substring(0, 150) || 'Contenido no disponible'}
            onTranslated={setTranslatedDescription}
          />
        </div>
      </CardContent>
      {link && (
        <div className="p-4 pt-0">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Leer más
          </a>
        </div>
      )}
    </Card>
  );
}
