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

  // 指定インデックスの本文画像を表示する（前の画像はフェードアウトしてから入れ替え）
  function showImage(i){
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
    }
    if(prev){
      try{
        // フェードアウト時間（CSS変数）を読み取り
        const cs = getComputedStyle(document.documentElement)
        const v = (cs.getPropertyValue('--me-body-fade-out')||'').trim() || '400ms'
        const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
        const waitMs = toMs(v)
        // hide で不透明度を 0 にして、終わったら入れ替え
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
    // まず直前の本文画像があればフェードアウトしてからタイトル表示
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
    playSE()
    if(idx >= uiImages.length - 1){ revealFinal(); return }
    idx += 1
    showImage(idx)
  }

  function init(){
    // 初期表示: フェードインして BGM を流す
    try{ if(screen) requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20)) }catch(e){}
    playBgm()

    // 最初の本文画像を表示
    idx = 0
    showImage(idx)

    // ボタンイベント
  try{ if(btnNext) { btnNext._missed_handler = ()=>{ if(!lockButtons(800)) return; try{ btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true'); setTimeout(()=>{ try{ btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') }catch(e){} }, 800) }catch(e){} ; playSE(); next() }; btnNext.addEventListener('click', btnNext._missed_handler) } }catch(e){}
  try{ if(btnRestart) { btnRestart._missed_handler = ()=>{ if(!lockButtons(1000)) return; try{ btnRestart.classList.add('disabled'); btnRestart.setAttribute('aria-disabled','true') }catch(e){} ; playSE(); if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else { try{ if(screen) screen.classList.remove('visible') }catch(e){} ;
        // ルートの --transition-duration を待ってから遷移
        try{
          const v = getComputedStyle(document.documentElement).getPropertyValue('--transition-duration').trim() || '400ms'
          const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
          setTimeout(()=>{ location.href = 'start.html' }, toMs(v))
        }catch(e){ setTimeout(()=>{ location.href = 'start.html' }, 400) }
      } }; btnRestart.addEventListener('click', btnRestart._missed_handler) } }catch(e){}
  }

  try{ init() }catch(e){ console.error(e) }

  // エクスポート（必要なら外部から再初期化できます）
  if(typeof window !== 'undefined'){
    window.missedEndInit = init
  }

})();
