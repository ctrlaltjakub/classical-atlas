(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const query = $('#query'), style = $('#style'), guide = $('#period-guide'),
        ruler = $('.ruler'), reading = $('#reading-year'), eras = $$('.era');
  const narrow = matchMedia('(max-width:780px)'), reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const fold = s => s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ł/g,'l').replace(/ø/g,'o').replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const catalog = $$('.card').map(el => ({el,search:fold(el.dataset.name+' '+el.id+' '+el.dataset.tags),tags:el.dataset.tags.split('|')}));
  let visible = catalog, pending = false, current = null;
  function readPosition() {
    pending = false;
    const edge = ruler.getBoundingClientRect().bottom + 46;
    let a=0, b=visible.length;
    while (a<b) { const mid=(a+b)>>1; if (visible[mid].el.getBoundingClientRect().bottom<=edge) a=mid+1; else b=mid; }
    const row=visible[Math.min(a,visible.length-1)];
    if (row===current) return;
    current=row;
    reading.textContent=row ? row.el.dataset.born.slice(0,4) : '—';
    for (const link of eras) link.classList.toggle('here',!!row?.tags.includes(link.dataset.era));
  }
  function updateReading() { if (!pending) { pending=true; requestAnimationFrame(readPosition); } }
  function apply() {
    const words=fold(query.value).split(/\s+/), tag=style.value;
    visible=catalog.filter(({el,search,tags})=>{
      el.hidden=!(words.every(word=>search.includes(word)) && (!tag||tags.includes(tag)));
      return !el.hidden;
    });
    $('#total').textContent=visible.length+(visible.length===1?' playlist':' playlists');
    $('#empty').hidden=!!visible.length; updateReading();
  }
  function save() {
    const u=new URL(location.href); u.hash=''; u.searchParams.delete('style');
    for (const [k,v] of [['q',query.value.trim()],['filter',style.value]]) { if(v) u.searchParams.set(k,v); else u.searchParams.delete(k); }
    history.replaceState(null,'',u); apply();
  }
  function goto(id,smooth,focus=false) {
    const el=document.getElementById(id);
    if(!el||el.hidden) return;
    if(focus) el.focus({preventScroll:true});
    el.scrollIntoView({block:'start',behavior:smooth&&!reduced.matches?'smooth':'instant'});
    updateReading();
  }
  function restore() {
    const u=new URL(location.href), old=u.searchParams.get('style');
    const jump=eras.find(a=>a.dataset.era===old);
    query.value=u.searchParams.get('q')||''; style.value=u.searchParams.get('filter')||(!jump&&old)||'';
    if(style.selectedIndex<0) style.selectedIndex=0;
    if(old) {
      u.searchParams.delete('style');
      if(jump&&!u.hash&&!query.value&&!style.value) u.hash=jump.hash;
      if(style.value) u.searchParams.set('filter',style.value);
      history.replaceState(null,'',u);
    }
    apply();
    if(u.hash) requestAnimationFrame(()=>goto(u.hash.slice(1),false));
  }
  for(const a of eras) a.addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||e.button!==0) return;
    e.preventDefault();
    const u=new URL(location.href); u.hash=a.hash; for(const key of ['q','style','filter']) u.searchParams.delete(key);
    if(u.href!==location.href) history.pushState(null,'',u);
    query.value=''; style.value=''; if(narrow.matches) guide.open=false;
    apply(); goto(a.hash.slice(1),true,true);
  });
  query.addEventListener('input',save); style.addEventListener('change',save);
  $('#reset').addEventListener('click',()=>{query.value='';style.value='';save();query.focus();});
  const adapt=()=>{guide.open=!narrow.matches;updateReading();}; narrow.addEventListener('change',adapt); adapt();
  window.addEventListener('scroll',updateReading,{passive:true}); window.addEventListener('resize',updateReading);
  document.addEventListener('toggle',updateReading,true);
  window.addEventListener('popstate',restore); $('.tools').hidden=false; restore();
})();
