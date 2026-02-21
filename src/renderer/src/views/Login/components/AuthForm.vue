<template>
  <div class="login-form">
    <div class="error-msg">{{ errorMsg }}</div>
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="0px" @submit.prevent>
      <el-form-item prop="email">
        <el-input v-model.trim="email" placeholder="请输入邮箱" size="large" clearable>
          <template #prefix> <i class="iconfont icon-email"></i> </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="!isLogin" prop="nickname">
        <el-input
          v-model.trim="nickname"
          placeholder="请输入昵称"
          maxlength="15"
          size="large"
          clearable
        >
          <template #prefix>
            <i class="iconfont icon-user-nick"></i>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model.trim="password"
          placeholder="请输入密码"
          size="large"
          clearable
          show-password
        >
          <template #prefix>
            <i class="iconfont icon-password"></i>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="!isLogin" prop="rePassword">
        <el-input
          v-model.trim="rePassword"
          placeholder="请再次输入密码"
          size="large"
          clearable
          show-password
        >
          <template #prefix>
            <i class="iconfont icon-password"></i>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="checkCode">
        <div class="check-code-panel">
          <el-input v-model.trim="checkCode" clearable placeholder="请输入验证码" size="large">
            <template #prefix>
              <i class="iconfont icon-checkcode"></i>
            </template>
          </el-input>
          <img
            class="check-code"
            :src="checkCodeUrl"
            alt="验证码"
            @click="emit('refresh-check-code')"
          />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" class="login-btn" size="large" @click="handleSubmit">{{
          isLogin ? '登录' : '注册'
        }}</el-button>
      </el-form-item>
      <div class="bottom-link">
        <span class="a-link no-account" @click="emit('toggle-mode')">{{
          isLogin ? '没有账号？' : '已有账号？'
        }}</span>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  isLogin: {
    type: Boolean,
    required: true
  },
  formData: {
    type: Object,
    required: true
  },
  rules: {
    type: Object,
    required: true
  },
  checkCodeUrl: {
    type: String,
    default: ''
  },
  errorMsg: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'toggle-mode', 'refresh-check-code', 'update-field'])

const formRef = ref()

const bindField = (key) => {
  return computed({
    get: () => props.formData[key],
    set: (value) => {
      emit('update-field', {
        key,
        value
      })
    }
  })
}

const email = bindField('email')
const nickname = bindField('nickname')
const password = bindField('password')
const rePassword = bindField('rePassword')
const checkCode = bindField('checkCode')

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  emit('submit')
}

const clearValidate = () => {
  formRef.value?.clearValidate()
}

defineExpose({
  clearValidate
})
</script>

<style lang="scss" scoped>
.login-form {
  padding: 0 15px;
  height: calc(100vh - 32px);

  :deep(.el-input__wrapper) {
    box-shadow: none;
    border-radius: 0;
  }

  .el-form-item {
    border-bottom: 1px solid #ddd;
  }

  .login-btn {
    margin-top: 20px;
    width: 100%;
  }

  .bottom-link {
    text-align: right;
    font-size: 13px;
  }
}

.error-msg {
  line-height: 30px;
  height: 30px;
  color: #fb7373;
}

.check-code-panel {
  display: flex;

  .check-code {
    cursor: pointer;
    width: 120px;
    margin-left: 5px;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
  }
}
</style>
