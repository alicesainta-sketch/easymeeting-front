<template>
  <el-dialog :model-value="modelValue" :title="title" width="980px" append-to-body @close="onClose">
    <div class="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
      <section class="space-y-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-base font-semibold text-slate-900">会议核心信息</h3>
              <p class="mt-1 text-xs text-slate-500">定义会议标题、主题与时间安排</p>
            </div>
            <el-tag type="info" effect="plain" size="small">{{ completionLabel }}</el-tag>
          </div>
          <el-form label-position="top" class="mt-4">
            <div class="grid gap-4 md:grid-cols-2">
              <el-form-item label="会议标题" required class="md:col-span-2">
                <el-input
                  v-model.trim="localForm.title"
                  maxlength="40"
                  placeholder="请输入标题"
                ></el-input>
              </el-form-item>
              <el-form-item label="会议主题" required class="md:col-span-2">
                <el-input v-model.trim="localForm.topic" placeholder="请输入主题"></el-input>
              </el-form-item>
              <el-form-item label="开始时间" required>
                <el-date-picker
                  v-model="localForm.startTime"
                  type="datetime"
                  value-format="x"
                  :disabled-date="disablePastDate"
                  placeholder="选择日期时间"
                  class="w-full"
                ></el-date-picker>
              </el-form-item>
              <el-form-item label="时长(分钟)" required>
                <el-input-number
                  v-model="localForm.durationMinutes"
                  :min="15"
                  :max="180"
                  class="w-full"
                ></el-input-number>
              </el-form-item>
            </div>
          </el-form>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-slate-900">参会与权限</h3>
              <p class="mt-1 text-xs text-slate-500">设置会议安全策略与入会规则</p>
            </div>
            <el-tag type="warning" effect="plain" size="small">策略设置</el-tag>
          </div>
          <el-form label-position="top" class="mt-4">
            <div class="grid gap-4 md:grid-cols-2">
              <el-form-item label="入会密码">
                <el-input
                  v-model.trim="localForm.roomPassword"
                  type="password"
                  show-password
                  maxlength="12"
                  placeholder="选填，4-12 位字母或数字"
                ></el-input>
              </el-form-item>
              <el-form-item label="会前入会">
                <el-switch
                  v-model="localForm.allowParticipantEarlyJoin"
                  active-text="允许参会者提前入会"
                  inactive-text="仅主持人/联席可提前入会"
                ></el-switch>
              </el-form-item>
              <el-form-item label="白名单" class="md:col-span-2">
                <el-input
                  v-model="localForm.waitingRoomWhitelist"
                  placeholder="自动通过等候室的成员，逗号分隔"
                ></el-input>
              </el-form-item>
            </div>
          </el-form>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-slate-900">参会人与议程</h3>
              <p class="mt-1 text-xs text-slate-500">完善参会人列表与会议议程</p>
            </div>
            <el-tag type="success" effect="plain" size="small">内容补充</el-tag>
          </div>
          <el-form label-position="top" class="mt-4">
            <div class="grid gap-4">
              <el-form-item label="参会人">
                <el-input
                  v-model="localForm.participants"
                  placeholder="多个参会人请使用逗号分隔"
                ></el-input>
              </el-form-item>
              <el-form-item label="议程">
                <el-input
                  v-model="localForm.agenda"
                  type="textarea"
                  :rows="3"
                  placeholder="一行一个议程"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注">
                <el-input
                  v-model="localForm.notes"
                  type="textarea"
                  :rows="2"
                  placeholder="可选"
                ></el-input>
              </el-form-item>
            </div>
          </el-form>
        </div>
      </section>

      <aside class="space-y-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="text-base font-semibold text-slate-900">会议预览</h3>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ previewTitle }}</p>
          <p class="mt-1 text-sm text-slate-500">{{ previewTopic }}</p>
          <div class="mt-4 space-y-2 text-xs text-slate-500">
            <div class="flex items-center justify-between">
              <span>开始时间</span>
              <span class="font-semibold text-slate-700">{{ startLabel }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>结束时间</span>
              <span class="font-semibold text-slate-700">{{ endLabel }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>会议时长</span>
              <span class="font-semibold text-slate-700">{{ durationLabel }}</span>
            </div>
          </div>
          <div class="mt-4">
            <p class="text-xs text-slate-400">准备度</p>
            <el-progress :percentage="completion" :stroke-width="8" class="mt-2"></el-progress>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900">参会人预览</h3>
            <span class="text-xs text-slate-400">{{ participantsList.length }} 人</span>
          </div>
          <div v-if="participantsList.length" class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="name in limitedParticipants"
              :key="name"
              class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
            >
              {{ name }}
            </span>
            <span
              v-if="extraParticipantsCount"
              class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500"
            >
              +{{ extraParticipantsCount }}
            </span>
          </div>
          <p v-else class="mt-3 text-xs text-slate-400">未添加参会人</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="text-base font-semibold text-slate-900">会议策略</h3>
          <div class="mt-3 space-y-2 text-xs">
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span class="text-slate-500">入会密码</span>
              <span class="font-semibold text-slate-700">{{ passwordLabel }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span class="text-slate-500">会前入会</span>
              <span class="font-semibold text-slate-700">{{ earlyJoinLabel }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span class="text-slate-500">白名单成员</span>
              <span class="font-semibold text-slate-700">{{ whitelistLabel }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="text-base font-semibold text-slate-900">议程预览</h3>
          <div v-if="agendaList.length" class="mt-3 space-y-2 text-xs text-slate-600">
            <div v-for="(item, index) in limitedAgenda" :key="item" class="flex items-start gap-2">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px]"
              >
                {{ index + 1 }}
              </span>
              <span class="leading-relaxed">{{ item }}</span>
            </div>
            <p v-if="extraAgendaCount" class="text-[11px] text-slate-400">
              还有 {{ extraAgendaCount }} 项议程未展示
            </p>
          </div>
          <p v-else class="mt-3 text-xs text-slate-400">暂无议程</p>
        </div>
      </aside>
    </div>

    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" @click="onSubmit">{{ submitText }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '编辑会议'
  },
  submitText: {
    type: String,
    default: '保存'
  },
  form: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const localForm = reactive({
  title: '',
  topic: '',
  startTime: '',
  durationMinutes: 45,
  roomPassword: '',
  allowParticipantEarlyJoin: true,
  waitingRoomWhitelist: '',
  participants: '',
  agenda: '',
  notes: ''
})

const syncLocalForm = () => {
  localForm.title = props.form?.title || ''
  localForm.topic = props.form?.topic || ''
  localForm.startTime = props.form?.startTime || ''
  localForm.durationMinutes = Number(props.form?.durationMinutes || 45)
  localForm.roomPassword = props.form?.roomPassword || ''
  localForm.allowParticipantEarlyJoin = props.form?.allowParticipantEarlyJoin ?? true
  localForm.waitingRoomWhitelist = props.form?.waitingRoomWhitelist || ''
  localForm.participants = props.form?.participants || ''
  localForm.agenda = props.form?.agenda || ''
  localForm.notes = props.form?.notes || ''
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      syncLocalForm()
    }
  },
  { immediate: true }
)

const onClose = () => {
  emit('update:modelValue', false)
}

const onSubmit = () => {
  emit('submit', {
    title: localForm.title,
    topic: localForm.topic,
    startTime: localForm.startTime,
    durationMinutes: localForm.durationMinutes,
    roomPassword: localForm.roomPassword,
    allowParticipantEarlyJoin: localForm.allowParticipantEarlyJoin,
    waitingRoomWhitelist: localForm.waitingRoomWhitelist,
    participants: localForm.participants,
    agenda: localForm.agenda,
    notes: localForm.notes
  })
}

const disablePastDate = (date) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return date.getTime() < todayStart.getTime()
}

