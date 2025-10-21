/**
 * index.js
 * - 注意画面（index.html）で使う簡単な動きをまとめたファイルです。
 * - 中学生向け: 「注意を読んだら次へ進む」ボタンを押すと start.html に移動します。
 */

window.addEventListener('load', () => {
  const screen = document.getElementById('screen');
  if (!screen) return;
  requestAnimationFrame(() => setTimeout(() => screen.classList.add('visible'), 20));
});

(function () {
  const btn = document.getElementById('btn-susumu');
  const se = document.getElementById('se-button');
  const screen = document.getElementById('screen');

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
    btn.classList.add('pressed')
    playSE()

    const api = window.transitionAPI
    try{ sessionStorage.setItem('start_initiated', '1') }catch(e){}
    if(api && api.fadeOutNavigate){
      setTimeout(()=> api.fadeOutNavigate('start.html', 400), 20)
    }else{
      setTimeout(() => {
        if (screen) screen.classList.remove('visible')
        setTimeout(() => { location.href = 'start.html' }, 400)
      }, 40)
    }
  }

  btn.addEventListener('click', (e) => { e.preventDefault(); activate(); });
  btn.addEventListener('pointerdown', () => btn.classList.add('pressed'));
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
