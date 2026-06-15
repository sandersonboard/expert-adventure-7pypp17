/* Shared fixtures for the Sufficiency-at-Population prototype.
   Hardcoded — no backend, no network. Same numbers across all 3 options
   so the three views feel like the same product surface at the same moment. */

const CUSTOMER = {
  name: "Helios Robotics, Inc.",
  stage: "Pre-IPO · S-1 target Q1 2027",
  auditor: "Deloitte & Touche LLP",
  cycle: "Q3 2026",
  cycleStart: "2026-07-01",
  cycleEnd: "2026-09-30",
  closeDate: "2026-10-15",
  daysToClose: 18,
};

const TOTALS = {
  controls: 187,
  evidenceItems: 2847,
  flaggedForReview: 2847,
  autoDispositionedSufficient: 1899,
  autoDispositionedInsufficient: 384,
  needsHumanReview: 564,
  autoConfidenceThreshold: 0.82,
};

const REVIEWERS = [
  { id: "rev-001", name: "Sarah Kim",       title: "Internal Audit Lead",    initials: "SK" },
  { id: "rev-002", name: "David Park",      title: "Senior Auditor",         initials: "DP" },
  { id: "rev-003", name: "Priya Anand",     title: "Senior Auditor",         initials: "PA" },
  { id: "rev-004", name: "Tomás Rivera",    title: "Audit Manager",          initials: "TR" },
  { id: "rev-005", name: "Helen Wang",      title: "SOX Program Manager",    initials: "HW" },
  { id: "rev-006", name: "Jordan Mbeki",    title: "External Audit Liaison", initials: "JM" },
];

const OWNERS = [
  { id: "own-001", name: "Marcus Chen",     team: "IT Operations" },
  { id: "own-002", name: "Lena Brooks",     team: "IT Operations" },
  { id: "own-003", name: "Hiro Tanaka",     team: "IT Security" },
  { id: "own-004", name: "Ramona Diaz",     team: "IT Security" },
  { id: "own-005", name: "Aaron Whitfield", team: "Application Owners" },
  { id: "own-006", name: "Inés Carbajal",   team: "Application Owners" },
  { id: "own-007", name: "Devon Park",      team: "Revenue" },
  { id: "own-008", name: "Mei Sato",        team: "Revenue" },
  { id: "own-009", name: "Theodore Olufemi",team: "Revenue" },
  { id: "own-010", name: "Astrid Levin",    team: "Payroll" },
  { id: "own-011", name: "Carter Hsu",      team: "Payroll" },
  { id: "own-012", name: "Pavithra Iyer",   team: "Procurement" },
  { id: "own-013", name: "Quentin Ngo",     team: "Procurement" },
  { id: "own-014", name: "Brigitte Marsh",  team: "Treasury" },
  { id: "own-015", name: "Owen Sundaram",   team: "Treasury" },
  { id: "own-016", name: "Wendy Klein",     team: "Tax" },
  { id: "own-017", name: "Jamal Patel",     team: "Inventory" },
  { id: "own-018", name: "Esther Robles",   team: "Inventory" },
  { id: "own-019", name: "Niko Petrov",     team: "Financial Reporting" },
  { id: "own-020", name: "Felicity Vance",  team: "Financial Reporting" },
  { id: "own-021", name: "Cassius Wong",    team: "Financial Reporting" },
  { id: "own-022", name: "Ravi Mehta",      team: "Entity-Level" },
  { id: "own-023", name: "Sloane Bauer",    team: "Entity-Level" },
  { id: "own-024", name: "Yusuke Aoki",     team: "HR" },
];

