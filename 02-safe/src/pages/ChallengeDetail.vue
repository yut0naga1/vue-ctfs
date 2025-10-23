<template>
  <div>
    <h2>{{ challenge?.title }}</h2>
    <p>タグ: {{ challenge?.tags.join(', ') }}</p>
    <hr />
    <template v-if="challenge?.id === 'xss'">
      <h3>脆弱UI（XSS）</h3>
      <div style="background:#fffbe6;border:1px solid #f0d24a;padding:.75rem;border-radius:8px;margin:.5rem 0">
        <p style="margin:.25rem 0"><strong>課題:</strong> v-html プレビューに DOM XSS を起こし、<code>window.__FLAG_XSS</code> の内容（フラグ）を取得して下のフォームに提出せよ。</p>
        <ol style="margin:.25rem 0 0 1.25rem">
          <li>下のテキストエリアに攻撃用HTMLを入力する。</li>
          <li>プレビュー領域でスクリプトが実行されることを確認する。</li>
          <li><code>alert(window.__FLAG_XSS)</code> などでフラグを表示し、<code>CTF{...}</code> を下のフォームから提出する。</li>
        </ol>
        <details style="margin-top:.5rem">
          <summary>ヒントを表示</summary>
          <ul style="margin:.25rem 0 0 1.25rem">
            <li><code>&lt;img src=x onerror=alert(1)&gt;</code></li>
            <li><code>&lt;img src=x onerror="alert(window.__FLAG_XSS)"&gt;</code></li>
            <li><code>&lt;svg onload=alert(1)&gt;&lt;/svg&gt;</code></li>
          </ul>
          <p style="margin:.25rem 0 0">※ <code>&lt;script&gt;</code> タグは <code>innerHTML</code> 経由では実行されませんが、<code>onerror</code> などのイベント属性は実行されます。</p>
        </details>
      </div>
      <textarea v-model="userInput" placeholder="ここに入力してプレビューを確認" style="width:100%; min-height:120px"></textarea>
      <div style="border:1px solid #ccc; padding:.5rem; margin-top:.5rem" v-html="userInput"></div>
    </template>

    <template v-else-if="challenge?.id === 'cookie'">
      <h3>課題: Cookie からセッション情報を読み取りフラグとして提出せよ</h3>
      <div style="background:#fffbe6;border:1px solid #f0d24a;padding:.75rem;border-radius:8px;margin:.5rem 0">
        <p>この脆弱版ではセッションID (sid) が Cookie に保存され、しかも JavaScript から直接参照できる設定になっています。</p>
        <p><strong>やること:</strong> Cookie に格納された sid の値を確認し、その文字列をフラグとして下のフォームに提出してください。</p>
        <details style="margin-top:.5rem">
          <summary>ヒントを表示</summary>
          <ul style="margin:.25rem 0 0 1.25rem">
            <li>DevTools → Application → Cookies で sid を確認できます。</li>
            <li>または XSS を使って <code>alert(document.cookie)</code> を実行し、Cookie 全体から sid を探してください。</li>
            <li>sid の値は初期状態では <code>demo-session</code> です。</li>
          </ul>
        </details>
      </div>
    </template>

    <template v-else-if="challenge?.id === 'csrf'">
      <h3>課題: CSRFで意図しない送金を発生させ、ウォレットに付与されたコードを提出せよ</h3>
      <div style="background:#fffbe6;border:1px solid #f0d24a;padding:.75rem;border-radius:8px;margin:.5rem 0">
        <p>この脆弱版では、ユーザーの意思に反して送金が行われうる挙動が残っています。攻撃者ページを踏んだ想定で“自動的に送られるリクエスト”を利用し、残高変動を引き起こしてください。</p>
        <ol>
          <li>現在の残高を確認：<code><a href="/api/wallet" target="_blank">/api/wallet</a></code></li>
          <li>下のボタンで攻撃をシミュレート（または自分で画像タグ等から自動リクエストを発生させる）。</li>
          <li>もう一度 <code>/api/wallet</code> を開き、<code>lastTransfer</code> とともに <strong>base64形式の「CSRFコード」</strong> が付与されていることを確認する。</li>
          <li>その <strong>CSRFコード</strong> を下のフォームに提出し、スコアを獲得せよ。</li>
        </ol>
        <p><strong>攻撃者ページ例:</strong></p>
        <pre style="background:#f5f5f5; padding:.5rem; border:1px solid #ddd; border-radius:6px; overflow:auto">
&lt;html&gt;
  &lt;body&gt;
    &lt;h1&gt;猫の画像だよ！&lt;/h1&gt;
    &lt;img src="http://localhost:5173/api/csrf/transfer?to=attacker&amp;amount=100"&gt;
  &lt;/body&gt;
&lt;/html&gt;
        </pre>
        <p>このようなページをユーザーが開くだけで、Cookie が自動送信され、意図せず送金が成立してしまいます。</p>
        <details style="margin-top:.5rem">
          <summary>ヒントを表示</summary>
          <ul style="margin:.25rem 0 0 1.25rem">
            <li>画像の読み込みなど、ユーザー操作が無くても発火するリクエストに注目。</li>
            <li>Cookie は同一サイト向けに自動送信されます（= なりすましが成立しうる）。</li>
            <li>CSRFコードは <code>to:amount</code> を base64 化した形式です（例: <code>attacker:100</code> → <code>YXR0YWNrZXI6MTAw</code>）。</li>
          </ul>
        </details>
      </div>
      <button @click="simulateCsrf">🚨 攻撃をシミュレート（imgリクエスト）</button>
    </template>

    <hr />
    <FlagForm v-if="challenge" :challenge-id="challenge.id" @solved="solved = true" />
    <p v-if="solved">Solved!</p>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FlagForm from '../components/FlagForm.vue'
type Challenge = { id: string; title: string; points: number; tags: string[]; solved: boolean }
const props = defineProps<{ id: string }>()
const challenge = ref<Challenge | null>(null)
const userInput = ref('')
const solved = ref<boolean>(false)
// 例: windowに不用意に露出している秘密（悪例）
;(window as any).__FLAG_XSS = 'CTF{v-html_is_dangerous}'

function simulateCsrf() {
  const img = new Image()
  img.src = '/api/csrf/transfer?to=attacker&amount=100'
  document.body.appendChild(img)
}
onMounted(async () => {
  const res = await fetch('/api/challenges/' + props.id, { credentials: 'include' })
  challenge.value = await res.json()
})
</script>
