<template>
  <AppHeader title="会议详情" :show-bottom-border="true"></AppHeader>
  <div class="detail-page">
    <div class="top-actions">
      <el-button @click="goBack">返回会议列表</el-button>
      <el-button v-if="meeting" @click="openEditDialog">编辑会议</el-button>
      <el-button v-if="meeting" type="danger" plain @click="removeCurrentMeeting"
        >删除会议</el-button
      >
      <el-button v-if="meeting && status === 'upcoming'" @click="manualRemind">提醒我</el-button>
      <el-button type="primary" @click="enterMeeting">进入会议</el-button>
    </div>

    <el-empty v-if="!meeting" description="会议不存在或已被删除">
      <el-button type="primary" @click="goBack">回到列表</el-button>
    </el-empty>

    <template v-else>
      <MeetingDetailSummary
        :meeting="meeting"
        :status="status"
        :status-map="statusMap"
        :countdown-label="countdownLabel"
        :countdown-class="countdownClass"
      ></MeetingDetailSummary>
      <MeetingDetailPanels
        :meeting="meeting"
        :format-date-time="formatDateTime"
      ></MeetingDetailPanels>
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
  formatDateTime,
  goBack,
  manualRemind,
  openEditDialog,
  editDialogVisible,
  editForm,
  submitEditMeeting,
  removeCurrentMeeting,
  enterMeeting
} = useMeetingDetail()
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

@media (max-width: 760px) {
  .detail-page {
    padding: 10px;
  }
}
</style>
