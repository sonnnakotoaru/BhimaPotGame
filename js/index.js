/*
  index.js
  - 小学生でも分かる説明:
    ・このファイルは「注意ページ（index.html）」の動きを作ります。
    ・ボタンを押すと次の画面に移動するだけの、とてもシンプルな仕組みです。
    ・難しいことは書かないようにして、安心して読めるコードにしています。
*/
/**
 * index.js
 * - このファイルは「注意ページ（index.html）」の小さな動きを作ります。
 * - わかりやすくいうと: 「説明を読んだらボタンを押して次へ行く」を実現します。
 */

// ページが全部読み込まれたら画面をフェードインさせるよ
window.addEventListener('load', () => {
  const screen = document.getElementById('screen');
  if (!screen) return;
  // 少しだけ待ってから .visible を付けるとフェードインして見えるよ
  requestAnimationFrame(() => setTimeout(() => screen.classList.add('visible'), 20));
});

(function () {
  const btn = document.getElementById('btn-susumu');
  const se = document.getElementById('se-button');
  const screen = document.getElementById('screen');
  const sceneBody = document.getElementById('scene-body');

  if (!btn) return;

  // ボタン音を鳴らすよ。連打を防ぐために短時間だけ無効にする仕組みがあるよ
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
    // 200ms くらいは次の音を鳴らさないようにするよ
    setTimeout(()=>{ playSE._busy = false }, 200)
  }

  // ボタンを押したときの動き
  // 1) ボタンを押した見た目にする
  // 2) 効果音を鳴らす
  // 3) フェードアウトして start.html に移動する
  async function activate() {
    // prevent double activation
    try{ if(btn._locked) return; btn._locked = true; setTimeout(()=>{ btn._locked = false }, 1200) }catch(e){}
    btn.classList.add('pressed')
    playSE()

    const api = window.transitionAPI
    try{ sessionStorage.setItem('start_initiated', '1') }catch(e){}
    // ルーターがあるときはそれを使う（より滑らかな遷移のため）
    if(window.router && window.router.navigate){
      if(api && api.fadeOutThen){
        // もし transitionAPI に fadeOutThen があれば、それを使ってフェードさせてから遷移する
        api.fadeOutThen(()=>{ window.router.navigate('start.html') }, 400)
      }else{
        // なければ自分で visible クラスを消してちょっと待ってから遷移するよ
        if(screen) screen.classList.remove('visible')
        setTimeout(()=> window.router.navigate('start.html'), 400)
      }
      return
    }
    // ルーターが無いときの普通の遷移方法
    if(api && api.fadeOutNavigate){
      setTimeout(()=> api.fadeOutNavigate('start.html', 400), 20)
    }else{
      // まず本文をフェードアウトしてから画面フェード→遷移
      try{
        const getRootVar = (name, fallback) => { try{ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback }catch(e){ return fallback } }
        const toMs = (v, fallback) => { if(!v) return fallback||0; v=String(v).trim(); if(v.endsWith('ms')) return Math.round(parseFloat(v)); if(v.endsWith('s')) return Math.round(parseFloat(v)*1000); const n=parseFloat(v); return Number.isFinite(n)?Math.round(n):(fallback||0) }
        const fadeOutStr = getRootVar('--notice-body-fade-out','400ms')
        const fadeOutMs = toMs(fadeOutStr,400)
        if(sceneBody){ sceneBody.style.transition = `opacity ${fadeOutStr} ease`; sceneBody.style.opacity = getRootVar('--notice-body-opacity-start','0') }
        setTimeout(()=>{
          if (screen) screen.classList.remove('visible')
          setTimeout(()=> { location.href = 'start.html' }, toMs(getRootVar('--transition-duration','400ms'),400))
        }, fadeOutMs + 20)
      }catch(e){ setTimeout(() => { if (screen) screen.classList.remove('visible'); setTimeout(() => { location.href = 'start.html' }, 400) }, 40) }
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
