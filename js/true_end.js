/*
  true_end.js
  - 小学生でも分かる説明:
    ・このファイルは「約束のエンド」画面の最小の動きを作ります。
    ・やることはこれだけ:
      1) BGM を再生する
      2) ドゥリョダナの 1->2->3->2->1 の切り替えを本文送り時に1回実行する
      3) 本文画像を順に表示して、最後にタイトルと「はじめにもどる」を表示する

  ※ 余計な複雑さは避けています。追加の演出が必要なら拡張可能です。
*/

(function(){
  'use strict'

  // 本文画像リスト (順番に表示)
  const uiImages = [
    'assets/ui_text/trueend/01.png',
    'assets/ui_text/trueend/02.png',
    'assets/ui_text/trueend/03.png',
    'assets/ui_text/trueend/04.png',
    'assets/ui_text/trueend/05.png',
    'assets/ui_text/trueend/06.png',
    'assets/ui_text/trueend/07.png',
    'assets/ui_text/trueend/08.png'
  ]

  // 画面要素をキャッシュする変数
  let idx = 0
  let container = null
  let btnNext = null
  let btnRestart = null
  let bgm = null
  let seBtn = null
  // ドゥリョダナ各パーツ
  let bodyTop = null, bodyMid = null, bodyBottom = null, teWrapper = null
  // 前髪パーツ（上・中・下）を同期して切り替える
  let hairTop = null, hairMid = null, hairBottom = null
  let eyeElem = null
  // 目の瞬き用タイマー
  let eyeNextTimer = null
  let eyeAnimating = false
  // 連打防止フラグ（true の間は全ボタンを受け付けない）
  let _lockedButtons = false
  // 口のアニメ用タイマー
  let mouthElem = null
  let mouthNextTimer = null
  let mouthAnimating = false
  // 06 を表示したら以降キャラクターを非表示にするフラグ
  let teHiddenFromSix = false

  // CSS の :root に書かれた時間を読み取る小さなヘルパー (例: '600ms' -> 600)
  function readRootMs(varName, fallbackMs){
    try{
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      if(!v) return fallbackMs
      if(v.endsWith('ms')) return parseFloat(v)
      if(v.endsWith('s')) return parseFloat(v) * 1000
      const n = parseFloat(v); return Number.isFinite(n) ? n : fallbackMs
    }catch(e){ return fallbackMs }
  }

  // audio フェード用ヘルパー: audio.volume を現在値から targetVolume へ durationMs ミリ秒で線形補間
  // Promise を返す（完了時に resolve）。中断や既に目標値の場合はすぐに resolve。
  function fadeAudio(audioEl, targetVolume, durationMs){
    return new Promise((resolve)=>{
      try{
        if(!audioEl) return resolve()
        const start = Math.max(0, Math.min(1, audioEl.volume || 0))
        const end = Math.max(0, Math.min(1, targetVolume))
        if(durationMs <= 0 || start === end){ audioEl.volume = end; return resolve() }
        const startTime = Date.now()
        const delta = end - start
        const stepMs = 50
        const t = setInterval(()=>{
          try{
            const elapsed = Date.now() - startTime
            const p = Math.min(1, elapsed / durationMs)
            audioEl.volume = Math.max(0, Math.min(1, start + delta * p))
            if(p >= 1){ clearInterval(t); return resolve() }
          }catch(e){ clearInterval(t); return resolve() }
        }, stepMs)
      }catch(e){ return resolve() }
    })
  }

  // ドゥリョダナの 3 枚画像を常時ループさせる（1->2->3->2->1 -> 繰り返し）
  // 小学生向け説明: ページが表示されている間ずっと目で見えるように切り替えを回します。
  let duryTimer = null
  function startDuryLoop(intervalMs){
    try{
      stopDuryLoop()
      const seq = [0,1,2,1]
      const parts = [bodyTop, bodyMid, bodyBottom]
      const hairParts = [hairTop, hairMid, hairBottom]
  const interval = typeof intervalMs === 'number' ? Math.max(80, intervalMs) : 600
      // 初期状態: 全て非表示
      parts.forEach(p=>{ if(p) p.style.opacity = '0' })
      hairParts.forEach(h=>{ if(h) h.style.opacity = '0' })
      let idxSeq = 0
      // すぐに1フレーム目を表示してからループ開始
      if(parts[seq[0]]) parts[seq[0]].style.opacity = '1'
      if(hairParts[seq[0]]) hairParts[seq[0]].style.opacity = '1'
      duryTimer = setInterval(()=>{
        try{
          idxSeq = (idxSeq + 1) % seq.length
          const f = seq[idxSeq]
          parts.forEach((p,pi)=>{ if(p) p.style.opacity = (pi === f ? '1' : '0') })
          hairParts.forEach((h,hi)=>{ if(h) h.style.opacity = (hi === f ? '1' : '0') })
        }catch(e){}
      }, interval)
    }catch(e){}
  }
  function stopDuryLoop(){ try{ if(duryTimer){ clearInterval(duryTimer); duryTimer = null } }catch(e){}
  }

  // 目を瞬きさせる小さなループ
  // ランダムなインターバルで blinkOnce を呼び、自然な瞬きを目指します。
  function blinkOnce(){
    try{
      if(!eyeElem || eyeAnimating) return
      eyeAnimating = true
      const frames = [
        'assets/character/TRUE/10_duryodhana_true_eye_closed.png',
        'assets/character/TRUE/09_duryodhana_true_eye_half.png',
        'assets/character/TRUE/08_duryodhana_true_eye_open_narrow.png',
        'assets/character/TRUE/07_duryodhana_true_eye_open_clear.png',
        'assets/character/TRUE/08_duryodhana_true_eye_open_narrow.png',
        'assets/character/TRUE/09_duryodhana_true_eye_half.png',
        'assets/character/TRUE/10_duryodhana_true_eye_closed.png'
      ]
  const interval = 160 // フレーム間のミリ秒（大きくしてゆっくり目の瞬きにする）
      const prev = eyeElem.src || ''
      frames.forEach((src, i)=>{
        setTimeout(()=>{ try{ eyeElem.src = src }catch(e){} }, i * interval)
      })
      // 終了後に元の画像へ戻す
      setTimeout(()=>{ try{ eyeElem.src = prev }catch(e){} ; eyeAnimating = false }, frames.length * interval + 20)
    }catch(e){ eyeAnimating = false }
  }

  function scheduleNextBlink(minDelay, maxDelay){
    try{
      if(eyeNextTimer) { clearTimeout(eyeNextTimer); eyeNextTimer = null }
      // デフォルトはよりゆっくり(3s..7s)
      const minD = typeof minDelay === 'number' ? minDelay : 3000
      const maxD = typeof maxDelay === 'number' ? maxDelay : 7000
      const delay = Math.floor(Math.random() * (maxD - minD + 1)) + minD
      eyeNextTimer = setTimeout(()=>{ try{ blinkOnce(); scheduleNextBlink(minDelay, maxDelay) }catch(e){} }, delay)
    }catch(e){}
  }

  function startEyeLoop(minDelay, maxDelay){
    try{
      stopEyeLoop()
      eyeElem = document.getElementById('te-eye')
      if(!eyeElem) return
      // ensure initial eye image is the clear-open one
      try{ eyeElem.src = eyeElem.src || 'assets/character/TRUE/07_duryodhana_true_eye_open_clear.png' }catch(e){}
      scheduleNextBlink(minDelay, maxDelay)
    }catch(e){}
  }

  function stopEyeLoop(){ try{ if(eyeNextTimer){ clearTimeout(eyeNextTimer); eyeNextTimer = null } ; eyeAnimating = false }catch(e){}
  }

  // 口を軽く動かすアニメ（閉->開->閉）
  function mouthOnce(){
    try{
      if(!mouthElem || mouthAnimating) return
      mouthAnimating = true
      const frames = [
        'assets/character/TRUE/12_duryodhana_true_mouth_closed_smile.png',
        'assets/character/TRUE/11_duryodhana_true_mouth_open_smile.png',
        'assets/character/TRUE/12_duryodhana_true_mouth_closed_smile.png'
      ]
      const interval = 180
      const prev = mouthElem.src || ''
      frames.forEach((src, i)=>{
        setTimeout(()=>{ try{ mouthElem.src = src }catch(e){} }, i * interval)
      })
      setTimeout(()=>{ try{ mouthElem.src = prev }catch(e){} ; mouthAnimating = false }, frames.length * interval + 20)
    }catch(e){ mouthAnimating = false }
  }

  // 小さな発話バースト: 短い間隔で口を何度か開閉して「よく喋る」感じを出す
  function mouthBurst(repeats){
    try{
      if(!mouthElem || mouthAnimating) return
      mouthAnimating = true
      const open = 'assets/character/TRUE/11_duryodhana_true_mouth_open_smile.png'
      const closed = 'assets/character/TRUE/12_duryodhana_true_mouth_closed_smile.png'
      const interval = 100 // 速めにパチパチさせる
      const prev = mouthElem.src || closed
      for(let i=0;i<repeats;i++){
        setTimeout(()=>{ try{ mouthElem.src = open }catch(e){} }, i * interval * 2)
        setTimeout(()=>{ try{ mouthElem.src = closed }catch(e){} }, i * interval * 2 + interval)
      }
      setTimeout(()=>{ try{ mouthElem.src = prev }catch(e){} ; mouthAnimating = false }, repeats * interval * 2 + 20)
    }catch(e){ mouthAnimating = false }
  }

  function scheduleNextMouth(minDelay, maxDelay){
    try{
      if(mouthNextTimer){ clearTimeout(mouthNextTimer); mouthNextTimer = null }
      // よく喋る感じ: デフォルトは短めの間隔（0.6s〜1.2s）
      const minD = typeof minDelay === 'number' ? minDelay : 600
      const maxD = typeof maxDelay === 'number' ? maxDelay : 1200
      const delay = Math.floor(Math.random() * (maxD - minD + 1)) + minD
      mouthNextTimer = setTimeout(()=>{
        try{
          // ランダムで短い発話バーストにする確率を高めに設定
          const burstProb = 0.6
          if(Math.random() < burstProb){
            const repeats = 3 + Math.floor(Math.random() * 5) // 3..7 回の小さな連続動作
            mouthBurst(repeats)
          } else {
            mouthOnce()
          }
          scheduleNextMouth(minDelay, maxDelay)
        }catch(e){}
      }, delay)
    }catch(e){}
  }

  function startMouthLoop(minDelay, maxDelay){
    try{
      stopMouthLoop()
      mouthElem = document.getElementById('te-mouth')
      if(!mouthElem) return
      scheduleNextMouth(minDelay, maxDelay)
    }catch(e){}
  }

  // ボタンを短時間ロックするユーティリティ
  function lockButtons(ms){
    try{
      if(_lockedButtons) return
      _lockedButtons = true
      // 視覚的に入力を遮断する（img ボタンのため pointer-events を制御）
      try{ if(btnNext) { btnNext.style.pointerEvents = 'none'; btnNext.tabIndex = -1; btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true') } }catch(e){}
      try{ if(btnRestart) { btnRestart.style.pointerEvents = 'none'; btnRestart.tabIndex = -1; btnRestart.classList.add('disabled'); btnRestart.setAttribute('aria-disabled','true') } }catch(e){}
      const t = typeof ms === 'number' ? ms : 600
      setTimeout(()=>{
        try{ _lockedButtons = false }catch(e){}
        try{ if(btnNext) { btnNext.style.pointerEvents = 'auto'; btnNext.tabIndex = 0; btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') } }catch(e){}
        try{ if(btnRestart) { btnRestart.style.pointerEvents = 'auto'; btnRestart.tabIndex = -1; btnRestart.classList.remove('disabled'); btnRestart.removeAttribute('aria-disabled') } }catch(e){}
      }, t)
    }catch(e){}
  }

  function stopMouthLoop(){ try{ if(mouthNextTimer){ clearTimeout(mouthNextTimer); mouthNextTimer = null } ; mouthAnimating = false }catch(e){}
  }

  // 本文画像を表示する: i 番目の画像をフェードインさせる
  function showImage(i){
    container = container || document.querySelector('[data-ui-text-container]')
    if(!container) return
    // フェードアウト中の既存画像があればそれをフェードアウトしてから入れ替える
    const prev = container.querySelector('.ui-text-image')
    const doReplace = ()=>{
      const img = document.createElement('img')
      img.className = 'ui-text-image hide'
      img.src = uiImages[i]
      img.alt = ''
      img.width = 1280; img.height = 720
      container.appendChild(img)
      // 少し遅らせて show クラスを付けることで CSS トランジションを発火させる
      setTimeout(()=>{ try{ img.classList.remove('hide'); img.classList.add('show') }catch(e){} }, 30)
    }

    if(prev){
      try{
        // トランジション終了を待つ。fallback は CSS の --te-body-fade-out
        const waitMs = readRootMs('--te-body-fade-out', 400)
        // start hide
        try{ prev.classList.remove('show'); prev.classList.add('hide') }catch(e){}
        // remove after transition
        const remover = ()=>{ try{ if(prev && prev.parentElement) prev.parentElement.removeChild(prev) }catch(e){} }
        let fired = false
        const onEnd = (ev)=>{
          if(ev && ev.propertyName && ev.propertyName.indexOf('opacity') === -1) return
          if(fired) return; fired = true
          try{ prev.removeEventListener('transitionend', onEnd) }catch(e){}
          remover(); doReplace()
        }
        try{ prev.addEventListener('transitionend', onEnd) }catch(e){}
        // safety fallback
        setTimeout(()=>{ if(!fired){ try{ prev.removeEventListener && prev.removeEventListener('transitionend', onEnd) }catch(e){} ; remover(); doReplace() } }, waitMs + 80)
      }catch(e){
        try{ container.innerHTML = '' }catch(e){}
        doReplace()
      }
    } else {
      // no previous image - just insert
      try{ container.innerHTML = '' }catch(e){}
      doReplace()
    }

    // テキストの進行に合わせてドゥリョダナ全体の透明度を変える
    try{
      teWrapper = teWrapper || document.getElementById('te-character')
      if(teWrapper){
        // 特別扱い: assets/ui_text/trueend/06.png が表示される直前は
        // ドゥリョダナを完全に消しておきたい（opacity=0）。
        const special = 'assets/ui_text/trueend/06.png'
        if(uiImages[i] === special){
          try{ teWrapper.style.opacity = '0' }catch(e){}
          // 次のテキスト以降は再表示しないようにフラグを立てる
          teHiddenFromSix = true
        } else {
          // 既に 06 が出た後なら以降は非表示を維持する
          if(teHiddenFromSix){
            // do nothing (keep hidden)
          } else {
          const n = uiImages.length
          const t = (n <= 1) ? 1 : (1 - (i / (n - 1)))
          // CSS の transition を効かせるために直接 style.opacity を設定
          setTimeout(()=>{ try{ teWrapper.style.opacity = String(t) }catch(e){} }, 60)
          }
        }
      }
    }catch(e){}

    // ドゥリョダナは常時ループで切り替えているのでここでは何もしない
    try{ /* no-op: continuous dury loop runs in init() */ }catch(e){}

    // 最後の本文画像（最後のテキスト）表示時はタイトル画像のみを表示したい。
    // そのため、最終テキスト時はドゥリーヨダナ（te-character）を確実に非表示にしておく。
    try{
      const lastIndex = uiImages.length - 1
      if(i === lastIndex){
        try{
          // 最終表示ではキャラクターを表示しない（06 以降の非表示フラグも維持）
          teHiddenFromSix = true
          if(teWrapper){
            try{ teWrapper.style.opacity = '0' }catch(e){}
            try{ teWrapper.style.transform = '' }catch(e){}
          }
        }catch(e){}
      } else {
        // 非最終テキスト時は、まだ非表示フラグが立っていなければ通常挙動を維持
        try{
          if(!teHiddenFromSix && teWrapper){ try{ teWrapper.style.transform = '' }catch(e){} }
        }catch(e){}
      }
    }catch(e){}
  }

  // 最後のタイトルとリスタートボタンを出す
  function revealFinalUI(){
    container = container || document.querySelector('[data-ui-text-container]')
    const doShow = ()=>{
      try{ if(container) container.innerHTML = '' }catch(e){}
      const title = document.getElementById('te-title')
      if(title){ title.style.display = 'block'; setTimeout(()=>{ try{ title.classList.remove('hide'); title.classList.add('show') }catch(e){} }, 16) }
      if(btnRestart){ btnRestart.classList.remove('hidden'); btnRestart.classList.add('show'); btnRestart.tabIndex = 0 }
      if(btnNext) btnNext.classList.add('hidden')
      // タイトル表示時はドゥリーヨダナを2倍で表示してキャンバスにトリミングする
      // （以前はキャラクターを完全に消していましたが、ここでは拡大表示します）
      try{
        if(teWrapper){
          // 強制的に表示させる（06 による非表示フラグが立っていても上書き）
          // まずは完全に透明にしてからクラス適用→遅いアニメでフェードインさせる。
          try{ teWrapper.style.opacity = '0' }catch(e){}
          // 最終タイトル表示時は口を閉じた状態に固定する
          try{ stopMouthLoop() }catch(e){}
          try{ mouthElem = mouthElem || document.getElementById('te-mouth') }catch(e){}
          try{ if(mouthElem) mouthElem.src = 'assets/character/TRUE/12_duryodhana_true_mouth_closed_smile.png' }catch(e){}
          // まずクラスで拡大状態を即時適用し、フェード時には transform を変化させず
          // opacity のみをトランジションさせることで「拡大された状態でフェードイン」させる。
          try{
            const fadeMs = readRootMs('--te-body-fade-in', 600)
            // transform をトランジション対象に含めない（opacity のみ）
            teWrapper.style.transition = `opacity ${fadeMs}ms ease`
          }catch(e){}
          try{ teWrapper.classList.add('title-scale') }catch(e){}
          // dury の速度を遅くする（拡大後でも問題ない）
          try{
            const slowMs = readRootMs('--te-title-dury-interval', 300)
            try{ startDuryLoop(slowMs) }catch(e){}
          }catch(e){}
          // force reflow so the transform from .title-scale is applied immediately
          try{ void teWrapper.offsetWidth }catch(e){}
          // 少し遅らせて opacity を 1 にすることでフェードインを発火させる
          setTimeout(()=>{ try{ teWrapper.style.opacity = '1' }catch(e){} }, 30)
        }
      }catch(e){}
    }
    const waitMs = readRootMs('--te-body-fade-out', 400)
    setTimeout(doShow, waitMs + 20)
  }

  function playSE(){ if(!seBtn) return; try{ seBtn.currentTime = 0; seBtn.play().catch(()=>{}) }catch(e){} }

  function next(){
    // 最後の画像なら最終 UI を表示
    if(idx >= uiImages.length - 1){ playSE(); revealFinalUI(); return }
    idx += 1
    showImage(idx)
    playSE()
  }

  function init(){
    btnNext = document.getElementById('btn-next')
    btnRestart = document.getElementById('btn-restart')
    bgm = document.getElementById('bgm')
    seBtn = document.getElementById('se-button')
    teWrapper = document.getElementById('te-character')
    bodyTop = document.getElementById('te-body-top')
    bodyMid = document.getElementById('te-body-mid')
    bodyBottom = document.getElementById('te-body-bottom')
  // 前髪パーツを取得
  hairTop = document.getElementById('te-hair-top')
  hairMid = document.getElementById('te-hair-mid')
  hairBottom = document.getElementById('te-hair-bottom')

    if(btnRestart){ btnRestart.classList.add('hidden'); btnRestart.tabIndex = -1 }
    const title = document.getElementById('te-title'); if(title){ title.classList.add('hide') }

    // BGM をフェードインで再生。
    try{
      if(bgm){
        // 目標音量は 0.8（従来の扱い）
        const targetVol = 0.8
        bgm.currentTime = 0
        // まずは音量を 0 にして再生を試み、成功したらフェードイン
        try{ bgm.volume = 0 }catch(e){}
        const p = bgm.play()
        const fadeInMs = readRootMs('--te-bgm-fade-in', 800)
        if(p && p.then){
          p.then(()=>{
            try{ fadeAudio(bgm, targetVol, fadeInMs).catch(()=>{}) }catch(e){}
          }).catch(()=>{
            // Autoplay が拒否された場合はフォールバック UI を出す。
            try{
              if(document.getElementById('audio-unlock')) return
              const o = document.createElement('div')
              o.id = 'audio-unlock'
              o.style.position = 'fixed'
              o.style.left = '0'
              o.style.top = '0'
              o.style.right = '0'
              o.style.bottom = '0'
              o.style.display = 'flex'
              o.style.alignItems = 'center'
              o.style.justifyContent = 'center'
              o.style.background = 'rgba(0,0,0,0.5)'
              o.style.zIndex = '99999'
              const btn = document.createElement('button')
              btn.textContent = '音を再生する'
              btn.style.fontSize = '20px'
              btn.style.padding = '12px 20px'
              btn.addEventListener('click', ()=>{
                try{ bgm.play().then(()=>{ fadeAudio(bgm, targetVol, fadeInMs).catch(()=>{}) }).catch(()=>{}) }catch(e){}
                try{ if(seBtn) seBtn.play().catch(()=>{}) }catch(e){}
                try{ if(o && o.parentElement) o.parentElement.removeChild(o) }catch(e){}
              })
              o.appendChild(btn)
              document.body.appendChild(o)
              // ユーザーの最初の操作でオーディオを再生するハンドラを登録（タッチなど）
              const resumeOnce = ()=>{
                try{ bgm.play().then(()=>{ fadeAudio(bgm, targetVol, fadeInMs).catch(()=>{}) }).catch(()=>{}) }catch(e){}
                try{ if(seBtn) seBtn.play().catch(()=>{}) }catch(e){}
                try{ if(o && o.parentElement) o.parentElement.removeChild(o) }catch(e){}
                try{ document.removeEventListener('pointerdown', resumeOnce) }catch(e){}
                try{ document.removeEventListener('click', resumeOnce) }catch(e){}
              }
              document.addEventListener('pointerdown', resumeOnce, { once:true })
              document.addEventListener('click', resumeOnce, { once:true })
            }catch(e){}
          })
        } else {
          // 非 Promise なブラウザ（古い）でもフェードインする
          try{ fadeAudio(bgm, targetVol, fadeInMs).catch(()=>{}) }catch(e){}
        }
      }
    }catch(e){}

  // 初期表示は最初の本文画像
  idx = 0
  showImage(idx)
  // ページ表示中は常にドゥリョダナの 3 枚切替をループさせる
  try{ startDuryLoop(600) }catch(e){}
  // 目の瞬きループも開始する（デフォルトは 3〜7 秒でゆっくり瞬き）
  try{ startEyeLoop(3000, 7000) }catch(e){}
  // 口の軽いアニメも開始する（よく喋る設定: 0.6〜1.2 秒間隔の発話、内部でバーストあり）
  try{ startMouthLoop(600, 1200) }catch(e){}

    if(btnNext){
      btnNext._handler = ()=>{
        if(_lockedButtons) return
        lockButtons(800)
        playSE(); next()
      }
      btnNext.addEventListener('click', btnNext._handler)
    }
    if(btnRestart){
      btnRestart._handler = ()=>{
        if(_lockedButtons) return
        lockButtons(1200)
        if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else {
          // フォールバック: 画面フェードアウト（true_end は独自の変数を優先）
          try{ const screen = document.getElementById('screen'); if(screen) screen.classList.remove('visible') }catch(e){}
          try{
            const cs = getComputedStyle(document.documentElement)
            const pref = (cs.getPropertyValue('--te-screen-fade-out')||'').trim()
            const base = (cs.getPropertyValue('--transition-duration')||'').trim() || '400ms'
            const v = pref || base
            const toMs = (val)=>{ val=String(val).trim(); if(val.endsWith('ms')) return Math.round(parseFloat(val)); if(val.endsWith('s')) return Math.round(parseFloat(val)*1000); const n=parseFloat(val); return Number.isFinite(n)?Math.round(n):400 }
            setTimeout(()=>{ location.href = 'start.html' }, toMs(v))
          }catch(e){ setTimeout(()=>{ location.href = 'start.html' }, 400) }
        }
      }
      btnRestart.addEventListener('click', btnRestart._handler)
    }

    const screen = document.getElementById('screen')
    if(screen){
      // フェードインは CSS の --te-screen-fade-in / --te-screen-fade-out によって制御します。
      // JS では inline の transition を上書きせず、初期 opacity を 0 にしてからクラス付与と遅延で 1 にする。
      try{
        screen.style.opacity = '0'
        try{ screen.classList.add('visible') }catch(e){}
        try{ void screen.offsetWidth }catch(e){}
        setTimeout(()=>{ try{ screen.style.opacity = '1' }catch(e){} }, 20)
      }catch(e){
        try{ screen.classList.add('visible') }catch(e){}
      }
    }
  }

  try{ init() }catch(e){ console.error(e) }

  // 外部から停止できるように簡単な停止関数を用意
  if(typeof window !== 'undefined'){
    window.trueEndInit = init
    window.trueEndStop = function(){ 
      try{
        // フェードアウトしてから停止
        if(bgm && !bgm.paused){
          const fadeOutMs = readRootMs('--te-bgm-fade-out', 1000)
          try{ fadeAudio(bgm, 0, fadeOutMs).then(()=>{ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} }).catch(()=>{ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} }) }catch(e){ try{ bgm.pause(); bgm.currentTime = 0 }catch(e){} }
        }
      }catch(e){}
      try{ if(btnNext && btnNext._handler) btnNext.removeEventListener('click', btnNext._handler) }catch(e){}
      try{ if(btnRestart && btnRestart._handler) btnRestart.removeEventListener('click', btnRestart._handler) }catch(e){}
      try{ const c = document.querySelector('[data-ui-text-container]'); if(c) c.innerHTML = '' }catch(e){}
      try{ stopDuryLoop() }catch(e){}
      try{ stopEyeLoop() }catch(e){}
      try{ stopMouthLoop() }catch(e){}
    }
  }

})();
