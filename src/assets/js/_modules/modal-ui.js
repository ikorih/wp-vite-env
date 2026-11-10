'use strict';

/**
 * ModalUI — [data-modal] トリガーで開く汎用モーダル（<dialog> ベース）
 *
 * 使い方（HTML 側）:
 *   <a href="https://www.youtube.com/watch?v=XXXX"
 *      data-modal="youtube"
 *      data-modal-title="動画タイトル">…</a>
 *
 *   data-modal          … コンテンツ種別: youtube | vimeo | video | image | inline
 *   src の解決順          … data-modal-src → <a> の href
 *   data-modal-title     … アクセシビリティ用ラベル（aria-label）
 *   data-modal-loop      … "true" で YouTube をループ再生
 *   data-modal-size      … 幅: s | m | l（未指定は動画向けワイド）
 *   （inline の場合）src にセレクタ（例: "#foo"）を渡すとその実要素を表示
 *
 * 特徴:
 *   - dialog.showModal() によりフォーカストラップ・背面 inert・Esc 閉じをネイティブ処理
 *   - YouTube/Vimeo/video はモーダルを開くと自動再生（クリックのユーザー操作を継承）
 *   - inline は「複製」ではなく実 DOM を一時移動し、閉じたら元位置へ戻す
 *     （id 重複やイベントリスナー喪失を避けるため。フォーム等もそのまま動作）
 *   - 閉じるとメディアを破棄して再生停止・トリガーへフォーカス返し
 *   - backdrop クリックで閉じる
 *   - Lenis を渡すと開閉に合わせて stop()/start()
 */
export default class ModalUI {
  constructor(options = {}) {
    const {
      triggerSelector = '[data-modal]',
      openClass = 'is-modal-open',
      lenis = null,
    } = options;

    this.triggerSelector = triggerSelector;
    this.openClass = openClass;
    this.lenis = lenis;

    this.dialog = null;
    this.body = null;
    this.lastFocused = null;

    // inline 表示中の実要素を元位置へ戻すための退避情報
    this.inlineSource = null;
    this.inlinePlaceholder = null;
    this.inlineWasHidden = false;

    this._handleTriggerClick = this._handleTriggerClick.bind(this);
    this._handleDialogClick = this._handleDialogClick.bind(this);
    this._handleClose = this._handleClose.bind(this);

    this._init();
  }

  /* =========================
   * init
   * ========================= */
  _init() {
    // <dialog> がサポート外の環境では素のリンク遷移に任せる
    if (typeof HTMLDialogElement === 'undefined') {
      return;
    }

    this._buildDialog();

    // トリガーはデリゲートで拾う（動的追加にも対応）
    document.addEventListener('click', this._handleTriggerClick);
  }

  _buildDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'c-modal';
    dialog.setAttribute('aria-modal', 'true');

    const inner = document.createElement('div');
    inner.className = 'c-modal__inner';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'c-modal__close';
    closeBtn.setAttribute('aria-label', '閉じる');
    closeBtn.addEventListener('click', () => this.close());

    const body = document.createElement('div');
    body.className = 'c-modal__body';

    inner.append(closeBtn, body);
    dialog.append(inner);
    document.body.append(dialog);

    // backdrop（dialog 自身）クリックで閉じる
    dialog.addEventListener('click', this._handleDialogClick);
    // 閉じたときの後始末（Esc・close()・backdrop すべてここに集約）
    dialog.addEventListener('close', this._handleClose);

