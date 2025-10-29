(function(){
  'use strict'
  const DESIGN_W = 1280
  const DESIGN_H = 720
  const PAD = 20 // keep small page padding

  function updateScale(){
    try{
      const w = Math.max(1, window.innerWidth - PAD)
      const h = Math.max(1, window.innerHeight - PAD)
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
  updateScale()
})();
