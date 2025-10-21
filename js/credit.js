/**
 * credit.js
 * - クレジット画面専用のスクリプトです。
 * - 中学生向け: 「もどる」ボタンでタイトルに戻る処理などを持っています。
 */
;(function(){
  'use strict'
  const screen = document.getElementById('screen')
  const se = document.getElementById('se-button')
  const btnBack = document.getElementById('btn-back')
  const bgm = document.getElementById('bgm') // start から継続している場合は停止する

  // フェードイン
  window.addEventListener('load', ()=>{
    try{
  if(screen){ screen.style.transition = 'opacity 400ms'; requestAnimationFrame(()=>{ screen.style.opacity = 1 }) }
    }catch(e){ console.warn('fadein error', e) }

    // BGM 停止はフェードイン完了（opacity の transitionend）で行う
    if(screen){
      const onEnd = (ev)=>{
        if(ev.propertyName !== 'opacity') return
        screen.removeEventListener('transitionend', onEnd)
        try{ if(bgm){ bgm.pause(); bgm.currentTime = 0 } }catch(e){}
      }
      screen.addEventListener('transitionend', onEnd)
    }
  })

  function playSE(){ if(!se) return; try{ se.currentTime=0; se.play().catch(()=>{}) }catch(e){} }

  function fadeOutAndGoto(url, duration=400){
    const api = window.transitionAPI
    if(api && api.fadeOutNavigate){
      api.fadeOutNavigate(url, duration)
      return
    }
    if(screen) screen.classList.remove('visible')
    setTimeout(()=>{ location.href = url }, duration)
  }

  if(btnBack){
    btnBack.addEventListener('pointerdown', ()=>{ try{ playSE() }catch(e){} })
    btnBack.addEventListener('click', (e)=>{ e.preventDefault(); fadeOutAndGoto('start.html', 400) })
  }

  // 画像ロードエラーの簡易ログ
  document.querySelectorAll('#credit-title,#credit-body,#btn-back').forEach(el=>{
    el.addEventListener('error', ()=>console.error('credit asset failed:', el.src))
  })

})()
