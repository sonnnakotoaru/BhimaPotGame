/*
  broken_vessel_end.js
  - 小学生でも分かる説明:
    ・このファイルは「砕けた器エンド」画面の最小の動きを作るよ。
    ・やることは3つだけ:
      1) 灯りを徐々に弱める（opacity を下げる）
      2) 本文画像を順に表示する（ボタンで進む）
      3) 最後にタイトルと「はじめにもどる」ボタンを表示する
*/

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
  // CSS の :root に定義されたフェード時間を JS から参照するための値（ms）
  let bodyFadeInMs = 600
  let bodyFadeOutMs = 400
  let transitionDurationMs = 400

  // 灯りを徐々に暗くしていく（duration は CSS 変数で制御）
  function fadeOutLight(){
    light = light || document.getElementById('bv-light')
    if(!light) return
    // CSS トランジションに任せる。ここではクラスだけ切り替える。
    light.classList.add('dim')
    // 追加: すぐに opacity を 0 にする（CSS で transition される）
    setTimeout(()=>{ try{ light.style.opacity = 0 }catch(e){} }, 20)
  }

  function playSE(){ const se = document.getElementById('se-button'); if(!se) return; try{ se.currentTime = 0; se.play().catch(()=>{}) }catch(e){} }
  function tryPlayBgm(){ if(!bgm) return; bgm.volume = 0.8; bgm.play().catch(()=>{}) }

  // ルート変数を読み、'600ms' のような値をミリ秒数に変換して返す
  function readRootMs(varName, fallbackMs){
    try{
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      if(!v) return fallbackMs
      // 値が '600ms' や '0.6s' の場合に対応
      if(v.endsWith('ms')) return parseFloat(v)
      if(v.endsWith('s')) return parseFloat(v) * 1000
      // 数字だけならミリ秒とみなす
      const n = parseFloat(v)
      return Number.isFinite(n) ? n : fallbackMs
    }catch(e){ return fallbackMs }
  }

  // 指定した本文画像インデックスに対応する灯りの不透明度を返す。
  // 線形に 1 -> 0 へ移行する。画像が N 枚なら index 0 = 1, index N-1 = 0.
  function computeLightOpacityForIndex(i){
    try{
      const n = uiImages.length
      if(n <= 1) return 0
      const t = i / (n - 1)
      // clamp
      const v = 1 - t
      return Math.max(0, Math.min(1, Number(v)))
    }catch(e){ return 0 }
  }

  // simple button-lock helper to avoid double-activation from rapid clicks
  function lockButtons(ms){
    try{
      const t = typeof ms === 'number' ? ms : 600
      if(lockButtons._locked) return false
      lockButtons._locked = true
      setTimeout(()=>{ lockButtons._locked = false }, t)
      return true
    }catch(e){ return true }
  }

  // 本文画像を表示する。distorted のパターンに合わせる。
  function showImage(i){
    container = container || document.querySelector('[data-ui-text-container]')
    if(!container) return
    container.innerHTML = ''
    const img = document.createElement('img')
    img.className = 'ui-text-image hide'
    img.src = uiImages[i]
    img.alt = ''
    img.width = 1280; img.height = 720
    container.appendChild(img)
    // 少し遅らせてクラスを切り替えることで CSS トランジションを発火させる
    setTimeout(()=>{ try{ img.classList.remove('hide'); img.classList.add('show') }catch(e){} }, 30)

    // 各本文画像の表示に合わせて灯りを段階的に暗くする
    try{
      light = light || document.getElementById('bv-light')
      if(light){
        const target = computeLightOpacityForIndex(i)
        // CSS の transition を利用して自然にフェードさせる
        // 少し遅らせて（画像の show 発火後） opacity を設定する
        setTimeout(()=>{ try{ light.style.opacity = String(target) }catch(e){} }, 60)
      }
    }catch(e){}
  }

  function revealFinalUI(){
    // 本文画像のフェードアウトが CSS で終わるのを待ってからタイトルを出す
    container = container || document.querySelector('[data-ui-text-container]')
    const doShowTitle = ()=>{
      // remove any remaining body image so the title is not covered
      try{ if(container) container.innerHTML = '' }catch(e){}

      const title = document.getElementById('bv-title')
      if(title){
        try{
          const scene = document.querySelector('.scene-layer')
          if(scene && scene.contains(title) === false) scene.appendChild(title)
          title.style.display = 'block'
          // small delay then toggle classes to trigger CSS transition
          setTimeout(()=>{ try{ title.classList.remove('hide'); title.classList.add('show') }catch(e){} }, 16)
        }catch(e){}
      }

      if(btnRestart){ btnRestart.classList.remove('hidden'); btnRestart.classList.add('show'); btnRestart.tabIndex = 0 }
      if(btnNext) btnNext.classList.add('hidden')

      // also ensure the light is fully dimmed when final UI shows
      try{ if(light){ light.style.opacity = 0 } }catch(e){}
    }

    // 読み直して最新の CSS 設定を使う（ms）
    const waitMs = readRootMs('--bv-body-fade-out', bodyFadeOutMs)
    // 少し余裕を見て待つ（CSS のトランジション完了後に実行）
    setTimeout(doShowTitle, waitMs + 20)
  }

  function next(){
    // If we're already at the last body image, pressing next now should reveal final UI
    if(idx >= uiImages.length - 1){ playSE(); revealFinalUI(); return }

    // Otherwise, advance to the next body image
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

  // CSS の :root で定義されたフェード時間を読み取り、JS の待ち時間に反映する
  bodyFadeInMs = readRootMs('--bv-body-fade-in', bodyFadeInMs)
  bodyFadeOutMs = readRootMs('--bv-body-fade-out', bodyFadeOutMs)
  transitionDurationMs = readRootMs('--transition-duration', transitionDurationMs)

  // 灯りのフェードは本文画像の表示に合わせて開始する。
  // ここでは init で直接開始せず、showImage(0) が呼ばれたときに開始するようにする。
    tryPlayBgm()

    idx = 0
    showImage(idx)

  if(btnNext){ btnNext._bve_handler = ()=>{ if(!lockButtons(800)) return; try{ btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true'); setTimeout(()=>{ try{ btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') }catch(e){} }, 800) }catch(e){}; playSE(); next() }; btnNext.addEventListener('click', btnNext._bve_handler) }
  if(btnRestart){ btnRestart._bve_handler = ()=>{ if(!lockButtons(1000)) return; try{ btnRestart.classList.add('disabled'); btnRestart.setAttribute('aria-disabled','true') }catch(e){}; if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else {
        // フォールバック: 画面フェードアウト後に遷移
        try{ const screen = document.getElementById('screen'); if(screen) screen.classList.remove('visible') }catch(e){}
        try{
          const v = (getComputedStyle(document.documentElement).getPropertyValue('--transition-duration')||'').trim() || '400ms'
          const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
          setTimeout(()=>{ location.href = 'start.html' }, toMs(v))
        }catch(e){ setTimeout(()=>{ location.href = 'start.html' }, 400) }
      } }; btnRestart.addEventListener('click', btnRestart._bve_handler) }

    const screen = document.getElementById('screen'); if(screen) screen.classList.add('visible')
  }

  try{ init() }catch(e){ console.error(e) }

  if(typeof window !== 'undefined'){
    window.brokenVesselInit = init
    window.brokenVesselStop = function(){ if(bgm && !bgm.paused){ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} } if(btnNext && btnNext._bve_handler) btnNext.removeEventListener('click', btnNext._bve_handler); if(btnRestart && btnRestart._bve_handler) btnRestart.removeEventListener('click', btnRestart._bve_handler); const containerEl = document.querySelector('[data-ui-text-container]'); if(containerEl) containerEl.innerHTML = '' }
  }

})();
