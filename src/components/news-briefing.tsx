import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Shield, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  droneNewsItems,
  droneNewsMethodology,
  droneNewsUpdatedLabel,
  homepageNewsItems,
  newsItemsByRegion,
  newsRegions,
  type DroneNewsItem,
  type DroneNewsRegion,
} from "@/lib/news-data";
import { cn } from "@/lib/utils";

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const regionBadgeStyles: Record<DroneNewsRegion, string> = {
  EU: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  "United States": "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Canada: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const regionPanelStyles: Record<DroneNewsRegion, string> = {
  EU: "from-cyan-500/12 via-transparent to-transparent",
  "United States": "from-emerald-500/12 via-transparent to-transparent",
  Canada: "from-amber-500/12 via-transparent to-transparent",
};

const regionDescriptions: Record<DroneNewsRegion, string> = {
  EU: "Security policy and industrial operations are setting the tone, with counter-drone readiness and offshore workflows leading the strongest signals.",
  "United States": "The U.S. brief is led by delivery scale, healthcare logistics, public-safety deployment, and training infrastructure rather than final-rule certainty.",
  Canada: "Canada stands out for operator permissions and urban counter-drone capability, giving it one of the clearest North American operating stories.",
};

function formatStoryDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${monthLabels[Number(month) - 1]} ${Number(day)}, ${year}`;
}

function StoryMeta({ item }: { item: DroneNewsItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className={cn("border", regionBadgeStyles[item.region])}>
        {item.region}
      </Badge>
      <Badge variant="secondary" className="bg-background/70 text-foreground">
        {item.domain}
      </Badge>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {formatStoryDate(item.date)}
      </span>
      {item.placement === "homepage+news" ? (
        <Badge className="border border-primary/25 bg-primary/10 text-primary hover:bg-primary/10">
          Homepage
        </Badge>
      ) : null}
    </div>
  );
}

function SourceLinks({ item }: { item: DroneNewsItem }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {item.citations.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/35 hover:text-primary"
        >
          {source.label}
        </a>
      ))}
    </div>
  );
}

function HomepageFeaturedStory({ item }: { item: DroneNewsItem }) {
  return (
    <Card className="overflow-hidden border-border/50 bg-background/75 shadow-xl backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="border-b border-border/50 bg-gradient-to-br from-primary/12 via-background/70 to-background px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">
              Featured Signal
            </Badge>
            <Badge variant="outline" className="border-border/60 bg-background/80">
              Rank #{item.rank}
            </Badge>
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            {item.title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {item.shortSummary}
          </p>
        </div>
        <div className="space-y-5 px-6 py-6">
          <StoryMeta item={item} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Why it matters
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground/90">
              {item.whyItMatters}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Evidence base
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{item.sourceTypes}</p>
            <SourceLinks item={item} />
          </div>
          <div className="flex flex-wrap gap-3 border-t border-border/50 pt-5">
            <Link href={`/news/${item.id}`}>
              <Button className="gap-2">
                Read full article
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/news">
              <Button variant="ghost" className="gap-2">
                Browse News Desk
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HomepageStoryCard({ item }: { item: DroneNewsItem }) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-background/75 transition-colors hover:border-primary/30",
        "bg-gradient-to-br",
        regionPanelStyles[item.region]
      )}
    >
      <CardContent className="p-5">
        <StoryMeta item={item} />
        <h3 className="mt-4 text-lg font-semibold leading-tight tracking-tight">{item.title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.shortSummary}</p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Rank #{item.rank}</span>
          <Link href={`/news/${item.id}`} className="text-sm font-medium text-foreground transition-colors hover:text-primary">
            Read article
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function NewsDeskStoryCard({ item }: { item: DroneNewsItem }) {
  return (
    <Card
      id={item.id}
      className={cn(
        "scroll-mt-24 border-border/50 bg-background/80 shadow-sm",
        "bg-gradient-to-br",
        regionPanelStyles[item.region]
      )}
    >
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-background/75 text-foreground">
            Rank #{item.rank}
          </Badge>
          {item.placement === "homepage+news" ? (
            <Badge className="border border-primary/25 bg-primary/10 text-primary hover:bg-primary/10">
              Homepage + News
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border/60 bg-background/75">
              News Desk
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <StoryMeta item={item} />
          <h3 className="mt-4 text-xl font-semibold tracking-tight">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.shortSummary}</p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Why it matters
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground/90">{item.whyItMatters}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Source mix
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.sourceTypes}</p>
            <SourceLinks item={item} />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/50 pt-5">
          <span className="text-xs text-muted-foreground">Full article available in app</span>
          <Link href={`/news/${item.id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              Read article
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomeNewsHighlights() {
  const [featuredStory, ...secondaryStories] = homepageNewsItems;

  return (
    <section className="border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-card/85 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-border/50 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_45%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_35%)] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-primary">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Verified News Desk
                </Badge>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  The latest drone developments shaping Europe and North America
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  A curated brief and article series on the shifts that matter to operators, learners, and enterprise teams - from new permissions and public-safety deployments to delivery scale and workforce buildout.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/50 bg-background/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stories</p>
                  <p className="mt-2 text-2xl font-semibold">{droneNewsItems.length}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Homepage</p>
                  <p className="mt-2 text-2xl font-semibold">{homepageNewsItems.length}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Updated</p>
                  <p className="mt-2 text-xl font-semibold">{droneNewsUpdatedLabel}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-6 xl:grid-cols-[1.18fr,0.82fr]">
              <HomepageFeaturedStory item={featuredStory} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {secondaryStories.map((item) => (
                  <HomepageStoryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-4 border-t border-border/50 pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1.5">
                  <Shield className="h-4 w-4" />
                  {droneNewsMethodology}
                </span>
              </div>
              <Link href="/news">
                <Button variant="outline" size="lg" className="gap-2">
                  Open full News Desk
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewsDesk() {
  const featuredStory = droneNewsItems[0];

  return (
    <div className="relative">
      <section className="border-b border-border/40 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_30%),linear-gradient(to_bottom,rgba(15,23,42,0.28),transparent)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-primary">
            <BookOpen className="mr-2 h-3.5 w-3.5" />
            News Desk
          </Badge>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Verified drone news for operators, teams, and trainees
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                This desk tracks the drone developments that actually change the operating environment across the EU, the United States, and Canada: policy shifts, deployment scale, public-safety programs, industrial workflows, workforce infrastructure, and the new articles built from that reporting.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-border/50 bg-background/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Verified stories</p>
                  <p className="mt-2 text-2xl font-semibold">{droneNewsItems.length}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Homepage picks</p>
                  <p className="mt-2 text-2xl font-semibold">{homepageNewsItems.length}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Regions</p>
                  <p className="mt-2 text-2xl font-semibold">{newsRegions.length}</p>
                </div>
              </div>
            </div>
            <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Updated
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{droneNewsUpdatedLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Editorial rule
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{droneNewsMethodology}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    What to watch
                  </p>
                  <div className="mt-3 space-y-3 text-sm text-foreground/90">
                    <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                      <p className="font-medium">Regulation</p>
                      <p className="mt-1 text-muted-foreground">Standing permissions and security frameworks are reshaping which missions can scale next.</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                      <p className="font-medium">Operations</p>
                      <p className="mt-1 text-muted-foreground">The strongest signals come from named deployments, state programs, and recurring industrial workflows.</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                      <p className="font-medium">Workforce</p>
                      <p className="mt-1 text-muted-foreground">Training demand rises when permissions widen and organizations move from pilots to governed programs.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.12fr,0.88fr]">
          <HomepageFeaturedStory item={featuredStory} />
          <Card className="border-border/50 bg-card/80 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-primary">
                <Target className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.22em]">Why these ten stories</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                The ranking favors source strength, operational significance, recency inside the late-2025 to April 2026 window, and direct relevance for learners, operators, and enterprise buyers. The homepage subset is intentionally compact so unauthenticated users see the highest-signal shifts first, while the full page and article routes keep the broader regional mix intact.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Highest momentum</p>
                  <p className="mt-2 text-sm font-medium">Delivery scale, public safety, and policy normalization</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Thin coverage</p>
                  <p className="mt-2 text-sm font-medium">Latin America and civil hardware launches remain underrepresented in the verified set</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-14 space-y-14">
          {newsRegions.map((region) => (
            <section key={region}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Badge variant="outline" className={cn("border", regionBadgeStyles[region])}>
                    {region}
                  </Badge>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {region} briefing
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {regionDescriptions[region]}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {newsItemsByRegion[region].length} verified stories
                </p>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {newsItemsByRegion[region].map((item) => (
                  <NewsDeskStoryCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
