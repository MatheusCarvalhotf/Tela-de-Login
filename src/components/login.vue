<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-title">{{ isRegister ? 'Criar Conta' : 'Login' }}</h1>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label>Usuário</label>
          <input
            v-model="username"
            type="text"
            placeholder="Digite seu usuário"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label>Senha</label>
          <input
            v-model="password"
            type="password"
            placeholder="Digite sua senha"
            required
            autocomplete="current-password"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn-submit">
          {{ isRegister ? 'Criar Conta' : 'Entrar' }}
        </button>

        <button type="button" @click="toggleMode" class="btn-toggle">
          {{ isRegister ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { loginUser, registerUser, setCurrentUser } from '@/utils/Banco_dados';

const emit = defineEmits(['login-success']);

const username = ref('');
const password = ref('');
const isRegister = ref(false);
const error = ref('');

function toggleMode() {
  isRegister.value = !isRegister.value;
  error.value = '';
}

async function handleSubmit() {
  error.value = '';

  if (!username.value.trim() || !password.value.trim()) {
    error.value = 'Preencha todos os campos';
    return;
  }

  try {
    let user;
    if (isRegister.value) {
      user = await registerUser(username.value.trim(), password.value);
      error.value = '';
      alert('Conta criada com sucesso! Faça login.');
      isRegister.value = false;
      password.value = '';
    } else {
      user = await loginUser(username.value.trim(), password.value);
      setCurrentUser(user);
      emit('login-success', user);
    }
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  padding: 20px;
}

.login-box {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

.login-title {
  color: #fff;
  font-size: 2em;
  font-weight: 300;
  text-align: center;
  margin-bottom: 30px;
  letter-spacing: 2px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #888;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.form-group input {
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 5px;
  padding: 12px 15px;
  color: #fff;
  font-size: 1em;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #fff;
}

.error-message {
  background: rgba(255, 50, 50, 0.1);
  border: 1px solid rgba(255, 50, 50, 0.3);
  color: #ff6b6b;
  padding: 12px;
  border-radius: 5px;
  text-align: center;
  font-size: 0.9em;
}

.btn-submit {
  background: #fff;
  color: #000;
  border: none;
  padding: 15px;
  border-radius: 5px;
  font-size: 1em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.btn-submit:hover {
  background: #000;
  color: #fff;
  border: 1px solid #fff;
}

.btn-toggle {
  background: transparent;
  color: #888;
  border: none;
  padding: 10px;
  font-size: 0.9em;
  cursor: pointer;
  transition: color 0.3s;
}

.btn-toggle:hover {
  color: #fff;
}
</style>