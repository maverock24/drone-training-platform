import agricultureData from "../../courses/agriculture.json";
import birdData from "../../courses/bird.json";
import cityData from "../../courses/city.json";
import coastalData from "../../courses/coastal.json";
import cultureData from "../../courses/culture.json";
import emergencyData from "../../courses/emergency.json";
import facilityData from "../../courses/facility_inspection.json";
import filmData from "../../courses/film.json";
import fireData from "../../courses/fire.json";
import maritimeData from "../../courses/maritime.json";
import miningData from "../../courses/mining.json";
import polarData from "../../courses/polar.json";
import powerData from "../../courses/power.json";
import packageDeliveryData from "../../courses/package_delivery.json";
import securityData from "../../courses/security.json";
import publicSafetyData from "../../courses/public_safety.json";
import forestryData from "../../courses/forestry.json";
import viticultureData from "../../courses/viticulture.json";
import constructionData from "../../courses/construction.json";
import oilGasData from "../../courses/oil_gas.json";

// --- Types ---

export interface DomainLesson {
  title: string;
  content?: string;
  description?: string;
  code_example?: string;
}

export interface DomainModule {
  title: string;
  lessons: DomainLesson[];
}

export interface CapstoneProject {
  name: string;
  description: string;
  deliverables?: string[];
}

export interface DomainResource {
  name: string;
  url: string;
  description?: string;
}

export interface DomainTraining {
  slug: string;
  domain: string;
  description: string;
  learning_objectives: string[];
  modules: DomainModule[];
  capstone_project?: CapstoneProject;
  resources?: DomainResource[];
}

// Slug mapping — each JSON file gets a URL-friendly slug
const domainFiles: { slug: string; data: Record<string, unknown> }[] = [
  { slug: "fire", data: fireData as Record<string, unknown> },
  { slug: "bird", data: birdData as Record<string, unknown> },
  { slug: "city", data: cityData as Record<string, unknown> },
  { slug: "facility-inspection", data: facilityData as Record<string, unknown> },
  { slug: "agriculture", data: agricultureData as Record<string, unknown> },
  { slug: "emergency", data: emergencyData as Record<string, unknown> },
  { slug: "maritime", data: maritimeData as Record<string, unknown> },
  { slug: "power", data: powerData as Record<string, unknown> },
  { slug: "mining", data: miningData as Record<string, unknown> },
  { slug: "coastal", data: coastalData as Record<string, unknown> },
  { slug: "polar", data: polarData as Record<string, unknown> },
  { slug: "culture", data: cultureData as Record<string, unknown> },
  { slug: "film", data: filmData as Record<string, unknown> },
  { slug: "package-delivery", data: packageDeliveryData as Record<string, unknown> },
  { slug: "security", data: securityData as Record<string, unknown> },
  { slug: "public-safety", data: publicSafetyData as Record<string, unknown> },
  { slug: "forestry", data: forestryData as Record<string, unknown> },
  { slug: "viticulture", data: viticultureData as Record<string, unknown> },
  { slug: "construction", data: constructionData as Record<string, unknown> },
  { slug: "oil-gas", data: oilGasData as Record<string, unknown> },
];

function transformDomain(
  slug: string,
  raw: Record<string, unknown>
): DomainTraining {
  return {
    slug,
    domain: raw.domain as string,
    description: raw.description as string,
    learning_objectives: raw.learning_objectives as string[],
    modules: (raw.modules as Record<string, unknown>[]).map((m) => ({
      title: m.title as string,
      lessons: (m.lessons as Record<string, unknown>[]).map((l) => ({
        title: l.title as string,
        content: (l.content as string) ?? (l.description as string),
        code_example: l.code_example as string | undefined,
      })),
    })),
    capstone_project: raw.capstone_project
      ? {
          name: (raw.capstone_project as Record<string, unknown>).name as string,
          description: (raw.capstone_project as Record<string, unknown>)
            .description as string,
          deliverables: (raw.capstone_project as Record<string, unknown>)
            .deliverables as string[] | undefined,
        }
      : undefined,
    resources: raw.resources
      ? (raw.resources as Record<string, unknown>[]).map((r) => ({
          name: r.name as string,
          url: r.url as string,
          description: r.description as string | undefined,
        }))
      : undefined,
  };
}

export const domainTrainings: DomainTraining[] = domainFiles.map(({ slug, data }) =>
  transformDomain(slug, data)
);

export function getDomainBySlug(slug: string): DomainTraining | undefined {
  return domainTrainings.find((d) => d.slug === slug);
}

// Map domain name → slug for linking from the overview page
export const domainNameToSlug: Record<string, string> = {};
for (const dt of domainTrainings) {
  domainNameToSlug[dt.domain] = dt.slug;
}
