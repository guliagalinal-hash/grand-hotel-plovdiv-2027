import { ru, type Dict } from './ru';
import { bg } from './bg';
export type { Dict };
export type Lang = 'ru' | 'bg';
export const content: Record<Lang, Dict> = { ru, bg };
