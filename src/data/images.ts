// Photo paths, sizes and captions (RU/BG). Files live in public/images/** (made by `npm run images`
// from the originals in assets-src/images/**). Paths are relative to the site root; pages add the right prefix.
// `ai: true` = AI illustration, NOT a documentary photo of the hotel or of the real 2027 decor.
export interface Img { src: string; src800?: string; w: number; h: number; ru: string; bg: string; ai?: boolean }

const p = (path: string, w: number, h: number, ru: string, bg: string, extra: Partial<Img> = {}): Img =>
  ({ src: `images/${path}.webp`, w, h, ru, bg, ...extra });

export const HERO = p('events/new-year-banquet-ai', 1600, 900, 'Иллюстрация новогоднего банкетного зала', 'Илюстрация на новогодишна банкетна зала',
  { ai: true, src800: 'images/events/new-year-banquet-ai-800.webp' });
export const PLOVDIV = p('plovdiv/plovdiv-winter-old-town-ai', 1600, 900, 'Иллюстрация: зимний Старый город Пловдива', 'Илюстрация: зимният Стар град на Пловдив',
  { ai: true, src800: 'images/plovdiv/plovdiv-winter-old-town-ai-800.webp' });
export const PLOVDIV_PHOTO = p('plovdiv/plovdiv-winter-sunset', 1600, 900, 'Зимний Пловдив на закате', 'Зимен Пловдив на залез',
  { src800: 'images/plovdiv/plovdiv-winter-sunset-800.webp' });
export const LOBBY = p('hotel/hotel-atrium-lounge', 1024, 683, 'Лаунж-зона под стеклянной крышей', 'Лаундж зона под стъклен покрив');

export const ROOMS: Img[] = [
  p('rooms/room-modern-double', 1024, 683, 'Номер с двуспальной кроватью', 'Стая с двойно легло'),
  p('rooms/room-bright-double', 1024, 683, 'Светлый номер', 'Светла стая'),
  p('rooms/room-suite-living-area', 1024, 683, 'Гостиная зона', 'Дневна зона'),
  p('rooms/room-suite-dining-area', 1024, 683, 'Обеденная зона', 'Трапезна зона'),
  p('rooms/room-breakfast-in-bed', 1024, 683, 'Интерьер номера', 'Интериор на стаята'),
  p('rooms/room-bathroom', 1024, 683, 'Ванная комната', 'Баня'),
];
export const SPA: Img[] = [
  p('spa/spa-indoor-pool-real', 1024, 683, 'Крытый бассейн', 'Вътрешен басейн'),
  p('spa/spa-sauna-real', 1024, 683, 'Сауна', 'Сауна'),
  p('spa/spa-jacuzzi-real', 1024, 683, 'Джакузи', 'Джакузи'),
  p('spa/spa-massage-room-real', 1024, 683, 'Массажная зона', 'Масажна зона'),
];
export const DINING: Img[] = [
  p('dining/restaurant-breakfast-buffet-01', 1024, 683, 'Буфет в ресторане', 'Бюфет в ресторанта'),
  p('dining/restaurant-breakfast-buffet-02', 1024, 683, 'Буфетная линия', 'Бюфетна линия'),
  p('dining/restaurant-cafe-red-01', 1024, 681, 'Кафе и бар', 'Кафе и бар'),
  p('dining/restaurant-cafe-red-02', 1024, 682, 'Лаунж-зона ресторана', 'Лаундж зона на ресторанта'),
];
export const INTERIORS: Img[] = [
  LOBBY,
  p('hotel/hotel-lounge-restaurant', 1024, 682, 'Ресторан отеля', 'Ресторант на хотела'),
  p('hotel/hotel-lounge-seating', 1024, 682, 'Лаунж-бар', 'Лаундж бар'),
  p('hotel/hotel-corridor', 511, 768, 'Галерея отеля', 'Галерия на хотела'),
];
