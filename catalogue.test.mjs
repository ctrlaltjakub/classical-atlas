import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync as file} from 'node:fs';
import {time,periods} from './build.mjs';
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
