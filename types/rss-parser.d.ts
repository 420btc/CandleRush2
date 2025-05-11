declare module 'rss-parser' {
  export interface Item {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    [key: string]: any;
  }

  export interface Feed {
    title: string;
    description: string;
    link: string;
    items: Item[];
    [key: string]: any;
  }

  export default class Parser {
    parseURL(url: string): Promise<Feed>;
  }
}
