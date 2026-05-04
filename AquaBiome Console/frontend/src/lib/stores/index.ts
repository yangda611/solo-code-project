import { writable, derived } from 'svelte/store';
import type { FullState, Preset, Alert } from '$lib/types';
import { presetApi, alertApi } from '$lib/services/api';

export const currentState = writable<FullState | null>(null);
export const presets = writable<Preset[]>([]);
export const loading = writable(false);
export const error = writable<string | null>(null);
export const selectedPresetId = writable<number | null>(null);

export const activePreset = derived(currentState, $state => $state?.preset ?? null);
export const activeFish = derived(currentState, $state => $state?.fish ?? []);
export const activeCorals = derived(currentState, $state => $state?.corals ?? []);
export const activeDevices = derived(currentState, $state => $state?.devices ?? []);
export const activeWaterParams = derived(currentState, $state => $state?.waterParams ?? null);
export const activeLighting = derived(currentState, $state => $state?.lighting ?? []);
export const activeFeeding = derived(currentState, $state => $state?.feeding ?? []);
export const activeAlerts = derived(currentState, $state => $state?.alerts ?? []);

export const criticalAlerts = derived(activeAlerts, $alerts => 
  $alerts.filter(a => a.severity === 'critical')
);

export const hasCriticalAlerts = derived(criticalAlerts, $alerts => $alerts.length > 0);

export async function loadPresets() {
  try {
    const data = await presetApi.getAll();
    presets.set(data);
    return data;
  } catch (err) {
    error.set(err instanceof Error ? err.message : 'Failed to load presets');
    throw err;
  }
}

export async function loadCurrentState() {
  loading.set(true);
  try {
    const state = await presetApi.getFullState();
    currentState.set(state);
    error.set(null);
    return state;
  } catch (err) {
    error.set(err instanceof Error ? err.message : 'Failed to load current state');
    throw err;
  } finally {
    loading.set(false);
  }
}

export async function switchPreset(presetId: number) {
  loading.set(true);
  try {
    await presetApi.setActive(presetId);
    await loadCurrentState();
    selectedPresetId.set(presetId);
    error.set(null);
  } catch (err) {
    error.set(err instanceof Error ? err.message : 'Failed to switch preset');
    throw err;
  } finally {
    loading.set(false);
  }
}

export async function resolveAlert(alertId: number) {
  try {
    await alertApi.resolve(alertId);
    await loadCurrentState();
  } catch (err) {
    error.set(err instanceof Error ? err.message : 'Failed to resolve alert');
    throw err;
  }
}

export function clearError() {
  error.set(null);
}
