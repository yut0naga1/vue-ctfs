<template><form @submit.prevent="submit" style="display:flex; gap:.5rem; align-items:center; flex-wrap:wrap"><input v-model="flag" placeholder="CTF{...} または sid の値 または CSRFコード" style="flex:1; min-width:260px; padding:.5rem; border:1px solid #ccc; border-radius:8px" /><button style="padding:.5rem .75rem; border:1px solid #333; border-radius:8px; background:#000; color:#fff">Submit</button><p v-if="msg" style="margin:0 .5rem">{{ msg }}</p></form></template>
<script setup lang="ts">import { ref } from 'vue'
const props = defineProps<{ challengeId: string }>()
const emit = defineEmits<{ (e: 'solved'): void }>()
const flag = ref(''); const msg = ref('')
async function submit() { const res = await fetch('/api/flag/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: props.challengeId, flag: flag.value }) }); const data = await res.json(); msg.value = data.ok ? 'Correct! 🎉' : (data.error || 'Nope'); if (data.ok) emit('solved') }
</script>
