// 追加ライブラリなしの、ごく簡易的なMarkdown風レンダラー。
// 見出し(#, ##)・箇条書き(-)・太字(**)・段落だけに対応。

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function LegalDoc({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length > 0) {
      elements.push(
        <ol key={`list-${elements.length}`} className="ml-5 list-decimal space-y-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="text-sm text-[var(--ink-soft)]">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      listBuffer = [];
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={idx} className="font-display mt-8 text-xl text-[var(--ink)]">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={idx} className="font-display mt-2 text-3xl text-[var(--ink)]">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed === "---") {
      flushList();
      elements.push(<div key={idx} className="course-rule my-6" />);
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={idx} className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          {renderInline(trimmed)}
        </p>
      );
    }
  });
  flushList();

  return <>{elements}</>;
}
