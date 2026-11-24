export type MoodId = "happy" | "sad" | "angry" | "frustrated" | "stressed" | "lonely" | "bored" | "demotivated" | "confident";
export type Intensity = "mild" | "moderate" | "high";
export type ReasonId = "work" | "personal" | "family_relationships" | "tiredness" | "none" | "browsing";

export interface MoodProfile { id: MoodId; label: string; emoji: string; targetEmotion: string[]; preferredThemes: string[] }
export interface Thought { id: string; type: "original_thought"; text: string; moods: MoodId[]; themes: string[]; targetEmotion: string[]; reviewStatus: string; rightsStatus: string }
export interface Story { id: string; title: string; content: string; moods: MoodId[]; themes: string[]; intensity: Intensity[]; durationMinutes: number; targetEmotion: string[]; reviewStatus: string; isOriginal: boolean }
export interface Activity { id: string; title: string; description: string; steps: string[]; category: string; moods: MoodId[]; themes: string[]; intensity: Intensity[]; durationMinutes: number; energyRequired: "low" | "medium" | "high"; safetyNotes: string[]; reasonIds?: ReasonId[] }
export interface Song { id: string; title: string; movieId: string; moods: MoodId[]; themes: string[]; energy: string; language: string; externalLink: string; source: string; sourceUrl: string; rightsStatus: string }
export interface Movie { id: string; title: string; year: number; genres: string[]; moods: MoodId[]; themes: string[]; synopsis: string; recommendationReason: string; externalLink: string; verified: boolean; source: string; sourceUrl: string }
export interface Content { schemaVersion: number; moods: MoodProfile[]; thoughts: Thought[]; stories: Story[]; activities: Activity[]; songs: Song[]; movies: Movie[]; comfortFoods: unknown[] }
export interface UserInput { moodId: MoodId; intensity: Intensity; reasonId: ReasonId; availableMinutes: 5 | 10 | 20 | 30 }
export interface Scored<T> { item: T; score: number; reasons: string[] }
export interface Experience { mood: MoodProfile; thought: Scored<Thought>; story: Scored<Story>; activity: Scored<Activity>; song: Scored<Song>; movie: Scored<Movie> }
