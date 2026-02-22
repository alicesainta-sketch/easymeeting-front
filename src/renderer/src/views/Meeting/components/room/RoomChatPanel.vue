<template>
  <section class="side-card chat-card">
    <div class="card-title-row">
      <h4>聊天（本地）</h4>
      <el-button link type="primary" :disabled="!chatMessages.length" @click="$emit('clear-chat')">
        清空
      </el-button>
    </div>
    <div :ref="chatListRef" class="chat-list">
      <p v-if="!chatMessages.length" class="chat-empty">暂无消息</p>
      <div v-for="message in chatMessages" :key="message.id" :class="['chat-item', message.type]">
        <strong>{{ message.sender }}</strong>
        <span>{{ message.content }}</span>
        <time>{{ message.time }}</time>
      </div>
    </div>
    <div class="chat-input-row">
      <el-input
        :ref="chatInputRef"
        :model-value="chatInput"
        placeholder="发送消息（仅本地展示）"
        @update:model-value="$emit('update:chat-input', $event?.trim?.() ?? $event)"
        @keyup.enter="$emit('send-chat')"
      ></el-input>
      <el-popover
        :visible="emojiPopoverVisible"
        placement="top"
        trigger="click"
        :width="260"
        @update:visible="$emit('update:emoji-popover-visible', $event)"
      >
        <template #reference>
          <el-button class="emoji-btn" :aria-label="'选择表情'" title="选择表情">
            <i class="iconfont icon-emoji"></i>
          </el-button>
        </template>
        <div class="emoji-picker">
          <button
            v-for="emoji in emojiList"
            :key="emoji"
            type="button"
            class="emoji-item"
            @click="$emit('append-emoji', emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </el-popover>
      <el-button type="primary" @click="$emit('send-chat')">发送</el-button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  chatListRef: {
    type: [Object, Function],
    required: true
  },
  chatInputRef: {
    type: [Object, Function],
    required: true
  },
  chatMessages: {
    type: Array,
    default: () => []
  },
  chatInput: {
    type: String,
    default: ''
  },
  emojiPopoverVisible: {
    type: Boolean,
    default: false
  },
  emojiList: {
    type: Array,
    default: () => []
  }
})

defineEmits([
  'clear-chat',
  'send-chat',
  'append-emoji',
  'update:chat-input',
  'update:emoji-popover-visible'
])
</script>
