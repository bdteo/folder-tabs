import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDemoRuntime,
  evaluateInPage,
  navigateDemo,
  waitForDemoFrame,
} from './demo-cdp-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.FOLDERTABS_DEMO_QA_PORT ?? 5175);
const chromePort = Number(process.env.FOLDERTABS_DEMO_QA_CHROME_PORT ?? 9341);
const minSideVisibleGrabLane = 110;
const minIconClearance = 6;
const maxActiveSeamGap = 0.75;
const maxActiveSeamOverlap = 1.5;
const maxHoverMotionDelta = 0.75;
const minHoverOutwardTug = 4;
const qaScenarios = [
  {
    name: 'hovered handles',
    path: '?activeTop=evidence&activeBottom=photos&activeRight=signals'
      + '&hoverTop=intake&hoverLeft=strategy&hoverBottom=plans&hoverRight=review'
      + '&hoverChess=review&hoverCorner=review',
    runClickPull: true,
  },
  {
    name: 'buried side icons',
    path: '?activeTop=evidence&activeLeft=review&activeBottom=photos'
      + '&activeRight=review&activeChess=review&activeCorner=review',
    runClickPull: false,
  },
];

const viewports = [
  { height: 1200, mobile: false, name: 'desktop', width: 1440 },
  { height: 844, mobile: true, name: 'mobile', width: 390 },
];

function assertNoFailures(viewport, scenario, result) {
  if (result.failures.length === 0) {
    console.log(`Demo geometry passed: ${viewport.name} / ${scenario.name} (${result.measurements.length} geometry samples checked)`);
    return;
  }

  const details = result.failures
    .map((failure) => `- ${failure}`)
    .join('\n');

  throw new Error(`Demo geometry failed for ${viewport.name} / ${scenario.name}:\n${details}`);
}

function assertNoInteractionFailures(viewport, result) {
  if (result.failures.length === 0) {
    console.log(`Demo click-pull passed: ${viewport.name} (${result.measurements.length} interactions checked)`);
    return;
  }

  const details = result.failures
    .map((failure) => `- ${failure}`)
    .join('\n');

  throw new Error(`Demo click-pull failed for ${viewport.name}:\n${details}`);
}

function assertNoConsoleFailures(viewport, scenario, entries) {
  if (entries.length === 0) {
    console.log(`Demo console passed: ${viewport.name} / ${scenario.name}`);
    return;
  }

  const details = entries
    .map((entry) => `- ${formatConsoleEntry(entry)}`)
    .join('\n');

  throw new Error(`Demo console failed for ${viewport.name} / ${scenario.name}:\n${details}`);
}

function createConsoleErrorCollector(client) {
  const entries = [];

  client.on('Runtime.consoleAPICalled', (params) => {
    if (params.type !== 'error' && params.type !== 'assert') {
      return;
    }

    entries.push({
      kind: `console.${params.type}`,
      message: formatRemoteArguments(params.args),
    });
  });

  client.on('Runtime.exceptionThrown', (params) => {
    const details = params.exceptionDetails ?? {};

    entries.push({
      kind: 'exception',
      lineNumber: details.lineNumber,
      message: details.exception?.description ?? details.text ?? 'Uncaught browser exception.',
      url: details.url,
    });
  });

  client.on('Log.entryAdded', (params) => {
    const entry = params.entry ?? {};

    if (entry.level !== 'error') {
      return;
    }

    entries.push({
      kind: entry.source ? `${entry.source} error` : 'browser error',
      lineNumber: entry.lineNumber,
      message: entry.text ?? 'Browser log error.',
      url: entry.url,
    });
  });

  return {
    take() {
      return entries.splice(0);
    },
  };
}

function formatRemoteArguments(args = []) {
  return args
    .map((arg) => String(arg.description ?? arg.value ?? arg.unserializableValue ?? arg.type ?? 'unknown'))
    .join(' ');
}

function formatConsoleEntry(entry) {
  const location = entry.url
    ? ` (${entry.url}${entry.lineNumber !== undefined ? `:${entry.lineNumber}` : ''})`
    : '';

  return `${entry.kind}: ${entry.message}${location}`;
}

