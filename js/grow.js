/*
  grow.js
  - 育成画面の主なロジック
  - 灯り・ドゥリーヨダナのアニメ、ボタン処理、ゲージ管理、SE/BGM 再生、エンド判定の土台を提供します。
*/

;(function(){
  'use strict'

  // DOM cache
  const screen = document.getElementById('screen')
  const lightImg = document.getElementById('light-frame')
  const duryImg = document.getElementById('duryodhana-frame')
  const duryEye = document.getElementById('duryodhana-eye')
  const duryMouth = document.getElementById('duryodhana-mouth')
  const vessel = document.getElementById('vessel')
  const bhimaHand = document.getElementById('bhima-hand')
  const bloodSplash = document.getElementById('blood-splash')
  const dayLabel = document.getElementById('day-label')

  const gaugeKarma = document.getElementById('gauge-karma')
  const gaugeVessel = document.getElementById('gauge-vessel')
  const gaugeMana = document.getElementById('gauge-mana')
  const gaugeTemp = document.getElementById('gauge-temp')

  const btnBlood = document.getElementById('btn-blood')
  const btnWarm = document.getElementById('btn-warm')
  const btnKitchen = document.getElementById('btn-kitchen')
  const btnFollow = document.getElementById('btn-follow')

  // Audio
  const bgm = document.getElementById('bgm')
            // debug 出力（削除済み）
  const seCause1 = document.getElementById('se-cause-break1')
  const seCause3 = document.getElementById('se-cause-break3')
  const seVessel1 = document.getElementById('se-vessel-crack1')
  const seVessel3 = document.getElementById('se-vessel-crack3')
  // commonly used SE elements that are referenced throughout the file
  const seButton = document.getElementById('se-button')
  const seBlood = document.getElementById('se-blood-drop')
  const seHeart = document.getElementById('se-heart')


  // state
  let day = 1
  let mana = 2
  let temp = 2
          
  let vesselLevel = 0
  // 因果 (karma) の状態: 0 は未表示、1..3 がゲージ段階
  let karma = 0
  // internal flag: whether a mana->karma "break" was already handled during the current animation
  let manaBreakHandled = false

  // animation frames
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
  let lightIndex = 0
  let duryIndex = 0
  let lightTimer = null
  let duryTimer = null

  // --- 画像プリロード（ちらつき防止）
  // ビーマの手（血を与える）3枚と血エフェクト、温め用の手画像を事前に読み込む
  const PRELOAD_ASSETS = [
    'assets/bhima_hand/feeding/01_bhima_blood_front.png',
    'assets/bhima_hand/feeding/02_bhima_blood_mid.png',
    'assets/bhima_hand/feeding/03_bhima_blood_top.png',
    'assets/blood/03_blood_fall.png',
    'assets/blood/01_blood_drop_small.png',
    'assets/blood/02_blood_drop_large.png',
    'assets/blood/04_blood_hit.png',
    'assets/blood/05_blood_splash_1.png',
    'assets/blood/06_blood_splash_2.png',
    'assets/blood/07_blood_splash_3.png',
    'assets/blood/08_blood_splash_done.png',
  'assets/bhima_hand/warming/01_bhima_warm_front.png',
    'assets/bhima_hand/warming/02_bhima_warm_mid.png',
    'assets/bhima_hand/warming/03_bhima_warm_hold.png'
  ]
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

  function showDialogFor(type, level){
    // Returns a Promise that resolves when the dialog hide timeout completes.
    return new Promise((resolve)=>{
      let src = ''
      if(type === 'mana') src = (maryokuMap[day] && maryokuMap[day][level]) || ''
      if(type === 'temp') src = (taionnMap[day] && taionnMap[day][level]) || ''
      if(type === 'innga') src = inngaMap[level] || ''
      if(type === 'utuwa') src = utuwaMap[level] || ''
      if(!src){ resolve(); return }
      try{
        if(!growDialog){ resolve(); return }
        growDialog.src = src
        growDialog.style.display = 'block'
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
            // 通常ダイアログ時は目アニメ（7->6->5->4->5->6->7）を行う
            if(duryEye){
              const eyeFrames = [
                'assets/character/wayang/07_duryodhana_wayang_eye_closed.png',
                'assets/character/wayang/06_duryodhana_wayang_eye_half.png',
                'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png',
                'assets/character/wayang/04_duryodhana_wayang_eye_open_clear.png',
                'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png',
                'assets/character/wayang/06_duryodhana_wayang_eye_half.png',
                'assets/character/wayang/07_duryodhana_wayang_eye_closed.png'
              ]
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
        // show for dialogDur ms then hide and resolve
        setTimeout(()=>{ try{ growDialog.style.display = 'none'; growDialog.src = '' }catch(e){} ; resolve() }, 1400)
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
    if(karma > 0){ showDialogFor('innga', Math.min(3, karma)); return }
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
        const doCrossfade = function(){
          try{
            const parent = el.parentElement || document.body
            // create overlay image positioned over el
            const overlay = document.createElement('img')
            overlay.src = newSrc
            overlay.style.pointerEvents = 'none'
            overlay.style.opacity = '0'
            overlay.style.transition = 'opacity ' + (duration/1000) + 's ease'
            overlay.style.position = 'absolute'
            try{
              // compute bounding box of el relative to parent
              const elRect = el.getBoundingClientRect()
              const parentRect = parent.getBoundingClientRect()
              const left = elRect.left - parentRect.left
              const top = elRect.top - parentRect.top
              overlay.style.left = left + 'px'
              overlay.style.top = top + 'px'
              overlay.style.width = elRect.width + 'px'
              overlay.style.height = elRect.height + 'px'
            }catch(e){
              overlay.style.left = '0'; overlay.style.top = '0'; overlay.style.width = el.width + 'px'; overlay.style.height = el.height + 'px'
            }
            overlay.style.zIndex = '9999'
            // ensure parent is positioned relatively so absolute overlay aligns
            let restoreParentPos = false
            try{
              const cs = window.getComputedStyle(parent)
              if(!cs || cs.position === 'static'){
                parent.__prevPosition = parent.style.position || ''
                parent.style.position = 'relative'
                restoreParentPos = true
              }
            }catch(e){}
            parent.appendChild(overlay)
            // force reflow then fade overlay in
            try{ void overlay.offsetWidth }catch(e){}
            overlay.style.opacity = '1'
            // after fade completes, set el.src to newSrc and remove overlay
            setTimeout(()=>{
              try{ el.src = newSrc }catch(e){}
              try{ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay) }catch(e){}
              try{ if(restoreParentPos) parent.style.position = parent.__prevPosition || '' }catch(e){}
              resolve()
            }, duration + 20)
          }catch(e){ resolve() }
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
    }, 500)
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

  // busy lock
  let busy = false
  let _lockedButtons = []
  function setBusy(state, targets){
    if(state){
      busy = true
      const buttons = targets ? (Array.isArray(targets) ? targets : [targets]) : [btnBlood, btnWarm, btnKitchen, btnFollow]
      _lockedButtons = buttons.filter(Boolean)
      _lockedButtons.forEach(b => b.classList.add('btn-locked'))
    } else {
      const toRemove = _lockedButtons.slice(); _lockedButtons = []
      setTimeout(()=> toRemove.forEach(b=>b.classList.remove('btn-locked')), 300)
      busy = false
    }
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

        // play crack SE (level 1/2 use seVessel1, level3 use seVessel3)
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
        try{ if(seVessel3) seVessel3.play().catch(()=>{}) }catch(e){}
  // brief pause then fade out navigate
  try{ const p3 = (typeof TIMINGS.vesselLevel3EndPause === 'number') ? TIMINGS.vesselLevel3EndPause : 600; await new Promise(r=>setTimeout(r, p3)) }catch(e){}
        try{ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('broken_vessel_end.html') } else { location.href = 'broken_vessel_end.html' } }catch(e){ try{ location.href = 'broken_vessel_end.html' }catch(_){} }
        resolve()
      }catch(e){ resolve() }
    })
  }

  // button handlers
  btnBlood && btnBlood.addEventListener('click', async (e)=>{
    if(busy) return
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
        // まず因果ゲージ3のセリフを表示してから怒り演出・終了へ移行する
        let dlgP = null
        try{ dlgP = showDialogFor('innga', Math.min(3, karma)) }catch(e){ dlgP = null }
        if(dlgP && dlgP.then) await dlgP
        try{ seCause3 && seCause3.play().catch(()=>{}) }catch(e){}
        // show anger visuals and navigate to end
        if(duryEye) duryEye.src = 'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png'
        if(duryMouth) duryMouth.src = 'assets/character/wayang/10_duryodhana_wayang_mouth_open_angry.png'
        shakeElement(gaugeKarma)
        await new Promise(r=>setTimeout(r, 800))
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
    if(busy) return
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
    if(window.transitionAPI && window.transitionAPI.fadeOutThen){ window.transitionAPI.fadeOutThen(()=>{}, 400) } else { screen && screen.classList.remove('visible') }
    setTimeout(()=>{
      const okMana = (mana >=8)
      const okTemp = (temp >=8)
  if(okMana && okTemp){ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else { location.href = 'start.html' } }
      else { if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('missed_end.html') } else { location.href = 'missed_end.html' } }
    }, 450)
  }

  btnKitchen && btnKitchen.addEventListener('click', ()=>doTransitionCheck('kitchen'))
  btnFollow && btnFollow.addEventListener('click', ()=>doTransitionCheck('follow'))

  document.addEventListener('DOMContentLoaded', ()=>{
    updateGauges(); playBgmIfNeeded();
    // preload assets to ensure blood/hand frames are ready
    try{ preloadAssets(PRELOAD_ASSETS) }catch(e){}
  // amplify heartbeat SE ~2.5x so it's more audible during warm sequence
  try{ amplifyAudioElement('se-heart', 2.5) }catch(e){}
  // set cause-break SEs back to unity gain
  try{ amplifyAudioElement('se-cause-break1', 1.0) }catch(e){}
  try{ amplifyAudioElement('se-cause-break3', 1.0) }catch(e){}
  // amplify vessel-crack SEs (器ゲージの割れSE) by ~1.5x
  try{ amplifyAudioElement('se-vessel-crack1', 1.5) }catch(e){}
  try{ amplifyAudioElement('se-vessel-crack3', 1.5) }catch(e){}
    startAnims(); try{ if(screen && screen.classList) { requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20)) } }catch(e){}
  // show initial dialog based on current gauges/day
  // Ensure default pulse interval exists
  try{ TIMINGS.vesselGlowPulseInterval = TIMINGS.vesselGlowPulseInterval || 150 }catch(e){}
  setTimeout(()=>{ try{ showAutoDialog() }catch(e){} }, 600)
  })

  // (タイミング調整パネルは廃止されました)

  window.growSceneInit = function(){ updateGauges(); try{ if(bgm){ bgm.currentTime = 0; const p = bgm.play(); if(p && p.then){ p.catch(()=>{ try{ if(document.getElementById('audio-unlock')) return; const o = document.createElement('div'); o.id='audio-unlock'; o.style.position='fixed'; o.style.left='0'; o.style.top='0'; o.style.right='0'; o.style.bottom='0'; o.style.display='flex'; o.style.alignItems='center'; o.style.justifyContent='center'; o.style.background='rgba(0,0,0,0.5)'; o.style.zIndex='9999'; const btn=document.createElement('button'); btn.textContent='音を再生する'; btn.style.fontSize='20px'; btn.style.padding='12px 20px'; btn.addEventListener('click', ()=>{ try{ bgm.play().catch(()=>{}) }catch(e){} try{ seButton && seButton.play().catch(()=>{}) }catch(e){} if(o && o.parentElement) o.parentElement.removeChild(o) }); o.appendChild(btn); document.body.appendChild(o) }catch(e){} }) } } }catch(e){} startAnims() }

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
