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
      
      <!-- Dropdown Menu COMPACTO -->
      <div class="dropdown dropdown-end">
        <button 
          tabindex="0" 
          class="btn btn-square btn-ghost"
          @click="toggleMenu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          class="inline-block h-5 w-5 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z">
            </path>
          </svg>
        </button>
        <ul 
          v-if="menuOpen"
          tabindex="0" 
          class="dropdown-content menu-compact bg-base-200 rounded-box z-[1] shadow-lg border border-base-300"
        >
          <li>
            <a @click="handleMenuClick('progresso')" class="menu-item-compact">
              Meu Progresso
            </a>
          </li>
          <div class="divider-compact"></div>
          <li>
            <a @click="handleMenuClick('logout')" class="menu-item-compact text-error">
              Sair da Conta
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getCurrentUser } from '@/utils/Banco_dados';

const emit = defineEmits(['toggle-panel', 'toggle-tabela', 'toggle-progresso', 'logout']);

const menuOpen = ref(false);

const username = computed(() => {
  const user = getCurrentUser();
  return user ? `@${user.username}` : '';
});

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function toggleTabela() {
  emit('toggle-tabela');
}

function handleMenuClick(action) {
  menuOpen.value = false;
  
  switch(action) {
    case 'tabela':
      emit('toggle-tabela');
      break;
    case 'progresso':
      emit('toggle-progresso');
      break;
    case 'logout':
      handleLogout();
      break;
  }
}

function handleLogout() {
  if (confirm('Deseja realmente sair?')) {
    emit('logout');
  }
}
</script>

<style scoped>
.dropdown-content {
  margin-top: 0.5rem;
}

/* MENU COMPACTO - Largura BEM reduzida */
.menu-compact {
  min-width: 150px !important;
  width: 150px !important;
  padding: 0.4rem 0.2rem !important;
}

/* Items do menu MUITO compactos */
.menu-item-compact {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem !important;
  transition: all 0.2s;
  font-size: 0.8rem;
  white-space: nowrap;
}

.menu-item-compact:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item-compact svg {
  flex-shrink: 0;
}

.menu-item-compact span {
  flex: 1;
}

/* Divider compacto */
.divider-compact {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.25rem 0.5rem;
}
</style>