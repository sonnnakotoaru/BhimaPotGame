window.addEventListener('load', () => {
  const screen = document.getElementById('screen');
  const title = document.getElementById('scene-title');
  const body = document.getElementById('scene-body');

  const getRootVar = (name, fallback) => { try{ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback }catch(e){ return fallback } }
  if (!screen) return;

  requestAnimationFrame(() => setTimeout(() => {
    screen.classList.add('visible');

    const endOp = getRootVar('--notice-body-opacity-end','1');
    if(title) title.style.opacity = endOp;
    if(body) body.style.opacity = endOp;
  }, 20));
});

(function () {
  const btn = document.getElementById('btn-susumu');
  const se = document.getElementById('se-button');
  const screen = document.getElementById('screen');
  const sceneBody = document.getElementById('scene-body');
  const sceneTitle = document.getElementById('scene-title');

  if (!btn) return;

  function playSE() {
    if (!se) return
    if(playSE._busy) return
    playSE._busy = true
    try {
      se.currentTime = 0
      se.play().catch(()=>{})
    } catch (e) {
      console.warn('se play failed', e)
    }

    setTimeout(()=>{ playSE._busy = false }, 200)
  }

  async function activate() {

    try{
      if(btn._locked) return;
      btn._locked = true;
      btn.classList.add('disabled');
      btn.setAttribute('aria-disabled','true');
      if(screen) screen.style.pointerEvents = 'none';
      setTimeout(()=>{ btn._locked = false }, 2000)
    }catch(e){}
    btn.classList.add('pressed')
    playSE()

    const api = window.transitionAPI
    try{ sessionStorage.setItem('start_initiated', '1') }catch(e){}

    if(window.router && window.router.navigate){
      if(api && api.fadeOutThen){

        api.fadeOutThen(()=>{ window.router.navigate('start.html') }, 400)
      }else{

        if(screen) screen.classList.remove('visible')
        setTimeout(()=> window.router.navigate('start.html'), 400)
      }
      return
    }

    if(api && api.fadeOutNavigate){
      setTimeout(()=> api.fadeOutNavigate('start.html', 400), 20)
    }else{

      try{
        const getRootVar = (name, fallback) => { try{ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback }catch(e){ return fallback } }
        const toMs = (v, fallback) => { if(!v) return fallback||0; v=String(v).trim(); if(v.endsWith('ms')) return Math.round(parseFloat(v)); if(v.endsWith('s')) return Math.round(parseFloat(v)*1000); const n=parseFloat(v); return Number.isFinite(n)?Math.round(n):(fallback||0) }
        const fadeOutStr = getRootVar('--notice-body-fade-out','400ms')
        const fadeOutMs = toMs(fadeOutStr,400)
        const startOp = getRootVar('--notice-body-opacity-start','0')
        if(sceneBody){ sceneBody.style.transition = `opacity ${fadeOutStr} ease`; sceneBody.style.opacity = startOp }
        if(sceneTitle){ sceneTitle.style.transition = `opacity ${fadeOutStr} ease`; sceneTitle.style.opacity = startOp }
        setTimeout(()=>{
          if (screen) screen.classList.remove('visible')
          setTimeout(()=> { location.href = 'start.html' }, toMs(getRootVar('--transition-duration','400ms'),400))
        }, fadeOutMs + 20)
      }catch(e){ setTimeout(() => { if (screen) screen.classList.remove('visible'); setTimeout(() => { location.href = 'start.html' }, 400) }, 40) }
    }
  }

  btn.addEventListener('click', (e) => { e.preventDefault(); activate(); });
  btn.addEventListener('pointerdown', () => { if(btn._locked) return; btn.classList.add('pressed') });
  btn.addEventListener('pointerup', () => btn.classList.remove('pressed'));
  btn.addEventListener('pointercancel', () => btn.classList.remove('pressed'));
})();

(function () {
  const panel = document.querySelector('.scene-layer') || document.querySelector('.notice-panel');
  const imgs = [
    document.getElementById('scene-title'),
    document.getElementById('scene-body'),
    document.getElementById('btn-susumu'),
  ].filter(Boolean);

  imgs.forEach((img) => {
    img.addEventListener('load', () => console.log('notice image loaded:', img.src));
    img.addEventListener('error', () => {
      console.error('failed to load notice image:', img.src);
      if (img.id === 'scene-body' && panel) {
        const f = document.createElement('div');
        f.className = 'notice-text';
        f.textContent = '注意事項: ここに本文が表示されます。';
        const btnNode = panel.querySelector('#btn-susumu');
        if (btnNode) panel.insertBefore(f, btnNode);
        else panel.appendChild(f);
      }
      img.style.display = 'none';
    });
  });
})();

