# Vue.js セキュリティ CTF （脆弱版 + 安全版）

このリポジトリは **ローカル学習用** に作られた Vue.js セキュリティ演習環境です。  

目的は XSS / Cookie の誤設定 / CSRF / レート制限 といった代表的な脆弱性を理解し、脆弱版と対策版を比較することです。

**学習以外での攻撃目的での使用は厳禁**。

Future Tech Blogにて解説記事を公開予定です。

## 同梱内容（概要）
```
01-vulnerable/   # 教材用の脆弱版（v-htmlによるDOM XSS、httpOnly=false Cookie、GETで副作用が起きるCSRFなど）
02-safe/         # 対策実装（v-html不使用、httpOnly Cookie、CSRFトークン + POST、レート制限）
```

各ディレクトリは独立して動作します（ポートや設定は同一なので別々の端末で起動してください）。

---

## 前提ソフトウェア
- Node.js（推奨 v18+）と npm/yarn がインストールされていること
- ブラウザ（Chrome/Firefox等）で localhost にアクセス可能であること

---

## 起動手順（例）

### 脆弱版を起動する
```bash
cd 01-vulnerable
npm install
npm run server   # APIサーバ: http://localhost:3001
npm run dev      # フロントエンド: http://localhost:5173
```
別ターミナルで npm run server と npm run dev を起動してください。dev は Vite を使いフロントを 5173 で公開し、/api は 3001 のサーバへプロキシされます。

安全版を起動する（使い方は同じ）
```
cd 02-safe
npm install
npm run server
npm run dev
```

⸻

構成と主要ファイル
•	src/ … フロントエンド（Vue 3 + Vite）ソース
	
•	src/pages/ChallengeDetail.vue … 各課題ページ（XSS / Cookie / CSRF）
	
•	src/components/FlagForm.vue … フラグ提出フォーム（/api/flag/verify を呼ぶ）
	
•	server/index.js … Express ベースの簡易 API サーバ（脆弱版 / 安全版で実装差あり）
	
•	/api/session … Cookie（sid, csrfToken）を発行する
	
•	/api/wallet … 残高・lastTransfer・csrfCode などを返す（学習用）
	
•	/api/csrf/transfer … 脆弱版: GET で送金が成立（CSRFの悪例）
	
•	/api/transfer … 安全版: POST + CSRFトークン検証で送金
	
•	/api/flag/verify … 提出された値を検証し、正解ならスコアを追加
	
•	/api/reset … 学習用リセット（そのセッションの残高を 1000 に戻す）

⸻

課題の解き方（概要）

各課題ページに手順とヒントが載っています。ここでは要点のサマリを示します。

1) DOM XSS（v-html の乱用） — 脆弱版
•	課題ページのテキストエリアに HTML を入力すると、v-html によってそのまま DOM に挿入されます。

•	ペイロード例（ヒント欄に記載）:

•	`<img src=x onerror=alert(1)>`
	
•	`<img src=x onerror="alert(window.__FLAG_XSS)">`
	
•	ゴール：window.__FLAG_XSS（教材用にグローバルに置いてあります）を読み取り、CTF{...} を提出すること。
	
•	安全版は v-html を使わずプレーンテキスト表示にしてあります。

3) Cookie の危険な使い方 — 脆弱版
	•	/api/session が sid Cookie を httpOnly: false で発行しているため、document.cookie で参照可能です。

	•	ゴール：sid の値（初期値は demo-session）を取得してフラグとして提出すること。

	•	ヒント：DevTools の Application → Cookies で見るか、XSS を使って alert(document.cookie) を実行する方法があります。
	
	•	安全版では sid は httpOnly: true のため JS から見えません（DevTools の Cookies でのみ確認可）。

5) CSRF（クロスサイトリクエストフォージェリ） — 脆弱版
	•	悪い例として、GET リクエストで送金が成立する API（/api/csrf/transfer?to=attacker&amount=100）を用意しています。
	
	•	攻撃者は次のようなページを作って被害者に開かせます（例）:

```
<html>
  <body>
    <h1>猫の画像だよ！</h1>
    <img src="http://localhost:5173/api/csrf/transfer?to=attacker&amount=100">
  </body>
</html>
```

→ ページを開くと画像読み込みで自動的に GET リクエストが飛び、Cookie が付与されたユーザーの残高が減ります。

•	ゴール（変更点）: 送金が成功するとサーバ側の wallet に base64 の CSRFコード を付与します。/api/wallet でコードを確認し、そのコードを提出フォームに入力して正解を得る流れです。
	
•	安全版では送金は POST /api/transfer でしか受け付けず、csrfToken Cookie と x-csrf-token ヘッダの一致が必須です（Double Submit パターン）。さらにレート制限を適用しています。

⸻

リセット方法（学習用）

•	学習用に /api/reset エンドポイントを用意しています（本番では無効化すべき）。
	
•	使い方（curl 例）:
```
curl -X POST http://localhost:3001/api/reset -c cookies.txt -b cookies.txt
```
•	ブラウザからは DevTools の Application → Cookies で sid を削除してページをリロードする方法も簡単です。

⸻

よくあるトラブルと対処
	
•	/api/wallet が空または balance:0 のまま
	
•	サーバのメモリが初期化されていない場合があります。npm run server を再起動すると wallets マップはリセットされます。
	
•	cookie の sid が異なると別セッションが見えることがあります（DevTools で確認）。
	
•	XSS を試したが alert が出ない
	
•	ブラウザがタグ・属性をサニタイズしている、または CSP（Content-Security-Policy）が働いている可能性があります。教材のローカルビルドでは通常は問題ありませんが、<script> タグは innerHTML 経由で実行されない点にも注意してください。onerror や onload などのイベント属性は有効です。
	
•	CSRF が効かない（安全版）
	
•	安全版は POST + トークン検証で拒否されます。脆弱版での再現を試してください。

⸻

セキュリティに関する注意
	
•	このリポジトリには意図的に脆弱な実装が含まれます。公開環境やインターネット接続された環境で実行しないでください。学習用にローカルで閉じた環境のみで利用してください。
	
•	実運用では以下のような対策を常に行ってください：
	
•	ユーザ入力は必ずエスケープ（DOM挿入は厳格に制御）

•	Cookie は機密情報なら httpOnly と secure と SameSite を適切に設定
	
•	副作用のある操作は POST に限定し、CSRF トークンを検証
	
•	レート制限を導入し、異常なリクエストを検知する

⸻

ライセンス・免責
	•	教材は教育目的でGitHubおよびFuture技術ブログ上で公開します。利用は自己責任でお願いします。
	•	本リポジトリのコードを用いて発生した損害について作者は責任を負いません。

