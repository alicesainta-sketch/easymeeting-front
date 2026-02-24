import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { setCurrentUser } from '@/utils/auth'
import { setWorkspaceMode } from '@/utils/workspaceMode'

const useLoginAuth = (router) => {
  const isLogin = ref(true)
  const showLoading = ref(false)
  const errorMsg = ref('')
  const formData = reactive({
    email: '',
    nickname: '',
    password: '',
    rePassword: '',
    checkCode: ''
  })
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
    await setWorkspaceMode('meeting')
  }

  const resetForm = (clearValidate) => {
    formData.email = ''
    formData.nickname = ''
    formData.password = ''
    formData.rePassword = ''
    formData.checkCode = ''
    errorMsg.value = ''
    clearValidate?.()
  }

  const changeOpType = async (clearValidate) => {
    const targetIsLogin = !isLogin.value
    await resizeAuthWindow(targetIsLogin)
    isLogin.value = targetIsLogin
    resetForm(clearValidate)
    refreshCheckCode()
  }

  const handleSubmit = async (clearValidate) => {
    errorMsg.value = ''
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
    resetForm(clearValidate)
    formData.email = savedEmail
    refreshCheckCode()
  }

  onMounted(() => {
    refreshCheckCode()
  })

  return {
    isLogin,
    showLoading,
    errorMsg,
    formData,
    rules,
    checkCodeUrl,
    refreshCheckCode,
    changeOpType,
    handleSubmit
  }
}

export default useLoginAuth
