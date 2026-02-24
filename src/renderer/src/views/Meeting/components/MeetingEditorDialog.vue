<template>
  <el-dialog :model-value="modelValue" :title="title" width="520px" append-to-body @close="onClose">
    <el-form label-width="88px">
      <el-form-item label="会议标题" required>
        <el-input v-model.trim="localForm.title" maxlength="40" placeholder="请输入标题"></el-input>
      </el-form-item>
      <el-form-item label="会议主题" required>
        <el-input v-model.trim="localForm.topic" placeholder="请输入主题"></el-input>
      </el-form-item>
      <el-form-item label="开始时间" required>
        <el-date-picker
          v-model="localForm.startTime"
          type="datetime"
          value-format="x"
          :disabled-date="disablePastDate"
          placeholder="选择日期时间"
          style="width: 100%"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="时长(分钟)" required>
        <el-input-number v-model="localForm.durationMinutes" :min="15" :max="180"></el-input-number>
      </el-form-item>
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
      <el-form-item label="白名单">
        <el-input
          v-model="localForm.waitingRoomWhitelist"
          placeholder="自动通过等候室的成员，逗号分隔"
        ></el-input>
      </el-form-item>
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
        <el-input v-model="localForm.notes" type="textarea" :rows="2" placeholder="可选"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" @click="onSubmit">{{ submitText }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'

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
</script>
