/* prologue.js
	 とてもシンプルなプロローグの動き。
	 小学生でも分かるように、短く丁寧なコメントをつけています。

	 動きのルール：
	 - 5 枚の画像を順番に見せます。
	 - 「すすむ」ボタンを押すと次の画像になります。
	 - 最後の画像で「すすむ」を押すと育成画面へ移動します。
*/

;(function(){
	'use strict'

	// ボタンと画像の要素を取ってくる（HTML の id と合わせる）
	const screen = document.getElementById('screen')
	const btnNext = document.getElementById('btn-next')
	const prologueBody = document.getElementById('prologue-body')
	const se = document.getElementById('se-button')

	// 使う画像のリスト。index は 0 スタート
	const uiImages = [
		'assets/ui_text/prologue/01.png',
		'assets/ui_text/prologue/02.png',
		'assets/ui_text/prologue/03.png',
		'assets/ui_text/prologue/04.png',
		'assets/ui_text/prologue/05.png'
	]

	let idx = 0 // 今どの画像を見ているか
	// 遷移中フラグ（フェードアウト→画面遷移の間は入力を無視）
	let _navigating = false

	// simple button-lock helper to avoid double-activation from rapid clicks
	function lockButtons(ms){
		try{
			const t = typeof ms === 'number' ? ms : 600
			if(lockButtons._locked) return false
			lockButtons._locked = true
			setTimeout(()=>{ lockButtons._locked = false }, t)
			return true
		}catch(e){ return true }
	}

	// ボタン音を鳴らす（無ければ何もしない）
	function playSE(){ if(!se) return; try{ se.currentTime = 0; se.play().catch(()=>{}) }catch(e){} }

	// ヘルパー: CSS 変数を読み取る
	function getRootVar(name, fallback){
		try{
			const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
			return v || fallback
		}catch(e){ return fallback }
	}

	// ミリ秒文字列（"600ms" や "0.6s"）を数値ミリ秒に変換
	function toMs(v, fallback){
		if(!v) return fallback || 0
		v = String(v).trim()
		if(v.endsWith('ms')) return Math.round(parseFloat(v))
		if(v.endsWith('s')) return Math.round(parseFloat(v) * 1000)
		// 数値だけならそのまま
		const n = parseFloat(v)
		return Number.isFinite(n) ? Math.round(n) : (fallback || 0)
	}

	// i 番目の画像をフェード付きで表示する（画像が無ければ 0 に戻す）
	let _prologue_animating = false
	async function showImage(i){
		if(!prologueBody) return
		if(_prologue_animating) return // 多重実行を避ける
		_prologue_animating = true

		const src = uiImages[i] || uiImages[0]

		// CSS 変数を取得（fallback はデフォルト値）
		const fadeInStr = getRootVar('--prologue-body-fade-in', '600ms')
		const fadeOutStr = getRootVar('--prologue-body-fade-out', '400ms')
		const delayStr = getRootVar('--prologue-body-fade-delay', '0ms')
		const startOpStr = getRootVar('--prologue-body-opacity-start', '0')
		const endOpStr = getRootVar('--prologue-body-opacity-end', '1')

		const fadeInMs = toMs(fadeInStr, 600)
		const fadeOutMs = toMs(fadeOutStr, 400)
		const delayMs = toMs(delayStr, 0)
		const startOp = parseFloat(startOpStr) || 0
		const endOp = parseFloat(endOpStr) || 1

		// フェードアウト（現在の表示を消す）
		try{
			prologueBody.style.transition = `opacity ${fadeOutStr} ease`
			prologueBody.style.opacity = startOp
		}catch(e){}

		// フェードアウト時間が終わるのを待つ
		await new Promise(r => setTimeout(r, fadeOutMs + 20))

		// 画像差し替え
		prologueBody.src = src

		// フェードイン設定（遅延を付ける）
		try{
			// 遅延を含めた transition を設定してから opacity を上げる
			prologueBody.style.transition = `opacity ${fadeInStr} ease ${delayStr}`
			// 初期不透明度を確実にセットしてから次のフレームで end にする
			prologueBody.style.opacity = startOp
			requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ prologueBody.style.opacity = endOp }) })
		}catch(e){}

		// フェードインが終わるのを待つ（遅延 + duration）
		await new Promise(r => setTimeout(r, delayMs + fadeInMs + 20))

		_prologue_animating = false
	}

	// 次へ押したときの処理
	function next(){
		// アニメ中や遷移中は入力を無視して、インデックスの不整合を防ぐ
		if(_prologue_animating || _navigating) return
		// 最後の画像なら、本文をフェードアウト→画面フェード→遷移
		if(idx >= uiImages.length - 1){
			playSE()
			try{
				_navigating = true
				const fadeOutStr = getRootVar('--prologue-body-fade-out', '400ms')
				const startOp = parseFloat(getRootVar('--prologue-body-opacity-start', '0')) || 0
				const fadeOutMs = toMs(fadeOutStr, 400)
				if(prologueBody){ prologueBody.style.transition = `opacity ${fadeOutStr} ease`; prologueBody.style.opacity = startOp }
				// 本文フェードアウト完了後に画面全体をフェードアウト
				setTimeout(()=>{
					if(screen && screen.classList) screen.classList.remove('visible')
					const screenFadeMs = toMs(getRootVar('--transition-duration','400ms'), 400)
					setTimeout(()=>{ window.location.href = 'grow.html' }, screenFadeMs)
				}, fadeOutMs + 20)
			}catch(e){
				if(screen && screen.classList) screen.classList.remove('visible')
				setTimeout(()=>{ window.location.href = 'grow.html' }, 400)
			}
			return
		}
		// 次の画像へ
		idx += 1
		showImage(idx)
		playSE()
	}

	// 初期表示（最初の画像を表示してフェードイン）
	function start(){
		idx = 0
		showImage(idx)
		try{ if(screen && screen.classList) requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20)) }catch(e){}
		if(btnNext) btnNext.focus()
	}

	// ボタンに処理を付ける
	// ロック時間は CSS のフェード時間（out+delay+in）から動的に計算し、抜けを防止
	if(btnNext) btnNext.addEventListener('click', e=>{
		e && e.preventDefault()
		// 進行中なら即無視（多重インクリメント防止）
		if(_prologue_animating || _navigating) return
		try{
			const fadeInStr = getRootVar('--prologue-body-fade-in', '600ms')
			const fadeOutStr = getRootVar('--prologue-body-fade-out', '400ms')
			const delayStr = getRootVar('--prologue-body-fade-delay', '0ms')
			const lockMs = Math.max(900, toMs(fadeOutStr,400) + toMs(delayStr,0) + toMs(fadeInStr,600) + 80)
			if(!lockButtons(lockMs)) return
			btnNext.classList.add('disabled'); btnNext.setAttribute('aria-disabled','true')
			setTimeout(()=>{ try{ btnNext.classList.remove('disabled'); btnNext.removeAttribute('aria-disabled') }catch(e){} }, lockMs)
		}catch(e){ if(!lockButtons(900)) return }
		next()
	})

	// DOM 準備ができたら start を走らせる
	if(document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', ()=> setTimeout(start, 80))
	} else {
		setTimeout(start, 80)
	}

})();


