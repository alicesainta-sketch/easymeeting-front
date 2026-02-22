<template>
  <div class="stage-grid">
    <article class="stage-tile local">
      <video :ref="roomVideoRef" class="room-video" autoplay playsinline muted></video>
      <div v-if="showVideoPlaceholder" class="video-placeholder">你的视频已关闭</div>
      <span class="name-tag">{{ displayName || '我' }}</span>
      <span v-if="screenSharing" class="share-badge">共享中</span>
    </article>
    <article v-for="name in stageParticipants" :key="name" class="stage-tile remote">
      <div class="avatar">{{ name.slice(0, 1) }}</div>
      <div class="remote-status">
        <i
          v-if="!getParticipantState(name).mic"
          class="iconfont icon-mic-close"
          title="麦克风关闭"
        ></i>
        <i
          v-if="!getParticipantState(name).camera"
          class="iconfont icon-video2-close"
          title="摄像头关闭"
        ></i>
        <span v-if="getParticipantState(name).handRaised" class="raise-tag">举手</span>
      </div>
      <span class="name-tag">{{ name }}</span>
    </article>
    <p v-if="hiddenStageCount > 0" class="stage-hint">
      另有 {{ hiddenStageCount }} 位参会者在右侧列表中显示
    </p>
  </div>
</template>

<script setup>
defineProps({
  roomVideoRef: {
    type: [Object, Function],
    required: true
  },
  showVideoPlaceholder: {
    type: Boolean,
    default: false
  },
  displayName: {
    type: String,
    default: ''
  },
  screenSharing: {
    type: Boolean,
    default: false
  },
  stageParticipants: {
    type: Array,
    default: () => []
  },
  hiddenStageCount: {
    type: Number,
    default: 0
  },
  getParticipantState: {
    type: Function,
    required: true
  }
})
</script>
