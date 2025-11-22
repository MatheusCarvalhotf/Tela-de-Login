<template>
  <div class="progress-container">
    <div class="progress-header">
      <h1 class="progress-title">
        <span class="icon">⏱️</span>
        Seu Tempo no Painel
      </h1>
      <p class="user-info">Usuário: <strong>{{ currentUser?.username }}</strong></p>
    </div>

    <!-- Layout em 2 colunas: Gráfico à esquerda, Cards à direita -->
    <div class="two-column-layout">
      <!-- Coluna da Esquerda: Gráfico -->
      <div class="chart-section">
        <h2 class="section-title">Recorde Diário - Últimos 30 Dias</h2>
        <p class="chart-description">Mostra o maior tempo de sessão de cada dia</p>
        <div class="chart-container">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="progress-chart">
            <!-- Grid Lines -->
            <line
              v-for="i in 5"
              :key="`grid-${i}`"
              :x1="chartPadding"
              :y1="chartPadding + (chartHeight - chartPadding * 2) * (i - 1) / 4"
              :x2="chartWidth - chartPadding"
              :y2="chartPadding + (chartHeight - chartPadding * 2) * (i - 1) / 4"
              stroke="#333"
              stroke-width="1"
              stroke-dasharray="4,4"
            />
            
            <!-- Y-axis labels (tempo) -->
            <text
              v-for="i in 5"
              :key="`label-${i}`"
              :x="chartPadding - 10"
              :y="chartPadding + (chartHeight - chartPadding * 2) * (4 - (i - 1)) / 4 + 5"
              fill="#888"
              font-size="12"
              text-anchor="end"
            >
              {{ formatTimeAxis((maxRecordTime * (i - 1)) / 4) }}
            </text>
            
            <!-- Area Fill com curva suave -->
            <path
              :d="smoothAreaPath"
              fill="url(#gradient)"
              opacity="0.3"
            />
            
            <!-- Line Chart com curva suave -->
            <path
              :d="smoothLinePath"
              fill="none"
              stroke="#6ea8ff"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            
            <!-- Points -->
            <circle
              v-for="(point, index) in dailyData"
              :key="`point-${index}`"
              :cx="getX(index)"
              :cy="getY(point.record)"
              :r="point.record > 0 ? 6 : 3"
              :fill="point.record > 0 ? (point.isToday ? '#ffd700' : '#6ea8ff') : '#666'"
              :class="['chart-point', { 'active-point': point.record > 0, 'today-point': point.isToday }]"
            >
              <title>{{ point.date }}: {{ formatTime(point.record) }} ({{ point.sessions }} sessões)</title>
            </circle>
            
            <!-- Gradient Definition -->
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#6ea8ff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#6ea8ff;stop-opacity:0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background: #6ea8ff;"></div>
            <span>Recorde do dia</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #ffd700;"></div>
            <span>Hoje</span>
          </div>
        </div>
      </div>

      <div class="stats-sidebar">
        <div class="stat-card record-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <div class="stat-label">Recorde de Hoje</div>
            <div class="stat-value">{{ formatTime(todayRecord) }}</div>
            <div class="stat-subtitle">Maior sessão de hoje</div>
          </div>
        </div>

        <div class="stat-card month-card">
          <div class="stat-icon">👑</div>
          <div class="stat-content">
            <div class="stat-label">Recorde Histórico</div>
            <div class="stat-value">{{ formatTime(allTimeRecord) }}</div>
            <div class="stat-subtitle">Seu melhor tempo</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { getCurrentUser } from '@/utils/Banco_dados';

const currentUser = ref(null);
const dailyData = ref([]);
const todayRecord = ref(0);
const allTimeRecord = ref(0);

const chartWidth = 800;
const chartHeight = 300;
const chartPadding = 50;

let updateTimer = null;

const maxRecordTime = computed(() => {
  return Math.max(...dailyData.value.map(d => d.record), 60);
});

function getCatmullRomPath(points, tension = 0.5) {
  if (points.length < 2) return '';
  
  let path = `M ${points[0].x},${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
    
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  
  return path;
}

const smoothLinePath = computed(() => {
  const points = dailyData.value.map((point, index) => ({
    x: getX(index),
    y: getY(point.record)
  }));
  return getCatmullRomPath(points);
});

const smoothAreaPath = computed(() => {
  const points = dailyData.value.map((point, index) => ({
    x: getX(index),
    y: getY(point.record)
  }));
  
  const linePath = getCatmullRomPath(points);
  const lastX = getX(dailyData.value.length - 1);
  const firstX = getX(0);
  const bottomY = chartHeight - chartPadding;
  
  return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
});

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min ${secs}s`;
  return `${secs}s`;
}

function formatTimeAxis(seconds) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.round(seconds)}s`;
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getTodayString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(getTodayString(date));
  }
  return days;
}

function getX(index) {
  const chartAreaWidth = chartWidth - chartPadding * 2;
  return chartPadding + (chartAreaWidth * index) / (dailyData.value.length - 1);
}

function getY(seconds) {
  const chartAreaHeight = chartHeight - chartPadding * 2;
  const maxSeconds = maxRecordTime.value;
  return chartHeight - chartPadding - (chartAreaHeight * seconds / maxSeconds);
}

function loadProgress() {
  const user = getCurrentUser();
  if (!user) return;
  
  currentUser.value = user;
  
  try {
    const key = `panel_tracking_${user.username}`;
    const data = localStorage.getItem(key);
    const tracking = data ? JSON.parse(data) : {
      dailyRecords: {},
      allTimeRecord: 0
    };
    
    const last30Days = getLast30Days();
    const today = getTodayString();
    
    dailyData.value = last30Days.map(date => {
      const dayData = tracking.dailyRecords[date] || { record: 0, sessions: 0 };
      return {
        date: formatDate(new Date(date)),
        record: dayData.record || 0,
        sessions: dayData.sessions || 0,
        isToday: date === today
      };
    });
    
    todayRecord.value = tracking.dailyRecords[today]?.record || 0;
    allTimeRecord.value = tracking.allTimeRecord || 0;
    
  } catch (e) {
    console.error('Erro ao carregar progresso:', e);
  }
}

function startUpdateLoop() {
  updateTimer = setInterval(() => {
    loadProgress();
  }, 1000);
}

onMounted(() => {
  loadProgress();
  startUpdateLoop();
});

onBeforeUnmount(() => {
  if (updateTimer) {
    clearInterval(updateTimer);
  }
});
</script>

<style scoped>
.progress-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: #e6eef3;
}

.progress-header {
  text-align: center;
  margin-bottom: 2rem;
}

.progress-title {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.icon {
  font-size: 2rem;
}

.user-info {
  color: #888;
  font-size: 0.9rem;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stats-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-card {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.record-card {
  border-left: 4px solid #ffd700;
}

.month-card {
  border-left: 4px solid #ff6b35;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #888;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
}

.stat-subtitle {
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.chart-section {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}

.chart-description {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.chart-container {
  width: 100%;
  overflow-x: auto;
}

.progress-chart {
  width: 100%;
  height: auto;
}

.chart-point {
  cursor: pointer;
  transition: all 0.3s;
}

.chart-point:hover {
  r: 8 !important;
}

.chart-point.active-point {
  filter: drop-shadow(0 0 4px #6ea8ff);
}

.chart-point.today-point {
  filter: drop-shadow(0 0 6px #ffd700);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.chart-legend {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #888;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

@media (max-width: 768px) {
  .progress-container {
    padding: 1rem;
  }
  
  .two-column-layout {
    grid-template-columns: 1fr;
  }
  
  .stats-sidebar {
    order: -1;
  }
}
</style>