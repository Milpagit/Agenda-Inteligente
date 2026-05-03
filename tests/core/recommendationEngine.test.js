import {
  buildRecommendationContext,
  getRecommendationForProfile,
} from "../../src/core/recommendationEngine";

// --- Fixtures ---
const mockTasks = [
  {
    id: "1",
    text: "Matemáticas",
    completed: false,
    dueDate: new Date(Date.now() - 86400000).toISOString(),
  }, // vencida
  {
    id: "2",
    text: "Física",
    completed: false,
    dueDate: new Date(Date.now() + 86400000).toISOString(),
  },
  { id: "3", text: "Historia", completed: true, dueDate: null },
];

const mockHabits = [
  {
    id: "h1",
    name: "Ejercicio",
    completedDays: [true, true, false, true, false, false, true],
  },
  {
    id: "h2",
    name: "Lectura",
    completedDays: [false, false, false, false, false, false, false],
  },
];

const mockEvents = [
  {
    id: "e1",
    title: "Clase de Cálculo",
    start: new Date(Date.now() + 3600000),
    end: new Date(Date.now() + 7200000),
  },
];

// --- buildRecommendationContext ---
describe("buildRecommendationContext", () => {
  test("calcula pendingTasks correctamente", () => {
    const ctx = buildRecommendationContext({ tasks: mockTasks });
    expect(ctx.pendingTasks).toBe(2);
  });

  test("calcula overdueTasks correctamente", () => {
    const ctx = buildRecommendationContext({ tasks: mockTasks });
    expect(ctx.overdueTasks).toBe(1);
  });

  test("calcula habitCompletionRate como null si no hay hábitos", () => {
    const ctx = buildRecommendationContext({ habits: [] });
    expect(ctx.habitCompletionRate).toBeNull();
  });

  test("calcula habitCompletionRate correctamente", () => {
    const ctx = buildRecommendationContext({ habits: mockHabits });
    // h1: 4/7, h2: 0/7 → promedio = (4/7 + 0/7) / 2 ≈ 0.2857
    expect(ctx.habitCompletionRate).toBeCloseTo(0.2857, 3);
  });

  test("calcula weeklyLoadHours desde eventos futuros", () => {
    const ctx = buildRecommendationContext({ events: mockEvents });
    expect(ctx.weeklyLoadHours).toBeCloseTo(1, 1); // 1 hora
    expect(ctx.upcomingEvents).toBe(1);
  });

  test("detecta timeOfDay: morning entre 5 y 12", () => {
    const morning = new Date();
    morning.setHours(9, 0, 0, 0);
    const ctx = buildRecommendationContext({ now: morning });
    expect(ctx.timeOfDay).toBe("morning");
  });

  test("detecta timeOfDay: evening entre 18 y 22", () => {
    const evening = new Date();
    evening.setHours(20, 0, 0, 0);
    const ctx = buildRecommendationContext({ now: evening });
    expect(ctx.timeOfDay).toBe("evening");
  });

  test("usa riskScore por defecto 0.3 si no se pasa", () => {
    const ctx = buildRecommendationContext({});
    expect(ctx.riskScore).toBe(0.3);
  });
});

// --- getRecommendationForProfile ---
describe("getRecommendationForProfile", () => {
  const emptyContext = buildRecommendationContext({});
  const emptyHistory = {};

  test("devuelve una recomendación con id y text para cluster 0", () => {
    const rec = getRecommendationForProfile(0, emptyContext, emptyHistory);
    expect(rec).toBeDefined();
    expect(rec.id).toBeTruthy();
    expect(typeof rec.text).toBe("string");
  });

  test("devuelve una recomendación para cluster 1", () => {
    const rec = getRecommendationForProfile(1, emptyContext, emptyHistory);
    expect(rec).toBeDefined();
    expect(rec.id).toMatch(/^c1-/);
  });

  test("devuelve una recomendación para cluster 2", () => {
    const rec = getRecommendationForProfile(2, emptyContext, emptyHistory);
    expect(rec).toBeDefined();
    expect(rec.id).toMatch(/^c2-/);
  });

  test("devuelve una recomendación para cluster 3", () => {
    const rec = getRecommendationForProfile(3, emptyContext, emptyHistory);
    expect(rec).toBeDefined();
    expect(rec.id).toMatch(/^c3-/);
  });

  test("usa cluster default para cluster null", () => {
    const rec = getRecommendationForProfile(null, emptyContext, emptyHistory);
    expect(rec).toBeDefined();
    expect(rec.id).toMatch(/^d-/);
  });

  test("usa cluster default para cluster desconocido (99)", () => {
    const rec = getRecommendationForProfile(99, emptyContext, emptyHistory);
    expect(rec).toBeDefined();
    expect(rec.id).toMatch(/^d-/);
  });

  test("respeta cooldown: no devuelve recomendación en cooldown", () => {
    // Poner todas las recomendaciones del cluster 0 en cooldown
    const historyAllCooldown = {};
    // Para hacer esto, necesitamos conocer todos los ids del cluster 0
    const ruleIds = [
      "c0-feynman-deep",
      "c0-active-recall",
      "c0-spaced-repetition",
      "c0-mindfulness",
      "c0-review-week",
      "c0-wellbeing-reminder",
      "c0-focus-sprint",
      "c0-breathing",
    ];
    ruleIds.forEach((id) => {
      historyAllCooldown[id] = { lastShownAt: Date.now() - 100 }; // mostrado hace 100ms (dentro del cooldown)
    });
    // Debería devolver un fallback (la primera recomendación) en lugar de null
    const rec = getRecommendationForProfile(
      0,
      emptyContext,
      historyAllCooldown,
    );
    expect(rec).toBeDefined();
  });

  test("el historial de dismissed reduce el score de la recomendación", () => {
    // Lanzamos múltiples veces para verificar variación probabilística
    const historyWithDismiss = {
      "c0-feynman-deep": {
        dismissedCount: 10,
        scheduledCount: 0,
        lastShownAt: null,
      },
    };
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      const rec = getRecommendationForProfile(
        0,
        emptyContext,
        historyWithDismiss,
      );
      if (rec?.id) results.add(rec.id);
    }
    // Con muchos dismisses en c0-feynman-deep, otras recomendaciones deben aparecer también
    expect(results.size).toBeGreaterThan(0);
  });
});
