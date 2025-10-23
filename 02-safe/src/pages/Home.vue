<template><h1>Vue.js セキュリティ CTF デモ</h1><p>ローカル環境でのみ実行してください。学習目的以外での攻撃は厳禁です。</p><ul><li>Step 1: <code>npm install</code></li><li>Step 2: <code>npm run server</code>（別ターミナルで）</li><li>Step 3: <code>npm run dev</code></li></ul></template>
<script setup lang="ts">import { onMounted } from 'vue'
onMounted(async () => { await fetch('/api/session', { credentials: 'include' }) })
</script>
