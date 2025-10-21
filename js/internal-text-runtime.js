/*
  internal-text-runtime.js
  軽量な内部生成テキスト運用ユーティリティ

  - グループ単位のテキスト定義を JS オブジェクトで与える
  - 各グループに対して trigger: 'auto' | 'click'
    - 'auto' の場合: wait_time 後に自動で show → 指定時間表示 → hide → 次グループへ
    - 'click' の場合: 次に進むのはボタンクリックまたはユーザー指定のトリガー
  - 各テキスト要素は .generated-text クラスを持ち、CSS は css/prologue-text.css で管理

  使い方:
    const groups = [
      {
        trigger: 'auto', // or 'click'
        wait: 0.5, // 秒
        top: '300px',
        color: '#FFFFFF',
        outline: '#000000',
        lines: [ '最初の行', '次の行' ]
      },
      ...
    ];
    ITTR.run(groups, document.getElementById('screen'));
*/

const ITTR = (function(){
  const defaultOpts = {
    fontSize: null, // null で CSS の var を利用
    fadeIn: null,
    fadeOut: null,
    wait: null
  };

  function createLineEl(text){
    const el = document.createElement('div');
    el.className = 'generated-text';
    el.textContent = text;
    return el;
  }

  function applyStyleToEl(el, cfg){
    // apply utility classes if provided
    if(cfg._class && Array.isArray(cfg._class)){
      cfg._class.forEach(c => { if(c) el.classList.add(c); });
    }
    // NOTE: color/outline/position should be controlled via CSS classes and variables.
    // Keep optional font/spacing/textAlign overrides if explicitly provided.
    if(cfg.fontSize) el.style.fontSize = (typeof cfg.fontSize === 'number') ? (cfg.fontSize + 'px') : cfg.fontSize;
    if(cfg.letterSpacing) el.style.letterSpacing = (typeof cfg.letterSpacing === 'number') ? (cfg.letterSpacing + 'px') : cfg.letterSpacing;
    if(cfg.textAlign) el.style.textAlign = cfg.textAlign;
  }

  /* show a group (array of lines) on container, return elements array */
  function showGroup(container, group){
    const els = [];
    for(const line of group.lines){
      const el = createLineEl(line);
      // Do NOT set inline top/left here — positioning is handled by CSS classes (.line-N, vars)
      applyStyleToEl(el, group);
      container.appendChild(el);
      // force reflow and show
      void el.offsetWidth;
      el.classList.add('show');
      els.push(el);
    }
    return els;
  }

  function hideElements(els){
    return Promise.all(els.map(el => {
      return new Promise(resolve => {
        el.classList.remove('show');
        el.classList.add('hide');
        const t = parseFloat(getComputedStyle(el).transitionDuration) || 0.8;
        setTimeout(()=>{
          if(el.parentElement) el.parentElement.removeChild(el);
          resolve();
        }, (t * 1000) + 50);
      });
    }));
  }

  async function runGroups(container, groups){
    for(const group of groups){
      const wait = (group.wait !== undefined) ? group.wait : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--text-wait')) || 0.5;
      if(group.trigger === 'click'){
        // show and wait for click on #btn-next if available, otherwise fallback to container
        const els = showGroup(container, group);
        await new Promise(resolve => {
          const btn = document.getElementById('btn-next');
          const target = btn || container;
          function onClick(){
            target.removeEventListener('click', onClick);
            resolve();
          }
          target.addEventListener('click', onClick);
        });
        await hideElements(els);
      } else {
        // auto
        await new Promise(r => setTimeout(r, wait * 1000));
        const els = showGroup(container, group);
        // display duration: group.duration or default wait
        const duration = (group.duration !== undefined) ? group.duration : (group.waitDisplay || 1.5);
        await new Promise(r => setTimeout(r, duration * 1000));
        await hideElements(els);
      }
    }
  }

  return {
    run: function(groups, containerEl){
      if(!containerEl) containerEl = document.body;
      // set global running flag so other scripts (e.g. scene) can detect
      try{ window.__ITTR_RUNNING = true }catch(e){}
      // return the promise so callers can await completion
      return runGroups(containerEl, groups)
        .catch(err => { console.error(err); })
        .finally(()=>{ try{ window.__ITTR_RUNNING = false }catch(e){} });
    },
    createLineEl,
    showGroup,
    hideElements
  };
})();

// export for CommonJS/node (just in case)
if(typeof module !== 'undefined') module.exports = ITTR;
