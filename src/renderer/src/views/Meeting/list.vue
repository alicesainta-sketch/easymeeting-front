<template>
  <AppHeader title="EasyMeeting · 会议中心" :show-bottom-border="true"></AppHeader>
  <div class="min-h-[calc(100vh-35px)] bg-slate-50 px-4 pb-6 pt-4">
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Meeting hub</p>
          <h2 class="mt-2 text-xl font-semibold text-slate-900">欢迎回来，{{ displayName }}</h2>
          <p class="mt-1 text-sm text-slate-500">当前为纯前端演示环境，会议数据来自本地 mock。</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button type="primary" @click="createDialogVisible = true">新建会议</el-button>
          <el-button @click="logout">退出登录</el-button>
        </div>
      </div>
    </section>

    <section class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-slate-400">今日会议</p>
        <div class="mt-3 flex items-end justify-between">
          <span class="text-2xl font-semibold text-slate-900">{{ meetingStats.todayCount }}</span>
          <span class="text-xs text-slate-400">会议室 {{ meetingStats.roomCount }}</span>
        </div>
        <p class="mt-2 text-xs text-slate-500">
          总时长 {{ formatDuration(meetingStats.totalMinutes) }}
        </p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-slate-400">正在进行</p>
        <div class="mt-3 flex items-end justify-between">
          <span class="text-2xl font-semibold text-slate-900">{{ meetingStats.liveCount }}</span>
          <span class="text-xs text-emerald-500">实时跟进</span>
        </div>
        <p class="mt-2 text-xs text-slate-500">已结束 {{ meetingStats.finishedCount }} 场</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-slate-400">待开始</p>
        <div class="mt-3 flex items-end justify-between">
          <span class="text-2xl font-semibold text-slate-900">
            {{ meetingStats.upcomingCount }}
          </span>
          <span class="text-xs text-sky-500">准备就绪</span>
        </div>
        <p class="mt-2 text-xs text-slate-500">
          下一场：{{ nextMeeting ? nextMeeting.title : '暂无会议' }}
        </p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-slate-400">冲突预警</p>
        <div class="mt-3 flex items-end justify-between">
          <span class="text-2xl font-semibold text-slate-900">{{ conflictList.length }}</span>
          <span class="text-xs text-rose-500">需关注</span>
        </div>
        <p class="mt-2 text-xs text-slate-500">会议室 / 参会人重叠提醒</p>
      </div>
    </section>

    <section class="mt-4 grid gap-4 lg:grid-cols-[1.3fr,1fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-slate-900">今日安排</h3>
            <p class="mt-1 text-xs text-slate-500">按开始时间排序，展示重点会议</p>
          </div>
          <el-tag type="info" effect="plain">本地模拟</el-tag>
        </div>

        <div v-if="todayMeetings.length" class="mt-4 space-y-3">
          <div
            v-for="meeting in todayMeetings"
            :key="meeting.id"
            class="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-slate-900">{{ meeting.title }}</span>
                <el-tag :type="statusMap[getStatus(meeting)].type" effect="plain" size="small">
                  {{ statusMap[getStatus(meeting)].label }}
                </el-tag>
              </div>
              <span class="text-xs text-slate-500">{{ formatShortTime(meeting.startTime) }}</span>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              {{ formatTimeRange(meeting.startTime, meeting.durationMinutes) }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>会议室 {{ meeting.roomCode }}</span>
              <span>主持人 {{ meeting.host }}</span>
              <span>{{ meeting.participants.length }} 位参会人</span>
            </div>
            <div v-if="conflictMap[meeting.id]" class="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span
                v-if="conflictMap[meeting.id].room"
                class="rounded-full bg-rose-100 px-2 py-0.5 text-rose-600"
              >
                会议室冲突
              </span>
              <span
                v-if="conflictMap[meeting.id].participant"
                class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700"
              >
                参会人冲突
              </span>
            </div>
          </div>
        </div>
        <el-empty v-else description="今天没有安排"></el-empty>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-slate-900">冲突与风险</h3>
            <p class="mt-1 text-xs text-slate-500">检测会议室与参会人时间冲突</p>
          </div>
          <el-tag type="danger" effect="plain">自动检测</el-tag>
        </div>

        <div v-if="conflictList.length" class="mt-4 space-y-3">
          <div
            v-for="conflict in conflictList"
            :key="conflict.id"
            class="rounded-xl border border-rose-100 bg-rose-50 p-3"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-rose-700">{{ conflict.title }}</p>
              <span class="text-xs text-rose-500">{{ conflict.timeRange }}</span>
            </div>
            <p class="mt-1 text-xs text-rose-600">{{ conflict.description }}</p>
            <p class="mt-2 text-xs text-rose-500">{{ conflict.meetingTitles }}</p>
          </div>
        </div>
        <div
          v-else
          class="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700"
        >
          暂无冲突，会议安排保持顺畅。
        </div>
      </div>
    </section>

    <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="grid gap-3 lg:grid-cols-[1fr,160px,170px,auto]">
        <el-input
          v-model.trim="keyword"
          clearable
          placeholder="搜索会议标题 / 主题 / 房间号"
          class="w-full"
        />
        <el-select v-model="statusFilter" class="w-full" placeholder="状态筛选">
          <el-option label="全部" value="all"></el-option>
          <el-option label="进行中" value="live"></el-option>
          <el-option label="待开始" value="upcoming"></el-option>
          <el-option label="已结束" value="finished"></el-option>
        </el-select>
        <el-select v-model="sortMode" class="w-full" placeholder="排序方式">
          <el-option label="智能排序" value="smart"></el-option>
          <el-option label="开始时间升序" value="start-asc"></el-option>
          <el-option label="开始时间降序" value="start-desc"></el-option>
        </el-select>
        <el-button class="w-full" @click="refreshMeetings">刷新</el-button>
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs text-slate-500">共 {{ meetingItems.length }} 场会议</span>
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="cards">卡片视图</el-radio-button>
          <el-radio-button label="timeline">时间线</el-radio-button>
        </el-radio-group>
      </div>
    </section>

    <section v-if="meetingItems.length" class="mt-4">
      <div v-if="viewMode === 'cards'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MeetingCard
          v-for="meeting in meetingItems"
          :key="meeting.id"
          :meeting="meeting"
          :status-map="statusMap"
          :get-status="getStatus"
          :get-countdown-label="getCountdownLabel"
          :get-countdown-class="getCountdownClass"
          :format-time-range="formatTimeRange"
          :conflict-map="conflictMap"
          @open="goDetail"
          @remind="manualRemind"
          @duplicate="duplicateMeeting"
          @edit="openEditDialog"
          @remove="removeMeeting"
        ></MeetingCard>
      </div>
      <div v-else class="space-y-6">
        <div v-for="group in timelineGroups" :key="group.key" class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ group.label }}
            </span>
            <span class="h-px flex-1 bg-slate-200"></span>
          </div>
          <div class="space-y-3">
            <article
              v-for="meeting in group.items"
              :key="meeting.id"
              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              @click="goDetail(meeting.id)"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">{{ meeting.timeLabel }}</span>
                  <span class="text-sm font-semibold text-slate-900">{{ meeting.title }}</span>
                </div>
                <el-tag :type="statusMap[meeting.status].type" effect="plain" size="small">
                  {{ meeting.statusLabel }}
                </el-tag>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                {{ meeting.topic || '暂无主题' }} · {{ meeting.rangeLabel }}
              </p>
              <div class="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>会议室 {{ meeting.roomCode }}</span>
                <span>主持人 {{ meeting.host }}</span>
                <span>{{ meeting.participants.length }} 位参会人</span>
              </div>
              <div v-if="meeting.conflict" class="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span
                  v-if="meeting.conflict.room"
                  class="rounded-full bg-rose-100 px-2 py-0.5 text-rose-600"
                  >会议室冲突</span
                >
                <span
                  v-if="meeting.conflict.participant"
                  class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700"
                  >参会人冲突</span
                >
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <el-button size="small" text type="primary" @click.stop="goDetail(meeting.id)">
                  查看详情
                </el-button>
                <el-button size="small" text @click.stop="openEditDialog(meeting)">
                  编辑
                </el-button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
    <el-empty v-else description="没有符合条件的会议"></el-empty>

    <MeetingEditorDialog
      v-model="createDialogVisible"
      title="新建会议"
      submit-text="创建"
      :form="createForm"
      @submit="submitCreateMeeting"
    ></MeetingEditorDialog>

    <MeetingEditorDialog
      v-model="editDialogVisible"
      title="编辑会议"
      :form="editForm"
      @submit="submitEditMeeting"
    ></MeetingEditorDialog>
  </div>