const DOMAINS = [
  { id: "itgc",      label: "IT General Controls",  controlCount: 32 },
  { id: "revenue",   label: "Revenue",              controlCount: 27 },
  { id: "payroll",   label: "Payroll",              controlCount: 18 },
  { id: "procure",   label: "Procurement",          controlCount: 19 },
  { id: "treasury",  label: "Treasury",             controlCount: 14 },
  { id: "tax",       label: "Tax",                  controlCount: 11 },
  { id: "inventory", label: "Inventory",            controlCount: 17 },
  { id: "finrep",    label: "Financial Reporting",  controlCount: 24 },
  { id: "entity",    label: "Entity-Level",         controlCount: 16 },
  { id: "hr",        label: "HR",                   controlCount: 9  },
];

/* A small set of named, realistic control templates the prototype actually shows
   in drill-downs. The 187 number refers to all controls; we render names for the
   ones users actually see. */
const CONTROLS = [
  { id: "ITGC-04",   domain: "itgc",     name: "Quarterly User Access Review — NetSuite ERP",         owner: "own-001", freq: "Q" },
  { id: "ITGC-07",   domain: "itgc",     name: "Privileged Access Review — Production AWS",            owner: "own-003", freq: "Q" },
  { id: "ITGC-12",   domain: "itgc",     name: "Change Approval Evidence — Core ERP releases",         owner: "own-005", freq: "M" },
  { id: "ITGC-18",   domain: "itgc",     name: "Backup Restoration Test — Financial systems",          owner: "own-002", freq: "Q" },
  { id: "ITGC-23",   domain: "itgc",     name: "New Hire / Termination Access Provisioning Log",       owner: "own-024", freq: "M" },
  { id: "ITGC-31",   domain: "itgc",     name: "Database Schema Change Approvals",                     owner: "own-005", freq: "M" },
  { id: "REV-02",    domain: "revenue",  name: "Revenue Recognition Cutoff Review",                    owner: "own-007", freq: "M" },
  { id: "REV-05",    domain: "revenue",  name: "Contract Modification Approval — ASC 606",             owner: "own-008", freq: "M" },
  { id: "REV-11",    domain: "revenue",  name: "Deferred Revenue Reconciliation",                      owner: "own-009", freq: "M" },
  { id: "REV-14",    domain: "revenue",  name: "SSP Allocation Review (Multi-Element Arrangements)",   owner: "own-008", freq: "Q" },
  { id: "PAY-03",    domain: "payroll",  name: "Payroll Register vs GL Reconciliation",                owner: "own-010", freq: "M" },
  { id: "PAY-08",    domain: "payroll",  name: "Termination Pay Authorization",                        owner: "own-011", freq: "M" },
  { id: "PRC-04",    domain: "procure",  name: "Three-Way Match Exception Review",                     owner: "own-012", freq: "M" },
  { id: "PRC-09",    domain: "procure",  name: "Vendor Master File Change Approval",                   owner: "own-013", freq: "M" },
  { id: "TRE-02",    domain: "treasury", name: "Bank Reconciliation — Operating Accounts",             owner: "own-014", freq: "M" },
  { id: "TRE-06",    domain: "treasury", name: "Wire Transfer Dual Authorization",                     owner: "own-015", freq: "M" },
  { id: "TAX-04",    domain: "tax",      name: "Sales Tax Nexus Determination",                        owner: "own-016", freq: "Q" },
  { id: "INV-03",    domain: "inventory",name: "Cycle Count Variance Investigation",                   owner: "own-017", freq: "M" },
  { id: "INV-07",    domain: "inventory",name: "Inventory Obsolescence Reserve Review",                owner: "own-018", freq: "Q" },
  { id: "FR-02",     domain: "finrep",   name: "Journal Entry Review > $250K",                         owner: "own-019", freq: "M" },
  { id: "FR-06",     domain: "finrep",   name: "Balance Sheet Account Reconciliations",                owner: "own-020", freq: "M" },
  { id: "FR-09",     domain: "finrep",   name: "Material Estimate Review — Warranty Reserve",          owner: "own-021", freq: "Q" },
  { id: "ENT-03",    domain: "entity",   name: "Board Audit Committee Minutes Attestation",            owner: "own-022", freq: "Q" },
  { id: "ENT-07",    domain: "entity",   name: "Whistleblower Hotline Activity Review",                owner: "own-023", freq: "Q" },
];

