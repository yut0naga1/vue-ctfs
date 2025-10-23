<template><h2>Scoreboard</h2><ul><li v-for="(r,idx) in rows" :key="idx">{{ r.name }} — {{ r.score }} pt</li></ul></template>
<script setup lang="ts">import { onMounted, ref } from 'vue'
type Row = { name: string; score: number }
const rows = ref<Row[]>([])
onMounted(async () => { const res = await fetch('/api/scoreboard', { credentials: 'include' }); rows.value = await res.json() })
</script>
