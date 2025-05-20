export type BookChapterElement =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string; isChapterOpener?: boolean }
  | { type: 'image'; src: string; alt: string }
  | { type: 'caption'; text: string }
  | { type: 'list'; items: string[]; ordered: boolean };
