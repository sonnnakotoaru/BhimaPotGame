/*
  text.js
  - ここはゲーム全体で使う「文字を画面に出す仕組み」をまとめたファイルです。
  - 中学生向けに簡単に言うと: 文字を画面に出したり、消したりするための道具箱です。
  - 代表的な機能:
    - createLineEl(text): 文字の要素を作る
    - showGroup(container, group): テキストのグループを見せる
    - hideElements(els): 見えている文字を消す
    - run(groups, container): グループを順番に表示してから消す一連の処理
*/
(function(){
  'use strict'

  // 文字列から画面に置くための要素を作る（見た目は CSS 側で決まります）
  function createLineEl(text){
    const el = document.createElement('div')
    el.className = 'generated-text'
    el.textContent = text
    return el
  }

  function applyStyleToEl(el, cfg){
    if(!cfg) return
    if(cfg._class && Array.isArray(cfg._class)){
      cfg._class.forEach(c=>{ if(c) el.classList.add(c) })
    }
    if(cfg.fontSize) el.style.fontSize = (typeof cfg.fontSize === 'number') ? (cfg.fontSize + 'px') : cfg.fontSize
    if(cfg.letterSpacing) el.style.letterSpacing = (typeof cfg.letterSpacing === 'number') ? (cfg.letterSpacing + 'px') : cfg.letterSpacing
    if(cfg.textAlign) el.style.textAlign = cfg.textAlign
  }

  function showGroup(container, group){
    const els = []
    if(!group || !Array.isArray(group.lines)) return els
    for(const line of group.lines){
      const el = createLineEl(line)
      applyStyleToEl(el, group)
      container.appendChild(el)
      void el.offsetWidth
      el.classList.add('show')
      els.push(el)
    }
    return els
  }

  // showGroup は「一つのグループ（行の集合）を出す」関数です。
  // 使い方のイメージ: showGroup(document.getElementById('screen'), group)

  function hideElements(els){
    return Promise.all(els.map(el => {
      return new Promise(resolve => {
        el.classList.remove('show')
        el.classList.add('hide')
        const t = parseFloat(getComputedStyle(el).transitionDuration) || 0.8
        setTimeout(()=>{
          if(el.parentElement) el.parentElement.removeChild(el)
          resolve()
        }, (t * 1000) + 50)
      })
    }))
  }

  async function runGroups(container, groups){
    if(!Array.isArray(groups)) return
    for(const group of groups){
      const wait = (group && group.wait !== undefined) ? group.wait : (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--text-wait')) || 0.5)
      if(group && group.trigger === 'click'){
        const els = showGroup(container, group)
        await new Promise(resolve => {
          const btn = document.getElementById('btn-next')
          const target = btn || container
          function onClick(){ target.removeEventListener('click', onClick); resolve() }
          target.addEventListener('click', onClick)
        })
        await hideElements(els)
      } else {
        await new Promise(r => setTimeout(r, wait * 1000))
        const els = showGroup(container, group)
        const duration = (group && group.duration !== undefined) ? group.duration : (group && group.waitDisplay) || 1.5
        await new Promise(r => setTimeout(r, duration * 1000))
        await hideElements(els)
      }
    }
  }

  // 最後に、外から使えるように window.ITTR として公開します。
  // 他のスクリプトでは window.ITTR.run(groups, container) で使ってください。
  try{ if(typeof window !== 'undefined'){
    window.ITTR = {
      run: function(groups, containerEl){ if(!containerEl) containerEl = document.body; try{ window.__ITTR_RUNNING = true }catch(e){} return runGroups(containerEl, groups).catch(err=>{ console.error(err) }).finally(()=>{ try{ window.__ITTR_RUNNING = false }catch(e){} }) },
      createLineEl: createLineEl,
      showGroup: showGroup,
      hideElements: hideElements
    }
  }}catch(e){}

})();