</template>

<script setup>
import MeetingCard from './components/MeetingCard.vue'
import MeetingEditorDialog from './components/MeetingEditorDialog.vue'
import { useMeetingList } from './composables/useMeetingList'

const {
  displayName,
  keyword,
  statusFilter,
  sortMode,
  viewMode,
  meetingItems,
  meetingStats,
  todayMeetings,
  nextMeeting,
  conflictList,
  conflictMap,
  timelineGroups,
  statusMap,
  getStatus,
  getCountdownLabel,
  getCountdownClass,
  formatTimeRange,
  formatShortTime,
  manualRemind,
  goDetail,
  createDialogVisible,
  createForm,
  submitCreateMeeting,
  duplicateMeeting,
  editDialogVisible,
  editForm,
  openEditDialog,
  submitEditMeeting,
  removeMeeting,
  refreshMeetings,
  logout
} = useMeetingList()

const formatDuration = (minutes) => {
  const totalMinutes = Number(minutes || 0)
  if (totalMinutes <= 0) return '0 分钟'
  if (totalMinutes < 60) return `${totalMinutes} 分钟`
  const hours = Math.floor(totalMinutes / 60)
  const remain = totalMinutes % 60
  if (!remain) return `${hours} 小时`
  return `${hours} 小时 ${remain} 分钟`
}
</script>
