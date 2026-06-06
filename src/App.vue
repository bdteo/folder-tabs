<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import { FolderAttachment, FolderTabs, type FolderTabItem } from './components/folder-tabs';

const icon = (name: string, children: ReturnType<typeof h>[]) => defineComponent({
  name,
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }, children),
});

const Icons = {
  archive: icon('IconArchive', [
    h('path', { d: 'M3 7h18' }),
    h('path', { d: 'M5 7v14h14V7' }),
    h('path', { d: 'M8 3h8l2 4H6l2-4Z' }),
  ]),
  briefcase: icon('IconBriefcase', [
    h('path', { d: 'M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1' }),
    h('rect', { x: '3', y: '6', width: '18', height: '15', rx: '2' }),
    h('path', { d: 'M3 12h18' }),
  ]),
  compass: icon('IconCompass', [
    h('circle', { cx: '12', cy: '12', r: '9' }),
    h('path', { d: 'm15 9-2 6-6 2 2-6 6-2Z' }),
  ]),
  graph: icon('IconGraph', [
    h('path', { d: 'M4 19V5' }),
    h('path', { d: 'M4 19h17' }),
    h('path', { d: 'm8 15 4-5 4 3 4-7' }),
  ]),
  spark: icon('IconSpark', [
    h('path', { d: 'm12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z' }),
    h('path', { d: 'm19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z' }),
  ]),
  note: icon('IconNote', [
    h('path', { d: 'M6 3h9l3 3v18H6V3Z' }),
    h('path', { d: 'M14 3v6h6' }),
    h('path', { d: 'M9 13h6' }),
    h('path', { d: 'M9 17h7' }),
  ]),
};

const caseTabs: FolderTabItem[] = [
  { key: 'intake', label: 'Client intake', shortLabel: 'Intake', tone: 'copper', icon: Icons.archive, count: 8 },
  { key: 'evidence', label: 'Evidence cabinet', shortLabel: 'Evidence', tone: 'teal', icon: Icons.briefcase, count: 14 },
  { key: 'strategy', label: 'Strategy map', shortLabel: 'Strategy', tone: 'moss', icon: Icons.compass, count: 3 },
  { key: 'signals', label: 'Signal model', shortLabel: 'Signals', tone: 'violet', icon: Icons.graph, count: 6 },
  { key: 'review', label: 'Counsel review', shortLabel: 'Review', tone: 'slate', icon: Icons.note, count: 2 },
];

const compactTabs: FolderTabItem[] = [
  {
    key: 'photos',
    label: 'Object photos',
    shortLabel: 'Photos',
    tone: 'moss',
    icon: Icons.archive,
    count: 1,
    totalCount: 15,
    countLabel: '15',
  },
  { key: 'plans', label: 'Floor plans', shortLabel: 'Plans', tone: 'copper', icon: Icons.graph, count: 2 },
  { key: 'maps', label: 'Maps and plans', shortLabel: 'Maps', tone: 'violet', icon: Icons.compass, count: 4 },
];

const chessTabs: FolderTabItem[] = caseTabs.map((tab, index) => ({
  ...tab,
  edge: index % 2 === 0 ? 'left' : 'right',
}));

const cornerTabs: FolderTabItem[] = [
  { ...compactTabs[0], edge: 'bottom' },
  { ...compactTabs[1], edge: 'right' },
  { ...compactTabs[2], edge: 'bottom' },
  { ...caseTabs[4], edge: 'right' },
];

const demoParams = new URLSearchParams(window.location.search);

function demoActiveKey(
  demoTabs: FolderTabItem[],
  paramName: string,
  fallbackKey: string,
): string {
  const requestedKey = demoParams.get(paramName);

  if (!requestedKey) {
    return fallbackKey;
  }

  return demoTabs.some((tab) => !tab.disabled && String(tab.key) === requestedKey)
    ? requestedKey
    : fallbackKey;
}

const horizontalActive = ref(demoActiveKey(caseTabs, 'activeTop', 'evidence'));
const standaloneActive = ref(demoActiveKey(caseTabs, 'activeStandalone', 'strategy'));
const standaloneSideActive = ref(demoActiveKey(caseTabs, 'activeStandaloneSide', 'review'));
const verticalActive = ref(demoActiveKey(caseTabs, 'activeLeft', 'signals'));
const compactActive = ref(demoActiveKey(compactTabs, 'activeBottom', 'photos'));
const rightEdgeActive = ref(demoActiveKey(caseTabs, 'activeRight', 'intake'));
const chessActive = ref(demoActiveKey(chessTabs, 'activeChess', 'strategy'));
const cornerActive = ref(demoActiveKey(cornerTabs, 'activeCorner', 'photos'));
const topHoverKey = ref(demoParams.get('hoverTop') ?? demoParams.get('hover'));
const leftHoverKey = ref(demoParams.get('hoverLeft') ?? demoParams.get('hover'));
const bottomHoverKey = ref(demoParams.get('hoverBottom') ?? demoParams.get('hover'));
const rightHoverKey = ref(demoParams.get('hoverRight') ?? demoParams.get('hover'));
const chessHoverKey = ref(demoParams.get('hoverChess') ?? demoParams.get('hover'));
const cornerHoverKey = ref(demoParams.get('hoverCorner') ?? demoParams.get('hover'));

