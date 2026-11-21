import {readFileSync as read, writeFileSync as write, mkdirSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {join} from 'node:path';
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
const bios=json('biographies'), covers=json('covers'), rows=json('playlists');
assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
for(const source of [bios,covers]) assert.deepEqual(Object.keys(source).sort(),rows.map(r=>r.slug).sort());
for(const r of rows){
  Object.assign(r,bios[r.slug],{art:covers[r.slug]});
  assert(/^[a-z0-9_-]+$/.test(r.slug)&&/^[A-Za-z0-9]{22}$/.test(r.id));
  assert(r.styles.length&&r.periods.length&&r.wikipedia.startsWith('https://en.wikipedia.org/wiki/'));
  assert(['image-cdn-ak.spotifycdn.com','image-cdn-fa.spotifycdn.com','mosaic.scdn.co'].includes(new URL(r.art.url).hostname));
  assert(!r.death||r.death>=r.birth);
}
rows.sort((a,b)=>b.birth.localeCompare(a.birth)||a.name.localeCompare(b.name));
const allStyles=[...new Set(rows.flatMap(r=>r.styles))].sort(), allPeriods=[...new Set(rows.flatMap(r=>r.periods))].sort((a,b)=>periods.findIndex(r=>r[0]===a)-periods.findIndex(r=>r[0]===b));
const band=r=>Math.floor(Number(r.birth.slice(0,4))/50)*50;
const bands=[...new Set(rows.map(band))], bandName=y=>y+'–'+(y+49);
function card(r,i){
 const t=[...new Set([...r.periods,...r.styles])],name=esc(r.name),spotify='https://open.spotify.com/playlist/'+r.id;
 const note=r.dateNote?`<details class="date-note"><summary>Date note</summary>${esc(r.dateNote)}${r.dateSource?` <a href="${safe(r.dateSource)}">Source</a>`:''}</details>`:'';
 return `<article id="${r.slug}" class="card" data-name="${name}" data-tags="${esc(t.join('|'))}" data-born="${r.birth}">
 <a href="${spotify}" class="portrait" aria-label="Open ${name} on Spotify"><img src="${safe(r.art.url)}" alt="${esc(r.art.kind==='spotify-default'?'Album-art mosaic for '+r.name:'Playlist portrait of '+r.name)}" width="320" height="320" loading="${i<3?'eager':'lazy'}" decoding="async"></a>
 <h4>${name}</h4><p class="dates">${r.birthKind==='baptised'?'Baptised ':!r.death?'Born ':''}${timeTag(r.birth)}${r.death?' – '+timeTag(r.death):''}</p>${note}
 <p class="styles">${t.map(esc).join(' · ')}</p><div class="links"><a href="${spotify}" aria-label="${name} playlist on Spotify">${glyph} Spotify</a><a href="${safe(r.wikipedia)}" aria-label="${name} on Wikipedia"><span aria-hidden="true" class="wiki">W</span> Wikipedia</a></div></article>`;
}
const total=rows.length,last=periods.at(-1)[2],span=last-1400;
const eraChart=periods.map(([tag,start,end])=>{
 const group=bands.find(y=>rows.some(r=>band(r)===y&&[...r.periods,...r.styles].includes(tag)));
 assert(group!==undefined);
 return `<a class="era" href="#y${group}" data-era="${esc(tag)}" title="Approximately ${start}–${end}"><span>${esc(tag)}</span><small>${start}–${end===last?'now':end}</small><span aria-hidden="true" class="bar" style="--x:${100*(start-1400)/span}%;--w:${100*(end-start)/span}%"><i></i></span></a>`;
}).join('');
const opt=(group,values)=>`<optgroup label="${group}">${values.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</optgroup>`;
const substitutions={COUNT:total,PERIODS:eraChart,JUMPS:bands.map(y=>`<a href="#y${y}">${bandName(y)}</a>`).join(''),OPTIONS:opt('Periods',allPeriods)+opt('Styles',allStyles.filter(x=>!allPeriods.includes(x))),CARDS:bands.map(y=>`<section class="block" id="y${y}"><div class="blockhead"><h3>${bandName(y)}</h3></div><div class="cards">${rows.filter(r=>band(r)===y).map(r=>card(r,rows.indexOf(r))).join('')}</div></section>`).join('')};
const out=file('dist');mkdirSync(out,{recursive:true});
write(join(out,'index.html'),read(file('page.html'),'utf8').replace(/<!-- (\w+) -->/g,(_,k)=>{assert(k in substitutions);return substitutions[k]}));
for(const f of ['mark.svg','site.css','index.js'])copyFileSync(file(f),join(out,f));
const entries=rows.filter(r=>r.art.source||r.art.credit).sort((a,b)=>a.name.localeCompare(b.name)).map(r=>{
 const a=r.art;return `<li><a href="/#${r.slug}">${esc(r.name)}</a> — ${esc(a.credit||'Artist not identified')}${a.source?` · <a href="${safe(a.source)}">Source</a>`:''}${a.license?a.licenseUrl?` · <a href="${safe(a.licenseUrl)}">${esc(a.license)}</a>`:' · '+esc(a.license):''}</li>`
}).join('');
write(join(out,'credits.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><link rel="icon" href="/mark.svg"><link rel="stylesheet" href="/site.css"><title>Cover credits · Classical playlists</title><main class="credits"><a href="/">← Timeline</a><h1>Cover credits</h1><p>Artwork is displayed from the corresponding Spotify playlist. Listed below are portraits with an identified source. The remaining inherited covers have no recorded attribution; Tōru Takemitsu’s playlist uses Spotify’s album-art mosaic.</p><ul>${entries}</ul><p>The site’s 0BSD licence covers its code, not the artwork or service marks.</p></main></html>`);
