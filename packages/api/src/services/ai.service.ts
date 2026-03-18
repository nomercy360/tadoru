import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { EnrichmentResult } from "@tadoru/core";
import { enrichWordMock } from "./ai.service.mock";

const enrichmentSchema = z.object({
  card: z.object({
    reading: z.string().describe("Hiragana/katakana reading of the word"),
    meanings: z.array(z.string()).describe("1-2 concise English meanings. Only include a second meaning if the word has a distinctly different implied or secondary meaning."),
    exampleSentence: z.string().describe("Natural Japanese example sentence with furigana in bracket notation: 漢字[かんじ]. Every kanji word must have furigana. Example: 彼[かれ]の反応[はんのう]は微妙[びみょう]だった。"),
    notes: z.string().nullable().describe("Grammar notes, usage notes, or etymology if relevant"),
    nodeType: z.enum(["word", "grammar", "kanji", "root"]).describe("What type of language element this is"),
  }),
  connections: z.array(z.object({
    surface: z.string().describe("The connected word/pattern surface form"),
    reading: z.string().describe("Reading in hiragana"),
    meanings: z.array(z.string()).describe("Brief meanings"),
    edgeType: z.enum([
      "shares_kanji", "derived_from", "etymology",
      "grammar_uses", "co_occurs", "semantic_similar", "antonym",
    ]).describe("Type of connection"),
    weight: z.number().describe("Connection strength 0-1, e.g. 1.0 = direct etymology, 0.8 = shares kanji, 0.5 = semantic, 0.3 = co-occurrence"),
  })),
});

/**
 * Enrich a word/phrase with AI — generates reading, meanings, example,
 * notes, and suggested connections to other words.
 */
export async function enrichWord(surface: string): Promise<EnrichmentResult> {
  if (process.env.USE_MOCK_AI === "true") {
    return enrichWordMock(surface);
  }

  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-5"),
    output: Output.object({ schema: enrichmentSchema }),
    prompt: `You are a Japanese language expert helping build a knowledge graph for a learner.

Given the Japanese word/phrase: "${surface}"

1. Provide the reading (hiragana), 1-2 concise English meanings (only add a second if the word has a distinctly different implied meaning), a natural example sentence, and any relevant notes about usage/etymology.
2. Suggest 3-8 connected words/patterns that share kanji, have etymological relationships, commonly co-occur, or are semantically related. Prioritize connections that help a learner understand this word better.

For grammar patterns (like にもかかわらず), trace the etymology back to the source verb/word and include that chain.
For kanji, include common words that use this kanji.
For words, include words sharing the same kanji, related grammar patterns, and synonyms/antonyms.

Rate connection strength: 1.0 = direct etymological derivation, 0.8 = shares kanji, 0.5 = semantic similarity, 0.3 = co-occurrence.`,
  });

  if (!output) {
    throw new Error("AI enrichment returned no output");
  }

  return output as EnrichmentResult;
}
