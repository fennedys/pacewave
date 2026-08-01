export type Chapter = { title: string; content: string }

export type Book = {
  id: number
  title: string
  author: string
  cat: string
  rating: number
  cover: string
  content: string
  desc?: string
  chapters?: Chapter[]
  featured?: boolean
  views?: number
}

export type Category = { id: number; name: string }

export type Settings = {
  activeUsers?: number
  announcement?: string
  about?: string
  privacy?: string
  terms?: string
  lastRebuild?: string
}

export const BOOKS_KEY = "pacewave_books"
export const CATS_KEY = "pacewave_cats"
export const SETTINGS_KEY = "pacewave_settings"

const p = (s: string, n: number) => s.repeat(n)

export const SEED_BOOKS: Book[] = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    cat: "Self-Help",
    rating: 4.8,
    cover: "https://picsum.photos/seed/a1/300/400",
    featured: true,
    views: 320,
    content: p(
      "Habits are the compound interest of self-improvement. You do not rise to the level of your goals. You fall to the level of your systems. Clear and useful habits transform your behavior. Every habit starts with a cue, then a routine, then a reward. Implementation intentions are a strategy that can greatly increase your odds of success. The key to building lasting habits is making small, incremental changes. Track your habits to stay accountable. Never miss twice. Small changes can lead to remarkable results. ",
      20,
    ),
  },
  {
    id: 2,
    title: "Project Hail Mary",
    author: "Andy Weir",
    cat: "Science",
    rating: 4.9,
    cover: "https://picsum.photos/seed/a2/300/400",
    featured: true,
    views: 410,
    content: p(
      "Space exploration meets survival in this thrilling adventure. A lone astronaut must rely on ingenuity and problem-solving to survive impossible odds. The story unfolds in the depths of space, where every decision matters. Technical challenges become personal battles. Humanity's future depends on one person's ability to adapt. The journey is filled with unexpected twists and discoveries. Science and humor intertwine throughout the narrative. ",
      20,
    ),
  },
  {
    id: 3,
    title: "The Silent Patient",
    author: "Alex Michaelides",
    cat: "Mystery",
    rating: 4.6,
    cover: "https://picsum.photos/seed/a3/300/400",
    views: 275,
    content: p(
      "A psychological thriller that keeps you guessing until the final page. A woman shoots her husband and then never speaks again. A psychotherapist becomes obsessed with uncovering her motive. Nothing is what it seems in this twisted tale. Secrets buried deep begin to surface. Each revelation changes everything you thought you knew. The truth is far more complex than anyone imagined. ",
      20,
    ),
  },
  {
    id: 4,
    title: "Deep Work",
    author: "Cal Newport",
    cat: "Business",
    rating: 4.7,
    cover: "https://picsum.photos/seed/a4/300/400",
    views: 190,
    content: p(
      "Focus in a distracted world is a rare and valuable skill. Deep work produces the best results and the most satisfaction. Shallow work keeps you busy but doesn't advance your goals. The ability to concentrate is becoming increasingly rare. Modern distractions fragment our attention and reduce our output. To achieve deep work, you must eliminate distractions and create focus. Build rituals and routines that support concentrated effort. ",
      20,
    ),
  },
  {
    id: 5,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    cat: "History",
    rating: 4.9,
    cover: "https://picsum.photos/seed/a5/300/400",
    featured: true,
    views: 500,
    content: p(
      "A brief history of humankind from the age of hunter-gatherers to the present. How did homo sapiens come to dominate the world? The cognitive revolution gave us the ability to imagine shared realities. Language allowed us to cooperate in groups larger than kinship networks. The agricultural revolution changed society fundamentally. Writing, money, and laws created complex civilizations. Science and technology accelerated human progress. ",
      20,
    ),
  },
  {
    id: 6,
    title: "Educated",
    author: "Tara Westover",
    cat: "Education",
    rating: 4.8,
    cover: "https://picsum.photos/seed/a6/300/400",
    views: 230,
    content: p(
      "A memoir of learning and self-discovery against all odds. Raised by survivalists in the mountains, education was forbidden. A young woman decides to educate herself and attend university. Each step is a victory against her past. Education becomes her path to freedom and independence. Family ties are tested by her pursuit of knowledge. Truth and family loyalty come into conflict. ",
      20,
    ),
  },
  {
    id: 7,
    title: "The Love Hypothesis",
    author: "Ali Hazelwood",
    cat: "Romance",
    rating: 4.5,
    cover: "https://picsum.photos/seed/a7/300/400",
    views: 160,
    content: p(
      "Fake dating turns into something real in this charming romance. A graduate student agrees to be a fake date for a professor. What starts as pretense becomes genuine connection. Chemistry builds as they spend more time together. Both have reasons to keep their distance but feelings get in the way. Misunderstandings threaten to derail their relationship. True love requires vulnerability and honesty. ",
      20,
    ),
  },
  {
    id: 8,
    title: "Dune",
    author: "Frank Herbert",
    cat: "Fiction",
    rating: 4.9,
    cover: "https://picsum.photos/seed/a8/300/400",
    featured: true,
    views: 480,
    content: p(
      "Desert planet politics and intrigue in this epic science fiction masterpiece. Arrakis is a harsh world coveted for its valuable resources. Young Paul's family is entangled in dangerous political games. Ancient prophecies and prescient abilities shape destinies. Survival on the desert requires adaptation and cunning. Relationships between cultures clash and intertwine. Power and responsibility come with great cost. ",
      20,
    ),
  },
]

