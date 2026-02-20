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
      :style="{ 'border-radius': `${borderRadius}px` }"
      v-if="showMin"
      class="iconfont icon-min"
      @click="minimize()"
      title="最小化"
    ></div>
    <div
      :style="{ 'border-radius': `${borderRadius}px` }"
      v-if="showMax"
      :class="['iconfont', isMax ? 'icon-maximize' : 'icon-max']"
      :title="isMax ? '还原' : '最大化'"
      @click="maximize()"
    ></div>
    <div
      :style="{ 'border-radius': `${borderRadius}px` }"
      v-if="showClose"
      class="iconfont icon-close"
      @click="closeWindow()"
    ></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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
    default: false
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

const minimize = () => {
  window.electron?.ipcRenderer?.send('window-minimize')
}

const maximize = () => {
  isMax.value = !isMax.value
  window.electron?.ipcRenderer?.send('window-maximize', isMax.value)
}

const closeWindow = () => {
  window.electron?.ipcRenderer?.send('window-close')
}
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
