import { nextTick, ref, watch } from 'vue'

const emojiList = [
  '😀',
  '😄',
  '😂',
  '🙂',
  '😉',
  '😍',
  '🤔',
  '👍',
  '👏',
  '🎉',
  '🚀',
  '✅',
  '❗',
  '❤️',
  '🙏',
  '😅'
]

const MAX_CHAT_MESSAGES = 150

const useRoomChat = ({ joined, displayName }) => {
  const chatListRef = ref(null)
  const chatInputRef = ref(null)

  const chatInput = ref('')
  const chatMessages = ref([])
  const emojiPopoverVisible = ref(false)

  const formatClock = (time) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(time))
  }

  const appendChatMessage = (sender, content, type = 'normal') => {
    if (!content) return
    chatMessages.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender,
      content,
      type,
      time: formatClock(Date.now())
    })
    if (chatMessages.value.length > MAX_CHAT_MESSAGES) {
      chatMessages.value.splice(0, chatMessages.value.length - MAX_CHAT_MESSAGES)
    }
  }

  const scrollChatToBottom = async () => {
    await nextTick()
    if (!chatListRef.value) return
    chatListRef.value.scrollTop = chatListRef.value.scrollHeight
  }

  const clearChatMessages = () => {
    chatMessages.value = []
  }

  const appendEmoji = (emoji) => {
    if (!emoji) return
    chatInput.value = `${chatInput.value || ''}${emoji}`
    emojiPopoverVisible.value = false
    nextTick(() => {
      chatInputRef.value?.focus?.()
    })
  }

  const sendChatMessage = () => {
    if (!joined.value) return
    if (!chatInput.value) return
    appendChatMessage(displayName.value || '我', chatInput.value, 'self')
    chatInput.value = ''
  }

  const resetChatState = ({ clearMessages = true } = {}) => {
    chatInput.value = ''
    emojiPopoverVisible.value = false
    if (clearMessages) {
      chatMessages.value = []
    }
  }

  watch(
    () => chatMessages.value.length,
    async () => {
      await scrollChatToBottom()
    }
  )

  return {
    chatListRef,
    chatInputRef,
    chatInput,
    chatMessages,
    emojiPopoverVisible,
    emojiList,
    appendChatMessage,
    clearChatMessages,
    appendEmoji,
    sendChatMessage,
    scrollChatToBottom,
    resetChatState
  }
}

export { useRoomChat }
