import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue';
import { isFolderTabDisabled, normalizeFolderMotionDuration, type FolderTabItem, type FolderTabKey } from './folderTabs';

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
  const frontKey = ref<string | null>(null);
  let pullTimer: ReturnType<typeof window.setTimeout> | null = null;
  let returnTimer: ReturnType<typeof window.setTimeout> | null = null;
  let requestedKeyTimer: ReturnType<typeof window.setTimeout> | null = null;
  let requestedKey: string | null = null;
  let hasObservedInitialKey = false;

  const isPulled = computed(() => (
    (pulledKey.value !== null && pulledKey.value === options.activeKey.value)
    || (selectingKey.value !== null && selectingKey.value === options.activeKey.value)
  ));

  watch(options.activeKey, (key) => {
    if (!key) {
      resetMotion();
      hasObservedInitialKey = false;
      phase.value = 'tucked';
      return;
    }

    if (!hasObservedInitialKey) {
      hasObservedInitialKey = true;
      frontKey.value = key;
      return;
    }

    if (key === pulledKey.value || key === requestedKey) {
      if (key === requestedKey) {
        selectingKey.value = key;
      }

      frontKey.value = key;
      return;
    }

    frontKey.value = key;
    selectingKey.value = key;

    if (returningKey.value && phase.value === 'returning') {
      requestedKey = key;
      return;
    }

    if (pulledKey.value && pulledKey.value !== key) {
      requestedKey = key;
      startReturn(pulledKey.value, () => {
        pullRequestedKeyAfterReturn(key);
      });
      return;
    }

    resetMotion();
    startPull(key);
  }, { immediate: true });

  onBeforeUnmount(() => {
    resetMotion();
  });

  function selectFolder(tab: FolderTabItem): void {
    if (isFolderTabDisabled(tab)) {
      return;
    }

    const nextKey = String(tab.key);

    if (pulledKey.value === nextKey && phase.value !== 'returning') {
      return;
    }

    selectingKey.value = nextKey;
    frontKey.value = nextKey;

    if (returningKey.value && phase.value === 'returning') {
      requestedKey = nextKey;
      options.select(tab.key, tab);
      return;
    }

    if (pulledKey.value && pulledKey.value !== nextKey) {
      requestedKey = nextKey;
      options.select(tab.key, tab);

      startReturn(pulledKey.value, () => {
        pullRequestedKeyAfterReturn(nextKey);
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
    clearRequestedKey(normalizedKey);
  }

  function startPull(key: string): void {
    clearPullTimer();
    clearReturnTimer();
    phase.value = 'pulling';
    pulledKey.value = key;
    pullingKey.value = key;
    returningKey.value = null;
    selectingKey.value = key;
    frontKey.value = key;

    pullTimer = window.setTimeout(() => {
      if (pulledKey.value === key) {
        phase.value = 'pulled';
        pullingKey.value = null;
        selectingKey.value = null;
      }

      pullTimer = null;
    }, normalizeFolderMotionDuration(options.pullDuration()));
  }

  function startReturn(key: string, afterReturn: () => void): void {
    clearPullTimer();
    clearReturnTimer();
    phase.value = 'returning';
    returningKey.value = key;
    pullingKey.value = null;
    pulledKey.value = null;

    if (selectingKey.value === key) {
      selectingKey.value = null;
    }

    returnTimer = window.setTimeout(() => {
      returningKey.value = null;
      phase.value = 'tucked';
      returnTimer = null;
      afterReturn();
    }, normalizeFolderMotionDuration(options.returnDuration()));
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

  function clearRequestedKeyTimer(): void {
    if (requestedKeyTimer !== null) {
      window.clearTimeout(requestedKeyTimer);
      requestedKeyTimer = null;
    }
  }

  function pullRequestedKeyAfterReturn(fallbackKey: string): void {
    const nextKey = requestedKey ?? fallbackKey;

    if (options.activeKey.value === nextKey) {
      startPull(nextKey);
    }

    clearRequestedKey(nextKey);
  }

  function resetMotion(): void {
    clearPullTimer();
    clearReturnTimer();
    clearRequestedKeyTimer();
    pulledKey.value = null;
    pullingKey.value = null;
    returningKey.value = null;
    selectingKey.value = null;
    frontKey.value = null;
    requestedKey = null;
  }

  function clearRequestedKey(key: string): void {
    clearRequestedKeyTimer();

    requestedKeyTimer = window.setTimeout(() => {
      if (requestedKey === key) {
        requestedKey = null;
      }

      requestedKeyTimer = null;
    }, 0);
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

  function isHandoffKey(key: FolderTabKey): boolean {
    const normalizedKey = String(key);

    return normalizedKey === selectingKey.value
      && normalizedKey !== pullingKey.value
      && normalizedKey !== pulledKey.value;
  }

  function isFrontKey(key: FolderTabKey): boolean {
    return String(key) === frontKey.value;
  }

  return {
    isPulled,
    phase,
    pulledKey,
    pullingKey,
    returningKey,
    selectingKey,
    frontKey,
    isPulledKey,
    isPullingKey,
    isReturningKey,
    isSelectingKey,
    isHandoffKey,
    isFrontKey,
    selectFolder,
  };
}
