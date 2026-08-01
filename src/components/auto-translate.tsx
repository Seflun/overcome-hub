import { useEffect, useRef } from "react";

import { useStore } from "@/lib/store";
import { translateBatch } from "@/utils/translate.functions";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "CODE",
  "PRE",
  "SVG",
  "PATH",
]);

const HAS_LETTER = /\p{L}{2,}/u;
const RTL = new Set(["ar", "he", "fa", "ur"]);

function cacheKey(lang: string) {
  return `addiblock.i18n.${lang}`;
}

function loadCache(lang: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(lang)) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function saveCache(lang: string, cache: Record<string, string>) {
  try {
    localStorage.setItem(cacheKey(lang), JSON.stringify(cache));
  } catch {
    /* quota — ignore */
  }
}

function collect(): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      const value = node.nodeValue ?? "";
      if (value.trim().length < 2 || !HAS_LETTER.test(value)) return NodeFilter.FILTER_REJECT;
      if (value.trim().length > 300) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let current = walker.nextNode();
  while (current) {
    out.push(current as Text);
    current = walker.nextNode();
  }
  return out;
}

/**
 * Machine-translates the rendered UI into the language the user picked at sign-up.
 * Translations are cached in localStorage so each phrase is only translated once.
 */
export function AutoTranslate() {
  const { state } = useStore();
  const lang = state.profile.language || "en";
  const originals = useRef(new WeakMap<Text, string>());
  const running = useRef(false);
  const langRef = useRef(lang);

  useEffect(() => {
    langRef.current = lang;
    if (typeof document === "undefined") return;

    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.has(lang) ? "rtl" : "ltr";

    if (lang === "en") {
      // Restore any previously translated nodes.
      for (const node of collect()) {
        const original = originals.current.get(node);
        if (original && node.nodeValue !== original) node.nodeValue = original;
      }
      return;
    }

    let disposed = false;

    const run = async () => {
      if (running.current || disposed) return;
      running.current = true;
      try {
        const activeLang = langRef.current;
        const cache = loadCache(activeLang);
        const nodes = collect();
        const missing = new Set<string>();

        for (const node of nodes) {
          const original = originals.current.get(node) ?? node.nodeValue ?? "";
          originals.current.set(node, original);
          const key = original.trim();
          const hit = cache[key];
          if (hit) {
            const next = (node.nodeValue ?? "").replace(key, hit);
            if (node.nodeValue !== next) node.nodeValue = next;
          } else if (missing.size < 240) {
            missing.add(key);
          }
        }

        const pending = [...missing];
        let changed = false;
        for (let i = 0; i < pending.length; i += 40) {
          if (disposed || langRef.current !== activeLang) break;
          const chunk = pending.slice(i, i + 40);
          try {
            const result = await translateBatch({ data: { language: activeLang, texts: chunk } });
            if ("error" in result) break;
            chunk.forEach((source, idx) => {
              const translated = result.texts[idx];
              if (translated && translated !== source) {
                cache[source] = translated;
                changed = true;
              }
            });
          } catch {
            break;
          }
        }

        if (changed) {
          saveCache(activeLang, cache);
          for (const node of collect()) {
            const original = originals.current.get(node) ?? node.nodeValue ?? "";
            originals.current.set(node, original);
            const hit = cache[original.trim()];
            if (hit) {
              const next = (node.nodeValue ?? "").replace(original.trim(), hit);
              if (node.nodeValue !== next) node.nodeValue = next;
            }
          }
        }
      } finally {
        running.current = false;
      }
    };

    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, 500);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      disposed = true;
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [lang]);

  return null;
}
