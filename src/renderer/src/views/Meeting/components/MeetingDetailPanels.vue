<template>
  <section class="grid gap-4 lg:grid-cols-2">
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 class="text-base font-semibold text-slate-900">基础信息</h3>
      <div class="mt-4 grid gap-2 text-sm text-slate-500">
        <p><span class="font-semibold text-slate-700">房间号：</span>{{ meeting.roomCode }}</p>
        <p><span class="font-semibold text-slate-700">主持人：</span>{{ meeting.host }}</p>
        <p>
          <span class="font-semibold text-slate-700">开始时间：</span
          >{{ formatDateTime(meeting.startTime) }}
        </p>
        <p>
          <span class="font-semibold text-slate-700">会议时长：</span
          >{{ meeting.durationMinutes }} 分钟
        </p>
        <p>
          <span class="font-semibold text-slate-700">参会人数：</span
          >{{ meeting.participants.length }}
        </p>
        <p>
          <span class="font-semibold text-slate-700">入会密码：</span
          >{{ meeting.roomPassword ? '已设置' : '未设置' }}
        </p>
        <p>
          <span class="font-semibold text-slate-700">会前入会：</span
          >{{
            (meeting.allowParticipantEarlyJoin ?? true)
              ? '允许参会者提前入会'
              : '仅主持人/联席可入会'
          }}
        </p>
      </div>
    </article>

    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-slate-900">会议议程</h3>
        <el-tag type="info" effect="plain" size="small">{{ meeting.agenda.length }} 项</el-tag>
      </div>
      <div v-if="meeting.agenda.length" class="mt-4 space-y-3">
        <div
          v-for="(item, index) in meeting.agenda"
          :key="item"
          class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600"
        >
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs">
            {{ index + 1 }}
          </span>
          <span>{{ item }}</span>
        </div>
      </div>
      <p v-else class="mt-3 text-sm text-slate-400">暂无议程</p>
    </article>
  </section>

  <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-slate-900">参会人</h3>
      <span class="text-xs text-slate-400">{{ meeting.participants.length }} 位参会人</span>
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      <el-tag v-for="name in meeting.participants" :key="name" type="info" effect="plain">
        {{ name }}
      </el-tag>
    </div>
  </section>

  <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-slate-900">等候室白名单</h3>
      <span class="text-xs text-slate-400">
        {{ meeting.waitingRoomWhitelist?.length || 0 }} 位成员
      </span>
    </div>
    <div v-if="meeting.waitingRoomWhitelist?.length" class="mt-3 flex flex-wrap gap-2">
      <el-tag
        v-for="name in meeting.waitingRoomWhitelist"
        :key="name"
        type="warning"
        effect="plain"
      >
        {{ name }}
      </el-tag>
    </div>
    <p v-else class="mt-3 text-sm text-slate-400">未设置白名单成员</p>
  </section>

  <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 class="text-base font-semibold text-slate-900">会议备注</h3>
    <p class="mt-3 text-sm text-slate-500">{{ meeting.notes || '暂无备注' }}</p>
  </section>
</template>

<script setup>
defineProps({
  meeting: {
    type: Object,
    required: true
  },
  formatDateTime: {
    type: Function,
    required: true
  }
})
</script>
