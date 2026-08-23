// SVG placeholder logo as data URL (used when logo2.png is not available)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="100" fill="#071973"/>
  <text x="100" y="82" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#F5A623">전일련</text>
  <text x="100" y="116" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#ffffff">전국화물 1톤</text>
  <text x="100" y="136" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#ffffff">월탑연합</text>
</svg>`;

export const logoDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
