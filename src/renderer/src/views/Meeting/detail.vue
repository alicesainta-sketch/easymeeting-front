<template>
  <AppHeader title="会议详情" :show-bottom-border="true"></AppHeader>
  <div class="min-h-[calc(100vh-35px)] bg-slate-50 p-4">
    <div
      class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div class="flex flex-wrap gap-2">
        <el-button @click="goBack">返回会议列表</el-button>
        <el-button v-if="meeting" @click="openEditDialog">编辑会议</el-button>
        <el-button v-if="meeting" @click="duplicateCurrentMeeting">复制会议</el-button>
      </div>
      <div class="flex flex-wrap gap-2">
        <el-button v-if="meeting" @click="copyRoomCode">复制房间号</el-button>
        <el-button v-if="meeting && status === 'upcoming'" @click="manualRemind">
          提醒我
        </el-button>
        <el-button type="primary" @click="enterMeeting">进入会议</el-button>
        <el-button v-if="meeting" type="danger" plain @click="removeCurrentMeeting">
          删除会议
        </el-button>
      </div>
    </div>

    <el-empty v-if="!meeting" description="会议不存在或已被删除">
      <el-button type="primary" @click="goBack">回到列表</el-button>
    </el-empty>

    <template v-else>
      <div class="mt-4 grid gap-4 xl:grid-cols-[1fr,320px]">
        <div class="space-y-4">
          <MeetingDetailSummary
            :meeting="meeting"
            :status="status"
            :status-map="statusMap"
            :countdown-label="countdownLabel"
            :countdown-class="countdownClass"
            :format-date-time="formatDateTime"
          ></MeetingDetailSummary>
          <MeetingDetailPanels
            :meeting="meeting"
            :format-date-time="formatDateTime"
          ></MeetingDetailPanels>
        </div>

        <aside class="space-y-4">
          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="text-base font-semibold text-slate-900">状态进度</h3>
            <p class="mt-1 text-xs text-slate-500">根据会议状态自动更新</p>
            <el-steps class="mt-4" :active="statusStep" align-center>
              <el-step title="待开始" description="会前准备"></el-step>
              <el-step title="进行中" description="会议进行"></el-step>
              <el-step title="已结束" description="回顾总结"></el-step>
            </el-steps>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="text-base font-semibold text-slate-900">风险提示</h3>
            <div v-if="riskTips.length" class="mt-3 space-y-2 text-xs text-amber-700">
              <div
                v-for="tip in riskTips"
                :key="tip"
                class="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2"
              >
                {{ tip }}
              </div>
            </div>
            <div
              v-else
              class="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
            >
              当前会议暂无风险提示。
            </div>
          </section>
        </aside>
      </div>
    </template>

    <MeetingEditorDialog
      v-model="editDialogVisible"
      title="编辑会议"
      :form="editForm"
      @submit="submitEditMeeting"
    ></MeetingEditorDialog>
  </div>
</template>

<script setup>
import MeetingEditorDialog from './components/MeetingEditorDialog.vue'
import MeetingDetailPanels from './components/MeetingDetailPanels.vue'
import MeetingDetailSummary from './components/MeetingDetailSummary.vue'
import { useMeetingDetail } from './composables/useMeetingDetail'

const {
  meeting,
  status,
  countdownLabel,
  countdownClass,
  statusMap,
  statusStep,
  riskTips,
  formatDateTime,
  goBack,
  manualRemind,
  copyRoomCode,
  duplicateCurrentMeeting,
  openEditDialog,
  editDialogVisible,
  editForm,
  submitEditMeeting,
  removeCurrentMeeting,
  enterMeeting
} = useMeetingDetail()
</script>
