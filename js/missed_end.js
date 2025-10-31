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

  function lockButtons(ms){
    try{
      const t = typeof ms === 'number' ? ms : 600
      if(lockButtons._locked) return false
      lockButtons._locked = true
      setTimeout(()=>{ lockButtons._locked = false }, t)
      return true
    }catch(e){ return true }
  }

  function playSE(){ try{ if(seButton){ seButton.currentTime = 0; seButton.play().catch(()=>{}) } }catch(e){} }
  function playBgm(){ try{ if(bgm){ bgm.volume = 0.8; bgm.currentTime = 0; bgm.play().catch(()=>{}) } }catch(e){} }

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
    playBgm()

    idx = 0
    showImage(idx)

  try{ if(btnNext) { btnNext._missed_handler = ()=>{ if(_animating || _navigating) return;

    try{ const cs = getComputedStyle(document.documentElement); const fin=(cs.getPropertyValue('--me-body-fade-in')||'').trim()||'600ms'; const fout=(cs.getPropertyValue('--me-body-fade-out')||'').trim()||'400ms'; const toMs=(v)=>{ v=String(v).trim(); if(v.endsWith('ms')) return Math.round(parseFloat(v)); if(v.endsWith('s')) return Math.round(parseFloat(v)*1000); const n=parseFloat(v); return Number.isFinite(n)?Math.round(n):0 }; const lockMs=Math.max(800, toMs(fin)+toMs(fout)+80); if(!lockButtons(lockMs)) return; btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true'); setTimeout(()=>{ try{ btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') }catch(e){} }, lockMs) }catch(e){ if(!lockButtons(800)) return }
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

