import express from "express";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import multer from "multer";
import { mkdirSync } from 'fs';
import { join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = join(__dirname, "data");
const LEADS_FILE = join(DATA_DIR, "leads.json");
const COMPLAINTS_FILE = join(DATA_DIR, "complaints.json");
const UPLOADS_DIR = join(DATA_DIR, "uploads");

app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// --- File uploads (complaint attachments) ---
// Ensure the uploads directory exists before multer writes to it.
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });


const uploadDir = process.env.VERCEL
  ? '/tmp/uploads'
  : join(process.cwd(), 'data/uploads');

mkdirSync(uploadDir, { recursive: true });

const ALLOWED_EXT = new Set([
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv",
  ".txt", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic"
]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/heic"
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // Random, safe filename; keep only a sanitized original extension.
    const ext = extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "");
    const safeExt = ALLOWED_EXT.has(ext) ? ext : "";
    const unique =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    cb(null, unique + safeExt);
  }
});

const uploadComplaint = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5 // max 5 attachments
  },
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const okExt = ALLOWED_EXT.has(ext);
    const okMime = ALLOWED_MIME.has(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    // Reject disallowed types without throwing a hard error.
    req.fileRejected = true;
    cb(null, false);
  }
});

// --- Content API: bilingual single source of truth for the page ---
const content = {
  pl: {
    nav: {
      brand: "BUSINESS ARCHITECT",
      links: [
        { label: "Usługi", href: "#enablement" },
        { label: "AI dla TSL", href: "#tsl" },
        { label: "Jak pracujemy", href: "#process" },
        { label: "O nas", href: "#about" },
        { label: "Kontakt", href: "#contact" }
      ],
      cta: "Bezpłatna konsultacja"
    },
    hero: {
      kicker: "ARCHITEKTURA SKUTECZNEJ ZMIANY.",
      title: "AI w codziennej pracy.",
      subtitle: "Od warsztatu do wdrożenia.",
      lead: "Architektura skutecznej zmiany.",
      ctaPrimary: "Bezpłatna konsultacja",
      ctaSecondary: "Program od 899 PLN"
    },
    enablement: {
      tag: "PROGRAM AI ENABLEMENT",
      title: "AI, które przydaje się w poniedziałek.",
      lead: "Praktycznie wdrażamy AI oparte na zadaniach i procesach Twojego zespołu.",
      cta: "Poznaj program",
      cards: [
        { title: "Dla kogo", text: "Dla zespołów rozpoczynających lub rozwijających pracę z AI." },
        { title: "Jak pracujemy", text: "Diagnoza potrzeb, warsztaty praktyczne, zadania i AI Challenge." },
        { title: "Co zostaje", text: "Przykłady zastosowań, materiały i rekomendacje dalszych działań." }
      ]
    },
    workshops: {
      title: "Wybierz, od czego zacząć.",
      offer: {
        name: "Warsztaty AI na start",
        price: "899 PLN",
        priceNote: "netto / uczestnika",
        duration: "8 godzin / do 15 osób",
        features: ["Wprowadzenie", "Prompt engineering", "Dokumenty", "Zadania spotkań", "Tool", "PowerPoint", "AI Challenge"]
      },
      org: {
        title: "AI w organizacji",
        steps: [
          { label: "Discovery", note: "Priorytety" },
          { label: "Warsztaty", note: "Umiejętności" },
          { label: "Ambasadorzy", note: "Wsparcie w firmie" },
          { label: "Pilotaż", note: "Konkretne procesy" },
          { label: "Zmiana", note: "Wspólny standard" }
        ]
      }
    },
    stats: [
      { value: "67%", label: "respondentów deklaruje oszczędność czasu dzięki AI", note: "Co najmniej 30 minut tygodniowo" },
      { value: "4,83/5", label: "Ocena trenerów", note: "" }
    ],
    tsl: {
      tag: "AI w TSL.",
      title: "Mniej ręcznej pracy. Więcej kontroli nad procesem.",
      lead: "Dedykowany program dla transportu, spedycji i logistyki.",
      cta: "Poznaj program dla TSL",
      phases: ["Diagnoza", "Priorytety", "Zespół", "Pilotaż", "Standard"]
    },
    process: {
      title: "Operacje nie mogą czekać.",
      subtitle: "Ręczna praca zabiera czas.",
      footer: "Najpierw proces i dane. Potem właściwe zastosowanie AI.",
      items: [
        { title: "Maile", text: "Wiele wątków i odpowiedzi." },
        { title: "Visibility", text: "Brak aktualnej informacji o przesyłce." },
        { title: "Raportowanie", text: "Ręczne zestawienia i pliki Excel." },
        { title: "Rozproszona wiedza", text: "Informacje w wielu miejscach." },
        { title: "Dokumenty", text: "Brak statusu dostawy." },
        { title: "Wiarygodność przewoźnika", text: "Weryfikacja dokumentów, ubezpieczeń i rejestracji." }
      ]
    },
    about: {
      tag: "O NAS",
      title: "Za Business Architect stoją praktycy.",
      text: "Łączymy doświadczenie w biznesie, procesach i technologii z praktycznym podejściem do zmiany. Specjalizujemy się w TSL — od operacji i analizy biznesowej po projekty wdrożeniowe i rozwój kompetencji AI.",
      cta: "Poznaj nas",
      people: [
        { name: "Dominika Przybysz", role: "" },
        { name: "Kacper Pilut", role: "" }
      ]
    },
    testimonials: {
      title: "Co mówią klienci",
      items: [
        { quote: "Miejsce na zatwierdzoną opinię klienta", author: "" },
        { quote: "Miejsce na zatwierdzoną opinię klienta", author: "" }
      ]
    },
    contact: {
      title: "Porozmawiajmy o Twojej firmie.",
      lead: "Zaczynamy od problemu, który chcesz rozwiązać.",
      cta: "Bezpłatna konsultacja",
      form: {
        name: "Imię i nazwisko",
        email: "E-mail",
        company: "Firma",
        companyOpt: "(opcjonalnie)",
        message: "Co chcesz rozwiązać?"
      }
    },
    footer: {
      brand: "BUSINESS ARCHITECT",
      owner: "Business Architect Dominika Przybysz",
      links: [
        { label: "Reklamacje", href: "/reklamacje" },
        { label: "Dostępność", href: "#contact" },
        { label: "Polityka prywatności", href: "/polityka-prywatnosci" }
      ]
    }
  },

  en: {
    nav: {
      brand: "BUSINESS ARCHITECT",
      links: [
        { label: "Services", href: "#enablement" },
        { label: "AI for TSL", href: "#tsl" },
        { label: "How we work", href: "#process" },
        { label: "About", href: "#about" },
        { label: "Contact", href: "#contact" }
      ],
      cta: "Free consultation"
    },
    hero: {
      kicker: "THE ARCHITECTURE OF EFFECTIVE CHANGE.",
      title: "AI in everyday work.",
      subtitle: "From workshop to rollout.",
      lead: "The architecture of effective change.",
      ctaPrimary: "Free consultation",
      ctaSecondary: "Program from 899 PLN"
    },
    enablement: {
      tag: "AI ENABLEMENT PROGRAM",
      title: "AI that pays off on Monday.",
      lead: "We implement AI in practice, based on your team's real tasks and processes.",
      cta: "Explore the program",
      cards: [
        { title: "Who it's for", text: "For teams starting out with AI or looking to grow their practice." },
        { title: "How we work", text: "Needs assessment, hands-on workshops, assignments and an AI Challenge." },
        { title: "What you keep", text: "Use-case examples, materials and recommendations for next steps." }
      ]
    },
    workshops: {
      title: "Choose where to start.",
      offer: {
        name: "AI kickoff workshop",
        price: "899 PLN",
        priceNote: "net / participant",
        duration: "8 hours / up to 15 people",
        features: ["Introduction", "Prompt engineering", "Documents", "Meeting tasks", "Tool", "PowerPoint", "AI Challenge"]
      },
      org: {
        title: "AI across the organization",
        steps: [
          { label: "Discovery", note: "Priorities" },
          { label: "Workshops", note: "Skills" },
          { label: "Ambassadors", note: "Internal support" },
          { label: "Pilot", note: "Specific processes" },
          { label: "Change", note: "A shared standard" }
        ]
      }
    },
    stats: [
      { value: "67%", label: "of respondents report saving time thanks to AI", note: "At least 30 minutes per week" },
      { value: "4.83/5", label: "Trainer rating", note: "" }
    ],
    tsl: {
      tag: "AI IN TSL.",
      title: "Less manual work. More control over the process.",
      lead: "A dedicated program for transport, forwarding and logistics.",
      cta: "Explore the TSL program",
      phases: ["Diagnosis", "Priorities", "Team", "Pilot", "Standard"]
    },
    process: {
      title: "Operations can't wait.",
      subtitle: "Manual work eats up time.",
      footer: "Process and data first. Then the right use of AI.",
      items: [
        { title: "Emails", text: "Many threads and replies." },
        { title: "Visibility", text: "No up-to-date information on a shipment." },
        { title: "Reporting", text: "Manual summaries and Excel files." },
        { title: "Scattered knowledge", text: "Information spread across many places." },
        { title: "Documents", text: "No delivery status." },
        { title: "Carrier reliability", text: "Verifying documents, insurance and registration." }
      ]
    },
    about: {
      tag: "ABOUT US",
      title: "Business Architect is built by practitioners.",
      text: "We combine experience in business, processes and technology with a practical approach to change. We specialize in TSL — from operations and business analysis to implementation projects and building AI skills.",
      cta: "Meet us",
      people: [
        { name: "Dominika Przybysz", role: "" },
        { name: "Kacper Pilut", role: "" }
      ]
    },
    testimonials: {
      title: "What clients say",
      items: [
        { quote: "Space for an approved client testimonial", author: "" },
        { quote: "Space for an approved client testimonial", author: "" }
      ]
    },
    contact: {
      title: "Let's talk about your company.",
      lead: "We start from the problem you want to solve.",
      cta: "Free consultation",
      form: {
        name: "Full name",
        email: "Email",
        company: "Company",
        companyOpt: "(optional)",
        message: "What would you like to solve?"
      }
    },
    footer: {
      brand: "BUSINESS ARCHITECT",
      owner: "Business Architect Dominika Przybysz",
      links: [
        { label: "Complaints", href: "/complaints" },
        { label: "Accessibility", href: "#contact" },
        { label: "Privacy policy", href: "/privacy-policy" }
      ]
    }
  }
};

