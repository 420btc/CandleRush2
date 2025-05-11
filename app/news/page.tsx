import Parser from 'rss-parser';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TranslateButton } from '../components/translate-button';
import { ArrowLeft } from 'lucide-react';

// Define la estructura esperada de un item del feed
interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  isoDate?: string;
}

// Define la estructura esperada del feed parseado
interface ParsedFeed {
  items: FeedItem[];
}

async function getNews(): Promise<FeedItem[]> {
  const parser = new Parser(); // No necesitamos tipar el parser
  const COINDESK_RSS_URL = 'https://www.coindesk.com/arc/outboundfeeds/rss/'; // URL del feed RSS general de CoinDesk

  try {
    const feed = await parser.parseURL(COINDESK_RSS_URL);
    return feed.items.slice(0, 15); // Devuelve los 15 artículos más recientes
  } catch (error) {
    console.error("Error fetching or parsing RSS feed:", error);
    return []; // Devuelve un array vacío en caso de error
  }
}

export default async function NewsPage() {
  const newsItems = await getNews();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/menu" className="flex items-center gap-2 p-2 rounded-md bg-yellow-400 text-black hover:bg-yellow-300 transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-black">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Volver al Menú</span>
          </Link>
          <TranslateButton text="Traducir" />
        </div>
        <Link href="/profile" className="flex items-center gap-2 p-2 rounded-md bg-yellow-400 text-black hover:bg-yellow-300 transition-colors">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-black">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Volver al Perfil</span>
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-7xl font-extrabold text-yellow-400 italic text-center mb-4">NOTICIAS</h1>
      </div>

      {newsItems.length === 0 && (
        <p>No se pudieron cargar las noticias en este momento. Inténtalo más tarde.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {newsItems.map((item, index) => (
          <Card key={item.link || index} className="flex flex-col bg-yellow-400 text-black">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {item.title || 'Título no disponible'}
              </CardTitle>
              {item.pubDate && (
                <CardDescription className="font-semibold text-green-500">
                  {new Date(item.pubDate).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-grow bg-yellow-400 text-black">
              <p className="text-sm text-black font-bold">
                {item.contentSnippet?.substring(0, 150) || 'Contenido no disponible'}
                {item.contentSnippet && item.contentSnippet.length > 150 ? '...' : ''}
              </p>
            </CardContent>
            {item.link && (
              <div className="p-4 pt-0">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold border border-black rounded text-black hover:text-yellow-400"
                >
                  Leer más
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}