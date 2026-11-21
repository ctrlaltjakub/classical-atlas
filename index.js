(() => {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const query=$('#query'), style=$('#style'), cards=$$('.card'), groups=$$('.block'), eras=$$('[data-era]'), jumps=$$('.jump a');
  const fold=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ł/g,'l').replace(/ø/g,'o').replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const catalog=cards.map(el=>({el,search:fold(el.dataset.name+' '+el.id+' '+el.dataset.tags),tags:el.dataset.tags.split('|')}));
  function apply(save){
    const words=fold(query.value).split(/\s+/), tag=style.value;
    let n=0;
    for(const {el,search,tags} of catalog){
      el.hidden=!(words.every(word=>search.includes(word))&&(!tag||tags.includes(tag))); if(!el.hidden)n++;
    }
    for(const group of groups)group.hidden=!group.querySelector('.card:not([hidden])');
    for(const a of jumps)a.hidden=$(a.hash).hidden;
    for(const a of eras)a.setAttribute('aria-current',String(a.dataset.era===tag));
    $('#total').textContent=n+(n===1?' playlist':' playlists'); $('#empty').hidden=!!n;
    if(save){const u=new URL(location.href);for(const [k,v] of [['q',query.value.trim()],['style',tag]]){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k)}history.replaceState(null,'',u)}
  }
  function restore(){const p=new URLSearchParams(location.search);query.value=p.get('q')||'';style.value=p.get('style')||'';if(style.selectedIndex<0)style.selectedIndex=0;apply(false)}
  query.addEventListener('input',()=>apply(true));style.addEventListener('change',()=>apply(true));
  for(const a of eras)a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();style.value=style.value===a.dataset.era?'':a.dataset.era;apply(true);$('#list-title').scrollIntoView({block:'start'})});
  $('#reset').addEventListener('click',()=>{query.value='';style.value='';apply(true);query.focus()});
  if(matchMedia('(max-width:760px)').matches)$('#period-guide').open=false;
  addEventListener('popstate',restore);restore();$('.tools').hidden=false;
  const external=document.createElement('script');external.src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';external.async=true;
  external.onload=()=>{
    try {
      window.kofiWidgetOverlay.draw('jakubfleitesjonczyk',{'type':'floating-chat','floating-chat.donateButton.text':'Support me','floating-chat.donateButton.background-color':'#323842','floating-chat.donateButton.text-color':'#fff'},'kofi-widget');
      const frames=$$('#kofi-widget iframe');
      for(const f of frames)if(!f.title)f.title=f.className.includes('container')?'Support me on Ko-fi':'Ko-fi support panel';
      if($('#kofi-widget iframe.floatingchat-container'))$('.fallback').classList.add('widget-ready');
    }catch{ /* The direct support link remains usable when the widget is unavailable. */ }
  };
  document.head.append(external);
})();
