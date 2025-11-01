(function(){
  'use strict'

  const screen = document.getElementById('screen')
  const container = document.querySelector('[data-ui-text-container]')
  const btnNext = document.getElementById('btn-next')
  const btnRestart = document.getElementById('btn-restart')
  const bgm = document.getElementById('bgm')
  const seButton = document.getElementById('se-button')
  const meLight = document.getElementById('me-light')
  const meVessel = document.getElementById('me-vessel')
  const meTitle = document.getElementById('me-title')

  const uiImages = [
    'assets/ui_text/missed_end/01.png',
    'assets/ui_text/missed_end/02.png',
    'assets/ui_text/missed_end/03.png'
  ]

  let idx = 0

  let _animating = false
  let _navigating = false

  // BGM 自動再生解錠（iOS Safari 対応）
  function setupUserGestureBgmUnlock(){
    try{
      if(!bgm) return
      const unlock = ()=>{
        try{ bgm.volume = 0.6; bgm.play().catch(()=>{}) }catch(e){}
        try{ window.removeEventListener('pointerdown', unlock) }catch(e){}
        try{ window.removeEventListener('click', unlock) }catch(e){}
        try{ window.removeEventListener('touchstart', unlock) }catch(e){}
        try{ window.removeEventListener('keydown', unlock) }catch(e){}
      }
      window.addEventListener('pointerdown', unlock, { once:true })
      window.addEventListener('click', unlock, { once:true })
      window.addEventListener('touchstart', unlock, { once:true })
      window.addEventListener('keydown', unlock, { once:true })
    }catch(e){}
  }
  // オーディオ解錠用ポップアップは使用しない方針のため未実装

  function lockButtons(ms){
    try{
      const t = typeof ms === 'number' ? ms : 600
      if(lockButtons._locked) return false
      lockButtons._locked = true
      setTimeout(()=>{ lockButtons._locked = false }, t)
      return true
    }catch(e){ return true }
  }

  // SE（ボタン）堅牢化: WebAudio + HTMLAudio プール
  let sePool = null
  let seAudioMode = 'html'
  let seAudioCtx = null
  let seAudioBuffer = null
  let seGainNode = null
  let seUnlockInstalled = false
  function isHttp(){ try{ return /^https?:$/i.test(location.protocol) }catch(e){ return false } }
  function installUnlockers(){ if(seUnlockInstalled) return; seUnlockInstalled = true; const resume=()=>{ try{ if(seAudioCtx && seAudioCtx.state==='suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){} }; ['pointerdown','click','touchstart','keydown'].forEach(ev=>{ try{ window.addEventListener(ev, resume, { passive:true }) }catch(e){} }) }
  async function initWebAudioSE(){ try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false; seAudioCtx=seAudioCtx||new AC(); seGainNode=seGainNode||seAudioCtx.createGain(); try{ seGainNode.gain.value=1.0 }catch(e){}; try{ seGainNode.connect(seAudioCtx.destination) }catch(e){}; installUnlockers(); if(!seButton||!seButton.src||!isHttp()){ seAudioMode='html'; return false } if(seAudioBuffer){ seAudioMode='webaudio'; return true } const res=await fetch(seButton.src,{cache:'force-cache'}); const arr=await res.arrayBuffer(); seAudioBuffer=await new Promise((resolve,reject)=>{ try{ seAudioCtx.decodeAudioData(arr, resolve, reject) }catch(e){ reject(e) } }); seAudioMode='webaudio'; return true }catch(e){ seAudioMode='html'; return false } }
  function tryPlaySEWebAudio(){ try{ if(seAudioMode!=='webaudio'||!seAudioCtx||!seAudioBuffer||!seGainNode) return false; if(seAudioCtx.state==='suspended'){ try{ seAudioCtx.resume().catch(()=>{}) }catch(e){} } const src=seAudioCtx.createBufferSource(); src.buffer=seAudioBuffer; src.connect(seGainNode); src.start(0); return true }catch(e){ return false } }
  function ensureSEPool(){ try{ if(sePool&&sePool.length) return sePool; if(!seButton){ sePool=[]; return sePool } sePool=[seButton]; for(let i=1;i<5;i++){ const a=seButton.cloneNode(true); try{ a.removeAttribute('id') }catch(e){}; try{ a.preload='auto' }catch(e){}; try{ a.setAttribute('playsinline','') }catch(e){}; try{ document.body.appendChild(a) }catch(e){}; try{ a.load() }catch(e){}; sePool.push(a) } return sePool }catch(e){ sePool=[]; return sePool } }
  function setupSEVisibilityRefresh(){
    try{
      const onVisible = ()=>{
        try{ if(seAudioCtx && seAudioCtx.state==='suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){}
        try{ const pool = ensureSEPool(); for(let i=0;i<pool.length;i++){ try{ pool[i].load() }catch(e){} } }catch(e){}
      }
      document.addEventListener('visibilitychange', ()=>{ try{ if(document.visibilityState==='visible') onVisible() }catch(e){} })
      window.addEventListener('pageshow', (ev)=>{ try{ if(ev && ev.persisted) onVisible(); else onVisible() }catch(e){} })
    }catch(e){}
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
        try{ if(a.paused || a.ended || (a.currentTime||0)===0){ el=a; break } }catch(e){}
      }
      if(!el) el = pool[0]
      try{ el.currentTime = 0 }catch(e){}
      const p = (function(){ try{ return el.play() }catch(e){ return null } })()
      if(p && p.catch){ p.catch(()=>{ try{ el.load(); el.play().catch(()=>{}) }catch(e){} }) }
    }catch(e){}
  }
  function playBgm(){
    try{
      if(!bgm) return
      bgm.volume = 0.6
      try{ bgm.currentTime = 0 }catch(e){}
      try{ bgm.play().catch(()=>{}) }catch(e){}
    }catch(e){}
  }

  function showImage(i){
    if(_animating) return
    _animating = true
    if(!container) return
    const nextSrc = uiImages[i] || ''
    const prev = container.querySelector('.ui-text-image')
    const doInsert = ()=>{
      try{ container.innerHTML = '' }catch(e){}
      const img = document.createElement('img')
      img.className = 'ui-text-image hide'
      img.src = nextSrc
      img.alt = ''
      img.width = 1280; img.height = 720
      container.appendChild(img)
      setTimeout(()=>{ try{ img.classList.remove('hide'); img.classList.add('show') }catch(e){} }, 30)

      try{
        const cs = getComputedStyle(document.documentElement)
        const fin = (cs.getPropertyValue('--me-body-fade-in')||'').trim() || '600ms'
        const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):600 }
        setTimeout(()=>{ _animating = false }, toMs(fin) + 60)
      }catch(e){ setTimeout(()=>{ _animating = false }, 700) }
    }
    if(prev){
      try{

        const cs = getComputedStyle(document.documentElement)
        const v = (cs.getPropertyValue('--me-body-fade-out')||'').trim() || '400ms'
        const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
        const waitMs = toMs(v)

        prev.classList.remove('show'); prev.classList.add('hide')
        let fired = false
        const onEnd = (ev)=>{
          if(ev && ev.propertyName && ev.propertyName.indexOf('opacity') === -1) return
          if(fired) return; fired = true
          try{ prev.removeEventListener('transitionend', onEnd) }catch(e){}
          doInsert()
        }
        try{ prev.addEventListener('transitionend', onEnd) }catch(e){}
        setTimeout(()=>{ if(!fired){ try{ prev.removeEventListener && prev.removeEventListener('transitionend', onEnd) }catch(e){} ; doInsert() } }, waitMs + 60)
      }catch(e){ doInsert() }
    } else {
      doInsert()
    }
  }

  function revealFinal(){

    const prev = container ? container.querySelector('.ui-text-image') : null
    const afterOut = ()=>{
      try{ if(container) container.innerHTML = '' }catch(e){}
      try{
        if(meTitle){ meTitle.classList.remove('hide'); meTitle.classList.add('show') }
        if(btnRestart){ btnRestart.classList.remove('hidden'); btnRestart.classList.add('show'); btnRestart.tabIndex = 0 }
        if(btnNext){ btnNext.classList.add('hidden') }
        try{ if(meLight) meLight.style.opacity = '0.4' }catch(e){}
      }catch(e){}
    }
    if(prev){
      try{
        const cs = getComputedStyle(document.documentElement)
        const v = (cs.getPropertyValue('--me-body-fade-out')||'').trim() || '400ms'
        const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
        const waitMs = toMs(v)
        prev.classList.remove('show'); prev.classList.add('hide')
        let fired = false
        const onEnd = (ev)=>{
          if(ev && ev.propertyName && ev.propertyName.indexOf('opacity') === -1) return
          if(fired) return; fired = true
          try{ prev.removeEventListener('transitionend', onEnd) }catch(e){}
          afterOut()
        }
        try{ prev.addEventListener('transitionend', onEnd) }catch(e){}
        setTimeout(()=>{ if(!fired){ try{ prev.removeEventListener && prev.removeEventListener('transitionend', onEnd) }catch(e){} ; afterOut() } }, waitMs + 60)
      }catch(e){ afterOut() }
    } else {
      afterOut()
    }
  }

  function next(){
    if(_animating || _navigating) return
    playSE()
    if(idx >= uiImages.length - 1){ revealFinal(); return }
    idx += 1
    showImage(idx)
  }

  function init(){

  try{ if(screen) requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20)) }catch(e){}
  setupUserGestureBgmUnlock();
  playBgm()
  try{ initWebAudioSE().catch(()=>{}) }catch(e){}
  try{ setupSEVisibilityRefresh() }catch(e){}

    idx = 0
    showImage(idx)

  try{ if(btnNext) { btnNext._missed_handler = ()=>{ if(_animating || _navigating) return;

    try{ const cs = getComputedStyle(document.documentElement); const fin=(cs.getPropertyValue('--me-body-fade-in')||'').trim()||'600ms'; const fout=(cs.getPropertyValue('--me-body-fade-out')||'').trim()||'400ms'; const toMs=(v)=>{ v=String(v).trim(); if(v.endsWith('ms')) return Math.round(parseFloat(v)); if(v.endsWith('s')) return Math.round(parseFloat(v)*1000); const n=parseFloat(v); return Number.isFinite(n)?Math.round(n):0 }; const lockMs=Math.max(800, toMs(fin)+toMs(fout)+80); if(!lockButtons(lockMs)) return; btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true'); setTimeout(()=>{ try{ btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') }catch(e){} }, lockMs) }catch(e){ if(!lockButtons(800)) return }
    try{ if(bgm && bgm.paused){ bgm.volume = 0.6; bgm.play().catch(()=>{}) } }catch(e){}
    try{ if(seAudioCtx && seAudioCtx.state==='suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){}
    try{ if(seAudioMode!=='webaudio'){ initWebAudioSE().catch(()=>{}) } }catch(e){}
    playSE(); next() }; btnNext.addEventListener('click', btnNext._missed_handler) } }catch(e){}
  try{ if(btnRestart) { btnRestart._missed_handler = ()=>{ if(_navigating) return; _navigating = true; if(!lockButtons(1000)) return; try{ btnRestart.classList.add('disabled'); btnRestart.setAttribute('aria-disabled','true') }catch(e){} ; playSE(); if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else { try{ if(screen) screen.classList.remove('visible') }catch(e){} ;

        try{
          const v = getComputedStyle(document.documentElement).getPropertyValue('--transition-duration').trim() || '400ms'
          const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
          setTimeout(()=>{ location.href = 'start.html' }, toMs(v))
        }catch(e){ setTimeout(()=>{ location.href = 'start.html' }, 400) }
      } }; btnRestart.addEventListener('click', btnRestart._missed_handler) } }catch(e){}
  }

  try{ init() }catch(e){ console.error(e) }

  if(typeof window !== 'undefined'){
    window.missedEndInit = init
  }

})();