    this.dialog = dialog;
    this.body = body;
  }

  /* =========================
   * トリガー
   * ========================= */
  _handleTriggerClick(e) {
    const trigger = e.target.closest(this.triggerSelector);
    if (!trigger) {
      return;
    }
    // モーダル内の要素は対象外
    if (this.dialog && this.dialog.contains(trigger)) {
      return;
    }

    e.preventDefault();
    this.open(trigger);
  }

  /* =========================
   * open / close
   * ========================= */
  open(trigger) {
    if (!this.dialog) {
      return;
    }

    const type = (trigger.dataset.modal || '').toLowerCase();
    const src = trigger.dataset.modalSrc || trigger.getAttribute('href') || '';
    const title = trigger.dataset.modalTitle || '';
    const loop = trigger.dataset.modalLoop === 'true';
    const size = (trigger.dataset.modalSize || '').toLowerCase();

    const content = this._createContent({ type, src, title, loop });
    if (!content) {
      // 生成できなければ通常遷移にフォールバック
      if (src) {
        window.location.href = src;
      }
      return;
    }

    this.lastFocused = document.activeElement;

    this.body.replaceChildren(content);

    // 幅バリエーション
    this.dialog.classList.remove('-size-s', '-size-m', '-size-l');
    if (size === 's' || size === 'm' || size === 'l') {
      this.dialog.classList.add(`-size-${size}`);
    }

    if (title) {
      this.dialog.setAttribute('aria-label', title);
    } else {
      this.dialog.removeAttribute('aria-label');
    }

    document.documentElement.classList.add(this.openClass);
    if (this.lenis && typeof this.lenis.stop === 'function') {
      this.lenis.stop();
    }

    this.dialog.showModal();
  }

  close() {
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
  }

  /* =========================
   * close 後始末
   * ========================= */
  _handleClose() {
    // inline で借用した実要素を元位置へ戻す（body クリアより前に実施）
    this._restoreInline();

    // メディアを破棄して再生停止
    this.body.replaceChildren();

    document.documentElement.classList.remove(this.openClass);
    if (this.lenis && typeof this.lenis.start === 'function') {
      this.lenis.start();
    }

    // トリガーへフォーカス返し
    if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
      this.lastFocused.focus();
    }
    this.lastFocused = null;
  }

  _handleDialogClick(e) {
    // dialog 直下（= backdrop 領域）のクリックのみ閉じる
    if (e.target === this.dialog) {
      this.close();
    }
  }

  /* =========================
   * コンテンツ生成
   * ========================= */
  _createContent({ type, src, title, loop }) {
    switch (type) {
      case 'youtube':
        return this._createIframeMedia(this._youtubeEmbedUrl(src, loop), title);
      case 'vimeo':
        return this._createIframeMedia(this._vimeoEmbedUrl(src), title);
      case 'video':
        return this._createVideoMedia(src);
      case 'image':
        return this._createImage(src, title);
      case 'inline':
        return this._createInline(src);
      default:
        return null;
    }
  }

  _createIframeMedia(embedUrl, title) {
    if (!embedUrl) {
      return null;
    }
    const wrap = document.createElement('div');
    wrap.className = 'c-modal__media';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = title || '動画プレーヤー';
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'eager');

    wrap.append(iframe);
    return wrap;
  }

  _createVideoMedia(src) {
    if (!src) {
      return null;
    }
    const wrap = document.createElement('div');
    wrap.className = 'c-modal__media';

    const video = document.createElement('video');
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;

    wrap.append(video);
    return wrap;
  }

  _createImage(src, title) {
    if (!src) {
      return null;
    }
    const img = document.createElement('img');
    img.className = 'c-modal__img';
    img.src = src;
    img.alt = title || '';
    return img;
  }

  _createInline(selector) {
    if (!selector) {
      return null;
    }
    const source = document.querySelector(selector);
    if (!source) {
      return null;
    }

    // 実要素を借用。元位置にプレースホルダを残し、閉じたら戻す
    this.inlineSource = source;
    this.inlinePlaceholder = document.createComment('c-modal:inline');
    this.inlineWasHidden = source.hidden;
    source.parentNode.insertBefore(this.inlinePlaceholder, source);
    source.hidden = false;

    const content = document.createElement('div');
    content.className = 'c-modal__content';
    content.append(source);
    return content;
  }

  _restoreInline() {
    if (!this.inlineSource || !this.inlinePlaceholder || !this.inlinePlaceholder.parentNode) {
      this.inlineSource = null;
      this.inlinePlaceholder = null;
      return;
    }
    this.inlineSource.hidden = this.inlineWasHidden;
    this.inlinePlaceholder.parentNode.replaceChild(this.inlineSource, this.inlinePlaceholder);
    this.inlineSource = null;
    this.inlinePlaceholder = null;
  }

  /* =========================
   * 埋め込み URL 生成
   * ========================= */
  _youtubeEmbedUrl(url, loop) {
    const id = this._parseYouTubeId(url);
    if (!id) {
      return null;
    }
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      playsinline: '1',
    });
    if (loop) {
      params.set('loop', '1');
      params.set('playlist', id); // 単一動画のループには playlist=自身 が必要
    }
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }

  _parseYouTubeId(url) {
    if (!url) {
      return null;
    }
    const patterns = [
      /[?&]v=([^&#/]+)/, // watch?v=ID
      /youtu\.be\/([^?&#/]+)/, // youtu.be/ID
      /\/embed\/([^?&#/]+)/, // /embed/ID
      /\/shorts\/([^?&#/]+)/, // /shorts/ID
    ];
    for (const re of patterns) {
      const m = url.match(re);
      if (m && m[1]) {
        return m[1];
      }
    }
    return null;
  }

  _vimeoEmbedUrl(url) {
    if (!url) {
      return null;
    }
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (!m) {
      return null;
    }
    const params = new URLSearchParams({ autoplay: '1', playsinline: '1' });
    return `https://player.vimeo.com/video/${m[1]}?${params.toString()}`;
  }
}
