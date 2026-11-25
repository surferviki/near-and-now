import contentJson from "../data/content.json";
import contentExpansionJson from "../data/content-expansion.json";
import catalogExpansionJson from "../data/catalog-expansion.json";
import { buildExperience, getInitialRecent, rememberExperience, validateContent } from "./recommendation";
import type { Content, Intensity, MoodId, UserInput } from "./types";
import "./styles.css";

const baseContent = contentJson as Content;
const expansion = contentExpansionJson as Partial<Content>;
const catalogExpansion = catalogExpansionJson as Partial<Content>;
const content: Content = {
  ...baseContent,
  thoughts: [...baseContent.thoughts, ...(expansion.thoughts ?? [])],
  stories: [...baseContent.stories, ...(expansion.stories ?? [])],
  activities: [...baseContent.activities, ...(expansion.activities ?? [])],
  songs: [...baseContent.songs, ...(expansion.songs ?? []), ...(catalogExpansion.songs ?? [])],
  movies: [...baseContent.movies, ...(expansion.movies ?? []), ...(catalogExpansion.movies ?? [])],
  dialogues: catalogExpansion.dialogues ?? [],
};
const form = document.querySelector<HTMLFormElement>("#moodForm")!;
const moodGrid = document.querySelector<HTMLDivElement>("#moodGrid")!;
const results = document.querySelector<HTMLElement>("#results")!;
const errorBox = document.querySelector<HTMLElement>("#formError")!;
const validationErrors = validateContent(content);
let selectedMood: MoodId | null = null;
let recentIds = getInitialRecent();
let lastInput: UserInput | null = null;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

moodGrid.innerHTML = content.moods.map((mood) => `
  <button class="mood-option" type="button" aria-pressed="false" data-mood="${mood.id}">
    <span class="mood-emoji" aria-hidden="true">${mood.emoji}</span><span>${escapeHtml(mood.label)}</span>
  </button>`).join("");

moodGrid.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-mood]");
  if (!target) return;
  selectedMood = target.dataset.mood as MoodId;
  moodGrid.querySelectorAll("[data-mood]").forEach((button) => button.setAttribute("aria-pressed", String(button === target)));
  errorBox.hidden = true;
});

const highIntensityRadio = document.querySelector<HTMLInputElement>('input[name="intensity"][value="high"]')!;
highIntensityRadio.addEventListener("change", () => {
  document.querySelector("#intensityNote")?.classList.toggle("is-visible", highIntensityRadio.checked);
});

function getInput(): UserInput | null {
  if (!selectedMood) return null;
  const data = new FormData(form);
  return {
    moodId: selectedMood,
    intensity: String(data.get("intensity")) as Intensity,
    availableMinutes: 10,
  };
}

