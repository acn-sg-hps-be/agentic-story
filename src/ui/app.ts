/**
 * app.ts — the presentation shell around the domain-neutral engine.
 *
 * One flattened "demo" dropdown (each plot across all scenarios is a demo),
 * the SVG scene, the plot runner (autoplay + bottom captions), the media
 * popup, transport controls, fullscreen/kiosk, keyboard shortcuts, and a
 * top-left brand bar whose logos come from the project manifest.
 *
 * Which project is shown comes from `?project=<id>` (see src/config.ts).
 */

import { loadProject, loadScenario, resolveMedia } from '../engine/loader';
import { buildScene, type SceneHandle } from '../engine/scene';
import { PlotRunner, type PopupRef } from '../engine/runner';
import { createModal } from '../engine/modal';
import { openGallery } from './gallery';
import { DEFAULT_PROJECT, PRODUCT_NAME, projectDir } from '../config';
import type { Branding, LoadedProject, LoadedScenario, ProjectLogo } from '../engine/types';

interface DemoEntry { path: string; plotIndex: number; label: string; }

export async function createApp(mount: HTMLElement, projectId = DEFAULT_PROJECT): Promise<void> {
  mount.innerHTML = '';
  const root = div('af-app');
  mount.appendChild(root);

  // The project manifest supplies the brand bar and the scenario list, so it
  // has to load before any chrome is drawn.
  let project: LoadedProject;
  try {
    project = await loadProject(projectDir(projectId));
  } catch (e) {
    return showError(root, `Could not load the project "${projectId}".`, e);
  }
  const branding: Branding = { title: project.manifest.branding?.productName ?? PRODUCT_NAME, mark: project.manifest.title };

  const stageWrap = div('af-stage-wrap');
  const caption = div('af-caption');
  const outcomesBar = div('af-outcomes');
  outcomesBar.style.display = 'none';
  const controls = div('af-controls');
  root.append(stageWrap, caption, outcomesBar, controls, brandBar(branding.title, project.logos));

  const showOutcomes = (list: Array<{ title: string; desc: string }>) => {
    const header = div('af-outcomes-title');
    header.textContent = 'Value Delivered';
    const row = div('af-outcomes-row');
    for (const o of list) {
      const card = div('af-outcome-card');
      const badge = div('af-outcome-badge'); badge.textContent = '✓';
      const t = div('af-outcome-title'); t.textContent = o.title;
      const d = div('af-outcome-desc'); d.textContent = o.desc;
      card.append(badge, t, d);
      row.appendChild(card);
    }
    outcomesBar.replaceChildren(header, row);
    outcomesBar.style.display = 'flex';
  };
  const hideOutcomes = () => { outcomesBar.style.display = 'none'; outcomesBar.replaceChildren(); };

  const modal = createModal(root, () => {/* stay paused */});

  // Keep HTML overlays (caption) proportional to the letterboxed SVG stage,
  // which scales by min(w/1280, h/720). Without this the fixed-px caption looks
  // oversized on a laptop and undersized on a big monitor.
  const applyScale = () => {
    const w = root.clientWidth || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;
    root.style.setProperty('--af-scale', String(Math.min(w / 1280, h / 720) || 1));
  };
  new ResizeObserver(applyScale).observe(root);
  window.addEventListener('resize', applyScale);
  document.addEventListener('fullscreenchange', () => setTimeout(applyScale, 60));
  applyScale();

  let loaded: LoadedScenario | null = null;
  let scene: SceneHandle | null = null;
  let runner: PlotRunner | null = null;

  // ---- controls -----------------------------------------------------------
  const demoSelect = document.createElement('select');
  demoSelect.className = 'af-select';
  demoSelect.setAttribute('aria-label', 'Demo');

  const btnPrev = iconBtn('◀', 'Previous step');
  const btnPlay = iconBtn('▶', 'Play / pause');
  const btnNext = iconBtn('▶▶', 'Next step');
  const btnReset = iconBtn('↺', 'Reset to start');
  const btnGallery = iconBtn('▦', 'Object gallery');
  const btnFull = iconBtn('⛶', 'Fullscreen');
  controls.append(demoSelect, spacer(), btnPrev, btnPlay, btnNext, btnReset, spacer(), btnGallery, btnFull);

  btnPrev.onclick = () => { runner?.pause(); runner?.prev(); };
  btnNext.onclick = () => { runner?.pause(); runner?.next(); };
  btnPlay.onclick = () => runner?.toggle();
  btnReset.onclick = () => runner?.reset();
  btnGallery.onclick = () => openGallery(root);
  btnFull.onclick = () => toggleFullscreen(root);

  document.addEventListener('keydown', (e) => {
    // popups auto-open during playback, so transport keys must keep working;
    // the modal handles its own Escape.
    const t = e.target as Element | null;
    const onInteractive = !!t && (t.closest('[data-node-id]') || t.closest('[data-agent]') || t.tagName === 'SELECT' || t.tagName === 'BUTTON');
    switch (e.key) {
      case ' ': if (!onInteractive) { e.preventDefault(); runner?.toggle(); } break;
      case 'ArrowRight': e.preventDefault(); runner?.pause(); runner?.next(); break;
      case 'ArrowLeft': e.preventDefault(); runner?.pause(); runner?.prev(); break;
      case 'r': case 'R': runner?.reset(); break;
      case 'f': case 'F': toggleFullscreen(root); break;
    }
  });

  // ---- load this project's scenarios, flatten plots into demos ------------
  const loadedByPath = new Map<string, LoadedScenario>();
  const entries: DemoEntry[] = [];

  for (const ref of project.scenarios) {
    try {
      const ls = await loadScenario(ref.path);
      loadedByPath.set(ref.path, ls);
      ls.scenario.plots.forEach((p, pi) => entries.push({ path: ref.path, plotIndex: pi, label: p.name }));
    } catch (e) {
      console.warn(`Skipping "${ref.path}":`, e);
    }
  }
  if (!entries.length) return showError(root, `No demos could be loaded for the project "${projectId}".`, new Error('Every scenario file listed in project.json failed to load.'));

  demoSelect.replaceChildren(...entries.map((e, i) => option(String(i), e.label)));
  demoSelect.onchange = () => selectEntry(Number(demoSelect.value));
  selectEntry(0);
  openHelp(root); // welcome/how-to on first view; playback stays paused behind it

  // ---- functions ----------------------------------------------------------
  function selectEntry(i: number) {
    const e = entries[i];
    if (!e) return;
    demoSelect.value = String(i);
    loaded = loadedByPath.get(e.path)!;
    buildPlot(e.plotIndex);
  }

  function buildPlot(plotIndex: number) {
    if (!loaded) return;
    runner?.destroy();
    const scenario = loaded.scenario;
    const plot = scenario.plots[plotIndex];

    scene = buildScene(scenario, plot, branding, {
      onNode: (kind, id) => { if (kind === 'input') openInput(id, true); },
      onAgent: (stationId, agentIndex) => openStationAgent(stationId, agentIndex, true),
    });
    stageWrap.replaceChildren(scene.svg);

    // final executive "outcomes" set: one card per output-emit step
    const outcomes = plot.steps
      .filter((s) => s.type === 'output-emit')
      .map((s) => {
        const out = scenario.outputs.find((o) => o.id === s.ref);
        return { title: out?.value ?? out?.label ?? s.ref, desc: s.caption };
      });

    runner = new PlotRunner(scenario, plot, scene, {
      onStepChange: (_i, step) => {
        // Any output-emit step shows the full outcomes bar (all cards) and hides
        // the subtitle — so no per-output captions ever leak as subtitles.
        if (step.type === 'output-emit' && outcomes.length) {
          caption.style.display = 'none';
          showOutcomes(outcomes);
        } else {
          hideOutcomes();
          caption.style.display = '';
          caption.textContent = step.caption;
          caption.classList.remove('af-cap-in'); void caption.offsetWidth; caption.classList.add('af-cap-in');
        }
      },
      onPopup: (popup) => applyPopup(popup),
      onPlayState: (playing) => { btnPlay.textContent = playing ? '❚❚' : '▶'; },
    });
    runner.goTo(0); // paused at the start; the presenter chooses Play or steps
  }

  // Beat-driven popups: an action beat closes the popup (highlight only); each
  // agent/input/output beat opens its popup one at a time (no pause / no focus
  // steal, so autoplay + shortcuts keep working).
  function applyPopup(popup: PopupRef | null) {
    if (!popup) { modal.close(); return; }
    if (popup.kind === 'input') openInput(popup.ref, false);
    else openStationAgent(popup.ref, popup.agentIndex, false);
  }

  function openInput(id: string, pause: boolean) {
    if (!loaded) return;
    if (pause) runner?.pause();
    const inp = loaded.scenario.inputs.find((x) => x.id === id);
    if (!inp) return;
    modal.open({ title: inp.label, subtitle: inp.persona ? inp.persona.role : 'Input', description: inp.description, inputFormat: inp.inputFormat, media: resolveMedia(loaded.baseUrl, inp.media) }, pause);
  }

  function openStationAgent(stationId: string, agentIndex: number, pause: boolean) {
    if (!loaded) return;
    if (pause) runner?.pause();
    const st = loaded.scenario.stations.find((x) => x.id === stationId);
    const agent = st?.agents[agentIndex];
    if (!st || !agent) return;
    modal.open({
      title: `${agent.name} Agent`,
      subtitle: st.label,
      description: agent.description ?? st.description,
      output: agent.output,
      media: resolveMedia(loaded.baseUrl, agent.media ?? st.media),
    }, pause);
  }
}

