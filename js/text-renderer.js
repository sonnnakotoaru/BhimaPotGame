(function(){
  'use strict'

  const ROOT = window || globalThis
  const instances = new Map()
  let idCounter = 1

  function create(cfg){
    if(!cfg) throw new Error('missing config')
    const parent = cfg.parent || document.getElementById('screen') || document.body
    const id = 'generated-text-'+(idCounter++)
    const el = document.createElement('div')
    el.className = 'generated-text'
    el.id = id
    el.style.left = (cfg.left||0)+'px'
    el.style.top = (cfg.top||0)+'px'
    if(cfg.font_size) el.style.fontSize = (cfg.font_size)+'px'
    // optional letter spacing (accept number -> px, or string like '0.1em')
    if(cfg.letter_spacing !== undefined){
      el.style.letterSpacing = (typeof cfg.letter_spacing === 'number') ? (cfg.letter_spacing + 'px') : cfg.letter_spacing
    }
    if(cfg.width) el.style.width = cfg.width+'px'
    if(cfg.maxWidth) el.style.maxWidth = cfg.maxWidth+'px'
    // color + outline
    if(cfg.text_color) el.style.color = cfg.text_color
    if(cfg.outline_color){
      // use text-shadow fallback for thicker outline effect
      const oc = cfg.outline_color
      el.style.webkitTextStrokeColor = oc
      el.style.webkitTextStrokeWidth = (cfg.outline_width||1)+'px'
      // subtle multi-shadow outline for non-webkit
      el.style.textShadow = `-1px -1px 0 ${oc}, 1px -1px 0 ${oc}, -1px 1px 0 ${oc}, 1px 1px 0 ${oc}`
      el.classList.add('outlined')
    }

    parent.appendChild(el)

    const instance = {
      id, el, cfg,
      _running: false,
      _timerIds: []
    }

    instances.set(id, instance)

    function start(){
      if(instance._running) return
      instance._running = true
      const text = cfg.text || ''
      const effect = cfg.effect || 'typewriter'
      if(effect === 'typewriter'){
        const speed = cfg.type_speed || 40
        el.textContent = ''
        for(let i=0;i<text.length;i++){
          const t = setTimeout(((ch)=>()=>{ el.textContent += ch })(text[i]), i*speed)
          instance._timerIds.push(t)
        }
        const doneT = setTimeout(()=>{
          instance._running = false
          cfg.onComplete && cfg.onComplete()
        }, text.length* (cfg.type_speed||40) + 20)
        instance._timerIds.push(doneT)
      }else{
        // instant
        el.textContent = cfg.text || ''
        instance._running = false
        cfg.onComplete && cfg.onComplete()
      }
    }

    function scheduleStart(){
      if(cfg.trigger_type === 'click'){
        // start when el is clicked
        const handler = (e)=>{ start(); el.removeEventListener('click', handler) }
        el.addEventListener('click', handler)
      }else{
        // auto after wait_time seconds (default 1.5)
        const waitMs = Math.round((cfg.wait_time||1.5)*1000)
        const tid = setTimeout(()=> start(), waitMs)
        instance._timerIds.push(tid)
      }
    }

    // allow external control: clear scheduled timers (so caller can measure & then call start())
    function clearScheduled(){
      (instance._timerIds||[]).forEach(t=>clearTimeout(t))
      instance._timerIds.length = 0
    }

    // position adjustments can be applied later via instance.el.style.left/top

    // apply initial content if trigger_type is click we may want placeholder
    if(cfg.trigger_type === 'click' && cfg.placeholder) el.textContent = cfg.placeholder
  // schedule
  scheduleStart()

  // expose control methods on the instance
  instance.start = start
  instance.clearScheduled = clearScheduled

    return instance
  }

  function clear(id){
    const inst = instances.get(id)
    if(!inst) return
    inst._timerIds.forEach(t=>clearTimeout(t))
    try{ inst.el.remove() }catch(e){}
    instances.delete(id)
  }

  ROOT.TextRenderer = { create, clear }

})()
