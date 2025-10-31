(function(){
  'use strict'

  const screen = document.getElementById('screen')

  function ensureBgm(){
    let b = document.getElementById('bgm')
    if(!b){
      try{
        b = document.createElement('audio')
        b.id = 'bgm'

  b.src = 'assets/sound/bgm/bgm_normal_piano.mp3'
        b.preload = 'auto'
        b.loop = true
        document.body.appendChild(b)
      }catch(e){ console.warn('failed to create bgm', e) }
    }
    return b
  }
  const bgm = ensureBgm()
  const se = document.getElementById('se-button')

  const lightImg = document.getElementById('light-frame')
  const duryImg = document.getElementById('duryodhana-frame')
  const duryEye = document.getElementById('duryodhana-eye')

  const btnBegin = document.getElementById('btn-begin')
  const btnExit = document.getElementById('btn-exit')
  const btnCredit = document.getElementById('btn-credit')

  const lightFrames = [
    'assets/light/01_light_weak.png',
    'assets/light/02_light_medium.png',
    'assets/light/03_light_strong.png',
  ]
  const duryFrames = [
    'assets/character/wayang/01_duryodhana_wayang_top.png',
    'assets/character/wayang/02_duryodhana_wayang_mid.png',
    'assets/character/wayang/03_duryodhana_wayang_bottom.png',
  ]

  const frameInterval = 700
  let lightIndex = 0
  let duryIndex = 0

  window.addEventListener('load', () => {

    try{ if(window.startSceneInit) window.startSceneInit() }catch(e){}
  })

  function startSceneInit(){
    if (screen) {

      try{ screen.classList.add('start-fade') }catch(e){}

      try{ screen.style.removeProperty('opacity') }catch(e){}

      requestAnimationFrame(() => { screen.classList.add('visible') })
    }

    stopAnims()
    startLightAnim()
    startDuryAnim()

    tryPlayBgmOnFadeIn()
  }

  window.startSceneInit = startSceneInit

  function startSceneStop(){ stopAnims() }
  window.startSceneStop = startSceneStop

  function tryPlayBgmOnFadeIn(){
    if(!screen) return
    const onEnd = (ev)=>{
      if(ev.propertyName !== 'opacity') return
      screen.removeEventListener('transitionend', onEnd)
      try{
        if(bgm){

          bgm.volume = 1.0;
          if(bgm.paused){
            bgm.play().catch(()=>{
              console.log('BGM autoplay blocked; showing overlay')
              showSoundOverlay && showSoundOverlay()
            })
          }
        }
      }catch(e){ console.warn('BGM play error on fadein:', e) }
    }
    screen.addEventListener('transitionend', onEnd)
  }

  let lightTimer = null
  function startLightAnim(){
    if(!lightImg) return
    lightIndex = 0
    lightTimer = setInterval(()=>{
      const seq = [0,1,2,1]
      const i = seq[lightIndex % seq.length]
      lightImg.src = lightFrames[i]
      lightIndex++
    }, frameInterval)
  }

  let duryTimer = null
  function startDuryAnim(){
    if(!duryImg) return
    duryIndex = 0
    duryTimer = setInterval(()=>{
      const seq = [0,1,2,1]
      const i = seq[duryIndex % seq.length]
      duryImg.src = duryFrames[i]
      duryIndex++
    }, frameInterval)
  }

  function stopAnims(){ if(lightTimer) clearInterval(lightTimer); if(duryTimer) clearInterval(duryTimer) }

  function fadeOutThen(callback, duration=400){
    const api = window.transitionAPI
    if(api && api.fadeOutThen){
      return api.fadeOutThen(()=>{ try{ callback() }catch(e){} }, duration)
    }
    if(screen) screen.classList.remove('visible')
    setTimeout(()=>{ try{ callback() }catch(e){} }, duration)
  }

  if(btnBegin){
    btnBegin.addEventListener('click', (e)=>{
      e.preventDefault()
      try{
        if(btnBegin._locked) return; btnBegin._locked = true;
        btnBegin.classList.add('disabled'); btnBegin.setAttribute('aria-disabled','true')
        if(screen) screen.style.pointerEvents = 'none'
        setTimeout(()=>{
          btnBegin._locked = false
          try{ btnBegin.classList.remove('disabled'); btnBegin.removeAttribute('aria-disabled') }catch(e){}
          try{ if(screen) screen.style.pointerEvents = '' }catch(e){}
        }, 2000)
      }catch(e){}
      try{ if(se){ se.currentTime=0; se.play().catch(()=>{}) } }catch(e){}
      fadeOutThen(()=>{ stopAnims(); location.href = 'prologue.html' })
    })
  }

  if(btnExit){
    btnExit.addEventListener('click', (e)=>{
      e.preventDefault()
      try{
        if(btnExit._locked) return; btnExit._locked = true;
        btnExit.classList.add('disabled'); btnExit.setAttribute('aria-disabled','true')
        if(screen) screen.style.pointerEvents = 'none'
        setTimeout(()=>{
          btnExit._locked = false
          try{ btnExit.classList.remove('disabled'); btnExit.removeAttribute('aria-disabled') }catch(e){}
          try{ if(screen) screen.style.pointerEvents = '' }catch(e){}
        }, 2000)
      }catch(e){}
      try{ if(se){ se.currentTime=0; se.play().catch(()=>{}) } }catch(e){}
      alert('ゲームを終了するには画面を閉じて下さい')
    })
  }

  if(btnCredit){
    btnCredit.addEventListener('click', (e)=>{
      e.preventDefault()
      try{
        if(btnCredit._locked) return; btnCredit._locked = true;
        btnCredit.classList.add('disabled'); btnCredit.setAttribute('aria-disabled','true')
        if(screen) screen.style.pointerEvents = 'none'
        setTimeout(()=>{
          btnCredit._locked = false
          try{ btnCredit.classList.remove('disabled'); btnCredit.removeAttribute('aria-disabled') }catch(e){}
          try{ if(screen) screen.style.pointerEvents = '' }catch(e){}
        }, 2000)
      }catch(e){}
      try{ if(se){ se.currentTime=0; se.play().catch(()=>{}) } }catch(e){}
      fadeOutThen(()=>{ stopAnims(); location.href = 'credit.html' })
    })
  }

  window.addEventListener('beforeunload', ()=>{

    stopAnims()
  })

  const soundOverlay = document.getElementById('sound-overlay')
  function showSoundOverlay(){
    if(!soundOverlay) return
    soundOverlay.style.display = 'flex'
    soundOverlay.setAttribute('aria-hidden','false')
    const handler = ()=>{
      try{ if(bgm){ bgm.play().catch(()=>{}) } }catch(e){}
      soundOverlay.style.display = 'none'
      soundOverlay.setAttribute('aria-hidden','true')
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
    window.addEventListener('pointerdown', handler)
    window.addEventListener('keydown', handler)
  }

})();

