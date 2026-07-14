import type { Connector, NormalizedJob, SourceRow } from "../types";

/**
 * Sample connector: deterministic fixture data modeled on real Qatar listings.
 *
 * Purpose:
 *  1. Proves the full pipeline (ingest → dedupe → API → UI) without external
 *     network access — useful for local dev, demos, and CI.
 *  2. Serves as the reference implementation for writing new connectors.
 *
 * Posted dates are generated relative to "now" (spread over the last ~70
 * days) so the 2-month freshness window and expiry logic get exercised:
 * a few listings intentionally fall outside the window and must be skipped.
 */

interface Fixture {
  title: string;
  company: string;
  city: string;
  category?: string;
  jobType?: NormalizedJob["jobType"];
  daysAgo: number;
  salary?: [number, number];
  description: string;
}

const FIXTURES: Fixture[] = [
  { title: "Senior Civil Engineer", company: "Qatar Building Company", city: "Doha", daysAgo: 1, salary: [18000, 24000], description: "Lead structural design reviews for infrastructure projects across Doha. 8+ years experience in civil engineering, chartered status preferred. Salary QAR 18,000 - 24,000 per month plus housing allowance." },
  { title: "Front Desk Receptionist", company: "Katara Hospitality", city: "Doha", daysAgo: 2, jobType: "full-time", description: "Guest-facing role at a 5-star property on the Corniche. Fluent English required, Arabic a plus. Fresh graduates welcome. Shift work including weekends." },
  { title: "Process Engineer - LNG", company: "QatarEnergy LNG", city: "Ras Laffan", daysAgo: 2, salary: [22000, 30000], description: "Process engineering support for LNG train operations at Ras Laffan Industrial City. 5-10 years in oil & gas processing. QAR 22,000 - 30,000 monthly, rotational schedule available." },
  { title: "Full Stack Developer (Node.js/React)", company: "Snoonu", city: "Doha", daysAgo: 3, salary: [14000, 20000], description: "Build delivery platform features with Node.js, React and PostgreSQL. 3+ years experience. Hybrid work from our Doha office. QAR 14,000 - 20,000 per month." },
  { title: "Registered Nurse - ICU", company: "Hamad Medical Corporation", city: "Doha", daysAgo: 3, description: "ICU nursing position at Hamad General Hospital. DHP license or eligibility required, minimum 2 years ICU experience. Accommodation and transport provided." },
  { title: "HVAC Technician", company: "Al Jaber Engineering", city: "Al Wakrah", daysAgo: 4, jobType: "contract", description: "Install and maintain HVAC systems on commercial sites in Al Wakrah. 12-month renewable contract. ITI/diploma with 3+ years GCC experience." },
  { title: "Head Chef - Italian Cuisine", company: "The Ned Doha", city: "Doha", daysAgo: 5, salary: [15000, 18000], description: "Lead the Italian kitchen brigade. 10+ years culinary experience with 3 in a leadership role. QAR 15,000 - 18,000 monthly plus service charge." },
  { title: "Data Analyst", company: "Ooredoo Qatar", city: "Doha", daysAgo: 6, description: "Analyze customer and network data using SQL and Power BI. 2-4 years analytics experience. Telecom background preferred." },
  { title: "Heavy Truck Driver", company: "GWC Logistics", city: "Mesaieed", daysAgo: 6, description: "Qatar heavy license required, 3+ years experience with trailers. Routes between Mesaieed Industrial Area and Hamad Port. Overtime available." },
  { title: "English Teacher - Primary", company: "Doha British School", city: "Al Rayyan", daysAgo: 7, jobType: "full-time", description: "Primary English teacher for our Al Rayyan campus starting next term. B.Ed or PGCE with 2+ years teaching experience. Flights, housing and tuition discount included." },
  { title: "Accountant", company: "Al Meera Consumer Goods", city: "Doha", daysAgo: 8, salary: [9000, 12000], description: "General ledger accounting, reconciliations and month-end close. CA/ACCA part-qualified, 3+ years experience. QAR 9,000 - 12,000 per month." },
  { title: "Safety Officer (NEBOSH)", company: "UrbaCon Trading & Contracting", city: "Lusail", daysAgo: 9, description: "Site HSE officer for a high-rise project in Lusail. NEBOSH IGC mandatory, 5+ years construction safety experience in GCC." },
  { title: "Marketing Executive", company: "Qatar Airways", city: "Doha", daysAgo: 10, description: "Plan and execute digital campaigns for cargo division. 2-3 years marketing experience, strong copywriting. Airline industry exposure a plus." },
  { title: "Electrician - Industrial", company: "Mekdam Technology", city: "Dukhan", daysAgo: 11, jobType: "contract", description: "Industrial electrical maintenance at Dukhan field facilities. 6-month contract, extendable. Trade certificate plus 4 years experience." },
  { title: "IT Support Specialist", company: "Qatar Foundation", city: "Doha", daysAgo: 12, description: "First and second line support for Education City campus. CompTIA A+/ITIL preferred. 1-3 years helpdesk experience." },
  { title: "Waiter / Waitress", company: "IHG Hotels Doha", city: "Doha", daysAgo: 13, jobType: "part-time", description: "Part-time F&B service staff for banquet events. Flexible shifts, meals and transport provided. Entry level - training given." },
  { title: "Procurement Officer", company: "Ashghal (Public Works Authority)", city: "Doha", daysAgo: 14, description: "Tendering and supplier management for public infrastructure projects. 4+ years procurement experience, CIPS preferred." },
  { title: "Mechanical Engineer - Rotating Equipment", company: "North Oil Company", city: "Al Khor", daysAgo: 15, salary: [20000, 26000], description: "Maintenance engineering for offshore rotating equipment, based Al Khor with offshore visits. 7+ years oil & gas. QAR 20,000 - 26,000 monthly." },
  { title: "Pharmacist", company: "Sidra Medicine", city: "Doha", daysAgo: 16, description: "Hospital pharmacist, DHP licensed. Pediatric hospital experience preferred. 2+ years post-registration." },
  { title: "Sales Associate - Luxury Retail", company: "Alfardan Group", city: "Doha", daysAgo: 18, description: "Client advisor for luxury watches at Place Vendôme mall in Lusail. 2+ years premium retail sales. Commission on top of base." },
  { title: "DevOps Engineer", company: "Vodafone Qatar", city: "Doha", daysAgo: 19, salary: [16000, 22000], description: "Kubernetes, Terraform and CI/CD pipeline ownership. 4+ years DevOps/SRE experience. QAR 16,000 - 22,000 per month." },
  { title: "Housekeeping Supervisor", company: "Rixos Gulf Hotel", city: "Doha", daysAgo: 21, description: "Supervise housekeeping team of 20. 3+ years hotel housekeeping with 1 year supervisory." },
  { title: "Quantity Surveyor", company: "Redco Construction", city: "Al Rayyan", daysAgo: 23, description: "BOQ preparation, variations and cost reporting for residential projects. BSc QS with 5+ years, RICS a plus." },
  { title: "Chief Financial Officer", company: "Confidential - Family Office", city: "Doha", daysAgo: 25, salary: [45000, 60000], description: "CFO for a diversified Qatari family office. 15+ years senior finance leadership in GCC. QAR 45,000 - 60,000 monthly package." },
  { title: "Radiographer", company: "Al Ahli Hospital", city: "Doha", daysAgo: 27, description: "CT/MRI radiographer, DHP license required. 3+ years hospital imaging experience." },
  { title: "Forklift Operator", company: "Milaha Logistics", city: "Mesaieed", daysAgo: 29, jobType: "contract", description: "Container yard forklift operations. Valid Qatar forklift license, 2+ years. 12-month contract with renewal." },
  { title: "HR Coordinator", company: "Msheireb Properties", city: "Doha", daysAgo: 31, description: "Onboarding, employee records and PRO coordination. 2-3 years HR experience in Qatar. Arabic/English bilingual preferred." },
  { title: "Barista", company: "Flat White Specialty Coffee", city: "Doha", daysAgo: 33, jobType: "part-time", description: "Specialty coffee barista, latte art skills welcome. Entry level, training provided. Part-time evening shifts." },
  { title: "Instrumentation Technician", company: "Qatar Aluminium (Qatalum)", city: "Mesaieed", daysAgo: 36, description: "Maintain instrumentation and control systems at the smelter. Diploma with 4+ years heavy industry experience." },
  { title: "Legal Counsel - Corporate", company: "Qatar National Bank", city: "Doha", daysAgo: 38, salary: [30000, 38000], description: "Corporate and banking law counsel. Qualified lawyer with 6+ years, banking sector experience essential. QAR 30,000 - 38,000 monthly." },
  { title: "Site Foreman - Roads", company: "Boom Construction", city: "Al Daayen", daysAgo: 41, description: "Supervise road works crews on Al Daayen infrastructure package. 6+ years roads experience in GCC." },
  { title: "Graphic Designer", company: "ILoveQatar Network", city: "Doha", daysAgo: 44, description: "Social-first design for Qatar's leading community platform. Portfolio required, 2+ years experience with Adobe CC and Figma." },
  { title: "Security Network Engineer", company: "Meeza QSTP", city: "Doha", daysAgo: 47, description: "Firewalls, IDS/IPS and SOC coordination for managed services clients. CCNP Security or equivalent, 5+ years." },
  { title: "Kindergarten Assistant", company: "Newton International School", city: "Al Wakrah", daysAgo: 50, jobType: "full-time", description: "Classroom assistant for KG section, Al Wakrah campus. CACHE Level 3 or equivalent, entry level welcome." },
  { title: "Logistics Coordinator", company: "Aramex Qatar", city: "Doha", daysAgo: 53, description: "Coordinate freight forwarding shipments and customs clearance. 2+ years logistics coordination in Qatar." },
  { title: "Senior Architect", company: "Arab Engineering Bureau", city: "Doha", daysAgo: 56, salary: [19000, 25000], description: "Design lead for hospitality and mixed-use projects. M.Arch with 8+ years, UPDA Grade A preferred. QAR 19,000 - 25,000 monthly." },
  { title: "Restaurant Manager", company: "Nobu Doha", city: "Doha", daysAgo: 58, description: "Run daily operations of a high-volume fine dining venue. 5+ years F&B management in luxury hospitality." },
  // Intentionally outside the 60-day freshness window — pipeline must skip these.
  { title: "Office Boy", company: "Old Trading WLL", city: "Doha", daysAgo: 65, description: "Office support role. This listing is older than 2 months and should never appear in the feed." },
  { title: "Expired Sales Role", company: "Stale Jobs Co", city: "Doha", daysAgo: 80, description: "This listing is older than 2 months and should never appear in the feed." },
];

export const sampleConnector: Connector = {
  kind: "sample",

  async fetchJobs(source: SourceRow): Promise<NormalizedJob[]> {
    const base = source.base_url ?? "https://example-jobs.qa";
    return FIXTURES.map((f, i) => {
      const slug = f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const postedAt = new Date(Date.now() - f.daysAgo * 24 * 3600 * 1000);
      return {
        externalId: `sample-${i + 1}`,
        title: f.title,
        companyName: f.company,
        description: f.description,
        locationRaw: `${f.city}, Qatar`,
        locationCity: f.city,
        jobType: f.jobType ?? "full-time",
        category: f.category,
        salaryMin: f.salary?.[0],
        salaryMax: f.salary?.[1],
        applyUrl: `${base}/jobs/${slug}-${i + 1}`,
        postedAt,
      };
    });
  },
};
