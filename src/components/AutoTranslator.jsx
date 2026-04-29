import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import autoMap from '@/lib/auto-translations.json';

/**
 * Runtime DOM walker that translates hardcoded Russian strings to KZ/EN.
 * Used as a fallback for components that don't yet use t() with i18n keys.
 *
 * Listens to language changes, walks text nodes + key attributes (placeholder,
 * title, aria-label, alt) under <body>, and swaps any exact match it finds in
 * auto-translations.json. Re-runs on DOM mutations so dynamically rendered
 * content also gets translated.
 */
export default function AutoTranslator() {
  const { lang } = useI18n();

  useEffect(() => {
    if (lang === 'ru') {
      // Restore original RU values from data attributes (set when we first translated)
      document.querySelectorAll('[data-i18n-orig]').forEach(el => {
        try {
          const orig = JSON.parse(el.dataset.i18nOrig);
          for (const [attr, value] of Object.entries(orig)) {
            if (attr === '__text') {
              if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
                el.firstChild.nodeValue = value;
              }
            } else {
              el.setAttribute(attr, value);
            }
          }
        } catch {}
      });
      return;
    }

    const map = autoMap[lang] || {};
    if (!Object.keys(map).length) return;

    const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

    const translateText = (node) => {
      const original = node.nodeValue;
      if (!original) return;
      const trimmed = original.trim();
      if (!trimmed) return;
      const tx = map[trimmed];
      if (tx && tx !== trimmed) {
        node.nodeValue = original.replace(trimmed, tx);
      }
    };

    const translateAttrs = (el) => {
      if (!(el instanceof HTMLElement)) return;
      const origStore = {};
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (!v) continue;
        const trimmed = v.trim();
        const tx = map[trimmed];
        if (tx && tx !== trimmed) {
          origStore[a] = v;
          el.setAttribute(a, v.replace(trimmed, tx));
        }
      }
      // Save original text content
      if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
        const txt = el.firstChild.nodeValue?.trim();
        if (txt && map[txt] && map[txt] !== txt) {
          origStore.__text = el.firstChild.nodeValue;
        }
      }
      if (Object.keys(origStore).length) {
        el.dataset.i18nOrig = JSON.stringify(origStore);
      }
    };

    const walk = (root) => {
      try {
        translateAttrs(root);
        const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let node;
        while ((node = tw.nextNode())) {
          if (node.nodeType === Node.TEXT_NODE) {
            const parent = node.parentElement;
            if (!parent) continue;
            // skip script/style/noscript
            const tag = parent.tagName;
            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE') continue;
            translateText(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateAttrs(node);
          }
        }
      } catch {}
    };

    walk(document.body);

    let raf = 0;
    const observer = new MutationObserver((mutations) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const m of mutations) {
          if (m.type === 'characterData') {
            translateText(m.target);
          } else if (m.type === 'childList') {
            for (const n of m.addedNodes) {
              if (n.nodeType === Node.ELEMENT_NODE) walk(n);
              else if (n.nodeType === Node.TEXT_NODE) translateText(n);
            }
          } else if (m.type === 'attributes') {
            translateAttrs(m.target);
          }
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [lang]);

  return null;
}
