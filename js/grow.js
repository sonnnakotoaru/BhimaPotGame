;(function(){
  'use strict'

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

      const existing = document.getElementById('muted-cue-style')
      try{ if(existing && existing.parentElement) existing.parentElement.removeChild(existing) }catch(e){}

    }catch(e){}
  }

  function ensureMutedCueStyle(){
    try{
      if(document.getElementById('muted-cue-style')) return
      const s = document.createElement('style')
      s.id = 'muted-cue-style'
      const animMs = Number(growMutedCueConfig.animationDuration) || 1400

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

  async function playAudioWithMuteCue(el, cueText){
    try{
      if(!el) return await playAudioElement(el)
      const cue = showMutedCue(cueText)
      try{ await playAudioElement(el) }catch(e){}
      try{ hideMutedCue() }catch(e){}
    }catch(e){ try{ hideMutedCue() }catch(_){} }
  }

  window.setMutedCueConfig = setMutedCueConfig

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

  let day = 1
  let mana = 2
  let temp = 2
  let karma = 0
  let vesselLevel = 0
  let suppressAutoDialogsUntil = 0

  let manaBreakHandled = false

  let bgmWasPlayingBeforeDaySend = false
  let busy = false
  let _lockedButtons = []

  let _navigating = false

  let lightTimer = null
  let duryTimer = null

  const lightImg = lightFrame
  const duryImg = duryodhana
  let lightIndex = 0
  let duryIndex = 0

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

  const seBlood = seBloodDrop
  const seCause1 = seCauseBreak1
  const seCause3 = seCauseBreak3
  const seVessel1 = seVesselCrack1
  const seVessel3 = seVesselCrack3
  const seMasuta = seMasutaNigou

  window.PRELOAD_ASSETS = window.PRELOAD_ASSETS || []

  PRELOAD_ASSETS.push(
    'assets/ui_text/grow/hiokuri/01.png',
    'assets/ui_text/grow/hiokuri/02.png',
    'assets/ui_text/grow/hiokuri/03.png',
    'assets/ui_text/grow/hiokuri/04.png',
    'assets/ui_text/grow/hiokuri/05.png'
  )
  function preloadAssets(list){ try{ list.forEach(s=>{ const i=new Image(); i.src = s }) }catch(e){} }

  const TIMINGS = {

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

  lightMaxHold: 900,

  lightFade: 300,

  bloodReturnHold: 500,

  bloodReturnFrontHold: 300,

  warmFrontHold: 200,         // frame 1 表示時間
  warmMidHold: 200,           // frame 2 表示時間
  warmHold: 1600,              // frame 3 (hold) 表示時間
  warmReturnMidHold: 200,     // 戻りの frame 2 表示時間
  warmReturnFrontHold: 200,   // 戻りの frame 1 表示時間

  warmEnd: 0
  ,

  vesselGlowPulseGlow: 0,
  vesselGlowPulseTransparent: 0,
  vesselGlowPulseInterval: 150

  ,vesselFadeDuration: 160
  ,vesselDialogDelay: 30
  ,vesselGlowToTransparentHold: 300
  ,vesselPostTransparentPause: 120
  ,vesselLevel3EndPause: 300

  ,hiokuriDisplay: 3000

  ,inngaUtuwaDisplay: 2200

  ,duryBlinkClosedRepeats: 2

  ,duryBlinkOpenRepeats: 3
  }

  window.growTimings = TIMINGS

  function updateGauges(){
    const manaMap = {2:'assets/ui_gauge/grow/mana/01_ui_gauge_lv2.png',4:'assets/ui_gauge/grow/mana/02_ui_gauge_lv4.png',6:'assets/ui_gauge/grow/mana/03_ui_gauge_lv6.png',8:'assets/ui_gauge/grow/mana/04_ui_gauge_lv8.png',10:'assets/ui_gauge/grow/mana/05_ui_gauge_lv10_max.png'}
    const tempMap = {2:'assets/ui_gauge/grow/temp/01_ui_gauge_lv2.png',4:'assets/ui_gauge/grow/temp/02_ui_gauge_lv4.png',6:'assets/ui_gauge/grow/temp/03_ui_gauge_lv6.png',8:'assets/ui_gauge/grow/temp/04_ui_gauge_lv8.png',10:'assets/ui_gauge/grow/temp/05_ui_gauge_lv10_max.png'}
  const karmaMap = {1:'assets/ui_gauge/grow/karma/01_ui_gauge_lv1.png',2:'assets/ui_gauge/grow/karma/02_ui_gauge_lv2.png',3:'assets/ui_gauge/grow/karma/03_ui_gauge_lv3_max.png'}
  const vesselMap = {1:'assets/ui_gauge/grow/vessel/01_ui_gauge_lv1.png',2:'assets/ui_gauge/grow/vessel/02_ui_gauge_lv2.png',3:'assets/ui_gauge/grow/vessel/03_ui_gauge_lv3_max.png'}

    gaugeMana && (gaugeMana.src = manaMap[Math.min(10, Math.max(2, Math.floor(mana/2)*2))] )
    gaugeTemp && (gaugeTemp.src = tempMap[Math.min(10, Math.max(2, Math.floor(temp/2)*2))] )

    if(gaugeKarma){
      try{
        const k = parseInt(karma, 10) || 0
        const kClamped = Math.max(0, Math.min(3, k))
        if(kClamped <= 0){
          gaugeKarma.style.display = 'none'
        } else {
          const img = karmaMap[kClamped]

          try{ if(window && window.console && console.debug) console.debug('[updateGauges] karma=', karma, 'parsed=', kClamped, 'img=', img) }catch(e){}
          gaugeKarma.style.display = 'block'
          if(img) gaugeKarma.src = img

          try{
            try{ gaugeKarma.classList.remove('shake','horror','horizontal','micro') }catch(e){}
            try{ void gaugeKarma.offsetWidth }catch(e){}
            if(kClamped >= 3){
              gaugeKarma.classList.add('shake','horror')
              setTimeout(()=>{ try{ gaugeKarma.classList.remove('shake','horror') }catch(e){} }, 800)
            }

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

        try{
          try{ gaugeVessel.classList.remove('shake','horror','horizontal','micro') }catch(e){}
          try{ void gaugeVessel.offsetWidth }catch(e){}
          if(typeof vesselLevel === 'number' && vesselLevel >= 3){
            gaugeVessel.classList.add('shake','horror')
            setTimeout(()=>{ try{ gaugeVessel.classList.remove('shake','horror') }catch(e){} }, 800)
          }

        }catch(e){}
      }
    }
  }

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

  function setGrowDialogSrc(src){
    try{
      if(!growDialog) return

      if(!src){ try{ growDialog.src = '' }catch(e){} ; return }

      if(Date.now() < suppressAutoDialogsUntil) return
      try{ growDialog.src = src }catch(e){}
    }catch(e){}
  }

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

  const dayLabelMap = {
    1: 'assets/ui_text/grow/day_label/01_ui_day_label_01.png',
    2: 'assets/ui_text/grow/day_label/02_ui_day_label_02.png',
    3: 'assets/ui_text/grow/day_label/03_ui_day_label_03.png',
    4: 'assets/ui_text/grow/day_label/04_ui_day_label_04.png',
    5: 'assets/ui_text/grow/day_label/05_ui_day_label_05.png'
  }

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

    mana = 2; temp = 2
    updateGauges()

    showPrimaryActionForDay()

    try{ if(btnBlood) btnBlood.style.display = ''; if(btnWarm) btnWarm.style.display = '' }catch(e){}
  }

  function showPrimaryActionForDay(){

    try{

      if(btnKitchen) btnKitchen.style.display = (day===1 || day===3 || day===5) ? '' : 'none'
      if(btnFollow) btnFollow.style.display = (day===2 || day===4) ? '' : 'none'

      if(btnSleep) btnSleep.style.display = 'none'
    }catch(e){}
  }

  function playAudioElement(el){
    return new Promise((resolve)=>{
      try{
        if(!el) return resolve()
        try{ el.currentTime = 0 }catch(e){}
        const p = el.play()
        let resolved = false
        const onEnd = ()=>{ if(resolved) return; resolved = true; try{ el.removeEventListener('ended', onEnd) }catch(e){}; resolve() }
        try{ el.addEventListener('ended', onEnd) }catch(e){}

        const fallback = Math.max(800, (el.duration && isFinite(el.duration) ? Math.round(el.duration*1000) : 800))
        setTimeout(()=> onEnd(), fallback + 50)
        if(p && p.then) p.catch(()=>{})
      }catch(e){ resolve() }
    })
  }

  function fadeInGrowDialog(src, ms){
    return new Promise((resolve)=>{
      try{

        try{ if(Date.now() < suppressAutoDialogsUntil){ resolve(); return } }catch(e){}
        if(!growDialog) return resolve()
  setGrowDialogSrc(src || '')

        growDialog.style.display = 'block'

        if(typeof ms === 'number') growDialog.style.transition = 'opacity ' + (ms/1000) + 's ease'

        growDialog.style.opacity = '0'

        requestAnimationFrame(()=>{
          try{ growDialog.style.opacity = '1' }catch(e){}
        })
        const onEnd = (ev)=>{ try{ growDialog.removeEventListener('transitionend', onEnd) }catch(e){} ; resolve() }
        growDialog.addEventListener('transitionend', onEnd)

        setTimeout(()=>{ try{ growDialog.removeEventListener('transitionend', onEnd) }catch(e){} ; resolve() }, (ms||300) + 80)
      }catch(e){ resolve() }
    })
  }

  function fadeOutGrowDialog(ms){
    return new Promise((resolve)=>{
      try{
        if(!growDialog) return resolve()

        try{ if(Date.now() < suppressAutoDialogsUntil){ try{ growDialog.style.display='none'; growDialog.src=''; growDialog.style.opacity='0' }catch(e){} ; resolve(); return } }catch(e){}
        if(typeof ms === 'number') growDialog.style.transition = 'opacity ' + (ms/1000) + 's ease'

        growDialog.style.opacity = '0'
  const onEnd = (ev)=>{ try{ growDialog.removeEventListener('transitionend', onEnd) }catch(e){} ; try{ growDialog.style.display='none'; setGrowDialogSrc('') }catch(e){} ; resolve() }
        growDialog.addEventListener('transitionend', onEnd)

  setTimeout(()=>{ try{ growDialog.removeEventListener('transitionend', onEnd) }catch(e){} ; try{ growDialog.style.display='none'; setGrowDialogSrc('') }catch(e){} ; resolve() }, (ms||300) + 80)
      }catch(e){ resolve() }
    })
  }

  function waitForFadeIn(timeoutFallback){
    return new Promise((resolve)=>{
      try{
        if(!screen) return resolve()

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

        setTimeout(()=>{ if(resolved) return; resolved = true; try{ screen.removeEventListener('transitionend', onTransition) }catch(e){}; resolve() }, fallback)
      }catch(e){ resolve() }
    })
  }

  function showDialogFor(type, level){

    return new Promise((resolve)=>{

      try{
        const now = Date.now()
        if(now < (suppressAutoDialogsUntil || 0) || window.__growDialogsSuppressed){
          resolve(); return
        }
      }catch(e){}

      try{

      }catch(e){}

      try{
        if(Date.now() < suppressAutoDialogsUntil){ resolve(); return }

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

  growDialog.style.display = 'block'
  try{ growDialog.style.opacity = '1' }catch(e){}

        try{
          const dialogDur = (type === 'innga' || type === 'utuwa')
            ? (typeof TIMINGS.inngaUtuwaDisplay === 'number' ? TIMINGS.inngaUtuwaDisplay : 2200)
            : 1400
          if(type === 'innga' || type === 'utuwa'){

            const prevEyeSrc = duryEye ? duryEye.src : ''
            const prevMouthSrc = duryMouth ? duryMouth.src : ''
            try{ if(duryEye) duryEye.src = 'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png' }catch(e){}
            try{ if(duryMouth) duryMouth.src = 'assets/character/wayang/10_duryodhana_wayang_mouth_open_angry.png' }catch(e){}

            try{
              if(growDialog){

                try{ growDialog.classList.remove('shake','horror','horizontal','micro') }catch(e){}
                try{ void growDialog.offsetWidth }catch(e){}
                growDialog.classList.add('shake','horror')
                setTimeout(()=>{ try{ growDialog.classList.remove('shake','horror') }catch(e){} }, dialogDur)
              }
            }catch(e){}

            setTimeout(()=>{ try{ if(duryEye) duryEye.src = prevEyeSrc; if(duryMouth) duryMouth.src = prevMouthSrc }catch(e){} }, dialogDur + 20)
          } else {

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

              const prevEyeSrc = duryEye.src || ''
              eyeFrames.forEach((f, i)=>{
                setTimeout(()=>{ try{ duryEye.src = f }catch(e){} }, i * interval)
              })

              setTimeout(()=>{ try{ duryEye.src = prevEyeSrc }catch(e){} }, dialogDur + 20)
            }
          }
        }catch(e){}

        const endDur = (type === 'innga' || type === 'utuwa')
          ? (typeof TIMINGS.inngaUtuwaDisplay === 'number' ? TIMINGS.inngaUtuwaDisplay : 2200)
          : 1400
        setTimeout(()=>{
          try{

            try{ growDialog.style.opacity = '0' }catch(e){}

            setTimeout(()=>{ try{ growDialog.style.display = 'none'; setGrowDialogSrc('') }catch(e){} ; resolve() }, 320)
          }catch(e){ try{ growDialog.style.display = 'none'; setGrowDialogSrc('') }catch(_){} ; resolve() }
  }, endDur)
      }catch(e){ resolve() }
    })
  }

  function showAutoDialog(){

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

    if(karma > 0){
      if(Date.now() < suppressInngaUntil){

      } else {
        showDialogFor('innga', Math.min(3, karma)); return
      }
    }
    if(vesselLevel > 0){ showDialogFor('utuwa', Math.min(3, vesselLevel)); return }
  }

  function playBgmIfNeeded(){
    try{ if(!bgm) return; if(!bgm.paused) return; bgm.currentTime = 0; bgm.play().catch(()=>{}) }catch(e){}
  }

  function amplifyAudioElement(id, gainValue){
    try{
      const el = document.getElementById(id)
      if(!el) return

      if(el.__amplifier){
        try{ el.__amplifier.gainNode.gain.value = gainValue }catch(e){}
        return
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if(!AudioCtx){
        try{ el.volume = Math.min(1, (el.volume || 1) * gainValue) }catch(e){}
        return
      }

      const ctx = new AudioCtx()
      try{ ctx.resume().catch(()=>{}) }catch(e){}
      try{
        const src = ctx.createMediaElementSource(el)
        const gainNode = ctx.createGain()

        gainNode.gain.value = gainValue
        src.connect(gainNode)
        gainNode.connect(ctx.destination)

        el.__amplifier = { ctx: ctx, src: src, gainNode: gainNode }

        if(typeof ctx.state === 'string' && ctx.state === 'suspended'){
          const resumeOnce = function(){ try{ ctx.resume().catch(()=>{}) }catch(e){} ; document.removeEventListener('pointerdown', resumeOnce); document.removeEventListener('click', resumeOnce) }
          document.addEventListener('pointerdown', resumeOnce, { once:true })
          document.addEventListener('click', resumeOnce, { once:true })

          try{ ctx.resume().catch(()=>{}) }catch(e){}
        }
      }catch(e){

        try{ el.volume = Math.min(1, (el.volume || 1) * gainValue) }catch(e){}
      }
    }catch(e){}
  }

  function fadeImageSrc(el, newSrc, duration){
    return new Promise((resolve)=>{
      try{
        if(!el || !newSrc){ resolve(); return }
        duration = typeof duration === 'number' ? duration : 300

        const pre = new Image()
        pre.src = newSrc
        let ran = false
        const doCrossfade = function(){
          if(ran) return; ran = true
          try{
            const parent = el.parentElement || document.body

            const overlay = document.createElement('img')
            overlay.src = newSrc
            overlay.style.pointerEvents = 'none'
            overlay.style.opacity = '0'
            overlay.style.transition = 'opacity ' + (duration/1000) + 's ease'
            overlay.style.position = 'absolute'

            overlay.style.imageRendering = 'pixelated'
            try{

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

            try{
              const cs = window.getComputedStyle(parent)
              if(!cs || cs.position === 'static'){
                if(!parent.__overlayPositioned){ parent.style.position = 'relative'; parent.__overlayPositioned = true }
              }
            }catch(e){}
            parent.appendChild(overlay)

            try{ overlay.style.willChange = 'opacity'; void overlay.offsetWidth }catch(e){}
            overlay.style.opacity = '1'

            setTimeout(()=>{
              try{ el.src = newSrc }catch(e){}
              try{ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay) }catch(e){}
              try{ el.style.willChange = '' }catch(e){}
              resolve()
            }, duration + 20)
          }catch(e){ resolve() }
        }

        function audioSrcEqual(a, b){
          try{
            if(!a || !b) return false
            const aAttr = a.getAttribute && a.getAttribute('src')
            const bAttr = b.getAttribute && b.getAttribute('src')
            if(aAttr && bAttr) return String(aAttr) === String(bAttr)

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

        setTimeout(()=>{ try{ doCrossfade() }catch(e){} }, duration * 3 + 200)
      }catch(e){ resolve() }
    })
  }

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

        try{ el.classList.remove('shake','horror','horizontal','micro') }catch(e){}

        try{ void el.offsetWidth }catch(e){}

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

        }
      } else {

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

        try{ if(seBlood) seBlood.currentTime = 0 }catch(e){}

  setTimeout(()=>{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/02_bhima_blood_mid.png') }, TIMINGS.bloodHandFront)

  setTimeout(()=>{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/03_bhima_blood_top.png') }, TIMINGS.bloodHandMid)

  setTimeout(()=>{ bloodSplash && (bloodSplash.style.display='block'); bloodSplash && (bloodSplash.src='assets/blood/01_blood_drop_small.png') }, TIMINGS.bloodDropSmall)
  setTimeout(()=>{ bloodSplash && (bloodSplash.src='assets/blood/02_blood_drop_large.png') }, TIMINGS.bloodDropLarge)

  setTimeout(()=>{ bloodSplash && (bloodSplash.style.display='block'); bloodSplash && (bloodSplash.src='assets/blood/03_blood_fall.png') }, TIMINGS.bloodFall)
    setTimeout(()=>{
      if(bloodSplash) (bloodSplash.src='assets/blood/04_blood_hit.png')

      try{ if(seBlood){ seBlood.currentTime = 0; seBlood.play().catch(()=>{}) } }catch(e){}
      try{
        const prevMana = (typeof mana === 'number') ? mana : 0
        const newMana = Math.min(20, prevMana + 2)
        mana = newMana

        if(prevMana <= 10 && newMana > 10){
          manaBreakHandled = true
          karma = Math.min(3, (typeof karma === 'number' ? karma : 0) + 1)

          updateGauges()
        } else {
          updateGauges()
        }

        try{

          if(lightTimer) { clearInterval(lightTimer); lightTimer = null }

          try{
            const hold = (typeof TIMINGS.lightMaxHold === 'number') ? TIMINGS.lightMaxHold : 600
            const fade = (typeof TIMINGS.lightFade === 'number') ? TIMINGS.lightFade : 300

            const overlay = document.createElement('img')
            overlay.src = 'assets/light/04_light_max.png'
            overlay.id = 'light-max-overlay'
            overlay.style.pointerEvents = 'none'
            overlay.style.opacity = '1'
            overlay.style.transition = 'opacity ' + (fade/1000) + 's ease'

            const parentElem = (lightImg && lightImg.parentElement) ? lightImg.parentElement : document.body

            let restoreParentPosition = false
            try{
              const cs = window.getComputedStyle(parentElem)
              if(!cs || cs.position === 'static'){

                parentElem.__prevPosition = parentElem.style.position || ''
                parentElem.style.position = 'relative'
                restoreParentPosition = true
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
            }catch(e){
              overlay.style.position = 'absolute'
              overlay.style.left = '0'
              overlay.style.top = '0'
              overlay.style.width = '100%'
              overlay.style.height = '100%'
              overlay.style.zIndex = '9999'
            }
            parentElem.appendChild(overlay)

            setTimeout(()=>{
              try{

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

      setTimeout(()=>{
        bloodSplash && (bloodSplash.src='assets/blood/08_blood_splash_done.png')
      }, TIMINGS.bloodDone)

      setTimeout(()=>{

        bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/02_bhima_blood_mid.png')

        const returnHold = (function(){
          try{
            const front = parseInt(TIMINGS.bloodHandFront,10) || 0
            const mid = parseInt(TIMINGS.bloodHandMid,10) || 0
            const derived = Math.max(50, mid - front)
            return derived || (TIMINGS.bloodReturnHold || 120)
          }catch(e){ return (TIMINGS.bloodReturnHold || 120) }
        })()
        setTimeout(()=>{

          bhimaHand && (bhimaHand.src = 'assets/bhima_hand/feeding/01_bhima_blood_front.png')

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

      setTimeout(()=>{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/02_bhima_warm_mid.png') }, atMid)

  setTimeout(()=>{
        try{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/03_bhima_warm_hold.png') }catch(e){}

        try{ const seHeart = document.getElementById('se-heart'); if(seHeart){ seHeart.currentTime = 0; seHeart.play().catch(()=>{}) } }catch(e){}

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

        try{
          const prevTemp = (typeof temp === 'number') ? temp : 0
          temp = Math.min(20, prevTemp + 2)
          updateGauges()

          try{
            if(typeof prevTemp === 'number' && prevTemp <= 10 && temp > 10){

              const newLevel = Math.min(3, (typeof vesselLevel === 'number' ? vesselLevel : 0) + 1)
              vesselLevel = newLevel

              updateGauges()

              try{ pulseElement(gaugeVessel, 2, (typeof TIMINGS.vesselGlowPulseInterval === 'number' ? TIMINGS.vesselGlowPulseInterval : 150), 0.7) }catch(e){}

              ;(async ()=>{ try{ await performVesselBreak(newLevel) }catch(e){} })()
            }
          }catch(e){}
        }catch(e){}
  }, atHold)

      setTimeout(()=>{ try{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/02_bhima_warm_mid.png') }catch(e){} }, atReturnMid)

      setTimeout(()=>{ try{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/01_bhima_warm_front.png') }catch(e){} }, atReturnFront)

      setTimeout(()=>{ try{ bhimaHand && (bhimaHand.style.display='none') }catch(e){} ; resolve() }, atEnd)
    })
  }

  function setBusy(state, targets){
    try{
      if(state){
        busy = true

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

  function performVesselBreak(level){
    return new Promise(async (resolve)=>{
      try{

        const glowMap = {
          1: 'assets/vessel/03_vessel_crack1_glow.png',
          2: 'assets/vessel/05_vessel_crack2_glow.png',
          3: 'assets/vessel/07_vessel_crack3_glow.png'
        }
        const transMap = {
          1: 'assets/vessel/04_vessel_crack1_transparent.png',
          2: 'assets/vessel/06_vessel_crack2_transparent.png'
        }

        const prevDuryDisplay = {
          frame: duryImg ? duryImg.style.display : '',
          eye: duryEye ? duryEye.style.display : '',
          mouth: duryMouth ? duryMouth.style.display : ''
        }
        try{ if(duryImg) duryImg.style.display = 'none' }catch(e){}
        try{ if(duryEye) duryEye.style.display = 'none' }catch(e){}
        try{ if(duryMouth) duryMouth.style.display = 'none' }catch(e){}

        try{
          const fv = (typeof TIMINGS.vesselFadeDuration === 'number') ? TIMINGS.vesselFadeDuration : 300
          if(vessel && glowMap[level]) await fadeImageSrc(vessel, glowMap[level], fv)
        }catch(e){}

        try{
          const pc = (typeof TIMINGS.vesselGlowPulseGlow === 'number') ? TIMINGS.vesselGlowPulseGlow : 0
          const pi = (typeof TIMINGS.vesselGlowPulseInterval === 'number') ? TIMINGS.vesselGlowPulseInterval : 150
          if(pc > 0 && vessel){ await pulseElement(vessel, pc, pi, 0.6) }
        }catch(e){}

  try{ const dd = (typeof TIMINGS.vesselDialogDelay === 'number') ? TIMINGS.vesselDialogDelay : 60; await new Promise(r=>setTimeout(r, dd)) }catch(e){}

        try{
          if(level >= 3){ seVessel3 && seVessel3.currentTime === 0; seVessel3 && seVessel3.play().catch(()=>{}) }
          else { seVessel1 && seVessel1.currentTime === 0; seVessel1 && seVessel1.play().catch(()=>{}) }
        }catch(e){}

        try{ if(showDialogFor){ const p = showDialogFor('utuwa', Math.min(3, level)); if(p && p.then) await p } }catch(e){}

        if(level < 3){
          try{

            const hold = (typeof TIMINGS.vesselGlowToTransparentHold === 'number') ? TIMINGS.vesselGlowToTransparentHold : 600
            await new Promise(r=>setTimeout(r, hold))
          }catch(e){}
          try{ const fv2 = (typeof TIMINGS.vesselFadeDuration === 'number') ? TIMINGS.vesselFadeDuration : 300; if(vessel && transMap[level]) await fadeImageSrc(vessel, transMap[level], fv2) }catch(e){}

          try{
            const pt = (typeof TIMINGS.vesselGlowPulseTransparent === 'number') ? TIMINGS.vesselGlowPulseTransparent : 0
            const pi2 = (typeof TIMINGS.vesselGlowPulseInterval === 'number') ? TIMINGS.vesselGlowPulseInterval : 150
            if(pt > 0 && vessel){ await pulseElement(vessel, pt, pi2, 0.75) }
          }catch(e){}

          try{ if(duryImg) duryImg.style.display = prevDuryDisplay.frame || '' }catch(e){}
          try{ if(duryEye) duryEye.style.display = prevDuryDisplay.eye || '' }catch(e){}
          try{ if(duryMouth) duryMouth.style.display = prevDuryDisplay.mouth || '' }catch(e){}

          try{ const post = (typeof TIMINGS.vesselPostTransparentPause === 'number') ? TIMINGS.vesselPostTransparentPause : 200; await new Promise(r=>setTimeout(r, post)) }catch(e){}
          resolve()
          return
        }

  try{ const p3 = (typeof TIMINGS.vesselLevel3EndPause === 'number') ? TIMINGS.vesselLevel3EndPause : 600; await new Promise(r=>setTimeout(r, p3)) }catch(e){}
        try{ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('broken_vessel_end.html') } else { location.href = 'broken_vessel_end.html' } }catch(e){ try{ location.href = 'broken_vessel_end.html' }catch(_){} }
        resolve()
      }catch(e){ resolve() }
    })
  }

  btnBlood && btnBlood.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    setBusy(true, btnBlood)
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}

    const prev = mana

    const animPromise = showBloodSequence()

    await animPromise

    if(mana > 10){

      mana = 10

      if(!manaBreakHandled){
        karma = Math.min(3, karma + 1)
      }
      if(karma >= 3){

        let dlgP = null
        try{ dlgP = showDialogFor('innga', Math.min(3, karma)) }catch(e){ dlgP = null }

        try{ if(seCause3){ seCause3.currentTime = 0; seCause3.play().catch(()=>{}) } }catch(e){}
        if(dlgP && dlgP.then) await dlgP

  shakeElement(gaugeKarma)
  try{ if(duryEye) duryEye.src = 'assets/character/wayang/07_duryodhana_wayang_eye_closed.png' }catch(e){}
  try{ if(duryMouth) duryMouth.src = 'assets/character/wayang/09_duryodhana_wayang_mouth_closed_smile.png' }catch(e){}

  try{ _navigating = true; setBusy(true) }catch(e){}
  try{ await new Promise(r=>{ requestAnimationFrame(()=> setTimeout(r, 20)) }) }catch(e){}
  if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('distorted_end.html') } else { location.href = 'distorted_end.html' }
        updateGauges()

        manaBreakHandled = false
        return
      }
      seCause1 && seCause1.play().catch(()=>{})
      shakeElement(gaugeKarma)

      try{
        const p = showDialogFor('innga', Math.min(3, karma))
        if(p && p.then) await p
      }catch(e){}

      manaBreakHandled = false
      setBusy(false)
    } else {

  const dlgPromises = []
  try{ if(prev < 6 && mana >=6) { const p = showDialogFor('mana', 6); dlgPromises.push(p) } }catch(e){}
  try{ if(prev < 8 && mana >=8) { const p = showDialogFor('mana', 8); dlgPromises.push(p) } }catch(e){}
  try{ if(prev < 10 && mana >=10) { const p = showDialogFor('mana', 10); dlgPromises.push(p) } }catch(e){}
  try{ if(dlgPromises.length) await Promise.all(dlgPromises.map(p=>p && p.then ? p : Promise.resolve())) }catch(e){}

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

  try{ await animPromise }catch(e){}

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

    _navigating = true
    try{ setBusy(true) }catch(e){}

    if(window.transitionAPI && window.transitionAPI.fadeOutThen){ window.transitionAPI.fadeOutThen(()=>{}, 400) } else { screen && screen.classList.remove('visible') }

    setTimeout(async ()=>{
      const okMana = (mana >=8)
      const okTemp = (temp >=8)
      if(okMana && okTemp){

        if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('start.html') } else { location.href = 'start.html' }
        return
      }

      try{

        if(target === 'kitchen'){
          await playAudioWithMuteCue(seTyuubou, '厨房へ行く')
        } else if(target === 'follow'){
          await playAudioWithMuteCue(seMasuta, 'マスターに同行')
        }
      }catch(e){}
      try{ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('missed_end.html') } else { location.href = 'missed_end.html' } }catch(e){ try{ location.href = 'missed_end.html' }catch(_){} }
    }, 450)
  }

  async function startDaySend(action){
    try{
      setBusy(true)
      try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}

      try{ if(bgm){ bgmWasPlayingBeforeDaySend = !bgm.paused; bgm.pause(); } }catch(e){}

      try{ if(window.transitionAPI && window.transitionAPI.fadeOutThen) window.transitionAPI.fadeOutThen(()=>{}, 400); else if(screen && screen.classList) screen.classList.remove('visible') }catch(e){}

      await new Promise(r=>setTimeout(r, 450))

      try{

        if(action === 'kitchen'){
          await playAudioWithMuteCue(seTyuubou, '厨房へ行く')
        } else if(action === 'follow'){
          await playAudioWithMuteCue(seMasuta, 'マスターに同行')
        }
      }catch(e){}

      try{ requestAnimationFrame(()=> setTimeout(()=> screen && screen.classList.add('visible'), 20)) }catch(e){}

      try{ if(btnKitchen) btnKitchen.style.display='none'; if(btnFollow) btnFollow.style.display='none'; if(btnBlood) btnBlood.style.display='none'; if(btnWarm) btnWarm.style.display='none' }catch(e){}

      try{ await waitForFadeIn() }catch(e){}

      try{ await new Promise(r=>setTimeout(r, 2000)) }catch(e){}
      try{
  const hiokuriPath = hiokuriMap[day] || hiokuriMap[5]

  try{ await fadeInGrowDialog(hiokuriPath, 300) }catch(e){}

  try{ animateDuryEyeFor(TIMINGS.hiokuriDisplay) }catch(e){}

  await new Promise(r=>setTimeout(r, TIMINGS.hiokuriDisplay))

        try{ await fadeOutGrowDialog(300) }catch(e){}
      }catch(e){}

      try{
        if(day === 5 && action === 'kitchen'){

          setBusy(false)
          try{ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('true_end.html') } else { location.href = 'true_end.html' } }catch(e){ try{ location.href = 'true_end.html' }catch(_){} }
          return
        }
      }catch(e){}

      try{ if(btnSleep) btnSleep.style.display = '' }catch(e){}
      setBusy(false)
    }catch(e){ setBusy(false) }
  }

  btnKitchen && btnKitchen.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
    const okMana = (mana >= 8)
    const okTemp = (temp >= 8)

    if(okMana && okTemp && (day === 1 || day === 3 || day === 5)){
      await startDaySend('kitchen')
      return
    }

    try{ if(bgm){ bgm.pause(); try{ bgm.currentTime = 0 }catch(e){} } }catch(e){}
    doTransitionCheck('kitchen')
  })

  btnFollow && btnFollow.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
    const okMana = (mana >= 8)
    const okTemp = (temp >= 8)

    if(okMana && okTemp && (day === 2 || day === 4)){
      await startDaySend('follow')
      return
    }

    try{ if(bgm){ bgm.pause(); try{ bgm.currentTime = 0 }catch(e){} } }catch(e){}
    doTransitionCheck('follow')
  })

  btnSleep && btnSleep.addEventListener('click', async (e)=>{
    if(_navigating || busy) return
    setBusy(true)

    try{
      const SUPPRESS_MS = 3000
      suppressInngaUntil = Date.now() + SUPPRESS_MS
      suppressAutoDialogsUntil = Date.now() + SUPPRESS_MS
      try{ window.__growDialogsSuppressed = true; setTimeout(()=>{ try{ window.__growDialogsSuppressed = false }catch(e){} }, SUPPRESS_MS + 200) }catch(e){}
    }catch(e){}
    e && e.preventDefault()
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}

  try{ if(screen && screen.classList){ screen.classList.add('sleep-fade') } }catch(e){}
  try{ if(window.transitionAPI && window.transitionAPI.fadeOutThen) window.transitionAPI.fadeOutThen(()=>{}, 800); else if(screen && screen.classList) screen.classList.remove('visible') }catch(e){}

  await new Promise(r=>setTimeout(r, 850))
  try{ await playAudioElement(seSleepBed) }catch(e){}

    try{ setDay(day + 1) }catch(e){}
    try{ requestAnimationFrame(()=> setTimeout(()=> screen && screen.classList.add('visible'), 20)) }catch(e){}

  try{ await waitForFadeIn() }catch(e){}
  try{ if(bgmWasPlayingBeforeDaySend && bgm){ bgm.currentTime = 0; const p = bgm.play(); if(p && p.then) p.catch(()=>{}); } }catch(e){}
  bgmWasPlayingBeforeDaySend = false

  try{ if(screen && screen.classList) screen.classList.remove('sleep-fade') }catch(e){}

    try{ if(btnSleep) btnSleep.style.display = 'none' }catch(e){}

  try{ if(growDialog){ growDialog.style.opacity = '0'; growDialog.style.display = 'none'; setGrowDialogSrc(''); try{ growDialog.classList.remove('shake','horror','horizontal','micro') }catch(e){} } }catch(e){}

    try{

  const SUPPRESS_MS = 3000
  suppressInngaUntil = Date.now() + SUPPRESS_MS
  suppressAutoDialogsUntil = Date.now() + SUPPRESS_MS

  try{ window.__growDialogsSuppressed = true; setTimeout(()=>{ try{ window.__growDialogsSuppressed = false }catch(e){} }, SUPPRESS_MS + 200) }catch(e){}
  setTimeout(()=>{ try{ showAutoDialog() }catch(e){} }, SUPPRESS_MS + 100)
    }catch(e){}
    setBusy(false)
  })

  document.addEventListener('DOMContentLoaded', ()=>{
    updateGauges();

  try{ if(bgm) bgm.volume = 0.7 }catch(e){}
    playBgmIfNeeded();

    try{ preloadAssets(PRELOAD_ASSETS) }catch(e){}

  try{ amplifyAudioElement('se-heart', 5) }catch(e){}

  try{ amplifyAudioElement('se-cause-break1', 1.0) }catch(e){}
  try{ amplifyAudioElement('se-cause-break3', 1.0) }catch(e){}

  try{ amplifyAudioElement('se-vessel-crack1', 1.5) }catch(e){}
  try{ amplifyAudioElement('se-vessel-crack3', 1.5) }catch(e){}
    startAnims(); try{ if(screen && screen.classList) { requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20)) } }catch(e){}

  try{ showPrimaryActionForDay() }catch(e){}

  try{ TIMINGS.vesselGlowPulseInterval = TIMINGS.vesselGlowPulseInterval || 150 }catch(e){}
  setTimeout(()=>{ try{ showAutoDialog() }catch(e){} }, 600)
  })

  window.growSceneInit = function(){ updateGauges(); try{ if(bgm){ bgm.currentTime = 0; const p = bgm.play(); if(p && p.then){ p.catch(()=>{ try{ if(document.getElementById('audio-unlock')) return; const o = document.createElement('div'); o.id='audio-unlock'; o.style.position='fixed'; o.style.left='0'; o.style.top='0'; o.style.right='0'; o.style.bottom='0'; o.style.display='flex'; o.style.alignItems='center'; o.style.justifyContent='center'; o.style.background='rgba(0,0,0,0.5)'; o.style.zIndex='9999'; const btn=document.createElement('button'); btn.textContent='音を再生する'; btn.style.fontSize='20px'; btn.style.padding='12px 20px'; btn.addEventListener('click', ()=>{ try{ bgm.play().catch(()=>{}) }catch(e){} try{ seButton && seButton.play().catch(()=>{}) }catch(e){} if(o && o.parentElement) o.parentElement.removeChild(o) }); o.appendChild(btn); document.body.appendChild(o) }catch(e){} }) } } }catch(e){} startAnims() }
  window.growSceneInit = function(){ updateGauges(); try{ if(bgm){ bgm.volume = 0.7; bgm.currentTime = 0; const p = bgm.play(); if(p && p.then){ p.catch(()=>{ try{ if(document.getElementById('audio-unlock')) return; const o = document.createElement('div'); o.id='audio-unlock'; o.style.position='fixed'; o.style.left='0'; o.style.top='0'; o.style.right='0'; o.style.bottom='0'; o.style.display='flex'; o.style.alignItems='center'; o.style.justifyContent='center'; o.style.background='rgba(0,0,0,0.5)'; o.style.zIndex='9999'; const btn=document.createElement('button'); btn.textContent='音を再生する'; btn.style.fontSize='20px'; btn.style.padding='12px 20px'; btn.addEventListener('click', ()=>{ try{ bgm.play().catch(()=>{}) }catch(e){} try{ seButton && seButton.play().catch(()=>{}) }catch(e){} if(o && o.parentElement) o.parentElement.removeChild(o) }); o.appendChild(btn); document.body.appendChild(o) }catch(e){} }) } } }catch(e){} startAnims() }

  window.growSceneStop = function(){ stopAnims() }

  if(!window.transitionAPI) window.transitionAPI = {}
  if(!window.transitionAPI.fadeOutNavigate){
    window.transitionAPI.fadeOutNavigate = function(url, ms){
      try{
        const duration = typeof ms === 'number' ? ms : 400

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

        void o.offsetWidth
        o.style.opacity = '1'
        setTimeout(()=>{ try{ location.href = url }catch(e){ location.href = url } }, duration)
      }catch(e){ try{ location.href = url }catch(_){} }
    }
  }

})();

