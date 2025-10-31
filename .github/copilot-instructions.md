## BhimaPotGame — Copilot 用短縮ガイド

目的: このリポジトリで AI 補助（Copilot 等）が素早く安全に実装を進められるよう、必須ルール、アーキテクチャの要点、よくあるパターンと例を手早くまとめます。

- 主要技術: 静的 HTML + CSS + Vanilla JS。各シーンは個別の HTML（例: `grow.html`, `index.html`）と対応する `css/*.css`, `js/*.js` で表現される。
- アセットはすべて `assets/` 以下に格納。画像は事前に 1280×720 px で作られている前提で、拡大・縮小・フィルタは禁止（原寸表示）。

重要な設計方針（短く）
- 画面解像度固定: 1280×720 を基準。screen コンテナ（ID 'screen'）を使い、body は黒背景・overflow:hidden・中央配置を前提にする（参考: index.html テンプレート）。
- 表現は CSS の `opacity` を用いたフェードのみ。黒レイヤーでのフェードや CSS フィルター（blur 等）は禁止（詳しくは `.github/copilot-coding-rules.md`）。
- 画像は原寸で `img` 要素として配置し、必ず `image-rendering: pixelated` 等を付ける。パスは常に `assets/...` で始める。

典型的な実装パターン（即利用できる例）
- ボタン: `<img id="btn-susumu" class="btn-ui" src="assets/ui_button/...">` とし、効果音は `<audio id="se-button" src="assets/sound/se/se_button_click.mp3" preload="auto">` を使う（`js/index.js` を参照）。
- フェード遷移: 各ページはロード時に screen に visible クラスを付与（例: screen に visible クラスを追加）、遷移時は transitionAPI.fadeOutNavigate(url) が使える想定（js/grow.js はフォールバック実装を提供している）。
- シーン固有のロジック: `js/grow.js` にあるように、DOM 要素を id でキャッシュし、タイミングは TIMINGS 定数で調整する（`window.growTimings` を公開）。これは他シーンでも同様の設計を踏襲してください。

統合ポイント（AI が触るときに注意）
- `window.transitionAPI` / `window.router` の存在を確認してから利用する。フォールバックが用意されていることが多いが、破壊的変更は厳禁。
- `TextRenderer`（`.github/text_renderer.md`）は内部生成のテキスト表示 API。使用時は `create` / `clear` の契約に従う。
- オーディオ: `preload="auto"` を使い、`play()`/`pause()`/`currentTime` を明示的に制御する。ブラウザのオーディオポリシーに注意（ユーザー操作トリガーが必要な場合あり）。

コーディング上の具体的ルール（守るべきもの）
- 画像は拡大縮小禁止・CSS トランスフォーム禁止。`width:auto;height:auto` を使って原寸表示。
- フェードは `opacity` のみ。黒オーバーレイや半透明黒を使った演出は行わない。
- CSS フィルタ（blur, contrast 等）やグラデーションは使わない。
- 効果音は必ず `preload="auto"`。連打防止や短時間ロックの慣習あり（`js/index.js` の playSE を参照）。

デバッグ & ローカル実行（簡潔）
- ビルド不要: ファイルは静的なので、ブラウザで `*.html` を開くか、簡易サーバで配信すれば動作確認できる。
  - 例 (PowerShell): `python -m http.server 8000` をリポジトリルートで実行してブラウザで http://localhost:8000 を開く。
- DOM とコンソールログでデバッグ。`console.debug` が意図的に残されている箇所がある（例: `updateGauges` のデバッグ出力）。

安全に AI が編集する際の注意（必読）
- UX/アートルールに厳格: 画像サイズや表現ルールはアートワークとの整合性を壊しやすいため、自動で CSS や画像パスを書き換えないこと。
- 既存の id / audio element を再利用する。たとえば `se-button`, `bgm`, `se-heart` などの id は他のスクリプトから参照されている。
- シーン遷移やエンド条件の変更は副作用が大きい: 既存の `performVesselBreak` / `showDialogFor` / `showAutoDialog` の流れを理解してから変更する。

参照すべきファイル（最初に読む順）
1. `.github/copilot-coding-rules.md` — 画面表現ルールの元文書（既存ルールを尊重する）。
2. `grow.html` / `js/grow.js` — 最も複雑なシーン。アニメ、SE、ゲージ、遷移の実装例。
3. `index.html` / `js/index.js` — シンプルなテンプレート例（遷移の扱いが明確）。
4. `.github/text_renderer.md` — 内部テキストレンダラの API 使用例。

最後に: このファイルは「必読の最短ガイド」です。内容に不足・誤解があれば、どの項目を補足すべきか教えてください。短い例やテンプレートを追加してマージします。
