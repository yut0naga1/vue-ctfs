<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ challengeId: string }>()
const flag = ref('')
const msg = ref<string | null>(null)
const duplicate = ref(false)

async function submit() {
  msg.value = null
  duplicate.value = false
  const res = await fetch('/api/flag/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ id: props.challengeId, flag: flag.value })
  })
  const data = await res.json()
  if (data.ok) {
    if (data.duplicate) {
      duplicate.value = true
      msg.value = 'この課題はすでにクリア済みです（スコアは加算されません）'
    } else {
      msg.value = 'Correct! 🎉 スコア +100'
    }
    flag.value = ''
  } else {
    msg.value = '不正解です…'
  }
}
</script>

<template>
  <form @submit.prevent="submit" style="margin-top:.5rem">
    <input v-model="flag" placeholder="CTF{...} または 文字列" />
    <button type="submit">提出</button>
    <p v-if="msg" :style="{ color: duplicate ? '#999' : '#0a0' }">{{ msg }}</p>
  </form>
</template>