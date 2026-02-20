<template>
  <AppHeader></AppHeader>
  <div class="loading-panel" v-if="showLoading">
    <img src="../../assets/loading.gif" />
    <div>正在登录...</div>
  </div>
  <div class="login-form" v-else>
    <div class="error-msg">{{ errorMsg }}</div>
    <el-form ref="formDataRef" :model="formData" :rules="rules" label-width="0px" @submit.prevent>
      <el-form-item prop="email">
        <el-input v-model.trim="formData.email" placeholder="请输入邮箱" size="large" clearable>
          <template #prefix> <i class="iconfont icon-email"></i> </template
        ></el-input>
      </el-form-item>
      <el-form-item prop="nickname" v-if="!isLogin">
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
      <el-form-item prop="rePassword" v-if="!isLogin">
        <el-input
          v-model.trim="formData.rePassword"
          placeholder="请再次输入密码"
          clearable
          show-password
        >
          <template #prefix>
            <i class="iconfont icon-password"></i>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="" prop="checkcode">
        <div class="check-code-panel">
          <el-input
            clearable
            placeholder="请输入验证码"
            v-model.trim="formData.checkCode"
            size="large"
          >
            <template #prefix>
              <i class="iconfont icon-checkcode"></i>
            </template>
          </el-input>
          <img :src="checkCodeUrl" />
        </div>
      </el-form-item>
      <el-form-item label="" prop="">
        <el-button type="primary" class="login-btn" size="large">{{
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
import { ref } from 'vue'

const isLogin = ref(true)
const formData = ref({})
const formDataRef = ref()
const rules = {
  email: [{ required: true, message: '请输入邮箱' }],
  password: [{ required: true, message: '请输入密码' }]
}

const changeOpType = async () => {
  window.electron.ipcRenderer.invoke('loginOrRegister', !isLogin.value)
  isLogin.value = !isLogin.value
}

const showLoading = ref(false)
const errorMsg = ref()
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
    border-radius: none;
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
  }
}
</style>
