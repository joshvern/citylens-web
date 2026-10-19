import type { Metadata } from 'next';
import Link from 'next/link';
import { demoId, previewDemo } from '@/components/FeaturedDemoCards';
import { CaseFile } from '@/components/home/CaseFile';
import { HomeEvidence } from '@/components/home/Evidence';
import { Sources } from '@/components/home/Sources';
import { dateLabel, finite, receipts } from '@/components/home/data';
import { fetchFeaturedDemosOnServer, fetchHomeParcelDataOnServer, fetchHomeRunSummaryOnServer } from '@/lib/api.server';

export const metadata: Metadata = { alternates: { canonical: '/' } };
// Regenerate at most once a minute (as before the redesign). Source ages are in
// days, so a page up to 60 seconds old still reports them correctly.
export const revalidate = 60;

export default async function HomePage() {
  const featuredPromise = fetchFeaturedDemosOnServer();
  const summaryPromise = featuredPromise.then(featured => {
    const demo = previewDemo(featured);
    return demo ? fetchHomeRunSummaryOnServer(demoId(demo)!) : null;
  });
  const [featured, parcel, summary] = await Promise.all([featuredPromise, fetchHomeParcelDataOnServer(), summaryPromise]);
  const checkedAt = new Date().toISOString();
  const sources = receipts(parcel.index, Date.parse(checkedAt));
  const checked = sources.filter(source => source.status !== 'Not applicable');
  const past = checked.filter(source => source.status === 'Past limit');
  const unchecked = checked.filter(source => source.status === 'Unchecked');
  const gateCount = parcel.index?.quality_gate?.citywide_acquisition_eligible_count;
  const boroughCount = parcel.index?.boroughs?.length ? parcel.index.boroughs.reduce((sum, borough) => sum + borough.count, 0) : null;
  const total = finite(gateCount) ? gateCount : boroughCount;
  const inventory = parcel.inventory;
  const count = (n: number) => n.toLocaleString('en-US');
  const stale = past.length + unchecked.length;
  return <div className="bg-paper text-ink">
    <div aria-label="Feed dateline" data-testid="home-feed-dateline" className="border-b border-rule bg-paper-2">
      <p className="ws-tabular mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-1 px-4 py-2 text-[13px] leading-5 text-ink-2">
        <span>Feed of <b className="font-semibold text-ink">{dateLabel(parcel.index?.generated_at)}</b></span>
        <span>{total !== null ? `${count(total)} ranked parcels` : 'Ranked-parcel count unavailable'}</span>
        <span>{checked.length ? `${checked.length} public sources` : 'Source receipt unavailable'}</span>
        {stale > 0 && <a href="#sources-heading" className="text-stale underline decoration-stale/40 underline-offset-2 hover:decoration-stale">{past.length ? `${past.length} past ${past.length === 1 ? 'its' : 'their'} freshness limit` : ''}{past.length && unchecked.length ? ', ' : ''}{unchecked.length ? `${unchecked.length} unchecked` : ''}</a>}
      </p>
    </div>
    <div className="mx-auto max-w-6xl px-4 pb-6">
    <section className="pb-9 pt-10 lg:pb-12 lg:pt-14">
      <h1 className="text-[34px] font-extrabold leading-[1.03] tracking-[-0.03em] text-balance sm:text-[48px] lg:text-[60px]">Every tax lot in New York City, ranked for redevelopment.</h1>
      <div className="mt-6 grid gap-5 lg:mt-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
        <p className="max-w-[60ch] text-pretty text-base leading-7 text-ink-2 sm:text-lg sm:leading-8">CityLens ranks the city&apos;s lots on zoning headroom, ownership, sales and permit history, and shows the public records behind each rank.{parcel.lots.length ? ' Here is the current number one.' : ''}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:flex-col lg:items-start"><Link href="/parcel-intel" className="inline-flex min-h-11 items-center justify-center rounded-sm bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-2">Open the parcel map</Link><p className="max-w-[34ch] text-xs leading-5 text-ink-3">{inventory && finite(inventory.returned_count) && finite(inventory.available_count) ? `Public preview: ${count(inventory.returned_count)} of ${count(inventory.available_count)} ranked parcels, no account needed.` : 'Public preview available without an account. Live inventory counts are temporarily unavailable.'}</p></div>
      </div>
    </section>
    <CaseFile lots={parcel.lots} total={total ?? inventory?.available_count ?? null} sources={sources} />
    <HomeEvidence initialDemos={featured} initialSummary={summary}><Sources sources={sources} checkedAt={checkedAt} /></HomeEvidence>
    </div>

  </div>;
}
