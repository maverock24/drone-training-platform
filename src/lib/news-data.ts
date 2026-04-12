export type DroneNewsRegion = "EU" | "United States" | "Canada";

export type DroneNewsPlacement = "homepage+news" | "news_only";

export type DroneNewsSource = {
  label: string;
  url: string;
};

export type DroneNewsItem = {
  id: string;
  rank: number;
  placement: DroneNewsPlacement;
  region: DroneNewsRegion;
  domain: string;
  date: string;
  title: string;
  shortSummary: string;
  whyItMatters: string;
  sourceTypes: string;
  citations: DroneNewsSource[];
};

export const droneNewsUpdatedLabel = "12 Apr 2026";

export const droneNewsMethodology =
  "Each featured story pairs a primary or official source with independent reporting whenever that second source type is available.";

export const droneNewsItems: DroneNewsItem[] = [
  {
    id: "us-retail-wing-walmart-expansion",
    rank: 1,
    placement: "homepage+news",
    region: "United States",
    domain: "Logistics / delivery",
    date: "2026-01-11",
    title: "Wing and Walmart expand drone delivery to 150 more stores",
    shortSummary:
      "Wing says the partnership will add 150 stores over the next year, extend reach to more than 40 million Americans, and build toward more than 270 delivery locations in 2027.",
    whyItMatters:
      "This is the clearest U.S. proof that drone delivery is becoming retail infrastructure instead of staying a metro pilot.",
    sourceTypes: "Official operator announcement plus established general news",
    citations: [
      {
        label: "Wing",
        url: "https://wing.com/news/wing-walmart-expand-drone-delivery-coast-to-coast",
      },
      {
        label: "CBS News",
        url: "https://www.cbsnews.com/news/walmart-drone-delivery-service-wing-150-stores/",
      },
    ],
  },
  {
    id: "eu-security-counter-drone-plan",
    rank: 2,
    placement: "homepage+news",
    region: "EU",
    domain: "Security / policy",
    date: "2026-02-11",
    title: "EU launches a counter-drone action plan",
    shortSummary:
      "The European Commission published a four-pillar plan covering preparedness, AI and 5G-enabled detection, coordinated response, and defense readiness.",
    whyItMatters:
      "It is the clearest EU-wide operating-environment shift in the window and changes procurement, compliance, and public-sector demand across member states.",
    sourceTypes: "Official EU policy page plus established general news",
    citations: [
      {
        label: "European Commission",
        url: "https://commission.europa.eu/news-and-media/news/new-plan-counter-drone-threats-2026-02-11_en",
      },
      {
        label: "Reuters",
        url: "https://www.reuters.com/business/aerospace-defense/eu-commission-take-steps-improve-drone-detection-capabilities-2026-02-11/",
      },
    ],
  },
  {
    id: "ca-policy-transport-canada-rules",
    rank: 3,
    placement: "homepage+news",
    region: "Canada",
    domain: "Regulation / policy",
    date: "2025-11-04",
    title: "Canada opens lower-risk BVLOS, EVLOS, and medium-drone pathways",
    shortSummary:
      "Transport Canada removed the SFOC requirement for some lower-risk BVLOS missions and expanded EVLOS, sheltered, and medium-drone privileges under a standing framework.",
    whyItMatters:
      "It changes what trained commercial pilots can do under standing rules instead of repeated one-off approvals.",
    sourceTypes: "Official regulator summary plus established general news",
    citations: [
      {
        label: "Transport Canada",
        url: "https://tc.canada.ca/en/aviation/drone-safety/2025-summary-changes-canada-drone-regulations",
      },
      {
        label: "CTV News",
        url: "https://www.ctvnews.ca/canada/article/new-transport-canada-drone-regulations-provide-more-flexibility-to-professional-operators/",
      },
    ],
  },
  {
    id: "us-health-advocate-zipline-network",
    rank: 4,
    placement: "homepage+news",
    region: "United States",
    domain: "Healthcare / delivery",
    date: "2026-03-26",
    title: "Advocate Health plans the largest hospital-based drone network in the U.S.",
    shortSummary:
      "Advocate Health says its Zipline partnership will support more than 100,000 annual deliveries at full scope, starting in Charlotte and then expanding to Chicago and Milwaukee.",
    whyItMatters:
      "This is a high-signal healthcare operations story with direct relevance to lab logistics, prescriptions, and home-delivery workflows.",
    sourceTypes: "Official health-system release plus healthcare trade publication",
    citations: [
      {
        label: "Advocate Health",
        url: "https://www.advocatehealth.org/news/advocate-health-to-launch-nations-largest-hospital-drone-delivery-network",
      },
      {
        label: "HIT Consultant",
        url: "https://hitconsultant.net/2026/03/26/advocate-health-zipline-hospital-drone-delivery-network-2027/",
      },
    ],
  },
  {
    id: "us-security-faa-dow-laser-safety",
    rank: 5,
    placement: "homepage+news",
    region: "United States",
    domain: "Security / public safety",
    date: "2026-04-10",
    title: "FAA clears a safety framework for border counter-drone laser use",
    shortSummary:
      "The FAA says it completed a safety assessment for a high-energy counter-drone laser system, and AP ties the move to earlier airspace disruptions and live demonstrations.",
    whyItMatters:
      "It shows counter-UAS moving from emergency disruption into formal, coordinated operating controls.",
    sourceTypes: "Official FAA release plus established general news",
    citations: [
      {
        label: "FAA",
        url: "https://www.faa.gov/newsroom/faa-and-dow-sign-landmark-safety-agreement-protect-southern-border",
      },
      {
        label: "AP News",
        url: "https://apnews.com/article/drone-laser-faa-texas-pentagon-67cf7f351f0db902e5657d88d0a3adc9",
      },
    ],
  },
  {
    id: "us-public-safety-ohio-dfr",
    rank: 6,
    placement: "homepage+news",
    region: "United States",
    domain: "Public safety / emergency response",
    date: "2026-02-09",
    title: "Ohio selects nine agencies for a statewide drone first responder pilot",
    shortSummary:
      "Ohio's pilot uses drone-in-a-box systems for search, rescue, crash, disaster, and medical-supply missions through a state-managed rollout.",
    whyItMatters:
      "It shows drones scaling into a governed emergency-response model with training, infrastructure, and measurable outcomes.",
    sourceTypes: "Official state release plus local news",
    citations: [
      {
        label: "ODOT",
        url: "https://content.govdelivery.com/accounts/OHDOT/bulletins/408fa74",
      },
      {
        label: "News 5 Cleveland",
        url: "https://www.news5cleveland.com/news/local-news/ohio-launches-nations-first-statewide-drone-program-for-first-responders",
      },
    ],
  },
  {
    id: "ca-security-ideas-cuas-sandbox",
    rank: 7,
    placement: "news_only",
    region: "Canada",
    domain: "Security / defense",
    date: "2026-02-18",
    title: "Canada awards CUAS sandbox winners after Ottawa urban trials",
    shortSummary:
      "National Defence awarded 1.75 million CAD to three winners after dense-city drone-detection trials involving nineteen innovators and multiple security partners.",
    whyItMatters:
      "It shows Canada funding deployable counter-drone capability in realistic urban conditions rather than limiting the work to lab research.",
    sourceTypes: "Official defense release plus defense trade publication",
    citations: [
      {
        label: "National Defence",
        url: "https://www.canada.ca/en/department-national-defence/news/2026/02/minister-mcguinty-congratulates-innovators-announces-175m-prize-winners-of-urban-drone-detection-trials-in-ottawa.html",
      },
      {
        label: "Vanguard Canada",
        url: "https://vanguardcanada.com/innovation-in-the-urban-sky-ottawa-sandbox-crowns-canadas-drone-detection-trailblazers/",
      },
    ],
  },
  {
    id: "eu-industrial-rwe-offshore-cargo",
    rank: 8,
    placement: "news_only",
    region: "EU",
    domain: "Infrastructure / industrial operations",
    date: "2025-10-15",
    title: "RWE turns cargo drones into offshore wind operations",
    shortSummary:
      "RWE says it completed more than 80 offshore cargo-drone flights, including repeated BVLOS deliveries to German wind turbines and vessel-to-turbine payload drops.",
    whyItMatters:
      "It is one of the strongest proofs that drones are entering recurring industrial workflows rather than staying in pilot mode.",
    sourceTypes: "Official enterprise release plus sector trade news",
    citations: [
      {
        label: "RWE",
        url: "https://www.rwe.com/en/press/rwe-offshore-wind-gmbh/2025-10-15-rwe-successfully-pioneers-cargo-drone-operations-at-offshore-wind-farms/",
      },
      {
        label: "offshoreWIND.biz",
        url: "https://www.offshorewind.biz/2025/10/15/rwe-unleashes-autonomous-heavy-payload-drones-at-german-offshore-wind-farms/",
      },
    ],
  },
  {
    id: "eu-delivery-manna-cork-expansion",
    rank: 9,
    placement: "news_only",
    region: "EU",
    domain: "Logistics / delivery",
    date: "2026-04-01",
    title: "Manna pairs Cork pilot activity with fresh scale capital",
    shortSummary:
      "Manna says its 50 million USD Series B will fund 40 operating bases across the United States and Europe, while Cork pilots show local deployment is already underway.",
    whyItMatters:
      "It ties EU consumer delivery activity to real capital, named local deployment, and additional hiring instead of a pure funding story.",
    sourceTypes: "Official operator announcement plus regional business news",
    citations: [
      {
        label: "Manna",
        url: "https://www.manna.aero/blog/series-b",
      },
      {
        label: "Irish Examiner",
        url: "https://www.irishexaminer.com/business/companies/arid-41796134.html",
      },
    ],
  },
  {
    id: "us-training-utep-drone-expansion",
    rank: 10,
    placement: "news_only",
    region: "United States",
    domain: "Training / workforce",
    date: "2026-02-13",
    title: "UTEP adds 2 million USD to drone research and training capacity",
    shortSummary:
      "A federal appropriation expands drone testing and operations infrastructure in Fabens and Tornillo with radar, electrical, and equipment upgrades plus new staff and student roles.",
    whyItMatters:
      "It links funding directly to hands-on training, BVLOS-capable infrastructure, and regional aerospace demand.",
    sourceTypes: "Official university release plus local news",
    citations: [
      {
        label: "UTEP",
        url: "https://www.utep.edu/newsfeed/2026/february/2-million-federal-appropriation-to-expand-drone-research-and-teaching-at-utep-aerospace-center.html",
      },
      {
        label: "KVIA",
        url: "https://kvia.com/news/education/2026/02/13/utep-announces-2-million-federal-appropriation-to-expand-drone-research-and-teaching/",
      },
    ],
  },
];

export const homepageNewsItems = droneNewsItems.filter(
  (item) => item.placement === "homepage+news"
);

export const newsRegions: DroneNewsRegion[] = ["EU", "United States", "Canada"];

export const newsItemsByRegion = {
  EU: droneNewsItems.filter((item) => item.region === "EU"),
  "United States": droneNewsItems.filter((item) => item.region === "United States"),
  Canada: droneNewsItems.filter((item) => item.region === "Canada"),
} satisfies Record<DroneNewsRegion, DroneNewsItem[]>;