function presentExperience(input: UserInput): void {
  const experience = buildExperience(input, content, recentIds);
  recentIds = rememberExperience(experience);
  lastInput = input;
  const setText = (selector: string, text: string) => { document.querySelector<HTMLElement>(selector)!.textContent = text; };
  setText("#results-intro", `${experience.mood.emoji} ${experience.mood.label} · ${input.intensity} intensity`);
  setText("#thoughtText", experience.thought.item.text);
  const dialogue = experience.dialogue;
  const dialogueBlock = document.querySelector<HTMLElement>("#dialogueBlock")!;
  dialogueBlock.hidden = !dialogue;
  if (dialogue) {
    setText("#dialogueText", `“${dialogue.text}”`);
    setText("#dialogueLabel", dialogue.kind === "speech_paraphrase" ? "THALAIVAR’S SPEECH TAKEAWAY · PARAPHRASED" : "SOURCED THALAIVAR FILM DIALOGUE");
    setText("#dialogueAttribution", `${dialogue.film} (${dialogue.year}) · ${dialogue.renderingLabel ?? (dialogue.kind === "speech_paraphrase" ? "paraphrased summary" : "English rendering")}`);
    const dialogueSource = document.querySelector<HTMLAnchorElement>("#dialogueSource")!;
    dialogueSource.href = dialogue.sourceUrl;
    dialogueSource.hidden = false;
    setText("#dialogueInterpretation", dialogue.interpretation);
    setText("#dialogueStoryTitle", dialogue.originalStoryTitle);
    setText("#dialogueStoryText", dialogue.originalStory);
    document.querySelector<HTMLElement>("#dialogueStoryBlock")!.hidden = false;
  } else {
    document.querySelector<HTMLElement>("#dialogueStoryBlock")!.hidden = true;
  }
  setText("#storyTime", `${experience.story.item.durationMinutes} min read`);
  setText("#storyTitle", experience.story.item.title);
  setText("#storyText", experience.story.item.content);
  setText("#mindReason", `Why this was suggested: ${[...experience.thought.reasons, ...experience.story.reasons].slice(0, 3).join(" · ") || "a gentle fit for this moment"}.`);
  setText("#activityDescription", experience.activity.item.description);
  setText("#activityTime", `${experience.activity.item.durationMinutes} minutes`);
  document.querySelector<HTMLOListElement>("#activitySteps")!.innerHTML = experience.activity.item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  setText("#safetyNote", experience.activity.item.safetyNotes.join(" "));
  setText("#bodyReason", `Why this was suggested: ${experience.activity.reasons.slice(0, 3).join(" · ") || "a gentle fit for this moment"}.`);
  setText("#songTitle", experience.song.item.title);
  setText("#songReason", `${experience.song.item.source}. ${experience.song.item.energy === "high" ? "A spirited pick" : "A softer pick"} to suit this moment.`);
  const songLink = document.querySelector<HTMLAnchorElement>("#songLink")!;
  songLink.href = experience.song.item.externalLink;
  songLink.hidden = !/^https:\/\//i.test(songLink.href);
  setText("#movieTitle", `${experience.movie.item.title} (${experience.movie.item.year})`);
  setText("#movieCopy", experience.movie.item.recommendationReason);
  const movieLink = document.querySelector<HTMLAnchorElement>("#movieLink")!;
  movieLink.href = experience.movie.item.externalLink;
  movieLink.hidden = !/^https:\/\//i.test(movieLink.href);
  const shareText = [
    "MOODLIFT ✦ A little lift for my mood",
    ...(experience.dialogue ? [`A Thalaivar line or speech takeaway: “${experience.dialogue.text}”`, `Source: ${experience.dialogue.sourceUrl}`] : []),
    `An original MoodLift reflection (not a film quote): “${experience.thought.item.text}”`,
    `Try this reset: ${experience.activity.item.title} — ${experience.activity.item.description}`,
    `A song for the moment: ${experience.song.item.title}`,
    `A film for later: ${experience.movie.item.title}`,
    "Find your MoodLift moment: https://moodlift-moment.vercel.app",
  ].join("\n\n");
  document.querySelector<HTMLAnchorElement>("#shareWhatsapp")!.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  results.hidden = false;
  (document.querySelector("#feedbackThanks") as HTMLElement).hidden = true;
  document.querySelectorAll<HTMLButtonElement>("[data-feedback]").forEach((button) => { button.disabled = false; });
  results.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (validationErrors.length) {
    errorBox.textContent = "The curated content needs a quick check before recommendations can load.";
    errorBox.hidden = false;
    return;
  }
  const input = getInput();
  if (!input) {
    errorBox.textContent = "Choose the mood that feels closest, and we’ll take it from there.";
    errorBox.hidden = false;
    moodGrid.querySelector<HTMLButtonElement>("button")?.focus();
    return;
  }
  errorBox.hidden = true;
  presentExperience(input);
});

document.querySelector("#tryAnother")?.addEventListener("click", () => { if (lastInput) presentExperience(lastInput); });

document.querySelector("#resetExperience")?.addEventListener("click", () => {
  results.hidden = true;
  form.reset();
  selectedMood = null;
  moodGrid.querySelectorAll<HTMLButtonElement>("[data-mood]").forEach((button) => button.setAttribute("aria-pressed", "false"));
  errorBox.hidden = true;
  document.querySelector("#intensityNote")?.classList.remove("is-visible");
  const behavior: ScrollBehavior = reduceMotion.matches ? "auto" : "smooth";
  hero.scrollIntoView({ behavior, block: "start" });
  window.setTimeout(() => moodGrid.querySelector<HTMLButtonElement>("[data-mood]")?.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 450);
});

document.querySelector("#feedbackPanel")?.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-feedback]");
  if (!button) return;
  document.querySelectorAll<HTMLButtonElement>("[data-feedback]").forEach((item) => { item.disabled = true; });
  const thanks = document.querySelector<HTMLElement>("#feedbackThanks")!;
  thanks.hidden = false;
  if (button.dataset.feedback !== "skip") {
    try { sessionStorage.setItem("rajinism-last-feedback", button.dataset.feedback ?? ""); } catch { /* Feedback remains local to this page. */ }
  }
});

const hero = document.querySelector<HTMLElement>("#journey")!;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (window.matchMedia("(pointer: fine)").matches && !reduceMotion.matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    hero.style.setProperty("--px", `${x}`);
    hero.style.setProperty("--py", `${y}`);
  });
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--px", "0");
    hero.style.setProperty("--py", "0");
  });
}

if (highIntensityRadio.checked) document.querySelector("#intensityNote")?.classList.add("is-visible");
