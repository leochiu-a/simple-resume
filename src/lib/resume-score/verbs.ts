/**
 * The opening words that make a bullet read as work done rather than a duty
 * held. This is the one rule in the scorer that cannot be written as a shape
 * check, because "responsible for maintaining the build" and "rebuilt the build
 * pipeline" have the same length, the same clause count and the same
 * punctuation — the difference is entirely in the first word.
 *
 * A list, not a part-of-speech tagger. Tagging English in the browser means
 * shipping a model or a lexicon measured in megabytes, and it would still be
 * wrong about "Led" (noun? verb?) in the one position we care about. A closed
 * list of the verbs that actually open resume bullets is a few hundred bytes,
 * is auditable by the person reading it, and never fires on a word it has not
 * been told about — which is the failure direction we want. A miss costs the
 * writer a suggestion they can ignore; a false accusation costs their trust in
 * the whole panel.
 */
const EN_ACTION_VERBS = new Set([
  "accelerated",
  "achieved",
  "acquired",
  "adapted",
  "added",
  "addressed",
  "administered",
  "advised",
  "advocated",
  "analyzed",
  "analysed",
  "architected",
  "assembled",
  "assessed",
  "audited",
  "authored",
  "automated",
  "balanced",
  "benchmarked",
  "boosted",
  "broadened",
  "budgeted",
  "built",
  "championed",
  "changed",
  "coached",
  "collaborated",
  "compiled",
  "completed",
  "composed",
  "conceived",
  "conducted",
  "configured",
  "consolidated",
  "constructed",
  "consulted",
  "converted",
  "coordinated",
  "created",
  "cut",
  "debugged",
  "decreased",
  "defined",
  "delivered",
  "demonstrated",
  "deployed",
  "designed",
  "detected",
  "developed",
  "devised",
  "diagnosed",
  "directed",
  "documented",
  "doubled",
  "drafted",
  "drove",
  "earned",
  "eliminated",
  "enabled",
  "engineered",
  "enhanced",
  "established",
  "evaluated",
  "executed",
  "expanded",
  "expedited",
  "extended",
  "facilitated",
  "finalized",
  "finalised",
  "forecast",
  "formulated",
  "founded",
  "generated",
  "grew",
  "guided",
  "halved",
  "handled",
  "headed",
  "identified",
  "implemented",
  "improved",
  "increased",
  "initiated",
  "innovated",
  "instituted",
  "integrated",
  "introduced",
  "invented",
  "investigated",
  "launched",
  "led",
  "leveraged",
  "maintained",
  "managed",
  "mapped",
  "measured",
  "mentored",
  "merged",
  "migrated",
  "minimized",
  "minimised",
  "modeled",
  "modelled",
  "modernized",
  "modernised",
  "monitored",
  "negotiated",
  "optimized",
  "optimised",
  "orchestrated",
  "organized",
  "organised",
  "overhauled",
  "oversaw",
  "owned",
  "partnered",
  "performed",
  "pioneered",
  "planned",
  "presented",
  "prioritized",
  "prioritised",
  "produced",
  "programmed",
  "prototyped",
  "provided",
  "published",
  "raised",
  "rearchitected",
  "rebuilt",
  "recovered",
  "redesigned",
  "reduced",
  "refactored",
  "reorganized",
  "reorganised",
  "replaced",
  "researched",
  "resolved",
  "restored",
  "restructured",
  "revamped",
  "reviewed",
  "revised",
  "saved",
  "scaled",
  "scoped",
  "secured",
  "shipped",
  "simplified",
  "solved",
  "spearheaded",
  "specified",
  "standardized",
  "standardised",
  "streamlined",
  "strengthened",
  "supervised",
  "supported",
  "surveyed",
  "sustained",
  "tested",
  "tightened",
  "trained",
  "transformed",
  "translated",
  "tripled",
  "troubleshot",
  "tuned",
  "unified",
  "upgraded",
  "validated",
  "verified",
  "wrote",
]);

/**
 * The Chinese equivalent, and a different problem. Chinese is unsegmented, so
 * there is no "first word" to look up — but it also has no inflection, so the
 * verbs that open a resume line are a small, stable set of one- and two-character
 * words that can be matched as a prefix of the line directly.
 *
 * Ordered longest-first at match time, because 「重構」 and 「重」 both prefix the
 * same line and the two-character reading is the right one.
 */
