(function(){
  'use strict'

  // 簡易 DOM キャッシュ
  const screen = document.getElementById('screen')
  const btn = document.getElementById('btn-susumu')
  const se = document.getElementById('se-button')

  // 初期フェードイン（ページ読み込み時）
  window.addEventListener('load', ()=>{
    // CSS の transition に合わせて少し遅らせて .visible を付与
    requestAnimationFrame(()=>{
      setTimeout(()=>screen.classList.add('visible'), 50)
    })
  })

  // 軽量共通遷移 API: 遷移中は pointer をブロックする transition-blocker を使う
  const transitionBlocker = document.createElement('div')
  transitionBlocker.className = 'transition-blocker'
  transitionBlocker.innerHTML = '<div class="hit" aria-hidden="true"></div>'
  document.body.appendChild(transitionBlocker)

  function _activateBlocker(){
    transitionBlocker.classList.add('active')
  }
  function _deactivateBlocker(){
    transitionBlocker.classList.remove('active')
  }

  function fadeOutNavigate(targetUrl, duration=400){
    try{ if(se && !se.paused){ se.pause(); se.currentTime = 0 } }catch(e){}
    // ブロッカー有効化
    _activateBlocker()
    // opacity のみでフェードアウト
    if(screen){
      screen.classList.remove('visible')
      // 一部シーンは inline style で opacity を操作しているためフォールバックで直接設定
      try{ screen.style.opacity = 0 }catch(e){}
    }
    // 遷移は duration 後
    setTimeout(()=>{ location.href = targetUrl }, duration)
  }

  function fadeOutThen(callback, duration=400){
    _activateBlocker()
    if(screen){
      screen.classList.remove('visible')
      try{ screen.style.opacity = 0 }catch(e){}
    }
    setTimeout(()=>{
      try{ callback() }catch(e){}
      // ブロッカーを切るのは遷移先で行うか、ここで少し遅延して解除
  setTimeout(()=>{ _deactivateBlocker() }, 300)
    }, duration)
  }

  // 公開 API
  window.transitionAPI = {
    fadeOutNavigate,
    fadeOutThen,
    _activateBlocker,
    _deactivateBlocker
  }

  // ページ固有のハンドラを想定するため、汎用の効果音/遷移ハンドラはここでは登録しません。
  // 各シーンファイル（例: js/notice.js, js/scene-start.js, js/scene-credit.js）で
  // ボタンの pointerdown/click を実装してください。

  // 画像読み込みエラーや missing asset の簡易ロギング
  document.querySelectorAll('img').forEach(img=>{
    img.addEventListener('error', ()=>{
      console.error('Image failed to load:', img.src)
    })
  })

})()
