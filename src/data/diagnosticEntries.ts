export type DiagnosticEntry = {
  id: string;
  title: string;
  category: string;
  observedProblem: string;
  possibleStructures: string[];
  readNext: string[];
  boundaryReminder: string;
  minimalFormula: string;
};

// Only titles with verified matching pages under src/pages are linked.
export const diagnosticReadNextLinks: Record<string, string> = {
  "AI-Readable Knowledge Architecture": "/ai-readable-knowledge-architecture/",
};

export const diagnosticEntries: DiagnosticEntry[] = [
  {
    id: "summary-source-boundary",
    title: "Summary / Source Boundary",
    category: "AI-mediated reading",
    observedProblem:
      "A summary, excerpt, or generated condensation begins to function as if it were the original source.",
    possibleStructures: [
      "source-summary boundary collapse",
      "citation surface confusion",
      "AI-readable != AI-understood",
      "premature circulation",
      "false legibility",
    ],
    readNext: [
      "AI-Readable Knowledge Architecture",
      "Premature Circulation Model",
      "Reality Consistency Model",
    ],
    boundaryReminder:
      "This does not mean all summaries are invalid. The issue is whether a summary has been structurally repositioned as source, evidence, or authority.",
    minimalFormula: "summary access != source authority",
  },
  {
    id: "readable-but-mislocated",
    title: "Readable but Mislocated",
    category: "Documentation",
    observedProblem:
      "A document or output is easy to read, but seems to be interpreted from the wrong position.",
    possibleStructures: [
      "structural misreading",
      "false legibility",
      "documentation boundary failure",
    ],
    readNext: [
      "AI-Readable Knowledge Architecture",
      "False Legibility",
      "Boundary-Role Segmentation Model",
    ],
    boundaryReminder:
      "Readability does not prove correct positioning. This entry concerns cases where surface clarity hides structural mislocation.",
    minimalFormula: "readable != correctly positioned",
  },
  {
    id: "movement-before-recognition",
    title: "Movement Before Recognition",
    category: "Circulation",
    observedProblem:
      "A claim, output, image, summary, or label begins circulating before anyone has stabilized what it is.",
    possibleStructures: [
      "premature circulation",
      "pre-recognized circulation",
      "verification lag",
      "downstream correction",
    ],
    readNext: [
      "Premature Circulation Model",
      "Premature Circulation Diagnostics",
      "Reality Consistency Model",
    ],
    boundaryReminder:
      "Circulation is not inherently harmful. This applies when movement begins before recognition, accountability, or verification conditions are mature enough.",
    minimalFormula: "movement != recognition",
  },
  {
    id: "responsibility-visible-node",
    title: "Responsibility Lands on the Visible Node",
    category: "Responsibility",
    observedProblem:
      "The person who sees, reviews, fixes, signs, or catches the issue becomes treated as responsible for the whole condition.",
    possibleStructures: [
      "visibility != responsibility",
      "capacity != ownership",
      "assistance != transfer",
      "burden absorption",
    ],
    readNext: [
      "Responsibility Alignment Diagnostics",
      "Boundary-Role Segmentation Model",
      "Cost Visibility & Redistribution Model",
    ],
    boundaryReminder:
      "This does not deny that responsibility can shift. It asks whether the shift is structurally aligned with authority, ownership, capacity, and burden.",
    minimalFormula: "visibility != responsibility",
  },
  {
    id: "cost-visible-wrong-place",
    title: "Cost Becomes Visible in the Wrong Place",
    category: "Cost / burden",
    observedProblem:
      "A system appears efficient because visible cost decreased, while verification, repair, coordination, or maintenance burden moved elsewhere.",
    possibleStructures: [
      "perceived cost != total cost",
      "cost redistribution",
      "downstream burden",
      "hidden concentration",
    ],
    readNext: [
      "Cost Visibility & Redistribution Model",
      "Benefit-Burden Allocation Regimes",
      "Responsibility Alignment Diagnostics",
    ],
    boundaryReminder:
      "The issue is not whether a tool or system saves effort. The issue is where remaining cost becomes visible, hidden, displaced, or absorbed.",
    minimalFormula: "visible cost != total cost",
  },
  {
    id: "description-cannot-carry-pressure",
    title: "Description Cannot Carry the New Pressure",
    category: "Description / framework strain",
    observedProblem:
      "An old description still exists, but it no longer seems able to describe the new condition adequately.",
    possibleStructures: [
      "descriptive carrying failure",
      "framework strain",
      "interpretive load",
      "visible continuity != functional adequacy",
    ],
    readNext: [
      "Descriptive Carrying Failure",
      "Semantic Pressure",
      "Reality Consistency Model",
    ],
    boundaryReminder:
      "This does not mean every old term is obsolete. It applies when a descriptive framework remains recognizable while losing carrying capacity under new structural load.",
    minimalFormula: "visible continuity != functional adequacy",
  },
];
