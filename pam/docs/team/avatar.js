// Pam team avatars: flat, friendly portraits drawn from a few choices.
// One function, used by the control room page and by the script that writes the
// SVG files in pam/docs/team/. Input: {bg, skin, hair, hairColor, shirt, extra}.
function avatarInner(a, uid) {
  const clip = "avc-" + uid;
  const skin = a.skin, hc = a.hairColor, shade = "rgba(0,0,0,.12)";
  const hairBack = {
    long: `<path d="M17 30c0-11 7-18 15-18s15 7 15 18v18H17z" fill="${hc}"/>`,
    bob: `<path d="M18 31c0-11 6-18 14-18s14 7 14 18v6c-2 2-5 2-6 2V27H24v12c-2 0-5 0-6-2z" fill="${hc}"/>`,
    waves: `<path d="M17 31c0-12 7-19 15-19s15 7 15 19c0 7 2 11 3 14-4 1-7-1-8-3V27H22v15c-1 2-4 4-8 3 2-3 3-7 3-14z" fill="${hc}"/>`
  }[a.hair] || "";
  const hairFront = {
    short: `<path d="M19 27c0-9 6-14 13-14s13 5 13 14c-2-4-6-6-13-6s-11 2-13 6z" fill="${hc}"/>`,
    buzz: `<path d="M20 25c1-7 6-11 12-11s11 4 12 11c-3-3-7-4-12-4s-9 1-12 4z" fill="${hc}"/>`,
    long: `<path d="M19 28c0-9 6-15 13-15s13 6 13 15c-4-5-8-7-15-7-5 0-9 3-11 7z" fill="${hc}"/>`,
    bob: `<path d="M19 28c0-9 6-15 13-15s13 6 13 15c-3-3-6-5-9-5-4 0-6 3-10 3-3 0-5 1-7 2z" fill="${hc}"/>`,
    waves: `<path d="M19 28c1-9 6-15 13-15s12 6 13 15c-3-4-7-7-13-6-5 0-9 3-13 6z" fill="${hc}"/>`,
    bun: `<circle cx="32" cy="10" r="6" fill="${hc}"/><path d="M19 27c0-9 6-14 13-14s13 5 13 14c-2-4-6-6-13-6s-11 2-13 6z" fill="${hc}"/>`,
    curly: [[22,19,6],[28,15,6.5],[35,15,6.5],[41,19,6],[44,25,4.5],[20,25,4.5]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}"/>`).join("")
  }[a.hair] || "";
  const extra = [];
  if (a.extra === "glasses") extra.push(`<g fill="none" stroke="#1d2428" stroke-width="1.6"><circle cx="27" cy="29" r="3.6"/><circle cx="37" cy="29" r="3.6"/><path d="M30.6 29h2.8"/></g>`);
  if (a.extra === "headset") extra.push(`<g fill="none" stroke="#1d2428" stroke-width="2" stroke-linecap="round"><path d="M18.5 30a13.5 13.5 0 0 1 27 0"/><path d="M45.5 33v2a5 5 0 0 1-5 5h-3"/></g><rect x="16.5" y="28" width="4" height="7" rx="2" fill="#1d2428"/><rect x="43.5" y="28" width="4" height="7" rx="2" fill="#1d2428"/>`);
  if (a.extra === "earrings") extra.push(`<circle cx="19.5" cy="36" r="1.6" fill="#E9C46A"/><circle cx="44.5" cy="36" r="1.6" fill="#E9C46A"/>`);
  return `<defs><clipPath id="${clip}"><circle cx="32" cy="32" r="32"/></clipPath></defs>
<g clip-path="url(#${clip})">
<rect width="64" height="64" fill="${a.bg}"/>
${hairBack}
<path d="M8 66c2-13 12-20 24-20s22 7 24 20z" fill="${a.shirt}"/>
<rect x="28" y="38" width="8" height="10" rx="3" fill="${skin}"/>
<rect x="28" y="40" width="8" height="4" fill="${shade}"/>
<ellipse cx="32" cy="29" rx="12.5" ry="13.5" fill="${skin}"/>
<ellipse cx="19.8" cy="30" rx="2.2" ry="3" fill="${skin}"/><ellipse cx="44.2" cy="30" rx="2.2" ry="3" fill="${skin}"/>
${hairFront}
<circle cx="27.2" cy="29.5" r="1.5" fill="#1d2428"/><circle cx="36.8" cy="29.5" r="1.5" fill="#1d2428"/>
<path d="M28 35.5c2.4 2 5.6 2 8 0" fill="none" stroke="#1d2428" stroke-width="1.5" stroke-linecap="round"/>
<ellipse cx="24.5" cy="33.5" rx="2.2" ry="1.3" fill="#E57A6F" opacity=".25"/><ellipse cx="39.5" cy="33.5" rx="2.2" ry="1.3" fill="#E57A6F" opacity=".25"/>
${extra.join("")}
</g>`;
}
function avatarSVG(a, uid, size = 64) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img">${avatarInner(a, uid)}</svg>`;
}
if (typeof module !== "undefined") module.exports = { avatarInner, avatarSVG };
