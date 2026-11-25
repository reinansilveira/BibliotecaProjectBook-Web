import { InjectionToken } from '@angular/core';

export interface TocEntry {
  label: string;
  href: string;
}

export interface ReaderEngine {
  readonly toc: TocEntry[];
  next(): Promise<void>;
  previous(): Promise<void>;
  display(target: string): Promise<void>;
  setFontSize(percent: number): void;
  setDark(dark: boolean): void;
  destroy(): void;
}

export type ProgressListener = (location: string, percentage: number) => void;

export type EngineFactory = (
  data: ArrayBuffer,
  host: HTMLElement,
  start: string | null,
  onProgress: ProgressListener,
) => Promise<ReaderEngine>;

const LIGHT = { color: '#1f1c17', background: '#fffdf8' };
const DARK = { color: '#ece6db', background: '#1b1a17' };

export const createEpubEngine: EngineFactory = async (data, host, start, onProgress) => {
  const { default: ePub } = await import('epubjs');
  const book = ePub(data);
  const rendition = book.renderTo(host, {
    width: '100%',
    height: '100%',
    flow: 'paginated',
    spread: 'auto',
  });

  await book.ready;
  const navigation = await book.loaded.navigation;
  void book.locations.generate(1200);

  rendition.on('relocated', (location: { start: { cfi: string; percentage: number } }) => {
    const cfi = location.start.cfi;
    const fromLocations = book.locations.length() > 0 ? book.locations.percentageFromCfi(cfi) : 0;
    const fraction = fromLocations || location.start.percentage || 0;

    onProgress(cfi, Math.round(fraction * 1000) / 10);
  });

  await rendition.display(start || undefined);

  return {
    toc: navigation.toc.map((item) => ({ label: item.label.trim(), href: item.href })),
    next: () => rendition.next(),
    previous: () => rendition.prev(),
    display: (target) => rendition.display(target),
    setFontSize: (percent) => rendition.themes.fontSize(`${percent}%`),
    setDark: (dark) => {
      const colors = dark ? DARK : LIGHT;
      rendition.themes.override('color', colors.color);
      rendition.themes.override('background', colors.background);
    },
    destroy: () => book.destroy(),
  };
};

export const EPUB_ENGINE = new InjectionToken<EngineFactory>('EPUB_ENGINE', {
  factory: () => createEpubEngine,
});
