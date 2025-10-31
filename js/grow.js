/*
  grow.js
  - 育成画面の主なロジック
  - 灯り・ドゥリーヨダナのアニメ、ボタン処理、ゲージ管理、SE/BGM 再生、エンド判定の土台を提供します。
*/

;(function(){
  'use strict'

  // --- ミュート用の視覚キュー（暗転中に点滅するテキスト）
  // 調整可能項目:
  // - fontUrl: フォントファイルパス (例: 'assets/font/Kaisotai-Next-UP-B.ttf')
  // - fontFamily: @font-face で使うフォント名
  // - fontSize: 表示時のフォントサイズ（例 '40px'）
  // - color: テキスト色
  // - textShadow: テキストシャドウ
  // - animationDuration: 点滅アニメの周期（ms）
  // - verticalOffset: 中央からの垂直オフセット（例 '0%'、'-10%' など）
  // 上書きするには `setMutedCueConfig({ fontSize:'48px', animationDuration:1000 })` のように呼び出してください。
  const growMutedCueConfig = {
    fontUrl: 'assets/font/Kaisotai-Next-UP-B.ttf',
    fontFamily: 'Kaisotai-Next-UP-B',
    fontSize: '40px',
    color: '#ffffff',
    textShadow: '0 0 8px rgba(0,0,0,0.8)',
    animationDuration: 2000,
    verticalOffset: '0%'
  }

  function setMutedCueConfig(overrides){
    try{
      if(!overrides) return
      Object.keys(overrides).forEach(k=>{ try{ if(k in growMutedCueConfig) growMutedCueConfig[k] = overrides[k] }catch(e){} })
      // re-create style to apply changes
      const existing = document.getElementById('muted-cue-style')
      try{ if(existing && existing.parentElement) existing.parentElement.removeChild(existing) }catch(e){}
      // next showMutedCue call will recreate style with new config
    }catch(e){}
  }

  function ensureMutedCueStyle(){
    try{
      if(document.getElementById('muted-cue-style')) return
      const s = document.createElement('style')
      s.id = 'muted-cue-style'
      const animMs = Number(growMutedCueConfig.animationDuration) || 1400
      // note: use @font-face to load the provided font file
      s.textContent = "@font-face{font-family:'" + growMutedCueConfig.fontFamily + "';src:url('" + growMutedCueConfig.fontUrl + "') format('truetype');font-weight:normal;font-style:normal;font-display:swap;}\n" +
        "@keyframes mutedCueBlink{0%{opacity:0}50%{opacity:1}100%{opacity:0}}\n" +
        ".muted-cue{pointer-events:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100000;color:" + (growMutedCueConfig.color||'#fff') + ";font-family:'" + growMutedCueConfig.fontFamily + "', Arial, 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;font-size:" + (growMutedCueConfig.fontSize||'40px') + ";letter-spacing:0.04em;text-align:center;text-shadow:" + (growMutedCueConfig.textShadow||'0 0 8px rgba(0,0,0,0.8)') + ";animation:mutedCueBlink " + (animMs/1000) + "s ease-in-out infinite}" +
        "\n.muted-cue-offset{transform:translate(-50%,-50%) translateY(" + (growMutedCueConfig.verticalOffset||'0%') + ");}"
      document.head.appendChild(s)
    }catch(e){}
  }

  function showMutedCue(text){
    try{
      ensureMutedCueStyle()
      let o = document.getElementById('muted-cue-overlay')
      if(!o){
        o = document.createElement('div')
        o.id = 'muted-cue-overlay'
        o.className = 'muted-cue muted-cue-offset'
        o.setAttribute('aria-hidden', 'true')
        document.body.appendChild(o)
      }
      try{ o.textContent = text || '' }catch(e){}
      try{ o.style.display = 'block' ; o.style.opacity = '1' }catch(e){}
      return o
    }catch(e){ return null }
  }

  function hideMutedCue(){
    try{
      const o = document.getElementById('muted-cue-overlay')
      if(!o) return
      try{ o.style.opacity = '0' }catch(e){}
      setTimeout(()=>{ try{ if(o && o.parentElement) o.parentElement.removeChild(o) }catch(e){} }, 250)
    }catch(e){}
  }

  // playAudioElement を使って再生中にミュート向けキューを表示するヘルパ
  async function playAudioWithMuteCue(el, cueText){
    try{
      if(!el) return await playAudioElement(el)
      const cue = showMutedCue(cueText)
      try{ await playAudioElement(el) }catch(e){}
      try{ hideMutedCue() }catch(e){}
    }catch(e){ try{ hideMutedCue() }catch(_){} }
  }

  // expose setter for external use
  window.setMutedCueConfig = setMutedCueConfig
  // --- DOM 要素キャッシュ ---
  // grow.html 側の要素をここでまとめて参照します。存在しない場合は null になります。
  const screen = document.getElementById('screen')
  const bgm = document.getElementById('bgm')
  const seButton = document.getElementById('se-button')
  const seBloodDrop = document.getElementById('se-blood-drop')
  const seHeart = document.getElementById('se-heart')
  const seCauseBreak1 = document.getElementById('se-cause-break1')
  const seCauseBreak3 = document.getElementById('se-cause-break3')
  const seVesselCrack1 = document.getElementById('se-vessel-crack1')
  const seVesselCrack3 = document.getElementById('se-vessel-crack3')
  const seTyuubou = document.getElementById('se-tyuubouniiku')
  const seMasutaNigou = document.getElementById('se-masuta-nigoukou')
  const seSleepBed = document.getElementById('se-sleep-bed')
  const seTaisitu = document.getElementById('se-taisitu')

  const lightFrame = document.getElementById('light-frame')
  const duryodhana = document.getElementById('duryodhana-frame')
  const duryEye = document.getElementById('duryodhana-eye')
  const duryMouth = document.getElementById('duryodhana-mouth')
  const vessel = document.getElementById('vessel')
  const bhimaHand = document.getElementById('bhima-hand')
  const bloodSplash = document.getElementById('blood-splash')

  const dayLabel = document.getElementById('day-label')
  const gaugeBase = document.getElementById('gauge-base')
  const gaugeKarma = document.getElementById('gauge-karma')
  const gaugeVessel = document.getElementById('gauge-vessel')
  const gaugeMana = document.getElementById('gauge-mana')
  const gaugeTemp = document.getElementById('gauge-temp')

  const btnBlood = document.getElementById('btn-blood')
  const btnWarm = document.getElementById('btn-warm')
  const btnKitchen = document.getElementById('btn-kitchen')
  const btnFollow = document.getElementById('btn-follow')
  const btnSleep = document.getElementById('btn-sleep')
  // --- ランタイム状態変数（初期値を明示して未定義参照を防ぐ） ---
  let day = 1
  let mana = 2
  let temp = 2
  let karma = 0
  let vesselLevel = 0
  let suppressAutoDialogsUntil = 0
  // break handling flag for mana overflow during blood action
  let manaBreakHandled = false
  // bgm playback state remembered when entering day-send sequences
  let bgmWasPlayingBeforeDaySend = false
  let busy = false
  let _lockedButtons = []
  // プロローグと同等の遷移ガード: 画面遷移やフェード中のクリックを無視する
  let _navigating = false
  // animation timers
  let lightTimer = null
  let duryTimer = null
  // aliases and animation indices used by startAnims / stopAnims
  const lightImg = lightFrame
  const duryImg = duryodhana
  let lightIndex = 0
  let duryIndex = 0
  // frame sequences for simple animations (match start.js conventions)
  const lightFrames = [
    'assets/light/01_light_weak.png',
    'assets/light/02_light_medium.png',
    'assets/light/03_light_strong.png'
  ]
  const duryFrames = [
    'assets/character/wayang/01_duryodhana_wayang_top.png',
    'assets/character/wayang/02_duryodhana_wayang_mid.png',
    'assets/character/wayang/03_duryodhana_wayang_bottom.png'
  ]
  // SE aliases to match older variable names used throughout the file
  const seBlood = seBloodDrop
  const seCause1 = seCauseBreak1
  const seCause3 = seCauseBreak3
  const seVessel1 = seVesselCrack1
  const seVessel3 = seVesselCrack3
  const seMasuta = seMasutaNigou
  // ensure PRELOAD_ASSETS exists (some edits removed its declaration in other files)
  window.PRELOAD_ASSETS = window.PRELOAD_ASSETS || []
  // preload day-send dialog images (hiokuri 01..05)
  PRELOAD_ASSETS.push(
    'assets/ui_text/grow/hiokuri/01.png',
    'assets/ui_text/grow/hiokuri/02.png',
    'assets/ui_text/grow/hiokuri/03.png',
    'assets/ui_text/grow/hiokuri/04.png',
    'assets/ui_text/grow/hiokuri/05.png'
  )
  function preloadAssets(list){ try{ list.forEach(s=>{ const i=new Image(); i.src = s }) }catch(e){} }

  // ------------------------
  // 調整可能なアニメーションタイミング (ミリ秒)
  // ここを変えるだけで各シーケンスの速度を調整できます。
  // 小学生でも分かる説明:
  // - bloodHandMid: 血を与えるとき、手が中間ポーズに切り替わるまでの時間
  // - bloodHandTop: 手が最上位ポーズに切り替わるまでの時間
  // - bloodFall / bloodHit / bloodSplash1 / bloodDone: 血の各ステップの切替時間
  // - bloodEnd: シーケンス全体を完了して手と血を隠す時間
  // - warmMid / warmHold / warmReset / warmEnd: 温めシーケンスの各切替時間
  const TIMINGS = {
    // front -> mid -> top の順でハンドポーズの時間を調整できるように
    // bloodHandFront: 最初の手（前方ポーズ）の表示時間
    bloodHandFront: 300,
    bloodHandMid: 500,
    bloodHandTop: 700,
    bloodDropSmall: 1100,
    bloodDropLarge: 1300,
    bloodFall: 1500,
    bloodHit: 1700,
    bloodSplash1: 1900,
    bloodSplash2: 2100,
    bloodSplash3: 2300,
    bloodDone: 2500,
    bloodEnd: 2700,
  // 血ヒット時に灯りを最大表示する長さ（ms）
  lightMaxHold: 900,
  // 灯りをフェードさせる時間（ms）: lightMax 表示から通常アニメに戻す際のフェード時間
  lightFade: 300,
  // 血終了時に中間ポーズを短く表示してから前方ポーズに戻す時間（ms）
  bloodReturnHold: 500,
  // 戻りの先頭ポーズ(1)を表示するホールド時間（ms）
  bloodReturnFrontHold: 300,

  // 温めシーケンスのフレーム別ホールド時間 (ミリ秒)
  warmFrontHold: 200,         // frame 1 表示時間
  warmMidHold: 200,           // frame 2 表示時間
  warmHold: 1600,              // frame 3 (hold) 表示時間
  warmReturnMidHold: 200,     // 戻りの frame 2 表示時間
  warmReturnFrontHold: 200,   // 戻りの frame 1 表示時間
  // warmEnd はシーケンス合計で求められるため明示値は残さない（互換性のため以前の値は不要）
  warmEnd: 0
  ,
  // vessel glow pulse settings: number of pulses to perform when showing glow/transparent
  // default 0 = disabled
  vesselGlowPulseGlow: 0,
  vesselGlowPulseTransparent: 0,
  vesselGlowPulseInterval: 150
  // vessel animation timing tunables (ms). Shorter defaults for snappier feedback.
  ,vesselFadeDuration: 160
  ,vesselDialogDelay: 30
  ,vesselGlowToTransparentHold: 300
  ,vesselPostTransparentPause: 120
  ,vesselLevel3EndPause: 300
  // 日送りセリフ表示時間（ms）: hiokuri 表示の持続時間（表示を長めに）
  ,hiokuriDisplay: 3000
  // まばたき（閉眼キープを長めにしたい時の繰り返し回数）
  ,duryBlinkClosedRepeats: 2
  // まばたき（開眼キープを長めにしたい時の繰り返し回数）
  ,duryBlinkOpenRepeats: 3
  }
  // ランタイムで変更できるようグローバルに公開
  window.growTimings = TIMINGS

  // helper: update gauge images based on values
  function updateGauges(){
    const manaMap = {2:'assets/ui_gauge/grow/mana/01_ui_gauge_lv2.png',4:'assets/ui_gauge/grow/mana/02_ui_gauge_lv4.png',6:'assets/ui_gauge/grow/mana/03_ui_gauge_lv6.png',8:'assets/ui_gauge/grow/mana/04_ui_gauge_lv8.png',10:'assets/ui_gauge/grow/mana/05_ui_gauge_lv10_max.png'}
    const tempMap = {2:'assets/ui_gauge/grow/temp/01_ui_gauge_lv2.png',4:'assets/ui_gauge/grow/temp/02_ui_gauge_lv4.png',6:'assets/ui_gauge/grow/temp/03_ui_gauge_lv6.png',8:'assets/ui_gauge/grow/temp/04_ui_gauge_lv8.png',10:'assets/ui_gauge/grow/temp/05_ui_gauge_lv10_max.png'}
  const karmaMap = {1:'assets/ui_gauge/grow/karma/01_ui_gauge_lv1.png',2:'assets/ui_gauge/grow/karma/02_ui_gauge_lv2.png',3:'assets/ui_gauge/grow/karma/03_ui_gauge_lv3_max.png'}
  const vesselMap = {1:'assets/ui_gauge/grow/vessel/01_ui_gauge_lv1.png',2:'assets/ui_gauge/grow/vessel/02_ui_gauge_lv2.png',3:'assets/ui_gauge/grow/vessel/03_ui_gauge_lv3_max.png'}
    // mana/temp は既存のマップ方式を維持
    gaugeMana && (gaugeMana.src = manaMap[Math.min(10, Math.max(2, Math.floor(mana/2)*2))] )
    gaugeTemp && (gaugeTemp.src = tempMap[Math.min(10, Math.max(2, Math.floor(temp/2)*2))] )
    // 因果・器は初期値 0 の場合は非表示にする（初期値は 0）
    if(gaugeKarma){
      try{
        const k = parseInt(karma, 10) || 0
        const kClamped = Math.max(0, Math.min(3, k))
        if(kClamped <= 0){
          gaugeKarma.style.display = 'none'
        } else {
          const img = karmaMap[kClamped]
          // debug: log current karma and chosen image (helps trace mismatches)
          try{ if(window && window.console && console.debug) console.debug('[updateGauges] karma=', karma, 'parsed=', kClamped, 'img=', img) }catch(e){}
          gaugeKarma.style.display = 'block'
          if(img) gaugeKarma.src = img
          // apply shake only when karma is at max (3)
          try{
            try{ gaugeKarma.classList.remove('shake','horror','horizontal','micro') }catch(e){}
            try{ void gaugeKarma.offsetWidth }catch(e){}
            if(kClamped >= 3){
              gaugeKarma.classList.add('shake','horror')
              setTimeout(()=>{ try{ gaugeKarma.classList.remove('shake','horror') }catch(e){} }, 800)
            }
            // otherwise do not add any shake classes for karma < 3
          }catch(e){}
        }
      }catch(e){ try{ gaugeKarma.style.display = 'none' }catch(_){} }
    }
    if(gaugeVessel){
      if(vesselLevel <= 0){
        gaugeVessel.style.display = 'none'
      } else {
        gaugeVessel.style.display = 'block'
        gaugeVessel.src = vesselMap[Math.min(3, vesselLevel)]
        // apply shake only when vessel is at max level (3)
        try{
          try{ gaugeVessel.classList.remove('shake','horror','horizontal','micro') }catch(e){}
          try{ void gaugeVessel.offsetWidth }catch(e){}
          if(typeof vesselLevel === 'number' && vesselLevel >= 3){
            gaugeVessel.classList.add('shake','horror')
            setTimeout(()=>{ try{ gaugeVessel.classList.remove('shake','horror') }catch(e){} }, 800)
          }
          // otherwise no shake for vessel < 3
        }catch(e){}
      }
    }
  }

  // Dialog assets mapping (mana / taionn per day; innga / utuwa simple)
  const maryokuMap = {
    1: {6:'assets/ui_text/grow/maryoku/01.png',8:'assets/ui_text/grow/maryoku/02.png',10:'assets/ui_text/grow/maryoku/03.png'},
    2: {6:'assets/ui_text/grow/maryoku/04.png',8:'assets/ui_text/grow/maryoku/05.png',10:'assets/ui_text/grow/maryoku/06.png'},
    3: {6:'assets/ui_text/grow/maryoku/07.png',8:'assets/ui_text/grow/maryoku/08.png',10:'assets/ui_text/grow/maryoku/09.png'},
    4: {6:'assets/ui_text/grow/maryoku/10.png',8:'assets/ui_text/grow/maryoku/11.png',10:'assets/ui_text/grow/maryoku/12.png'},
    5: {6:'assets/ui_text/grow/maryoku/13.png',8:'assets/ui_text/grow/maryoku/14.png',10:'assets/ui_text/grow/maryoku/15.png'}
  }
  const taionnMap = {
    1: {6:'assets/ui_text/grow/taionn/01.png',8:'assets/ui_text/grow/taionn/02.png',10:'assets/ui_text/grow/taionn/03.png'},
    2: {6:'assets/ui_text/grow/taionn/04.png',8:'assets/ui_text/grow/taionn/05.png',10:'assets/ui_text/grow/taionn/06.png'},
    3: {6:'assets/ui_text/grow/taionn/07.png',8:'assets/ui_text/grow/taionn/08.png',10:'assets/ui_text/grow/taionn/09.png'},
    4: {6:'assets/ui_text/grow/taionn/10.png',8:'assets/ui_text/grow/taionn/11.png',10:'assets/ui_text/grow/taionn/12.png'},
    5: {6:'assets/ui_text/grow/taionn/13.png',8:'assets/ui_text/grow/taionn/14.png',10:'assets/ui_text/grow/taionn/15.png'}
  }
  const inngaMap = {1:'assets/ui_text/grow/innga/01.png',2:'assets/ui_text/grow/innga/02.png',3:'assets/ui_text/grow/innga/03.png'}
  const utuwaMap = {1:'assets/ui_text/grow/utuwa/01.png',2:'assets/ui_text/grow/utuwa/02.png',3:'assets/ui_text/grow/utuwa/03.png'}

  const growDialog = document.getElementById('grow-dialog')

  // Helper to set/clear the grow dialog src with respect to suppression windows.
  function setGrowDialogSrc(src){
    try{
      if(!growDialog) return
      // clearing is always allowed
      if(!src){ try{ growDialog.src = '' }catch(e){} ; return }
      // if automatic dialogs are suppressed, do not set a new non-empty src
      if(Date.now() < suppressAutoDialogsUntil) return
      try{ growDialog.src = src }catch(e){}
    }catch(e){}
  }

  // Dur yodhana eye animation helper for day-send dialog
  let duryEyeAnimating = false
  function animateDuryEyeFor(totalMs){
    try{
      if(!duryEye || duryEyeAnimating) return
      duryEyeAnimating = true
      const closed = 'assets/character/wayang/07_duryodhana_wayang_eye_closed.png'
      const half = 'assets/character/wayang/06_duryodhana_wayang_eye_half.png'
      const narrow = 'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png'
      const open = 'assets/character/wayang/04_duryodhana_wayang_eye_open_clear.png'
      const repeatClosed = (typeof TIMINGS.duryBlinkClosedRepeats === 'number' ? Math.max(1, TIMINGS.duryBlinkClosedRepeats) : 2)
      const repeatOpen = (typeof TIMINGS.duryBlinkOpenRepeats === 'number' ? Math.max(1, TIMINGS.duryBlinkOpenRepeats) : 3)
      const eyeFrames = new Array(repeatClosed).fill(closed)
        .concat([half, narrow])
        .concat(new Array(repeatOpen).fill(open))
        .concat([narrow, half])
        .concat(new Array(repeatClosed).fill(closed))
      const prev = duryEye.src || ''
      const interval = Math.max(50, Math.floor(totalMs / eyeFrames.length))
      eyeFrames.forEach((f, i)=>{
        setTimeout(()=>{ try{ duryEye.src = f }catch(e){} }, i * interval)
      })
      setTimeout(()=>{ try{ duryEye.src = prev }catch(e){} ; duryEyeAnimating = false }, totalMs + 20)
    }catch(e){ duryEyeAnimating = false }
  }

  // day label images (used for day-send screen)
  const dayLabelMap = {
    1: 'assets/ui_text/grow/day_label/01_ui_day_label_01.png',
    2: 'assets/ui_text/grow/day_label/02_ui_day_label_02.png',
    3: 'assets/ui_text/grow/day_label/03_ui_day_label_03.png',
    4: 'assets/ui_text/grow/day_label/04_ui_day_label_04.png',
    5: 'assets/ui_text/grow/day_label/05_ui_day_label_05.png'
  }

  // hiokuri (日送りセリフ) images per day
  const hiokuriMap = {
    1: 'assets/ui_text/grow/hiokuri/01.png',
    2: 'assets/ui_text/grow/hiokuri/02.png',
    3: 'assets/ui_text/grow/hiokuri/03.png',
    4: 'assets/ui_text/grow/hiokuri/04.png',
    5: 'assets/ui_text/grow/hiokuri/05.png'
  }

  function setDay(n){
    day = Math.max(1, Math.min(5, parseInt(n,10)||1))
    try{ if(dayLabel) dayLabel.src = dayLabelMap[day] || dayLabel.src }catch(e){}
    // reset mana/temp to initial values on day advance
    mana = 2; temp = 2
    updateGauges()
    // show appropriate primary action button for this day
    showPrimaryActionForDay()
    // ensure action buttons for the grow screen (blood/warm) are visible on the new day
    try{ if(btnBlood) btnBlood.style.display = ''; if(btnWarm) btnWarm.style.display = '' }catch(e){}
  }

  function showPrimaryActionForDay(){
    // Day 1 and Day 5 -> show kitchen button; Day 2-4 -> show follow button
    try{
      // Show kitchen on Day 1, Day 3 and Day 5. Show follow on Day 2 and Day 4 only.
      if(btnKitchen) btnKitchen.style.display = (day===1 || day===3 || day===5) ? '' : 'none'
      if(btnFollow) btnFollow.style.display = (day===2 || day===4) ? '' : 'none'
      // hide sleep by default
      if(btnSleep) btnSleep.style.display = 'none'
    }catch(e){}
  }

  // helper to play audio element and return a promise that resolves when it ends (or after timeout)
  function playAudioElement(el){
    return new Promise((resolve)=>{
      try{
        if(!el) return resolve()
        try{ el.currentTime = 0 }catch(e){}
        const p = el.play()
        let resolved = false
        const onEnd = ()=>{ if(resolved) return; resolved = true; try{ el.removeEventListener('ended', onEnd) }catch(e){}; resolve() }
        try{ el.addEventListener('ended', onEnd) }catch(e){}
        // fallback: resolve after duration (if available) or 800ms
        const fallback = Math.max(800, (el.duration && isFinite(el.duration) ? Math.round(el.duration*1000) : 800))
        setTimeout(()=> onEnd(), fallback + 50)
        if(p && p.then) p.catch(()=>{})
      }catch(e){ resolve() }
    })
  }

  // Fade helpers for growDialog (hiokuri day-send images)
  function fadeInGrowDialog(src, ms){
    return new Promise((resolve)=>{
      try{
        // Respect global suppression window: if automatic dialogs are currently
        // suppressed, don't perform a fade-in or set the src (prevents flashes).
        try{ if(Date.now() < suppressAutoDialogsUntil){ resolve(); return } }catch(e){}
        if(!growDialog) return resolve()
  setGrowDialogSrc(src || '')
        // ensure visible block before starting opacity transition
        growDialog.style.display = 'block'
        // apply explicit transition duration if provided
        if(typeof ms === 'number') growDialog.style.transition = 'opacity ' + (ms/1000) + 's ease'
        // start from 0
        growDialog.style.opacity = '0'
        // next frame -> set to 1 to trigger transition
        requestAnimationFrame(()=>{
          try{ growDialog.style.opacity = '1' }catch(e){}
        })
        const onEnd = (ev)=>{ try{ growDialog.removeEventListener('transitionend', onEnd) }catch(e){} ; resolve() }
        growDialog.addEventListener('transitionend', onEnd)
        // fallback
        setTimeout(()=>{ try{ growDialog.removeEventListener('transitionend', onEnd) }catch(e){} ; resolve() }, (ms||300) + 80)
      }catch(e){ resolve() }
    })
  }

  function fadeOutGrowDialog(ms){
    return new Promise((resolve)=>{
      try{
        if(!growDialog) return resolve()
        // If suppressed, ensure dialog is hidden and clear src immediately
        try{ if(Date.now() < suppressAutoDialogsUntil){ try{ growDialog.style.display='none'; growDialog.src=''; growDialog.style.opacity='0' }catch(e){} ; resolve(); return } }catch(e){}
        if(typeof ms === 'number') growDialog.style.transition = 'opacity ' + (ms/1000) + 's ease'
        // start fade out
        growDialog.style.opacity = '0'
  const onEnd = (ev)=>{ try{ growDialog.removeEventListener('transitionend', onEnd) }catch(e){} ; try{ growDialog.style.display='none'; setGrowDialogSrc('') }catch(e){} ; resolve() }
        growDialog.addEventListener('transitionend', onEnd)
        // fallback
  setTimeout(()=>{ try{ growDialog.removeEventListener('transitionend', onEnd) }catch(e){} ; try{ growDialog.style.display='none'; setGrowDialogSrc('') }catch(e){} ; resolve() }, (ms||300) + 80)
      }catch(e){ resolve() }
    })
  }

  // wait until the screen fade-in transition completes (or timeout)
  function waitForFadeIn(timeoutFallback){
    return new Promise((resolve)=>{
      try{
        if(!screen) return resolve()
        // compute fallback from computed transition-duration (first value)
        const cs = window.getComputedStyle(screen)
        let dur = 0
        try{
          const td = (cs && cs.transitionDuration) ? String(cs.transitionDuration).split(',')[0].trim() : ''
          if(td.endsWith('ms')) dur = Math.round(parseFloat(td))
          else if(td.endsWith('s')) dur = Math.round(parseFloat(td) * 1000)
        }catch(e){ dur = 0 }
        const fallback = typeof timeoutFallback === 'number' ? timeoutFallback : (dur > 0 ? dur + 80 : 500)
        let resolved = false
        const onTransition = (ev)=>{
          try{
            if(ev && ev.target === screen && (ev.propertyName === 'opacity' || ev.propertyName === 'opacity ')){
              if(resolved) return
              resolved = true
              screen.removeEventListener('transitionend', onTransition)
              resolve()
            }
          }catch(e){}
        }
        screen.addEventListener('transitionend', onTransition)
        // fallback timer
        setTimeout(()=>{ if(resolved) return; resolved = true; try{ screen.removeEventListener('transitionend', onTransition) }catch(e){}; resolve() }, fallback)
      }catch(e){ resolve() }
    })
  }

  function showDialogFor(type, level){
    // Returns a Promise that resolves when the dialog hide timeout completes.
    return new Promise((resolve)=>{
      // If automatic dialogs are suppressed, return immediately and record a suppressed log
      try{
        const now = Date.now()
        if(now < (suppressAutoDialogsUntil || 0) || window.__growDialogsSuppressed){
          resolve(); return
        }
      }catch(e){}
      // Temporary debug logging: record who called showDialogFor and why.
      try{
        // (debug logging removed in production builds)
      }catch(e){}
      // If automatic dialogs are suppressed (e.g. immediately after sleep/day-advance),
      // ignore any attempts to show dialogs. This prevents any dialog (mana/temp/innga/utuwa)
      // from flashing during the fade-out/fade-in window.
      try{
        if(Date.now() < suppressAutoDialogsUntil){ resolve(); return }
        // Backwards-compatible: if only innga-specific suppression is set, respect it as well
        if(type === 'innga' && Date.now() < suppressInngaUntil){ resolve(); return }
      }catch(e){}
      let src = ''
      if(type === 'mana') src = (maryokuMap[day] && maryokuMap[day][level]) || ''
      if(type === 'temp') src = (taionnMap[day] && taionnMap[day][level]) || ''
      if(type === 'innga') src = inngaMap[level] || ''
      if(type === 'utuwa') src = utuwaMap[level] || ''
      if(!src){ resolve(); return }
      try{
        if(!growDialog){ resolve(); return }
  setGrowDialogSrc(src)
  // Ensure dialog is visible: CSS sets #grow-dialog opacity:0 by default,
  // so set display:block and drive opacity -> 1 so the image actually appears.
  growDialog.style.display = 'block'
  try{ growDialog.style.opacity = '1' }catch(e){}
  // ドゥリーヨダナの目と口をセリフ表示中に演出する
        try{
          const dialogDur = 1400
          if(type === 'innga' || type === 'utuwa'){
            // 因果ダイアログ時は怒り表情を出す（目：narrow、口：angry）
            const prevEyeSrc = duryEye ? duryEye.src : ''
            const prevMouthSrc = duryMouth ? duryMouth.src : ''
            try{ if(duryEye) duryEye.src = 'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png' }catch(e){}
            try{ if(duryMouth) duryMouth.src = 'assets/character/wayang/10_duryodhana_wayang_mouth_open_angry.png' }catch(e){}
            // 因果ダイアログはセリフ画像自体をホラー表現で揺らす（他の揺れは無効化）
            try{
              if(growDialog){
                // ensure previous shake classes removed so horror restarts reliably
                try{ growDialog.classList.remove('shake','horror','horizontal','micro') }catch(e){}
                try{ void growDialog.offsetWidth }catch(e){}
                growDialog.classList.add('shake','horror')
                setTimeout(()=>{ try{ growDialog.classList.remove('shake','horror') }catch(e){} }, dialogDur)
              }
            }catch(e){}
            // ダイアログ終了時に元の表情に戻す
            setTimeout(()=>{ try{ if(duryEye) duryEye.src = prevEyeSrc; if(duryMouth) duryMouth.src = prevMouthSrc }catch(e){} }, dialogDur + 20)
          } else {
            // 通常ダイアログ時は目アニメ。閉眼時間を長くするため、閉眼フレームを繰り返す。
            if(duryEye){
              const closed = 'assets/character/wayang/07_duryodhana_wayang_eye_closed.png'
              const half = 'assets/character/wayang/06_duryodhana_wayang_eye_half.png'
              const narrow = 'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png'
              const open = 'assets/character/wayang/04_duryodhana_wayang_eye_open_clear.png'
              const repeatClosed = (typeof TIMINGS.duryBlinkClosedRepeats === 'number' ? Math.max(1, TIMINGS.duryBlinkClosedRepeats) : 2)
              const repeatOpen = (typeof TIMINGS.duryBlinkOpenRepeats === 'number' ? Math.max(1, TIMINGS.duryBlinkOpenRepeats) : 7)
              const eyeFrames = new Array(repeatClosed).fill(closed)
                .concat([half, narrow])
                .concat(new Array(repeatOpen).fill(open))
                .concat([narrow, half])
                .concat(new Array(repeatClosed).fill(closed))
              const interval = Math.max(50, Math.floor(dialogDur / eyeFrames.length))
              // 保存しておく（表示前の目の状態に戻すため）
              const prevEyeSrc = duryEye.src || ''
              eyeFrames.forEach((f, i)=>{
                setTimeout(()=>{ try{ duryEye.src = f }catch(e){} }, i * interval)
              })
              // ダイアログ終了時に目を元に戻す（わずかな遅延を確保）
              setTimeout(()=>{ try{ duryEye.src = prevEyeSrc }catch(e){} }, dialogDur + 20)
            }
          }
        }catch(e){}
        // show for dialogDur ms then fade out and resolve
        setTimeout(()=>{
          try{ 
            // start fade-out so it respects CSS transition
            try{ growDialog.style.opacity = '0' }catch(e){}
            // after transition remove from layout and clear src
            setTimeout(()=>{ try{ growDialog.style.display = 'none'; setGrowDialogSrc('') }catch(e){} ; resolve() }, 320)
          }catch(e){ try{ growDialog.style.display = 'none'; setGrowDialogSrc('') }catch(_){} ; resolve() }
        }, 1400)
      }catch(e){ resolve() }
    })
  }

  // decide which dialog to show automatically based on gauges
  function showAutoDialog(){
    // priority: mana, temp, karma, vessel
    if(mana >= 6){
      const level = (mana >= 10) ? 10 : (mana >=8 ? 8 : 6)
      showDialogFor('mana', level)
      return
    }
    if(temp >= 6){
      const level = (temp >= 10) ? 10 : (temp >=8 ? 8 : 6)
      showDialogFor('temp', level)
      return
    }
    // If we recently advanced day (e.g., via sleep), we may want to avoid showing the
    // innga (karma) dialog immediately because it conflicts with the day-send flow.
    // suppressInngaUntil is set during the sleep sequence; skip innga if still suppressed.
    if(karma > 0){
      if(Date.now() < suppressInngaUntil){
        // skip innga for now, continue to vessel check
      } else {
        showDialogFor('innga', Math.min(3, karma)); return
      }
    }
    if(vesselLevel > 0){ showDialogFor('utuwa', Math.min(3, vesselLevel)); return }
  }

  function playBgmIfNeeded(){
    try{ if(!bgm) return; if(!bgm.paused) return; bgm.currentTime = 0; bgm.play().catch(()=>{}) }catch(e){}
  }

  // Amplify an <audio> element using WebAudio GainNode. If WebAudio is not
  // available, fall back to setting the element.volume (capped at 1).
  // id: element id, gainValue: numeric gain (e.g. 2 -> ~2x amplitude)
  function amplifyAudioElement(id, gainValue){
    try{
      const el = document.getElementById(id)
      if(!el) return
      // avoid double-wrapping
      if(el.__amplifier){
        try{ el.__amplifier.gainNode.gain.value = gainValue }catch(e){}
        return
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if(!AudioCtx){
        try{ el.volume = Math.min(1, (el.volume || 1) * gainValue) }catch(e){}
        return
      }
      // create shared context per element and connect a GainNode
      const ctx = new AudioCtx()
      try{ ctx.resume().catch(()=>{}) }catch(e){}
      try{
        const src = ctx.createMediaElementSource(el)
        const gainNode = ctx.createGain()
        // allow gain > 1 to amplify beyond element.volume
        gainNode.gain.value = gainValue
        src.connect(gainNode)
        gainNode.connect(ctx.destination)
        // store references so we can update or avoid GC
        el.__amplifier = { ctx: ctx, src: src, gainNode: gainNode }
        // attempt to resume context on first user gesture if suspended
        if(typeof ctx.state === 'string' && ctx.state === 'suspended'){
          const resumeOnce = function(){ try{ ctx.resume().catch(()=>{}) }catch(e){} ; document.removeEventListener('pointerdown', resumeOnce); document.removeEventListener('click', resumeOnce) }
          document.addEventListener('pointerdown', resumeOnce, { once:true })
          document.addEventListener('click', resumeOnce, { once:true })
          // also try immediate resume (some browsers allow it in a short window)
          try{ ctx.resume().catch(()=>{}) }catch(e){}
        }
      }catch(e){
        // fallback
        try{ el.volume = Math.min(1, (el.volume || 1) * gainValue) }catch(e){}
      }
    }catch(e){}
  }

  // Fade an <img> element to a new src smoothly.
  // el: image element, newSrc: string, duration: ms
  // returns a Promise that resolves when the crossfade completes.
  function fadeImageSrc(el, newSrc, duration){
    return new Promise((resolve)=>{
      try{
        if(!el || !newSrc){ resolve(); return }
        duration = typeof duration === 'number' ? duration : 300
        // preload new image to avoid flash
        const pre = new Image()
        pre.src = newSrc
        let ran = false
        const doCrossfade = function(){
          if(ran) return; ran = true
          try{
            const parent = el.parentElement || document.body
            // create overlay image positioned over el
            const overlay = document.createElement('img')
            overlay.src = newSrc
            overlay.style.pointerEvents = 'none'
            overlay.style.opacity = '0'
            overlay.style.transition = 'opacity ' + (duration/1000) + 's ease'
            overlay.style.position = 'absolute'
            // keep pixel-art crisp on the overlay too
            overlay.style.imageRendering = 'pixelated'
            try{
              // Use offset-based geometry so coordinates are in the parent's
              // untransformed coordinate space (avoids mismatch with #screen scale).
              const left = (typeof el.offsetLeft === 'number') ? el.offsetLeft : 0
              const top = (typeof el.offsetTop === 'number') ? el.offsetTop : 0
              const width = (typeof el.offsetWidth === 'number' && el.offsetWidth) ? el.offsetWidth : el.width
              const height = (typeof el.offsetHeight === 'number' && el.offsetHeight) ? el.offsetHeight : el.height
              overlay.style.left = left + 'px'
              overlay.style.top = top + 'px'
              overlay.style.width = width + 'px'
              overlay.style.height = height + 'px'
            }catch(e){
              overlay.style.left = '0'; overlay.style.top = '0'; overlay.style.width = (el && (el.offsetWidth||el.width)) + 'px'; overlay.style.height = (el && (el.offsetHeight||el.height)) + 'px'
            }
            overlay.style.zIndex = '9999'
            // ensure parent is positioned relatively so absolute overlay aligns (do not restore to avoid reflow flicker)
            try{
              const cs = window.getComputedStyle(parent)
              if(!cs || cs.position === 'static'){
                if(!parent.__overlayPositioned){ parent.style.position = 'relative'; parent.__overlayPositioned = true }
              }
            }catch(e){}
            parent.appendChild(overlay)
            // force reflow then fade overlay in
            try{ overlay.style.willChange = 'opacity'; void overlay.offsetWidth }catch(e){}
            overlay.style.opacity = '1'
            // after fade completes, set el.src to newSrc and remove overlay
            setTimeout(()=>{
              try{ el.src = newSrc }catch(e){}
              try{ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay) }catch(e){}
              try{ el.style.willChange = '' }catch(e){}
              resolve()
            }, duration + 20)
          }catch(e){ resolve() }
        }

        // helper: compare two audio elements' sources robustly (attribute or resolved src)
        function audioSrcEqual(a, b){
          try{
            if(!a || !b) return false
            const aAttr = a.getAttribute && a.getAttribute('src')
            const bAttr = b.getAttribute && b.getAttribute('src')
            if(aAttr && bAttr) return String(aAttr) === String(bAttr)
            // fallback to resolved src comparison
            if(a.src && b.src) return String(a.src) === String(b.src)
          }catch(e){}
          return false
        }

        function getAudioDurationMs(el){
          try{
            if(!el) return 800
            if(el.duration && isFinite(el.duration) && el.duration > 0) return Math.round(el.duration * 1000)
          }catch(e){}
          return 800
        }
        pre.onload = function(){ doCrossfade() }
        if(pre.complete) doCrossfade()
        // safety fallback
        setTimeout(()=>{ try{ doCrossfade() }catch(e){} }, duration * 3 + 200)
      }catch(e){ resolve() }
    })
  }



  // Pulse an element's opacity a number of times.
  // times: number of full pulses (fade to minOpacity then back to 1 counts as one)
  // interval: total time for one pulse (ms)
  function pulseElement(el, times, interval, minOpacity){
    return new Promise((resolve)=>{
      try{
        times = parseInt(times,10) || 0
        interval = typeof interval === 'number' ? interval : 150
        minOpacity = (typeof minOpacity === 'number') ? minOpacity : 0.6
        if(!el || times <= 0){ resolve(); return }
        const half = Math.max(20, Math.floor(interval/2))
        const prevTransition = el.style.transition || ''
        let count = 0
        const run = ()=>{
          try{
            el.style.transition = 'opacity ' + (half/1000) + 's ease'
            el.style.opacity = String(minOpacity)
            setTimeout(()=>{
              try{ el.style.opacity = '1' }catch(e){}
              setTimeout(()=>{
                count++
                if(count < times) run()
                else { try{ el.style.transition = prevTransition }catch(e){} ; resolve() }
              }, half)
            }, half)
          }catch(e){ resolve() }
        }
        run()
      }catch(e){ resolve() }
    })
  }

  function startAnims(){
    if(lightTimer) clearInterval(lightTimer)
    if(duryTimer) clearInterval(duryTimer)
    // ping-pong animation: 0->1->2->1->0 ...
    lightIndex = 0; duryIndex = 0
    let lightDir = 1, duryDir = 1
    lightImg && (lightImg.src = lightFrames[0])
    duryImg && (duryImg.src = duryFrames[0])
    lightTimer = setInterval(()=>{
      lightIndex += lightDir
      if(lightIndex >= lightFrames.length){ lightIndex = lightFrames.length-2; lightDir = -1 }
      if(lightIndex < 0){ lightIndex = 1; lightDir = 1 }
      lightImg && (lightImg.src = lightFrames[lightIndex])
    }, 500)
    duryTimer = setInterval(()=>{
      duryIndex += duryDir
      if(duryIndex >= duryFrames.length){ duryIndex = duryFrames.length-2; duryDir = -1 }
      if(duryIndex < 0){ duryIndex = 1; duryDir = 1 }
      duryImg && (duryImg.src = duryFrames[duryIndex])
    }, 700)
  }

  function stopAnims(){ if(lightTimer) clearInterval(lightTimer); if(duryTimer) clearInterval(duryTimer) }

  function shakeElement(el, times=6){
    if(!el) return
    try{
      const isGauge = el.id && String(el.id).indexOf('gauge-') === 0
      if(isGauge){
        // Ensure previous shake classes are removed so the animation restarts reliably.
        try{ el.classList.remove('shake','horror','horizontal','micro') }catch(e){}
        // Force reflow so the browser treats the next class addition as a fresh animation
        try{ void el.offsetWidth }catch(e){}
        // Only apply shaking for gauges when they are at max level (3).
        if(el.id === 'gauge-karma'){
          try{
            const k = (typeof karma === 'number') ? karma : 0
            if(k >= 3){
              el.classList.add('shake','horror')
              try{ if(window && window.console && console.debug) console.debug('[shakeElement] added', el.id, el.className, 'animation=', getComputedStyle(el).animationName) }catch(e){}
              setTimeout(()=>{ try{ el.classList.remove('shake','horror') }catch(e){} }, 800)
            }
          }catch(e){}
        } else if(el.id === 'gauge-vessel'){
          try{
            const v = (typeof vesselLevel === 'number') ? vesselLevel : 0
            if(v >= 3){
              el.classList.add('shake','horror')
              try{ if(window && window.console && console.debug) console.debug('[shakeElement] added', el.id, el.className, 'animation=', getComputedStyle(el).animationName) }catch(e){}
              setTimeout(()=>{ try{ el.classList.remove('shake','horror') }catch(e){} }, 800)
            }
          }catch(e){}
        } else {
          // Other gauge-like elements: no shake by default for non-specified gauges
        }
      } else {
        // Non-gauge elements: restart shake animation reliably
        try{ el.classList.remove('shake','horror','horizontal','micro') }catch(e){}
        try{ void el.offsetWidth }catch(e){}
        el.classList.add('shake')
        setTimeout(()=>{ try{ el.classList.remove('shake') }catch(e){} }, 800)
      }
    }catch(e){}
  }

  function showBloodSequence(){
    return new Promise((resolve)=>{
        bhimaHand && (bhimaHand.style.display = 'block')
        bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/01_bhima_blood_front.png')
        // NOTE: seBlood の即時再生は削除。滴下音は bloodHit タイミングで再生する。
        try{ if(seBlood) seBlood.currentTime = 0 }catch(e){}
  // front -> mid
  setTimeout(()=>{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/02_bhima_blood_mid.png') }, TIMINGS.bloodHandFront)
  // mid -> top
  setTimeout(()=>{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/03_bhima_blood_top.png') }, TIMINGS.bloodHandMid)
  // small drop -> large drop -> fall -> hit -> splash sequence -> done
  setTimeout(()=>{ bloodSplash && (bloodSplash.style.display='block'); bloodSplash && (bloodSplash.src='assets/blood/01_blood_drop_small.png') }, TIMINGS.bloodDropSmall)
  setTimeout(()=>{ bloodSplash && (bloodSplash.src='assets/blood/02_blood_drop_large.png') }, TIMINGS.bloodDropLarge)
  // fall -> 血の落下（hand は top のまま）
  setTimeout(()=>{ bloodSplash && (bloodSplash.style.display='block'); bloodSplash && (bloodSplash.src='assets/blood/03_blood_fall.png') }, TIMINGS.bloodFall)
    setTimeout(()=>{ 
      if(bloodSplash) (bloodSplash.src='assets/blood/04_blood_hit.png')
      // 再生タイミング: 血がヒットした瞬間に滴下音を鳴らし、魔力を加算してゲージを更新する
      try{ if(seBlood){ seBlood.currentTime = 0; seBlood.play().catch(()=>{}) } }catch(e){}
      try{
        const prevMana = (typeof mana === 'number') ? mana : 0
        const newMana = Math.min(20, prevMana + 2)
        mana = newMana
        // ブレイク判定: 以前は <=10, ここで 10 を超えたら1ブレイク扱いにして因果(karma) を +1 して表示する
        if(prevMana <= 10 && newMana > 10){
          manaBreakHandled = true
          karma = Math.min(3, (typeof karma === 'number' ? karma : 0) + 1)
          // 因果ゲージを即座に表示
          updateGauges()
        } else {
          updateGauges()
        }
        // 血ヒット時に灯りを最大にする（既存のライトアニメを止める）
        try{
          // stop the regular light ping-pong
          if(lightTimer) { clearInterval(lightTimer); lightTimer = null }
          // Create an overlay image for the max-light effect so we don't change the base lightImg styles
          try{
            const hold = (typeof TIMINGS.lightMaxHold === 'number') ? TIMINGS.lightMaxHold : 600
            const fade = (typeof TIMINGS.lightFade === 'number') ? TIMINGS.lightFade : 300
            // Place overlay inside the same parent as lightImg using absolute positioning
            const overlay = document.createElement('img')
            overlay.src = 'assets/light/04_light_max.png'
            overlay.id = 'light-max-overlay'
            overlay.style.pointerEvents = 'none'
            overlay.style.opacity = '1'
            overlay.style.transition = 'opacity ' + (fade/1000) + 's ease'
            // Determine parent to attach overlay so it matches layout of lightImg
            const parentElem = (lightImg && lightImg.parentElement) ? lightImg.parentElement : document.body
            // Ensure parent is positioned so absolute children are positioned relative to it
            let restoreParentPosition = false
            try{
              const cs = window.getComputedStyle(parentElem)
              if(!cs || cs.position === 'static'){
                // store previous inline style to restore later
                parentElem.__prevPosition = parentElem.style.position || ''
                parentElem.style.position = 'relative'
                restoreParentPosition = true
              }
            }catch(e){}
            // Compute offsets relative to parent
            try{
              const w = (lightImg && lightImg.offsetWidth) ? lightImg.offsetWidth : (lightImg && lightImg.getBoundingClientRect ? lightImg.getBoundingClientRect().width : window.innerWidth)
              const h = (lightImg && lightImg.offsetHeight) ? lightImg.offsetHeight : (lightImg && lightImg.getBoundingClientRect ? lightImg.getBoundingClientRect().height : window.innerHeight)
              const left = (lightImg && typeof lightImg.offsetLeft === 'number') ? lightImg.offsetLeft : 0
              const top = (lightImg && typeof lightImg.offsetTop === 'number') ? lightImg.offsetTop : 0
              overlay.style.position = 'absolute'
              overlay.style.left = left + 'px'
              overlay.style.top = top + 'px'
              overlay.style.width = w + 'px'
              overlay.style.height = h + 'px'
              overlay.style.zIndex = '9999'
            }catch(e){
              overlay.style.position = 'absolute'
              overlay.style.left = '0'
              overlay.style.top = '0'
              overlay.style.width = '100%'
              overlay.style.height = '100%'
              overlay.style.zIndex = '9999'
            }
            parentElem.appendChild(overlay)
            // After hold, fade the overlay out and remove it, then resume the normal animation
            setTimeout(()=>{
              try{
                // start fade-out
                overlay.style.opacity = '0'
                setTimeout(()=>{
                  try{ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay) }catch(e){}
                  try{ startAnims() }catch(e){}
                }, fade)
              }catch(e){ try{ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay) }catch(e){} try{ startAnims() }catch(e){} }
            }, hold)
          }catch(e){ try{ startAnims() }catch(e){} }
        }catch(e){}
      }catch(e){}
    }, TIMINGS.bloodHit)
    setTimeout(()=>{ bloodSplash && (bloodSplash.src='assets/blood/05_blood_splash_1.png') }, TIMINGS.bloodSplash1)
    setTimeout(()=>{ bloodSplash && (bloodSplash.src='assets/blood/06_blood_splash_2.png') }, TIMINGS.bloodSplash2)
    setTimeout(()=>{ bloodSplash && (bloodSplash.src='assets/blood/07_blood_splash_3.png') }, TIMINGS.bloodSplash3)
      // 血のスプラッシュ完了（表示のみ）。
      // 手は最上位ポーズ（3）を血表示が終わるまで維持したいので
      // ここでは手のポーズは変更しない（最後の非表示は bloodEnd で行う）
      setTimeout(()=>{ 
        bloodSplash && (bloodSplash.src='assets/blood/08_blood_splash_done.png')
      }, TIMINGS.bloodDone)
      // 最終タイミング: 一度中間ポーズ(2)を短く見せてから先頭ポーズ(1)に戻し、非表示にする
      setTimeout(()=>{
        // 中間ポーズを表示（2）
        bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/02_bhima_blood_mid.png')
        // 少し待ってから先頭ポーズに戻し非表示にする
        // 戻りの中間ポーズ表示時間は front->mid の表示時間に合わせる
        const returnHold = (function(){
          try{
            const front = parseInt(TIMINGS.bloodHandFront,10) || 0
            const mid = parseInt(TIMINGS.bloodHandMid,10) || 0
            const derived = Math.max(50, mid - front)
            return derived || (TIMINGS.bloodReturnHold || 120)
          }catch(e){ return (TIMINGS.bloodReturnHold || 120) }
        })()
        setTimeout(()=>{
          // 先頭ポーズ(1) を表示
          bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/01_bhima_blood_front.png')
          // front を短く表示してから非表示にする
          const frontHold = (function(){ try{ return parseInt(TIMINGS.bloodReturnFrontHold,10) || 120 }catch(e){ return 120 } })()
          setTimeout(()=>{
            bhimaHand && (bhimaHand.style.display='none')
            bloodSplash && (bloodSplash.style.display='none')
            resolve()
          }, frontHold)
        }, returnHold)
      }, TIMINGS.bloodEnd)
    })
  }

  function showWarmSequence(){
    return new Promise((resolve)=>{
      bhimaHand && (bhimaHand.style.display = 'block')
  bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/01_bhima_warm_front.png')
      // Schedule warm sequence using per-frame hold durations
      // cumulative timings (ms)
      const t1 = (typeof TIMINGS.warmFrontHold === 'number') ? TIMINGS.warmFrontHold : 300
      const t2 = (typeof TIMINGS.warmMidHold === 'number') ? TIMINGS.warmMidHold : 300
      const t3 = (typeof TIMINGS.warmHold === 'number') ? TIMINGS.warmHold : 600
      const tr2 = (typeof TIMINGS.warmReturnMidHold === 'number') ? TIMINGS.warmReturnMidHold : 300
      const tr1 = (typeof TIMINGS.warmReturnFrontHold === 'number') ? TIMINGS.warmReturnFrontHold : 300
      const atMid = t1
      const atHold = t1 + t2
      const atReturnMid = t1 + t2 + t3
      const atReturnFront = atReturnMid + tr2
      const atEnd = atReturnFront + tr1

      // front -> mid
      setTimeout(()=>{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/02_bhima_warm_mid.png') }, atMid)
  // mid -> hold (3): play heartbeat SE, show light max overlay, increment temp/gauge here
  setTimeout(()=>{
        try{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/03_bhima_warm_hold.png') }catch(e){}
    // NOTE: do NOT change vessel image during manual warm action
    // Vessel visuals are only altered when vessel breaking logic is triggered.
    // (preserve vessel.src)
        // play heartbeat SE if provided (optional element id: se-heart)
        try{ const seHeart = document.getElementById('se-heart'); if(seHeart){ seHeart.currentTime = 0; seHeart.play().catch(()=>{}) } }catch(e){}
        // light max overlay (reuse the same overlay approach as blood hit)
        try{
          const hold = (typeof TIMINGS.lightMaxHold === 'number') ? TIMINGS.lightMaxHold : 600
          const fade = (typeof TIMINGS.lightFade === 'number') ? TIMINGS.lightFade : 300
          const overlay = document.createElement('img')
          overlay.src = 'assets/light/04_light_max.png'
          overlay.id = 'light-max-overlay-warm'
          overlay.style.pointerEvents = 'none'
          overlay.style.opacity = '1'
          overlay.style.transition = 'opacity ' + (fade/1000) + 's ease'
          const parentElem = (lightImg && lightImg.parentElement) ? lightImg.parentElement : document.body
          try{
            const cs = window.getComputedStyle(parentElem)
            if(!cs || cs.position === 'static'){
              parentElem.__prevPosition = parentElem.style.position || ''
              parentElem.style.position = 'relative'
            }
          }catch(e){}
          try{
            const w = (lightImg && lightImg.offsetWidth) ? lightImg.offsetWidth : (lightImg && lightImg.getBoundingClientRect ? lightImg.getBoundingClientRect().width : window.innerWidth)
            const h = (lightImg && lightImg.offsetHeight) ? lightImg.offsetHeight : (lightImg && lightImg.getBoundingClientRect ? lightImg.getBoundingClientRect().height : window.innerHeight)
            const left = (lightImg && typeof lightImg.offsetLeft === 'number') ? lightImg.offsetLeft : 0
            const top = (lightImg && typeof lightImg.offsetTop === 'number') ? lightImg.offsetTop : 0
            overlay.style.position = 'absolute'
            overlay.style.left = left + 'px'
            overlay.style.top = top + 'px'
            overlay.style.width = w + 'px'
            overlay.style.height = h + 'px'
            overlay.style.zIndex = '9999'
          }catch(e){ overlay.style.position='absolute'; overlay.style.left='0'; overlay.style.top='0'; overlay.style.width='100%'; overlay.style.height='100%'; overlay.style.zIndex='9999' }
          parentElem.appendChild(overlay)
          setTimeout(()=>{
            try{ overlay.style.opacity = '0' }catch(e){}
            setTimeout(()=>{ try{ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay) }catch(e){} }, fade)
          }, hold)
        }catch(e){}
        // increment temp/gauge at this timing
        try{
          const prevTemp = (typeof temp === 'number') ? temp : 0
          temp = Math.min(20, prevTemp + 2)
          updateGauges()
          // If this warm action pushes temp past the vessel-break threshold (previous <=10 and now >10),
          // then immediately increment vessel level and perform the vessel break animation here so it
          // is synchronized with the hand hold frame. We run the break in an async IIFE to allow awaiting
          // performVesselBreak without changing the outer function signature.
          try{
            if(typeof prevTemp === 'number' && prevTemp <= 10 && temp > 10){
              // increment the vessel level now so performVesselBreak knows the correct level
              const newLevel = Math.min(3, (typeof vesselLevel === 'number' ? vesselLevel : 0) + 1)
              vesselLevel = newLevel
              // reflect immediately in UI
              updateGauges()
              // pulse the gauge briefly to highlight the change
              try{ pulseElement(gaugeVessel, 2, (typeof TIMINGS.vesselGlowPulseInterval === 'number' ? TIMINGS.vesselGlowPulseInterval : 150), 0.7) }catch(e){}
              // perform the vessel break sequence now (await inside IIFE)
              ;(async ()=>{ try{ await performVesselBreak(newLevel) }catch(e){} })()
            }
          }catch(e){}
        }catch(e){}
  }, atHold)
      // reset vessel image at return to mid, then run return frames and hide at end
  // do not modify vessel image on manual warm return; breaking logic handles vessel artwork
  // setTimeout(()=>{ try{ vessel && (vessel.src='assets/vessel/02_vessel_base_transparent.png') }catch(e){} }, atReturnMid)
      // show mid on return
      setTimeout(()=>{ try{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/02_bhima_warm_mid.png') }catch(e){} }, atReturnMid)
      // then show front on return
      setTimeout(()=>{ try{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/01_bhima_warm_front.png') }catch(e){} }, atReturnFront)
      // hide hand and resolve at end
      setTimeout(()=>{ try{ bhimaHand && (bhimaHand.style.display='none') }catch(e){} ; resolve() }, atEnd)
    })
  }

  // busy lock（プロローグと同等の .disabled/aria-disabled を付与）
  function setBusy(state, targets){
    try{
      if(state){
        busy = true
        // 対象が指定されていればそのボタン群のみ、未指定なら全 UI ボタンをロック
        let buttons = []
        if(targets){
          buttons = (Array.isArray(targets) ? targets : [targets])
        } else {
          try{ buttons = Array.prototype.slice.call(document.querySelectorAll('.btn-ui')) }catch(e){ buttons = [btnBlood, btnWarm, btnKitchen, btnFollow, btnSleep] }
        }
        _lockedButtons = buttons.filter(Boolean)
        _lockedButtons.forEach(b=>{
          try{ b.classList.add('btn-locked') }catch(e){}
          try{ b.classList.add('disabled') }catch(e){}
          try{ b.setAttribute('aria-disabled','true') }catch(e){}
        })
      } else {
        const toRemove = _lockedButtons.slice(); _lockedButtons = []
        // 少し遅らせてロック解除（視覚的な自然さのため）
        setTimeout(()=>{
          toRemove.forEach(b=>{
            try{ b.classList.remove('btn-locked') }catch(e){}
            try{ b.classList.remove('disabled') }catch(e){}
            try{ b.removeAttribute('aria-disabled') }catch(e){}
          })
        }, 300)
        busy = false
      }
    }catch(e){ busy = !!state }
  }

  // Handle vessel crack visual + sound + dialog sequence for a given level (1..3)
  function performVesselBreak(level){
    return new Promise(async (resolve)=>{
      try{
        // mappings for glow and transparent images
        const glowMap = {
          1: 'assets/vessel/03_vessel_crack1_glow.png',
          2: 'assets/vessel/05_vessel_crack2_glow.png',
          3: 'assets/vessel/07_vessel_crack3_glow.png'
        }
        const transMap = {
          1: 'assets/vessel/04_vessel_crack1_transparent.png',
          2: 'assets/vessel/06_vessel_crack2_transparent.png'
        }

        // hide Duryodhana visuals while vessel glow/dialog shows
        const prevDuryDisplay = {
          frame: duryImg ? duryImg.style.display : '',
          eye: duryEye ? duryEye.style.display : '',
          mouth: duryMouth ? duryMouth.style.display : ''
        }
        try{ if(duryImg) duryImg.style.display = 'none' }catch(e){}
        try{ if(duryEye) duryEye.style.display = 'none' }catch(e){}
        try{ if(duryMouth) duryMouth.style.display = 'none' }catch(e){}

        // show glow image (fade)
        try{
          const fv = (typeof TIMINGS.vesselFadeDuration === 'number') ? TIMINGS.vesselFadeDuration : 300
          if(vessel && glowMap[level]) await fadeImageSrc(vessel, glowMap[level], fv)
        }catch(e){}
        // optional pulsing/blinking while glow is visible (per-stage counts)
        try{
          const pc = (typeof TIMINGS.vesselGlowPulseGlow === 'number') ? TIMINGS.vesselGlowPulseGlow : 0
          const pi = (typeof TIMINGS.vesselGlowPulseInterval === 'number') ? TIMINGS.vesselGlowPulseInterval : 150
          if(pc > 0 && vessel){ await pulseElement(vessel, pc, pi, 0.6) }
        }catch(e){}

  // small delay to ensure glow renders before dialog
  try{ const dd = (typeof TIMINGS.vesselDialogDelay === 'number') ? TIMINGS.vesselDialogDelay : 60; await new Promise(r=>setTimeout(r, dd)) }catch(e){}

        // play crack SE (level 1/2 use seVessel1, level3 use seVessel3) — play once
        try{
          if(level >= 3){ seVessel3 && seVessel3.currentTime === 0; seVessel3 && seVessel3.play().catch(()=>{}) }
          else { seVessel1 && seVessel1.currentTime === 0; seVessel1 && seVessel1.play().catch(()=>{}) }
        }catch(e){}

        // show vessel dialog for this level and wait
        try{ if(showDialogFor){ const p = showDialogFor('utuwa', Math.min(3, level)); if(p && p.then) await p } }catch(e){}

        // after dialog: if level < 3, show transparent cracked vessel and restore Duryodhana
        // pause a bit so the glow+dialog feels natural before switching to the transparent cracked artwork
        if(level < 3){
          try{
            // keep the glow visible briefly so the player sees the effect alongside the dialog
            const hold = (typeof TIMINGS.vesselGlowToTransparentHold === 'number') ? TIMINGS.vesselGlowToTransparentHold : 600
            await new Promise(r=>setTimeout(r, hold))
          }catch(e){}
          try{ const fv2 = (typeof TIMINGS.vesselFadeDuration === 'number') ? TIMINGS.vesselFadeDuration : 300; if(vessel && transMap[level]) await fadeImageSrc(vessel, transMap[level], fv2) }catch(e){}
          // optional pulsing/blinking on the transparent cracked image
          try{
            const pt = (typeof TIMINGS.vesselGlowPulseTransparent === 'number') ? TIMINGS.vesselGlowPulseTransparent : 0
            const pi2 = (typeof TIMINGS.vesselGlowPulseInterval === 'number') ? TIMINGS.vesselGlowPulseInterval : 150
            if(pt > 0 && vessel){ await pulseElement(vessel, pt, pi2, 0.75) }
          }catch(e){}
          // restore dury visuals
          try{ if(duryImg) duryImg.style.display = prevDuryDisplay.frame || '' }catch(e){}
          try{ if(duryEye) duryEye.style.display = prevDuryDisplay.eye || '' }catch(e){}
          try{ if(duryMouth) duryMouth.style.display = prevDuryDisplay.mouth || '' }catch(e){}
          // small pause so player can see the transparent image
          try{ const post = (typeof TIMINGS.vesselPostTransparentPause === 'number') ? TIMINGS.vesselPostTransparentPause : 200; await new Promise(r=>setTimeout(r, post)) }catch(e){}
          resolve()
          return
        }

  // level === 3: keep Duryodhana hidden and transition to broken vessel end after a short delay
  // brief pause then fade out navigate
  try{ const p3 = (typeof TIMINGS.vesselLevel3EndPause === 'number') ? TIMINGS.vesselLevel3EndPause : 600; await new Promise(r=>setTimeout(r, p3)) }catch(e){}
        try{ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('broken_vessel_end.html') } else { location.href = 'broken_vessel_end.html' } }catch(e){ try{ location.href = 'broken_vessel_end.html' }catch(_){} }
        resolve()
      }catch(e){ resolve() }
    })
  }

  // button handlers
  btnBlood && btnBlood.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    setBusy(true, btnBlood)
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
    // アニメ実行前の魔力を覚えておく
    const prev = mana
    // アニメを開始（魔力加算は showBloodSequence の血ヒット時に行われる）
    const animPromise = showBloodSequence()
    // アニメ完了を待つ（手の表示がすべて終わるタイミング）
    await animPromise
    // ここでmanaは showBloodSequence によって更新されている可能性がある
    if(mana > 10){
      // 表示上は最大値に合わせる
      mana = 10
      // もし showBloodSequence 側でブレイク処理を既に行っていなければここで因果を加算する
      if(!manaBreakHandled){
        karma = Math.min(3, karma + 1)
      }
      if(karma >= 3){
        // まず因果ゲージ3のセリフを表示し、その表示開始と同時にSEを鳴らす（タイミングを揃える）
        let dlgP = null
        try{ dlgP = showDialogFor('innga', Math.min(3, karma)) }catch(e){ dlgP = null }
        // ダイアログの表示は showDialogFor 内で即時に開始されるため、ここで直ちにSEを再生する
        try{ if(seCause3){ seCause3.currentTime = 0; seCause3.play().catch(()=>{}) } }catch(e){}
        if(dlgP && dlgP.then) await dlgP
  // 遷移直前は怒り表情にしない。穏やかな閉じ表情へリセットしてから、1フレーム待ってフェードを開始。
  shakeElement(gaugeKarma)
  try{ if(duryEye) duryEye.src = 'assets/character/wayang/07_duryodhana_wayang_eye_closed.png' }catch(e){}
  try{ if(duryMouth) duryMouth.src = 'assets/character/wayang/09_duryodhana_wayang_mouth_closed_smile.png' }catch(e){}
  // UIロック＆ナビゲーションガードを立て、表情更新を確実に描画させてからフェードアウト
  try{ _navigating = true; setBusy(true) }catch(e){}
  try{ await new Promise(r=>{ requestAnimationFrame(()=> setTimeout(r, 20)) }) }catch(e){}
  if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('distorted_end.html') } else { location.href = 'distorted_end.html' }
        updateGauges()
        // reset break flag for next interactions (safety)
        manaBreakHandled = false
        return
      }
      seCause1 && seCause1.play().catch(()=>{})
      shakeElement(gaugeKarma)
      // show 因果 dialog — 手の表示が終わった後に表示
      try{
        const p = showDialogFor('innga', Math.min(3, karma))
        if(p && p.then) await p
      }catch(e){}
      // reset break flag for next interactions
      manaBreakHandled = false
      setBusy(false)
    } else {
      // 魔力が増えて閾値を超えた場合のみダイアログを表示
  // collect any dialog promises so we can wait for them before unlocking
  const dlgPromises = []
  try{ if(prev < 6 && mana >=6) { const p = showDialogFor('mana', 6); dlgPromises.push(p) } }catch(e){}
  try{ if(prev < 8 && mana >=8) { const p = showDialogFor('mana', 8); dlgPromises.push(p) } }catch(e){}
  try{ if(prev < 10 && mana >=10) { const p = showDialogFor('mana', 10); dlgPromises.push(p) } }catch(e){}
  try{ if(dlgPromises.length) await Promise.all(dlgPromises.map(p=>p && p.then ? p : Promise.resolve())) }catch(e){}
  // ensure break flag cleared
  manaBreakHandled = false
  setBusy(false)
    }
    updateGauges()
  })

  btnWarm && btnWarm.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    setBusy(true, btnWarm)
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
  const animPromise = showWarmSequence()
  const prev = temp
  // wait for warm sequence (which increments `temp` at the hold frame)
  try{ await animPromise }catch(e){}
  // After the warm sequence completes, cap displayed temp and show any temp-related dialogs.
  try{ if(temp > 10) temp = 10 }catch(e){}
  const dlgPromises = []
  try{ if(prev < 6 && temp >=6) { const p = showDialogFor('temp', 6); dlgPromises.push(p) } }catch(e){}
  try{ if(prev < 8 && temp >=8) { const p = showDialogFor('temp', 8); dlgPromises.push(p) } }catch(e){}
  try{ if(prev < 10 && temp >=10) { const p = showDialogFor('temp', 10); dlgPromises.push(p) } }catch(e){}
  try{ if(dlgPromises.length) await Promise.all(dlgPromises.map(p=>p && p.then ? p : Promise.resolve())) }catch(e){}
  setBusy(false)
  updateGauges()
  })

  async function doTransitionCheck(target){
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
    // 遷移処理中は追加の入力を受け付けない（プロローグ準拠）
    _navigating = true
    try{ setBusy(true) }catch(e){}
    // start fade
    if(window.transitionAPI && window.transitionAPI.fadeOutThen){ window.transitionAPI.fadeOutThen(()=>{}, 400) } else { screen && screen.classList.remove('visible') }
    // Wait for fade to visually complete before deciding next action
    setTimeout(async ()=>{
      const okMana = (mana >=8)
      const okTemp = (temp >=8)
      if(okMana && okTemp){
        // normal path -> start
        if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else { location.href = 'start.html' }
        return
      }
      // insufficient gauges -> missed_end. Play exit SE then action-specific SE then navigate.
      try{
        // Play only the action-specific SE (user requirement: SE is determined by action/day)
        if(target === 'kitchen'){
          await playAudioWithMuteCue(seTyuubou, '厨房へ行く')
        } else if(target === 'follow'){
          await playAudioWithMuteCue(seMasuta, 'マスターに同行')
        }
      }catch(e){}
      try{ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('missed_end.html') } else { location.href = 'missed_end.html' } }catch(e){ try{ location.href = 'missed_end.html' }catch(_){} }
    }, 450)
  }

  // start day-send sequence (action: 'kitchen'|'follow')
  async function startDaySend(action){
    try{
      setBusy(true)
      try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
      // stop BGM when entering day-send (remember previous playing state)
      try{ if(bgm){ bgmWasPlayingBeforeDaySend = !bgm.paused; bgm.pause(); } }catch(e){}
      // fade out
      try{ if(window.transitionAPI && window.transitionAPI.fadeOutThen) window.transitionAPI.fadeOutThen(()=>{}, 400); else if(screen && screen.classList) screen.classList.remove('visible') }catch(e){}
      // wait for fade
      await new Promise(r=>setTimeout(r, 450))
      // play exit SE (退室)
      try{
        // Play only the action-specific SE (user requirement: SE is determined by action/day)
        if(action === 'kitchen'){
          await playAudioWithMuteCue(seTyuubou, '厨房へ行く')
        } else if(action === 'follow'){
          await playAudioWithMuteCue(seMasuta, 'マスターに同行')
        }
      }catch(e){}
      // NOTE: previously we navigated immediately for day 5 here.
      // Changed behavior: play exit SE + action SE, then fade IN, show day-send dialog,
      // and AFTER the dialog has finished, navigate to the true end.
      // fade in and show day-send dialog (use hiokuri day-send images)
      try{ requestAnimationFrame(()=> setTimeout(()=> screen && screen.classList.add('visible'), 20)) }catch(e){}
      // hide primary buttons and action buttons while dialog shows
      try{ if(btnKitchen) btnKitchen.style.display='none'; if(btnFollow) btnFollow.style.display='none'; if(btnBlood) btnBlood.style.display='none'; if(btnWarm) btnWarm.style.display='none' }catch(e){}
      // wait until fade-in finishes, then show day-send dialog image (hiokuri) for the current day
      try{ await waitForFadeIn() }catch(e){}
      // wait 2 seconds after fade-in before showing the dialog image
      try{ await new Promise(r=>setTimeout(r, 2000)) }catch(e){}
      try{
  const hiokuriPath = hiokuriMap[day] || hiokuriMap[5]
  // fade in
  try{ await fadeInGrowDialog(hiokuriPath, 300) }catch(e){}
  // animate Duryodhana's eye during the hiokuri display so it blinks while the dialog is visible
  try{ animateDuryEyeFor(TIMINGS.hiokuriDisplay) }catch(e){}
  // keep visible for display duration (configurable via TIMINGS.hiokuriDisplay)
  await new Promise(r=>setTimeout(r, TIMINGS.hiokuriDisplay))
        // fade out
        try{ await fadeOutGrowDialog(300) }catch(e){}
      }catch(e){}
      // after dialog: if this was Day 5 and the player took the kitchen action,
      // transition to the true end. Otherwise, show the sleep button to continue.
      try{
        if(day === 5 && action === 'kitchen'){
          // unlock UI briefly then navigate out
          setBusy(false)
          try{ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('true_end.html') } else { location.href = 'true_end.html' } }catch(e){ try{ location.href = 'true_end.html' }catch(_){} }
          return
        }
      }catch(e){}
      // not Day 5/kitchen: show sleep button to continue
      try{ if(btnSleep) btnSleep.style.display = '' }catch(e){}
      setBusy(false)
    }catch(e){ setBusy(false) }
  }

  // primary action handlers: if gauges meet threshold, run day-send; otherwise fallback to existing transition check
  btnKitchen && btnKitchen.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
    const okMana = (mana >= 8)
    const okTemp = (temp >= 8)
    // kitchen is primary on day 1 and day 5
    // treat day 3 as a kitchen-primary day as well
    if(okMana && okTemp && (day === 1 || day === 3 || day === 5)){
      await startDaySend('kitchen')
      return
    }
    // If we are falling back to the transition check (insufficient gauges),
    // stop the BGM immediately at the moment of button press so audio state
    // matches the day-send behavior.
    try{ if(bgm){ bgm.pause(); try{ bgm.currentTime = 0 }catch(e){} } }catch(e){}
    doTransitionCheck('kitchen')
  })

  btnFollow && btnFollow.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
    const okMana = (mana >= 8)
    const okTemp = (temp >= 8)
    // follow is primary on days 2-4
    // follow should be primary only on days 2 and 4 (day 3 is kitchen)
    if(okMana && okTemp && (day === 2 || day === 4)){
      await startDaySend('follow')
      return
    }
    // If we are falling back to the transition check (insufficient gauges),
    // stop the BGM immediately at the moment of button press so audio state
    // matches the day-send behavior.
    try{ if(bgm){ bgm.pause(); try{ bgm.currentTime = 0 }catch(e){} } }catch(e){}
    doTransitionCheck('follow')
  })

  // sleep button: advances to next day
  btnSleep && btnSleep.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    setBusy(true)
    // Immediately suppress automatic dialogs to avoid any scheduled/queued dialog
    // firing during the sleep fade-out/fade-in sequence.
    try{
      const SUPPRESS_MS = 3000
      suppressInngaUntil = Date.now() + SUPPRESS_MS
      suppressAutoDialogsUntil = Date.now() + SUPPRESS_MS
      try{ window.__growDialogsSuppressed = true; setTimeout(()=>{ try{ window.__growDialogsSuppressed = false }catch(e){} }, SUPPRESS_MS + 200) }catch(e){}
    }catch(e){}
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
  // extend fade duration for sleep sequence: make fade-out/in slightly longer
  try{ if(screen && screen.classList){ screen.classList.add('sleep-fade') } }catch(e){}
  try{ if(window.transitionAPI && window.transitionAPI.fadeOutThen) window.transitionAPI.fadeOutThen(()=>{}, 800); else if(screen && screen.classList) screen.classList.remove('visible') }catch(e){}
  // wait slightly longer than the transition so subsequent actions run after fade completes
  await new Promise(r=>setTimeout(r, 850))
  try{ await playAudioElement(seSleepBed) }catch(e){}
    // advance day and fade in
    try{ setDay(day + 1) }catch(e){}
    try{ requestAnimationFrame(()=> setTimeout(()=> screen && screen.classList.add('visible'), 20)) }catch(e){}
  // resume BGM after fade-in if it was playing before day-send
  try{ await waitForFadeIn() }catch(e){}
  try{ if(bgmWasPlayingBeforeDaySend && bgm){ bgm.currentTime = 0; const p = bgm.play(); if(p && p.then) p.catch(()=>{}); } }catch(e){}
  bgmWasPlayingBeforeDaySend = false
  // restore original screen transition (remove temporary class)
  try{ if(screen && screen.classList) screen.classList.remove('sleep-fade') }catch(e){}
    // ensure sleep button hidden after advancing
    try{ if(btnSleep) btnSleep.style.display = 'none' }catch(e){}
    // clear any residual dialog image (avoid stale innga/hiokuri showing immediately)
  try{ if(growDialog){ growDialog.style.opacity = '0'; growDialog.style.display = 'none'; setGrowDialogSrc(''); try{ growDialog.classList.remove('shake','horror','horizontal','micro') }catch(e){} } }catch(e){}
    // show any immediate dialog for new day (delayed slightly to avoid visual clash with fade)
    try{
      // suppress all automatic dialogs for a short window so no dialog (mana/temp/innga/utuwa)
      // flashes immediately after the sleep fade-in. Use suppressAutoDialogsUntil as the
      // authoritative guard; keep suppressInngaUntil for backward compatibility.
  const SUPPRESS_MS = 3000
  suppressInngaUntil = Date.now() + SUPPRESS_MS
  suppressAutoDialogsUntil = Date.now() + SUPPRESS_MS
  // Schedule showAutoDialog to run after the suppression window has passed.
  try{ window.__growDialogsSuppressed = true; setTimeout(()=>{ try{ window.__growDialogsSuppressed = false }catch(e){} }, SUPPRESS_MS + 200) }catch(e){}
  setTimeout(()=>{ try{ showAutoDialog() }catch(e){} }, SUPPRESS_MS + 100)
    }catch(e){}
    setBusy(false)
  })

  document.addEventListener('DOMContentLoaded', ()=>{
    updateGauges();
    // reduce bgm playback volume to 0.8x for bgm_normal_piano
    try{ if(bgm) bgm.volume = 0.8 }catch(e){}
    playBgmIfNeeded();
    // preload assets to ensure blood/hand frames are ready
    try{ preloadAssets(PRELOAD_ASSETS) }catch(e){}
  // amplify heartbeat SE ~3.5x so it's more audible during warm sequence
  try{ amplifyAudioElement('se-heart', 5) }catch(e){}
  // set cause-break SEs back to unity gain
  try{ amplifyAudioElement('se-cause-break1', 1.0) }catch(e){}
  try{ amplifyAudioElement('se-cause-break3', 1.0) }catch(e){}
  // amplify vessel-crack SEs (器ゲージの割れSE) by ~1.5x
  try{ amplifyAudioElement('se-vessel-crack1', 1.5) }catch(e){}
  try{ amplifyAudioElement('se-vessel-crack3', 1.5) }catch(e){}
    startAnims(); try{ if(screen && screen.classList) { requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20)) } }catch(e){}
  // show initial dialog based on current gauges/day
  try{ showPrimaryActionForDay() }catch(e){}
  // Ensure default pulse interval exists
  try{ TIMINGS.vesselGlowPulseInterval = TIMINGS.vesselGlowPulseInterval || 150 }catch(e){}
  setTimeout(()=>{ try{ showAutoDialog() }catch(e){} }, 600)
  })

  // (タイミング調整パネルは廃止されました)

  window.growSceneInit = function(){ updateGauges(); try{ if(bgm){ bgm.currentTime = 0; const p = bgm.play(); if(p && p.then){ p.catch(()=>{ try{ if(document.getElementById('audio-unlock')) return; const o = document.createElement('div'); o.id='audio-unlock'; o.style.position='fixed'; o.style.left='0'; o.style.top='0'; o.style.right='0'; o.style.bottom='0'; o.style.display='flex'; o.style.alignItems='center'; o.style.justifyContent='center'; o.style.background='rgba(0,0,0,0.5)'; o.style.zIndex='9999'; const btn=document.createElement('button'); btn.textContent='音を再生する'; btn.style.fontSize='20px'; btn.style.padding='12px 20px'; btn.addEventListener('click', ()=>{ try{ bgm.play().catch(()=>{}) }catch(e){} try{ seButton && seButton.play().catch(()=>{}) }catch(e){} if(o && o.parentElement) o.parentElement.removeChild(o) }); o.appendChild(btn); document.body.appendChild(o) }catch(e){} }) } } }catch(e){} startAnims() }
  window.growSceneInit = function(){ updateGauges(); try{ if(bgm){ bgm.volume = 0.8; bgm.currentTime = 0; const p = bgm.play(); if(p && p.then){ p.catch(()=>{ try{ if(document.getElementById('audio-unlock')) return; const o = document.createElement('div'); o.id='audio-unlock'; o.style.position='fixed'; o.style.left='0'; o.style.top='0'; o.style.right='0'; o.style.bottom='0'; o.style.display='flex'; o.style.alignItems='center'; o.style.justifyContent='center'; o.style.background='rgba(0,0,0,0.5)'; o.style.zIndex='9999'; const btn=document.createElement('button'); btn.textContent='音を再生する'; btn.style.fontSize='20px'; btn.style.padding='12px 20px'; btn.addEventListener('click', ()=>{ try{ bgm.play().catch(()=>{}) }catch(e){} try{ seButton && seButton.play().catch(()=>{}) }catch(e){} if(o && o.parentElement) o.parentElement.removeChild(o) }); o.appendChild(btn); document.body.appendChild(o) }catch(e){} }) } } }catch(e){} startAnims() }

  window.growSceneStop = function(){ stopAnims() }

  // フェードアウトして遷移するユーティリティ（既存の transitionAPI.fadeOutNavigate が無ければフォールバック実装を提供）
  if(!window.transitionAPI) window.transitionAPI = {}
  if(!window.transitionAPI.fadeOutNavigate){
    window.transitionAPI.fadeOutNavigate = function(url, ms){
      try{
        const duration = typeof ms === 'number' ? ms : 400
        // 既にオーバーレイがある場合は再利用
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
        // トリガー
        // force reflow
        void o.offsetWidth
        o.style.opacity = '1'
        setTimeout(()=>{ try{ location.href = url }catch(e){ location.href = url } }, duration)
      }catch(e){ try{ location.href = url }catch(_){} }
    }
  }

})();