/* AI-detected sufficiency failure patterns. Counts roughly sum to 2,520;
   the remaining ~327 are unclustered one-offs. */
const CLUSTERS = [
  {
    id: "cl-uar-approver",
    name: "UAR evidence missing approver name field",
    count: 287,
    severity: "high",
    confidence: 0.94,
    affectedControls: ["ITGC-04", "ITGC-07", "ITGC-23"],
    detectedAt: "2026-09-28T08:14:00Z",
    rationale: "287 user-access-review extracts from NetSuite, AWS, Salesforce and Snowflake are missing the 'approver_name' column. Header row exists but the field is blank. Pattern matches Q2 cycle where the export template was rolled back to a pre-2025 schema.",
    suggestedAction: "Request re-export from owners using the approved Q3 schema (template ID: UAR-EXPORT-2026Q1).",
    impact: "Affects testing for 14 ITGC controls. Without approver attribution, evidence fails PCAOB §AS 2201 .B7.",
  },
  {
    id: "cl-coverage-gap",
    name: "Coverage period stops mid-quarter (9/24 instead of 9/30)",
    count: 244,
    severity: "high",
    confidence: 0.91,
    affectedControls: ["REV-02", "REV-11", "PAY-03", "PRC-04", "TRE-02"],
    detectedAt: "2026-09-29T11:02:00Z",
    rationale: "244 evidence files have coverage ending 2026-09-24 rather than the 2026-09-30 fiscal cutoff. Likely the same date-picker default was used across owners in the last close ceremony. 6 days of activity not covered.",
    suggestedAction: "Auto-generate remediation requests with corrected date range (07-01 → 09-30).",
    impact: "Coverage gap creates a population-completeness exception. Could be cited as scope limitation.",
  },
  {
    id: "cl-scanned-pdf",
    name: "Scanned-PDF evidence — text extraction failed",
    count: 312,
    severity: "medium",
    confidence: 0.88,
    affectedControls: ["FR-02", "FR-06", "TRE-06", "PRC-09"],
    detectedAt: "2026-09-27T22:31:00Z",
    rationale: "312 PDFs uploaded across the cycle contain only embedded images, no extractable text. AI cannot confirm field-level sufficiency without OCR. Mostly bank-statement and journal-entry uploads where owners scanned printouts.",
    suggestedAction: "Run OCR pass + flag any that fail OCR for owner re-upload of native PDF.",
    impact: "Blocks AI-assisted review. Currently routed to manual queue (1.3 hrs each at current pace).",
  },
  {
    id: "cl-stale-60d",
    name: "Evidence > 60 days old at submission",
    count: 218,
    severity: "medium",
    confidence: 0.97,
    affectedControls: ["PAY-08", "PRC-04", "INV-03", "INV-07"],
    detectedAt: "2026-09-25T09:00:00Z",
    rationale: "218 items have a file last-modified date more than 60 days before the testing window. Several appear copied forward from Q2 close without re-generation.",
    suggestedAction: "Require owners to re-generate and re-upload with current timestamp.",
    impact: "Stale evidence does not satisfy operating-effectiveness testing. High residual risk.",
  },
  {
    id: "cl-blank-rows",
    name: "Spreadsheet with blank-row gaps in body",
    count: 156,
    severity: "high",
    confidence: 0.89,
    affectedControls: ["ITGC-04", "ITGC-23", "PAY-03"],
    detectedAt: "2026-09-26T13:48:00Z",
    rationale: "156 Excel files have continuous blank rows in the data body (typically rows 203–1,700). Pattern matches the 'Active users only' filter being preserved through export — inactive rows look like data gaps.",
    suggestedAction: "Confirm filter intent with owner; if intentional, request filter-disclosure note. Otherwise re-export.",
    impact: "Population completeness questioned. AI cannot distinguish 'filtered out' from 'missing'.",
  },
  {
    id: "cl-wrong-quarter",
    name: "File covers wrong fiscal quarter (Q4'25 instead of Q3'26)",
    count: 178,
    severity: "high",
    confidence: 0.93,
    affectedControls: ["REV-02", "PRC-04", "PAY-03", "TAX-04"],
    detectedAt: "2026-09-24T16:21:00Z",
    rationale: "178 files have date columns or headers indicating Q4 2025. Owners likely used the 'last cycle' filter as a starting point and didn't update.",
    suggestedAction: "Reject + request corrected period. Auto-attach previous quarter's submission for owner reference.",
    impact: "Submitted-evidence-does-not-match-period is an immediate kick-back. Worst case for cycle velocity.",
  },
  {
    id: "cl-no-segregation",
    name: "Approver equals preparer (SOD violation)",
    count: 89,
    severity: "high",
    confidence: 0.96,
    affectedControls: ["FR-02", "FR-06", "PRC-09", "TRE-06"],
    detectedAt: "2026-09-29T07:55:00Z",
    rationale: "89 evidence items have identical preparer and approver names. Typically self-approved JEs or wire-transfer authorizations. SOD failure on its face.",
    suggestedAction: "Route to control owner + IA for remediation. Likely requires retroactive secondary approval.",
    impact: "Direct deficiency candidate. PCAOB §AS 2110 .69(c) — segregation as compensating control.",
  },
  {
    id: "cl-mismatched-control",
    name: "Control ID in filename ≠ control ID in metadata",
    count: 134,
    severity: "low",
    confidence: 0.82,
    affectedControls: ["ITGC-04", "ITGC-12", "REV-05"],
    detectedAt: "2026-09-27T10:12:00Z",
    rationale: "134 uploads have a filename indicating one control (e.g., 'UAR-Q3-ITGC04') but the upload form attached them to a different control. Usually copy/paste error.",
    suggestedAction: "Auto-suggest re-attachment to the named control. Soft-fail; owner confirms.",
    impact: "Low — cosmetic if files are correct. Audit trail clarity issue only.",
  },
  {
    id: "cl-missing-supporting",
    name: "Primary evidence present, supporting attachment missing",
    count: 167,
    severity: "medium",
    confidence: 0.85,
    affectedControls: ["REV-05", "REV-14", "FR-09", "ENT-03"],
    detectedAt: "2026-09-28T15:37:00Z",
    rationale: "167 controls require both a primary artifact (e.g., approval form) and supporting docs (e.g., backup calculation). Primary uploaded, supporting absent. Pattern: owner believed primary was sufficient.",
    suggestedAction: "Request supporting attachment. Surface the control's full evidence checklist to owner.",
    impact: "Incomplete evidence packet. Reviewer cannot test fully.",
  },
  {
    id: "cl-tampered-after",
    name: "File modified after period close",
    count: 71,
    severity: "high",
    confidence: 0.99,
    affectedControls: ["FR-02", "FR-06", "PRC-04"],
    detectedAt: "2026-09-30T18:09:00Z",
    rationale: "71 files have a 'last modified' timestamp after 2026-09-30 23:59. Likely benign re-saves (PDF re-printed locally) but cannot be confirmed without chain-of-custody attestation.",
    suggestedAction: "Require chain-of-custody attestation or original-version re-upload.",
    impact: "Audit-evidence-integrity question. External auditor may require restated artifact.",
  },
  {
    id: "cl-small-file",
    name: "Excel file suspiciously small (<5KB)",
    count: 58,
    severity: "low",
    confidence: 0.78,
    affectedControls: ["ITGC-04", "ITGC-07", "PAY-03"],
    detectedAt: "2026-09-26T08:44:00Z",
    rationale: "58 .xlsx uploads are under 5KB. Often template files saved with no data, or a tab-only with headers.",
    suggestedAction: "Confirm with owner; auto-suggest re-export with populated data.",
    impact: "Likely empty-evidence — gap in operating-effectiveness coverage.",
  },
  {
    id: "cl-date-format",
    name: "Date format ambiguity (DD/MM vs MM/DD)",
    count: 142,
    severity: "low",
    confidence: 0.74,
    affectedControls: ["TAX-04", "TRE-02", "REV-02", "PRC-04"],
    detectedAt: "2026-09-29T14:15:00Z",
    rationale: "142 files contain dates that could be either format. Most likely from owners in EMEA/APAC offices uploading using locale defaults. Cannot determine period scope until owner clarifies.",
    suggestedAction: "Request explicit ISO-8601 dates or owner attestation of format.",
    impact: "Reviewer cannot confirm period scope unaided. Sufficiency judgment blocked.",
  },
  {
    id: "cl-naming",
    name: "Filename violates naming convention",
    count: 198,
    severity: "low",
    confidence: 0.99,
    affectedControls: ["ITGC-04", "PAY-03", "PRC-04", "REV-02", "FR-06"],
    detectedAt: "2026-09-22T11:00:00Z",
    rationale: "198 files don't follow the policy: <CTRL-ID>_<PERIOD>_<DESCRIPTOR>.<ext>. Mostly cosmetic but signals lack of process discipline.",
    suggestedAction: "Auto-rename with policy convention. Notify owners of convention.",
    impact: "Low — but auditor pattern recognition flags loose process as elevated risk.",
  },
  {
    id: "cl-no-period",
    name: "No fiscal-period indicator in document body",
    count: 266,
    severity: "medium",
    confidence: 0.86,
    affectedControls: ["REV-14", "FR-06", "ENT-03", "ENT-07"],
    detectedAt: "2026-09-23T17:22:00Z",
    rationale: "266 documents contain no header, footer, or metadata indicating the fiscal period. Cannot be authoritatively tied to Q3'26 without owner confirmation, even if filename suggests it.",
    suggestedAction: "Require owner to add period header / re-export with template footer.",
    impact: "Soft sufficiency gap — tie-back to period requires owner attestation today.",
  },
];

