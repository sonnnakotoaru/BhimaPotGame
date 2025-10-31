Text Renderer Usage

This project includes a lightweight internal text renderer exposed as `TextRenderer`.

Example:

```html
<script src="js/scene.js"></script>
<script src="js/text-renderer.js"></script>
<script>
  // create a generated text instance
  const inst = TextRenderer.create({
    parent: document.getElementById('screen'),
    text: 'はじめまして。\nこれは自動で表示されるテキストです。',
    left: 80,
    top: 200,
    font_size: 40,
    text_color: '#ffffff',
    outline_color: '#000000',
    wait_time: 1.5,
    trigger_type: 'auto',
    effect: 'typewriter',
    type_speed: 30,
    onComplete: ()=>{ console.log('done') }
  })
</script>
```

Notes:
- Font used: `assets/font/Kaisotai-Next-UP-B.ttf` (registered as `KaisotaiNext` via CSS).
- You can call `TextRenderer.clear(inst.id)` to remove the generated text and cancel pending timers.
- For click triggers set `trigger_type: 'click'` and optionally provide `placeholder` for pre-click text.
