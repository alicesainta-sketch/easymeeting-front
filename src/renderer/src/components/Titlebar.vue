<template>
  <div
    class="op-btns"
    :style="{
      top: `${styleTop}px`,
      right: `${styleRight}px`,
      'border-radius': `${borderRadius}px`
    }"
  >
    <div
      v-if="showMin"
      :style="{ 'border-radius': `${borderRadius}px` }"
      class="iconfont icon-min"
      title="最小化"
      @click="minimize()"
    ></div>
    <div
      v-if="showMax"
      :style="{ 'border-radius': `${borderRadius}px` }"
      :class="['iconfont', isMax ? 'icon-maximize' : 'icon-max']"
      :title="isMax ? '还原' : '最大化'"
      @click="maximize()"
    ></div>
    <div
      v-if="showClose"
      :style="{ 'border-radius': `${borderRadius}px` }"
      class="iconfont icon-close"
      title="关闭"
      @click="closeWindow()"
    ></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

defineProps({
  showMin: {
    type: Boolean,
    default: true
  },
  showMax: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  closeType: {
    type: Number,
    default: 1
  },
  styleTop: {
    type: Number,
    default: 0
  },
  styleRight: {
    type: Number,
    default: 0
  },
  borderRadius: {
    type: Number,
    default: 0
  },
  forceClose: {
    type: Boolean,
    default: true
  }
})

const isMax = ref(false)
const maxStateListener = (_, state) => {
  if (typeof state !== 'boolean') return
  isMax.value = state
}

const minimize = () => {
  window.electron?.ipcRenderer?.send('window-minimize')
}

const maximize = async () => {
  const nextState = await window.electron?.ipcRenderer?.invoke('window-toggle-maximize')
  if (typeof nextState === 'boolean') {
    isMax.value = nextState
  }
}

const closeWindow = () => {
  window.electron?.ipcRenderer?.send('window-close')
}

onMounted(() => {
  window.electron?.ipcRenderer?.on('window-maximized', maxStateListener)
})

onUnmounted(() => {
  window.electron?.ipcRenderer?.removeListener('window-maximized', maxStateListener)
})
</script>

<style lang="scss" scoped>
.op-btns {
  position: absolute;
  z-index: 10;
  -webkit-app-region: no-drag;
  display: flex;
  .iconfont {
    color: var(--text);
    padding: 6px;
    cursor: pointer;
    &:hover {
      background: #ddd;
    }
  }
  .icon-close {
    &:hover {
      background: #fa4e32;
      color: #fff;
    }
  }
  .win-top {
    color: var(--pink);
  }
}
</style>
