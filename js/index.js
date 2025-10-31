window.addEventListener('load', () => {
  const screen = document.getElementById('screen');
  const title = document.getElementById('scene-title');
  const body = document.getElementById('scene-body');

  const getRootVar = (name, fallback) => { try{ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback }catch(e){ return fallback } }
  if (!screen) return;

  requestAnimationFrame(() => setTimeout(() => {
    screen.classList.add('visible');

    const endOp = getRootVar('--notice-body-opacity-end','1');
    if(title) title.style.opacity = endOp;
    if(body) body.style.opacity = endOp;
  }, 20));
});

(function () {
  const btn = document.getElementById('btn-susumu');
  const se = document.getElementById('se-button');
  const screen = document.getElementById('screen');
  const sceneBody = document.getElementById('scene-body');
  const sceneTitle = document.getElementById('scene-title');

  if (!btn) return;

  // SE 再生の堅牢化（WebAudio 優先 + HTMLAudio プール）
  let sePool = null
  let seAudioMode = 'html'
  let seAudioCtx = null
  let seAudioBuffer = null
  let seGainNode = null
  let seUnlockInstalled = false
  function isHttpProtocol(){ try{ return /^https?:$/i.test(location.protocol) }catch(e){ return false } }
  function installAudioContextUnlockers(){
    if(seUnlockInstalled) return
    seUnlockInstalled = true
    const resume = ()=>{ try{ if(seAudioCtx && seAudioCtx.state === 'suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){} }
    ;['pointerdown','click','touchstart','keydown'].forEach(ev=>{ try{ window.addEventListener(ev, resume, { passive:true }) }catch(e){} })
  }
  async function initWebAudioForSE(){
    try{
      const AC = window.AudioContext || window.webkitAudioContext
      if(!AC) return false
      seAudioCtx = seAudioCtx || new AC()
      seGainNode = seGainNode || seAudioCtx.createGain()
      try{ seGainNode.gain.value = 1.0 }catch(e){}
      try{ seGainNode.connect(seAudioCtx.destination) }catch(e){}
      installAudioContextUnlockers()
      if(!se || !se.src || !isHttpProtocol()){ seAudioMode='html'; return false }
      if(seAudioBuffer){ seAudioMode='webaudio'; return true }
      const res = await fetch(se.src, { cache:'force-cache' })
      const arr = await res.arrayBuffer()
      seAudioBuffer = await new Promise((resolve, reject)=>{ try{ seAudioCtx.decodeAudioData(arr, resolve, reject) }catch(e){ reject(e) } })
      seAudioMode = 'webaudio'
      return true
    }catch(e){ seAudioMode='html'; return false }
  }
  function tryPlaySEWebAudio(){
    try{
      if(seAudioMode !== 'webaudio' || !seAudioCtx || !seAudioBuffer || !seGainNode) return false
      if(seAudioCtx.state === 'suspended'){ try{ seAudioCtx.resume().catch(()=>{}) }catch(e){} }
      const src = seAudioCtx.createBufferSource(); src.buffer = seAudioBuffer; src.connect(seGainNode); src.start(0)
      return true
    }catch(e){ return false }
  }
  function ensureSEPool(){
    try{
      if(sePool && sePool.length) return sePool
      if(!se) { sePool = []; return sePool }
      sePool = [se]
      for(let i=1;i<5;i++){
        const a = se.cloneNode(true)
        try{ a.removeAttribute('id') }catch(e){}
        try{ a.preload = 'auto' }catch(e){}
        try{ a.setAttribute('playsinline','') }catch(e){}
        try{ document.body.appendChild(a) }catch(e){}
        try{ a.load() }catch(e){}
        sePool.push(a)
      }
      return sePool
    }catch(e){ sePool = se ? [se] : []; return sePool }
  }
  function playSE(){
    try{
      if(playSE._busy) return
      playSE._busy = true
      setTimeout(()=>{ playSE._busy = false }, 180)
      if(tryPlaySEWebAudio()) return
      const pool = ensureSEPool(); if(!pool.length) return
      let el = null
      for(let i=0;i<pool.length;i++){
        const a = pool[i]
        try{ if(a.paused || a.ended || (a.currentTime||0) === 0){ el = a; break } }catch(e){}
      }
      if(!el) el = pool[0]
      try{ el.currentTime = 0 }catch(e){}
      const p = (function(){ try{ return el.play() }catch(e){ return null } })()
      if(p && p.catch){ p.catch(()=>{ try{ el.load(); el.play().catch(()=>{}) }catch(e){} }) }
    }catch(e){}
  }
  try{ initWebAudioForSE().catch(()=>{}) }catch(e){}
  try{ document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible'){ try{ const pool=ensureSEPool(); pool.forEach(a=>{ try{ a.load() }catch(e){} }) }catch(e){}; try{ if(seAudioCtx && seAudioCtx.state==='suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){} } }) }catch(e){}

  async function activate() {

    try{
      if(btn._locked) return;
      btn._locked = true;
      btn.classList.add('disabled');
      btn.setAttribute('aria-disabled','true');
      if(screen) screen.style.pointerEvents = 'none';
      setTimeout(()=>{ btn._locked = false }, 2000)
    }catch(e){}
  btn.classList.add('pressed')
  // クリック時は AudioContext の再開を試みる
  try{ if(seAudioCtx && seAudioCtx.state==='suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){}
  playSE()

    const api = window.transitionAPI
    try{ sessionStorage.setItem('start_initiated', '1') }catch(e){}

    if(window.router && window.router.navigate){
      if(api && api.fadeOutThen){

        api.fadeOutThen(()=>{ window.router.navigate('start.html') }, 400)
      }else{

        if(screen) screen.classList.remove('visible')
        setTimeout(()=> window.router.navigate('start.html'), 400)
      }
      return
    }

    if(api && api.fadeOutNavigate){
      setTimeout(()=> api.fadeOutNavigate('start.html', 400), 20)
    }else{

      try{
        const getRootVar = (name, fallback) => { try{ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback }catch(e){ return fallback } }
        const toMs = (v, fallback) => { if(!v) return fallback||0; v=String(v).trim(); if(v.endsWith('ms')) return Math.round(parseFloat(v)); if(v.endsWith('s')) return Math.round(parseFloat(v)*1000); const n=parseFloat(v); return Number.isFinite(n)?Math.round(n):(fallback||0) }
        const fadeOutStr = getRootVar('--notice-body-fade-out','400ms')
        const fadeOutMs = toMs(fadeOutStr,400)
        const startOp = getRootVar('--notice-body-opacity-start','0')
        if(sceneBody){ sceneBody.style.transition = `opacity ${fadeOutStr} ease`; sceneBody.style.opacity = startOp }
        if(sceneTitle){ sceneTitle.style.transition = `opacity ${fadeOutStr} ease`; sceneTitle.style.opacity = startOp }
        setTimeout(()=>{
          if (screen) screen.classList.remove('visible')
          setTimeout(()=> { location.href = 'start.html' }, toMs(getRootVar('--transition-duration','400ms'),400))
        }, fadeOutMs + 20)
      }catch(e){ setTimeout(() => { if (screen) screen.classList.remove('visible'); setTimeout(() => { location.href = 'start.html' }, 400) }, 40) }
    }
  }

  btn.addEventListener('click', (e) => { e.preventDefault(); activate(); });
  btn.addEventListener('pointerdown', () => { if(btn._locked) return; btn.classList.add('pressed') });
  btn.addEventListener('pointerup', () => btn.classList.remove('pressed'));
  btn.addEventListener('pointercancel', () => btn.classList.remove('pressed'));
})();

(function () {
  const panel = document.querySelector('.scene-layer') || document.querySelector('.notice-panel');
  const imgs = [
    document.getElementById('scene-title'),
    document.getElementById('scene-body'),
    document.getElementById('btn-susumu'),
  ].filter(Boolean);

  imgs.forEach((img) => {
    img.addEventListener('load', () => console.log('notice image loaded:', img.src));
    img.addEventListener('error', () => {
      console.error('failed to load notice image:', img.src);
      if (img.id === 'scene-body' && panel) {
        const f = document.createElement('div');
        f.className = 'notice-text';
        f.textContent = '注意事項: ここに本文が表示されます。';
        const btnNode = panel.querySelector('#btn-susumu');
        if (btnNode) panel.insertBefore(f, btnNode);
        else panel.appendChild(f);
      }
      img.style.display = 'none';
    });
  });
})();

