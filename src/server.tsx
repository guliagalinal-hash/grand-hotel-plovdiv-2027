// Build-time entry: renders a language page to an HTML string (used by scripts/build.mjs).
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { SiteProvider } from './context';
import { content, type Lang } from './content';
import { config } from './config';

export function renderPage(lang: Lang) {
  const html = renderToString(<SiteProvider lang={lang} base="../"><App /></SiteProvider>);
  const t = content[lang];
  const other: Lang = lang === 'ru' ? 'bg' : 'ru';
  return {
    html,
    lang,
    title: t.meta.title,
    desc: t.meta.desc,
    ogLocale: t.meta.ogLocale,
    ogLocaleAlt: content[other].meta.ogLocale,
    canonical: `${config.siteUrl}/${lang}/`,
    alternateRu: `${config.siteUrl}/ru/`,
    alternateBg: `${config.siteUrl}/bg/`,
    ogImage: `${config.siteUrl}/images/events/new-year-banquet-ai-800.webp`,
  };
}