async function inspectDemoGeometry(client) {
  return await evaluateInPage(client, `(async () => {
    const minSideVisibleGrabLane = ${minSideVisibleGrabLane};
    const minIconClearance = ${minIconClearance};
    const maxActiveSeamGap = ${maxActiveSeamGap};
    const maxActiveSeamOverlap = ${maxActiveSeamOverlap};
    const maxHoverMotionDelta = ${maxHoverMotionDelta};
    const minHoverOutwardTug = ${minHoverOutwardTug};
    const round = (value) => Math.round(value * 100) / 100;
    const closeEnough = (actual, expected, tolerance) => Math.abs(actual - expected) <= tolerance;
    const edgeVectors = {
      top: { x: 0, y: -1 },
      right: { x: 1, y: 0 },
      bottom: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
    };
    const parsePx = (style, name) => {
      const parsed = Number.parseFloat(style.getPropertyValue(name));

      return Number.isFinite(parsed) ? parsed : 0;
    };
    const parseTranslate = (transform) => {
      if (!transform || transform === 'none') {
        return { x: 0, y: 0 };
      }

      const matrix3dMatch = transform.match(/^matrix3d\\((.*)\\)$/);

      if (matrix3dMatch) {
        const values = matrix3dMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));

        return { x: values[12] || 0, y: values[13] || 0 };
      }

      const matrixMatch = transform.match(/^matrix\\((.*)\\)$/);

      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));

        return { x: values[4] || 0, y: values[5] || 0 };
      }

      return { x: Number.NaN, y: Number.NaN };
    };
    const parseZ = (folder) => {
      const value = folder.style.getPropertyValue('--folder-piece-z');
      const parsed = Number.parseFloat(value);

      return Number.isFinite(parsed) ? parsed : 0;
    };
    const readEdge = (folder) => {
      const edgeClass = Array.from(folder.classList)
        .find((name) => name.startsWith('folder-attachment__folder--edge-'));

      return edgeClass?.replace('folder-attachment__folder--edge-', '') ?? 'unknown';
    };
    const waitFrames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const isViewportPoint = (point) => (
      point.x >= 0
      && point.y >= 0
      && point.x <= window.innerWidth
      && point.y <= window.innerHeight
    );
    const describePaintTarget = (element) => {
      if (!element) {
        return 'nothing';
      }

      const tab = element.closest?.('.folder-attachment__tab');

      if (tab) {
        return tab.textContent?.trim().replace(/\\s+/g, ' ') || 'another tab';
      }

      return element.tagName?.toLowerCase?.() ?? 'unknown element';
    };
    const failures = [];
    const measurements = [];
    async function assertSideIconPaint() {
      for (const [rootIndex, root] of Array.from(document.querySelectorAll('.folder-attachment')).entries()) {
        const rootClass = Array.from(root.classList)
          .find((name) => name.startsWith('demo-stage--')) ?? \`attachment-\${rootIndex}\`;
        const sideFolders = Array.from(root.querySelectorAll('.folder-attachment__folder--edge-left, .folder-attachment__folder--edge-right'));

        if (sideFolders.length === 0) {
          continue;
        }

        for (const folder of sideFolders) {
          if (folder.classList.contains('is-active')) {
            continue;
          }

          const tab = folder.querySelector('.folder-attachment__tab');
          const icon = folder.querySelector('.folder-attachment__tab-icon');
          const label = tab?.textContent?.trim().replace(/\\s+/g, ' ') || '(unlabelled)';
          const edge = readEdge(folder);

          if (!tab || !icon) {
            failures.push(\`\${rootClass} / \${label}: side tab is missing its tab or icon element\`);
            continue;
          }

          tab.scrollIntoView({ block: 'center', inline: 'nearest' });
          await waitFrames();

          const iconRect = icon.getBoundingClientRect();
          const samplePoints = [
            { name: 'center', x: iconRect.left + (iconRect.width / 2), y: iconRect.top + (iconRect.height / 2) },
            { name: 'left edge', x: iconRect.left + 1, y: iconRect.top + (iconRect.height / 2) },
            { name: 'right edge', x: iconRect.right - 1, y: iconRect.top + (iconRect.height / 2) },
            { name: 'top edge', x: iconRect.left + (iconRect.width / 2), y: iconRect.top + 1 },
            { name: 'bottom edge', x: iconRect.left + (iconRect.width / 2), y: iconRect.bottom - 1 },
          ].filter(isViewportPoint);

          measurements.push({
            edge,
            label,
            root: rootClass,
            sideIconPaintSamples: samplePoints.length,
          });

          if (samplePoints.length === 0) {
            failures.push(\`\${rootClass} / \${label}: side icon could not be brought into the viewport for paint checks\`);
            continue;
          }

          for (const point of samplePoints) {
            const paintedElement = document.elementFromPoint(point.x, point.y);

            if (!paintedElement || (paintedElement !== tab && !tab.contains(paintedElement))) {
              failures.push(
                \`\${rootClass} / \${label}: side icon is visually covered at its \${point.name} by \${describePaintTarget(paintedElement)}\`,
              );
            }
          }
        }
      }
    }

    for (const [rootIndex, root] of Array.from(document.querySelectorAll('.folder-attachment')).entries()) {
      const rootClass = Array.from(root.classList)
        .find((name) => name.startsWith('demo-stage--')) ?? \`attachment-\${rootIndex}\`;
      const activeFolder = root.querySelector('.folder-attachment__folder.is-active');

      if (!activeFolder) {
        failures.push(\`\${rootClass}: missing active folder\`);
        continue;
      }

      const activeContent = activeFolder.querySelector('.folder-attachment__content:not([hidden])');

      if (!activeContent) {
        failures.push(\`\${rootClass}: missing visible active folder panel\`);
        continue;
      }

      const activePanelRect = activeContent.getBoundingClientRect();
      const activeZ = parseZ(activeFolder);

      for (const folder of root.querySelectorAll('.folder-attachment__folder')) {
        const tab = folder.querySelector('.folder-attachment__tab');
        const icon = folder.querySelector('.folder-attachment__tab-icon');
        const edge = readEdge(folder);
        const isActive = folder.classList.contains('is-active');
        const isHovered = folder.classList.contains('is-hovered');
        const z = parseZ(folder);
        const label = tab?.textContent?.trim().replace(/\\s+/g, ' ') || '(unlabelled)';

        if (folder !== activeFolder && z >= activeZ) {
          failures.push(\`\${rootClass} / \${label}: inactive z-index \${z} must stay below active \${activeZ}\`);
        }

        if (isHovered && !isActive && z >= activeZ) {
          failures.push(\`\${rootClass} / \${label}: hovered folder z-index \${z} must not overtake active \${activeZ}\`);
        }

        if (isHovered && !isActive) {
          if (!tab) {
            failures.push(\`\${rootClass} / \${label}: hovered folder is missing its tab element\`);
            continue;
          }

          const folderStyle = getComputedStyle(folder);
          const tabStyle = getComputedStyle(tab);
          const pieceX = parsePx(folderStyle, '--folder-piece-x');
          const pieceY = parsePx(folderStyle, '--folder-piece-y');
          const restX = parsePx(folderStyle, '--folder-piece-rest-x');
          const restY = parsePx(folderStyle, '--folder-piece-rest-y');
          const hoverX = parsePx(folderStyle, '--folder-tab-hover-x');
          const hoverY = parsePx(folderStyle, '--folder-tab-hover-y');
          const tabTranslate = parseTranslate(tabStyle.transform);
          const edgeVector = edgeVectors[edge] ?? { x: 0, y: 0 };
          const hoverOutwardTug = (tabTranslate.x * edgeVector.x) + (tabTranslate.y * edgeVector.y);

          measurements.push({
            edge,
            hoverOutwardTug: round(hoverOutwardTug),
            hoverTranslateX: round(tabTranslate.x),
            hoverTranslateY: round(tabTranslate.y),
            label,
            root: rootClass,
          });

          if (
            !closeEnough(pieceX, restX, maxHoverMotionDelta)
            || !closeEnough(pieceY, restY, maxHoverMotionDelta)
          ) {
            failures.push(
              \`\${rootClass} / \${label}: hovered folder sheet moved to \${round(pieceX)}, \${round(pieceY)} instead of staying tucked at \${round(restX)}, \${round(restY)}\`,
            );
          }

          if (
            !Number.isFinite(tabTranslate.x)
            || !Number.isFinite(tabTranslate.y)
            || !closeEnough(tabTranslate.x, hoverX, maxHoverMotionDelta)
            || !closeEnough(tabTranslate.y, hoverY, maxHoverMotionDelta)
          ) {
            failures.push(
              \`\${rootClass} / \${label}: hovered tab transform \${round(tabTranslate.x)}, \${round(tabTranslate.y)} does not match handle tug \${round(hoverX)}, \${round(hoverY)}\`,
            );
          }

          if (hoverOutwardTug < minHoverOutwardTug) {
            failures.push(
              \`\${rootClass} / \${label}: hovered tab tugs only \${round(hoverOutwardTug)}px outward; expected at least \${minHoverOutwardTug}px\`,
            );
          }
        }

        if (isActive) {
          if (!tab) {
            failures.push(\`\${rootClass} / \${label}: active folder is missing its tab element\`);
            continue;
          }

          const tabRect = tab.getBoundingClientRect();
          const activeSeamGap = edge === 'top'
            ? activePanelRect.top - tabRect.bottom
            : edge === 'bottom'
              ? tabRect.top - activePanelRect.bottom
              : edge === 'left'
                ? activePanelRect.left - tabRect.right
                : tabRect.left - activePanelRect.right;

          measurements.push({
            activeSeamGap: round(activeSeamGap),
            edge,
            label,
            root: rootClass,
          });

          if (activeSeamGap > maxActiveSeamGap) {
            failures.push(
              \`\${rootClass} / \${label}: active tab leaves a \${round(activeSeamGap)}px seam gap from its folder panel\`,
            );
          }

          if (activeSeamGap < -maxActiveSeamOverlap) {
            failures.push(
              \`\${rootClass} / \${label}: active tab overlaps its folder panel by \${round(Math.abs(activeSeamGap))}px\`,
            );
          }
        }

        if (edge !== 'left' && edge !== 'right') {
          continue;
        }

        if (!tab || !icon) {
          failures.push(\`\${rootClass} / \${label}: side tab is missing its tab or icon element\`);
          continue;
        }

        const tabRect = tab.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const visibleOutsideActivePanel = edge === 'left'
          ? activePanelRect.left - tabRect.left
          : tabRect.right - activePanelRect.right;
        const iconClearance = edge === 'left'
          ? activePanelRect.left - iconRect.right
          : iconRect.left - activePanelRect.right;

        measurements.push({
          edge,
          iconClearance: round(iconClearance),
          label,
          root: rootClass,
          visibleOutsideActivePanel: round(visibleOutsideActivePanel),
        });

        if (!isActive && visibleOutsideActivePanel < minSideVisibleGrabLane) {
          failures.push(
            \`\${rootClass} / \${label}: only \${round(visibleOutsideActivePanel)}px side grab lane is exposed; expected at least \${minSideVisibleGrabLane}px\`,
          );
        }

        if (iconClearance < minIconClearance) {
          failures.push(
            \`\${rootClass} / \${label}: icon overlaps active folder panel by \${round(Math.abs(iconClearance))}px\`,
          );
        }
      }
    }

    await assertSideIconPaint();

    return { failures, measurements };
  })()`);
}

