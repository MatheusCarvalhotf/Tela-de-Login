<template>
  <div v-if="!isAuthenticated">
    <Login @login-success="handleLoginSuccess" />
  </div>

  <div v-else class="layout">
    <Navbar
      @toggle-panel="handleToggle"
      @toggle-tabela="handleToggleTabela"
      @logout="handleLogout"
    />
    <main class="main-content">
      <div class="flex">
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
import { ref, onMounted } from "vue";
import { getItems, saveItems, saveNote, getCurrentUser, logout } from "@/utils/Banco_dados";
import Login from "@/components/Login.vue";
import Navbar from "@/components/Nav-bar.vue";
import tabela_assuntos from "@/components/tabela_assuntos.vue";
import area_texto from "@/components/area_texto.vue";

const isAuthenticated = ref(false);
const showTabela = ref(false);
const showAreatext = ref(false);
const selectedSub = ref(null);
const tabelaItems = ref([]);

onMounted(() => {
  // Verifica se usuário já está logado
  const user = getCurrentUser();
  if (user) {
    isAuthenticated.value = true;
    loadUserData();
  }
});

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
  logout();
  isAuthenticated.value = false;
  showTabela.value = false;
  showAreatext.value = false;
  selectedSub.value = null;
  tabelaItems.value = [];
}

function handleToggleTabela() {
  showTabela.value = !showTabela.value;
  if (showTabela.value) {
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