<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import { FolderTabs, type FolderTabItem } from './components/folder-tabs';

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
  { key: 'intake', label: 'Client intake', shortLabel: 'Intake', icon: Icons.archive, count: 8 },
  { key: 'evidence', label: 'Evidence cabinet', shortLabel: 'Evidence', icon: Icons.briefcase, count: 14 },
  { key: 'strategy', label: 'Strategy map', shortLabel: 'Strategy', icon: Icons.compass, count: 3 },
  { key: 'signals', label: 'Signal model', shortLabel: 'Signals', icon: Icons.graph, count: 6 },
  { key: 'review', label: 'Counsel review', shortLabel: 'Review', icon: Icons.note, count: 2 },
];

const compactTabs: FolderTabItem[] = [
  { key: 'photos', label: 'Object photos', shortLabel: 'Photos', icon: Icons.archive, count: 1, totalCount: 15, countLabel: '15' },
  { key: 'plans', label: 'Floor plans', shortLabel: 'Plans', icon: Icons.graph, count: 2 },
  { key: 'maps', label: 'Maps and plans', shortLabel: 'Maps', icon: Icons.compass, count: 4 },
];

const horizontalActive = ref('evidence');
const verticalActive = ref('signals');
const compactActive = ref('photos');
const rightEdgeActive = ref('intake');

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
      <div class="demo-stage demo-stage--wide">
        <FolderTabs
          v-model="horizontalActive"
          :tabs="caseTabs"
          ariaLabel="Case file sections"
          orientation="horizontal"
          edge="top"
          expand-on="hover"
        />

        <article class="demo-file">
          <div>
            <p class="demo-file__eyebrow">Selected file</p>
            <h2>{{ activeCase?.label }}</h2>
            <p>
              The horizontal rail keeps inactive labels hidden, then opens the
              active tab with enough room for label, count, and icon.
            </p>
          </div>
          <div class="demo-file__stamp">{{ activeCase?.count }}</div>
        </article>
      </div>

      <div class="demo-stage demo-stage--split">
        <FolderTabs
          v-model="verticalActive"
          :tabs="caseTabs"
          ariaLabel="Vertical case file sections"
          orientation="vertical"
          edge="left"
          density="overlap"
          gravity="center"
          expand-on="hover"
        />

        <article class="demo-dossier">
          <p class="demo-file__eyebrow">Left edge</p>
          <h2>{{ activeVertical?.shortLabel }}</h2>
          <p>
            Vertical labels are readable only when they need to be. The inactive
            stack stays icon-first and keeps the physical folder rhythm.
          </p>
        </article>
      </div>

      <div class="demo-stage demo-stage--compact">
        <FolderTabs
          v-model="compactActive"
          :tabs="compactTabs"
          ariaLabel="Media tabs"
          orientation="horizontal"
          edge="top"
          expand-on="active"
        />

        <div class="demo-photo">
          <span>Limited media count remains screen-reader friendly</span>
        </div>
      </div>

      <div class="demo-stage demo-stage--right">
        <article class="demo-dossier demo-dossier--right">
          <p class="demo-file__eyebrow">Right edge</p>
          <h2>Mirrored direction</h2>
          <p>
            The same component can sit on either side. Label rotation and lift
            direction follow the configured edge.
          </p>
        </article>

        <FolderTabs
          v-model="rightEdgeActive"
          :tabs="caseTabs"
          ariaLabel="Right edge sections"
          orientation="vertical"
          edge="right"
          density="dense"
          expand-on="focus"
          activation="manual"
        >
          <template #icon="{ active }">
            <component :is="active ? Icons.spark : Icons.note" />
          </template>
        </FolderTabs>
      </div>
    </section>
  </main>
</template>
