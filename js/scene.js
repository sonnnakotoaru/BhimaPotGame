/*
  scene.js
  - ここは画面の「切り替え」を助けるファイルです。
  - たとえば次の画面に移るとき、画面をゆっくり消してから移動する処理を提供します。
  - 中学生向けに簡単に言うと: 「画面をフェードアウトさせる」「操作を止めるふた(ブロッカー)」を持っています。
*/

/* メイン処理は即時実行関数(IIFE)で囲って、変数を外に漏らさないようにしています */
(function(){
  'use strict'

  // 画面やボタン、効果音の要素を取り出しています（存在しない場合もある）
  const screen = document.getElementById('screen')
  const btn = document.getElementById('btn-susumu')
  const se = document.getElementById('se-button')

  // ページ読み込み時に軽いフェードインを行うハンドラ
  window.addEventListener('load', ()=>{
    // ブラウザのレンダリングタイミングに合わせ、少し遅延して .visible を付与
    requestAnimationFrame(()=>{
      setTimeout(()=>screen.classList.add('visible'), 50)
    })
  })

  // 遷移中にユーザー操作を遮断するためのオーバーレイ要素を生成
  const transitionBlocker = document.createElement('div')
  transitionBlocker.className = 'transition-blocker'
  transitionBlocker.innerHTML = '<div class="hit" aria-hidden="true"></div>'
  document.body.appendChild(transitionBlocker)

  // --- ブロッカー関連 ---
  // ブロッカーを有効化するユーティリティ
  // 使い方: 遷移中にユーザーがボタンを押せないようにするために表示します
  function _activateBlocker(){
    transitionBlocker.classList.add('active')
  }
  // ブロッカーを無効化するユーティリティ
  function _deactivateBlocker(){
    transitionBlocker.classList.remove('active')
  }

  // 指定 URL へフェードアウトして遷移する関数
  // 使い方: fadeOutNavigate('next.html') と呼ぶと、画面をフェードアウトしてから遷移します
  function fadeOutNavigate(targetUrl, duration=400){
    // 再生中の効果音があれば止めて最初に戻します
    try{ if(se && !se.paused){ se.pause(); se.currentTime = 0 } }catch(e){}
    // ボタンなどの操作を受け付けないようにする
    _activateBlocker()
    // 見た目を消す（フェードアウト）
    if(screen){
      screen.classList.remove('visible')
      try{ screen.style.opacity = 0 }catch(e){}
    }
    // 指定ミリ秒後にページを切り替えます
    setTimeout(()=>{ location.href = targetUrl }, duration)
  }

  // フェードアウトしてからコールバックを実行する（遷移ではなく別の処理を行いたい時に使う）
  function fadeOutThen(callback, duration=400){
    _activateBlocker()
    if(screen){
      screen.classList.remove('visible')
      try{ screen.style.opacity = 0 }catch(e){}
    }
    setTimeout(()=>{
      try{ callback() }catch(e){}
      // 少し遅れてブロッカーを外す。安全のための小さな余裕時間です。
      setTimeout(()=>{ _deactivateBlocker() }, 300)
    }, duration)
  }

  // 公開 API をグローバルに露出します。
  // 他のスクリプトから scene.js の機能を使いたいときは window.transitionAPI を使ってください。
  window.transitionAPI = {
    fadeOutNavigate,
    fadeOutThen,
    _activateBlocker,
    _deactivateBlocker
  }

  // 画像読み込みエラーをコンソールに出す簡易ロギング
  document.querySelectorAll('img').forEach(img=>{
    img.addEventListener('error', ()=>{
      console.error('Image failed to load:', img.src)
    })
  })

})();

