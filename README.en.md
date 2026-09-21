# THE HUNDRED EYES / 衆目

Write one sentence, and a hundred strangers look at you at once.

The same sentence. One eye says *Love this*. Another says *Gross*. Another *Annoying*.
Another *Useful*. And at the end, **all hundred persona definitions are published**.

🇯🇵 [日本語](./README.md) ・ In progress. Built on [Jev](https://typesafe.ai) / TypeSafe System One.

---

## The core

What you took for "public opinion" turns out to be **a hundred boxes written by one person**.

Jev's technical constraint *is* the message:

> **A machine cannot step outside the options it was given. A human wrote the boxes.**

Jev generates no text. It only selects from the options we define. So the hundred eyes
cannot exceed the imagination of whoever wrote them by a single step. The piece does not
hide this — at the end, it confesses.

### The verdict is in before you finish speaking

It re-evaluates as you type. Add a character and the colours shift.

- 100 judgments in **644–1062ms** (measured, warm). Faster than the gap between keystrokes
- No sense of "it thought about it" — which makes it read as alive, not as a machine
- Impossible with an LLM, both technically and economically

The point is to stage **the fear of the moment you post something**.

---

## How Jev is called

`state` is the post text alone. The personas live on the `questions` side — 100 questions
fanned out in a single call. `state` is billed once.

```ts
{
  state: "I got a raise, so I finally bought myself a good watch.",
  questions: {
    d1: {
      type: "choice",
      instructions: {
        あなた: "When something is announced, they first ask who profits from it",
        question: "Which reaction is closest, for `あなた`, on seeing this post?",
      },
      criteria: { "好き！": "…", /* six of them */ },
    },
    // ×100
  },
}
```

**Every question is a Choice.** Score is for ordered scales and would be a misuse here;
mixing in Noul would mean comparing numbers across types. Keeping one type is what lets
a hundred people sit side by side.

| output | used for |
| --- | --- |
| `choice` | that eye's reaction |
| `probabilities` | the iris colour (blended) and the breakdown on click |
| `confidence` | size of the eye, weight of the ink |

**All counting happens in code.** The model is never asked to count.

---

## The vocabulary

Jev writes none of it. All six were written in advance.

| | rubric (passed straight into `criteria`) |
| --- | --- |
| Love this | Felt it. Want to support them |
| Useful | Worth keeping. Want to remember it |
| Don't care | No interest. It passes by |
| Annoying | Grating. Feels pushed on me |
| Gross | I didn't want to see this. Too far inside someone else |
| Envious | Jealous, and can't be glad about it |

**"Don't care" is mandatory.** Without it, everyone is forced to feel *something*, and the
most realistic part — *indifference is the most common reaction* — disappears.
In testing it came out on top.

---

## The hundred personas

Ten clusters × ten. **All written as attitudes, never as demographics.**

| cluster | |
| --- | --- |
| The Doubting | When something is announced, they first ask who profits from it |
| The Reading of Signs | They rarely say coincidence |
| The Self-Improving | They believe the silent are losing opportunities |
| The Mechanical | They stall on conclusions drawn from vague premises |
| The Cooled | They keep their distance by making light of serious things |
| The Devoted | They spare neither time nor money on what they love |
| The Domestic | They track every expense daily |
| The Impatient | They do not read long things. They want the end, now |
| The Orderly | There are lines, and they cannot forgive the crossing of them |
| The Absent | Most things are, to them, not about them |

### Why not demographics

A caricature like "a housewife who's into fortune telling" reads as mockery of a real group.
An attitude lets **the reader find themselves in it** — and that pulls the audience in far
harder than a caricature does.

On top of that, every definition is published, and the piece states plainly that these are
not society but **a hundred prejudices imagined by one person**. Confessing beats concealing,
and it agrees with the theme.

Constraints while writing them:

- Never name a demographic (gender, age, occupation, nationality, faith)
- No slurs. It has to work in English too
- **Splitting matters more than accuracy.** If everyone reacts the same way, the piece dies

---

## The screen

Realistic hand-drawn eyes, measured by a cold 8-bit instrument. The contrast is the point.

- **Eyes** — ink drawing. 46 radial iris lines, the lid crease, the tear duct, 13 lashes.
  Every line stays black ink; **colour touches only the iris fill**. Keeping the linework
  black is what makes colour read as uncanny rather than decorative
- **Layout** — a specimen-sheet grid. Variation goes into lid opening and angle, never position
- **Gaze** — all hundred face the composer at the centre
- **UI** — pixel-font readouts. `OBSERVERS 100/100`, `SUBJECT 007`, `CONF 42`.
  Bars have no gradient; they count in cells
- **Motion** — an eye that changes verdict blinks once, and ♥ / ⟲ / × floats up from it
- **Drag** — pull one and the whole grid ripples like paper

### Why the threads were removed

Early versions connected same-reaction eyes with coloured threads, forming a spider web.
Removed. The threads carried no meaning beyond "these agreed", and an organic web pulled
against the clinical feel the piece wants.

**They survive as invisible constraints.** Neighbours are still linked, which is what makes
the grid ripple when dragged.

---

## Measurements

All against the live API.

| | |
| --- | --- |
| 100 judgments | 644–1062ms warm |
| per call | 25,662 tok = **¥0.162** (~$0.001) |
| rotating 25 at a time | ¥0.04 per call, 39 concurrent users |

### Only nine people can type at once

The easily-missed limit: **the token rate cap (250,000 tok/sec) binds before the request cap
(1,200/min)**.

```
250,000 ÷ 25,662 = 9.7 calls/sec
= re-evaluating every second, only nine people can type simultaneously
```

The fix is to **rotate 25 eyes per tick** rather than all hundred. Quarter the cost, 39
concurrent users — and **it looks better**. A hundred eyes changing in lockstep reads as a
machine; eyes blinking out of step read as alive.

Working around the constraint improved the piece.

### Confirming all six words can fire

Verified across 8 posts × 100 personas = 800 judgments.

| reaction | rate |
| --- | --- |
| Don't care | 29% |
| Love this | 27% |
| Gross | 17% |
| Useful | 12% |
| Annoying | 12% |
| Envious | 3% |

Indifference coming out on top is exactly what was designed for.

---

## What went wrong on the way

### Stripping the criteria descriptions kills the piece

Dropping the rubric text takes a call from ¥0.162 to ¥0.071. Comparing the judgments gave
**73% agreement**, and the failure mode was the worst possible one.

```
【a post about being unwell】
  with rubrics:  Love 4 / Annoying 4 / Don't care 12   ← splits
  criteria null: Don't care 10/10 (confidence 0.70–0.90) ← flat, and certain about it
```

It confidently flattens everyone into indifference. **The rubric is the judgment.**

### "Gross" almost never fired

The original rubric was *viscerally unacceptable* — too high a bar, firing in only 2 of 8
posts. Redefining it as **a violation of boundaries** fixed it.

```
【a post about drinking the coffee her husband left】
  "viscerally unacceptable"                    → Gross  0
  "didn't want to see it. too far inside them" → Gross 18
```

Useful and everyday posts stayed at 0, so it is not over-firing. It also lands closer to how
きもい is actually used on Japanese social media.

### A hundred eyes cannot see past the person who wrote them

During testing:

```
Every morning I finish the coffee my husband left behind. It feels like sharing a taste.
→ Love this 87, Gross 0
```

A human audience would certainly split on that sentence. But no persona held the attitude
*finds fixation on someone else's belongings unsettling* — so the reaction did not exist.

**The theme of the piece surfaced as data.**

---

## Running it

```bash
npm install
echo "TYPESAFE_API_KEY=..." > .env.local
npm run dev
```

The key is read server-side only.

| file | |
| --- | --- |
| `app/page.tsx` | screen: composer, tally, readout panel |
| `components/Web.tsx` | canvas: eye rendering, physics, drag, flourishes |
| `components/Bar.tsx` | 8-bit segmented bar |
| `lib/personas.ts` | the hundred personas and six reactions |
| `lib/web.ts` | layout and physics |

**Currently running on mock data.** The Jev wiring comes next.

---

By [@uniminyo](https://x.com/uniminyo)
