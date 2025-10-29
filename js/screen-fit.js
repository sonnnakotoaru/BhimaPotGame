(function(){
  'use strict'
  const DESIGN_W = 1280
  const DESIGN_H = 720
  const PAD = 8 // keep a small page padding (px)

  function readBodyPadding(){
    try{
      const cs = window.getComputedStyle(document.body)
      return {
        left: parseFloat(cs.paddingLeft) || 0,
        right: parseFloat(cs.paddingRight) || 0,
        top: parseFloat(cs.paddingTop) || 0,
        bottom: parseFloat(cs.paddingBottom) || 0
      }
    }catch(e){ return {left:0,right:0,top:0,bottom:0} }
  }

  function getViewportSize(){
    // Prefer visualViewport when available (more accurate on mobile browsers like Chrome on Android)
    try{
      if(window.visualViewport){
        return { w: Math.max(1, window.visualViewport.width), h: Math.max(1, window.visualViewport.height) }
      }
    }catch(e){}
    return { w: Math.max(1, window.innerWidth), h: Math.max(1, window.innerHeight) }
  }

  function updateScale(){
    try{
      const pads = readBodyPadding()
      const vp = getViewportSize()
  const availW = Math.max(1, vp.w - PAD - pads.left - pads.right)
  const availH = Math.max(1, vp.h - PAD - pads.top - pads.bottom)
  // Prefer integer CSS pixel sizes for the scaled canvas to keep pixel art crisp.
  // Compute candidate scales that yield integer-sized width/height after scaling.
  const scaleW = Math.floor(availW) / DESIGN_W
  const scaleH = Math.floor(availH) / DESIGN_H
  let scale = Math.min(scaleW, scaleH, 1)
      if(!isFinite(scale) || scale <= 0) scale = 0.1
      document.documentElement.style.setProperty('--screen-scale', String(scale))
      document.documentElement.style.setProperty('--screen-fit-w', String(availW / DESIGN_W))
      document.documentElement.style.setProperty('--screen-fit-h', String(availH / DESIGN_H))
    }catch(e){ /* ignore */ }
  }

  // helper to debounce frequent events
  function debounce(fn, ms){ let t=null; return function(){ clearTimeout(t); t = setTimeout(fn, ms) } }

  const debouncedUpdate = debounce(updateScale, 80)

  // Listen to visualViewport events when present (handles Android Chrome UI changes well)
  if(window.visualViewport){
    try{
      window.visualViewport.addEventListener('resize', debouncedUpdate, { passive:true })
      window.visualViewport.addEventListener('scroll', debouncedUpdate, { passive:true })
    }catch(e){}
  }

  // Debug overlay (shown when URL has ?debugScale=1 or localStorage.debugScale == '1')
  const showDebug = (function(){
    try{
      const url = new URL(window.location.href)
      if(url.searchParams.get('debugScale') === '1') return true
    }catch(e){}
    try{ if(localStorage && localStorage.getItem('debugScale') === '1') return true }catch(e){}
    return false
  })()

  let debugEl = null
  function ensureDebug(){
    if(!showDebug) return
    if(debugEl) return
    debugEl = document.createElement('div')
    debugEl.id = 'screen-fit-debug'
    debugEl.style.cssText = 'position:fixed;left:8px;bottom:8px;padding:8px 10px;background:rgba(0,0,0,0.6);color:#fff;font:12px/1.2 monospace;border-radius:6px;z-index:99999;pointer-events:none;'
    debugEl.innerText = 'screen-fit init...'
    document.body.appendChild(debugEl)
  }

  function updateDebug(){
    if(!showDebug) return
    ensureDebug()
    try{
      const vp = window.visualViewport ? { w: window.visualViewport.width, h: window.visualViewport.height, offsetLeft: window.visualViewport.offsetLeft, offsetTop: window.visualViewport.offsetTop } : { w: window.innerWidth, h: window.innerHeight, offsetLeft:0, offsetTop:0 }
      const iw = window.innerWidth, ih = window.innerHeight
      const pads = readBodyPadding()
      const availW = Math.max(1, vp.w - PAD - pads.left - pads.right)
      const availH = Math.max(1, vp.h - PAD - pads.top - pads.bottom)
      const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--screen-scale')) || 0
      debugEl.innerText = `visualW:${Math.round(vp.w)} visualH:${Math.round(vp.h)}\ninnerW:${Math.round(iw)} innerH:${Math.round(ih)}\navailW:${Math.round(availW)} availH:${Math.round(availH)}\nscale:${scale.toFixed(3)}\noffset:${Math.round(vp.offsetLeft||0)},${Math.round(vp.offsetTop||0)}`
    }catch(e){}
  }

  // Fallback / additional listeners
  window.addEventListener('resize', debouncedUpdate, { passive:true })
  window.addEventListener('orientationchange', ()=> setTimeout(updateScale, 150))
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(updateScale, 60))

  // update debug when scale updates
  const _origUpdate = updateScale
  updateScale = function(){ _origUpdate(); updateDebug(); }

  // run an initial series of updates to handle browser UI transitions on mobile
  updateScale()
  setTimeout(updateScale, 120)
  setTimeout(updateScale, 600)
  // also update debug overlay periodically a little while after load
  if(showDebug){ setTimeout(()=>{ updateDebug(); }, 300); setInterval(()=>{ updateDebug(); }, 2000) }
})();
