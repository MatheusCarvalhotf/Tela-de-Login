<template>
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-none">
      <button class="btn btn-square btn-ghost" @click="toggleTabela">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block h-5 w-5 stroke-current">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16">
          </path>
        </svg>
      </button>
    </div>
    <div class="flex-1">
      <a class="btn btn-ghost text-xl">Painel de assuntos</a>
      <span class="text-sm text-gray-500 ml-4">{{ username }}</span>
    </div>
    <div class="flex-none gap-2">
      <button class="btn btn-ghost btn-sm" @click="handleLogout">
        Sair
      </button>
      <button class="btn btn-square btn-ghost"
      @click="toggleTabela">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        class="inline-block h-5 w-5 stroke-current">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z">
          </path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getCurrentUser } from '@/utils/Banco_dados';

const emit = defineEmits(['toggle-panel', 'toggle-tabela', 'logout']);

const username = computed(() => {
  const user = getCurrentUser();
  return user ? `@${user.username}` : '';
});

function toggleTabela() {
  emit('toggle-tabela');
}

function handleLogout() {
  if (confirm('Deseja realmente sair?')) {
    emit('logout');
  }
}
</script>

<style scoped></style>