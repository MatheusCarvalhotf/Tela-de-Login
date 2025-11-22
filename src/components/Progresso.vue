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

      <!-- Coluna da Direita: Cards de Estatísticas -->
      <div class="stats-sidebar">
        <div class="stat-card session-card">
          <div class="stat-icon">▶️</div>
          <div class="stat-content">
            <div class="stat-label">Sessão Atual</div>
            <div class="stat-value">{{ formatTime(currentSessionTime) }}</div>
            <div class="stat-subtitle">{{ isActive ? '🟢 Usando o painel' : '⏸️ Fora do painel' }}</div>
          </div>
        </div>

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

        <div class="stat-card today-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">Sessões Hoje</div>
            <div class="stat-value">{{ todaySessions }}</div>
            <div class="stat-subtitle">{{ formatDate(new Date()) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estatísticas Mensais -->
    <div class="history-section">
      <h2 class="section-title">📈 Evolução Mensal</h2>
      <div class="history-grid">
        <div
          v-for="(month, index) in monthlyStats"
          :key="index"
          class="history-card"
        >
          <div class="history-month">{{ month.monthName }}</div>
          <div class="history-stats">
            <div class="stat-row">
              <span class="stat-label-small">Recorde:</span>
              <span class="stat-value-small">{{ formatTime(month.bestRecord) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label-small">Sessões:</span>
              <span class="stat-value-small">{{ month.totalSessions }}</span>
            </div>
          </div>
          <div class="history-bar">
            <div 
              class="history-bar-fill"
              :style="{ width: getBarWidth(month.bestRecord) + '%' }"
            ></div>
          </div>
        </div>
      </div>
      <div v-if="monthlyStats.length === 0" class="empty-state">
        <p>Continue usando o painel para construir seu histórico! 💪</p>
      </div>
    </div>

    <!-- Dicas de Motivação -->
    <div class="motivation-section">
      <div class="motivation-card">
        <span class="motivation-icon">💡</span>
        <p class="motivation-text">{{ motivationMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { getCurrentUser } from '@/utils/Banco_dados';

const currentUser = ref(null);
const dailyData = ref([]);
const currentSessionTime = ref(0);
const todayRecord = ref(0);
const allTimeRecord = ref(0);
const todaySessions = ref(0);
const isActive = ref(false);
const monthlyStats = ref([]);

// Configurações do gráfico
const chartWidth = 800;
const chartHeight = 300;
const chartPadding = 50;

// Timers
let updateTimer = null;

const maxRecordTime = computed(() => {
  const maxSeconds = Math.max(...dailyData.value.map(d => d.record), 60);
  return maxSeconds;
});

// Função para criar curvas suaves (Catmull-Rom Spline)
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

const motivationMessage = computed(() => {
  const messages = [
    'Continue assim! Cada minuto no painel conta! 🚀',
    'Você está construindo um hábito incrível! 💪',
    'Foco e consistência são suas maiores ferramentas! 🎯',
    'Cada sessão é um passo em direção ao seu objetivo! ⭐',
    'Sua dedicação vai fazer a diferença! 🔥'
  ];
  const index = Math.floor(allTimeRecord.value / 600) % messages.length;
  return messages[index];
});

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else if (minutes > 0) {
    return `${minutes}min ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function formatTimeAxis(seconds) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${Math.round(seconds)}s`;
  }
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getTodayString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthName(monthKey) {
  const [year, month] = monthKey.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]}/${year}`;
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

function getBarWidth(seconds) {
  const maxSeconds = Math.max(...monthlyStats.value.map(m => m.bestRecord), 1);
  return (seconds / maxSeconds) * 100;
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
      allTimeRecord: 0,
      monthlyStats: {}
    };
    
    // Carrega dados diários (últimos 30 dias)
    const last30Days = getLast30Days();
    const today = getTodayString();
    
    dailyData.value = last30Days.map(date => {
      const dayData = tracking.dailyRecords[date] || { record: 0, sessions: 0 };
      return {
        date: formatDate(new Date(date)),
        record: dayData.record || 0,
        sessions: dayData.sessions || 0,
        dateObj: date,
        isToday: date === today
      };
    });
    
    // Carrega recorde de hoje
    todayRecord.value = tracking.dailyRecords[today]?.record || 0;
    todaySessions.value = tracking.dailyRecords[today]?.sessions || 0;
    
    // Carrega recorde histórico
    allTimeRecord.value = tracking.allTimeRecord || 0;
    
    // Carrega estatísticas mensais
    const monthKeys = Object.keys(tracking.monthlyStats || {})
      .sort()
      .reverse()
      .slice(0, 6);
    
    monthlyStats.value = monthKeys.map(monthKey => ({
      monthName: getMonthName(monthKey),
      bestRecord: tracking.monthlyStats[monthKey].bestRecord || 0,
      totalSessions: tracking.monthlyStats[monthKey].totalSessions || 0
    }));
    
  } catch (e) {
    console.error('Erro ao carregar progresso:', e);
  }
}

function updateCurrentSession() {
  // Atualiza o tempo da sessão atual
  const sessionData = sessionStorage.getItem('panel_session');
  if (sessionData) {
    const session = JSON.parse(sessionData);
    const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
    currentSessionTime.value = elapsed;
    isActive.value = true;
  } else {
    currentSessionTime.value = 0;
    isActive.value = false;
  }
}

function startUpdateLoop() {
  updateTimer = setInterval(() => {
    updateCurrentSession();
    loadProgress(); // Recarrega os dados para ver atualizações
  }, 1000);
}

onMounted(() => {
  loadProgress();
  updateCurrentSession();
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

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.session-card {
  border-left: 4px solid #4ecdc4;
}

.record-card {
  border-left: 4px solid #ffd700;
}

.month-card {
  border-left: 4px solid #ff6b35;
}

.today-card {
  border-left: 4px solid #6ea8ff;
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

.chart-section, .history-section, .motivation-section {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 2rem;
}

.history-section, .motivation-section {
  margin-bottom: 2rem;
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
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
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

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.history-card {
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
}

.history-month {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.history-stats {
  margin-bottom: 0.75rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.stat-label-small {
  color: #666;
  font-size: 0.8rem;
}

.stat-value-small {
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
}

.history-bar {
  width: 100%;
  height: 8px;
  background: #222;
  border-radius: 4px;
  overflow: hidden;
}

.history-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6ea8ff, #4ecdc4);
  transition: width 0.5s ease;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.motivation-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(110, 168, 255, 0.1), rgba(78, 205, 196, 0.1));
  border-radius: 8px;
  border: 1px solid rgba(110, 168, 255, 0.3);
}

.motivation-icon {
  font-size: 2rem;
}

.motivation-text {
  font-size: 1rem;
  color: #e6eef3;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .progress-container {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .history-grid {
    grid-template-columns: 1fr;
  }
}
</style>