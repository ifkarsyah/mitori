# English Core Vocabulary (A1 → B2)

Vocabulary every learner should know, ordered the way a native child acquires it:
**things you touch → things you do → how you describe them → how you talk about them**.

Imagine a baby born to English-speaking parents. Each stage is the world that child lives in.

## Stages

| Stage | Folder | Like a… | CEFR | Cumulative words (approx.) |
|---|---|---|---|---|
| 0 | `00-baby/` | Baby / toddler (0–3) | A1 | ~250 |
| 1 | `01-preschool/` | Preschooler (3–6) | A1 | ~470 |
| 2 | `02-school-kid/` | School kid (6–12) | A2 | ~1,500 |
| 3 | `03-teen/` | Teenager | B1 | ~2,500 |
| 4 | `04-young-adult/` | Young adult | B2 | ~4,000 |

### Stage 0 — Baby: the immediate world
- [People](00-baby/01-people/)
- [Body](00-baby/02-body/)
- [Food & Drink](00-baby/03-food-drink/)
- [Home Objects](00-baby/04-home-objects/)
- [Needs & Feelings](00-baby/05-needs-feelings/)
- [Basic Actions](00-baby/06-basic-actions/)
- [Social Words](00-baby/07-social-words/)

### Stage 1 — Preschooler: naming & describing the world
- [Colors](01-preschool/01-colors/)
- [Shapes](01-preschool/02-shapes/)
- [Numbers 0–20](01-preschool/03-numbers/)
- [Question Words](01-preschool/04-question-words/)
- [Positions](01-preschool/05-positions/)
- [Opposites](01-preschool/06-opposites/)
- [Animals](01-preschool/07-animals/)
- [Clothes](01-preschool/08-clothes/)
- [Toys & Games](01-preschool/09-toys-games/)
- [Vehicles](01-preschool/10-vehicles/)
- [Nature](01-preschool/11-nature/)
- [Time of Day](01-preschool/12-time-of-day/)

### Stage 2 — School kid: routines & the wider world
Self-introduction, numbers & time & dates, school, hobbies & sports, house & routine, town & places, shopping & money, jobs, describing people, weather, food & cooking, health, travel.

### Stage 3 — Teenager: opinions & relationships
Nuanced emotions, relationships, technology, media, giving opinions, plans & future, problems & advice, environment, comparing.

### Stage 4 — Young adult: independent life & abstract ideas
Work & office, money & bills, housing, healthcare, news & society, abstract nouns, formal vs informal register.

## Function words (cross-cutting track)

Topic lists miss the most frequent words — the glue of every sentence. These live in `function-words/` and grow alongside the stages:

Pronouns & determiners, prepositions, conjunctions & connectors, core verbs (have/do/get/make/take…), modals, adverbs of frequency & degree, quantifiers, discourse markers (B1+), phrasal verbs (A2–B2), collocations (B2).

## Conventions

- One folder per topic, prefixed with its order (`01-people/`), holding six CSVs.
  `0-phrase.csv` has one column; the word files have `<pos>,importance`:

  | file | holds |
  |---|---|
  | `0-<topic>.md` | lesson: key words by importance, how to use them, pitfalls, practice |
  | `0-phrase.csv` | fixed expressions (`thank you`) and example sentences (`Dad, look!`) |
  | `1-noun.csv` | nouns |
  | `2-verb.csv` | verbs, including multi-word ones (`wake up`, `put on`) |
  | `3-adjective.csv` | adjectives |
  | `4-adverb.csv` | adverbs |
  | `5-other.csv` | pronouns, determiners, prepositions, numbers, interjections |

- `importance` ranks words within the stage, judged from a learner's point of view:
  - `3` core — needed to communicate at all, used every day (`eye`, `want`, `the`)
  - `2` common — frequent but you can get by without it for a while (`nose`, `cry`)
  - `1` specific — less frequent, narrower, or child-only register (`neck`, `tummy`, `mommy`)
- Word files are sorted by `importance`, highest first.
- Every word used in a phrase is listed in a word file: `Dad, look!` → `dad` in `1-noun.csv`, `look` in `2-verb.csv`.
- Each word is listed once across all stages, in the topic where it fits best. A word with a different part of speech counts as a new word (`light` noun in Stage 0, `light` adjective in Stage 1).
- Words are listed in their base form (`teeth` → `tooth`, `fell` → `fall`, `is` → `be`).
- Every topic has all six files; a file with only its header means the topic has none of that kind.
- The stage sets the CEFR level, so entries carry no level column.
- Phrases use only words listed in the same stage or earlier.
