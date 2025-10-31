;(function(){
	'use strict'

	const screen = document.getElementById('screen')
	const btnNext = document.getElementById('btn-next')
	const prologueBody = document.getElementById('prologue-body')
	const se = document.getElementById('se-button')
	let sePool = null

	// SE 再生の堅牢化: HTMLAudio と WebAudio の二段構え
	let seAudioMode = 'html' // 'webaudio' or 'html'
	let seAudioCtx = null
	let seAudioBuffer = null
	let seGainNode = null
	let seUnlockInstalled = false

	function isHttpProtocol(){
		try{ return typeof location !== 'undefined' && /^https?:$/i.test(location.protocol) }catch(e){ return false }
	}

	function installAudioContextUnlockers(){
		if(seUnlockInstalled) return
		seUnlockInstalled = true
		const resume = ()=>{ try{ if(seAudioCtx && seAudioCtx.state === 'suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){} }
		;['pointerdown','click','touchstart','keydown'].forEach(ev=>{
			try{ window.addEventListener(ev, resume, { once:false, passive:true }) }catch(e){}
		})
	}

	async function initWebAudioForSE(){
		try{
			const AC = window.AudioContext || window.webkitAudioContext
			if(!AC) return false
			seAudioCtx = seAudioCtx || new AC()
			seGainNode = seGainNode || seAudioCtx.createGain()
			try{ seGainNode.gain.value = 1.0 }catch(e){}
			try{ seGainNode.connect(seAudioCtx.destination) }catch(e){}
			installAudioContextUnlockers()
			if(!se || !se.src || !isHttpProtocol()){
				// file:// や src 未設定時は WebAudio を使わず HTMLAudio にフォールバック
				seAudioMode = 'html'
				return false
			}
			// 既にデコード済みならそれを使う
			if(seAudioBuffer){ seAudioMode = 'webaudio'; return true }
			const controller = new AbortController()
			const timeoutId = setTimeout(()=>{ try{ controller.abort() }catch(e){} }, 4000)
			const res = await fetch(se.src, { cache:'force-cache', signal: controller.signal })
			clearTimeout(timeoutId)
			const arr = await res.arrayBuffer()
			seAudioBuffer = await new Promise((resolve, reject)=>{
				try{ seAudioCtx.decodeAudioData(arr, resolve, reject) }catch(e){ reject(e) }
			})
			seAudioMode = 'webaudio'
			return true
		}catch(e){
			seAudioMode = 'html'
			return false
		}
	}

	function tryPlaySEWebAudio(){
		try{
			if(seAudioMode !== 'webaudio' || !seAudioCtx || !seAudioBuffer || !seGainNode) return false
			// iOS Safari 対策: 一度 resume を要求
			if(seAudioCtx.state === 'suspended'){
				try{ seAudioCtx.resume().catch(()=>{}) }catch(e){}
				// resume の完了を待たず予約再生（次のフレームで）
				setTimeout(()=>{ try{ const src = seAudioCtx.createBufferSource(); src.buffer = seAudioBuffer; src.connect(seGainNode); src.start(0) }catch(e){} }, 0)
				return true
			}
			const src = seAudioCtx.createBufferSource()
			src.buffer = seAudioBuffer
			src.connect(seGainNode)
			src.start(0)
			return true
		}catch(e){ return false }
	}
	function ensureSEPool(){
		try{
			if(sePool && sePool.length) return sePool
			if(!se) { sePool = []; return sePool }
			sePool = [se]
			// Safari 連打対策: 同一SEの複製を用意して同時再生・連続再生の取りこぼしを回避
			for(let i=1;i<5;i++){
				const a = se.cloneNode(true)
				try{ a.removeAttribute('id') }catch(e){}
				try{ a.preload = 'auto' }catch(e){}
				try{ a.currentTime = 0 }catch(e){}
				try{ a.setAttribute('playsinline','') }catch(e){}
				try{ document.body.appendChild(a) }catch(e){}
				try{ a.load() }catch(e){}
				sePool.push(a)
			}
			return sePool
		}catch(e){ sePool = se ? [se] : []; return sePool }
	}

	const uiImages = [
		'assets/ui_text/prologue/01.png',
		'assets/ui_text/prologue/02.png',
		'assets/ui_text/prologue/03.png',
		'assets/ui_text/prologue/04.png',
		'assets/ui_text/prologue/05.png'
	]

	let idx = 0 // 今どの画像を見ているか

	let _navigating = false

	function lockButtons(ms){
		try{
			const t = typeof ms === 'number' ? ms : 600
			if(lockButtons._locked) return false
			lockButtons._locked = true
			setTimeout(()=>{ lockButtons._locked = false }, t)
			return true
		}catch(e){ return true }
	}

	function playSE(){
		try{
			if(playSE._busy) return
			playSE._busy = true
			setTimeout(()=>{ playSE._busy = false }, 180)
			// まずは WebAudio での再生を試みる
			if(tryPlaySEWebAudio()) return
			const pool = ensureSEPool()
			if(!pool || !pool.length) return
			let el = null
			for(let i=0;i<pool.length;i++){
				const a = pool[i]
				try{
					if(a.paused || a.ended || (a.currentTime||0) === 0){ el = a; break }
				}catch(e){}
			}
			if(!el) el = pool[0]
			// pause を挟まず currentTime を戻して再生（Safari の競合回避）
			try{ el.currentTime = 0 }catch(e){}
			const p = (function(){ try{ return el.play() }catch(e){ return null } })()
			if(p && p.catch){ p.catch(()=>{ try{ el.load(); el.play().catch(()=>{}) }catch(e){} }) }
		}catch(e){}
	}

	function getRootVar(name, fallback){
		try{
			const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
			return v || fallback
		}catch(e){ return fallback }
	}

	function toMs(v, fallback){
		if(!v) return fallback || 0
		v = String(v).trim()
		if(v.endsWith('ms')) return Math.round(parseFloat(v))
		if(v.endsWith('s')) return Math.round(parseFloat(v) * 1000)

		const n = parseFloat(v)
		return Number.isFinite(n) ? Math.round(n) : (fallback || 0)
	}

	let _prologue_animating = false

	function preloadImage(src, timeoutMs){
		return new Promise((resolve)=>{
			try{
				const img = new Image()
				img.src = src
				let done = false
				const finish = ()=>{ if(done) return; done = true; resolve() }
				if(img.decode){ img.decode().then(finish).catch(finish) }
				img.onload = finish; img.onerror = finish
				if(typeof timeoutMs === 'number' && timeoutMs > 0){ setTimeout(finish, timeoutMs) }
			}catch(e){ resolve() }
		})
	}
	async function showImage(i){
		if(!prologueBody) return
		if(_prologue_animating) return // 多重実行を避ける
		_prologue_animating = true

		const src = uiImages[i] || uiImages[0]

		const preloadPromise = preloadImage(src, 1200)

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

		try{
			prologueBody.style.willChange = 'opacity'
			prologueBody.style.transition = `opacity ${fadeOutStr} ease`
			prologueBody.style.opacity = startOp
		}catch(e){}

		await new Promise(r => setTimeout(r, fadeOutMs + 20))

		try{ await preloadPromise }catch(e){}
		prologueBody.src = src

		try{

			prologueBody.style.transition = `opacity ${fadeInStr} ease ${delayStr}`

			prologueBody.style.opacity = startOp

			try{ void prologueBody.offsetWidth }catch(e){}
			requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ prologueBody.style.opacity = endOp }) })
		}catch(e){}

		await new Promise(r => setTimeout(r, delayMs + fadeInMs + 20))

		try{ prologueBody.style.willChange = '' }catch(e){}
		_prologue_animating = false
	}

	function next(){

		if(_prologue_animating || _navigating) return

		if(idx >= uiImages.length - 1){
			playSE()
			try{
				_navigating = true
				const fadeOutStr = getRootVar('--prologue-body-fade-out', '400ms')
				const startOp = parseFloat(getRootVar('--prologue-body-opacity-start', '0')) || 0
				const fadeOutMs = toMs(fadeOutStr, 400)
				if(prologueBody){ prologueBody.style.transition = `opacity ${fadeOutStr} ease`; prologueBody.style.opacity = startOp }

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

		idx += 1
		showImage(idx)
		playSE()
	}

	function start(){
		idx = 0
		showImage(idx)
		// WebAudio 初期化（可能なら）
		try{ initWebAudioForSE().catch(()=>{}) }catch(e){}
		try{ if(screen && screen.classList) requestAnimationFrame(()=> setTimeout(()=> screen.classList.add('visible'), 20)) }catch(e){}
		if(btnNext) btnNext.focus()
	}

	if(btnNext) btnNext.addEventListener('click', e=>{
		e && e.preventDefault()

		if(_prologue_animating || _navigating) return
		// クリックは確実なユーザー操作なので、AudioContext を再開しておく
		try{ if(seAudioCtx && seAudioCtx.state === 'suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){}
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

	// タブ復帰時に SE 資源をリフレッシュ
	try{
		document.addEventListener('visibilitychange', ()=>{
			if(document.visibilityState === 'visible'){
				try{ const pool = ensureSEPool(); for(const a of pool){ try{ a.load() }catch(e){} } }catch(e){}
				try{ if(seAudioCtx && seAudioCtx.state === 'suspended'){ seAudioCtx.resume().catch(()=>{}) } }catch(e){}
			}
		})
	}catch(e){}

	if(document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', ()=> setTimeout(start, 80))
	} else {
		setTimeout(start, 80)
	}

})();

