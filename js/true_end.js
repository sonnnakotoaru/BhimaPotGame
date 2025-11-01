(function(){
  'use strict'

  const uiImages = [
    'assets/ui_text/trueend/01.png',
    'assets/ui_text/trueend/02.png',
    'assets/ui_text/trueend/03.png',
    'assets/ui_text/trueend/04.png',
    'assets/ui_text/trueend/05.png',
    'assets/ui_text/trueend/06.png',
    'assets/ui_text/trueend/07.png',
    'assets/ui_text/trueend/08.png'
  ]

  let idx = 0
  let container = null
  let btnNext = null
  let btnRestart = null
  let bgm = null
  let seBtn = null

  let bodyTop = null, bodyMid = null, bodyBottom = null, teWrapper = null

  let hairTop = null, hairMid = null, hairBottom = null
  let eyeElem = null

  let eyeNextTimer = null
  let eyeAnimating = false

  let _lockedButtons = false

  let mouthElem = null
  let mouthNextTimer = null
  let mouthAnimating = false

  let teHiddenFromSix = false

  let _animatingBody = false

  // ボタンSEの堅牢化（WebAudio優先 + HTMLAudioプール）
  let sePool = null
  let seAudioMode = 'html'
  let seAudioCtx = null
  let seAudioBuffer = null
  let seGainNode = null
  let seUnlockInstalled = false
  function isHttp(){ try{ return /^https?:$/i.test(location.protocol) }catch(e){ return false } }
  function installUnlockers(){ if(seUnlockInstalled) return; seUnlockInstalled = true; const resume=()=>{ try{ if(seAudioCtx && seAudioCtx.state==='suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){} }; ['pointerdown','click','touchstart','keydown'].forEach(ev=>{ try{ window.addEventListener(ev, resume, { passive:true }) }catch(e){} }) }
  async function initWebAudioSE(){ try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false; seAudioCtx=seAudioCtx||new AC(); seGainNode=seGainNode||seAudioCtx.createGain(); try{ seGainNode.gain.value=1.0 }catch(e){}; try{ seGainNode.connect(seAudioCtx.destination) }catch(e){}; installUnlockers(); if(!seBtn||!seBtn.src||!isHttp()){ seAudioMode='html'; return false } if(seAudioBuffer){ seAudioMode='webaudio'; return true } const res=await fetch(seBtn.src,{cache:'force-cache'}); const arr=await res.arrayBuffer(); seAudioBuffer=await new Promise((resolve,reject)=>{ try{ seAudioCtx.decodeAudioData(arr, resolve, reject) }catch(e){ reject(e) } }); seAudioMode='webaudio'; return true }catch(e){ seAudioMode='html'; return false } }
  function tryPlaySEWebAudio(){ try{ if(seAudioMode!=='webaudio'||!seAudioCtx||!seAudioBuffer||!seGainNode) return false; if(seAudioCtx.state==='suspended'){ try{ seAudioCtx.resume().catch(()=>{}) }catch(e){} } const src=seAudioCtx.createBufferSource(); src.buffer=seAudioBuffer; src.connect(seGainNode); src.start(0); return true }catch(e){ return false } }
  function ensureSEPool(){ try{ if(sePool&&sePool.length) return sePool; if(!seBtn){ sePool=[]; return sePool } sePool=[seBtn]; for(let i=1;i<5;i++){ const a=seBtn.cloneNode(true); try{ a.removeAttribute('id') }catch(e){}; try{ a.preload='auto' }catch(e){}; try{ a.setAttribute('playsinline','') }catch(e){}; try{ document.body.appendChild(a) }catch(e){}; try{ a.load() }catch(e){}; sePool.push(a) } return sePool }catch(e){ sePool=[]; return sePool } }
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

  function readRootMs(varName, fallbackMs){
    try{
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      if(!v) return fallbackMs
      if(v.endsWith('ms')) return parseFloat(v)
      if(v.endsWith('s')) return parseFloat(v) * 1000
      const n = parseFloat(v); return Number.isFinite(n) ? n : fallbackMs
    }catch(e){ return fallbackMs }
  }

  function fadeAudio(audioEl, targetVolume, durationMs){
    return new Promise((resolve)=>{
      try{
        if(!audioEl) return resolve()
        const start = Math.max(0, Math.min(1, audioEl.volume || 0))
        const end = Math.max(0, Math.min(1, targetVolume))
        if(durationMs <= 0 || start === end){ audioEl.volume = end; return resolve() }
        const startTime = Date.now()
        const delta = end - start
        const stepMs = 50
        const t = setInterval(()=>{
          try{
            const elapsed = Date.now() - startTime
            const p = Math.min(1, elapsed / durationMs)
            audioEl.volume = Math.max(0, Math.min(1, start + delta * p))
            if(p >= 1){ clearInterval(t); return resolve() }
          }catch(e){ clearInterval(t); return resolve() }
        }, stepMs)
      }catch(e){ return resolve() }
    })
  }

  let duryTimer = null
  function startDuryLoop(intervalMs){
    try{
      stopDuryLoop()
      const seq = [0,1,2,1]
      const parts = [bodyTop, bodyMid, bodyBottom]
      const hairParts = [hairTop, hairMid, hairBottom]
  const interval = typeof intervalMs === 'number' ? Math.max(80, intervalMs) : 600

      parts.forEach(p=>{ if(p) p.style.opacity = '0' })
      hairParts.forEach(h=>{ if(h) h.style.opacity = '0' })
      let idxSeq = 0

      if(parts[seq[0]]) parts[seq[0]].style.opacity = '1'
      if(hairParts[seq[0]]) hairParts[seq[0]].style.opacity = '1'
      duryTimer = setInterval(()=>{
        try{
          idxSeq = (idxSeq + 1) % seq.length
          const f = seq[idxSeq]
          parts.forEach((p,pi)=>{ if(p) p.style.opacity = (pi === f ? '1' : '0') })
          hairParts.forEach((h,hi)=>{ if(h) h.style.opacity = (hi === f ? '1' : '0') })
        }catch(e){}
      }, interval)
    }catch(e){}
  }
  function stopDuryLoop(){ try{ if(duryTimer){ clearInterval(duryTimer); duryTimer = null } }catch(e){}
  }

  function blinkOnce(){
    try{
      if(!eyeElem || eyeAnimating) return
      eyeAnimating = true
      const frames = [
  'assets/character/true/10_duryodhana_true_eye_closed.png',
  'assets/character/true/09_duryodhana_true_eye_half.png',
  'assets/character/true/08_duryodhana_true_eye_open_narrow.png',
  'assets/character/true/07_duryodhana_true_eye_open_clear.png',
  'assets/character/true/08_duryodhana_true_eye_open_narrow.png',
  'assets/character/true/09_duryodhana_true_eye_half.png',
  'assets/character/true/10_duryodhana_true_eye_closed.png'
      ]
  const interval = 160 // フレーム間のミリ秒（大きくしてゆっくり目の瞬きにする）
      const prev = eyeElem.src || ''
      frames.forEach((src, i)=>{
        setTimeout(()=>{ try{ eyeElem.src = src }catch(e){} }, i * interval)
      })

      setTimeout(()=>{ try{ eyeElem.src = prev }catch(e){} ; eyeAnimating = false }, frames.length * interval + 20)
    }catch(e){ eyeAnimating = false }
  }

  function scheduleNextBlink(minDelay, maxDelay){
    try{
      if(eyeNextTimer) { clearTimeout(eyeNextTimer); eyeNextTimer = null }

      const minD = typeof minDelay === 'number' ? minDelay : 3000
      const maxD = typeof maxDelay === 'number' ? maxDelay : 7000
      const delay = Math.floor(Math.random() * (maxD - minD + 1)) + minD
      eyeNextTimer = setTimeout(()=>{ try{ blinkOnce(); scheduleNextBlink(minDelay, maxDelay) }catch(e){} }, delay)
    }catch(e){}
  }

  function startEyeLoop(minDelay, maxDelay){
    try{
      stopEyeLoop()
      eyeElem = document.getElementById('te-eye')
      if(!eyeElem) return

  try{ eyeElem.src = eyeElem.src || 'assets/character/true/07_duryodhana_true_eye_open_clear.png' }catch(e){}
      scheduleNextBlink(minDelay, maxDelay)
    }catch(e){}
  }

  function stopEyeLoop(){ try{ if(eyeNextTimer){ clearTimeout(eyeNextTimer); eyeNextTimer = null } ; eyeAnimating = false }catch(e){}
  }

  function mouthOnce(){
    try{
      if(!mouthElem || mouthAnimating) return
      mouthAnimating = true
      const frames = [
  'assets/character/true/12_duryodhana_true_mouth_closed_smile.png',
  'assets/character/true/11_duryodhana_true_mouth_open_smile.png',
  'assets/character/true/12_duryodhana_true_mouth_closed_smile.png'
      ]
      const interval = 180
      const prev = mouthElem.src || ''
      frames.forEach((src, i)=>{
        setTimeout(()=>{ try{ mouthElem.src = src }catch(e){} }, i * interval)
      })
      setTimeout(()=>{ try{ mouthElem.src = prev }catch(e){} ; mouthAnimating = false }, frames.length * interval + 20)
    }catch(e){ mouthAnimating = false }
  }

  function mouthBurst(repeats){
    try{
      if(!mouthElem || mouthAnimating) return
      mouthAnimating = true
  const open = 'assets/character/true/11_duryodhana_true_mouth_open_smile.png'
  const closed = 'assets/character/true/12_duryodhana_true_mouth_closed_smile.png'
      const interval = 100 // 速めにパチパチさせる
      const prev = mouthElem.src || closed
      for(let i=0;i<repeats;i++){
        setTimeout(()=>{ try{ mouthElem.src = open }catch(e){} }, i * interval * 2)
        setTimeout(()=>{ try{ mouthElem.src = closed }catch(e){} }, i * interval * 2 + interval)
      }
      setTimeout(()=>{ try{ mouthElem.src = prev }catch(e){} ; mouthAnimating = false }, repeats * interval * 2 + 20)
    }catch(e){ mouthAnimating = false }
  }

  function scheduleNextMouth(minDelay, maxDelay){
    try{
      if(mouthNextTimer){ clearTimeout(mouthNextTimer); mouthNextTimer = null }

      const minD = typeof minDelay === 'number' ? minDelay : 600
      const maxD = typeof maxDelay === 'number' ? maxDelay : 1200
      const delay = Math.floor(Math.random() * (maxD - minD + 1)) + minD
      mouthNextTimer = setTimeout(()=>{
        try{

          const burstProb = 0.6
          if(Math.random() < burstProb){
            const repeats = 3 + Math.floor(Math.random() * 5) // 3..7 回の小さな連続動作
            mouthBurst(repeats)
          } else {
            mouthOnce()
          }
          scheduleNextMouth(minDelay, maxDelay)
        }catch(e){}
      }, delay)
    }catch(e){}
  }

  function startMouthLoop(minDelay, maxDelay){
    try{
      stopMouthLoop()
      mouthElem = document.getElementById('te-mouth')
      if(!mouthElem) return
      scheduleNextMouth(minDelay, maxDelay)
    }catch(e){}
  }

  function lockButtons(ms){
    try{
      if(_lockedButtons) return
      _lockedButtons = true

      try{ if(btnNext) { btnNext.style.pointerEvents = 'none'; btnNext.tabIndex = -1; btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true') } }catch(e){}
      try{ if(btnRestart) { btnRestart.style.pointerEvents = 'none'; btnRestart.tabIndex = -1; btnRestart.classList.add('disabled'); btnRestart.setAttribute('aria-disabled','true') } }catch(e){}
      const t = typeof ms === 'number' ? ms : 600
      setTimeout(()=>{
        try{ _lockedButtons = false }catch(e){}
        try{ if(btnNext) { btnNext.style.pointerEvents = 'auto'; btnNext.tabIndex = 0; btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') } }catch(e){}
        try{ if(btnRestart) { btnRestart.style.pointerEvents = 'auto'; btnRestart.tabIndex = -1; btnRestart.classList.remove('disabled'); btnRestart.removeAttribute('aria-disabled') } }catch(e){}
      }, t)
    }catch(e){}
  }

  function stopMouthLoop(){ try{ if(mouthNextTimer){ clearTimeout(mouthNextTimer); mouthNextTimer = null } ; mouthAnimating = false }catch(e){}
  }

  function showImage(i){
    container = container || document.querySelector('[data-ui-text-container]')
    if(!container) return
    if(_animatingBody) return

    const prev = container.querySelector('.ui-text-image')
    const doReplace = ()=>{
      const img = document.createElement('img')
      img.className = 'ui-text-image hide'
      img.src = uiImages[i]
      img.alt = ''
      img.width = 1280; img.height = 720
      container.appendChild(img)

      setTimeout(()=>{ try{ img.classList.remove('hide'); img.classList.add('show') }catch(e){} }, 30)

      try{ const fin = readRootMs('--te-body-fade-in', 600); setTimeout(()=>{ _animatingBody = false }, fin + 60) }catch(e){ setTimeout(()=>{ _animatingBody = false }, 700) }
    }

    if(prev){
      try{

        const waitMs = readRootMs('--te-body-fade-out', 400)
        _animatingBody = true

        try{ prev.classList.remove('show'); prev.classList.add('hide') }catch(e){}

        const remover = ()=>{ try{ if(prev && prev.parentElement) prev.parentElement.removeChild(prev) }catch(e){} }
        let fired = false
        const onEnd = (ev)=>{
          if(ev && ev.propertyName && ev.propertyName.indexOf('opacity') === -1) return
          if(fired) return; fired = true
          try{ prev.removeEventListener('transitionend', onEnd) }catch(e){}
          remover(); doReplace()
        }
        try{ prev.addEventListener('transitionend', onEnd) }catch(e){}

        setTimeout(()=>{ if(!fired){ try{ prev.removeEventListener && prev.removeEventListener('transitionend', onEnd) }catch(e){} ; remover(); doReplace() } }, waitMs + 80)
      }catch(e){
        try{ container.innerHTML = '' }catch(e){}
        _animatingBody = true
        doReplace()
      }
    } else {

      try{ container.innerHTML = '' }catch(e){}
      _animatingBody = true
      doReplace()
    }

    try{
      teWrapper = teWrapper || document.getElementById('te-character')
      if(teWrapper){

        const special = 'assets/ui_text/trueend/06.png'
        if(uiImages[i] === special){
          try{ teWrapper.style.opacity = '0' }catch(e){}

          teHiddenFromSix = true
        } else {

          if(teHiddenFromSix){

          } else {
          const n = uiImages.length
          const t = (n <= 1) ? 1 : (1 - (i / (n - 1)))

          setTimeout(()=>{ try{ teWrapper.style.opacity = String(t) }catch(e){} }, 60)
          }
        }
      }
    }catch(e){}

    try{  }catch(e){}

    try{
      const lastIndex = uiImages.length - 1
      if(i === lastIndex){
        try{

          teHiddenFromSix = true
          if(teWrapper){
            try{ teWrapper.style.opacity = '0' }catch(e){}
            try{ teWrapper.style.transform = '' }catch(e){}
          }
        }catch(e){}
      } else {

        try{
          if(!teHiddenFromSix && teWrapper){ try{ teWrapper.style.transform = '' }catch(e){} }
        }catch(e){}
      }
    }catch(e){}
  }

  function revealFinalUI(){
    container = container || document.querySelector('[data-ui-text-container]')
    const doShow = ()=>{
      try{ if(container) container.innerHTML = '' }catch(e){}
      const title = document.getElementById('te-title')
      if(title){ title.style.display = 'block'; setTimeout(()=>{ try{ title.classList.remove('hide'); title.classList.add('show') }catch(e){} }, 16) }
      if(btnRestart){ btnRestart.classList.remove('hidden'); btnRestart.classList.add('show'); btnRestart.tabIndex = 0 }
      if(btnNext) btnNext.classList.add('hidden')

      try{
        if(teWrapper){

          try{ teWrapper.style.opacity = '0' }catch(e){}

          try{ stopMouthLoop() }catch(e){}
          try{ mouthElem = mouthElem || document.getElementById('te-mouth') }catch(e){}
          try{ if(mouthElem) mouthElem.src = 'assets/character/true/12_duryodhana_true_mouth_closed_smile.png' }catch(e){}

          try{
            const fadeMs = readRootMs('--te-body-fade-in', 600)

            teWrapper.style.transition = `opacity ${fadeMs}ms ease`
          }catch(e){}
          try{ teWrapper.classList.add('title-scale') }catch(e){}

          try{
            const slowMs = readRootMs('--te-title-dury-interval', 300)
            try{ startDuryLoop(slowMs) }catch(e){}
          }catch(e){}

          try{ void teWrapper.offsetWidth }catch(e){}

          setTimeout(()=>{ try{ teWrapper.style.opacity = '1' }catch(e){} }, 30)
        }
      }catch(e){}
    }
    const waitMs = readRootMs('--te-body-fade-out', 400)
    setTimeout(doShow, waitMs + 20)
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

  function next(){
    if(_animatingBody) return

    if(idx >= uiImages.length - 1){ playSE(); revealFinalUI(); return }
    idx += 1
    showImage(idx)
    playSE()
  }

  function init(){
    btnNext = document.getElementById('btn-next')
    btnRestart = document.getElementById('btn-restart')
    bgm = document.getElementById('bgm')
    seBtn = document.getElementById('se-button')
    teWrapper = document.getElementById('te-character')
    bodyTop = document.getElementById('te-body-top')
    bodyMid = document.getElementById('te-body-mid')
    bodyBottom = document.getElementById('te-body-bottom')

  hairTop = document.getElementById('te-hair-top')
  hairMid = document.getElementById('te-hair-mid')
  hairBottom = document.getElementById('te-hair-bottom')

    if(btnRestart){ btnRestart.classList.add('hidden'); btnRestart.tabIndex = -1 }
    const title = document.getElementById('te-title'); if(title){ title.classList.add('hide') }

    try{
      if(bgm){

  const targetVol = 0.7
        bgm.currentTime = 0

        try{ bgm.volume = 0 }catch(e){}
        const p = bgm.play()
        const fadeInMs = readRootMs('--te-bgm-fade-in', 800)
        if(p && p.then){
          p.then(()=>{
            try{ fadeAudio(bgm, targetVol, fadeInMs).catch(()=>{}) }catch(e){}
          }).catch(()=>{
            /* ポップアップは表示しない。次のボタン操作で再試行する */
          })
        } else {

          try{ fadeAudio(bgm, targetVol, fadeInMs).catch(()=>{}) }catch(e){}
        }
      }
    }catch(e){}

  idx = 0
  showImage(idx)

  try{ startDuryLoop(700) }catch(e){}

  try{ startEyeLoop(3000, 7000) }catch(e){}

  try{ startMouthLoop(600, 1200) }catch(e){}
  try{ initWebAudioSE().catch(()=>{}) }catch(e){}
  try{ setupSEVisibilityRefresh() }catch(e){}

    if(btnNext){
      btnNext._handler = ()=>{
        if(_lockedButtons || _animatingBody) return

        const lockMs = Math.max(800, readRootMs('--te-body-fade-in',600) + readRootMs('--te-body-fade-out',400) + 80)
        lockButtons(lockMs)
        try{ if(seAudioCtx && seAudioCtx.state==='suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){}
        try{ if(seAudioMode!=='webaudio'){ initWebAudioSE().catch(()=>{}) } }catch(e){}
  try{ if(bgm && bgm.paused){ const targetVol=0.7; const fadeInMs=readRootMs('--te-bgm-fade-in',800); try{ bgm.volume=0 }catch(e){}; bgm.play().then(()=>{ try{ fadeAudio(bgm, targetVol, fadeInMs).catch(()=>{}) }catch(e){} }).catch(()=>{}) } }catch(e){}
        playSE(); next()
      }
      btnNext.addEventListener('click', btnNext._handler)
    }
    if(btnRestart){
      btnRestart._handler = ()=>{
        if(_lockedButtons) return
        lockButtons(1200)
        if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else {

          try{ const screen = document.getElementById('screen'); if(screen) screen.classList.remove('visible') }catch(e){}
          try{
            const cs = getComputedStyle(document.documentElement)
            const pref = (cs.getPropertyValue('--te-screen-fade-out')||'').trim()
            const base = (cs.getPropertyValue('--transition-duration')||'').trim() || '400ms'
            const v = pref || base
            const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
            setTimeout(()=>{ location.href = 'start.html' }, toMs(v))
          }catch(e){ setTimeout(()=>{ location.href = 'start.html' }, 400) }
        }
      }
      btnRestart.addEventListener('click', btnRestart._handler)
    }

    const screen = document.getElementById('screen')
    if(screen){

      try{
        screen.style.opacity = '0'
        try{ screen.classList.add('visible') }catch(e){}
        try{ void screen.offsetWidth }catch(e){}
        setTimeout(()=>{ try{ screen.style.opacity = '1' }catch(e){} }, 20)
      }catch(e){
        try{ screen.classList.add('visible') }catch(e){}
      }
    }
  }

  try{ init() }catch(e){ console.error(e) }

  if(typeof window !== 'undefined'){
    window.trueEndInit = init
    window.trueEndStop = function(){
      try{

        if(bgm && !bgm.paused){
          const fadeOutMs = readRootMs('--te-bgm-fade-out', 1000)
          try{ fadeAudio(bgm, 0, fadeOutMs).then(()=>{ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} }).catch(()=>{ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} }) }catch(e){ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} }
        }
      }catch(e){}
      try{ if(btnNext && btnNext._handler) btnNext.removeEventListener('click', btnNext._handler) }catch(e){}
      try{ if(btnRestart && btnRestart._handler) btnRestart.removeEventListener('click', btnRestart._handler) }catch(e){}
      try{ const c = document.querySelector('[data-ui-text-container]'); if(c) c.innerHTML = '' }catch(e){}
      try{ stopDuryLoop() }catch(e){}
      try{ stopEyeLoop() }catch(e){}
      try{ stopMouthLoop() }catch(e){}
    }
  }

})();

