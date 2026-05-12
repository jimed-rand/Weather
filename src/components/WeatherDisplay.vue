<template>
  <ion-page>
    <ion-header class="weather-header" :translucent="true">
      <ion-toolbar>
        <ion-title>Weather</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Refresh" @click="fetchWeather">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="weather-content">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Weather</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="safe-pad">
        <div v-if="loading && !forecast" class="state-center">
          <ion-spinner name="crescent" />
          <p class="state-caption">Loading forecast…</p>
        </div>

        <div v-else-if="error" class="state-center error-state">
          <ion-icon :icon="cloudOfflineOutline" class="state-icon" />
          <p class="state-title">Could not load weather</p>
          <p class="state-caption">{{ error }}</p>
          <ion-button fill="outline" class="retry-btn" @click="fetchWeather">Try again</ion-button>
        </div>

        <template v-else-if="forecast">
          <section class="hero" aria-live="polite">
            <p class="hero-location">{{ locationLabel }}</p>
            <p class="hero-coords">{{ coordLabel }}</p>
            <p class="hero-temp">
              <span class="hero-temp-value">{{ formatTemp(currentTemp) }}</span>
              <span class="hero-temp-unit">{{ tempUnit }}</span>
            </p>
            <p class="hero-sub">Now · hourly from Open-Meteo</p>
            <div class="hero-stats">
              <div class="stat">
                <span class="stat-label">24h low</span>
                <span class="stat-value">{{ formatTemp(windowLow) }}{{ tempUnit }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">24h high</span>
                <span class="stat-value">{{ formatTemp(windowHigh) }}{{ tempUnit }}</span>
              </div>
            </div>
          </section>

          <ion-card class="hour-card">
            <ion-card-header>
              <ion-card-subtitle>Next hours</ion-card-subtitle>
              <ion-card-title>Hourly temperature</ion-card-title>
            </ion-card-header>
            <ion-card-content class="hour-strip-wrap">
              <div class="hour-strip" role="list">
                <button
                  v-for="(slot, i) in displaySlots"
                  :key="slot.time"
                  type="button"
                  class="hour-pill"
                  :class="{ current: i === displayCurrentIndex }"
                  role="listitem"
                >
                  <span class="hour-pill-time">{{ formatShortTime(slot.time) }}</span>
                  <span class="hour-pill-temp">{{ formatTemp(slot.temp) }}°</span>
                </button>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-list :inset="true" lines="full" class="detail-list">
            <ion-list-header>
              <ion-label>All hourly points</ion-label>
            </ion-list-header>
            <ion-item v-for="(slot, index) in allSlots" :key="slot.time" :detail="false">
              <ion-label>
                <h3>{{ formatDateTime(slot.time) }}</h3>
                <p>{{ formatTemp(slot.temp) }}{{ tempUnit }}</p>
              </ion-label>
              <ion-note v-if="index === currentIndexGlobal" slot="end" color="primary">Now</ion-note>
            </ion-item>
          </ion-list>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
} from '@ionic/vue';
import { refreshOutline, cloudOfflineOutline } from 'ionicons/icons';

const API_BASE = 'https://api.open-meteo.com/v1/forecast';
const LATITUDE = -6.2;
const LONGITUDE = 106.8;

interface HourlyPayload {
  time: string[];
  temperature_2m: (number | null)[];
}

interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  hourly: HourlyPayload;
  hourly_units?: { temperature_2m?: string };
}

const forecast = ref<ForecastResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const tempUnit = computed(() => forecast.value?.hourly_units?.temperature_2m?.replace(/[\d.]/g, '') || '°C');

const locationLabel = computed(() => 'Jakarta area');
const coordLabel = computed(() => `${LATITUDE}°, ${LONGITUDE}°`);

function slotsFromForecast(data: ForecastResponse) {
  const { time, temperature_2m } = data.hourly;
  const out: { time: string; temp: number }[] = [];
  for (let i = 0; i < time.length; i++) {
    const t = temperature_2m[i];
    if (t != null) out.push({ time: time[i], temp: t });
  }
  return out;
}

const allSlots = computed(() => (forecast.value ? slotsFromForecast(forecast.value) : []));

function findCurrentIndex(slots: { time: string }[]): number {
  const now = Date.now();
  let best = 0;
  for (let i = 0; i < slots.length; i++) {
    const t = new Date(slots[i].time).getTime();
    if (t <= now) best = i;
    else break;
  }
  return best;
}

const currentIndexGlobal = computed(() => findCurrentIndex(allSlots.value));

const currentTemp = computed(() => {
  const slots = allSlots.value;
  const idx = currentIndexGlobal.value;
  return slots[idx]?.temp ?? slots[0]?.temp ?? null;
});

