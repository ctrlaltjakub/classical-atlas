import {readFileSync as read, writeFileSync as write, mkdirSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {routes} from './timeline.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const file=p=>join(root,p), json=p=>JSON.parse(read(file('data/'+p+'.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const safe=s=>{const u=new URL(s);assert.equal(u.protocol,'https:');return esc(u.href)};
const clock=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const month=new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'});
export function time(s){assert(/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s));return s.length===4?s:s.length===7?month.format(new Date(s+'-01T12:00Z')):clock.format(new Date(s+'T12:00Z'))}
const timeTag=s=>`<time datetime="${esc(s)}">${time(s)}</time>`;
export const periods=[['Renaissance',1400,1600],['Baroque',1600,1750],['Classical',1730,1820],['Romantic',1790,1910],['Post-Romanticism',1880,1950],['Modern',1890,1975],['Contemporary',1945,new Date().getUTCFullYear()]];
const glyph='<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.85-1.74-6.43-2.13-10.65-1.17a.75.75 0 1 1-.34-1.46c4.61-1.05 8.57-.59 11.77 1.35.35.21.46.67.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.26-2-8.22-2.58-12.07-1.42a.94.94 0 0 1-.55-1.8c4.4-1.33 9.86-.69 13.6 1.62.44.27.58.85.31 1.29zm.13-3.4C15.19 8.3 8.75 8.09 5.02 9.23a1.13 1.13 0 0 1-.66-2.16c4.29-1.3 11.41-1.05 15.9 1.62a1.13 1.13 0 0 1-1.16 1.94z"/></svg>';
const wiki='<svg class="wiki" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M.8 5.5h7v1.3h-2L10 15.9l2.2-5.3-1.6-3.8H8.9V5.5h6.9v1.3h-2.2l4.1 9.1 3.1-9.1h-2.2V5.5h4.8v1.3h-1.1L18 18.5h-1.1l-4-9-3.8 9H8L2.4 6.8H.8z"/></svg>';
const bios=json('biographies'), covers=json('covers'), rows=json('playlists'), contents=json('contents');
assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
for(const source of [bios,covers,contents]) assert.deepEqual(Object.keys(source).sort(),rows.map(r=>r.slug).sort());
for(const r of rows){
  Object.assign(r,bios[r.slug],{art:covers[r.slug]});
  assert(/^[a-z0-9_-]+$/.test(r.slug)&&/^[A-Za-z0-9]{22}$/.test(r.id));
  assert(r.styles.length&&r.periods.length&&r.wikipedia.startsWith('https://en.wikipedia.org/wiki/'));
  if(r.art.kind==='archive-portrait') assert(r.slug==='takemitsu'&&r.art.url==='/portraits/takemitsu-1973.jpg'&&r.art.licenseUrl&&r.art.rightsStatement);
  else assert(['image-cdn-ak.spotifycdn.com','image-cdn-fa.spotifycdn.com','mosaic.scdn.co'].includes(new URL(r.art.url).hostname));
  assert(!r.death||r.death>=r.birth);
}
rows.sort((a,b)=>b.birth.localeCompare(a.birth)||a.name.localeCompare(b.name));
const allStyles=[...new Set(rows.flatMap(r=>r.styles))].sort(), allPeriods=[...new Set(rows.flatMap(r=>r.periods))].sort((a,b)=>periods.findIndex(r=>r[0]===a)-periods.findIndex(r=>r[0]===b));
const {ranges,lanes}=routes(rows);
const colorMap=new Map(ranges.map(r=>[r.name,r.color]));
const tagsFor=tags=>tags.map(tag=>colorMap.has(tag)?`<span class="style-marker" style="--ink-line:${colorMap.get(tag)}">${esc(tag)}</span>`:esc(tag)).join('<span class="sep" aria-hidden="true"> · </span>');
function card(r,i){
 const t=[...new Set([...r.periods,...r.styles])],name=esc(r.name),spotify='https://open.spotify.com/playlist/'+r.id;
 const note=r.dateNote?`<details class="date-note"><summary>Date note</summary>${esc(r.dateNote)}${r.dateSource?` <a href="${safe(r.dateSource)}">Source</a>`:''}</details>`:'';
 const lines=ranges.filter(s=>s.first<=i&&i<=s.last).map(s=>`<i class="rail${i===s.first?' head':''}${i===s.last?' tail':''}${s.members.has(i)?' stop':''}" style="--lane:${s.lane};--ink-line:${s.color}"></i>`).join('');
 return `<article id="${r.slug}" class="card" tabindex="-1" data-name="${name}" data-tags="${esc(t.join('|'))}" data-born="${r.birth}">
 <div class="tracks" aria-hidden="true">${lines}</div><span class="year" aria-hidden="true">${r.birth.slice(0,4)}</span>
 <a href="${spotify}" class="portrait" aria-label="Open ${name} on Spotify"><img src="${r.art.kind==='archive-portrait'?esc(r.art.url):safe(r.art.url)}" alt="${esc(r.art.kind==='archive-portrait'?'Tōru Takemitsu in May 1973':'Playlist portrait of '+r.name)}" width="88" height="88" loading="${i<4?'eager':'lazy'}" decoding="async"></a>
 <div class="record"><h3>${name}</h3><p class="dates">${r.birthKind==='baptised'?'Baptised ':!r.death?'Born ':''}${timeTag(r.birth)}${r.death?' – '+timeTag(r.death):''}</p>${note}
 <p class="styles">${tagsFor(t)}</p><div class="links"><a href="${spotify}" aria-label="${name} playlist on Spotify">${glyph} Spotify</a><a href="${safe(r.wikipedia)}" aria-label="${name} on Wikipedia">${wiki} Wikipedia</a></div></div></article>`;
}
const total=rows.length;
const eraChart=ranges.map(s=>`<a class="era" href="#${rows[s.first].slug}" data-era="${esc(s.name)}" style="--ink-line:${s.color}"><i aria-hidden="true"></i>${esc(s.name)}</a>`).join('');
const opt=(group,values)=>`<optgroup label="${group}">${values.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</optgroup>`;
const substitutions={COUNT:total,NEWEST:rows[0].birth.slice(0,4),LANES:lanes,PERIODS:eraChart,OPTIONS:opt('Periods',allPeriods)+opt('Styles',allStyles.filter(x=>!allPeriods.includes(x))),CARDS:rows.map(card).join('')};
const out=file('dist');mkdirSync(out,{recursive:true});
write(join(out,'index.html'),read(file('page.html'),'utf8').replace(/<!-- (\w+) -->/g,(_,k)=>{assert(k in substitutions);return substitutions[k]}));
mkdirSync(join(out,'portraits'),{recursive:true});
copyFileSync(file('portraits/takemitsu-1973.jpg'),join(out,'portraits/takemitsu-1973.jpg'));
for(const f of ['mark.svg','site.css','index.js'])copyFileSync(file(f),join(out,f));
const entries=rows.filter(r=>r.art.source||r.art.credit).sort((a,b)=>a.name.localeCompare(b.name)).map(r=>{
 const a=r.art;return `<li><a href="/#${r.slug}">${esc(r.name)}</a> — ${esc(a.credit||'Artist not identified')}${a.source?` · <a href="${safe(a.source)}">Source</a>`:''}${a.rightsStatement?` · <a href="${safe(a.rightsStatement)}">Rights statement</a>`:''}${a.license?a.licenseUrl?` · <a href="${safe(a.licenseUrl)}">${esc(a.license)}</a>`:' · '+esc(a.license):''}</li>`
}).join('');
write(join(out,'credits.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><link rel="icon" href="/mark.svg"><link rel="stylesheet" href="/site.css"><title>Cover credits · Classical Music Repository for Spotify</title><main class="credits"><a href="/">← Timeline</a><h1>Cover credits</h1><p>Portraits use the corresponding Spotify covers, except for Tōru Takemitsu’s photograph from DE SINGEL. Sources and licences are listed where known.</p><ul>${entries}</ul><p>The site’s 0BSD licence covers its code, not the artwork or service marks.</p></main></html>`);