export const SEED_CATEGORY_NAMES = [
  "Fiction",
  "Romance",
  "Mystery",
  "Science",
  "Technology",
  "Business",
  "Self-Help",
  "History",
  "Education",
  "Children's Books",
]

export const SEED_CATEGORIES: Category[] = SEED_CATEGORY_NAMES.map((name, i) => ({
  id: i + 1,
  name,
}))

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Seed localStorage on first visit, then always read from it. */
export function getBooks(): Book[] {
  if (typeof window === "undefined") return SEED_BOOKS
  const existing = window.localStorage.getItem(BOOKS_KEY)
  if (!existing) {
    window.localStorage.setItem(BOOKS_KEY, JSON.stringify(SEED_BOOKS))
    return SEED_BOOKS
  }
  return read<Book[]>(BOOKS_KEY, SEED_BOOKS)
}

export function getCategories(): Category[] {
  if (typeof window === "undefined") return SEED_CATEGORIES
  const existing = window.localStorage.getItem(CATS_KEY)
  if (!existing) {
    window.localStorage.setItem(CATS_KEY, JSON.stringify(SEED_CATEGORIES))
    return SEED_CATEGORIES
  }
  return read<Category[]>(CATS_KEY, SEED_CATEGORIES)
}

export function getSettings(): Settings {
  return read<Settings>(SETTINGS_KEY, {
    activeUsers: 247,
    about: "PaceWave is your digital reading library, built for focus and flow.",
    privacy: "Your privacy is important to us.",
    terms: "By using PaceWave, you agree to our terms.",
  })
}

export function saveBooks(books: Book[]) {
  window.localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
}
export function saveCategories(cats: Category[]) {
  window.localStorage.setItem(CATS_KEY, JSON.stringify(cats))
}
export function saveSettings(settings: Settings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getBookById(id: number): Book | undefined {
  return getBooks().find((b) => b.id === id)
}

/** Build displayable chapters: use authored chapters or split content into 5. */
export function getChapters(book: Book): Chapter[] {
  if (book.chapters && book.chapters.length > 0) {
    return book.chapters.filter((c) => c.title || c.content)
  }
  const parts = 5
  const size = Math.ceil(book.content.length / parts)
  return Array.from({ length: parts }, (_, i) => ({
    title: `Chapter ${i + 1}`,
    content: book.content.substring(i * size, (i + 1) * size),
  }))
}