const activeCase = computed(() => caseTabs.find((tab) => tab.key === horizontalActive.value));
const activeStandalone = computed(() => caseTabs.find((tab) => tab.key === standaloneActive.value));
const activeStandaloneSide = computed(() => caseTabs.find((tab) => tab.key === standaloneSideActive.value));
const activeVertical = computed(() => caseTabs.find((tab) => tab.key === verticalActive.value));
const activeCompact = computed(() => compactTabs.find((tab) => tab.key === compactActive.value));
const activeChess = computed(() => chessTabs.find((tab) => tab.key === chessActive.value));
const activeCorner = computed(() => cornerTabs.find((tab) => tab.key === cornerActive.value));
</script>

<template>
  <main class="demo-shell">
    <section class="demo-hero">
      <p class="demo-kicker">Vue copy-in primitive</p>
      <h1>FolderTabs</h1>
      <p class="demo-lede">
        Tactile index tabs with physical depth, orientation-aware labels,
        roving focus, and compact resting states.
      </p>
    </section>

    <section class="demo-rail-lab" aria-label="Standalone FolderTabs rail demos">
      <div class="demo-rail-copy">
        <p class="demo-kicker">Standalone rail</p>
        <h2>Measured tab geometry</h2>
        <p>
          The rail-only component keeps the accessible tablist behavior while
          sizing opened labels from the rendered text itself.
        </p>
      </div>

      <div class="demo-rail-samples">
        <div class="demo-rail-track">
          <FolderTabs
            v-model="standaloneActive"
            :tabs="caseTabs"
            :pulled-key="standaloneActive"
            ariaLabel="Standalone horizontal folder rail"
            orientation="horizontal"
            edge="top"
            appearance="stack"
            expand-on="hover"
          />
          <div class="demo-rail-readout" aria-live="polite">
            <span>{{ activeStandalone?.shortLabel }}</span>
            <strong>{{ activeStandalone?.count }} notes</strong>
          </div>
        </div>

        <div class="demo-rail-side">
          <FolderTabs
            v-model="standaloneSideActive"
            :tabs="caseTabs"
            :pulled-key="standaloneSideActive"
            ariaLabel="Standalone right folder rail"
            orientation="vertical"
            edge="right"
            appearance="stack"
            expand-on="hover"
          />
          <div class="demo-rail-readout demo-rail-readout--side" aria-live="polite">
            <span>{{ activeStandaloneSide?.shortLabel }}</span>
            <strong>{{ activeStandaloneSide?.count }} notes</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="demo-board" aria-label="FolderTabs component demos">
      <FolderAttachment
        v-model="horizontalActive"
        class="demo-stage demo-stage--top"
        folder-class="demo-file"
        :tabs="caseTabs"
        ariaLabel="Case file sections"
        orientation="horizontal"
        edge="top"
        expand-on="hover"
        depth="subtle"
        tone="copper"
        :layers="2"
        :emulated-hover-key="topHoverKey"
      >
        <div>
          <p class="demo-file__eyebrow">Top folder</p>
          <h2>{{ activeCase?.label }}</h2>
          <p>
            A top tab pulls the selected folder upward from the binder,
            then lets it settle back into the stack.
          </p>
        </div>
        <div class="demo-file__tray" aria-hidden="true">
          <span>exhibit log</span>
          <span>14 docs</span>
          <span>4 flagged</span>
        </div>
        <div class="demo-file__stamp">{{ activeCase?.count }}</div>
      </FolderAttachment>

      <FolderAttachment
        v-model="verticalActive"
        class="demo-stage demo-stage--split"
        folder-class="demo-dossier demo-dossier--signals"
        :tabs="caseTabs"
        ariaLabel="Vertical case file sections"
        orientation="vertical"
        edge="left"
        gravity="center"
        appearance="stack"
        expand-on="hover"
        depth="deep"
        tone="teal"
        :layers="2"
        :emulated-hover-key="leftHoverKey"
      >
        <p class="demo-file__eyebrow">Left folder</p>
        <h2>{{ activeVertical?.shortLabel }}</h2>
        <p>
          A left tab pulls the whole folder left, so the stack direction
          and motion direction tell the same story.
        </p>
        <div class="demo-signal-strip" aria-hidden="true">
          <span>match confidence 87%</span>
          <span>2 unresolved notes</span>
          <span>last touched today</span>
        </div>
      </FolderAttachment>

      <FolderAttachment
        v-model="compactActive"
        class="demo-stage demo-stage--compact"
        folder-class="demo-photo"
        :tabs="compactTabs"
        ariaLabel="Media tabs"
        orientation="horizontal"
        edge="bottom"
        expand-on="active"
        depth="raised"
        tone="moss"
        :layers="1"
        :emulated-hover-key="bottomHoverKey"
      >
        <div class="demo-photo__copy">
          <p class="demo-file__eyebrow">Bottom folder</p>
          <h2>{{ activeCompact?.shortLabel }} contact sheet</h2>
          <p>
            Exterior references, floor-plan scraps, and map captures collected
            into one quick-review media sleeve.
          </p>
        </div>
        <div class="demo-photo__contact-sheet" aria-hidden="true">
          <i class="demo-photo__shot demo-photo__shot--large"><span>front</span></i>
          <i class="demo-photo__shot"><span>yard</span></i>
          <i class="demo-photo__shot"><span>entry</span></i>
          <i class="demo-photo__shot"><span>roof</span></i>
          <i class="demo-photo__shot demo-photo__shot--wide"><span>street</span></i>
        </div>
        <div class="demo-photo__meta" aria-hidden="true">
          <span>{{ activeCompact?.countLabel ?? activeCompact?.count }} selected</span>
          <span>3 marked for review</span>
        </div>
      </FolderAttachment>

      <FolderAttachment
        v-model="rightEdgeActive"
        class="demo-stage demo-stage--right"
        folder-class="demo-dossier demo-dossier--right demo-dossier--handoff"
        :tabs="caseTabs"
        ariaLabel="Right edge sections"
        orientation="vertical"
        edge="right"
        appearance="stack"
        expand-on="focus"
        activation="manual"
        depth="deep"
        tone="violet"
        :layers="2"
        :emulated-hover-key="rightHoverKey"
      >
        <template #icon="{ active }">
          <component :is="active ? Icons.spark : Icons.note" />
        </template>

        <p class="demo-file__eyebrow">Right folder</p>
        <h2>Mirrored direction</h2>
        <p>
          A right tab pulls the selected folder right, matching the side
          stack instead of drifting diagonally.
        </p>
        <div class="demo-handoff-list" aria-hidden="true">
          <span>owner review</span>
          <span>stack mirrors right</span>
          <span>manual focus mode</span>
        </div>
      </FolderAttachment>
    </section>

    <section class="demo-combo-board" aria-label="Mixed edge FolderTabs demos">
      <div class="demo-combo-copy">
        <p class="demo-kicker">Mixed edge binder</p>
        <h2>Chessboard tab indexes</h2>
        <p>
          One binder can assign each folder to its own edge, so alternating
          left/right or bottom/right tags still pull their matching folder as
          one piece.
        </p>
      </div>

      <FolderAttachment
        v-model="chessActive"
        class="demo-stage demo-stage--chess"
        folder-class="demo-dossier demo-dossier--chess"
        :tabs="chessTabs"
        ariaLabel="Chessboard case file sections"
        orientation="vertical"
        edge="left"
        appearance="stack"
        expand-on="hover"
        depth="deep"
        tone="teal"
        :layers="2"
        :emulated-hover-key="chessHoverKey"
      >
        <p class="demo-file__eyebrow">Left plus right</p>
        <h2>{{ activeChess?.shortLabel }}</h2>
        <p>
          Alternating side tabs give the binder a physical index pattern
          without splitting the folder stack into separate components.
        </p>
        <div class="demo-signal-strip" aria-hidden="true">
          <span>{{ activeChess?.count }} active notes</span>
          <span>mirrored side index</span>
          <span>single tablist</span>
        </div>
      </FolderAttachment>

      <FolderAttachment
        v-model="cornerActive"
        class="demo-stage demo-stage--corner"
        folder-class="demo-photo demo-photo--corner"
        :tabs="cornerTabs"
        ariaLabel="Corner media file sections"
        orientation="horizontal"
        edge="bottom"
        appearance="stack"
        expand-on="hover"
        depth="raised"
        tone="moss"
        :layers="1"
        :emulated-hover-key="cornerHoverKey"
      >
        <div class="demo-photo__copy">
          <p class="demo-file__eyebrow">Bottom plus right</p>
          <h2>{{ activeCorner?.shortLabel }} corner file</h2>
          <p>
            Bottom tags and right-side tags share the same physical binder
            while keeping their own edge direction.
          </p>
        </div>
        <div class="demo-corner-grid" aria-hidden="true">
          <span>survey</span>
          <span>photos</span>
          <span>plans</span>
          <span>review</span>
        </div>
      </FolderAttachment>
    </section>
  </main>
</template>
