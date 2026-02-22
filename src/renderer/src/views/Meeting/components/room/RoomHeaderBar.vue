<template>
  <header class="in-room-header">
    <div>
      <h3>{{ title }}</h3>
      <p>房间号：{{ roomCode }}</p>
    </div>
    <div class="header-actions">
      <span>已加入 {{ roomElapsedText }}</span>
      <el-button size="small" @click="$emit('copy-room-code')">复制房间号</el-button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  roomCode: {
    type: String,
    default: ''
  },
  roomElapsedText: {
    type: String,
    default: '00:00'
  }
})

defineEmits(['copy-room-code'])
</script>