/* Generate a small set of representative evidence items for any given cluster.
   Used by drill-downs. Deterministic — same input always yields same output. */
function sampleEvidence(cluster, n = 6) {
  const items = [];
  const ctrls = cluster.affectedControls;
  for (let i = 0; i < n; i++) {
    const ctrlId = ctrls[i % ctrls.length];
    const ctrl = CONTROLS.find(c => c.id === ctrlId) || CONTROLS[0];
    const owner = OWNERS.find(o => o.id === ctrl.owner) || OWNERS[0];
    const evNum = (cluster.id.length * 17 + i * 113) % 9000 + 1000;
    items.push({
      id: `EV-2026Q3-${evNum}`,
      controlId: ctrl.id,
      controlName: ctrl.name,
      filename: `${ctrl.id}_2026Q3_${(cluster.id.split('-')[1] || 'evidence')}_${String(i+1).padStart(2,'0')}.${i % 3 === 0 ? 'xlsx' : (i % 3 === 1 ? 'pdf' : 'csv')}`,
      submittedBy: owner.name,
      submittedTeam: owner.team,
      submittedAt: `2026-09-${10 + (i*3) % 19} ${String(8 + (i*7) % 9).padStart(2,'0')}:${String((i*13) % 60).padStart(2,'0')}`,
      sizeKb: cluster.id === "cl-small-file" ? 3 + (i % 4) : 28 + ((i*97) % 380),
      gapDetail: cluster.rationale.split(".")[0],
      confidence: Math.min(0.99, cluster.confidence + ((i % 5) - 2) * 0.01),
    });
  }
  return items;
}

