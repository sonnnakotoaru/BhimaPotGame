/*
  prologue-text.js
  - ここは「プロローグ（物語のはじまり）」専用の文章をまとめたファイルです。
  - 中学生向けに簡単に言うと: プロローグで画面に順番に出すセリフ（グループ）を定義しています。
  - 使い方: 他のファイルから `PrologueText.start()` を呼ぶと、定義したセリフを順に表示します。
*/

(function(){
  'use strict'

  // Prologue groups (only group definitions live here)
  const prologueGroups = [
  { trigger: 'click', _class: ['prologue-style-1','line-1'], lines: [ `宿敵が召喚された――その一報を受け、ビーマは召喚室へと向かった。
そこに居たのは、器に入ったまま朧げに揺らめく小さなドゥリーヨダナ。` ] },
  { trigger: 'click', wait: 0.1, _class: ['prologue-style-2','line-2'], lines: [ `その姿は、影絵のように淡く、今にも消え入りそうであった。
ダ・ヴィンチによる解析で、それが「霊基異常」による不完全な召喚であると判明する。` ] },
  { trigger: 'click', wait: 0.1, _class: ['prologue-style-3','line-3'], lines: [ `このままでは、数日と経たず退去してしまうだろう――。
小さなドゥリーヨダナは記憶も定かでなく、ただ器の中で揺らぎ続けていた。` ] },
  { trigger: 'click', wait: 0.1, _class: ['prologue-style-4','line-4'], lines: [ `「……最後まで、こいつの傍にいてやりたい」` ] },
  { trigger: 'click', wait: 0.1, _class: ['prologue-style-5','line-5'], lines: [ `マスターにそう告げたビーマは器を抱え、自室へと歩き出した。` ] }
  ];

  function startPrologueText(container){
    const target = container || document.getElementById('screen') || document.body
    const normalizedGroups = prologueGroups.map(g => {
      const base = ['generated-text', 'multi-line', 'align-center', 'pos-top']
      const extra = Array.isArray(g._class) ? g._class : []
      const classes = base.concat(extra)
      return Object.assign({}, g, {_class: classes})
    })
    // window.ITTR が使えることを前提に実行します。もし無ければエラーを返します。
    return window.ITTR && window.ITTR.run ? window.ITTR.run(normalizedGroups, target) : Promise.reject(new Error('ITTR not available'))
  }

  // Expose small API
  try{ if(typeof window !== 'undefined') window.PrologueText = { start: startPrologueText } }catch(e){}

})()
