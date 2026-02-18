<template>
  <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="0px" @submit.prevent>
    <!--input输入-->
    <el-form-item label="" prop="email">
      <el-input clearable placeholder="请输入邮箱" v-model.trim="formData.email"></el-input>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()

const formData = ref({})
const formDataRef = ref()
const rules = {
  title: [{ required: true, message: '请输入内容' }]
}
</script>

<style lang="scss" scoped></style>
