// UNIFIED SCHOLAR PORTAL — Premium Light Theme
export const c = {
  // Base surfaces — clean bright whites & warm off-whites
  bg: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4F8',
  card: '#FFFFFF',
  ink: '#1A2332',
  muted: '#5A6A7E',
  line: '#E2E8F0',
  border: '#CBD5E1',

  // Brand: Deep Forest Green (Tribal / India heritage)
  deep: '#0D4A3C',
  primary: '#137060',
  primaryDark: '#0A5248',
  primaryInk: '#FFFFFF',
  primarySoft: '#E6F7F3',
  primaryMid: '#B2E4D8',

  // Accent: Saffron (Indian flag)
  saffron: '#E8820C',
  saffronBright: '#F59E0B',
  saffronSoft: '#FEF3C7',
  saffronInk: '#78350F',

  // Purple / Merit
  plum: '#6D28D9',
  plumSoft: '#EDE9FE',
  plumInk: '#4C1D95',

  // Sky blue
  sky: '#0369A1',
  skySoft: '#E0F2FE',
  skyInk: '#0C4A6E',

  // Rose / Pink
  rose: '#BE185D',
  roseSoft: '#FCE7F3',
  roseInk: '#9D174D',

  // Status colors
  ochre: '#92400E',
  ochreSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  dangerInk: '#991B1B',
  ok: '#15803D',
  okSoft: '#DCFCE7',
  okInk: '#14532D',
  info: '#1D4ED8',
  infoSoft: '#DBEAFE',
  infoInk: '#1E3A8A',

  // Warm neutrals
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
};

export const serif = '"Georgia", "Times New Roman", serif';
export const sans = 'system-ui, -apple-system, sans-serif';
export const r = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, full: 999 };
export const MAX_WIDTH = 760;

export const shadow = {
  shadowColor: '#1A2332',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

export const shadowMd = {
  shadowColor: '#1A2332',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 5,
};

export const shadowSm = {
  shadowColor: '#1A2332',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

// Colour-code scholarships by category so the list is scannable at a glance.
export function accentFor(category: string | null | undefined) {
  const k = (category ?? '').toLowerCase();
  if (k.includes('gov') || k.includes('state')) return { fg: c.primary, bg: c.primarySoft, border: c.primaryMid };
  if (k.includes('private') || k.includes('corp')) return { fg: c.plum, bg: c.plumSoft, border: '#C4B5FD' };
  if (k.includes('ngo') || k.includes('trust')) return { fg: c.saffronInk, bg: c.saffronSoft, border: '#FCD34D' };
  return { fg: c.sky, bg: c.skySoft, border: '#7DD3FC' };
}
