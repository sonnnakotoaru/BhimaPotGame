(function(){
  'use strict'

  const screen = document.getElementById('screen')
  const btnBack = document.getElementById('btn-back')
  const se = document.getElementById('se-button')

  function stopBgm(){
    try{
      const bgm = document.getElementById('bgm')
      if(bgm && !bgm.paused){

        bgm.pause(); bgm.currentTime = 0
      }
    }catch(e){  }
  }

  function playSE(){
    if(!se) return
    try{ se.currentTime = 0; se.play().catch(()=>{}) }catch(e){}
  }

  function getRootVar(name, fallback){
    try{ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback }catch(e){ return fallback }
  }

  function toMs(v, fallback){
    if(!v) return fallback || 0
    v = String(v).trim()
    if(v.endsWith('ms')) return Math.round(parseFloat(v))
    if(v.endsWith('s')) return Math.round(parseFloat(v) * 1000)
    const n = parseFloat(v)
    return Number.isFinite(n) ? Math.round(n) : (fallback || 0)
  }

  function goBack(){
    playSE() // ボタン音を鳴らす

    try{
      const fadeOutStr = getRootVar('--credit-body-fade-out', '400ms')
      const fadeOutMs = toMs(fadeOutStr, 400)
      const creditBody = document.getElementById('credit-body')
      const creditTitle = document.getElementById('credit-title')
      const startOp = getRootVar('--credit-body-opacity-start', '0')
      if(creditBody){ creditBody.style.transition = `opacity ${fadeOutStr} ease`; creditBody.style.opacity = startOp }
      if(creditTitle){ creditTitle.style.transition = `opacity ${fadeOutStr} ease`; creditTitle.style.opacity = startOp }

      setTimeout(()=>{
        if(screen && screen.classList) screen.classList.remove('visible')

        const screenFadeMs = toMs(getRootVar('--transition-duration','400ms'),400)
        setTimeout(()=>{ window.location.href = 'start.html' }, screenFadeMs)
      }, fadeOutMs + 20)
    }catch(e){ if(screen && screen.classList) screen.classList.remove('visible'); setTimeout(()=>{ window.location.href = 'start.html' }, 400) }
  }

  function lockButtons(ms){
    try{
      const t = typeof ms === 'number' ? ms : 600
      if(lockButtons._locked) return false
      lockButtons._locked = true
      setTimeout(()=>{ lockButtons._locked = false }, t)
      return true
    }catch(e){ return true }
  }

  function start(){
    stopBgm()
    try{
      if(screen && screen.classList) requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20))
    }catch(e){  }

    try{
      const creditBody = document.getElementById('credit-body')
      const creditTitle = document.getElementById('credit-title')
      if(creditBody || creditTitle){
        const fadeInStr = getRootVar('--credit-body-fade-in','600ms')
        const delayStr = getRootVar('--credit-body-fade-delay','120ms')
        const startOp = getRootVar('--credit-body-opacity-start','0')
        const endOp = getRootVar('--credit-body-opacity-end','1')
        const prep = (el)=>{ if(!el) return; el.style.opacity = startOp; el.style.transition = `opacity ${fadeInStr} ease ${delayStr}` }
        prep(creditBody); prep(creditTitle)
        requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
          if(creditBody) creditBody.style.opacity = endOp
          if(creditTitle) creditTitle.style.opacity = endOp
        }) })
      }
    }catch(e){}

    if(btnBack) btnBack.focus()
  }

  if(btnBack) btnBack.addEventListener('click', e=>{ e && e.preventDefault(); if(!lockButtons(1000)) return; try{ btnBack.classList.add('disabled'); btnBack.setAttribute('aria-disabled','true'); if(screen) screen.style.pointerEvents='none' }catch(e){}; goBack() })

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(start, 80))
  } else {
    setTimeout(start, 80)
  }

})();

