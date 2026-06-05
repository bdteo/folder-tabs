<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import { FolderAttachment, type FolderTabItem } from './components/folder-tabs';

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

const horizontalActive = ref('evidence');
const verticalActive = ref('signals');
const compactActive = ref('photos');
const rightEdgeActive = ref('intake');
const demoParams = new URLSearchParams(window.location.search);
const topHoverKey = ref(demoParams.get('hoverTop') ?? demoParams.get('hover'));
const leftHoverKey = ref(demoParams.get('hoverLeft') ?? demoParams.get('hover'));
const bottomHoverKey = ref(demoParams.get('hoverBottom') ?? demoParams.get('hover'));
const rightHoverKey = ref(demoParams.get('hoverRight') ?? demoParams.get('hover'));

const activeCase = computed(() => caseTabs.find((tab) => tab.key === horizontalActive.value));
const activeVertical = computed(() => caseTabs.find((tab) => tab.key === verticalActive.value));
</script>

<template>
  <main class="demo-shell">
    <section class="demo-hero">
      <p class="demo-kicker">Vue copy-in primitive</p>
      <h1>FolderTabs</h1>
      <p class="demo-lede">
        Tactile index tabs with physical overlap, orientation-aware labels,
        roving focus, and compact resting states.
      </p>
    </section>

    <section class="demo-board" aria-label="FolderTabs component demos">
      <FolderAttachment
        v-model="horizontalActive"
        class="demo-stage demo-stage--wide"
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
        density="overlap"
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
        <div class="demo-photo__grid" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>Bottom tabs pull the media folder downward</span>
      </FolderAttachment>

      <FolderAttachment
        v-model="rightEdgeActive"
        class="demo-stage demo-stage--right"
        folder-class="demo-dossier demo-dossier--right demo-dossier--handoff"
        :tabs="caseTabs"
        ariaLabel="Right edge sections"
        orientation="vertical"
        edge="right"
        density="dense"
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
  </main>
</template>
