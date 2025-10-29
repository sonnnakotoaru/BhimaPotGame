(function(){
  'use strict'
  const DESIGN_W = 1280
  const DESIGN_H = 720
  const PAD = 20 // keep small page padding

  function updateScale(){
    try{
      // read computed padding (safe-area insets) so we can subtract them from available area
      let padLeft = 0, padRight = 0, padTop = 0, padBottom = 0
      try{
        const cs = window.getComputedStyle(document.body)
        const pl = parseFloat(cs.paddingLeft) || 0
        const pr = parseFloat(cs.paddingRight) || 0
        const pt = parseFloat(cs.paddingTop) || 0
        const pb = parseFloat(cs.paddingBottom) || 0
        padLeft = pl; padRight = pr; padTop = pt; padBottom = pb
      }catch(e){}
      const w = Math.max(1, window.innerWidth - PAD - padLeft - padRight)
      const h = Math.max(1, window.innerHeight - PAD - padTop - padBottom)
      let scale = Math.min(w / DESIGN_W, h / DESIGN_H, 1)
      // clamp to reasonable min
      if(!isFinite(scale) || scale <= 0) scale = 0.1
      document.documentElement.style.setProperty('--screen-scale', String(scale))
      // also expose fit values if needed by CSS
      document.documentElement.style.setProperty('--screen-fit-w', String(w / DESIGN_W))
      document.documentElement.style.setProperty('--screen-fit-h', String(h / DESIGN_H))
    }catch(e){ /* silently ignore */ }
  }

  // update on common events
  window.addEventListener('resize', updateScale, { passive:true })
  window.addEventListener('orientationchange', ()=> setTimeout(updateScale, 120))
  document.addEventListener('DOMContentLoaded', updateScale)
  // initial
  // Ensure update after short delay to catch some mobile UI transitions
  setTimeout(updateScale, 50)
})();