const ZH_ACTION_VERBS = [
  "主導",
  "主辦",
  "主持",
  "帶領",
  "領導",
  "負責",
  "建立",
  "建置",
  "建構",
  "打造",
  "開發",
  "設計",
  "重構",
  "重寫",
  "改寫",
  "改善",
  "改進",
  "優化",
  "提升",
  "提高",
  "降低",
  "減少",
  "縮短",
  "加速",
  "整合",
  "串接",
  "導入",
  "引入",
  "推動",
  "推行",
  "實作",
  "實現",
  "實施",
  "完成",
  "交付",
  "上線",
  "發布",
  "維護",
  "管理",
  "規劃",
  "分析",
  "調校",
  "調整",
  "撰寫",
  "編寫",
  "制定",
  "訂定",
  "定義",
  "拆分",
  "重組",
  "統一",
  "標準化",
  "自動化",
  "監控",
  "測試",
  "驗證",
  "修復",
  "解決",
  "排除",
  "協助",
  "協作",
  "合作",
  "指導",
  "培訓",
  "教學",
  "評估",
  "研究",
  "探索",
  "支援",
  "擴充",
  "擴展",
  "遷移",
  "轉換",
  "汰換",
  "替換",
  "清理",
  "收斂",
];

/**
 * 「負責」 opens a line in the same grammatical slot as a real action verb but
 * describes a duty, not an outcome — the exact Chinese counterpart of
 * "Responsible for". It is in the list above so the line is not flagged twice
 * for the same clause, and named here so the panel can say the more useful
 * thing.
 */
const ZH_DUTY_OPENERS = ["負責", "參與", "協助處理", "從事"];

/** English openers that describe a duty rather than a result. */
const EN_DUTY_OPENERS = [
  "responsible for",
  "responsibilities included",
  "duties included",
  "worked on",
  "helped with",
  "assisted with",
  "involved in",
  "tasked with",
  "in charge of",
];

export type OpenerKind = "action" | "duty" | "other";

/** Strips the bullet glyphs and whitespace a writer may have typed themselves. */
const stripLeadingMarks = (line: string) => line.replace(/^[\s\-–—*•·・>]+/, "");

/**
 * What counts as Han, for both of the decisions that turn on it: which list
 * judges a line's opener, and whether a character is counted as half a word in
 * `countWords`. One definition because the two have to agree — a range added to
 * one and not the other would split them apart with nothing failing.
 *
 * Unified Ideographs and Extension A. Ext B and beyond are outside the BMP and
 * are Han to neither; a resume that needs them is not a case this scorer has met.
 */
export const HAN = /[一-鿿㐀-䶿]/;

/**
 * Whether a line is judged against the Chinese lists rather than the English ones.
 *
 * Read off the line's own opening word, never off the editor's locale. A locale
 * is a slot in the document; it says nothing about the script someone typed into
 * it. An English resume written while the editor sat on zh-Hant used to be
 * measured against the Chinese verb list, which no English word can prefix — so
 * every bullet came back flagged, a 100% hit rate that reads as the check being
 * broken rather than the resume being weak. Per line also means a document that
 * mixes the two is measured correctly line by line, which no document-level
 * language could manage.
 *
 * The opening word, not the whole line: 「導入 Kubernetes」 is Chinese and
 * "Led the 台北 rollout" is not, and only the opener decides this rule.
 */
export const opensWithHan = (line: string) => {
  const [first = ""] = stripLeadingMarks(line).trim().split(/\s+/);

  return HAN.test(first);
};

/**
 * Classifies how a single bullet opens.
 *
 * `duty` is checked before `action` in both languages: 「負責」 is in the action
 * list (it is a verb) and "worked on" starts with a listed verb in neither, but
 * a line that opens with a duty phrase should always report as a duty — that is
 * the finding with something to say.
 */
export const classifyOpener = (line: string): OpenerKind => {
  const text = stripLeadingMarks(line).trim();
  if (text === "") return "other";

  if (opensWithHan(text)) {
    if (ZH_DUTY_OPENERS.some((opener) => text.startsWith(opener))) return "duty";
    // Longest-first so 「標準化」 wins over a hypothetical shorter prefix.
    const matched = [...ZH_ACTION_VERBS]
      .sort((a, b) => b.length - a.length)
      .find((verb) => text.startsWith(verb));
    return matched ? "action" : "other";
  }

  const lower = text.toLowerCase();
  if (EN_DUTY_OPENERS.some((opener) => lower.startsWith(opener))) return "duty";

  // The first word, with any trailing punctuation removed. Apostrophes stay in
  // so "won't" is not read as "won".
  const [first = ""] = lower.split(/[\s,;:.]+/);
  return EN_ACTION_VERBS.has(first.replace(/[^a-z'-]/g, "")) ? "action" : "other";
};
