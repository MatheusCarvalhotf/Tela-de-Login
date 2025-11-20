<template>
  <div class="overflow-x-auto panel-theme">
    <div class="p-4 bg-base-200 mb-4 rounded-lg">
      <h3 class="text-lg mb-2">{{ editingItem.id ? 'Editar' : 'Novo' }} Assunto</h3>
      <div class="flex gap-4 flex-wrap">
        <input
          v-model="editingItem.title"
          class="input input-bordered"
          placeholder="Título do assunto"
        />
        <select v-model="editingItem.type" class="select select-bordered">
          <option value="Tema Principal">Tema Principal</option>
          <option value="Sub-tema">Sub-tema</option>
        </select>
        <div class ="relative w-full"></div>
          <textarea
            v-model="editingItem.content"
            @click="openAreaText"
            class="textarea textarea-bordered w-full cursor-pointer"
            placeholder="Clique para editar no editor completo"
            rows="3"
            readonly
          ></textarea>
          <span class="absolute right-2 top-2 text-xs text-gray-500">
            Clique para expandir
          </span>
        <div class="flex gap-2">
          <button
            class="btn btn-primary"
            @click="saveItem"
          >
            {{ editingItem.id ? 'Atualizar' : 'Criar' }}
          </button>
          <button
            v-if="editingItem.id"
            class="btn"
            @click="cancelEdit"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Tabela -->
    <table class="table w-full">
      <thead>
        <tr>
          <th>ID</th>
          <th>Assuntos</th>
          <th>Tipo</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id" class="bg-base-200">
          <td>{{ item.id }}</td>
          <td>{{ item.title }}</td>
          <td>{{ item.type }}</td>
          <td class="flex gap-2">
            <button
              class="btn btn-sm btn-ghost"
              @click="visualizarItem(item)"
            >
              Visualizar
            </button>
            <button
              class="btn btn-sm btn-info"
              @click="startEdit(item)"
            >
              Editar
            </button>
            <button
              class="btn btn-sm btn-error"
              @click="deleteItem(item.id)"
            >
              Excluir
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getItems, saveItems } from '@/utils/Banco_dados';

defineProps({
  items: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select-item', 'update-items', 'open-editor']);

const editingItem = ref({
  id: null,
  title: '',
  type: 'Tema Principal',
  content: ''
});

function openAreaText() {
  if (editingItem.value.id) {
    // Se está editando um item existente, abre o editor
    emit('open-editor', editingItem.value);
  }
}

function visualizarItem(item) {
  emit('open-editor', item);
}

function startEdit(item) {
  editingItem.value = { ...item };
}

function cancelEdit() {
  editingItem.value = {
    id: null,
    title: '',
    type: 'Tema Principal',
    content: ''
  };
}

function saveItem() {
  const items = getItems();

  if (!editingItem.value.title?.trim()) {
    alert('Por favor, preencha o título');
    return;
  }

  if (editingItem.value.id) {

    const index = items.findIndex(i => i.id === editingItem.value.id);
    if (index > -1) {
      items[index] = { ...editingItem.value };
    }
  } else {
    const newId = Math.max(0, ...items.map(i => i.id)) + 1;
    items.push({
      ...editingItem.value,
      id: newId
    });
  }
  saveItems(items);
  emit('update-items', items);
  cancelEdit();
}

function deleteItem(id) {
  if (!confirm('Tem certeza que deseja excluir este item?')) return;

  const items = getItems();
  const newItems = items.filter(i => i.id !== id);
  saveItems(newItems);
  emit('update-items', newItems);
}
</script>

<style scoped>
.overflow-x-auto {
  max-height: 80vh;
  overflow-y: auto;
}

/* Aplica tema do painel */
:root {
  --panel-bg: #2f363d;
  --panel-surface: #39424a;
  --panel-border: rgba(97,88,88,0.5);
  --panel-text: #e6eef3;
  --panel-accent: #6ea8ff;
}

.panel-theme {
  background: var(--panel-bg);
  color: var(--panel-text);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
}
.sub-item {
  display: flex;
  justify-content: flex-start; /* alinha à esquerda */
}
</style>
