<template>
  <footer class="control-bar">
    <el-button
      class="control-icon-btn"
      :type="micEnabled ? 'primary' : 'info'"
      :title="resolveControlTitle(micEnabled ? '关闭麦克风' : '开启麦克风')"
      :aria-label="resolveControlTitle(micEnabled ? '关闭麦克风' : '开启麦克风')"
      plain
      :disabled="interactionDisabled"
      @click="$emit('toggle-mic')"
    >
      <i :class="['iconfont', micEnabled ? 'icon-mic' : 'icon-mic-close']"></i>
    </el-button>
    <el-button
      class="control-icon-btn"
      :type="cameraEnabled ? 'primary' : 'info'"
      :title="resolveControlTitle(cameraEnabled ? '关闭摄像头' : '开启摄像头')"
      :aria-label="resolveControlTitle(cameraEnabled ? '关闭摄像头' : '开启摄像头')"
      plain
      :disabled="interactionDisabled"
      @click="$emit('toggle-camera')"
    >
      <i :class="['iconfont', cameraEnabled ? 'icon-video2' : 'icon-video2-close']"></i>
    </el-button>
    <el-button
      class="control-icon-btn"
      :type="handRaised ? 'warning' : 'info'"
      :title="resolveControlTitle(handRaised ? '取消举手' : '举手')"
      :aria-label="resolveControlTitle(handRaised ? '取消举手' : '举手')"
      plain
      :disabled="interactionDisabled"
      @click="$emit('toggle-hand-raise')"
    >
      <i class="iconfont icon-contact"></i>
    </el-button>
    <el-button
      class="control-icon-btn"
      :type="screenSharing ? 'danger' : 'info'"
      :title="resolveControlTitle(screenSharing ? '停止共享屏幕' : '共享屏幕')"
      :aria-label="resolveControlTitle(screenSharing ? '停止共享屏幕' : '共享屏幕')"
      plain
      :disabled="interactionDisabled"
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
const props = defineProps({
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
  },
  interactionDisabled: {
    type: Boolean,
    default: false
  },
  interactionDisabledReason: {
    type: String,
    default: ''
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

// 控制条统一禁用提示，避免每个按钮重复判断
const resolveControlTitle = (defaultLabel) => {
  if (!props.interactionDisabledReason) return defaultLabel
  return `${defaultLabel}（${props.interactionDisabledReason}）`
}
</script>