/* ---- DOM helpers --------------------------------------------------------- */
function div(cls: string): HTMLDivElement { const d = document.createElement('div'); d.className = cls; return d; }
function spacer(): HTMLElement { return div('af-spacer'); }
function option(value: string, label: string): HTMLOptionElement { const o = document.createElement('option'); o.value = value; o.textContent = label; return o; }
function iconBtn(glyph: string, label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'af-btn'; b.textContent = glyph; b.setAttribute('aria-label', label); b.title = label;
  return b;
}
/** Top-left brand bar: the project's logos, then the product name. */
function brandBar(productName: string, logos: ProjectLogo[]): HTMLElement {
  const bar = div('af-brandbar');
  const row = document.createElement('div');
  row.className = 'af-logos';
  for (const logo of logos) {
    const img = document.createElement('img');
    img.className = logo.invert ? 'af-logo af-logo-invert' : 'af-logo';
    img.src = logo.src; img.alt = logo.alt;
    img.onerror = () => img.remove(); // a missing logo should never break the bar
    row.appendChild(img);
  }
  const name = div('af-brand-name');
  name.textContent = productName;
  bar.append(row, name);
  return bar;
}
function openHelp(host: HTMLElement) {
  const overlay = div('af-help-overlay');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  const panel = div('af-help-panel');

  const h = document.createElement('h2');
  h.textContent = 'Welcome to the Agentic Factory';
  const lead = document.createElement('p');
  lead.className = 'af-help-lead';
  lead.textContent = 'A quick guide before you start:';
  panel.append(h, lead);

  const ul = document.createElement('ul');
  ul.className = 'af-help-list';
  const rows: Array<[string, string]> = [
    ['⛶', 'Click Fullscreen (or press F) first — it renders best on a big screen.'],
    ['▶', 'Press Play to run the story automatically, or use ◀ ▶ (or the ← → arrow keys) to click through it step by step.'],
    ['●', 'Click the person to see the incoming request, and click any agent to see what it does and what it produces.'],
    ['▦', 'Switch demos with the dropdown; the gallery button shows the available objects.'],
  ];
  for (const [icon, text] of rows) {
    const li = document.createElement('li');
    const ic = document.createElement('span'); ic.className = 'af-help-ico'; ic.textContent = icon;
    const tx = document.createElement('span'); tx.textContent = text;
    li.append(ic, tx);
    ul.appendChild(li);
  }
  panel.appendChild(ul);

  const start = document.createElement('button');
  start.className = 'af-btn af-help-start';
  start.textContent = 'Start';
  start.onclick = () => overlay.remove();
  panel.appendChild(start);

  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
  host.appendChild(overlay);
  start.focus();
}

function toggleFullscreen(el: HTMLElement) {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else el.requestFullscreen?.().catch(() => {});
}
function showError(root: HTMLElement, headline: string, e: unknown) {
  const box = div('af-error');
  const h = document.createElement('h2'); h.textContent = headline; box.appendChild(h);
  const p = document.createElement('p'); p.textContent = e instanceof Error ? e.message : String(e); box.appendChild(p);
  const details = (e as { details?: string[] })?.details;
  if (Array.isArray(details) && details.length) {
    const ul = document.createElement('ul');
    details.forEach((d) => { const li = document.createElement('li'); li.textContent = d; ul.appendChild(li); });
    box.appendChild(ul);
  }
  root.replaceChildren(box);
}
