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
  const seButton = document.getElementById('se-button')
  const seBlood = document.getElementById('se-blood-drop')
  const seCause1 = document.getElementById('se-cause-break1')
  const seCause3 = document.getElementById('se-cause-break3')
  const seVessel1 = document.getElementById('se-vessel-crack1')
  const seVessel3 = document.getElementById('se-vessel-crack3')

  // state
  let day = 1
  let mana = 2
  let temp = 2
  let karma = 0
  let vesselLevel = 0
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

    warmMid: 150,
    warmHold: 300,
    warmReset: 800,
    warmEnd: 1100
  }
  // ランタイムで変更できるようグローバルに公開
  window.growTimings = TIMINGS

  // helper: update gauge images based on values
  function updateGauges(){
    const manaMap = {2:'assets/ui_gauge/grow/mana/01_ui_gauge_lv2.png',4:'assets/ui_gauge/grow/mana/02_ui_gauge_lv4.png',6:'assets/ui_gauge/grow/mana/03_ui_gauge_lv6.png',8:'assets/ui_gauge/grow/mana/04_ui_gauge_lv8.png',10:'assets/ui_gauge/grow/mana/05_ui_gauge_lv10_max.png'}
    const tempMap = {2:'assets/ui_gauge/grow/temp/01_ui_gauge_lv2.png',4:'assets/ui_gauge/grow/temp/02_ui_gauge_lv4.png',6:'assets/ui_gauge/grow/temp/03_ui_gauge_lv6.png',8:'assets/ui_gauge/grow/temp/04_ui_gauge_lv8.png',10:'assets/ui_gauge/grow/temp/05_ui_gauge_lv10_max.png'}
  const karmaMap = {1:'assets/ui_gauge/grow/karma/01_ui_gauge_lv1.png',2:'assets/ui_gauge/grow/karma/02_ui_gauge_lv2.png',3:'assets/ui_gauge/grow/karma/03_ui_gauge_lv3_max.png'}
    const vesselMap = {1:'assets/ui_gauge/grow/vessel/02_ui_gauge_lv2.png',2:'assets/ui_gauge/grow/vessel/03_ui_gauge_lv3_max.png',3:'assets/ui_gauge/grow/vessel/03_ui_gauge_lv3_max.png'}
    // mana/temp は既存のマップ方式を維持
    gaugeMana && (gaugeMana.src = manaMap[Math.min(10, Math.max(2, Math.floor(mana/2)*2))] )
    gaugeTemp && (gaugeTemp.src = tempMap[Math.min(10, Math.max(2, Math.floor(temp/2)*2))] )
    // 因果・器は初期値 0 の場合は非表示にする（初期値は 0）
    if(gaugeKarma){
      if(karma <= 0){ gaugeKarma.style.display = 'none' }
      else { gaugeKarma.style.display = 'block'; gaugeKarma.src = karmaMap[Math.min(3, karma)] }
    }
    if(gaugeVessel){
      if(vesselLevel <= 0){ gaugeVessel.style.display = 'none' }
      else { gaugeVessel.style.display = 'block'; gaugeVessel.src = vesselMap[Math.min(3, vesselLevel)] }
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
    let src = ''
    if(type === 'mana') src = (maryokuMap[day] && maryokuMap[day][level]) || ''
    if(type === 'temp') src = (taionnMap[day] && taionnMap[day][level]) || ''
    if(type === 'innga') src = inngaMap[level] || ''
    if(type === 'utuwa') src = utuwaMap[level] || ''
    if(!src) return
    try{
      if(!growDialog) return
      growDialog.src = src
      growDialog.style.display = 'block'
      // ドゥリーヨダナの目と口をセリフ表示中に演出する
      try{
        const dialogDur = 1400
        if(type === 'innga'){
          // 因果ダイアログ時は怒り表情を出す（目：narrow、口：angry）
          const prevEyeSrc = duryEye ? duryEye.src : ''
          const prevMouthSrc = duryMouth ? duryMouth.src : ''
          try{ if(duryEye) duryEye.src = 'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png' }catch(e){}
          try{ if(duryMouth) duryMouth.src = 'assets/character/wayang/10_duryodhana_wayang_mouth_open_angry.png' }catch(e){}
          // 因果ダイアログはセリフ画像自体を揺らす
          try{ if(growDialog){ growDialog.classList.add('shake'); setTimeout(()=>{ try{ growDialog.classList.remove('shake') }catch(e){} }, dialogDur) } }catch(e){}
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
      // show for 1400ms then hide
      setTimeout(()=>{ try{ growDialog.style.display = 'none'; growDialog.src = '' }catch(e){} }, 1400)
    }catch(e){}
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
        // 小さめの上下左右揺れを適用（CSS 側で .shake.micro を定義）
        el.classList.add('shake', 'micro')
        // micro の duration に合わせてクラスを外す（少し余裕を持たせる）
        setTimeout(()=>{ try{ el.classList.remove('shake'); el.classList.remove('micro') }catch(e){} }, 520)
      } else {
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
      setTimeout(()=>{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/02_bhima_warm_mid.png') }, TIMINGS.warmMid)
      setTimeout(()=>{ bhimaHand && (bhimaHand.src = 'assets/bhima_hand/warming/03_bhima_warm_hold.png'); vessel && (vessel.src='assets/vessel/03_vessel_crack1_glow.png') }, TIMINGS.warmHold)
      setTimeout(()=>{ vessel && (vessel.src='assets/vessel/02_vessel_base_transparent.png') }, TIMINGS.warmReset)
      setTimeout(()=>{ bhimaHand && (bhimaHand.style.display='none'); resolve() }, TIMINGS.warmEnd)
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
        try{ showDialogFor('innga', Math.min(3, karma)) }catch(e){}
        // showDialogFor は内部で 1400ms 表示するので待機
        await new Promise(r=>setTimeout(r, 1400))
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
      showDialogFor('innga', Math.min(3, karma))
      // reset break flag for next interactions
      manaBreakHandled = false
      setBusy(false)
    } else {
      // 魔力が増えて閾値を超えた場合のみダイアログを表示
      if(prev < 6 && mana >=6) { showDialogFor('mana', 6) }
      if(prev < 8 && mana >=8) { showDialogFor('mana', 8) }
      if(prev < 10 && mana >=10) { showDialogFor('mana', 10) }
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
    temp = Math.min(20, temp + 2)
    updateGauges()
    if(temp > 10){
      temp = 10
      vesselLevel = Math.min(3, vesselLevel + 1)
      if(vesselLevel >= 3){
        try{ seVessel3 && seVessel3.play().catch(()=>{}) }catch(e){}
        if(duryEye) duryEye.src = 'assets/character/wayang/05_duryodhana_wayang_eye_open_narrow.png'
        if(duryMouth) duryMouth.src = 'assets/character/wayang/10_duryodhana_wayang_mouth_open_angry.png'
        vessel && (vessel.src = 'assets/vessel/08_vessel_crack3_dim.png')
        shakeElement(gaugeVessel)
        await new Promise(r=>setTimeout(r, 800))
        if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('broken_vessel_end.html') } else { location.href = 'broken_vessel_end.html' }
        updateGauges()
        return
      }
      seVessel1 && seVessel1.play().catch(()=>{})
      shakeElement(gaugeVessel)
      // show 器 dialog
      showDialogFor('utuwa', Math.min(3, vesselLevel))
      await animPromise
      setBusy(false)
    } else {
      if(prev < 6 && temp >=6) { showDialogFor('temp', 6) }
      if(prev < 8 && temp >=8) { showDialogFor('temp', 8) }
      if(prev < 10 && temp >=10) { showDialogFor('temp', 10) }
      await animPromise
      setBusy(false)
    }
    updateGauges()
  })

  async function doTransitionCheck(target){
    try{ seButton && (seButton.currentTime=0, seButton.play().catch(()=>{})) }catch(e){}
    if(window.transitionAPI && window.transitionAPI.fadeOutThen){ window.transitionAPI.fadeOutThen(()=>{}, 400) } else { screen && screen.classList.remove('visible') }
    setTimeout(()=>{
      const okMana = (mana >=8)
      const okTemp = (temp >=8)
      if(okMana && okTemp){ if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('daypass.html') } else { location.href = 'daypass.html' } }
      else { if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){ window.transitionAPI.fadeOutNavigate('missed_end.html') } else { location.href = 'missed_end.html' } }
    }, 450)
  }

  btnKitchen && btnKitchen.addEventListener('click', ()=>doTransitionCheck('kitchen'))
  btnFollow && btnFollow.addEventListener('click', ()=>doTransitionCheck('follow'))

  document.addEventListener('DOMContentLoaded', ()=>{
    updateGauges(); playBgmIfNeeded();
    // preload assets to ensure blood/hand frames are ready
    try{ preloadAssets(PRELOAD_ASSETS) }catch(e){}
    startAnims(); try{ if(screen && screen.classList) { requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20)) } }catch(e){}
  // show initial dialog based on current gauges/day
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
