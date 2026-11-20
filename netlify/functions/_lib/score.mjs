/* ==========================================================================
   score.mjs — Haber öncelik puanı (100 üzerinden)
   --------------------------------------------------------------------------
   Ağırlıklar: güncellik 25, kaynak güvenilirliği 25, haber önemi 20,
   farklı kaynaklarla desteklenme 15, özgünlük 15.

   ÖNEMLİ: Bu puan yalnızca sıralama içindir. Bir haberin doğruluğunu
   kanıtlamaz ve bu aşamada hiçbir haberi otomatik yayınlamaz.
   ========================================================================== */

import { foldTurkish } from "./text.mjs";

export const SCORE_WEIGHTS = Object.freeze({
  freshness: 25,
  reliability: 25,
  importance: 20,
  support: 15,
  originality: 15
});

const IMPORTANCE_CUES = {
  breaking: ["son dakika", "flas haber", "breaking", "just in", "acil"],
  major: [
    "deprem", "savas", "ateskes", "saldiri", "patlama", "olu", "kriz", "afet",
    "darbe", "suikast", "kacirilma", "yangin", "sel", "firtina", "ambargo",
    "yaptirim", "olaganustu", "acil durum", "war", "attack", "earthquake", "crisis"
  ],
  notable: [
    "karar", "aciklama", "anlasma", "antlasma", "rekor", "ilk kez", "yeni",
    "istifa", "atama", "secim", "rapor", "arastirma", "bulus", "yasa", "reform",
    "deal", "agreement", "record", "first", "report", "study", "launch"
  ]
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function freshnessPoints(publishedAt, now = Date.now()) {
  if (!publishedAt) {
    return 0;
  }
  const time = new Date(publishedAt).getTime();
  if (Number.isNaN(time)) {
    return 0;
  }
  const hours = Math.max(0, (now - time) / (1000 * 60 * 60));
  return round(SCORE_WEIGHTS.freshness * Math.max(0, 1 - hours / 72));
}

export function reliabilityPoints(reliabilityScore) {
  const score = clamp(Number(reliabilityScore) || 0, 0, 100);
  return round((score / 100) * SCORE_WEIGHTS.reliability);
}

export function importancePoints({ title = "", description = "" } = {}) {
  const text = ` ${foldTurkish(title)} ${foldTurkish(description)} `;
  let points = 5;

  if (IMPORTANCE_CUES.breaking.some((cue) => text.includes(cue))) {
    points += 5;
  }
  if (IMPORTANCE_CUES.major.some((cue) => text.includes(cue))) {
    points += 4;
  }
  if (IMPORTANCE_CUES.notable.some((cue) => text.includes(cue))) {
    points += 2;
  }
  if (/\d+\s*%|\d{2,}/.test(text)) {
    points += 1.5;
  }
  if (description.length >= 160) {
    points += 2;
  }
  if (title.length >= 30 && title.length <= 130) {
    points += 1.5;
  }

  return round(clamp(points, 0, SCORE_WEIGHTS.importance));
}

export function supportPoints(sourceCount) {
  const count = Math.max(1, Number(sourceCount) || 1);
  return round(clamp((count - 1) / 3, 0, 1) * SCORE_WEIGHTS.support);
}

export function originalityPoints(duplicateSimilarity = 0) {
  const similarity = clamp(Number(duplicateSimilarity) || 0, 0, 1);
  return round((1 - similarity) * SCORE_WEIGHTS.originality);
}

/**
 * Haber puanını hesaplar.
 * @param {{title?: string, description?: string, publishedAt?: string,
 *          sourceReliability?: number, supportCount?: number,
 *          duplicateSimilarity?: number, now?: number}} input
 */
export function scoreArticle(input = {}) {
  const breakdown = {
    freshness: freshnessPoints(input.publishedAt, input.now || Date.now()),
    reliability: reliabilityPoints(input.sourceReliability ?? 70),
    importance: importancePoints({
      title: input.title || "",
      description: input.description || ""
    }),
    support: supportPoints(input.supportCount ?? 1),
    originality: originalityPoints(input.duplicateSimilarity ?? 0)
  };

  const total = round(
    clamp(
      breakdown.freshness +
        breakdown.reliability +
        breakdown.importance +
        breakdown.support +
        breakdown.originality,
      0,
      100
    )
  );

  return {
    total,
    breakdown,
    weights: SCORE_WEIGHTS,
    note: "Puan yalnızca sıralama içindir; doğruluk kanıtı değildir."
  };
}
