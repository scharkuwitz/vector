import type { Activity, Plan, Priority, Status } from "./types";

/*
 * Fixtures for unit tests only; the app itself starts with an empty database.
 * Dates sit around Nov 2026 and include an overdue activity and a plan whose
 * weights total 80% (Launch personal website).
 */

const CREATED = "2026-09-01T09:00:00.000Z";

export const plans: Plan[] = [
  {
    id: 1,
    title: "Run a half marathon",
    description: "Build up from easy 5 km runs to a 21.1 km race in April.",
    createdAt: CREATED,
  },
  {
    id: 2,
    title: "Launch personal website",
    description: "Portfolio and blog on my own domain.",
    createdAt: CREATED,
  },
  {
    id: 3,
    title: "Learn Japanese to N4",
    description: "Pass the JLPT N4 in the July 2027 sitting.",
    createdAt: CREATED,
  },
  {
    id: 4,
    title: "Renovate home office",
    description: "Turn the spare room into a quiet place to work.",
    createdAt: CREATED,
  },
];

type Row = [
  id: number,
  planId: number,
  title: string,
  description: string | null,
  priority: Priority,
  status: Status,
  weight: number,
  startDate: string,
  endDate: string,
];

const rows: Row[] = [
  // Run a half marathon: weights 5 + 20 + 30 + 5 + 25 + 15 = 100
  [1, 1, "Get fitted for running shoes", "Gait check at the running shop; buy two pairs to rotate.", "low", "done", 5, "2026-09-12", "2026-09-12"],
  [2, 1, "Base building: three easy runs a week", "Conversational pace only, 25–40 minutes each.", "medium", "done", 20, "2026-09-14", "2026-11-01"],
  [3, 1, "Add a weekly long run (up to 16 km)", "Increase the Sunday run by about 1 km a week; every fourth week is a recovery week.", "high", "in_progress", 30, "2026-11-02", "2027-01-31"],
  [4, 1, "Register for the spring half marathon", null, "high", "todo", 5, "2026-12-01", "2026-12-15"],
  [5, 1, "Speed work and tempo runs", "One interval session and one tempo run each week.", "medium", "todo", 25, "2027-02-01", "2027-03-28"],
  [6, 1, "Taper and race day", "Cut volume by 40%, keep some intensity, race on April 18.", "high", "todo", 15, "2027-03-29", "2027-04-18"],

  // Launch personal website: weights total 80 (20% still unassigned)
  [7, 2, "Pick a domain and hosting", null, "low", "done", 10, "2026-10-05", "2026-10-09"],
  [8, 2, "Design the layout and type", "Two page templates: post and project. Mobile first.", "medium", "in_progress", 25, "2026-10-12", "2026-11-20"],
  [9, 2, "Write five starter posts", "Topics: the half marathon, the office rebuild, three project write-ups.", "medium", "todo", 30, "2026-11-16", "2027-01-15"],
  [10, 2, "Set up deploys and analytics", "Push-to-deploy and a privacy-friendly page counter.", "low", "todo", 15, "2027-01-18", "2027-01-29"],

  // Learn Japanese to N4: weights 20 + 35 + 25 + 15 + 5 = 100
  [11, 3, "Finish kana and the first 100 kanji", "Daily spaced-repetition reviews, 20 minutes.", "high", "todo", 20, "2026-12-01", "2027-01-31"],
  [12, 3, "Genki I, chapters 1–12", "One chapter every ten days, workbook included.", "high", "todo", 35, "2027-01-04", "2027-04-30"],
  [13, 3, "Weekly conversation lessons", "Online tutor, Tuesday evenings.", "medium", "todo", 25, "2027-02-01", "2027-06-30"],
  [14, 3, "Register for the July exam", "Registration usually opens in March.", "low", "todo", 5, "2027-03-01", "2027-03-31"],
  [15, 3, "Mock exams and review", null, "medium", "todo", 15, "2027-06-01", "2027-07-04"],

  // Renovate home office: weights 15 + 25 + 25 + 35 = 100; painting is overdue
  [16, 4, "Clear out and sell old furniture", null, "medium", "done", 15, "2026-10-01", "2026-10-25"],
  [17, 4, "Paint walls and ceiling", "Two coats, off-white. Ceiling first.", "high", "in_progress", 25, "2026-10-26", "2026-11-06"],
  [18, 4, "Order desk and chair", "Standing desk, 160 × 80 cm.", "low", "todo", 25, "2026-11-09", "2026-11-27"],
  [19, 4, "Install shelves and lighting", "Wall shelves over the desk and a warm ceiling light.", "medium", "todo", 35, "2026-11-16", "2026-12-11"],
];

export const activities: Activity[] = rows.map(
  ([id, planId, title, description, priority, status, weight, startDate, endDate]) => ({
    id,
    planId,
    title,
    description,
    priority,
    status,
    weight,
    startDate,
    endDate,
    createdAt: CREATED,
    updatedAt: CREATED,
  }),
);