/* Auto-disposition log entries for option 2. Static realistic samples that
   blend AI-sufficient, AI-insufficient (obvious), and human-required cases. */
const AUTO_LOG = [
  { ts: "09:42:17", control: "ITGC-04", evidence: "EV-Q3-7841", decision: "sufficient",   confidence: 0.96, rationale: "All 5 required fields present; period coverage 2026-07-01 → 2026-09-30; approver != preparer; signatures match approver registry." },
  { ts: "09:42:14", control: "REV-02",  evidence: "EV-Q3-7840", decision: "insufficient", confidence: 0.92, rationale: "Coverage period ends 2026-09-24, missing final 6 days of quarter. Pattern matches cluster cl-coverage-gap." },
  { ts: "09:42:11", control: "ITGC-07", evidence: "EV-Q3-7839", decision: "needs_review", confidence: 0.71, rationale: "Borderline — approver name field present but signature appears stamped, not handwritten. Recommend human review for assertion." },
  { ts: "09:42:08", control: "PAY-03",  evidence: "EV-Q3-7838", decision: "sufficient",   confidence: 0.98, rationale: "Reconciliation balanced ($0 variance); period matches; two-party sign-off present; supporting GL extract attached." },
  { ts: "09:42:05", control: "PRC-04",  evidence: "EV-Q3-7837", decision: "insufficient", confidence: 0.89, rationale: "Three-way match output shows 17 unresolved exceptions; no exception-disposition log attached." },
  { ts: "09:42:01", control: "FR-02",   evidence: "EV-Q3-7836", decision: "sufficient",   confidence: 0.93, rationale: "JE > $250K with documented business rationale; approver = CFO designee; supporting calculation tab populated." },
  { ts: "09:41:58", control: "TRE-06",  evidence: "EV-Q3-7835", decision: "insufficient", confidence: 0.99, rationale: "Wire authorization shows single approver (J. Pavelka). SOD violation — dual auth required for amounts > $50K. Matches cluster cl-no-segregation." },
  { ts: "09:41:54", control: "ITGC-12", evidence: "EV-Q3-7834", decision: "sufficient",   confidence: 0.85, rationale: "Change-approval ticket links to PR; PR approver registered as IT change-board member; deployment window matches CAB-approved schedule." },
  { ts: "09:41:51", control: "ITGC-23", evidence: "EV-Q3-7833", decision: "needs_review", confidence: 0.68, rationale: "Termination provisioning log shows 4 records — 3 IT confirmations, 1 missing IT confirmation. Could be timing or genuine gap." },
  { ts: "09:41:47", control: "REV-05",  evidence: "EV-Q3-7832", decision: "sufficient",   confidence: 0.91, rationale: "Contract modification with documented SSP re-allocation; both parties signed; revenue impact reconciles to ledger." },
  { ts: "09:41:43", control: "INV-03",  evidence: "EV-Q3-7831", decision: "insufficient", confidence: 0.94, rationale: "Cycle count variance > 2% threshold but no investigation disposition documented. Matches control's failure criteria." },
  { ts: "09:41:39", control: "PAY-08",  evidence: "EV-Q3-7830", decision: "sufficient",   confidence: 0.97, rationale: "Termination pay calculation matches HRIS final-pay table; manager and HR business partner both attested; severance follows policy ceiling." },
  { ts: "09:41:35", control: "REV-11",  evidence: "EV-Q3-7829", decision: "needs_review", confidence: 0.74, rationale: "Deferred revenue rollforward shows $1.2M unexplained variance vs. prior quarter close balance. Auto-judgment uncertain — escalate." },
  { ts: "09:41:31", control: "FR-06",   evidence: "EV-Q3-7828", decision: "sufficient",   confidence: 0.88, rationale: "All 14 balance sheet accounts reconciled; preparer-reviewer separation maintained; aging on AR/AP within policy bands." },
  { ts: "09:41:27", control: "ITGC-18", evidence: "EV-Q3-7827", decision: "insufficient", confidence: 0.96, rationale: "Backup restoration test log exists but post-restoration data-integrity check was skipped (field blank). Test incomplete." },
  { ts: "09:41:23", control: "ENT-03",  evidence: "EV-Q3-7826", decision: "sufficient",   confidence: 0.99, rationale: "Audit Committee minutes signed; attendance quorum met; SOX deficiency review item recorded." },
  { ts: "09:41:19", control: "TAX-04",  evidence: "EV-Q3-7825", decision: "needs_review", confidence: 0.66, rationale: "Sales-tax nexus analysis added 3 new states this quarter — auto-confidence below threshold given material expansion. Recommend human review." },
  { ts: "09:41:15", control: "PRC-09",  evidence: "EV-Q3-7824", decision: "sufficient",   confidence: 0.90, rationale: "Vendor master change shows new vendor onboarded with W-9, EIN match, and dual-approval workflow." },
  { ts: "09:41:11", control: "FR-09",   evidence: "EV-Q3-7823", decision: "insufficient", confidence: 0.87, rationale: "Warranty reserve estimate uses Q2 historical claims rate — Q3 claims data exists but was not factored. Estimate stale by 11 weeks." },
  { ts: "09:41:07", control: "REV-14",  evidence: "EV-Q3-7822", decision: "sufficient",   confidence: 0.93, rationale: "Multi-element arrangement SSP allocation across 4 elements; documented methodology consistent with policy CON-REV-12; calculations tie to contract." },
];

