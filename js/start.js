/*
  start.js
  - 小学生でも分かる説明:
    ・ここは「スタート画面（タイトル）」のためのコードです。
    ・ボタンを押すとプロローグやクレジットへ行きます。音（BGM）を鳴らす仕組みもあります。
    ・やさしい言葉で書いてあるので、コードを見ながら学べます。
*/
/**
 * start.js
 * - ここは「スタート画面（タイトル）」の動きをまとめたファイルです。
 * - 中学生向け: ボタンでゲームをはじめたり、BGM を鳴らしたりする処理があります。
 */

(function(){
  'use strict'

  // 要素キャッシュ
  const screen = document.getElementById('screen')
  // ensure bgm element exists so start.html can run standalone and BGM can be reused by router
  function ensureBgm(){
    let b = document.getElementById('bgm')
    if(!b){
      try{
        b = document.createElement('audio')
        b.id = 'bgm'
        b.src = 'assets/sound/bgm/bgm_start.mp3'
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
    // call the shared init so it runs both on normal load and when router injects
    try{ if(window.startSceneInit) window.startSceneInit() }catch(e){}
  })

  // scene init function: starts animations and sets up fade-in behavior
  function startSceneInit(){
    if (screen) {
      // Use a short temporary class instead of inline transition so CSS vars are not overridden
      try{ screen.classList.add('start-fade') }catch(e){}
      // Remove any inline opacity so the CSS .visible rule can take effect
      try{ screen.style.removeProperty('opacity') }catch(e){}
      // Use the CSS class for fade handling to keep behavior consistent with scene.css
      requestAnimationFrame(() => { screen.classList.add('visible') })
    }

    // restart animations (ensure no duplicate timers by stopping first)
    stopAnims()
    startLightAnim()
    startDuryAnim()

    tryPlayBgmOnFadeIn()
  }

  // expose a known init function so router can call it after injecting scripts
  window.startSceneInit = startSceneInit
  // expose a stop function so router can clear intervals when swapping scenes
  // 注意: ゲーム全体で BGM はページ遷移で停止しない設計です。
  // そのため stop 関数はアニメ等を止めますが BGM を強制停止しません。
  function startSceneStop(){ stopAnims() }
  window.startSceneStop = startSceneStop

  function tryPlayBgmOnFadeIn(){
    if(!screen) return
    const onEnd = (ev)=>{
      if(ev.propertyName !== 'opacity') return
      screen.removeEventListener('transitionend', onEnd)
      try{
        if(bgm){
          // If a root bgm is present and already playing, do nothing.
          // If it's paused, try to play it without resetting currentTime to keep seamless playback.
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
        setTimeout(()=>{ btnBegin._locked = false }, 2000)
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
        setTimeout(()=>{ btnExit._locked = false }, 2000)
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
        setTimeout(()=>{ btnCredit._locked = false }, 2000)
      }catch(e){}
      try{ if(se){ se.currentTime=0; se.play().catch(()=>{}) } }catch(e){}
      fadeOutThen(()=>{ stopAnims(); location.href = 'credit.html' })
    })
  }

  window.addEventListener('beforeunload', ()=>{
    // Do not forcibly pause bgm here. If a SPA/router is used, bgm should persist.
    // ページアンロード時は強制停止しない（router を使って遷移すれば bgm は持続する）。
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
