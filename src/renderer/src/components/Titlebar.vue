<template>
  <div></div>
</template>

<script setup></script>

<style lang="scss" scoped>
.op-btns {
  position: absolute;
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
