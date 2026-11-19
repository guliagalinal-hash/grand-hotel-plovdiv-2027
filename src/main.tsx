// Browser entry: hydrates the pre-rendered page (/ru/ or /bg/). The language comes from <html lang>.
import { hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { SiteProvider } from './context';
import type { Lang } from './content';
import './styles.css';
import { installContactTracking } from './analytics';

const lang: Lang = document.documentElement.lang === 'bg' ? 'bg' : 'ru';
hydrateRoot(
  document.getElementById('root')!,
  <SiteProvider lang={lang} base="../"><App /></SiteProvider>,
);

// Delegated click tracking also catches React-hydrated controls.
installContactTracking();
