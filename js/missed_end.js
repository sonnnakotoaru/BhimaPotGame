/*
  missed_end.js
  - 小学生でも分かる説明:
    ・見落としエンド画面の最小限ロジックをここに書きます。
    ・やることはとても簡単:
      1) BGM を鳴らす
      2) 本文画像を順に表示（「すすむ」ボタンで進む）
      3) 最後にタイトル画像と「はじめにもどる」ボタンを見せる
*/

(function(){
  'use strict'

  // DOM
  const screen = document.getElementById('screen')
  const container = document.querySelector('[data-ui-text-container]')
  const btnNext = document.getElementById('btn-next')
  const btnRestart = document.getElementById('btn-restart')
  const bgm = document.getElementById('bgm')
  const seButton = document.getElementById('se-button')
  const meLight = document.getElementById('me-light')
  const meVessel = document.getElementById('me-vessel')
  const meTitle = document.getElementById('me-title')

  // 表示する本文画像リスト
  const uiImages = [
    'assets/ui_text/missed_end/01.png',
    'assets/ui_text/missed_end/02.png',
    'assets/ui_text/missed_end/03.png'
  ]

  let idx = 0

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

  function playSE(){ try{ if(seButton){ seButton.currentTime = 0; seButton.play().catch(()=>{}) } }catch(e){} }
  function playBgm(){ try{ if(bgm){ bgm.volume = 0.8; bgm.currentTime = 0; bgm.play().catch(()=>{}) } }catch(e){} }

  // 指定インデックスの本文画像を表示する
  function showImage(i){
    if(!container) return
    container.innerHTML = ''
    const img = document.createElement('img')
    img.className = 'ui-text-image hide'
    img.src = uiImages[i] || ''
    img.alt = ''
    img.width = 1280; img.height = 720
    container.appendChild(img)
    // 少し遅延してフェードインクラスを付ける
    setTimeout(()=>{ try{ img.classList.remove('hide'); img.classList.add('show') }catch(e){} }, 30)
  }

  function revealFinal(){
    // 本文を消してタイトルと再スタートボタンを表示
    try{ if(container) container.innerHTML = '' }catch(e){}
    try{
      if(meTitle){ meTitle.classList.remove('hide'); meTitle.classList.add('show') }
      if(btnRestart){ btnRestart.classList.remove('hidden'); btnRestart.classList.add('show'); btnRestart.tabIndex = 0 }
      if(btnNext){ btnNext.classList.add('hidden') }
      // 灯りは少し暗くして雰囲気を出す
      try{ if(meLight) meLight.style.opacity = '0.4' }catch(e){}
    }catch(e){}
  }

  function next(){
    playSE()
    if(idx >= uiImages.length - 1){ revealFinal(); return }
    idx += 1
    showImage(idx)
  }

  function init(){
    // 初期表示: フェードインして BGM を流す
    try{ if(screen) screen.classList.add('visible') }catch(e){}
    playBgm()

    // 最初の本文画像を表示
    idx = 0
    showImage(idx)

    // ボタンイベント
  try{ if(btnNext) { btnNext._missed_handler = ()=>{ if(!lockButtons(600)) return; playSE(); next() }; btnNext.addEventListener('click', btnNext._missed_handler) } }catch(e){}
  try{ if(btnRestart) { btnRestart._missed_handler = ()=>{ if(!lockButtons(800)) return; playSE(); if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else { location.href = 'start.html' } }; btnRestart.addEventListener('click', btnRestart._missed_handler) } }catch(e){}
  }

  try{ init() }catch(e){ console.error(e) }

  // エクスポート（必要なら外部から再初期化できます）
  if(typeof window !== 'undefined'){
    window.missedEndInit = init
  }

})();
