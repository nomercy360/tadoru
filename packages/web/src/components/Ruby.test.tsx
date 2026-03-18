import { test, expect, describe } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Ruby } from "./Ruby";

function render(text: string): string {
  return renderToStaticMarkup(<Ruby text={text} />);
}

describe("Ruby", () => {
  test("plain text without furigana", () => {
    expect(render("これはテストです")).toBe(
      "<span>これはテストです</span>"
    );
  });

  test("single kanji with furigana", () => {
    expect(render("漢字[かんじ]")).toBe(
      "<ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>"
    );
  });

  test("mixed text and furigana", () => {
    const result = render("私[わたし]は学生[がくせい]です");
    expect(result).toContain("<ruby>私<rp>(</rp><rt>わたし</rt><rp>)</rp></ruby>");
    expect(result).toContain("は");
    expect(result).toContain("<ruby>学生<rp>(</rp><rt>がくせい</rt><rp>)</rp></ruby>");
    expect(result).toContain("です");
  });

  test("sentence ending with furigana", () => {
    const result = render("これは微妙[びみょう]");
    expect(result).toContain("これは");
    expect(result).toContain("<ruby>微妙<rp>(</rp><rt>びみょう</rt><rp>)</rp></ruby>");
  });

  test("sentence starting with plain text", () => {
    const result = render("あの人[ひと]は優[やさ]しい");
    expect(result).toContain("<ruby>人<rp>(</rp><rt>ひと</rt><rp>)</rp></ruby>");
    expect(result).toContain("<ruby>優<rp>(</rp><rt>やさ</rt><rp>)</rp></ruby>");
    expect(result).toContain("しい");
  });

  test("consecutive furigana words", () => {
    const result = render("東京[とうきょう]都[と]");
    expect(result).toContain("<ruby>東京<rp>(</rp><rt>とうきょう</rt><rp>)</rp></ruby>");
    expect(result).toContain("<ruby>都<rp>(</rp><rt>と</rt><rp>)</rp></ruby>");
  });

  test("katakana in furigana", () => {
    expect(render("煙草[タバコ]")).toBe(
      "<ruby>煙草<rp>(</rp><rt>タバコ</rt><rp>)</rp></ruby>"
    );
  });

  test("empty string", () => {
    expect(render("")).toBe("");
  });

  test("only brackets without kanji pattern treated as plain text", () => {
    // Standalone brackets that don't match the pattern
    const result = render("テスト");
    expect(result).toBe("<span>テスト</span>");
  });

  test("full realistic sentence", () => {
    const result = render("彼[かれ]の反応[はんのう]は微妙[びみょう]だった。");
    expect(result).toContain("<ruby>彼<rp>(</rp><rt>かれ</rt><rp>)</rp></ruby>");
    expect(result).toContain("<ruby>反応<rp>(</rp><rt>はんのう</rt><rp>)</rp></ruby>");
    expect(result).toContain("<ruby>微妙<rp>(</rp><rt>びみょう</rt><rp>)</rp></ruby>");
    expect(result).toContain("の");
    expect(result).toContain("は");
    expect(result).toContain("だった。");
  });
});
