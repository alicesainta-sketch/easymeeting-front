<template>
  <section class="side-card">
    <h4>参会者（{{ participantItems.length }}）</h4>
    <ul class="participant-list">
      <li v-for="item in participantItems" :key="item.name" class="participant-item">
        <span class="participant-name">
          {{ item.name }}
          <em v-if="item.isSelf">（我）</em>
        </span>
        <span class="participant-state">
          <el-tag v-if="item.isHost" size="small" type="danger" effect="plain">主持人</el-tag>
          <el-tag v-else-if="item.isCohost" size="small" type="warning" effect="plain"
            >联席主持</el-tag
          >
          <el-tag size="small" :type="item.mic ? 'success' : 'info'" effect="plain">
            {{ item.mic ? '麦克风开' : '麦克风关' }}
          </el-tag>
          <el-tag size="small" :type="item.camera ? 'success' : 'info'" effect="plain">
            {{ item.camera ? '摄像头开' : '摄像头关' }}
          </el-tag>
          <el-tag v-if="item.handRaised" size="small" type="warning" effect="plain">
            举手中
          </el-tag>
          <el-tag v-if="item.isSelf && item.sharing" size="small" type="danger" effect="plain">
            共享中
          </el-tag>
          <el-tag v-if="item.allowSpeak" size="small" type="success" effect="plain">
            已允许发言
          </el-tag>
          <el-tag v-if="item.micRestricted" size="small" type="danger" effect="plain">
            主持人禁麦
          </el-tag>
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup>
defineProps({
  participantItems: {
    type: Array,
    default: () => []
  }
})
</script>
