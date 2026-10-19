import { dateLabel, type SourceReceipt } from './data';

const needsAttention = (source: SourceReceipt) => source.status === 'Past limit' || source.status === 'Unchecked';

// On phones the receipt opens on the sources that need attention (at least
// three rows) and a CSS-only toggle reveals the rest; wider screens always
// show every row. One table keeps a single accessible receipt.
const MOBILE_MIN_ROWS = 3;

export function Sources({ sources, checkedAt }: { sources: SourceReceipt[]; checkedAt: string }) {
  const attention = sources.filter(needsAttention);
  const shownOnPhone = new Set(attention.map(source => source.key));
  for (const source of sources) {
    if (shownOnPhone.size >= MOBILE_MIN_ROWS) break;
    shownOnPhone.add(source.key);
  }
  const hiddenOnPhone = sources.length - shownOnPhone.size;
  return <section aria-labelledby="sources-heading" className="grid min-w-0 gap-7 border-t border-rule py-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
    <div><h2 id="sources-heading" className="text-3xl font-bold leading-tight tracking-tight">Every rank shows its sources and their age.</h2><p className="mt-3 max-w-[46ch] text-sm leading-6 text-ink-2">The feed carries a receipt for each public source, with the date it was retrieved and how old it is allowed to get. Sources past their limits need a fresh check.</p><p className="mt-3 font-mono text-xs leading-5 text-ink-3">Ages as of {dateLabel(checkedAt)} (UTC), counted from each source&apos;s retrieval date. Receipt ages are used when retrieval dates are missing.</p></div>
    {sources.length ? <div className="group/sources min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">
        <caption className="sr-only">Public source freshness receipt</caption>
        <thead className="border-b border-ink font-cond text-ink-3"><tr>{['Source', 'Used for', 'Age', 'Limit', 'Status'].map((heading, i) => <th key={heading} scope="col" className={`pb-2 pr-3 font-semibold ${i === 2 || i === 3 ? 'text-right' : ''} ${i === 1 ? 'hidden sm:table-cell' : ''}`}>{heading}</th>)}</tr></thead>
        <tbody>{sources.map(source => <tr key={source.key} className={`border-b border-rule align-top ${shownOnPhone.has(source.key) ? '' : 'hidden group-has-[:checked]/sources:table-row sm:table-row'}`}><th scope="row" className="py-2 pr-3 font-normal">{source.source}<span className="mt-1 hidden font-mono text-[11px] text-ink-3 sm:block">{source.retrievedAt ? `Retrieved ${dateLabel(source.retrievedAt)}` : 'Retrieval date unavailable'}</span></th><td className="hidden py-2 pr-3 text-ink-2 sm:table-cell">{source.usedFor}</td><td className="ws-tabular whitespace-nowrap py-2 pr-3 text-right font-mono">{source.ageDays === null ? 'N/A' : `${source.ageDays.toFixed(1)} d`}</td><td className="ws-tabular whitespace-nowrap py-2 pr-3 text-right font-mono">{source.limitDays === null ? 'N/A' : `${source.limitDays} d`}</td><td className={`whitespace-nowrap py-2 ${needsAttention(source) ? 'font-medium text-stale' : 'text-ink-2'}`}>{source.status}</td></tr>)}</tbody>
      </table>
      {hiddenOnPhone > 0 && <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-select underline decoration-select/40 underline-offset-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-select sm:hidden">
        <input type="checkbox" className="sr-only" />
        <span className="group-has-[:checked]/sources:hidden">Show all {sources.length} sources</span>
        <span className="hidden group-has-[:checked]/sources:inline">Show only sources that need attention</span>
      </label>}
    </div> : <p className="text-sm leading-6 text-ink-3">The public source receipt is temporarily unavailable. Check source dates in the parcel workspace before using its records.</p>}
  </section>;
}
