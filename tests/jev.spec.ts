import { expect, test } from "@playwright/test";
import { buildQuestions, parseJevReadings, observeWithJev } from "../lib/jev-server";
import { DIMENSIONS, assembleObservation, compareReadings, observe } from "../lib/experience";
import { PERSONAS, REACTIONS } from "../lib/personas";

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop", "Server contract, independent of viewport"));

function fixture(ids: string[]) {
  const scores = { interest: 3, affection: 3, discomfort: 1, expression: 0 };
  return { answers: Object.fromEntries(ids.flatMap((id) => [
    [`${id}_reaction`, { type: "choice", choice: "love", confidence: 1,
      probabilities: Object.fromEntries(REACTIONS.map((r) => [r.id, r.id === "love" ? 1 : 0])) }],
    ...DIMENSIONS.map(({ id: dimension }) => [`${id}_${dimension}`, {
      type: "score", score: scores[dimension], confidence: 1,
      probabilities: Object.fromEntries([0, 1, 2, 3].map((level) => [String(level), level === scores[dimension] ? 1 : 0])),
    }]),
  ])) };
}

test("each person has four independent scores and a separate choice", () => {
  const questions = buildQuestions();
  expect(Object.keys(questions)).toHaveLength(500);
  expect(questions.v7_affection.type).toBe("score");
  expect(questions.v7_expression.type).toBe("score");
  expect(questions.v7_reaction.type).toBe("choice");
  const reading = parseJevReadings(fixture(["v7"]), PERSONAS.filter((p) => p.id === "v7"))[0];
  expect(reading.feelings.affection).toBe(1);
  expect(reading.feelings.expression).toBe(0);
  expect(reading.feelings.discomfort).toBeCloseTo(1 / 3);
  expect(reading.voice).toBe(0);
  expect(reading.confidence).toBe(1);
  expect(reading.delivery).toBe("silent");
});

test("invalid or incomplete provider answers never become an observation", () => {
  expect(() => parseJevReadings({ answers: {} })).toThrow();
  const malformed = fixture(["v7"]);
  delete malformed.answers.v7_affection;
  expect(() => parseJevReadings(malformed, PERSONAS.filter((p) => p.id === "v7"))).toThrow();
  const invalid = fixture(["v7"]);
  invalid.answers.v7_interest.score = Number.NaN;
  expect(() => parseJevReadings(invalid, PERSONAS.filter((p) => p.id === "v7"))).toThrow();
});

test("all hundred validated results survive without a forced indifferent majority", async () => {
  const priorKey = process.env.TYPESAFE_API_KEY;
  const priorFetch = globalThis.fetch;
  const sizes: number[] = [];
  process.env.TYPESAFE_API_KEY = "contract-test-only";
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(init!.body as string);
    sizes.push(Object.keys(body.questions).length);
    const ids = Object.keys(body.questions).filter((key) => key.endsWith("_reaction")).map((key) => key.replace("_reaction", ""));
    return Response.json(fixture(ids));
  };
  try {
    const result = await observeWithJev("ひとつの言葉", new AbortController().signal);
    expect(sizes).toEqual([125, 125, 125, 125]);
    expect(result.source).toBe("jev");
    expect(result.counts.love).toBe(100);
    expect(result.counts.meh).toBe(0);
    expect(result.readings.map((r) => r.id)).toEqual(PERSONAS.map((p) => p.id));
  } finally {
    globalThis.fetch = priorFetch;
    if (priorKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = priorKey;
  }
});

test("an ambiguous judgement does not invent the loss of an admirer", () => {
  const original = observe("今日はもう頑張れない。");
  const next = observe("今日も頑張ります。");
  expect(compareReadings(original, next, original).memory).not.toBeNull();
  const uncertain = assembleObservation(next.text, next.readings.map((reading) => ({
    ...reading, certainty: { ...reading.certainty, interest: .1 },
  })), "jev");
  expect(compareReadings(original, uncertain, original).memory).toBeNull();
  expect(compareReadings(original, original, original)).toEqual({ changes: [], memory: null });
});