app.get("/api/content", (req, res) => {
  const lang = req.query.lang === "en" ? "en" : "pl";
  res.json(content[lang]);
});

// --- Lead capture (contact form) ---
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readLeads() {
  try {
    const raw = await readFile(LEADS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

app.post("/api/contact", async (req, res) => {
  const { name, email, company, message } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ ok: false, error: "Podaj imię i nazwisko." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Podaj poprawny adres e-mail." });
  }
  if (!message || typeof message !== "string" || message.trim().length < 5) {
    return res.status(400).json({ ok: false, error: "Opisz krótko, co chcesz rozwiązać." });
  }

  const lead = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: name.trim(),
    email: email.trim(),
    company: typeof company === "string" ? company.trim() : "",
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    await mkdir(DATA_DIR, { recursive: true });
    const leads = await readLeads();
    leads.push(lead);
    await writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist lead:", err);
    return res.status(500).json({ ok: false, error: "Błąd serwera. Spróbuj ponownie." });
  }

  res.status(201).json({ ok: true, message: "Dziękujemy! Odezwiemy się wkrótce.", id: lead.id });
});

// Simple admin endpoint to review captured leads
app.get("/api/leads", async (req, res) => {
  const leads = await readLeads();
  res.json({ count: leads.length, leads });
});

// --- Complaints (Reklamacje) ---
async function readComplaints() {
  try {
    const raw = await readFile(COMPLAINTS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Wrap multer so its errors (file too large, too many files) become clean
// JSON responses instead of crashing the request.
function complaintUpload(req, res, next) {
  uploadComplaint.array("attachments", 5)(req, res, (err) => {
    if (err) {
      const lang = req.query.lang === "en" ? "en" : "pl";
      let msg =
        lang === "en" ? "Could not upload the files." : "Nie udało się wgrać plików.";
      if (err.code === "LIMIT_FILE_SIZE") {
        msg =
          lang === "en"
            ? "A file is too large (max 10 MB each)."
            : "Plik jest za duży (maks. 10 MB każdy).";
      } else if (err.code === "LIMIT_FILE_COUNT") {
        msg =
          lang === "en"
            ? "Too many files (max 5)."
            : "Za dużo plików (maks. 5).";
      }
      return res.status(400).json({ ok: false, error: msg });
    }
    next();
  });
}

app.post("/api/complaint", complaintUpload, async (req, res) => {
  const { name, email, service, dueDate, situation, expected } = req.body || {};
  const lang = req.query.lang === "en" ? "en" : "pl";
  const t =
    lang === "en"
      ? {
          name: "Please provide your name or company.",
          email: "Please provide a valid email address.",
          service: "Please provide the name of the service.",
          situation: "Please describe the situation (at least a few words).",
          fileType: "Some files were rejected (unsupported type).",
          server: "Server error. Please try again.",
          ok: "Thank you. We've received your complaint and will get back to you."
        }
      : {
          name: "Podaj imię i nazwisko lub nazwę firmy.",
          email: "Podaj poprawny adres e-mail.",
          service: "Podaj nazwę usługi.",
          situation: "Opisz sytuację (co najmniej kilka słów).",
          fileType: "Niektóre pliki zostały odrzucone (nieobsługiwany typ).",
          server: "Błąd serwera. Spróbuj ponownie.",
          ok: "Dziękujemy. Przyjęliśmy zgłoszenie i odezwiemy się wkrótce."
        };

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ ok: false, error: t.name });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: t.email });
  }
  if (!service || typeof service !== "string" || service.trim().length < 2) {
    return res.status(400).json({ ok: false, error: t.service });
  }
  if (!situation || typeof situation !== "string" || situation.trim().length < 5) {
    return res.status(400).json({ ok: false, error: t.situation });
  }
  // If multer silently filtered out unsupported file types, inform the user.
  if (req.fileRejected) {
    return res.status(400).json({ ok: false, error: t.fileType });
  }

  const files = (req.files || []).map((f) => ({
    storedName: f.filename,
    originalName: f.originalname,
    size: f.size,
    mimeType: f.mimetype
  }));

  const complaint = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: name.trim(),
    email: email.trim(),
    service: service.trim(),
    dueDate: typeof dueDate === "string" ? dueDate.trim() : "",
    situation: situation.trim(),
    expected: typeof expected === "string" ? expected.trim() : "",
    attachments: files,
    lang,
    createdAt: new Date().toISOString()
  };

  try {
    await mkdir(DATA_DIR, { recursive: true });
    const complaints = await readComplaints();
    complaints.push(complaint);
    await writeFile(COMPLAINTS_FILE, JSON.stringify(complaints, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist complaint:", err);
    return res.status(500).json({ ok: false, error: t.server });
  }

  res.status(201).json({ ok: true, message: t.ok, id: complaint.id });
});

// Admin endpoint to review complaints
app.get("/api/complaints", async (req, res) => {
  const complaints = await readComplaints();
  res.json({ count: complaints.length, complaints });
});

// Pretty URLs for the privacy policy pages (PL + EN)
app.get("/polityka-prywatnosci", (req, res) => {
  res.sendFile(join(__dirname, "public", "polityka-prywatnosci.html"));
});
app.get("/privacy-policy", (req, res) => {
  res.sendFile(join(__dirname, "public", "privacy-policy.html"));
});

// Pretty URLs for the complaints pages (PL + EN)
app.get("/reklamacje", (req, res) => {
  res.sendFile(join(__dirname, "public", "reklamacje.html"));
});
app.get("/complaints", (req, res) => {
  res.sendFile(join(__dirname, "public", "complaints.html"));
});

app.listen(PORT, () => {
  console.log(`Business Architect running on http://localhost:${PORT}`);
});
