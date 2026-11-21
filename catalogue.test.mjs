import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync as file} from 'node:fs';
import {time,periods} from './build.mjs';
import {routes} from './timeline.mjs';
const out=file(new URL('./dist/index.html',import.meta.url),'utf8');
const json=n=>JSON.parse(file(new URL('./data/'+n+'.json',import.meta.url)));
test('one distinct reachable card for each of the 122 published playlists',()=>{
 const entries=json('playlists');assert.equal(entries.length,122);assert.equal((out.match(/class="card"/g)||[]).length,entries.length);
 const bios=json('biographies'),arts=json('covers');
 for(const r of entries){assert(out.includes('id="'+r.slug+'"'));assert(out.includes('https://open.spotify.com/playlist/'+r.id));assert(out.includes(bios[r.slug].wikipedia));assert(out.includes(arts[r.slug].url))}
 assert.equal(Object.values(arts).filter(r=>r.kind==='spotify-default').length,1);
});
test('birth order is descending; date precision is not invented',()=>{
 const dates=[...out.matchAll(/data-born="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(dates,[...dates].sort().reverse());
 assert.equal(time('1659'),'1659');assert.equal(time('1813-10'),'Oct 1813');assert.equal(time('1770-12-17'),'17 Dec 1770');assert(out.includes('Baptised <time'));assert(out.includes('Born <time'));
});
test('timeline spans overlapping periods including Post-Romanticism; every link has an actual target',()=>{
 assert(periods.some((r,i)=>i>0&&r[1]<periods[i-1][2]));assert(out.includes('data-era="Post-Romanticism"'));
 const ids=new Set([...out.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));for(const m of out.matchAll(/href="#([^"]+)"/g))assert(ids.has(m[1]));
 assert(!out.includes('<!-- CARDS -->'));
});
test('work summaries keep compositions separate from recordings and movements',()=>{
 const entries=json('contents');assert.equal(Object.keys(entries).length,122);assert.match(entries.brahms,/4 symphonies, 4 concertos, 21 orchestral Hungarian Dances/);
 assert.match(entries.schubert,/8 symphonies/);assert.match(entries.beethoven,/1 opera \(2 versions\)/);
 assert.match(entries.haydn,/126 baryton trios/i);assert.equal((out.match(/<summary>Works by genre<\/summary>/g)||[]).length,Object.keys(entries).length);
});
test('parallel rails do not collide, and the period index jumps to the first actual member',()=>{
 const bios=json('biographies'), rows=json('playlists').map(r=>({...r,...bios[r.slug]})).sort((a,b)=>b.birth.localeCompare(a.birth)||a.name.localeCompare(b.name));
 const {ranges,lanes}=routes(rows);assert(lanes>1&&lanes<ranges.length);
 for(const [i,row] of rows.entries()){
   const active=ranges.filter(s=>s.first<=i&&i<=s.last);
   assert.equal(new Set(active.map(s=>s.lane)).size,active.length);
   for(const s of ranges)assert.equal(s.members.has(i),[...row.periods,...row.styles].includes(s.name));
 }
 for(const s of ranges)assert(out.includes('href="#'+rows[s.first].slug+'" data-era="'+s.name+'"'));
});
test('methodology is collapsed, and the support link is native and has no widget',()=>{
 assert(out.includes('<details class="method"><summary>Methodology</summary>'));
 assert(out.includes('href="https://ko-fi.com/jakubfleitesjonczyk"'));assert(!out.includes('class="mast"'));
 assert(!file(new URL('./dist/index.js',import.meta.url),'utf8').includes('overlay-widget'));
});