const windowStart = computed(() => currentIndexGlobal.value);
const windowEnd = computed(() => Math.min(windowStart.value + 24, allSlots.value.length));

const displaySlots = computed(() => allSlots.value.slice(windowStart.value, windowEnd.value));

const displayCurrentIndex = computed(() => {
  const g = currentIndexGlobal.value;
  const s = windowStart.value;
  return Math.max(0, Math.min(g - s, displaySlots.value.length - 1));
});

const windowTemps = computed(() => displaySlots.value.map((s) => s.temp));

const windowLow = computed(() => (windowTemps.value.length ? Math.min(...windowTemps.value) : null));
const windowHigh = computed(() => (windowTemps.value.length ? Math.max(...windowTemps.value) : null));

function formatTemp(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

function formatShortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function fetchWeather(): Promise<void> {
  error.value = null;
  if (!forecast.value) loading.value = true;
  const url = new URL(API_BASE);
  url.searchParams.set('latitude', String(LATITUDE));
  url.searchParams.set('longitude', String(LONGITUDE));
  url.searchParams.set('hourly', 'temperature_2m');
  url.searchParams.set('timezone', 'Asia/Jakarta');

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ForecastResponse;
    if (!data.hourly?.time?.length) throw new Error('Unexpected response shape');
    forecast.value = data;
  } catch (e) {
    forecast.value = null;
    error.value = e instanceof Error ? e.message : 'Something went wrong';
  } finally {
    loading.value = false;
  }
}

async function onRefresh(ev: CustomEvent) {
  await fetchWeather();
  const target = ev.target as HTMLIonRefresherElement;
  target.complete();
}

onMounted(() => {
  fetchWeather();
});
</script>

<style scoped>
.weather-header ion-toolbar {
  --background: linear-gradient(135deg, #1e3a5f 0%, #2563a8 45%, #38bdf8 100%);
  --color: #fff;
  --border-width: 0;
}

.weather-content {
  --background: #0f172a;
}

.safe-pad {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  min-height: 40vh;
}

.state-caption {
  margin-top: 12px;
  color: var(--ion-color-medium, #94a3b8);
  font-size: 0.95rem;
}

.error-state .state-title {
  margin: 8px 0 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-text-color, #e2e8f0);
}

.state-icon {
  font-size: 48px;
  color: var(--ion-color-medium, #94a3b8);
}

.retry-btn {
  margin-top: 20px;
}

.hero {
  margin: 8px 16px 20px;
  padding: 24px 20px 20px;
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(30, 58, 95, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  color: #f1f5f9;
}

.hero-location {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #94a3b8;
}

.hero-coords {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.hero-temp {
  margin: 16px 0 0;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  line-height: 1;
}

.hero-temp-value {
  font-size: 4rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.hero-temp-unit {
  margin-top: 12px;
  font-size: 1.25rem;
  font-weight: 500;
  color: #94a3b8;
}

.hero-sub {
  margin: 12px 0 0;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.hero-stats {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.25);
}

.stat {
  flex: 1;
  min-width: 0;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.stat-value {
  display: block;
  margin-top: 4px;
  font-size: 1.1rem;
  font-weight: 600;
}

.hour-card {
  margin: 0 16px 16px;
  border-radius: 16px;
  --background: #1e293b;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.hour-card ion-card-title {
  color: #f1f5f9;
}

.hour-card ion-card-subtitle {
  color: #94a3b8;
}

.hour-strip-wrap {
  padding-inline: 0;
  padding-bottom: 8px;
}

.hour-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 16px 12px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.hour-pill {
  flex: 0 0 auto;
  scroll-snap-align: start;
  min-width: 72px;
  padding: 12px 10px;
  border: none;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.85);
  color: #e2e8f0;
  font: inherit;
  cursor: pointer;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
}

.hour-pill.current {
  background: linear-gradient(145deg, #0ea5e9, #2563eb);
  color: #fff;
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.35);
}

.hour-pill-time {
  display: block;
  font-size: 0.75rem;
  opacity: 0.9;
}

.hour-pill-temp {
  display: block;
  margin-top: 6px;
  font-size: 1.1rem;
  font-weight: 700;
}

.detail-list {
  margin-bottom: 24px;
}

:deep(.detail-list ion-item) {
  --background: #1e293b;
  --color: #e2e8f0;
  --border-color: rgba(148, 163, 184, 0.15);
}

:deep(.detail-list ion-list-header) {
  --background: transparent;
  --color: #94a3b8;
}

:deep(.detail-list h3) {
  font-size: 0.95rem;
  font-weight: 600;
}

:deep(.detail-list p) {
  color: #94a3b8;
  margin-top: 4px;
}
</style>
