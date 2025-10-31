(function(){
  'use strict'

  const screen = document.getElementById('screen')
  const btnBack = document.getElementById('btn-back')
  const se = document.getElementById('se-button')

  function stopBgm(){
    try{
      const bgm = document.getElementById('bgm')
      if(bgm && !bgm.paused){

        bgm.pause(); bgm.currentTime = 0
      }
    }catch(e){  }
  }

  // SE 再生の堅牢化（WebAudio + HTMLAudio プール）
  let sePool = null
  let seAudioMode = 'html'
  let seAudioCtx = null
  let seAudioBuffer = null
  let seGainNode = null
  let seUnlockInstalled = false
  function isHttp(){ try{ return /^https?:$/i.test(location.protocol) }catch(e){ return false } }
  function installUnlockers(){ if(seUnlockInstalled) return; seUnlockInstalled = true; const resume=()=>{ try{ if(seAudioCtx && seAudioCtx.state==='suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){} }; ['pointerdown','click','touchstart','keydown'].forEach(ev=>{ try{ window.addEventListener(ev, resume, { passive:true }) }catch(e){} }) }
  async function initWebAudioSE(){ try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false; seAudioCtx=seAudioCtx||new AC(); seGainNode=seGainNode||seAudioCtx.createGain(); try{ seGainNode.gain.value=1.0 }catch(e){}; try{ seGainNode.connect(seAudioCtx.destination) }catch(e){}; installUnlockers(); if(!se||!se.src||!isHttp()){ seAudioMode='html'; return false } if(seAudioBuffer){ seAudioMode='webaudio'; return true } const res=await fetch(se.src,{cache:'force-cache'}); const arr=await res.arrayBuffer(); seAudioBuffer=await new Promise((resolve,reject)=>{ try{ seAudioCtx.decodeAudioData(arr, resolve, reject) }catch(e){ reject(e) } }); seAudioMode='webaudio'; return true }catch(e){ seAudioMode='html'; return false } }
  function tryPlaySEWebAudio(){ try{ if(seAudioMode!=='webaudio'||!seAudioCtx||!seAudioBuffer||!seGainNode) return false; if(seAudioCtx.state==='suspended'){ try{ seAudioCtx.resume().catch(()=>{}) }catch(e){} } const src=seAudioCtx.createBufferSource(); src.buffer=seAudioBuffer; src.connect(seGainNode); src.start(0); return true }catch(e){ return false } }
  function ensureSEPool(){ try{ if(sePool&&sePool.length) return sePool; if(!se){ sePool=[]; return sePool } sePool=[se]; for(let i=1;i<5;i++){ const a=se.cloneNode(true); try{ a.removeAttribute('id') }catch(e){}; try{ a.preload='auto' }catch(e){}; try{ a.setAttribute('playsinline','') }catch(e){}; try{ document.body.appendChild(a) }catch(e){}; try{ a.load() }catch(e){}; sePool.push(a) } return sePool }catch(e){ sePool=[]; return sePool } }
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
  try{ initWebAudioSE().catch(()=>{}) }catch(e){}

  function getRootVar(name, fallback){
    try{ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback }catch(e){ return fallback }
  }

  function toMs(v, fallback){
    if(!v) return fallback || 0
    v = String(v).trim()
    if(v.endsWith('ms')) return Math.round(parseFloat(v))
    if(v.endsWith('s')) return Math.round(parseFloat(v) * 1000)
    const n = parseFloat(v)
    return Number.isFinite(n) ? Math.round(n) : (fallback || 0)
  }

  function goBack(){
    playSE() // ボタン音を鳴らす

    try{
      const fadeOutStr = getRootVar('--credit-body-fade-out', '400ms')
      const fadeOutMs = toMs(fadeOutStr, 400)
      const creditBody = document.getElementById('credit-body')
      const creditTitle = document.getElementById('credit-title')
      const startOp = getRootVar('--credit-body-opacity-start', '0')
      if(creditBody){ creditBody.style.transition = `opacity ${fadeOutStr} ease`; creditBody.style.opacity = startOp }
      if(creditTitle){ creditTitle.style.transition = `opacity ${fadeOutStr} ease`; creditTitle.style.opacity = startOp }

      setTimeout(()=>{
        if(screen && screen.classList) screen.classList.remove('visible')

        const screenFadeMs = toMs(getRootVar('--transition-duration','400ms'),400)
        setTimeout(()=>{ window.location.href = 'start.html' }, screenFadeMs)
      }, fadeOutMs + 20)
    }catch(e){ if(screen && screen.classList) screen.classList.remove('visible'); setTimeout(()=>{ window.location.href = 'start.html' }, 400) }
  }

  function lockButtons(ms){
    try{
      const t = typeof ms === 'number' ? ms : 600
      if(lockButtons._locked) return false
      lockButtons._locked = true
      setTimeout(()=>{ lockButtons._locked = false }, t)
      return true
    }catch(e){ return true }
  }

  function start(){
    stopBgm()
    try{
      if(screen && screen.classList) requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20))
    }catch(e){  }

    try{
      const creditBody = document.getElementById('credit-body')
      const creditTitle = document.getElementById('credit-title')
      if(creditBody || creditTitle){
        const fadeInStr = getRootVar('--credit-body-fade-in','600ms')
        const delayStr = getRootVar('--credit-body-fade-delay','120ms')
        const startOp = getRootVar('--credit-body-opacity-start','0')
        const endOp = getRootVar('--credit-body-opacity-end','1')
        const prep = (el)=>{ if(!el) return; el.style.opacity = startOp; el.style.transition = `opacity ${fadeInStr} ease ${delayStr}` }
        prep(creditBody); prep(creditTitle)
        requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
          if(creditBody) creditBody.style.opacity = endOp
          if(creditTitle) creditTitle.style.opacity = endOp
        }) })
      }
    }catch(e){}

    if(btnBack) btnBack.focus()
  }

  if(btnBack) btnBack.addEventListener('click', e=>{ e && e.preventDefault(); if(!lockButtons(1000)) return; try{ btnBack.classList.add('disabled'); btnBack.setAttribute('aria-disabled','true'); if(screen) screen.style.pointerEvents='none' }catch(e){}; goBack() })

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(start, 80))
  } else {
    setTimeout(start, 80)
  }

})();

