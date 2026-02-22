<template>
  <AppHeader title="会议房间" :show-bottom-border="true"></AppHeader>
  <div class="room-page">
    <el-empty v-if="!meeting" description="会议不存在或已被删除">
      <el-button type="primary" @click="goBackToList">回到会议列表</el-button>
    </el-empty>

    <template v-else>
      <RoomPrejoinPanel
        v-if="!joined"
        :meeting-title="meeting.title"
        :room-code="meeting.roomCode"
        :preview-video-ref="previewVideoRef"
        :show-video-placeholder="showVideoPlaceholder"
        :display-name="displayName"
        :camera-enabled="cameraEnabled"
        :mic-enabled="micEnabled"
        :video-devices="videoDevices"
        :audio-devices="audioDevices"
        :selected-video-device-id="selectedVideoDeviceId"
        :selected-audio-device-id="selectedAudioDeviceId"
        :media-tip="mediaTip"
        :can-join-meeting="canJoinMeeting"
        :join-action-label="joinActionLabel"
        @update:display-name="displayName = $event"
        @update:selected-video-device-id="selectedVideoDeviceId = $event"
        @update:selected-audio-device-id="selectedAudioDeviceId = $event"
        @toggle-camera="toggleCamera"
        @toggle-microphone="toggleMicrophone"
        @back-detail="goBackToDetail"
        @join-meeting="joinMeeting"
      ></RoomPrejoinPanel>

      <section v-else class="in-room">
        <RoomHeaderBar
          :title="meeting.title"
          :room-code="meeting.roomCode"
          :room-elapsed-text="roomElapsedText"
          @copy-room-code="copyRoomCode"
        ></RoomHeaderBar>

        <div class="room-main">
          <RoomStagePanel
            :room-video-ref="roomVideoRef"
            :show-video-placeholder="showVideoPlaceholder"
            :display-name="displayName"
            :screen-sharing="screenSharing"
            :stage-participants="stageParticipants"
            :hidden-stage-count="hiddenStageCount"
            :get-participant-state="getParticipantState"
          ></RoomStagePanel>

          <aside class="room-side">
            <RoomHostPanel
              :allow-participant-mic="allowParticipantMic"
              :meeting-locked="meetingLocked"
              @mute-all="muteAllParticipants"
              @disable-all-cameras="disableAllParticipantCameras"
              @lower-all-hands="lowerAllParticipantHands"
              @toggle-participant-mic-permission="toggleParticipantMicPermission"
              @toggle-meeting-lock="toggleMeetingLock"
            ></RoomHostPanel>

            <RoomParticipantPanel :participant-items="participantItems"></RoomParticipantPanel>
            <RoomChatPanel
              :chat-list-ref="chatListRef"
              :chat-input-ref="chatInputRef"
              :chat-messages="chatMessages"
              :chat-input="chatInput"
              :emoji-popover-visible="emojiPopoverVisible"
              :emoji-list="emojiList"
              @clear-chat="clearChatMessages"
              @send-chat="sendChatMessage"
              @append-emoji="appendEmoji"
              @update:chat-input="chatInput = $event"
              @update:emoji-popover-visible="emojiPopoverVisible = $event"
            ></RoomChatPanel>
          </aside>
        </div>

        <RoomControlBar
          :mic-enabled="micEnabled"
          :camera-enabled="cameraEnabled"
          :hand-raised="handRaised"
          :screen-sharing="screenSharing"
          @toggle-mic="toggleMicrophone"
          @toggle-camera="toggleCamera"
          @toggle-hand-raise="toggleHandRaise"
          @toggle-screen-share="toggleScreenShare"
          @back-detail="goBackToDetail"
          @leave="leaveMeeting"
        ></RoomControlBar>
      </section>
    </template>
  </div>
</template>

<script setup>
import RoomChatPanel from './components/room/RoomChatPanel.vue'
import RoomControlBar from './components/room/RoomControlBar.vue'
import RoomHeaderBar from './components/room/RoomHeaderBar.vue'
import RoomHostPanel from './components/room/RoomHostPanel.vue'
import RoomParticipantPanel from './components/room/RoomParticipantPanel.vue'
import RoomPrejoinPanel from './components/room/RoomPrejoinPanel.vue'
import RoomStagePanel from './components/room/RoomStagePanel.vue'
import { useMeetingRoom } from './composables/useMeetingRoom'

const {
  meeting,
  joined,
  previewVideoRef,
  roomVideoRef,
  chatListRef,
  chatInputRef,
  displayName,
  cameraEnabled,
  micEnabled,
  videoDevices,
  audioDevices,
  selectedVideoDeviceId,
  selectedAudioDeviceId,
  chatInput,
  chatMessages,
  emojiPopoverVisible,
  handRaised,
  screenSharing,
  meetingLocked,
  allowParticipantMic,
  emojiList,
  showVideoPlaceholder,
  mediaTip,
  canJoinMeeting,
  joinActionLabel,
  roomElapsedText,
  stageParticipants,
  hiddenStageCount,
  participantItems,
  getParticipantState,
  toggleCamera,
  toggleMicrophone,
  toggleHandRaise,
  toggleScreenShare,
  muteAllParticipants,
  disableAllParticipantCameras,
  lowerAllParticipantHands,
  toggleParticipantMicPermission,
  toggleMeetingLock,
  goBackToList,
  goBackToDetail,
  joinMeeting,
  sendChatMessage,
  leaveMeeting,
  copyRoomCode,
  clearChatMessages,
  appendEmoji
} = useMeetingRoom()
</script>

<style lang="scss">
@use './styles/room.scss' as *;
</style>
