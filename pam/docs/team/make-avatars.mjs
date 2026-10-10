// Draws each teammate's portrait from team/roster.json into team/<name>.svg.
// The control room draws the same portraits with the same function (avatar.js).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { avatarSVG } = require("./avatar.js");
const here = new URL(".", import.meta.url);
const roster = JSON.parse(readFileSync(new URL("roster.json", here), "utf8"));
for (const person of Object.values(roster)) {
  const id = person.nick.toLowerCase();
  const svg = avatarSVG(person.avatar, id, 64).replace('role="img"', `role="img" aria-label="${person.nick}"`);
  writeFileSync(new URL(`${id}.svg`, here), svg + "\n");
}
console.log(`Drew ${Object.keys(roster).length} portraits.`);