/* Heatmap state for option 3. Renders ~50 controls × 12 months.
   States: g=sufficient, y=borderline, o=insufficient, r=escalated, x=no-evidence, _=not-required-period. */
const HEATMAP_CONTROLS = [
  // ITGC domain
  { id: "ITGC-04",  name: "Quarterly User Access Review — NetSuite ERP",        domain: "itgc",     row: "g g g y g y g g _ y _ o" },
  { id: "ITGC-07",  name: "Privileged Access Review — Production AWS",           domain: "itgc",     row: "g g g g g y g g _ g _ o" },
  { id: "ITGC-12",  name: "Change Approval Evidence — Core ERP releases",        domain: "itgc",     row: "g g g g g g g y g g g y" },
  { id: "ITGC-18",  name: "Backup Restoration Test — Financial systems",         domain: "itgc",     row: "_ g _ _ g _ _ g _ _ y _" },
  { id: "ITGC-23",  name: "New Hire / Termination Access Provisioning Log",      domain: "itgc",     row: "g g g g y g g g g g g r" },
  { id: "ITGC-31",  name: "Database Schema Change Approvals",                    domain: "itgc",     row: "g g y g g g g g y g g o" },

  // Revenue
  { id: "REV-02",   name: "Revenue Recognition Cutoff Review",                   domain: "revenue",  row: "g g g g g g g g g g g r" },
  { id: "REV-05",   name: "Contract Modification Approval — ASC 606",            domain: "revenue",  row: "g g g g g y g g g g g o" },
  { id: "REV-11",   name: "Deferred Revenue Reconciliation",                     domain: "revenue",  row: "g g g g g g g g g g g y" },
  { id: "REV-14",   name: "SSP Allocation Review (Multi-Element Arrangements)",  domain: "revenue",  row: "_ g _ _ y _ _ g _ _ o _" },

  // Payroll
  { id: "PAY-03",   name: "Payroll Register vs GL Reconciliation",               domain: "payroll",  row: "g g g g g g g g g g g r" },
  { id: "PAY-08",   name: "Termination Pay Authorization",                       domain: "payroll",  row: "g g g g g g g g g g g g" },

  // Procurement
  { id: "PRC-04",   name: "Three-Way Match Exception Review",                    domain: "procure",  row: "g y g g g g g g g g g r" },
  { id: "PRC-09",   name: "Vendor Master File Change Approval",                  domain: "procure",  row: "g g g g g g g g g g g y" },

  // Treasury
  { id: "TRE-02",   name: "Bank Reconciliation — Operating Accounts",            domain: "treasury", row: "g g g g g g g g g g g o" },
  { id: "TRE-06",   name: "Wire Transfer Dual Authorization",                    domain: "treasury", row: "g g g g g g g g g g g r" },

  // Tax
  { id: "TAX-04",   name: "Sales Tax Nexus Determination",                       domain: "tax",      row: "_ _ g _ _ y _ _ g _ _ y" },

  // Inventory
  { id: "INV-03",   name: "Cycle Count Variance Investigation",                  domain: "inventory",row: "g g g g g g g g g g g o" },
  { id: "INV-07",   name: "Inventory Obsolescence Reserve Review",               domain: "inventory",row: "_ _ g _ _ g _ _ g _ _ y" },

  // Financial Reporting
  { id: "FR-02",    name: "Journal Entry Review > $250K",                        domain: "finrep",   row: "g g g g g g g g g g g r" },
  { id: "FR-06",    name: "Balance Sheet Account Reconciliations",               domain: "finrep",   row: "g g g g g g g g g g g o" },
  { id: "FR-09",    name: "Material Estimate Review — Warranty Reserve",         domain: "finrep",   row: "_ _ g _ _ g _ _ g _ _ o" },

  // Entity-Level
  { id: "ENT-03",   name: "Board Audit Committee Minutes Attestation",           domain: "entity",   row: "_ _ g _ _ g _ _ g _ _ g" },
  { id: "ENT-07",   name: "Whistleblower Hotline Activity Review",               domain: "entity",   row: "_ _ g _ _ g _ _ g _ _ y" },
];