async function inspectDemoClickPull(client) {
  return await evaluateInPage(client, `(async () => {
    const round = (value) => Math.round(value * 100) / 100;
    const closeEnough = (actual, expected, tolerance = 0.1) => Math.abs(actual - expected) <= tolerance;
    const parsePx = (style, name) => {
      const parsed = Number.parseFloat(style.getPropertyValue(name));

      return Number.isFinite(parsed) ? parsed : 0;
    };
    const parseZ = (folder) => {
      const parsed = Number.parseFloat(folder.style.getPropertyValue('--folder-piece-z'));

      return Number.isFinite(parsed) ? parsed : 0;
    };
    const waitFrames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const cases = [
      { rootSelector: '.demo-stage--top', targetLabel: 'Strategy' },
      { rootSelector: '.demo-stage--split', targetLabel: 'Intake' },
      { rootSelector: '.demo-stage--compact', targetLabel: 'Plans' },
      { rootSelector: '.demo-stage--right', targetLabel: 'Review' },
    ];
    const failures = [];
    const measurements = [];

    for (const testCase of cases) {
      const root = document.querySelector(testCase.rootSelector);

      if (!root) {
        failures.push(\`\${testCase.rootSelector}: missing demo root\`);
        continue;
      }

      const targetLabel = testCase.targetLabel.toLowerCase();
      const tab = Array.from(root.querySelectorAll('.folder-attachment__tab'))
        .find((candidate) => (candidate.getAttribute('aria-label') ?? candidate.textContent ?? '')
          .toLowerCase()
          .includes(targetLabel));

      if (!tab) {
        failures.push(\`\${testCase.rootSelector}: missing clickable \${testCase.targetLabel} tab\`);
        continue;
      }

      tab.click();
      await waitFrames();

      const folder = tab.closest('.folder-attachment__folder');
      const activeFolder = root.querySelector('.folder-attachment__folder.is-active');
      const folderStyle = folder ? getComputedStyle(folder) : null;
      const pieceX = folderStyle ? parsePx(folderStyle, '--folder-piece-x') : Number.NaN;
      const pieceY = folderStyle ? parsePx(folderStyle, '--folder-piece-y') : Number.NaN;
      const pullX = folderStyle ? parsePx(folderStyle, '--folder-piece-pull-x') : Number.NaN;
      const pullY = folderStyle ? parsePx(folderStyle, '--folder-piece-pull-y') : Number.NaN;
      const z = folder ? parseZ(folder) : Number.NaN;
      const activeContent = root.querySelector('.folder-attachment__content:not([hidden])');

      measurements.push({
        label: testCase.targetLabel,
        pieceX: round(pieceX),
        pieceY: round(pieceY),
        pullX: round(pullX),
        pullY: round(pullY),
        root: testCase.rootSelector,
        z,
      });

      if (!folder || folder !== activeFolder) {
        failures.push(\`\${testCase.rootSelector} / \${testCase.targetLabel}: clicked folder did not become active\`);
        continue;
      }

      if (!folder.classList.contains('is-pulling') && !folder.classList.contains('is-pulled')) {
        failures.push(\`\${testCase.rootSelector} / \${testCase.targetLabel}: clicked folder is not in a pulled motion state\`);
      }

      if (!tab.classList.contains('is-open')) {
        failures.push(\`\${testCase.rootSelector} / \${testCase.targetLabel}: clicked tab did not open with the pulled folder\`);
      }

      if (tab.getAttribute('aria-selected') !== 'true') {
        failures.push(\`\${testCase.rootSelector} / \${testCase.targetLabel}: clicked tab is not aria-selected\`);
      }

      if (z < 300) {
        failures.push(\`\${testCase.rootSelector} / \${testCase.targetLabel}: clicked folder z-index \${z} did not immediately become frontmost\`);
      }

      if (!closeEnough(pieceX, pullX) || !closeEnough(pieceY, pullY)) {
        failures.push(
          \`\${testCase.rootSelector} / \${testCase.targetLabel}: clicked folder offset \${round(pieceX)}, \${round(pieceY)} does not match pull offset \${round(pullX)}, \${round(pullY)}\`,
        );
      }

      if (!activeContent || !folder.contains(activeContent)) {
        failures.push(\`\${testCase.rootSelector} / \${testCase.targetLabel}: visible panel did not move into the clicked folder\`);
      }
    }

    return { failures, measurements };
  })()`);
}

let runtime;

try {
  runtime = await createDemoRuntime({
    chromePort,
    commandName: 'pnpm verify:demo',
    port,
    profilePrefix: 'foldertabs-demo-geometry',
    rootDir,
  });

  const consoleCollector = createConsoleErrorCollector(runtime.cdp);

  for (const viewport of viewports) {
    for (const scenario of qaScenarios) {
      consoleCollector.take();
      await navigateDemo(runtime.cdp, {
        baseUrl: runtime.baseUrl,
        height: viewport.height,
        mobile: viewport.mobile,
        pathAndQuery: scenario.path,
        width: viewport.width,
      });
      assertNoConsoleFailures(viewport, scenario, consoleCollector.take());

      assertNoFailures(viewport, scenario, await inspectDemoGeometry(runtime.cdp));
      if (scenario.runClickPull) {
        assertNoInteractionFailures(viewport, await inspectDemoClickPull(runtime.cdp));
      }
      await waitForDemoFrame(runtime.cdp);
      assertNoConsoleFailures(viewport, scenario, consoleCollector.take());
    }
  }
} finally {
  await runtime?.cleanup();
}
