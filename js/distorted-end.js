(function(){
  'use strict'

  /*
    distorted-end.js
    - 小学生でも分かる説明:
      ・このファイルは「歪んだ終幕」画面の動きを作るよ。
      ・やっていることはかんたんで、写真（画像）を順番に見せて、
        「すすむ」ボタンで次の絵に進めるだけです。
      ・最後まで見たらタイトルが出て、「はじめにもどる」ボタンで
        スタート画面に戻れます。
      ・変数や関数は短くまとめてあるので、読んで学ぶこともできます。
  */

  // UI（本文）で順に表示する画像のリストです。1280x720 の画像を想定しています。
  const uiImages = [
    'assets/ui_text/distortedend/01.png',
    'assets/ui_text/distortedend/02.png',
    'assets/ui_text/distortedend/03.png',
    'assets/ui_text/distortedend/04.png',
    'assets/ui_text/distortedend/05.png'
  ]

  // キャラクター（ドゥリヨダナ）のフレーム画像。順番に切り替えて動きを出します。
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

  // キャラ画像を指定した番号に切り替える。範囲外の番号は端に丸めるよ。
  function setCharStateByIndex(i){
    const frame = duryFrame || document.getElementById('duryodhana-frame')
    try{
      if(frame) frame.src = duryFrames[Math.max(0, Math.min(i, duryFrames.length-1))]
    }catch(e){}
  }

  // キャラ画像を自動でくるくる切り替える。ゲームに動きをつける役目。
  function cycleCharImages(){
    if(duryTimer) clearInterval(duryTimer)
    const seq = [0,1,2,1] // 0->1->2->1 の順でループ
    let i = 0
    duryTimer = setInterval(()=>{ setCharStateByIndex(seq[i % seq.length]); i++ }, 500)
  }

  // キャラの自動切り替えを止める
  function stopCycleCharImages(){ if(duryTimer){ clearInterval(duryTimer); duryTimer = null } }

  // BGM を再生しようとする（ブラウザが許可しない場合は失敗しても大丈夫）
  function tryPlayBgm(){ if(!bgm) return; bgm.volume = 0.8; bgm.play().catch(()=>{}) }

  // ボタン音（効果音）を鳴らす
  function playSE(){ const se = document.getElementById('se-button'); if(!se) return; try{ se.currentTime = 0; se.play().catch(()=>{}) }catch(e){} }

  // 本文（UI画像）を画面に出す。プロローグと同じ要領で [data-ui-text-container] に挿入します。
  function showImage(i){
    // image-only mode: insert into container if it exists, otherwise skip
    container = container || document.querySelector('[data-ui-text-container]')
    if(!container) return
    // 追加する画像のパス
    const targetSrc = uiImages[i]
    const titleEl = document.getElementById('distorted-title')

    // もしタイトル要素が同じ画像を指しているなら、コンテナに同じ画像を入れず
    // タイトル要素だけを表示する（重複表示を避けるため）
    const sameAsTitle = titleEl && typeof titleEl.src === 'string' && titleEl.src.split('/').pop() === targetSrc.split('/').pop()

    // まずコンテナをクリア
    container.innerHTML = ''
    if(sameAsTitle){
      // タイトル要素を表示に戻す（JS が代わりに表示する）
      try{ titleEl.classList.remove('hide'); titleEl.classList.add('show') }catch(e){}
      return
    }

  // タイトルが見えている場合は非表示に戻す（本文画像を優先して表示するため）
  try{ if(titleEl){ titleEl.classList.remove('show'); titleEl.classList.add('hide') } }catch(e){}

    const img = document.createElement('img')
    img.className = 'ui-text-image hide' // 初期は hide（透明）にしておく
    img.src = targetSrc
    img.alt = ''
    img.width = 1280; img.height = 720
    img.style.display = 'block'
    img.style.margin = '0 auto'
    container.appendChild(img)

    // 少し遅らせて .show を付けることで CSS の transition が効くようにする
    setTimeout(()=>{
      try{ img.classList.remove('hide'); img.classList.add('show') }catch(e){}
    }, 30)
  }

  // 最後の画面を見せる準備。
  // タイトルを出し、再スタートボタンを表示、すすむボタンは隠します。
  function revealFinalUI(){
    const title = document.getElementById('distorted-title')
    if(title){ title.classList.remove('hide'); title.classList.add('show') }
    if(btnRestart){ btnRestart.classList.remove('hidden'); btnRestart.style.display = ''; btnRestart.classList.add('show'); btnRestart.tabIndex = 0 }
    if(btnNext) btnNext.classList.add('hidden')
    if(duryFrame) duryFrame.classList.add('show')
  }

  // 「すすむ」ボタンが押されたときの処理。
  // 最後の画像なら最終UIを出し、そうでなければ次の画像を表示します。
  function next(){
    // すでに最後の画像のときは最終 UI を表示して戻る
    if(idx >= uiImages.length - 1){ playSE(); revealFinalUI(); return }

    // まだ最後でなければ次に進める
    idx += 1
    showImage(idx)
    playSE()

    // 次に表示した画像が最終画像なら、ここで最終 UI を出す
    if(idx >= uiImages.length - 1){ revealFinalUI() }
  }

  // 初期化: ボタンやオーディオ、キャラの初期状態をセットアップします。
  function init(){
    // container may not exist in image-only mode; we avoid referencing it unless needed
    btnNext = document.getElementById('btn-next')
    btnRestart = document.getElementById('btn-restart')
    bgm = document.getElementById('bgm')
    duryFrame = document.getElementById('duryodhana-frame')

  // 最初は再スタートボタンやタイトルを隠しておきます
  if(btnRestart){ btnRestart.classList.add('hidden'); btnRestart.style.display = 'none'; btnRestart.tabIndex = -1 }
  const title = document.getElementById('distorted-title'); if(title){ title.classList.add('hide'); }

    // キャラの自動切り替え開始と、BGM 再生の試み
    setCharStateByIndex(0)
    cycleCharImages()
    tryPlayBgm()

    // 最初の本文画像を出す（index=0）
    idx = 0
    showImage(idx)

    // ボタンにクリックイベントをつけます。ハンドラはあとで外すために保存します。
  if(btnNext){ btnNext._dist_handler = ()=>{ if(!lockButtons(800)) return; try{ btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true'); setTimeout(()=>{ try{ btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') }catch(e){} }, 800) }catch(e){} ; tryPlayBgm(); next() }; btnNext.addEventListener('click', btnNext._dist_handler) }
  if(btnRestart){ btnRestart._dist_handler = ()=>{ if(!lockButtons(1000)) return; try{ btnRestart.classList.add('disabled'); btnRestart.setAttribute('aria-disabled','true') }catch(e){}; if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else {
        // フォールバック: 画面全体をフェードアウトしてから遷移
        try{ const screen = document.getElementById('screen'); if(screen) screen.classList.remove('visible') }catch(e){}
        try{
          const v = (getComputedStyle(document.documentElement).getPropertyValue('--transition-duration')||'').trim() || '400ms'
          const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
          setTimeout(()=>{ location.href = 'start.html' }, toMs(v))
        }catch(e){ setTimeout(()=>{ location.href = 'start.html' }, 400) }
      } }; btnRestart.addEventListener('click', btnRestart._dist_handler) }

    // 画面全体をふわっと表示
    const screen = document.getElementById('screen'); if(screen) screen.classList.add('visible')
  }

  try{ init() }catch(e){ console.error(e) }

  // expose lifecycle hooks
  if(typeof window !== 'undefined'){
    window.distortedEndInit = init
    window.distortedEndStop = function(){
      stopCycleCharImages()
      if(bgm && !bgm.paused){ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} }
      if(btnNext && btnNext._dist_handler) btnNext.removeEventListener('click', btnNext._dist_handler)
      if(btnRestart && btnRestart._dist_handler) btnRestart.removeEventListener('click', btnRestart._dist_handler)
      // hide UI
      const title = document.getElementById('distorted-title'); if(title) title.classList.remove('show')
      if(btnRestart) btnRestart.classList.remove('show')
      if(container) container.innerHTML = ''
    }
  }

})();
