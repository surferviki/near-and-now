import type { Activity, Content, Experience, Intensity, MoodId, Scored, UserInput } from "./types";

const WEIGHTS = { mood: 40, intensity: 20, duration: 15, target: 10 } as const;
const GENERAL_MOODS: MoodId[] = ["happy", "sad", "angry", "frustrated", "stressed", "lonely", "bored", "demotivated", "confident"];
export function validateContent(content: Content): string[] {
  const errors: string[] = [];
  for (const collection of [content.moods, content.thoughts, content.stories, content.activities, content.songs, content.movies, ...(content.dialogues ? [content.dialogues] : [])]) {
    const ids = collection.map((entry) => entry.id);
    if (new Set(ids).size !== ids.length) errors.push("Content IDs must be unique within each collection.");
  }
  const moodIds = new Set(content.moods.map((mood) => mood.id));
  for (const [name, collection] of Object.entries({ moods: content.moods, thoughts: content.thoughts, stories: content.stories, activities: content.activities, songs: content.songs, movies: content.movies })) {
    if (!collection.length) errors.push(`The ${name} collection cannot be empty.`);
  }
  for (const item of [...content.thoughts, ...content.stories, ...content.activities, ...content.songs, ...content.movies, ...(content.dialogues ?? [])]) {
    if (item.moods.some((mood) => !moodIds.has(mood))) errors.push(`Unknown mood reference in ${item.id}.`);
  }
  if (content.songs.some((song) => !content.movies.some((movie) => movie.id === song.movieId))) errors.push("Every song must reference a movie.");
  return errors;
}

function score<T extends { id: string; moods: MoodId[]; themes: string[] }>(
  items: T[], input: UserInput, preferredThemes: string[], recentIds: Set<string>, extras: (item: T) => Partial<Record<keyof typeof WEIGHTS, number>> = () => ({}),
): Scored<T>[] {
  return items.map((item) => {
    const components = extras(item);
    let points = 0;
    const reasons: string[] = [];
    if (item.moods.includes(input.moodId)) { points += WEIGHTS.mood; reasons.push("matches your mood"); }
    const intensityValues = "intensity" in item ? (item.intensity as Intensity[]) : [];
    if (!intensityValues.length || intensityValues.includes(input.intensity)) { points += WEIGHTS.intensity; reasons.push("fits your intensity"); }
    const minutes = "durationMinutes" in item ? Number(item.durationMinutes) : 0;
    if (minutes && minutes <= input.availableMinutes) { points += WEIGHTS.duration; reasons.push("fits your time"); }
    const overlap = item.themes.filter((theme) => preferredThemes.includes(theme)).length;
    if (overlap) { points += Math.min(WEIGHTS.target, overlap * 5); reasons.push(`connects with ${item.themes.find((theme) => preferredThemes.includes(theme))?.replaceAll("_", " ")}`); }
    for (const value of Object.values(components)) points += Number(value ?? 0);
    if (recentIds.has(item.id)) points -= 16;
    return { item, score: points, reasons };
  }).sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
}

function choose<T>(ranked: Scored<T>[], recentIds: Set<string>): Scored<T> {
  return ranked.find(({ item }) => !recentIds.has((item as { id: string }).id)) ?? ranked[0];
}

function chooseActivity(items: Activity[], input: UserInput, themes: string[], recent: Set<string>): Scored<Activity> {
  let eligible = items.filter((activity) => activity.moods.includes(input.moodId) && activity.intensity.includes(input.intensity));
  if (input.intensity === "high") eligible = eligible.filter((activity) => activity.energyRequired === "low");
  if (!eligible.length) eligible = items.filter((activity) => activity.energyRequired === "low" && activity.intensity.includes(input.intensity));
  if (!eligible.length) eligible = items.filter((activity) => activity.energyRequired === "low");
  return choose(score(eligible, input, themes, recent, (activity) => ({ duration: activity.durationMinutes <= input.availableMinutes ? 0 : -12 })), recent);
}

export function buildExperience(input: UserInput, content: Content, recentIds: string[] = []): Experience {
  const profile = content.moods.find((mood) => mood.id === input.moodId) ?? content.moods[0];
  const recent = new Set(recentIds);
  const thoughts = content.thoughts.filter((item) => item.reviewStatus === "approved" && item.rightsStatus === "original");
  const stories = content.stories.filter((item) => item.reviewStatus === "approved" && item.isOriginal);
  const validSongs = content.songs.filter((song) => song.rightsStatus !== "prohibited");
  const validMovies = content.movies.filter((movie) => movie.verified);
  const thought = choose(score(thoughts, input, profile.preferredThemes, recent), recent);
  const storyRanks = score(stories, input, profile.preferredThemes, recent, (story) => ({
    intensity: story.intensity.includes(input.intensity) ? 0 : -18,
    target: story.themes.some((theme) => thought.item.themes.includes(theme)) ? 7 : 0,
  }));
  const story = choose(storyRanks.length ? storyRanks : score(stories, input, profile.preferredThemes, recent), recent);
  const activity = chooseActivity(content.activities, input, [...profile.preferredThemes, ...story.item.themes], recent);
  const song = choose(score(validSongs, input, profile.preferredThemes, recent), recent);
  const movie = choose(score(validMovies, input, profile.preferredThemes, recent), recent);
  const dialogue = content.dialogues?.find((item) => item.moods.includes(input.moodId));
  return { mood: profile, thought, story, activity, song, movie, ...(dialogue ? { dialogue } : {}) };
}

export function rememberExperience(experience: Experience): string[] {
  let previous: string[] = [];
  try { previous = JSON.parse(sessionStorage.getItem("rajinism-recent") ?? "[]") as string[]; } catch { /* Storage can be unavailable in private or restricted contexts. */ }
  const ids = [experience.thought.item.id, experience.story.item.id, experience.activity.item.id, experience.song.item.id, experience.movie.item.id];
  const next = [...new Set([...ids, ...previous])].slice(0, 20);
  try { sessionStorage.setItem("rajinism-recent", JSON.stringify(next)); } catch { /* Recommendations still work without session persistence. */ }
  return next;
}

export function getInitialRecent(): string[] {
  try { return JSON.parse(sessionStorage.getItem("rajinism-recent") ?? "[]") as string[]; } catch { return []; }
}

export function allMoodIds(): MoodId[] { return GENERAL_MOODS; }