const splitByComma = (value) => {
  if (!value) return []
  return String(value)
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const splitLines = (value) => {
  if (!value) return []
  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const toTimestamp = (value) => {
  const timestamp = Number(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return '待设置'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp))
}

const formatDuration = (minutes) => {
  const totalMinutes = Number(minutes || 0)
  if (totalMinutes <= 0) return '待设置'
  if (totalMinutes < 60) return `${totalMinutes} 分钟`
  const hours = Math.floor(totalMinutes / 60)
  const remain = totalMinutes % 60
  if (!remain) return `${hours} 小时`
  return `${hours} 小时 ${remain} 分钟`
}

const previewTitle = computed(() => localForm.title || '未命名会议')
const previewTopic = computed(() => localForm.topic || '请补充会议主题')
const startTimestamp = computed(() => toTimestamp(localForm.startTime))
const endTimestamp = computed(() => {
  if (!startTimestamp.value) return null
  return startTimestamp.value + Number(localForm.durationMinutes || 0) * 60 * 1000
})
const startLabel = computed(() => formatDateTime(startTimestamp.value))
const endLabel = computed(() => formatDateTime(endTimestamp.value))
const durationLabel = computed(() => formatDuration(localForm.durationMinutes))
const participantsList = computed(() => splitByComma(localForm.participants))
const agendaList = computed(() => splitLines(localForm.agenda))
const whitelistList = computed(() => splitByComma(localForm.waitingRoomWhitelist))

const limitedParticipants = computed(() => participantsList.value.slice(0, 5))
const extraParticipantsCount = computed(() =>
  Math.max(participantsList.value.length - limitedParticipants.value.length, 0)
)
const limitedAgenda = computed(() => agendaList.value.slice(0, 4))
const extraAgendaCount = computed(() =>
  Math.max(agendaList.value.length - limitedAgenda.value.length, 0)
)

const completion = computed(() => {
  const required = [
    localForm.title,
    localForm.topic,
    localForm.startTime,
    localForm.durationMinutes
  ]
  const filled = required.filter((item) => String(item || '').trim()).length
  return Math.round((filled / required.length) * 100)
})

const completionLabel = computed(() => `${completion.value}% 完成`)
const passwordLabel = computed(() => (localForm.roomPassword ? '已设置' : '未设置'))
const earlyJoinLabel = computed(() =>
  (localForm.allowParticipantEarlyJoin ?? true) ? '允许提前' : '仅主持人'
)
const whitelistLabel = computed(() =>
  whitelistList.value.length ? `${whitelistList.value.length} 人` : '未设置'
)
</script>
