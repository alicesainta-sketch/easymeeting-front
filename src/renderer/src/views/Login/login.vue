<template>
  <el-form ref="formDataRef" :model="formData" :rules="rules" label-width="0px" @submit.prevent>
    <!--input输入-->
    <el-form-item label="" prop="email">
      <el-input v-model.trim="formData.email" placeholder="请输入邮箱" clearable>
        <template #prefix>
          <i class="iconfont icon-email"></i>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item label="" prop="password">
      <el-input v-model.trim="formData.password" placeholder="请输入密码" clearable show-password>
        <template #prefix>
          <i class="iconfont icon-password"></i>
        </template>
      </el-input>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref } from 'vue'

const formData = ref({})
const formDataRef = ref()
const rules = {
  email: [{ required: true, message: '请输入邮箱' }],
  password: [{ required: true, message: '请输入密码' }]
}
</script>

<style lang="scss" scoped></style>
