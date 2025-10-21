;/*
  prologue.js
  - プロローグ画面の「動き」全般を扱うファイルです。
  - ここでは画面のフェードイン、ボタンで次へ進む処理、効果音の再生などを行います。
  - 中学生向けに: 「ボタンを押したら効果音を鳴らして次の画面に行く」処理をまとめています。
*/
;(function(){
  'use strict'

  const screen = document.getElementById('screen')
  const btnNext = document.getElementById('btn-next')
  const se = document.getElementById('se-button')

  // ページが読み込まれたら画面をフェードインします（ふわっと現れる）
  window.addEventListener('load', ()=>{
    if(screen){
      screen.style.transition = 'opacity 400ms'
      requestAnimationFrame(()=> screen.style.opacity = 1)
    }
  })

  
  const prologueGroups = [
    { trigger: 'click', _class: ['prologue-style-1','line-1'], lines: [ '宿敵が召喚された――その一報を受け、ビーマは召喚室へと向かった。\nそこに居たのは、器に入ったまま朧げに揺らめく小さなドゥリーヨダナ。' ] },
    { trigger: 'click', wait: 0.1, _class: ['prologue-style-2','line-2'], lines: [ 'その姿は、影絵のように淡く、今にも消え入りそうであった。\nダ・ヴィンチによる解析で、それが「霊基異常」による不完全な召喚であると判明する。' ] },
    { trigger: 'click', wait: 0.1, _class: ['prologue-style-3','line-3'], lines: [ 'このままでは、数日と経たず退去してしまうだろう――。\n小さなドゥリーヨダナは記憶も定かでなく、ただ器の中で揺らぎ続けていた。' ] },
    { trigger: 'click', wait: 0.1, _class: ['prologue-style-4','line-4'], lines: [ '「……最後まで、こいつの傍にいてやりたい」' ] },
    { trigger: 'click', wait: 0.1, _class: ['prologue-style-5','line-5'], lines: [ 'マスターにそう告げたビーマは器を抱え、自室へと歩き出した。' ] }
  ];

  function startPrologueText(){
    const container = screen || document.body;
    const normalizedGroups = prologueGroups.map(g => {
      const base = ['generated-text', 'multi-line', 'align-center', 'pos-top'];
      const extra = Array.isArray(g._class) ? g._class : [];
      const classes = base.concat(extra);
      return Object.assign({}, g, {_class: classes});
    });

    const p = ITTR.run(normalizedGroups, container);
    if(p && p.then){
      p.then(()=>{
        if(window.transitionAPI && window.transitionAPI.fadeOutNavigate){
          window.transitionAPI.fadeOutNavigate('grow.html');
        } else {
          location.href = 'grow.html';
        }
      });
    }
  }

  let _seBusy = false
  function playSE(){ if(!se || _seBusy) return; _seBusy = true; se.currentTime = 0; se.play().catch(()=>{}); setTimeout(()=>_seBusy=false, 200) }

  async function advance(){
    playSE()
    // If internal text runtime is running, let it handle progression (button used to advance text groups)
    if(window.__ITTR_RUNNING){
      // no-op here: ITTR's click handler is bound to #btn-next and will resolve the group
      return;
    }
    try{
      const r = await fetch('grow.html', { method:'HEAD', cache:'no-store' })
      const target = (r && r.ok) ? 'grow.html' : 'start.html'
      if(window.transitionAPI && window.transitionAPI.fadeOutNavigate) {
        window.transitionAPI.fadeOutNavigate(target, 400)
      } else {
        screen && screen.classList && screen.classList.remove('visible')
        setTimeout(()=> location.href = target, 400)
      }
    }catch(e){
      screen && screen.classList && screen.classList.remove('visible')
      setTimeout(()=> location.href = 'start.html', 400)
    }
  }

  btnNext && btnNext.addEventListener('click', (e)=>{ e && e.preventDefault(); advance() })

  // start prologue text after DOM ready (but keep load fade behavior separate)
  document.addEventListener('DOMContentLoaded', ()=>{
    // small defer to allow other scripts to initialize
    setTimeout(()=> startPrologueText(), 100);
  });

})()
