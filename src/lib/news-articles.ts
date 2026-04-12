import { droneNewsItems, type DroneNewsItem } from "@/lib/news-data";

export type DroneNewsArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type DroneNewsArticle = DroneNewsItem & {
  standfirst: string;
  readingTime: string;
  keyTakeaways: string[];
  sections: DroneNewsArticleSection[];
  watchList: string[];
};

const articleContentById: Record<
  string,
  Omit<DroneNewsArticle, keyof DroneNewsItem>
> = {
  "us-retail-wing-walmart-expansion": {
    standfirst:
      "Walmart and Wing are no longer describing drone delivery as a niche experiment. The January expansion reframes the service as a retail footprint with store count, market names, and a measurable path to national scale.",
    readingTime: "4 min read",
    keyTakeaways: [
      "Wing and Walmart said the next phase adds 150 stores over the next year.",
      "The companies framed the network around more than 40 million reachable Americans and more than 270 delivery locations in 2027.",
      "The bigger signal is not the aircraft - it is the move from pilot language to repeatable retail infrastructure.",
    ],
    sections: [
      {
        heading: "What changed",
        paragraphs: [
          "The January 2026 announcement matters because it replaces vague growth language with operating numbers. Wing and Walmart did not just say service was expanding. They attached the next phase to 150 more stores, named markets such as Los Angeles, St. Louis, Cincinnati, and Miami, and described a network expected to exceed 270 delivery locations in 2027.",
          "That makes this one of the clearest drone-delivery signals in the current market. The story is no longer about whether a retailer can run a limited suburban demo. It is about whether a national chain and a specialist operator can keep widening the number of active fulfillment nodes without turning each city launch into a custom one-off program.",
        ],
      },
      {
        heading: "Why this matters to the market",
        paragraphs: [
          "Retail drone delivery becomes strategically meaningful when the discussion shifts from aircraft capability to network behavior. Store count, household reach, market density, and repeat-order frequency are much better adoption signals than raw press-release enthusiasm, and this announcement contains all four. The research backing this article also showed that Wing reported strong repeat use among its heaviest customers, which is exactly the pattern operators need if drone delivery is going to behave like a service layer instead of a launch event.",
        ],
      },
      {
        heading: "What to watch next",
        paragraphs: [
          "The next proof point is operational follow-through. The Bay Area rollout and the newly named metros matter because they test whether the expansion can hold up in denser, more demanding markets. If those launches convert into reliable throughput and sustained repeat orders, this story stops being the best drone-delivery headline of the quarter and starts looking like a retail logistics inflection point.",
        ],
      },
    ],
    watchList: [
      "Whether the new metro launches go live on the timeline implied by the January announcement.",
      "Whether additional operators begin announcing store-level footprints instead of city-level pilots.",
      "Whether regulators move closer to a standing BVLOS framework while operators scale under the current approval environment.",
    ],
  },
  "eu-security-counter-drone-plan": {
    standfirst:
      "The European Commission's counter-drone package is a security story, but it is also a market-structure story. It pulls trusted hardware, coordinated response, and future procurement into the same policy lane.",
    readingTime: "4 min read",
    keyTakeaways: [
      "The EU framed hostile-drone response as a system-level resilience issue rather than a niche airport problem.",
      "The package points toward trusted-drone labeling, detection upgrades, testing capacity, and coordinated response tools.",
      "This is one of the clearest EU-wide signals that security policy will shape drone demand and supplier positioning.",
    ],
    sections: [
      {
        heading: "Why Brussels moved now",
        paragraphs: [
          "Europe's drone policy story has changed. The civil framework still matters, but the February 2026 action plan makes it clear that the Union is now treating malicious or unsafe drone activity as a resilience problem for airports, borders, critical infrastructure, and public spaces. That is a broader and more consequential framing than a narrow aviation-safety update.",
        ],
      },
      {
        heading: "What the action plan actually builds",
        paragraphs: [
          "The significance of the package is in the stack it creates. Detection, identification, testing, trusted equipment, and coordinated response are all moving into the same policy conversation. That means the EU is not only trying to stop bad outcomes after they happen. It is trying to influence which systems get deployed, which suppliers look trustworthy, and which public agencies are prepared to respond in a coordinated way.",
        ],
      },
      {
        heading: "Why this matters beyond security teams",
        paragraphs: [
          "Operators, enterprise buyers, and training providers should care because security policy tends to reshape adjacent markets. Once trusted-label work, detection architecture, and procurement coordination become policy priorities, public-sector demand changes, supplier requirements harden, and compliance expectations become more concrete. That is why this story belongs near the top of the News Desk rather than sitting in a specialist defense corner.",
        ],
      },
    ],
    watchList: [
      "How quickly the EU turns the action plan into named procurement, deployment, and testing programs.",
      "Whether trusted-drone labeling starts affecting supplier selection in public tenders.",
      "Which member states move first from policy language to visible counter-drone operating capability.",
    ],
  },
  "ca-policy-transport-canada-rules": {
    standfirst:
      "Canada's late-2025 rule expansion remains one of the most concrete operator stories in North America. It did not simply promise future flexibility - it created a live permissions ladder for more capable missions.",
    readingTime: "4 min read",
    keyTakeaways: [
      "Transport Canada's framework widened lower-risk BVLOS, EVLOS, sheltered, and medium-drone pathways.",
      "The new model ties higher-value missions directly to exams, flight reviews, and operator certification.",
      "Canada now looks more operationally mature than the U.S. in the specific slice of work covered by these standing permissions.",
    ],
    sections: [
      {
        heading: "What changed in practice",
        paragraphs: [
          "The core significance of the November 2025 changes is that they replaced repeated one-off approvals for some lower-risk work with a structured permission model. Operators now have a clearer route into lower-risk BVLOS and related advanced missions, but that route runs through a more formal system of pilot credentials and operator certificates rather than casual self-upgrading.",
        ],
      },
      {
        heading: "Why this matters beyond compliance",
        paragraphs: [
          "This is not only a regulatory housekeeping story. It changes the business shape of the Canadian market by making advanced operations more legible to employers, schools, and service providers. A market with named certificates, named privileges, and named limits is easier to build services around than one that depends heavily on repeated case-by-case approvals.",
        ],
      },
      {
        heading: "Where the framework still draws hard lines",
        paragraphs: [
          "The change should not be misread as a blanket opening of Canadian airspace. The framework still preserves meaningful restrictions, including around advertised public events and the conditions attached to lower-risk BVLOS operations. That balance is part of why the story is so useful: Canada is widening the market, but it is doing so through a more formal ladder rather than by lowering the bar altogether.",
        ],
      },
    ],
    watchList: [
      "How quickly RPOC growth translates into visible inspection, delivery, and public-safety programs.",
      "Whether adjacent regulators keep adapting their own rules to account for certified drone operations.",
      "Which Canadian training providers scale fastest around Level 1 Complex and related credentials.",
    ],
  },
  "us-health-advocate-zipline-network": {
    standfirst:
      "The Advocate Health and Zipline announcement matters because it treats drone logistics like hospital infrastructure. The network is framed around prescriptions, lab specimens, and supplies, not novelty deliveries.",
    readingTime: "4 min read",
    keyTakeaways: [
      "Advocate Health said the full network could support more than 100,000 annual deliveries.",
      "The rollout starts with Charlotte and then expands to Chicago and Milwaukee, with Georgia also planned.",
      "This is one of the strongest healthcare drone stories because it ties scale to named clinical workflows.",
    ],
    sections: [
      {
        heading: "From pilot rhetoric to hospital workflow",
        paragraphs: [
          "Healthcare drone stories often sound promising but thin. This one is different because the announcement described a recurring logistics model rather than a ceremonial test. Prescriptions, lab specimens, and medical supplies each map to real operational pain points, which gives the network a much clearer economic and clinical rationale than a generic claim about faster delivery.",
        ],
      },
      {
        heading: "Why scale matters here",
        paragraphs: [
          "A target above 100,000 annual deliveries at full scope is important because it pushes the conversation out of pilot territory. It suggests the partners are designing for throughput, repeatability, and integration into health-system operations. For the drone market more broadly, that is a stronger enterprise signal than a single hospital proving that a drone can fly medicine across town once or twice.",
        ],
      },
      {
        heading: "What still has to happen before launch",
        paragraphs: [
          "The network is planned rather than live, and that matters. Regulatory processes, site readiness, and operational integration still need to land before the first flights begin. That is why the story is powerful but not overclaimed: it is a serious logistics buildout with a concrete horizon, not a completed deployment pretending to be a forecast.",
        ],
      },
    ],
    watchList: [
      "Whether the Charlotte launch proceeds on the expected timeline.",
      "How much of the early activity focuses on home delivery versus specimen and internal health-system logistics.",
      "Whether other hospital systems begin publishing network-scale numbers instead of isolated drone pilots.",
    ],
  },
  "us-security-faa-dow-laser-safety": {
    standfirst:
      "The FAA's April 2026 safety clearance for border counter-drone laser use is one of the clearest signs that U.S. counter-UAS activity is being formalized. It is also a story that still deserves caution because key operating details remain thin in the public record.",
    readingTime: "4 min read",
    keyTakeaways: [
      "The FAA said a safety assessment cleared a high-energy counter-drone laser system for southern-border use.",
      "AP linked the move to earlier airspace disruptions and live testing activity.",
      "The headline is significant, but transparency around safeguards and operating constraints still looks incomplete.",
    ],
    sections: [
      {
        heading: "What the clearance signals",
        paragraphs: [
          "This is not just another counter-drone demonstration. The reason the story stands out is that the FAA framed it as a safety-reviewed operating agreement rather than an improvised emergency tool. In practical terms, that suggests federal agencies are trying to move counter-UAS activity onto a more documented footing around airspace protection and border operations.",
        ],
      },
      {
        heading: "Why it matters for the wider market",
        paragraphs: [
          "Security and public-safety stories matter far beyond defense circles because they influence procurement, testing, training demand, and the boundaries of what public agencies are willing to deploy. A formal safety framework signals that counter-UAS work is becoming a repeatable operating category instead of a one-off reaction to disruption.",
        ],
      },
      {
        heading: "Why this article still carries caution",
        paragraphs: [
          "The public record does not yet give a full picture of oversight, safeguards, and day-to-day operating constraints. That does not make the story weak, but it does mean it should be presented with discipline. The right interpretation is that the U.S. has crossed an important formalization threshold, not that every outstanding policy and civil-liberties question has been settled.",
        ],
      },
    ],
    watchList: [
      "Whether agencies disclose more about operational limits, oversight, and safety safeguards.",
      "Whether the framework expands into other high-risk geographies or remains tightly scoped.",
      "How this kind of counter-UAS work intersects with broader public-safety and airspace governance debates.",
    ],
  },
  "us-public-safety-ohio-dfr": {
    standfirst:
      "Ohio's statewide drone first responder pilot is one of the clearest signs that public-safety drone operations are maturing into a governed operating model rather than remaining a city-by-city experiment.",
    readingTime: "4 min read",
    keyTakeaways: [
      "Nine agencies were selected for what Ohio described as a statewide DFR pilot.",
      "The program centers on drone-in-a-box deployment, onboarding, and a structured evaluation model.",
      "This is a stronger signal than a single municipal launch because it tests governance and repeatability at state level.",
    ],
    sections: [
      {
        heading: "Why statewide matters",
        paragraphs: [
          "A statewide pilot changes the meaning of a DFR announcement. Instead of one department proving that remote launch is useful in a narrow setting, the state is testing whether multiple agencies can operate under a shared structure, shared expectations, and a visible evaluation window. That makes the story more relevant to procurement teams, trainers, and public-sector leaders who care about repeatability rather than novelty.",
        ],
      },
      {
        heading: "What the operating model looks like",
        paragraphs: [
          "The most important feature is not simply that drones can launch from docks. It is that the pilot ties docking hardware, agency onboarding, and mission categories together into one program. Search, rescue, crashes, disaster response, and even certain medical-supply use cases are part of the same operational conversation, which suggests a more mature approach to public-safety aviation.",
        ],
      },
      {
        heading: "What success would look like",
        paragraphs: [
          "The real measure of progress will be whether Ohio can show better response outcomes, cleaner governance, and a reusable deployment template. If it can, this story will look less like a regional pilot and more like a preview of how DFR programs scale across state and provincial systems.",
        ],
      },
    ],
    watchList: [
      "Whether Ohio publishes measurable response, safety, or cost outcomes from the pilot.",
      "Whether other states adopt the same multi-agency DFR model.",
      "How privacy, training, and dispatch integration mature as the pilot progresses.",
    ],
  },
  "ca-security-ideas-cuas-sandbox": {
    standfirst:
      "Canada's Ottawa urban trials and follow-on awards show counter-drone work being treated as a live city-security problem, not a lab exercise. That makes the story strategically stronger than a simple prize announcement.",
    readingTime: "3 min read",
    keyTakeaways: [
      "National Defence awarded 1.75 million CAD after urban drone-detection trials in Ottawa.",
      "The sandbox involved nineteen innovators and multiple security stakeholders in a dense city environment.",
      "Urban counter-drone capability is becoming a procurement and deployment issue, not only a research topic.",
    ],
    sections: [
      {
        heading: "What the Ottawa sandbox actually tested",
        paragraphs: [
          "The value of the trials was the environment. Dense urban conditions force systems to deal with clutter, interference, and the practical difficulty of identifying small drones in places where false positives and slow response carry real consequences. That is a much more useful signal than a controlled-range success story with few real-world constraints.",
        ],
      },
      {
        heading: "Why urban detection matters",
        paragraphs: [
          "Cities compress public events, transport links, government sites, and critical services into a small footprint. If counter-drone tools cannot operate credibly in that setting, they are less useful in the places where public pressure will be highest. That is why this story is stronger than a generic defense-innovation item.",
        ],
      },
      {
        heading: "What the awards signal next",
        paragraphs: [
          "Prize money alone is not the headline. The more important signal is that Canada is trying to turn evaluated urban detection work into a real capability pipeline. That creates a clearer bridge from experimental technology to future procurement, field trials, and operational deployment.",
        ],
      },
    ],
    watchList: [
      "Whether the award winners move into broader procurement or larger field trials.",
      "How quickly urban counter-drone priorities spread into provincial and municipal security planning.",
      "Whether additional independent reporting clarifies performance expectations and deployment scope.",
    ],
  },
  "eu-industrial-rwe-offshore-cargo": {
    standfirst:
      "RWE's offshore cargo-drone program is one of the strongest industrial drone stories in the current package because it is about recurring maintenance work, not a polished demo. The company tied the flights to time savings, payload movement, and daily turbine operations.",
    readingTime: "4 min read",
    keyTakeaways: [
      "RWE said it completed more than 80 offshore cargo-drone flights at Arkona and Nordsee Ost.",
      "The program included long-range deliveries from port to turbines and short-range vessel-to-turbine drops.",
      "This is a strong proof that drones are entering recurring offshore maintenance workflows.",
    ],
    sections: [
      {
        heading: "What actually happened offshore",
        paragraphs: [
          "The reason this story matters is that RWE published concrete operating details. The flights were not framed as isolated technology trials. They were described as repeated cargo movements supporting offshore wind operations, including delivery of tools, spare parts, and other consumables to turbines and vessels.",
        ],
      },
      {
        heading: "Why this matters beyond inspection",
        paragraphs: [
          "Many industrial drone headlines stop at image capture. RWE's program is more interesting because it folds drones into the logic of maintenance logistics and turbine uptime. If an operator can cut vessel time, reduce technician delay, and move payloads faster offshore, the business case becomes easier to understand for other asset-heavy industries.",
        ],
      },
      {
        heading: "What this says about industrial adoption",
        paragraphs: [
          "The industrial market matures when organizations describe workflows, not capabilities. RWE did that. It framed drones as part of an operational system, which is why this story is much stronger than a vendor saying its platform can theoretically inspect, detect, or transport something. That is exactly the threshold enterprise audiences care about.",
        ],
      },
    ],
    watchList: [
      "Whether other offshore wind operators publish comparable maintenance and logistics metrics.",
      "Whether cargo use expands into more inspection-adjacent workflows or emergency support tasks.",
      "How quickly this type of industrial drone work spreads beyond offshore wind into adjacent heavy-asset sectors.",
    ],
  },
  "eu-delivery-manna-cork-expansion": {
    standfirst:
      "Manna's April 2026 funding round matters because it arrived with local operating proof. The Cork activity gives the expansion story more weight than a financing announcement on its own would deserve.",
    readingTime: "3 min read",
    keyTakeaways: [
      "Manna said its Series B would fund 40 operating bases across the United States and Europe.",
      "Irish reporting showed the company had already started demonstration flights with Cork merchants.",
      "The story is strongest when treated as one scale-up cluster rather than split into separate funding and pilot headlines.",
    ],
    sections: [
      {
        heading: "What changed in April",
        paragraphs: [
          "The financing matters because it was connected to a deployment narrative instead of standing alone. Manna presented the new capital as fuel for a wider operating-base footprint, while independent reporting tied that scale story to visible Cork activity. That combination makes the signal more credible than a pure venture announcement.",
        ],
      },
      {
        heading: "Why Cork matters",
        paragraphs: [
          "Europe's delivery story still looks more local than the U.S. market, which means named merchant pilots and city-specific rollout steps carry extra weight. Cork is useful because it shows local execution rather than only boardroom ambition. It suggests the company is trying to translate fresh capital into real service geography.",
        ],
      },
      {
        heading: "What Europe still needs to prove",
        paragraphs: [
          "The next threshold is consistency at scale. Europe still lacks a deeper bench of delivery stories with the same combination of household reach, network density, and repeated consumer behavior visible in the strongest U.S. examples. That is why Manna stays in the package, but below the top homepage tier.",
        ],
      },
    ],
    watchList: [
      "Whether Cork turns into a durable commercial service rather than a pilot-stage signal.",
      "How quickly Manna converts funding into additional named bases and local merchant networks.",
      "Whether Europe produces more delivery stories with network-scale evidence instead of city-by-city experimentation.",
    ],
  },
  "us-training-utep-drone-expansion": {
    standfirst:
      "UTEP's funding story matters because it expands physical drone capacity, not just marketing language around workforce development. Radar, equipment, electrical upgrades, and staffing all point to a more serious training environment.",
    readingTime: "3 min read",
    keyTakeaways: [
      "A 2 million USD federal appropriation supports drone testing and operations infrastructure in Fabens and Tornillo.",
      "The buildout includes radar, electrical upgrades, equipment, and added staff and student roles.",
      "This is a stronger workforce signal than a generic program launch because it funds the infrastructure that hands-on training depends on.",
    ],
    sections: [
      {
        heading: "Why infrastructure matters more than another course catalog",
        paragraphs: [
          "Drone workforce stories are strongest when they show how training capacity is being built, not simply how it is being advertised. UTEP's announcement matters because it focuses on test and operations capability. That is the physical foundation needed for serious research, live operations, and advanced training work.",
        ],
      },
      {
        heading: "What this buildout supports",
        paragraphs: [
          "The Fabens and Tornillo expansion connects equipment, facilities, and staffing to a region where aerospace, border operations, public safety, agriculture, and autonomous systems all intersect. That gives the story more weight than a campus-only upgrade would have, because the surrounding operational environment can feed real mission demand into the training pipeline.",
        ],
      },
      {
        heading: "What it signals about workforce demand",
        paragraphs: [
          "A school does not expand this kind of infrastructure simply to add brochure copy. The clearer interpretation is that employers, researchers, and public-sector programs increasingly need people who can work with drone systems in settings closer to live field operations. That makes UTEP a useful lower-ranked article in the package: it is not the loudest headline, but it is one of the cleaner signals that workforce demand is hardening.",
        ],
      },
    ],
    watchList: [
      "Whether the new infrastructure leads to additional partnerships, field programs, or mission-specific training pathways.",
      "How quickly universities in other regions start funding similar drone operations capacity.",
      "Whether employers begin signaling stronger demand for graduates trained in operational, not just academic, drone workflows.",
    ],
  },
};

export const droneNewsArticles: DroneNewsArticle[] = droneNewsItems.map((item) => ({
  ...item,
  ...articleContentById[item.id],
}));

export function getDroneNewsArticle(articleId: string) {
  return droneNewsArticles.find((item) => item.id === articleId);
}

export function getDroneNewsArticleIds() {
  return droneNewsArticles.map((item) => item.id);
}

export function getRelatedDroneNewsArticles(articleId: string) {
  const currentArticle = getDroneNewsArticle(articleId);

  if (!currentArticle) {
    return [];
  }

  return droneNewsArticles
    .filter((item) => item.id !== articleId)
    .sort((left, right) => {
      const leftRegionScore = left.region === currentArticle.region ? 0 : 1;
      const rightRegionScore = right.region === currentArticle.region ? 0 : 1;

      if (leftRegionScore !== rightRegionScore) {
        return leftRegionScore - rightRegionScore;
      }

      const leftDomainScore = left.domain === currentArticle.domain ? 0 : 1;
      const rightDomainScore = right.domain === currentArticle.domain ? 0 : 1;

      if (leftDomainScore !== rightDomainScore) {
        return leftDomainScore - rightDomainScore;
      }

      return left.rank - right.rank;
    })
    .slice(0, 3);
}
