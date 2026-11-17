// All amounts are copied from official_offer_2027.pdf (EUR, VAT included as stated there).
// Column order in the PDF: double Classic | single Classic | double Comfort | single Comfort | double Lux | single Lux
// "double" = price for ONE BED (one person) in a double room; "single" = single-room price.
// The two products have DIFFERENT prices — never mix them.

export type RoomId = 'classic' | 'comfort' | 'lux';
export type OccId = 'double' | 'single';
export type ProductId = 'accommodation' | 'package';
export const ROOMS: RoomId[] = ['classic', 'comfort', 'lux'];
export const OCCS: OccId[] = ['double', 'single'];
export const NIGHTS = [1, 2, 3, 4] as const;
export type Nights = (typeof NIGHTS)[number];

type Table = Record<RoomId, Record<OccId, [number, number, number, number]>>;

export const PRICES: Record<ProductId, Table> = {
  // «Настаняване» — accommodation + breakfast (+brunch, SPA…), WITHOUT gala dinner
  accommodation: {
    classic: { double: [71.65, 121.79, 182.69, 207.06], single: [119.65, 182.69, 274.04, 310.59] },
    comfort: { double: [83.59, 142.1, 213.16, 241.57], single: [139.59, 213.15, 319.73, 362.35] },
    lux: { double: [95.53, 162.39, 243.59, 276.08], single: [159.53, 243.58, 365.37, 414.12] },
  },
  // «Новогодишен пакет» — includes the 31 Dec gala dinner
  package: {
    classic: { double: [280.9, 323.52, 375.28, 396.0], single: [321.7, 375.29, 452.93, 484.0] },
    comfort: { double: [291.05, 340.79, 401.18, 425.33], single: [338.65, 401.18, 491.77, 528.0] },
    lux: { double: [301.2, 358.03, 427.05, 454.67], single: [355.6, 427.04, 530.57, 572.0] },
  },
};

export const GALA_DINNER = { adult: 220.0, child2to11: 132.0 }; // restaurant «Париж», per cover
export const STAY_PERIOD = { from: '2026-12-29', to: '2027-01-02' };

export const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

export interface RoomGuests { adults: number; children: number; infants: number }
export const roomPrice = (product: ProductId, room: RoomId, nights: Nights, guests: RoomGuests): number => {
  const i = nights - 1;
  const adultPrice = guests.adults === 1 ? PRICES[product][room].single[i] :
    guests.adults >= 2 ? PRICES[product][room].double[i] * (2 + (guests.adults - 2) * 0.85) : 0;
  const childStay = guests.children * PRICES.accommodation[room].double[i] * 0.7;
  return adultPrice + childStay + (product === 'package' ? guests.children * GALA_DINNER.child2to11 : 0);
};
export const totalPrice = (product: ProductId, room: RoomId, nights: Nights, rooms: RoomGuests[], dinnerOnly: boolean): number => {
  const raw = dinnerOnly
    ? rooms.reduce((sum, g) => sum + g.adults * GALA_DINNER.adult + g.children * GALA_DINNER.child2to11, 0)
    : rooms.reduce((sum, g) => sum + roomPrice(product, room, nights, g), 0);
  return Math.round((raw + Number.EPSILON) * 100) / 100;
};
