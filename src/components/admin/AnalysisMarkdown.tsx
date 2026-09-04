// Letvægts-renderer til analysetekstens markdown (overskrifter, punkter, fed skrift).
// Vi undgår råtegn som ## og ** i visningen.

function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{p}</span>
    ),
  );
}

export default function AnalysisMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: JSX.Element[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, i) => (
      <li key={i} className="text-sm leading-relaxed text-foreground">
        {inline(it, `li-${blocks.length}-${i}`)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`l${blocks.length}`} className="mt-2 list-decimal space-y-2 pl-5 marker:text-amber-500">
          {items}
        </ol>
      ) : (
        <ul key={`l${blocks.length}`} className="mt-2 list-disc space-y-2 pl-5 marker:text-amber-500">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      flush();
      return;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push(
        <h4 key={`h${blocks.length}`} className="mt-5 text-sm font-bold uppercase tracking-wide text-amber-500">
          {heading[2]}
        </h4>,
      );
      return;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      return;
    }
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
      return;
    }
    flush();
    blocks.push(
      <p key={`p${blocks.length}`} className="mt-2 text-sm leading-relaxed text-foreground">
        {inline(line, `p${blocks.length}`)}
      </p>,
    );
  });
  flush();

  return <div>{blocks}</div>;
}
