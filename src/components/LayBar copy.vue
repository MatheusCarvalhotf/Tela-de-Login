<template>
  <div v-if="!isAuthenticated">
    <Login @login-success="handleLoginSuccess" />
  </div>

  <div v-else class="layout">
    <Navbar
      @toggle-tabela="handleToggleTabela"
      @toggle-progresso="handleToggleProgresso"
      @logout="handleLogout"
    />
    <main class="main-content">
      <div class="flex">
        
        <Progresso v-if="showProgresso" />
        
        
        <area_texto
          v-if="showAreatext && selectedSub"
          :text="anotacao"
          :key="selectedSub.id"
          :sub-id="selectedSub.id"
          :texto="selectedSub.title"
          :item-id="selectedSub.itemId"
          @fechar="fecharEditor"
          @update-content="handleUpdateContent"
        />
        
        
        <tabela_assuntos
          v-if="showTabela"
          :items="tabelaItems"
          @open-editor="handleOpenEditor"
          @update-items="handleUpdateTabelaItems"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { 
  getItems, 
  saveItems, 
  saveNote, 
  getCurrentUser, 
  logout
} from "@/utils/Banco_dados";
import Login from "@/components/Login.vue";
import Navbar from "@/components/Nav-bar.vue";
import tabela_assuntos from "@/components/tabela_assuntos.vue";
import area_texto from "@/components/area_texto.vue";
import Progresso from "@/components/Progresso.vue";

const isAuthenticated = ref(false);
const showTabela = ref(false);
const showAreatext = ref(false);
const showProgresso = ref(false);
const selectedSub = ref(null);
const tabelaItems = ref([]);

let sessionStartTime = null;
let sessionTimer = null;
let saveTimer = null;

const isUsingPanel = ref(false);

onMounted(() => {
  const user = getCurrentUser();
  if (user) {
    isAuthenticated.value = true;
    loadUserData();
  }

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  stopSessionTracking();
});

watch([showTabela, showAreatext], ([tabela, editor]) => {
  const wasUsingPanel = isUsingPanel.value;
  isUsingPanel.value = tabela || editor;
  
  if (isUsingPanel.value && !wasUsingPanel) {
    startSessionTracking();
  } else if (!isUsingPanel.value && wasUsingPanel) {
    stopSessionTracking();
  }
});

function startSessionTracking() {
  if (sessionStartTime) return;
  
  sessionStartTime = Date.now();
  
  sessionStorage.setItem('panel_session', JSON.stringify({
    startTime: sessionStartTime
  }));
  
  sessionTimer = setInterval(() => {
    sessionStorage.setItem('panel_session', JSON.stringify({
      startTime: sessionStartTime
    }));
  }, 1000);
  
  saveTimer = setInterval(() => {
    saveCurrentSession();
  }, 10000);
  
  console.log('⏱️ Rastreamento iniciado');
}

function stopSessionTracking() {
  if (!sessionStartTime) return;
  
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
  
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
  
  saveCurrentSession();
  sessionStorage.removeItem('panel_session');
  sessionStartTime = null;
  
  console.log('⏹️ Rastreamento parado');
}

function saveCurrentSession() {
  if (!sessionStartTime) return;
  
  const user = getCurrentUser();
  if (!user) return;
  
  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
  
  if (sessionDuration < 1) return;
  
  try {
    const key = `panel_tracking_${user.username}`;
    const data = localStorage.getItem(key);
    const tracking = data ? JSON.parse(data) : {
      dailyRecords: {},
      allTimeRecord: 0
    };
    
    const today = getTodayString();
    
    if (!tracking.dailyRecords[today]) {
      tracking.dailyRecords[today] = {
        record: 0,
        sessions: 0
      };
    }
    
    tracking.dailyRecords[today].sessions++;
    
    if (sessionDuration > tracking.dailyRecords[today].record) {
      tracking.dailyRecords[today].record = sessionDuration;
    }
    
    if (sessionDuration > tracking.allTimeRecord) {
      tracking.allTimeRecord = sessionDuration;
    }
    
    localStorage.setItem(key, JSON.stringify(tracking));
    
    console.log(`💾 Sessão salva: ${sessionDuration}s`);
    
  } catch (e) {
    console.error('Erro ao salvar sessão:', e);
  }
}

function getTodayString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function handleBeforeUnload() {
  if (isAuthenticated.value && isUsingPanel.value) {
    stopSessionTracking();
  }
}

function handleVisibilityChange() {
  if (document.hidden && isUsingPanel.value) {
    stopSessionTracking();
  } else if (!document.hidden && isUsingPanel.value) {
    startSessionTracking();
  }
}

function loadUserData() {
  try {
    tabelaItems.value = getItems() || [];
  } catch (e) {
    console.warn('Falha ao carregar dados do usuário', e);
    tabelaItems.value = [];
  }
}

function handleLoginSuccess(user) {
  isAuthenticated.value = true;
  loadUserData();
}

function handleLogout() {
  stopSessionTracking();
  logout();
  isAuthenticated.value = false;
  showTabela.value = false;
  showAreatext.value = false;
  showProgresso.value = false;
  selectedSub.value = null;
  tabelaItems.value = [];
}

function handleToggleTabela() {
  showTabela.value = !showTabela.value;
  if (showTabela.value) {
    showAreatext.value = false;
    showProgresso.value = false;
    selectedSub.value = null;
  }
}

function handleToggleProgresso() {
  showProgresso.value = !showProgresso.value;
  if (showProgresso.value) {
    showTabela.value = false;
    showAreatext.value = false;
    selectedSub.value = null;
  }
}

function fecharEditor() {
  showAreatext.value = false;
  selectedSub.value = null;
  showTabela.value = true;
}

async function handleOpenEditor(item) {
  if (!item || !item.title) {
    alert('Item inválido ou sem título');
    return;
  }
  const key = `table-${item.id}`;
  selectedSub.value = { id: key, title: item.title, itemId: item.id };

  try {
    await saveNote(key, item.content || '');
  } catch (e) {
    console.warn('Falha ao salvar nota inicial no IndexedDB', e);
  }
  showTabela.value = false;
  showProgresso.value = false;
  showAreatext.value = true;
}

function handleUpdateContent(payload) {
  const index = tabelaItems.value.findIndex(i => i.id === payload.id);
  if (index > -1) {
    tabelaItems.value[index].content = payload.content;
    try {
      saveItems(tabelaItems.value);
      console.log('Conteúdo sincronizado com a tabela');
    } catch (e) {
      console.warn('Falha ao sincronizar conteúdo:', e);
    }
  }
}

function handleUpdateTabelaItems(newItems) {
  tabelaItems.value = newItems;
  try {
    saveItems(newItems);
  } catch (e) {
    console.warn('Falha ao salvar itens da tabela:', e);
  }
}
</script>

<style lang="css" scoped>
.flex {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}
.main-content {
  padding: 1rem;
}
</style>