<template>
  <AppHeader :show-max="false"></AppHeader>
  <div v-if="showLoading" class="loading-panel">
    <img src="../../assets/loading.gif" />
    <div>{{ isLogin ? '正在登录...' : '正在注册...' }}</div>
  </div>
  <div v-else class="login-form">
    <div class="error-msg">{{ errorMsg }}</div>
    <el-form ref="formDataRef" :model="formData" :rules="rules" label-width="0px" @submit.prevent>
      <el-form-item prop="email">
        <el-input v-model.trim="formData.email" placeholder="请输入邮箱" size="large" clearable>
          <template #prefix> <i class="iconfont icon-email"></i> </template
        ></el-input>
      </el-form-item>
      <el-form-item v-if="!isLogin" prop="nickname">
        <el-input
          v-model.trim="formData.nickname"
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
          v-model.trim="formData.password"
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
          v-model.trim="formData.rePassword"
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
      <el-form-item label="" prop="checkCode">
        <div class="check-code-panel">
          <el-input
            v-model.trim="formData.checkCode"
            clearable
            placeholder="请输入验证码"
            size="large"
          >
            <template #prefix>
              <i class="iconfont icon-checkcode"></i>
            </template>
          </el-input>
          <img class="check-code" :src="checkCodeUrl" alt="验证码" @click="refreshCheckCode" />
        </div>
      </el-form-item>
      <el-form-item label="" prop="">
        <el-button type="primary" class="login-btn" size="large" @click="handleSubmit">{{
          isLogin ? '登录' : '注册'
        }}</el-button>
      </el-form-item>
      <div class="bottom-link">
        <span class="a-link no-account" @click="changeOpType">{{
          isLogin ? '没有账号？' : '已有账号？'
        }}</span>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { setCurrentUser } from '@/utils/auth'

const router = useRouter()

const isLogin = ref(true)
const formData = reactive({
  email: '',
  nickname: '',
  password: '',
  rePassword: '',
  checkCode: ''
})
const formDataRef = ref()
const checkCode = ref('')
const checkCodeUrl = ref('')

const validateEmail = (_, value, callback) => {
  if (!value) {
    callback(new Error('请输入邮箱'))
    return
  }
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  callback(isValid ? undefined : new Error('邮箱格式不正确'))
}

const validateNickname = (_, value, callback) => {
  if (isLogin.value) {
    callback()
    return
  }
  if (!value) {
    callback(new Error('请输入昵称'))
    return
  }
  callback(value.length > 15 ? new Error('昵称不能超过15个字符') : undefined)
}

const validatePassword = (_, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
    return
  }
  callback(value.length < 6 ? new Error('密码至少6位') : undefined)
}

const validateRePassword = (_, value, callback) => {
  if (isLogin.value) {
    callback()
    return
  }
  if (!value) {
    callback(new Error('请再次输入密码'))
    return
  }
  callback(value !== formData.password ? new Error('两次密码输入不一致') : undefined)
}

const validateCheckCode = (_, value, callback) => {
  if (!value) {
    callback(new Error('请输入验证码'))
    return
  }
  const isValid = value.toUpperCase() === checkCode.value
  callback(isValid ? undefined : new Error('验证码错误'))
}

const rules = computed(() => {
  return {
    email: [{ validator: validateEmail, trigger: 'blur' }],
    nickname: [{ validator: validateNickname, trigger: 'blur' }],
    password: [{ validator: validatePassword, trigger: 'blur' }],
    rePassword: [{ validator: validateRePassword, trigger: 'blur' }],
    checkCode: [{ validator: validateCheckCode, trigger: 'blur' }]
  }
})

const generateCheckCode = () => {
  const source = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  checkCode.value = Array.from({ length: 4 }, () => {
    const index = Math.floor(Math.random() * source.length)
    return source[index]
  }).join('')

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">
      <rect width="100%" height="100%" fill="#f5f7fa" />
      <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle"
            font-family="monospace" font-size="22" font-weight="700" fill="#409eff"
            letter-spacing="4">${checkCode.value}</text>
    </svg>
  `
  checkCodeUrl.value = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const refreshCheckCode = () => {
  formData.checkCode = ''
  generateCheckCode()
}

const resizeAuthWindow = async (targetIsLogin) => {
  try {
    await window.electron?.ipcRenderer?.invoke('loginOrRegister', targetIsLogin)
  } catch {
    // Ignore resize failures to keep UI interactions available in pure web mode.
  }
}

const switchToMeetingWorkspace = async () => {
  try {
    await window.electron?.ipcRenderer?.invoke('setWorkspaceMode', 'meeting')
  } catch {
    // Ignore resize failures to keep UI interactions available in pure web mode.
  }
}

const resetForm = () => {
  formData.email = ''
  formData.nickname = ''
  formData.password = ''
  formData.rePassword = ''
  formData.checkCode = ''
  errorMsg.value = ''
  formDataRef.value?.clearValidate()
}

const changeOpType = async () => {
  const targetIsLogin = !isLogin.value
  await resizeAuthWindow(targetIsLogin)
  isLogin.value = targetIsLogin
  resetForm()
  refreshCheckCode()
}

const showLoading = ref(false)
const errorMsg = ref('')

const handleSubmit = async () => {
  errorMsg.value = ''
  if (!formDataRef.value) return

  try {
    await formDataRef.value.validate()
  } catch {
    return
  }

  showLoading.value = true
  await new Promise((resolve) => setTimeout(resolve, 600))
  showLoading.value = false

  if (isLogin.value) {
    const nickname = formData.email.split('@')[0] || '用户'
    setCurrentUser({
      email: formData.email,
      nickname,
      loginAt: new Date().toISOString()
    })
    await switchToMeetingWorkspace()
    ElMessage.success('登录成功（演示）')
    await router.replace('/meetings')
    refreshCheckCode()
    return
  }

  const savedEmail = formData.email
  ElMessage.success('注册成功，请登录')
  await resizeAuthWindow(true)
  isLogin.value = true
  resetForm()
  formData.email = savedEmail
  refreshCheckCode()
}

onMounted(() => {
  refreshCheckCode()
})
</script>

<style lang="scss" scoped>
.title {
  height: 30px;
  -webkit-app-region: drag;
}
.email-select {
  width: 250px;
}

.loading-panel {
  height: calc(100vh - 32px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-size: 14px;
  color: #727272;

  img {
    width: 30px;
    margin-right: 3px;
  }
}

.login-form {
  padding: 0px 15px;
  height: calc(100vh - 32px);

  :deep(.el-input__wrapper) {
    box-shadow: none;
    border-radius: 0;
  }

  .el-form-item {
    border-bottom: 1px solid #ddd;
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

  .login-btn {
    margin-top: 20px;
    width: 100%;
  }

  .bottom-link {
    text-align: right;
    font-size: 13px;
  }
}

.email-panel {
  align-items: center;
  width: 100%;
  display: flex;

  .input {
    flex: 1;
  }

  .icon-down {
    margin-left: 3px;
    width: 16px;
    cursor: pointer;
    border: none;
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
