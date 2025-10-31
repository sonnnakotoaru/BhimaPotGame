(function(){
  'use strict'

  const uiImages = [
    'assets/ui_text/brokenend/01.png',
    'assets/ui_text/brokenend/02.png',
    'assets/ui_text/brokenend/03.png',
    'assets/ui_text/brokenend/04.png',
    'assets/ui_text/brokenend/05.png'
  ]

  let idx = 0
  let container = null
  let btnNext = null
  let btnRestart = null
  let bgm = null
  let light = null

  let bodyFadeInMs = 600
  let bodyFadeOutMs = 400
  let transitionDurationMs = 400

  let _animating = false
  let _navigating = false

  function fadeOutLight(){
    light = light || document.getElementById('bv-light')
    if(!light) return

    light.classList.add('dim')

    setTimeout(()=>{ try{ light.style.opacity = 0 }catch(e){} }, 20)
  }

  function playSE(){ const se = document.getElementById('se-button'); if(!se) return; try{ se.currentTime = 0; se.play().catch(()=>{}) }catch(e){} }
  function tryPlayBgm(){ if(!bgm) return; bgm.volume = 0.7; bgm.play().catch(()=>{}) }

  function readRootMs(varName, fallbackMs){
    try{
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      if(!v) return fallbackMs

      if(v.endsWith('ms')) return parseFloat(v)
      if(v.endsWith('s')) return parseFloat(v) * 1000

      const n = parseFloat(v)
      return Number.isFinite(n) ? n : fallbackMs
    }catch(e){ return fallbackMs }
  }

  function computeLightOpacityForIndex(i){
    try{
      const n = uiImages.length
      if(n <= 1) return 0
      const t = i / (n - 1)

      const v = 1 - t
      return Math.max(0, Math.min(1, Number(v)))
    }catch(e){ return 0 }
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

  function showImage(i){
    if(_animating) return
    _animating = true
    container = container || document.querySelector('[data-ui-text-container]')
    if(!container) return
    const prev = container.querySelector('img.ui-text-image')
    const doFadeInNext = ()=>{

      try{ if(container) container.innerHTML = '' }catch(e){}
      const img = document.createElement('img')
      img.className = 'ui-text-image hide'
      img.src = uiImages[i]
      img.alt = ''
      img.width = 1280; img.height = 720
      container.appendChild(img)

      setTimeout(()=>{ try{ img.classList.remove('hide'); img.classList.add('show') }catch(e){} }, 30)

      setTimeout(()=>{ _animating = false }, bodyFadeInMs + 60)

      try{
        light = light || document.getElementById('bv-light')
        if(light){
          const target = computeLightOpacityForIndex(i)

          setTimeout(()=>{ try{ light.style.opacity = String(target) }catch(e){} }, 60)
        }
      }catch(e){}
    }

    if(prev){

      try{ prev.classList.remove('show'); prev.classList.add('hide') }catch(e){}
      setTimeout(()=>{ doFadeInNext() }, bodyFadeOutMs + 20)
    } else {

      doFadeInNext()
    }
  }

  function revealFinalUI(){

    container = container || document.querySelector('[data-ui-text-container]')
    const doShowTitle = ()=>{

      try{ if(container) container.innerHTML = '' }catch(e){}

      const title = document.getElementById('bv-title')
      if(title){
        try{
          const scene = document.querySelector('.scene-layer')
          if(scene && scene.contains(title) === false) scene.appendChild(title)
          title.style.display = 'block'

          setTimeout(()=>{ try{ title.classList.remove('hide'); title.classList.add('show') }catch(e){} }, 16)
        }catch(e){}
      }

      if(btnRestart){ btnRestart.classList.remove('hidden'); btnRestart.classList.add('show'); btnRestart.tabIndex = 0 }
      if(btnNext) btnNext.classList.add('hidden')

      try{ if(light){ light.style.opacity = 0 } }catch(e){}
    }

    const waitMs = readRootMs('--bv-body-fade-out', bodyFadeOutMs)

    try{
      const prev = container ? container.querySelector('img.ui-text-image') : null
      if(prev){ try{ prev.classList.remove('show'); prev.classList.add('hide') }catch(e){} }
    }catch(e){}

    setTimeout(doShowTitle, waitMs + 20)
  }

  function next(){
    if(_animating || _navigating) return

    if(idx >= uiImages.length - 1){ playSE(); revealFinalUI(); return }

    idx += 1
    showImage(idx)
    playSE()
  }

  function init(){
    btnNext = document.getElementById('btn-next')
    btnRestart = document.getElementById('btn-restart')
    bgm = document.getElementById('bgm')
    light = document.getElementById('bv-light')

    if(btnRestart){ btnRestart.classList.add('hidden'); btnRestart.tabIndex = -1 }
    const title = document.getElementById('bv-title'); if(title){ title.classList.add('hide') }

  bodyFadeInMs = readRootMs('--bv-body-fade-in', bodyFadeInMs)
  bodyFadeOutMs = readRootMs('--bv-body-fade-out', bodyFadeOutMs)
  transitionDurationMs = readRootMs('--transition-duration', transitionDurationMs)

    tryPlayBgm()

    idx = 0
    showImage(idx)

  if(btnNext){ btnNext._bve_handler = ()=>{
      if(_animating || _navigating) return
      const lockMs = Math.max(800, bodyFadeOutMs + bodyFadeInMs + 80)
      if(!lockButtons(lockMs)) return
      try{ btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true'); setTimeout(()=>{ try{ btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') }catch(e){} }, lockMs) }catch(e){}
      playSE(); next()
    }; btnNext.addEventListener('click', btnNext._bve_handler) }
  if(btnRestart){ btnRestart._bve_handler = ()=>{ if(_navigating) return; _navigating = true; if(!lockButtons(1000)) return; try{ btnRestart.classList.add('disabled'); btnRestart.setAttribute('aria-disabled','true') }catch(e){}; if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else {

        try{ const screen = document.getElementById('screen'); if(screen) screen.classList.remove('visible') }catch(e){}
        try{
          const v = (getComputedStyle(document.documentElement).getPropertyValue('--transition-duration')||'').trim() || '400ms'
          const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
          setTimeout(()=>{ location.href = 'start.html' }, toMs(v))
        }catch(e){ setTimeout(()=>{ location.href = 'start.html' }, 400) }
      } }; btnRestart.addEventListener('click', btnRestart._bve_handler) }

  const screen = document.getElementById('screen')
  if(screen){ requestAnimationFrame(()=> setTimeout(()=>{ try{ screen.classList.add('visible') }catch(e){} }, 20)) }
  }

  try{ init() }catch(e){ console.error(e) }

  if(typeof window !== 'undefined'){
    window.brokenVesselInit = init
    window.brokenVesselStop = function(){ if(bgm && !bgm.paused){ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} } if(btnNext && btnNext._bve_handler) btnNext.removeEventListener('click', btnNext._bve_handler); if(btnRestart && btnRestart._bve_handler) btnRestart.removeEventListener('click', btnRestart._bve_handler); const containerEl = document.querySelector('[data-ui-text-container]'); if(containerEl) containerEl.innerHTML = '' }
  }

})();