const HEATMAP_MONTHS = ["Oct'25","Nov'25","Dec'25","Jan'26","Feb'26","Mar'26","Apr'26","May'26","Jun'26","Jul'26","Aug'26","Sep'26"];

const HEATMAP_LEGEND = {
  g: { label: "Sufficient",   bg: "var(--luna-green-400)", text: "#fff" },
  y: { label: "Borderline",   bg: "var(--luna-yellow-400)", text: "var(--luna-gray-900)" },
  o: { label: "Insufficient", bg: "var(--luna-orange-400)", text: "#fff" },
  r: { label: "Escalated",    bg: "var(--luna-red-500)",    text: "#fff" },
  x: { label: "No evidence",  bg: "var(--luna-gray-300)",   text: "var(--luna-gray-700)" },
  _: { label: "Not in period",bg: "var(--luna-gray-100)",   text: "var(--luna-gray-400)" },
};

/* Drift callouts for option 3's "What changed in the last 24h" panel */
const DRIFT_24H = [
  { ts: "21 min ago",  text: "TRE-02 reverted from green → orange",         detail: "New evidence submitted by O. Sundaram (Treasury) — coverage period ends 9/24 not 9/30. Matches cluster cl-coverage-gap." },
  { ts: "2 hrs ago",   text: "FR-02 escalated → red",                       detail: "Journal entry approval shows preparer == approver (Niko Petrov). SOD violation cluster cl-no-segregation." },
  { ts: "3 hrs ago",   text: "ITGC-23 moved from green → red",              detail: "Termination provisioning record found with no IT confirmation. Single record, but auto-elevated given Q3 close proximity." },
  { ts: "Yesterday",   text: "Revenue domain rolled up to amber",            detail: "REV-02/-05/-11/-14 collectively pulled to 87% sufficiency vs. 96% prior week. Driven primarily by the 9/24 coverage cluster." },
  { ts: "Yesterday",   text: "ENT-07 borderline — first time this cycle",    detail: "Whistleblower hotline log is current but missing the IA review attestation signature. Routine fix." },
];

/* Today's auto-disposition summary for option 2's right rail */
const TODAY_SUMMARY = {
  decisions: 142,
  autoSufficient: 98,
  autoInsufficient: 31,
  needsReview: 13,
  reversedByHuman: 4,
  avgConfidence: 0.88,
  topReasons: [
    { reason: "Coverage period gap",     count: 24 },
    { reason: "Missing supporting attach", count: 18 },
    { reason: "Approver field blank",     count: 15 },
    { reason: "SOD violation",            count: 9 },
  ],
};
