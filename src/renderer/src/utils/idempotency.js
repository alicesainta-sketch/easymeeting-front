// 幂等键生成：用于“创建会议”请求去重，避免重复提交
const buildIdempotencyKey = (prefix = 'mtg') => {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

export { buildIdempotencyKey }
