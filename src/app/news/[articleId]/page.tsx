import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Shield, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getDroneNewsArticle,
  getDroneNewsArticleIds,
  getRelatedDroneNewsArticles,
} from "@/lib/news-articles";
import { droneNewsMethodology, droneNewsUpdatedLabel, type DroneNewsRegion } from "@/lib/news-data";

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

function formatStoryDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${monthLabels[Number(month) - 1]} ${Number(day)}, ${year}`;
}

type ArticlePageProps = {
  params: Promise<{ articleId: string }>;
};

export async function generateStaticParams() {
  return getDroneNewsArticleIds().map((articleId) => ({ articleId }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { articleId } = await params;
  const article = getDroneNewsArticle(articleId);

  if (!article) {
    return {
      title: "Article Not Found | Drone News Desk",
    };
  }

  return {
    title: `${article.title} | Drone News Desk`,
    description: article.standfirst,
  };
}

export default async function NewsArticlePage({ params }: ArticlePageProps) {
  const { articleId } = await params;
  const article = getDroneNewsArticle(articleId);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedDroneNewsArticles(articleId);

  return (
    <div className="relative">
      <section className="border-b border-border/40 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_28%),linear-gradient(to_bottom,rgba(15,23,42,0.22),transparent)]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <Link href="/news">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to News Desk
            </Button>
          </Link>

          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("border", regionBadgeStyles[article.region])}>
                {article.region}
              </Badge>
              <Badge variant="secondary" className="bg-background/80 text-foreground">
                {article.domain}
              </Badge>
              <Badge className="border border-primary/25 bg-primary/10 text-primary hover:bg-primary/10">
                Rank #{article.rank}
              </Badge>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              {article.standfirst}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/50 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Published</p>
                <p className="mt-2 text-base font-semibold">{formatStoryDate(article.date)}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reading time</p>
                <p className="mt-2 text-base font-semibold">{article.readingTime}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Updated</p>
                <p className="mt-2 text-base font-semibold">{droneNewsUpdatedLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.48fr] lg:items-start">
          <article className="space-y-8">
            <Card className="border-border/50 bg-card/85 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Target className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.22em]">Key takeaways</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {article.keyTakeaways.map((takeaway) => (
                    <div key={takeaway} className="rounded-2xl border border-border/50 bg-muted/20 p-4 text-sm leading-6 text-foreground/90">
                      {takeaway}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {article.sections.map((section) => (
              <Card key={section.heading} className="border-border/50 bg-background/85 shadow-sm">
                <CardContent className="p-6 sm:p-7">
                  <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-base leading-8 text-foreground/92">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-border/50 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
              <CardContent className="p-6 sm:p-7">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.22em]">Why this article matters</p>
                </div>
                <p className="mt-4 text-base leading-8 text-foreground/92">{article.whyItMatters}</p>
              </CardContent>
            </Card>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <Card className="border-border/50 bg-card/85 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.22em]">Reporting basis</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{droneNewsMethodology}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Source mix
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/90">{article.sourceTypes}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.citations.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/35 hover:text-primary"
                    >
                      {source.label}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/85 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.22em]">Watch next</p>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-foreground/90">
                  {article.watchList.map((item) => (
                    <div key={item} className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>

      {relatedArticles.length > 0 ? (
        <section className="border-t border-border/40 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">Related briefings</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <Card key={relatedArticle.id} className="border-border/50 bg-background/85 transition-colors hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className={cn("border", regionBadgeStyles[relatedArticle.region])}>
                        {relatedArticle.region}
                      </Badge>
                      <span>{formatStoryDate(relatedArticle.date)}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-tight tracking-tight">
                      {relatedArticle.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {relatedArticle.shortSummary}
                    </p>
                    <Link href={`/news/${relatedArticle.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary">
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
