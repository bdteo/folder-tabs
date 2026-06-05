import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue';
import type { FolderTabItem, FolderTabKey } from './folderTabs';

export type FolderPullPhase = 'tucked' | 'pulling' | 'pulled' | 'returning';

interface FolderPullMachineOptions {
  activeKey: ComputedRef<string | null>;
  pullDuration: () => number;
  returnDuration: () => number;
  select: (key: FolderTabKey, tab: FolderTabItem) => void;
}

export function useFolderPullMachine(options: FolderPullMachineOptions) {
  const phase = ref<FolderPullPhase>('tucked');
  const pulledKey = ref<string | null>(null);
  const pullingKey = ref<string | null>(null);
  const returningKey = ref<string | null>(null);
  const selectingKey = ref<string | null>(null);
  let pullTimer: ReturnType<typeof window.setTimeout> | null = null;
  let returnTimer: ReturnType<typeof window.setTimeout> | null = null;
  let requestedKey: string | null = null;
  let hasObservedInitialKey = false;

  const isPulled = computed(() => pulledKey.value !== null && pulledKey.value === options.activeKey.value);

  watch(options.activeKey, (key) => {
    if (!key) {
      resetMotion();
      phase.value = 'tucked';
      hasObservedInitialKey = true;
      return;
    }

    if (!hasObservedInitialKey) {
      hasObservedInitialKey = true;
      return;
    }

    if (key === pulledKey.value || key === requestedKey) {
      return;
    }

    resetMotion();
    startPull(key);
  }, { immediate: true });

  onBeforeUnmount(() => {
    resetMotion();
  });

  function selectFolder(tab: FolderTabItem): void {
    if (tab.disabled) {
      return;
    }

    const nextKey = String(tab.key);

    if (pulledKey.value === nextKey && phase.value !== 'returning') {
      options.select(tab.key, tab);
      return;
    }

    selectingKey.value = nextKey;

    if (pulledKey.value && pulledKey.value !== nextKey) {
      startReturn(pulledKey.value, () => {
        commitSelection(tab, nextKey);
      });
      return;
    }

    commitSelection(tab, nextKey);
  }

  function commitSelection(tab: FolderTabItem, normalizedKey: string): void {
    clearReturnTimer();
    requestedKey = normalizedKey;
    startPull(normalizedKey);
    options.select(tab.key, tab);

    window.setTimeout(() => {
      if (requestedKey === normalizedKey) {
        requestedKey = null;
      }
    }, 0);
  }

  function startPull(key: string): void {
    clearPullTimer();
    clearReturnTimer();
    phase.value = 'pulling';
    pulledKey.value = key;
    pullingKey.value = key;
    returningKey.value = null;
    selectingKey.value = key;

    pullTimer = window.setTimeout(() => {
      if (pulledKey.value === key) {
        phase.value = 'pulled';
        pullingKey.value = null;
        selectingKey.value = null;
      }

      pullTimer = null;
    }, normalizeDuration(options.pullDuration()));
  }

  function startReturn(key: string, afterReturn: () => void): void {
    clearPullTimer();
    clearReturnTimer();
    phase.value = 'returning';
    returningKey.value = key;
    pullingKey.value = null;
    pulledKey.value = null;

    returnTimer = window.setTimeout(() => {
      returningKey.value = null;
      phase.value = 'tucked';
      returnTimer = null;
      afterReturn();
    }, normalizeDuration(options.returnDuration()));
  }

  function clearPullTimer(): void {
    if (pullTimer !== null) {
      window.clearTimeout(pullTimer);
      pullTimer = null;
    }
  }

  function clearReturnTimer(): void {
    if (returnTimer !== null) {
      window.clearTimeout(returnTimer);
      returnTimer = null;
    }
  }

  function resetMotion(): void {
    clearPullTimer();
    clearReturnTimer();
    pulledKey.value = null;
    pullingKey.value = null;
    returningKey.value = null;
    selectingKey.value = null;
    requestedKey = null;
  }

  function normalizeDuration(duration: number): number {
    return Math.max(Math.round(duration), 0);
  }

  function isPullingKey(key: FolderTabKey): boolean {
    return String(key) === pullingKey.value;
  }

  function isPulledKey(key: FolderTabKey): boolean {
    return String(key) === pulledKey.value;
  }

  function isReturningKey(key: FolderTabKey): boolean {
    return String(key) === returningKey.value;
  }

  function isSelectingKey(key: FolderTabKey): boolean {
    return String(key) === selectingKey.value;
  }

  return {
    isPulled,
    phase,
    pulledKey,
    pullingKey,
    returningKey,
    selectingKey,
    isPulledKey,
    isPullingKey,
    isReturningKey,
    isSelectingKey,
    selectFolder,
  };
}
