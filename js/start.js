/**
 * start.js
 * - Start シーン専用スクリプト（scene-start.js のコピー）
 */

(function(){
  'use strict'

  // 要素キャッシュ
  const screen = document.getElementById('screen')
  const bgm = document.getElementById('bgm')
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

  const frameInterval = 500
  let lightIndex = 0
  let duryIndex = 0

  window.addEventListener('load', () => {
    if (screen) {
  screen.style.transition = 'opacity 400ms'
      requestAnimationFrame(() => { screen.style.opacity = 1 })
    }

    startLightAnim()
    startDuryAnim()

    tryPlayBgmOnFadeIn()
  })

  function tryPlayBgmOnFadeIn(){
    if(!screen) return
    const onEnd = (ev)=>{
      if(ev.propertyName !== 'opacity') return
      screen.removeEventListener('transitionend', onEnd)
      try{
        if(bgm){ bgm.currentTime = 0; bgm.volume = 1.0; bgm.play().catch(()=>{
          console.log('BGM autoplay blocked; showing overlay')
          showSoundOverlay && showSoundOverlay()
        }) }
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
      try{ if(se){ se.currentTime=0; se.play().catch(()=>{}) } }catch(e){}
      fadeOutThen(()=>{ stopAnims(); location.href = 'prologue.html' })
    })
  }

  if(btnExit){
    btnExit.addEventListener('click', (e)=>{
      e.preventDefault()
      try{ if(se){ se.currentTime=0; se.play().catch(()=>{}) } }catch(e){}
      alert('ゲームを終了するには画面を閉じて下さい')
    })
  }

  if(btnCredit){
    btnCredit.addEventListener('click', (e)=>{
      e.preventDefault()
      try{ if(se){ se.currentTime=0; se.play().catch(()=>{}) } }catch(e){}
      fadeOutThen(()=>{ stopAnims(); location.href = 'credit.html' })
    })
  }

  window.addEventListener('beforeunload', ()=>{
    stopAnims()
    try{ if(bgm){ bgm.pause(); bgm.currentTime=0 } }catch(e){}
  })

  const soundOverlay = document.getElementById('sound-overlay')
  function showSoundOverlay(){
    if(!soundOverlay) return
    soundOverlay.style.display = 'flex'
    soundOverlay.setAttribute('aria-hidden','false')
    const handler = ()=>{
      try{ if(bgm){ bgm.currentTime = 0; bgm.play().catch(()=>{}) } }catch(e){}
      soundOverlay.style.display = 'none'
      soundOverlay.setAttribute('aria-hidden','true')
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
    window.addEventListener('pointerdown', handler)
    window.addEventListener('keydown', handler)
  }

})();
