<template>
  <div class="area-texto">
    <div class="flex justify-between items-center mb-4">
    <h2>{{ texto }}</h2>
    <button class="btn btn-sm btn-circle btn-ghost" @click="fecharEditor" title="Fechar">
    </button>
  </div>
  <textarea v-model= "anotacao"
    class="textarea textarea-bordered" placeholder="Digite suas anotações aqui"
    rows="20"
  ></textarea>
  <div class="mt-2 text-sm flex justify-between items-center">
    <span :class="isSaving ? 'text-warning' : 'text-success'">
        {{ isSaving ? '💾 Salvando...' : '✓ Salvo automaticamente' }}
      </span>
      <span class="text-xs opacity-50">
        Última atualização: {{ lastSaved }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount,computed } from 'vue';
import { getNote,saveNote } from '@/utils/Banco_dados';

const emit = defineEmits(['fechar', 'update-content']);

const props = defineProps({
  subId: String,
  texto: String,
  itemId: Number,
});

const anotacao = ref('');
const isSaving = ref(false);
const lastSavedTime = ref(new Date());
let autoSaveTimer = null;
const SAVE_DELAY = 700;

const lastSaved = computed(() => {
  const now = new Date();
  const diff = Math.floor((now - lastSavedTime.value) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return lastSavedTime.value.toLocaleTimeString();
});

function fecharEditor() {
  // Salva antes de fechar
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    salvarImediatamente();
  }
  emit('fechar');
}

async function loadNote(id) {
  if (!id) { anotacao.value = ''; return; }
  try{
    anotacao.value = await getNote(id) || '';
  } catch (e) {
    console.warn('Erro ao carregar a anotação', e);
    anotacao.value = ' ';
  }
}

async function salvarImediatamente() {
  try {
    if (props.subId) {
      await saveNote(props.subId, anotacao.value);

      // Emite atualização para sincronizar com a tabela
      if (props.itemId) {
        emit('update-content', {
          id: props.itemId,
          content: anotacao.value
        });
      }

      lastSavedTime.value = new Date();
    }
  } catch (e) {
    console.warn('Erro ao salvar nota:', e);
  }
}

function scheduleSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  isSaving.value = true;

  autoSaveTimer = setTimeout(async () => {
    await salvarImediatamente();
    isSaving.value = false;
  }, SAVE_DELAY);
}

watch(() => props.subId, (id) => {
  loadNote(id);
});

watch(anotacao, () => {
  scheduleSave();
});

onMounted(() => {
  loadNote(props.subId);
});

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
      salvarImediatamente();
  }
});
</script>

<style scoped>
.area-texto {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.25rem;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  min-height: 350px;
  margin-top: 1rem;
  resize: vertical;
}
.mt-2 { margin-top: 0.5rem; }
.text-muted { color: rgba(0,0,0,0.5); }
</style>
