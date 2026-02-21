<template>
  <AppHeader :show-max="false"></AppHeader>
  <div v-if="showLoading" class="loading-panel">
    <img src="../../assets/loading.gif" />
    <div>{{ isLogin ? '正在登录...' : '正在注册...' }}</div>
  </div>
  <AuthForm
    v-else
    ref="authFormRef"
    :is-login="isLogin"
    :form-data="formData"
    :rules="rules"
    :check-code-url="checkCodeUrl"
    :error-msg="errorMsg"
    @submit="onSubmit"
    @toggle-mode="onToggleMode"
    @refresh-check-code="refreshCheckCode"
    @update-field="onUpdateField"
  />
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthForm from './components/AuthForm.vue'
import useLoginAuth from './composables/useLoginAuth'

const router = useRouter()
const authFormRef = ref()

const {
  isLogin,
  showLoading,
  errorMsg,
  formData,
  rules,
  checkCodeUrl,
  refreshCheckCode,
  changeOpType,
  handleSubmit
} = useLoginAuth(router)

const clearValidate = () => {
  authFormRef.value?.clearValidate()
}

const onToggleMode = async () => {
  await changeOpType(clearValidate)
}

const onSubmit = async () => {
  await handleSubmit(clearValidate)
}

const onUpdateField = ({ key, value }) => {
  formData[key] = value
}
</script>

<style lang="scss" scoped>
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
</style>
