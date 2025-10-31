(function(){
  'use strict'

  const uiImages = [
    'assets/ui_text/distortedend/01.png',
    'assets/ui_text/distortedend/02.png',
    'assets/ui_text/distortedend/03.png',
    'assets/ui_text/distortedend/04.png',
    'assets/ui_text/distortedend/05.png'
  ]

  const duryFrames = [
    'assets/character/bad_alive/01_duryodhana_bad_alive_top.png',
    'assets/character/bad_alive/02_duryodhana_bad_alive_mid.png',
    'assets/character/bad_alive/03_duryodhana_bad_alive_bottom.png'
  ]

  let idx = 0
  let container = null
  let btnNext = null
  let btnRestart = null
  let bgm = null
  let duryFrame = null
  let duryTimer = null

  let _animating = false
  let _navigating = false

  function lockButtons(ms){
    try{
      const t = typeof ms === 'number' ? ms : 600
      if(lockButtons._locked) return false
      lockButtons._locked = true
      setTimeout(()=>{ lockButtons._locked = false }, t)
      return true
    }catch(e){ return true }
  }

  function setCharStateByIndex(i){
    const frame = duryFrame || document.getElementById('duryodhana-frame')
    try{
      if(frame) frame.src = duryFrames[Math.max(0, Math.min(i, duryFrames.length-1))]
    }catch(e){}
  }

  function cycleCharImages(){
    if(duryTimer) clearInterval(duryTimer)
    const seq = [0,1,2,1] // 0->1->2->1 の順でループ
    let i = 0
    duryTimer = setInterval(()=>{ setCharStateByIndex(seq[i % seq.length]); i++ }, 700)
  }

  function stopCycleCharImages(){ if(duryTimer){ clearInterval(duryTimer); duryTimer = null } }

  function tryPlayBgm(){ if(!bgm) return; bgm.volume = 0.6; bgm.play().catch(()=>{}) }

  function playSE(){ const se = document.getElementById('se-button'); if(!se) return; try{ se.currentTime = 0; se.play().catch(()=>{}) }catch(e){} }

  function showImage(i){
    if(_animating) return
    _animating = true

    container = container || document.querySelector('[data-ui-text-container]')
    if(!container){ _animating = false; return }

    const cs = getComputedStyle(document.documentElement)
    const finStr = (cs.getPropertyValue('--prologue-body-fade-in')||'').trim() || '600ms'
    const foutStr = (cs.getPropertyValue('--prologue-body-fade-out')||'').trim() || '400ms'
    const delayStr = (cs.getPropertyValue('--prologue-body-fade-delay')||'').trim() || '0ms'
    const toMs = (v)=>{ v=String(v).trim(); if(v.endsWith('ms')) return Math.round(parseFloat(v)); if(v.endsWith('s')) return Math.round(parseFloat(v)*1000); const n=parseFloat(v); return Number.isFinite(n)?Math.round(n):0 }
    const finMs = toMs(finStr)
    const foutMs = toMs(foutStr)
    const delayMs = toMs(delayStr)

    const targetSrc = uiImages[i]
    const titleEl = document.getElementById('distorted-title')
    const titleVisible = !!(titleEl && titleEl.classList && titleEl.classList.contains('show'))

    const sameAsTitle = titleEl && typeof titleEl.src === 'string' && titleEl.src.split('/').pop() === targetSrc.split('/').pop()

    const prev = container.querySelector('.ui-text-image')

    const insertAndFadeIn = ()=>{
      const img = document.createElement('img')
      img.className = 'ui-text-image hide'
      img.src = targetSrc
      img.alt = ''
      img.width = 1280; img.height = 720
      img.style.display = 'block'
      img.style.margin = '0 auto'
      container.appendChild(img)
      setTimeout(()=>{ try{ img.classList.remove('hide'); img.classList.add('show') }catch(e){} }, 30)

      setTimeout(()=>{ _animating = false }, delayMs + finMs + 60)
    }

    if(sameAsTitle){

      if(prev){
        try{ prev.classList.remove('show'); prev.classList.add('hide') }catch(e){}
        setTimeout(()=>{ try{ if(prev.parentElement) prev.parentElement.removeChild(prev) }catch(e){} }, foutMs + 40)
      } else {

      }

      try{
        if(titleEl){

          titleEl.classList.remove('hide')
          setTimeout(()=>{ try{ titleEl.classList.add('show') }catch(e){} }, 30)
        }
      }catch(e){}

      setTimeout(()=>{ _animating = false }, delayMs + finMs + 60)
      return
    }

    if(titleVisible){
      try{ titleEl.classList.remove('show'); titleEl.classList.add('hide') }catch(e){}

      setTimeout(()=>{ insertAndFadeIn() }, foutMs + 40)
      return
    }

    if(prev){
      try{ prev.classList.remove('show'); prev.classList.add('hide') }catch(e){}
      setTimeout(()=>{ try{ if(prev.parentElement) prev.parentElement.removeChild(prev) }catch(e){}; insertAndFadeIn() }, foutMs + 40)
      return
    }

    insertAndFadeIn()
  }

  function revealFinalUI(){
    const title = document.getElementById('distorted-title')
    if(title){ title.classList.remove('hide'); title.classList.add('show') }
    if(btnRestart){ btnRestart.classList.remove('hidden'); btnRestart.style.display = ''; btnRestart.classList.add('show'); btnRestart.tabIndex = 0 }
    if(btnNext) btnNext.classList.add('hidden')
    if(duryFrame) duryFrame.classList.add('show')
  }

  function next(){
    if(_animating || _navigating) return

    if(idx >= uiImages.length - 1){ playSE(); revealFinalUI(); return }

    idx += 1
    showImage(idx)
    playSE()

    if(idx >= uiImages.length - 1){ revealFinalUI() }
  }

  function init(){

    btnNext = document.getElementById('btn-next')
    btnRestart = document.getElementById('btn-restart')
    bgm = document.getElementById('bgm')
    duryFrame = document.getElementById('duryodhana-frame')

  if(btnRestart){ btnRestart.classList.add('hidden'); btnRestart.style.display = 'none'; btnRestart.tabIndex = -1 }
  const title = document.getElementById('distorted-title'); if(title){ title.classList.add('hide'); }

    setCharStateByIndex(0)
    cycleCharImages()
    tryPlayBgm()

    idx = 0
    showImage(idx)

  if(btnNext){ btnNext._dist_handler = ()=>{
      if(_animating || _navigating) return
      try{
        const cs = getComputedStyle(document.documentElement)
        const fin = (cs.getPropertyValue('--prologue-body-fade-in')||'').trim() || '600ms'
        const fout = (cs.getPropertyValue('--prologue-body-fade-out')||'').trim() || '400ms'
        const del = (cs.getPropertyValue('--prologue-body-fade-delay')||'').trim() || '0ms'
        const toMs = (v)=>{ v=String(v).trim(); if(v.endsWith('ms')) return Math.round(parseFloat(v)); if(v.endsWith('s')) return Math.round(parseFloat(v)*1000); const n=parseFloat(v); return Number.isFinite(n)?Math.round(n):0 }
        const lockMs = Math.max(800, toMs(fin)+toMs(fout)+toMs(del)+80)
        if(!lockButtons(lockMs)) return
        btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true')
        setTimeout(()=>{ try{ btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') }catch(e){} }, lockMs)
      }catch(e){ if(!lockButtons(800)) return }
      tryPlayBgm(); next()
    }; btnNext.addEventListener('click', btnNext._dist_handler) }
  if(btnRestart){ btnRestart._dist_handler = ()=>{ if(_navigating) return; if(!lockButtons(1000)) return; _navigating = true; try{ btnRestart.classList.add('disabled'); btnRestart.setAttribute('aria-disabled','true') }catch(e){}; if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else {

        try{ const screen = document.getElementById('screen'); if(screen) screen.classList.remove('visible') }catch(e){}
        try{
          const v = (getComputedStyle(document.documentElement).getPropertyValue('--transition-duration')||'').trim() || '400ms'
          const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
          setTimeout(()=>{ location.href = 'start.html' }, toMs(v))
        }catch(e){ setTimeout(()=>{ location.href = 'start.html' }, 400) }
      } }; btnRestart.addEventListener('click', btnRestart._dist_handler) }

    const screen = document.getElementById('screen')
    if(screen){
      try{ screen.style.removeProperty('opacity') }catch(e){}
      requestAnimationFrame(()=> setTimeout(()=>{ try{ screen.classList.add('visible') }catch(e){} }, 20))
    }
  }

  try{ init() }catch(e){ console.error(e) }

  if(typeof window !== 'undefined'){
    window.distortedEndInit = init
    window.distortedEndStop = function(){
      stopCycleCharImages()
      if(bgm && !bgm.paused){ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} }
      if(btnNext && btnNext._dist_handler) btnNext.removeEventListener('click', btnNext._dist_handler)
      if(btnRestart && btnRestart._dist_handler) btnRestart.removeEventListener('click', btnRestart._dist_handler)

      const title = document.getElementById('distorted-title'); if(title) title.classList.remove('show')
      if(btnRestart) btnRestart.classList.remove('show')
      if(container) container.innerHTML = ''
    }
  }

  if(!window.transitionAPI) window.transitionAPI = {}
  if(!window.transitionAPI.fadeOutNavigate){
    window.transitionAPI.fadeOutNavigate = function(url, ms){
      try{
        const duration = typeof ms === 'number' ? ms : 400

        let o = document.getElementById('fade-overlay')
        if(!o){
          o = document.createElement('div')
          o.id = 'fade-overlay'
          o.style.position = 'fixed'
          o.style.left = '0'
          o.style.top = '0'
          o.style.right = '0'
          o.style.bottom = '0'
          o.style.background = '#000'
          o.style.opacity = '0'
          o.style.zIndex = '99999'
          o.style.transition = 'opacity ' + (duration/1000) + 's ease'
          document.body.appendChild(o)
        }

        void o.offsetWidth
        o.style.opacity = '1'
        setTimeout(()=>{ try{ location.href = url }catch(e){ location.href = url } }, duration)
      }catch(e){ try{ location.href = url }catch(_){} }
    }
  }

})();

