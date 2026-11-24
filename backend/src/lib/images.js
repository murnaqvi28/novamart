// Generates clean, consistent SVG product artwork so the store looks finished without external image hosting.
// Admins can replace any product's image with a real photo URL from the admin panel.

const PALETTES = {
  electronics: ['#E8EEF9', '#C9D7F2', '#2B4C8C'],
  fashion: ['#F7ECE6', '#EDD3C4', '#8C4A2B'],
  home: ['#EEF3EA', '#D3E2CB', '#3F6B35'],
  beauty: ['#F8EAF0', '#EDCCDA', '#8C2B55'],
  sports: ['#FFF4E0', '#F6DDB0', '#9A5B00'],
  books: ['#EEEAF7', '#D6CEEE', '#4B3B8C'],
  default: ['#F1F1F1', '#DDDDDD', '#444444'],
};

const ICONS = {
  electronics: `<path d="M190 330v-40a110 110 0 0 1 220 0v40" fill="none" stroke-width="22" stroke-linecap="round"/>
    <rect x="160" y="310" width="70" height="120" rx="30"/><rect x="370" y="310" width="70" height="120" rx="30"/>`,
  fashion: `<path d="M240 170l-90 50 35 75 40-20v175h150V275l40 20 35-75-90-50c-10 30-40 45-60 45s-50-15-60-45z"/>`,
  home: `<path d="M230 170h140l45 130H185z"/><rect x="290" y="300" width="20" height="120"/><rect x="220" y="415" width="160" height="22" rx="11"/>`,
  beauty: `<rect x="250" y="150" width="100" height="45" rx="10"/><rect x="270" y="195" width="60" height="40"/>
    <rect x="215" y="235" width="170" height="215" rx="40"/>`,
  sports: `<rect x="140" y="250" width="45" height="100" rx="12"/><rect x="185" y="225" width="45" height="150" rx="12"/>
    <rect x="230" y="285" width="140" height="30" rx="8"/><rect x="370" y="225" width="45" height="150" rx="12"/>
    <rect x="415" y="250" width="45" height="100" rx="12"/>`,
  books: `<path d="M300 200c-40-25-90-30-140-25v240c50-5 100 0 140 25z"/><path d="M300 200c40-25 90-30 140-25v240c-50-5-100 0-140 25z" opacity=".75"/>`,
};

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function productSvg(slug, categorySlug) {
  const [bg, accent, ink] = PALETTES[categorySlug] || PALETTES.default;
  const icon = ICONS[categorySlug] || ICONS.home;
  const h = hash(slug);
  const cx = 120 + (h % 360);
  const cy = 100 + ((h >> 8) % 400);
  const r = 140 + ((h >> 16) % 120);
  const rot = (h % 40) - 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <rect width="600" height="600" fill="${bg}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${accent}" opacity=".7"/>
  <circle cx="${600 - cx}" cy="${600 - cy}" r="${r * 0.45}" fill="${accent}" opacity=".45"/>
  <g transform="rotate(${rot} 300 300)" fill="${ink}" stroke="${ink}">${icon}</g>
</svg>`;
}
