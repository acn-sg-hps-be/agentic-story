/**
 * runner.ts — drives one plot as a sequence of "beats".
 *
 * Each plot step expands into beats so the presentation reads like slides:
 *   • an ACTION beat first — highlight the station / move the object, popup CLOSED;
 *   • then one POPUP beat per agent (or the input/output popup), shown one at a
 *     time; advancing past the last one closes it and moves to the next step.
 *
 * Autoplay advances beats on each step's dwell; manual next/prev/reset walk beats.
 */

import type { Scenario, Plot, Step, ObjectStateSpec, StationNode, InputNode, OutputNode } from './types';
import type { SceneHandle } from './scene';

export type PopupRef =
  | { kind: 'input'; ref: string }
  | { kind: 'agent'; ref: string; agentIndex: number };

interface Beat { step: number; popup: PopupRef | null; }

export interface RunnerCallbacks {
  onStepChange?: (stepIndex: number, step: Step) => void;
  onPopup?: (popup: PopupRef | null) => void;
  onPlayState?: (playing: boolean) => void;
  onEnd?: () => void;
}

const DEFAULT_DWELL = 3000;

export class PlotRunner {
  private index = -1;
  private timer: number | null = null;
  private playing = false;
  private beats: Beat[] = [];
  private refKind = new Map<string, 'input' | 'station' | 'output'>();
  private inputById = new Map<string, InputNode>();
  private stationById = new Map<string, StationNode>();
  private outputById = new Map<string, OutputNode>();

  constructor(
    private scenario: Scenario,
    private plot: Plot,
    private scene: SceneHandle,
    private cb: RunnerCallbacks = {},
  ) {
    scenario.inputs.forEach((n) => { this.inputById.set(n.id, n); this.refKind.set(n.id, 'input'); });
    scenario.stations.forEach((n) => { this.stationById.set(n.id, n); this.refKind.set(n.id, 'station'); });
    scenario.outputs.forEach((n) => { this.outputById.set(n.id, n); this.refKind.set(n.id, 'output'); });
    this.beats = this.buildBeats();
  }

  get currentIndex() { return this.index; }
  get length() { return this.beats.length; }
  get isPlaying() { return this.playing; }

  start() { this.goTo(0); this.play(); }

  play() {
    if (this.playing) return;
    if (this.index < 0) this.goTo(0);
    this.playing = true;
    this.cb.onPlayState?.(true);
    this.scheduleNext();
  }

  pause() {
    this.playing = false;
    this.clearTimer();
    this.cb.onPlayState?.(false);
  }

  toggle() { this.playing ? this.pause() : this.play(); }
  reset() { this.pause(); this.goTo(0); }

  next() { if (this.index < this.length - 1) this.goTo(this.index + 1); else this.cb.onEnd?.(); }
  prev() { if (this.index > 0) this.goTo(this.index - 1); }

  goTo(i: number) {
    this.clearTimer();
    this.index = Math.max(0, Math.min(this.length - 1, i));
    this.apply(this.index);
    if (this.playing) this.scheduleNext();
  }

  destroy() { this.clearTimer(); }

  private buildBeats(): Beat[] {
    const beats: Beat[] = [];
    this.plot.steps.forEach((s, si) => {
      const kind = this.refKind.get(s.ref);
      beats.push({ step: si, popup: null }); // action beat (highlight / move; popup closed)
      if (s.type === 'input-appear' && kind === 'input') {
        beats.push({ step: si, popup: { kind: 'input', ref: s.ref } });
      } else if ((s.type === 'move-to' || s.type === 'process') && kind === 'station') {
        const st = this.stationById.get(s.ref);
        (st?.agents ?? []).forEach((_, ai) => beats.push({ step: si, popup: { kind: 'agent', ref: s.ref, agentIndex: ai } }));
      }
      // output-emit has only its action beat: the object exits + the final
      // caption summarises it. No popup (outputs are covered per-agent).
    });
    return beats;
  }

  private scheduleNext() {
    this.clearTimer();
    const step = this.plot.steps[this.beats[this.index]?.step];
    const dwell = step && step.dwell > 0 ? step.dwell : DEFAULT_DWELL;
    this.timer = window.setTimeout(() => {
      if (this.index < this.length - 1) this.goTo(this.index + 1);
      else { this.pause(); this.cb.onEnd?.(); }
    }, dwell);
  }

  private clearTimer() { if (this.timer != null) { clearTimeout(this.timer); this.timer = null; } }

  private stateAtStep(i: number): ObjectStateSpec | null {
    let state: ObjectStateSpec | null = null;
    for (let j = 0; j <= i; j++) {
      const s = this.plot.steps[j];
      const kind = this.refKind.get(s.ref);
      if (s.type === 'input-appear' && kind === 'input') {
        state = this.scenario.objectStates[this.inputById.get(s.ref)!.startsAs] ?? state;
      } else if ((s.type === 'move-to' || s.type === 'process') && kind === 'station') {
        const st = this.stationById.get(s.ref)!;
        state = this.scenario.objectStates[s.transformTo ?? st.transformTo] ?? state;
      } else if (s.type === 'output-emit' && kind === 'output') {
        state = this.scenario.objectStates[this.outputById.get(s.ref)!.fromState] ?? state;
      }
    }
    return state;
  }

  /** Scene changes for a plot step (object move/morph, station highlight, persona). */
  private applyScene(stepIndex: number) {
    const step = this.plot.steps[stepIndex];
    const state = this.stateAtStep(stepIndex) ?? { base: 'card' };
    switch (step.type) {
      case 'actor-intro':
        this.scene.object.hide();
        this.scene.showPersona(step.ref);
        this.scene.setActive(null);
        break;
      case 'input-appear':
        this.scene.showPersona(null);
        this.scene.object.setStart(state);
        this.scene.setActive(null);
        break;
      case 'move-to':
      case 'process':
        this.scene.showPersona(null);
        this.scene.object.toNode(step.ref, state);
        this.scene.setActive(step.ref);
        break;
      case 'output-emit':
        this.scene.showPersona(null);
        this.scene.object.toEnd(state);
        this.scene.setActive(null);
        break;
    }
  }

  private apply(i: number) {
    const beat = this.beats[i];
    const stepStart = i === 0 || this.beats[i - 1].step !== beat.step;
    if (stepStart) {
      this.applyScene(beat.step);
      this.cb.onStepChange?.(beat.step, this.plot.steps[beat.step]);
    }
    this.cb.onPopup?.(beat.popup);
  }
}
