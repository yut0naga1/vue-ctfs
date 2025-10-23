<template><h2>Challenges</h2><ul><li v-for="c in list" :key="c.id" style="margin-bottom:.5rem"><router-link :to="`/challenge/${c.id}`">{{ c.title }} ({{ c.points }} pt) - <strong>{{ c.tags.join(', ') }}</strong></router-link><span v-if="c.solved"> ✅</span></li></ul></template>
<script setup lang="ts">import { onMounted, ref } from 'vue'
type Challenge = { id: string; title: string; points: number; tags: string[]; solved: boolean }
const list = ref<Challenge[]>([])
onMounted(async () => { const res = await fetch('/api/challenges', { credentials: 'include' }); list.value = await res.json() })
</script>
