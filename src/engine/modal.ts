/**
 * modal.ts — the clickable-node / clickable-agent popup: title, description and
 * one media slot (image OR video). Missing media shows a tasteful placeholder
 * rather than breaking. Opening a popup pauses autoplay (caller's concern).
 */

export interface PopupContent {
  title: string;
  subtitle?: string;
  description: string;
  /** optional "what it produces" line (green). */
  output?: string;
  /** optional "the input format" line (violet). */
  inputFormat?: string;
  /** resolved media URL, or null. */
  media: string | null;
}

export interface ModalController {
  /** Open the popup. stealFocus=false (auto-open during playback) leaves
   *  keyboard focus alone so transport shortcuts keep working. */
  open(content: PopupContent, stealFocus?: boolean): void;
  close(): void;
  readonly isOpen: boolean;
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

// A bundled CC0 sample video shown whenever a slot has no real media yet, so
// every popup is a playable video for testing. Replace media per node/agent.
const SAMPLE_VIDEO = 'sample.mp4';

export function createModal(host: HTMLElement, onClose?: () => void): ModalController {
  const overlay = document.createElement('div');
  overlay.className = 'af-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.hidden = true;

  const dialog = document.createElement('div');
  dialog.className = 'af-modal';
  overlay.appendChild(dialog);
  host.appendChild(overlay);

  let open = false;
  let lastFocus: HTMLElement | null = null;

  const controller: ModalController = {
    get isOpen() { return open; },
    open(content, stealFocus = true) {
      lastFocus = document.activeElement as HTMLElement;
      dialog.replaceChildren();

      const closeBtn = document.createElement('button');
      closeBtn.className = 'af-modal-close';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => controller.close());
      dialog.appendChild(closeBtn);

      const mediaBox = document.createElement('div');
      mediaBox.className = 'af-modal-media';
      mediaBox.appendChild(buildMedia(content.media));
      dialog.appendChild(mediaBox);

      const body = document.createElement('div');
      body.className = 'af-modal-body';
      if (content.subtitle) {
        const st = document.createElement('div');
        st.className = 'af-modal-sub';
        st.textContent = content.subtitle;
        body.appendChild(st);
      }
      const h = document.createElement('h2');
      h.textContent = content.title;
      body.appendChild(h);
      const p = document.createElement('p');
      p.textContent = content.description;
      body.appendChild(p);
      const labelledLine = (cls: string, label: string, value: string) => {
        const el = document.createElement('p');
        el.className = cls;
        const span = document.createElement('span');
        span.textContent = label;
        el.append(span, document.createTextNode(' ' + value));
        body.appendChild(el);
      };
      if (content.inputFormat) labelledLine('af-modal-input', 'Input', content.inputFormat);
      if (content.output) labelledLine('af-modal-output', 'Output', content.output);
      dialog.appendChild(body);

      overlay.hidden = false;
      open = true;
      if (stealFocus) closeBtn.focus();
    },
    close() {
      if (!open) return;
      // only restore focus if focus is currently inside the modal (i.e. it was
      // manually opened); auto-close during playback must not grab focus.
      const focusWasInside = overlay.contains(document.activeElement);
      overlay.hidden = true;
      open = false;
      dialog.replaceChildren();
      if (focusWasInside) lastFocus?.focus?.();
      onClose?.();
    },
  };

  overlay.addEventListener('click', (e) => { if (e.target === overlay) controller.close(); });
  document.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') controller.close(); });

  return controller;
}

function videoEl(src: string, onFail: () => HTMLElement): HTMLVideoElement {
  const v = document.createElement('video');
  v.src = src;
  // paused initially — plays only when the presenter clicks. Native controls
  // (incl. fullscreen) are used, so we add no custom expand button.
  v.controls = true; v.autoplay = false; v.loop = false; v.muted = false;
  v.playsInline = true; v.preload = 'metadata';
  v.onerror = () => v.replaceWith(onFail());
  return v;
}

function buildMedia(url: string | null): HTMLElement {
  // No real media yet → play the bundled sample video.
  if (!url) return videoEl(SAMPLE_VIDEO, () => placeholder('Media not attached'));
  if (VIDEO_EXT.test(url)) return videoEl(url, () => videoEl(SAMPLE_VIDEO, () => placeholder('Media not attached')));
  if (IMAGE_EXT.test(url)) {
    const img = document.createElement('img');
    img.src = url; img.alt = '';
    img.onerror = () => img.replaceWith(videoEl(SAMPLE_VIDEO, () => placeholder('Media not attached')));
    return img;
  }
  return videoEl(SAMPLE_VIDEO, () => placeholder('Unsupported media'));
}

function placeholder(label: string): HTMLElement {
  const ph = document.createElement('div');
  ph.className = 'af-modal-placeholder';
  ph.innerHTML =
    '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">' +
    '<rect x="8" y="14" width="48" height="36" rx="5" fill="none" stroke="currentColor" stroke-width="3"/>' +
    '<circle cx="24" cy="28" r="4" fill="currentColor"/>' +
    '<path d="M14 46 L28 34 L38 42 L46 34 L50 46 Z" fill="currentColor" opacity="0.5"/></svg>';
  const t = document.createElement('div');
  t.textContent = label;
  ph.appendChild(t);
  return ph;
}
