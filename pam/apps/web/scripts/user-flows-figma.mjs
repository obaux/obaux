#!/usr/bin/env node
/**
 * Turns user-flows-out/<key>.layout.json (written by user-flows.mjs) into
 * Figma Plugin API scripts for the `use_figma` tool, for when the HTML import
 * (html_to_figma) cannot be reached from where the agent runs.
 *
 *   node scripts/user-flows-figma.mjs
 *
 * Writes user-flows-out/figma/:
 *   <n>-<key>.js           draws the page: title, cards, arrows, labels, with
 *                          an empty rectangle named `shot:<key>--<node>` where
 *                          each screen goes. Replaces the page if it exists.
 *   <n>-<key>.slots.js     lists that page's screenshot slots (name → node
 *                          id), for upload_assets to fill from
 *                          user-flows-out/thumbs/<key>--<node>.jpg.
 *   order.txt              the order to run them in.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flows, UPDATED, STORYBOOK_URL } from '../../../docs/user-flows/flows.mjs';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(web, 'user-flows-out');
const dir = join(out, 'figma');
mkdirSync(dir, { recursive: true });
const LIMIT = 48_000;

// Shared helpers, prepended to every drawing script.
const HELPERS = `
const INK={r:0.067,g:0.067,b:0.067}, MUTED={r:0.4,g:0.4,b:0.4}, ACCENT={r:0.059,g:0.345,b:0.278}, NEW={r:0.91,g:0.349,b:0.047}, GREY={r:0.6,g:0.6,b:0.6}, LINE={r:0.85,g:0.85,b:0.85}, PANEL={r:0.965,g:0.965,b:0.957}, WHITE={r:1,g:1,b:1}, BG={r:0.925,g:0.925,b:0.918};
// Screens sit white on a light grey page, lifted by a soft shadow (Will, 8 October).
const LIFT=[{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.10},offset:{x:0,y:6},radius:18,spread:0,visible:true,blendMode:'NORMAL'},{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.06},offset:{x:0,y:1},radius:3,spread:0,visible:true,blendMode:'NORMAL'}];
await Promise.all([['Inter','Regular'],['Inter','Medium'],['Inter','Semi Bold'],['Inter','Bold'],['Inter','Extra Bold']].map(([family,style])=>figma.loadFontAsync({family,style})));
const solid=(c)=>[{type:'SOLID',color:c}];
function text(parent,str,{size=14,style='Regular',color=INK,width=null,x=null,y=null,lh=null,mono=false}={}){
  const t=figma.createText(); t.fontName={family:'Inter',style}; t.characters=str; t.fontSize=size; t.fills=solid(color);
  if(lh) t.lineHeight={unit:'PERCENT',value:lh};
  parent.appendChild(t);
  if(width){t.textAutoResize='HEIGHT'; t.resize(width,t.height);}
  if(x!==null){t.x=x;t.y=y;}
  return t;
}
function pill(parent,str,{bg=NEW,color=WHITE,size=11}={}){
  const f=figma.createAutoLayout('HORIZONTAL',{name:'Tag '+str,paddingLeft:8,paddingRight:8,paddingTop:4,paddingBottom:4,cornerRadius:999});
  f.fills=solid(bg); parent.appendChild(f); text(f,str,{size,style:'Bold',color}); return f;
}
function slotLabel(card,shot,title,url){
  // Centred in the screen slot: the screen's name, and a link to it live in
  // Storybook. Stays useful once a screenshot fills the slot.
  const box=figma.createAutoLayout('VERTICAL',{name:'Open '+title,itemSpacing:10,counterAxisAlignItems:'CENTER'});
  box.fills=[]; card.appendChild(box); box.layoutPositioning='ABSOLUTE';
  text(box,title,{size:16,style:'Semi Bold',color:MUTED});
  if(url){
    const p=figma.createAutoLayout('HORIZONTAL',{name:'Link',paddingLeft:12,paddingRight:12,paddingTop:7,paddingBottom:7,cornerRadius:999});
    p.fills=solid(WHITE); p.strokes=solid(LINE); p.strokeWeight=1; box.appendChild(p);
    const t=text(p,'Open in Storybook ↗',{size:12,style:'Semi Bold',color:ACCENT});
    t.hyperlink={type:'URL',value:url};
  }
  box.x=Math.round(shot.x+(shot.width-box.width)/2); box.y=Math.round(shot.y+(shot.height-box.height)/2);
  return box;
}
async function arrow(parent,d,dashed){
  const v=figma.createVector(); parent.appendChild(v);
  const [sx,sy,c1x,c1y,c2x,c2y,tx,ty]=d;
  await v.setVectorNetworkAsync({vertices:[{x:sx,y:sy},{x:tx,y:ty,strokeCap:'ARROW_EQUILATERAL'}],segments:[{start:0,end:1,tangentStart:{x:c1x-sx,y:c1y-sy},tangentEnd:{x:c2x-tx,y:c2y-ty}}],regions:[]});
  v.strokes=solid(dashed?GREY:INK); v.strokeWeight=2; v.fills=[]; if(dashed) v.dashPattern=[8,7];
  v.name='Arrow'; return v;
}
async function pageNamed(name,index){
  let page=figma.root.children.find(p=>p.name===name);
  if(!page){ page = (index===0 && figma.root.children.length===1 && figma.root.children[0].children.length===0) ? figma.root.children[0] : figma.createPage(); page.name=name; }
  await figma.setCurrentPageAsync(page);
  for(const c of [...page.children]) c.remove();
  return page;
}
`;

const js = (v) => JSON.stringify(v);

function edgeGeometry(L, e, index) {
  const a = L.nodes[e.from];
  const b = L.nodes[e.to];
  const H = L.card.head;
  if (b.x > a.x && !e.over) {
    const sx = a.x + a.w;
    const sy = a.y + H + 40 + index * 22;
    const tx = b.x - 4;
    const ty = b.y + H + 40;
    const mx = (sx + tx) / 2;
    return { d: [sx, sy, mx, sy, mx, ty, tx, ty], lx: mx, ly: (sy + ty) / 2 };
  }
  const sx = a.x + a.w / 2;
  const sy = a.y - 4;
  const tx = b.x + b.w / 2;
  const ty = b.y - 8;
  const lift = Math.min(sy, ty) - 70;
  return { d: [sx, sy, sx, lift, tx, lift, tx, ty], lx: (sx + tx) / 2, ly: lift + 18 };
}

const storyUrl = (story) => (story ? `${STORYBOOK_URL}/iframe.html?id=${story}&viewMode=story` : null);

function flowScript(L, pageName, index) {
  L = { ...L, nodes: Object.fromEntries(Object.entries(L.nodes).map(([id, n]) => [id, { ...n, url: storyUrl(n.story) }])) };
  const per = {};
  const edges = L.edges.map((e) => {
    const i = (per[e.from] = (per[e.from] ?? -1) + 1);
    return { ...e, ...edgeGeometry(L, e, i) };
  });
  return `${HELPERS}
const L=${js({ ...L, edges })};
const page=await pageNamed(${js(pageName)},${index});
const root=figma.createFrame(); root.name='Flow — '+L.title; root.resize(L.width,L.height); root.fills=solid(BG); root.clipsContent=false; page.appendChild(root); root.x=0; root.y=0;
// Title block
text(root,('PAM · User flows · '+L.title).toUpperCase(),{size:14,style:'Semi Bold',color:ACCENT,x:80,y:56});
text(root,L.title,{size:44,style:'Extra Bold',x:80,y:82});
text(root,L.intro,{size:18,color:{r:0.2,g:0.2,b:0.2},width:820,x:80,y:146,lh:150});
text(root,'Updated '+L.updated+'   ·   orange tag = changed in the latest round   ·   solid arrow: a tap   ·   dashed: leaves the app, or a way back',{size:13,style:'Medium',color:MUTED,x:80,y:236});
if(L.changes.length){
  const p=figma.createAutoLayout('VERTICAL',{name:'Latest changes',itemSpacing:8,paddingLeft:22,paddingRight:22,paddingTop:20,paddingBottom:20,cornerRadius:20});
  p.fills=solid(WHITE); root.appendChild(p); p.x=L.width-460; p.y=56;
  text(p,'Latest changes',{size:15,style:'Bold'});
  for(const c of L.changes){ text(p,c,{size:13,color:{r:0.2,g:0.2,b:0.2},width:356,lh:145}); }
}
// Arrows first, so cards and labels sit on top
const arrows=[];
for(const e of L.edges){ arrows.push((await arrow(root,e.d,e.dashed)).id); }
// Cards
const ids={};
for(const [id,n] of Object.entries(L.nodes)){
  const isNew = n.changed && L.latest.includes(n.changed);
  const card=figma.createAutoLayout('VERTICAL',{name:'Screen — '+n.title,itemSpacing:6});
  card.fills=[]; root.appendChild(card); card.x=n.x; card.y=n.y;
  const row=figma.createAutoLayout('HORIZONTAL',{name:'Title',itemSpacing:8,counterAxisAlignItems:'CENTER'}); row.fills=[]; card.appendChild(row);
  text(row,n.title,{size:17,style:'Bold'});
  if(n.changed) pill(row,n.changed,{bg:isNew?NEW:GREY});
  text(card,n.path,{size:12,style:'Medium',color:MUTED});
  const shot=figma.createRectangle(); shot.name='shot:'+L.key+'--'+id; shot.resize(n.w,n.shotH);
  shot.cornerRadius=n.wide?16:28; shot.fills=solid(WHITE); shot.effects=LIFT;
  shot.strokes=solid(isNew?NEW:LINE); shot.strokeWeight=isNew?3:1; shot.strokeAlign='INSIDE';
  card.appendChild(shot);
  if(n.note){ text(card,n.note,{size:13,color:MUTED,width:n.w,lh:135}); }
  slotLabel(card,shot,n.title,n.url);
  ids[id]=card.id;
}
// Labels on the arrows
for(const e of L.edges){
  if(!e.label) continue;
  const p=figma.createAutoLayout('HORIZONTAL',{name:'Label '+e.label,paddingLeft:10,paddingRight:10,paddingTop:5,paddingBottom:5,cornerRadius:999});
  p.fills=solid(WHITE); p.strokes=solid(LINE); p.strokeWeight=1; root.appendChild(p);
  text(p,e.label,{size:12,style:'Semi Bold'});
  p.x=Math.round(e.lx-p.width/2); p.y=Math.round(e.ly-p.height/2);
}
return {page:page.id,root:root.id,cards:Object.keys(ids).length,arrows:arrows.length};
`;
}

function overviewScript(layouts) {
  const cols = layouts.map((L) => {
    const rootId = flows.find((f) => f.key === L.key).roots[0];
    const n = L.nodes[rootId];
    return { key: L.key, title: L.title, intro: L.intro, count: Object.keys(L.nodes).length, root: rootId, wide: n.wide, url: storyUrl(n.story) };
  });
  const latest = layouts.map((L) => (L.changes[0] ? `${L.title}: ${L.changes[0]}` : null)).filter(Boolean);
  return `${HELPERS}
const cols=${js(cols)}; const latest=${js(latest)};
const page=await pageNamed('0 · Overview',0);
const OW=300, GAP=60, TOPC=440, W=80*2+cols.length*OW+(cols.length-1)*GAP;
const root=figma.createFrame(); root.name='Overview'; root.resize(W,TOPC+150+650+120); root.fills=solid(BG); root.clipsContent=false; page.appendChild(root);
text(root,'PAM · USER FLOWS',{size:14,style:'Semi Bold',color:ACCENT,x:80,y:56});
text(root,'How PAM fits together',{size:52,style:'Extra Bold',x:80,y:82});
text(root,'Every screen of the app, by the person using it, drawn from the real screens in Storybook. Each page in this file is one person\\'s app; arrows are taps. Updated '+${js(UPDATED)}+'.',{size:18,color:{r:0.2,g:0.2,b:0.2},width:900,x:80,y:156,lh:150});
text(root,latest.join('\\n'),{size:14,color:{r:0.27,g:0.27,b:0.27},width:W-160,x:80,y:250,lh:160});
cols.forEach((c,i)=>{
  const x=80+i*(OW+GAP);
  const col=figma.createAutoLayout('VERTICAL',{name:c.title,itemSpacing:10}); col.fills=[]; root.appendChild(col); col.x=x; col.y=TOPC;
  text(col,c.title,{size:24,style:'Extra Bold'});
  text(col,c.intro,{size:14,color:{r:0.27,g:0.27,b:0.27},width:OW,lh:145});
  const r=figma.createRectangle(); r.name='shot:overview--'+c.key; r.resize(OW,c.wide?Math.round(OW*630/1200):Math.round(OW*844/390)); r.cornerRadius=c.wide?16:28; r.fills=solid(WHITE); r.effects=LIFT; r.strokes=solid(LINE); r.strokeWeight=1; r.strokeAlign='INSIDE'; col.appendChild(r);
  text(col,c.count+' screens · page “'+c.title+'”',{size:13,style:'Semi Bold',color:ACCENT});
  slotLabel(col,r,c.title,c.url);
});
return {page:page.id,root:root.id};
`;
}

/**
 * Screenshots go in by `upload_assets` (POSTed from disk into the
 * `shot:*` rectangles, by node id) once mcp.figma.com is reachable — see the
 * pam-user-flows skill. Not by inline base64 in a use_figma script: a model
 * pasting 40 KB of base64 through a tool call does not reproduce it exactly
 * (found 4 October, D-264).
 */
const SLOTS = (pageName) => `const page=figma.root.children.find(p=>p.name===${js(pageName)});
await figma.setCurrentPageAsync(page);
return page.findAll(n=>n.type==='RECTANGLE'&&n.name.startsWith('shot:')).map(n=>({name:n.name,id:n.id}));`;

const order = [];
const layouts = flows
  .map((f) => join(out, `${f.key}.layout.json`))
  .filter(existsSync)
  .map((p) => JSON.parse(readFileSync(p, 'utf8')));

const write = (name, code) => {
  if (code.length > 50_000) throw new Error(`${name} is ${code.length} characters`);
  writeFileSync(join(dir, name), code);
  order.push(`${name} (${code.length})`);
};

write('0-overview.js', overviewScript(layouts));
write('0-overview.slots.js', SLOTS('0 · Overview'));
layouts.forEach((L, i) => {
  const pageName = `${i + 1} · ${L.title}`;
  write(`${i + 1}-${L.key}.js`, flowScript(L, pageName, i + 1));
  write(`${i + 1}-${L.key}.slots.js`, SLOTS(pageName));
});
writeFileSync(join(dir, 'order.txt'), order.join('\n') + '\n');
console.log(order.join('\n'));
