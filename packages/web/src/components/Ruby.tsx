/**
 * Renders Japanese text with furigana using <ruby> tags.
 * Input format: 漢字[かんじ]を勉強[べんきょう]する
 * Output: <ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>を<ruby>勉強<rp>(</rp><rt>べんきょう</rt><rp>)</rp></ruby>する
 */
export function Ruby({ text }: { text: string }) {
  // Match: one or more kanji/kanji-like chars followed by [reading]
  const regex = /([\u4E00-\u9FFF\u3400-\u4DBF]+)\[([^\]]+)\]/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      elements.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    // Ruby element
    elements.push(
      <ruby key={`r${match.index}`}>
        {match[1]}
        <rp>(</rp>
        <rt>{match[2]}</rt>
        <rp>)</rp>
      </ruby>
    );
    lastIndex = regex.lastIndex;
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    elements.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{elements}</>;
}
