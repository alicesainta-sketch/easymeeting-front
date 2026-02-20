<template>
  <div class="header" :style="{ 'border-bottom': showBottomBorder ? '1px solid #ddd' : 'none' }">
    <div v-if="title" class="title">{{ title }}</div>
    <Titlebar :close-type="closeType" :show-max="showMax"></Titlebar>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String
  },
  showMax: {
    type: Boolean,
    default: true
  },
  showBottomBorder: {
    type: Boolean,
    default: false
  },
  closeType: {
    type: Number,
    default: 1
  }
})
</script>

<style lang="scss" scoped>
.header {
  height: 30px;
  -webkit-app-region: drag;
  text-align: center;
  padding-top: 5px;
}
</style>
