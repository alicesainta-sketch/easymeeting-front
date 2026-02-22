<template>
  <footer class="control-bar">
    <el-button
      class="control-icon-btn"
      :type="micEnabled ? 'primary' : 'info'"
      :title="micEnabled ? '关闭麦克风' : '开启麦克风'"
      :aria-label="micEnabled ? '关闭麦克风' : '开启麦克风'"
      plain
      @click="$emit('toggle-mic')"
    >
      <i :class="['iconfont', micEnabled ? 'icon-mic' : 'icon-mic-close']"></i>
    </el-button>
    <el-button
      class="control-icon-btn"
      :type="cameraEnabled ? 'primary' : 'info'"
      :title="cameraEnabled ? '关闭摄像头' : '开启摄像头'"
      :aria-label="cameraEnabled ? '关闭摄像头' : '开启摄像头'"
      plain
      @click="$emit('toggle-camera')"
    >
      <i :class="['iconfont', cameraEnabled ? 'icon-video2' : 'icon-video2-close']"></i>
    </el-button>
    <el-button
      class="control-icon-btn"
      :type="handRaised ? 'warning' : 'info'"
      :title="handRaised ? '取消举手' : '举手'"
      :aria-label="handRaised ? '取消举手' : '举手'"
      plain
      @click="$emit('toggle-hand-raise')"
    >
      <i class="iconfont icon-contact"></i>
    </el-button>
    <el-button
      class="control-icon-btn"
      :type="screenSharing ? 'danger' : 'info'"
      :title="screenSharing ? '停止共享屏幕' : '共享屏幕'"
      :aria-label="screenSharing ? '停止共享屏幕' : '共享屏幕'"
      plain
      @click="$emit('toggle-screen-share')"
    >
      <i
        :class="['iconfont', screenSharing ? 'icon-share-screen2-close' : 'icon-share-screen2']"
      ></i>
    </el-button>
    <el-button @click="$emit('back-detail')">返回详情</el-button>
    <el-button type="danger" @click="$emit('leave')">离开会议</el-button>
    <span class="shortcut-tip">快捷键：M 麦克风 / V 摄像头 / R 举手</span>
  </footer>
</template>

<script setup>
defineProps({
  micEnabled: {
    type: Boolean,
    default: true
  },
  cameraEnabled: {
    type: Boolean,
    default: true
  },
  handRaised: {
    type: Boolean,
    default: false
  },
  screenSharing: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'toggle-mic',
  'toggle-camera',
  'toggle-hand-raise',
  'toggle-screen-share',
  'back-detail',
  'leave'
])
</script>
