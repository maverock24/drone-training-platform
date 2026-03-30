"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookText, Search } from "lucide-react";
import { glossary } from "@/lib/course-data";

export default function GlossaryPage() {
  const [search, setSearch] = useState("");

  const filtered = glossary.filter(
    (item) =>
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, typeof glossary>>(
    (acc, item) => {
      const letter = item.term[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(item);
      return acc;
    },
    {}
  );

  const letters = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Button>
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
          <BookText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Glossary</h1>
          <p className="text-muted-foreground mt-1">
            {glossary.length} key terms and definitions
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border/50 bg-muted/30 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Letter navigation */}
      <div className="flex flex-wrap gap-1 mb-8">
        {letters.map((letter) => (
          <a key={letter} href={`#letter-${letter}`}>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              {letter}
            </Badge>
          </a>
        ))}
      </div>

      {/* Terms */}
      <div className="space-y-8">
        {letters.map((letter) => (
          <div key={letter} id={`letter-${letter}`}>
            <h2 className="text-xl font-bold mb-3 text-primary">{letter}</h2>
            <div className="space-y-2">
              {grouped[letter].map((item) => (
                <Card key={item.term} className="border-border/50">
                  <CardContent className="py-4">
                    <dt className="font-semibold text-sm">{item.term}</dt>
                    <dd className="text-sm text-muted-foreground mt-1">
                      {item.definition}
                    </dd>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No matching terms found.
        </p>
      )}
    </div>
  );
}
