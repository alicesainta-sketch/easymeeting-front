<template>
  <AppHeader title="会议详情" :show-bottom-border="true"></AppHeader>
  <div class="detail-page">
    <div class="top-actions">
      <el-button @click="goBack">返回会议列表</el-button>
      <el-button v-if="meeting" @click="openEditDialog">编辑会议</el-button>
      <el-button v-if="meeting" type="danger" plain @click="removeCurrentMeeting"
        >删除会议</el-button
      >
      <el-button type="primary" @click="enterMeeting">进入会议</el-button>
    </div>

    <el-empty v-if="!meeting" description="会议不存在或已被删除">
      <el-button type="primary" @click="goBack">回到列表</el-button>
    </el-empty>

    <template v-else>
      <section class="summary">
        <div class="summary-main">
          <h2>{{ meeting.title }}</h2>
          <p>{{ meeting.topic }}</p>
        </div>
        <el-tag :type="statusMap[status].type" effect="dark">{{ statusMap[status].label }}</el-tag>
      </section>

      <section class="grid">
        <article class="panel">
          <h3>基础信息</h3>
          <p><strong>房间号：</strong>{{ meeting.roomCode }}</p>
          <p><strong>主持人：</strong>{{ meeting.host }}</p>
          <p><strong>开始时间：</strong>{{ formatDateTime(meeting.startTime) }}</p>
          <p><strong>会议时长：</strong>{{ meeting.durationMinutes }} 分钟</p>
          <p><strong>参会人数：</strong>{{ meeting.participants.length }}</p>
        </article>

        <article class="panel">
          <h3>会议议程</h3>
          <ul v-if="meeting.agenda.length" class="agenda">
            <li v-for="item in meeting.agenda" :key="item">{{ item }}</li>
          </ul>
          <p v-else>暂无议程</p>
        </article>
      </section>

      <section class="panel">
        <h3>参会人</h3>
        <div class="participants">
          <el-tag v-for="name in meeting.participants" :key="name" type="info" effect="plain">
            {{ name }}
          </el-tag>
        </div>
      </section>

      <section class="panel">
        <h3>会议备注</h3>
        <p>{{ meeting.notes || '暂无备注' }}</p>
      </section>
    </template>

    <el-dialog v-model="editDialogVisible" title="编辑会议" width="520px" append-to-body>
      <el-form label-width="88px">
        <el-form-item label="会议标题" required>
          <el-input
            v-model.trim="editForm.title"
            maxlength="40"
            placeholder="请输入标题"
          ></el-input>
        </el-form-item>
        <el-form-item label="会议主题" required>
          <el-input v-model.trim="editForm.topic" placeholder="请输入主题"></el-input>
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="editForm.startTime"
            type="datetime"
            value-format="x"
            placeholder="选择日期时间"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="时长(分钟)" required>
          <el-input-number
            v-model="editForm.durationMinutes"
            :min="15"
            :max="180"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="参会人">
          <el-input
            v-model="editForm.participants"
            placeholder="多个参会人请使用逗号分隔"
          ></el-input>
        </el-form-item>
        <el-form-item label="议程">
          <el-input
            v-model="editForm.agenda"
            type="textarea"
            :rows="3"
            placeholder="一行一个议程"
          ></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editForm.notes"
            type="textarea"
            :rows="2"
            placeholder="可选"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditMeeting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { deleteMeeting, getMeetingById, getMeetingStatus, updateMeeting } from '@/mock/meetings'

const route = useRoute()
const router = useRouter()

const meeting = ref(null)
const editDialogVisible = ref(false)
const editForm = ref({
  title: '',
  topic: '',
  startTime: '',
  durationMinutes: 45,
  participants: '',
  agenda: '',
  notes: ''
})
const status = computed(() => {
  if (!meeting.value) return 'finished'
  return getMeetingStatus(meeting.value)
})

const statusMap = {
  live: { label: '进行中', type: 'success' },
  upcoming: { label: '待开始', type: 'primary' },
  finished: { label: '已结束', type: 'info' }
}

const formatDateTime = (dateTime) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateTime))
}

const goBack = () => {
  router.push('/meetings')
}

const setWorkspaceMode = async (mode) => {
  try {
    await window.electron?.ipcRenderer?.invoke('setWorkspaceMode', mode)
  } catch {
    // Keep functional in web mode.
  }
}

const loadMeeting = async () => {
  meeting.value = await getMeetingById(route.params.id)
}

const openEditDialog = () => {
  if (!meeting.value) return
  editForm.value = {
    title: meeting.value.title,
    topic: meeting.value.topic,
    startTime: String(new Date(meeting.value.startTime).getTime()),
    durationMinutes: Number(meeting.value.durationMinutes),
    participants: meeting.value.participants.join(','),
    agenda: meeting.value.agenda.join('\n'),
    notes: meeting.value.notes || ''
  }
  editDialogVisible.value = true
}

const submitEditMeeting = async () => {
  if (
    !meeting.value ||
    !editForm.value.title ||
    !editForm.value.topic ||
    !editForm.value.startTime ||
    !editForm.value.durationMinutes
  ) {
    ElMessage.warning('请先填写完整必填项')
    return
  }

  const startTimestamp = Number(editForm.value.startTime)
  const updated = await updateMeeting(meeting.value.id, {
    title: editForm.value.title,
    topic: editForm.value.topic,
    startTime: new Date(startTimestamp).toISOString(),
    durationMinutes: editForm.value.durationMinutes,
    host: meeting.value.host,
    participants: editForm.value.participants.split(','),
    agenda: editForm.value.agenda.split('\n'),
    notes: editForm.value.notes
  })

  if (!updated) {
    ElMessage.error('会议更新失败')
    return
  }

  editDialogVisible.value = false
  await loadMeeting()
  ElMessage.success('会议已更新')
}

const removeCurrentMeeting = async () => {
  if (!meeting.value) return
  try {
    await ElMessageBox.confirm('删除后不可恢复，确认继续吗？', '删除会议', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  const removed = await deleteMeeting(meeting.value.id)
  if (!removed) {
    ElMessage.error('会议删除失败')
    return
  }

  ElMessage.success('会议已删除')
  router.replace('/meetings')
}

const enterMeeting = () => {
  if (!meeting.value) return
  ElMessage.success(`进入会议室 ${meeting.value.roomCode}（演示）`)
}

watch(
  () => route.params.id,
  () => {
    void loadMeeting()
  },
  {
    immediate: true
  }
)

onMounted(() => {
  void setWorkspaceMode('meeting')
})
</script>

<style lang="scss" scoped>
.detail-page {
  height: calc(100vh - 35px);
  overflow: auto;
  padding: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 40%, #f7f9fc 100%);
}

.top-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.summary {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;

  .summary-main {
    h2 {
      font-size: 20px;
      color: #0f172a;
      margin-bottom: 4px;
    }

    p {
      color: #334155;
      font-size: 14px;
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;

  h3 {
    font-size: 16px;
    margin-bottom: 10px;
    color: #1e293b;
  }

  p {
    color: #475569;
    margin-bottom: 6px;
    line-height: 1.5;
  }
}

.agenda {
  padding-left: 16px;

  li {
    color: #334155;
    margin-bottom: 6px;
  }
}

.participants {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 760px) {
  .detail-page {
    padding: 10px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
