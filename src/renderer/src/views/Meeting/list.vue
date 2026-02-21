<template>
  <AppHeader title="EasyMeeting · 会议中心" :show-bottom-border="true"></AppHeader>
  <div class="workspace">
    <section class="hero">
      <div class="hero-main">
        <h2>欢迎回来，{{ displayName }}</h2>
        <p>当前为纯前端演示环境，会议数据来自本地 mock。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="createDialogVisible = true">新建会议</el-button>
        <el-button @click="logout">退出登录</el-button>
      </div>
    </section>

    <section class="toolbar">
      <el-input
        v-model.trim="keyword"
        class="search"
        clearable
        placeholder="搜索会议标题 / 主题 / 房间号"
      />
      <el-select v-model="statusFilter" class="status" placeholder="状态筛选">
        <el-option label="全部" value="all"></el-option>
        <el-option label="进行中" value="live"></el-option>
        <el-option label="待开始" value="upcoming"></el-option>
        <el-option label="已结束" value="finished"></el-option>
      </el-select>
      <el-button @click="refreshMeetings">刷新</el-button>
    </section>

    <section v-if="meetingItems.length" class="meeting-list">
      <article
        v-for="meeting in meetingItems"
        :key="meeting.id"
        class="meeting-card"
        @click="goDetail(meeting.id)"
      >
        <div class="card-header">
          <h3>{{ meeting.title }}</h3>
          <el-tag :type="statusMap[getMeetingStatus(meeting)].type" effect="light">
            {{ statusMap[getMeetingStatus(meeting)].label }}
          </el-tag>
        </div>
        <p class="topic">{{ meeting.topic }}</p>
        <div class="meta">
          <span>房间号：{{ meeting.roomCode }}</span>
          <span>主持人：{{ meeting.host }}</span>
          <span>{{ formatTimeRange(meeting.startTime, meeting.durationMinutes) }}</span>
        </div>
      </article>
    </section>
    <el-empty v-else description="没有符合条件的会议"></el-empty>

    <el-dialog v-model="createDialogVisible" title="新建会议" width="520px" append-to-body>
      <el-form label-width="88px">
        <el-form-item label="会议标题" required>
          <el-input
            v-model.trim="createForm.title"
            maxlength="40"
            placeholder="请输入标题"
          ></el-input>
        </el-form-item>
        <el-form-item label="会议主题" required>
          <el-input v-model.trim="createForm.topic" placeholder="请输入主题"></el-input>
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="createForm.startTime"
            type="datetime"
            value-format="x"
            placeholder="选择日期时间"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="时长(分钟)" required>
          <el-input-number
            v-model="createForm.durationMinutes"
            :min="15"
            :max="180"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="参会人">
          <el-input
            v-model="createForm.participants"
            placeholder="多个参会人请使用逗号分隔"
          ></el-input>
        </el-form-item>
        <el-form-item label="议程">
          <el-input
            v-model="createForm.agenda"
            type="textarea"
            :rows="3"
            placeholder="一行一个议程"
          ></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createForm.notes"
            type="textarea"
            :rows="2"
            placeholder="可选"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateMeeting">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { createMeeting, getMeetingStatus, listMeetings } from '@/mock/meetings'
import { clearCurrentUser, getCurrentUser } from '@/utils/auth'

const router = useRouter()
const currentUser = getCurrentUser()
const displayName = computed(() => currentUser?.nickname || currentUser?.email || '用户')

const keyword = ref('')
const statusFilter = ref('all')
const meetingItems = ref([])

const statusMap = {
  live: { label: '进行中', type: 'success' },
  upcoming: { label: '待开始', type: 'primary' },
  finished: { label: '已结束', type: 'info' }
}

const loadMeetings = () => {
  meetingItems.value = listMeetings({
    keyword: keyword.value,
    status: statusFilter.value
  })
}

const refreshMeetings = () => {
  loadMeetings()
}

const formatTimeRange = (startTime, durationMinutes) => {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

const goDetail = (id) => {
  router.push(`/meetings/${id}`)
}

const createDialogVisible = ref(false)
const createForm = reactive({
  title: '',
  topic: '',
  startTime: '',
  durationMinutes: 45,
  participants: '',
  agenda: '',
  notes: ''
})

const resetCreateForm = () => {
  createForm.title = ''
  createForm.topic = ''
  createForm.startTime = ''
  createForm.durationMinutes = 45
  createForm.participants = ''
  createForm.agenda = ''
  createForm.notes = ''
}

const submitCreateMeeting = () => {
  if (
    !createForm.title ||
    !createForm.topic ||
    !createForm.startTime ||
    !createForm.durationMinutes
  ) {
    ElMessage.warning('请先填写完整必填项')
    return
  }

  const startTimestamp = Number(createForm.startTime)
  createMeeting({
    title: createForm.title,
    topic: createForm.topic,
    startTime: new Date(startTimestamp).toISOString(),
    durationMinutes: createForm.durationMinutes,
    host: displayName.value,
    participants: createForm.participants.split(','),
    agenda: createForm.agenda.split('\n'),
    notes: createForm.notes
  })

  createDialogVisible.value = false
  resetCreateForm()
  refreshMeetings()
  ElMessage.success('会议已创建（本地模拟）')
}

const setWorkspaceMode = async (mode) => {
  try {
    await window.electron?.ipcRenderer?.invoke('setWorkspaceMode', mode)
  } catch {
    // Keep functional in web mode.
  }
}

const logout = async () => {
  clearCurrentUser()
  await setWorkspaceMode('auth')
  router.replace('/')
}

watch([keyword, statusFilter], loadMeetings, {
  immediate: true
})
</script>

<style lang="scss" scoped>
.workspace {
  height: calc(100vh - 35px);
  padding: 14px;
  overflow: auto;
  background: linear-gradient(180deg, #f4f8ff 0%, #ffffff 45%, #f8fafc 100%);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e6edf7;
  margin-bottom: 12px;

  h2 {
    font-size: 18px;
    color: #1f2937;
    margin-bottom: 4px;
  }

  p {
    font-size: 13px;
    color: #64748b;
  }
}

.hero-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr 150px auto;
  gap: 10px;
  margin-bottom: 12px;
}

.meeting-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

.meeting-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  cursor: pointer;
  transition:
    0.2s border-color ease,
    0.2s transform ease,
    0.2s box-shadow ease;

  &:hover {
    border-color: #93c5fd;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(30, 64, 175, 0.08);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;

    h3 {
      font-size: 16px;
      color: #0f172a;
    }
  }

  .topic {
    color: #334155;
    font-size: 14px;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .meta {
    display: grid;
    gap: 4px;
    color: #64748b;
    font-size: 12px;
  }
}

@media (max-width: 760px) {
  .workspace {
    padding: 10px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
