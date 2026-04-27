// src/core/recommendationEngine.js

/**
 * Motor de recomendaciones con contexto (tiempo, carga, hábitos, tareas, riesgo).
 * Cada recomendación incluye metadatos para priorizar y evitar repetición.
 */
const recommendationRules = {
  // -----------------------------------------------------------------
  // Cluster 0: "Disciplinados y Saludables 🧘‍♂️"
  // -----------------------------------------------------------------
  0: [
    {
      id: "c0-feynman-deep",
      text: "Tu balance entre estudio y bienestar es excelente. Para ir un paso más allá, ¿pruebas la técnica de Feynman para dominar un tema complejo? Te agendo un bloque para intentarlo.",
      action: { title: "Práctica: Técnica Feynman", duration: 1 },
      category: "study",
      timeOfDay: ["morning", "afternoon"],
      priority: 1.2,
      cooldownHours: 48,
    },
    {
      id: "c0-active-recall",
      text: "Mantienes una gran disciplina. Para evitar la monotonía, ¿agendamos una sesión de revisión activa donde te expliques los temas a ti mismo en voz alta?",
      action: { title: "Sesión de Revisión Activa", duration: 1.5 },
      category: "study",
      timeOfDay: ["afternoon"],
      priority: 1.1,
    },
    {
      id: "c0-spaced-repetition",
      text: "Tu memoria es excelente. Para retener información a largo plazo, ¿probamos agendar sesiones de repetición espaciada para tus materias clave?",
      action: { title: "Estudio con Repetición Espaciada", duration: 0.5 },
      category: "study",
      timeOfDay: ["morning", "afternoon"],
      priority: 1,
    },
    {
      id: "c0-mindfulness",
      text: "Mantienes un gran foco. Para potenciarlo aún más, ¿qué tal una breve sesión de mindfulness antes de tu próxima sesión de estudio intensivo?",
      action: { title: "Sesión de Mindfulness", duration: 0.25 },
      category: "wellbeing",
      timeOfDay: ["morning", "evening"],
      priority: 0.9,
    },
    {
      id: "c0-review-week",
      text: "¿Te gustaría cerrar la semana con una revisión rápida de logros y pendientes? Te agendo 20 minutos para ordenar la próxima semana.",
      action: { title: "Cierre Semanal y Plan", duration: 0.33 },
      category: "organization",
      daysOfWeek: [0, 5, 6],
      priority: 1,
    },
    {
      id: "c0-wellbeing-reminder",
      text: "Tu constancia con el ejercicio es admirable. Recuerda que un cuerpo sano apoya una mente sana. ¡Sigue así!",
      action: null,
      category: "wellbeing",
      priority: 0.6,
      cooldownHours: 72,
    },
    {
      id: "c0-focus-sprint",
      text: "Estás en un gran momento. ¿Agendamos un sprint corto de 45 minutos para atacar ese tema clave?",
      action: { title: "Sprint de Foco (45 min)", duration: 0.75 },
      category: "focus",
      timeOfDay: ["morning", "afternoon"],
      priority: 1.05,
    },
    {
      id: "c0-breathing",
      text: "Para mantener tu rendimiento alto, una pausa breve ayuda mucho. ¿Te agendo 10 minutos de respiración guiada?",
      action: { title: "Respiración Guiada", duration: 0.2 },
      category: "wellbeing",
      timeOfDay: ["afternoon", "evening"],
      priority: 0.8,
    },
  ],

  // -----------------------------------------------------------------
  // Cluster 1: "Socialmente Activos y Esforzados 📱"
  // -----------------------------------------------------------------
  1: [
    {
      id: "c1-pomodoro",
      text: "Estás invirtiendo mucho tiempo, ¡genial! Para hacerlo más efectivo, ¿agendamos una sesión de estudio usando Pomodoro (25 min foco, 5 descanso)?",
      action: { title: "Estudio con Pomodoro", duration: 0.5 },
      category: "focus",
      timeOfDay: ["morning", "afternoon"],
      minTasks: 2,
      priority: 1.2,
    },
    {
      id: "c1-deep-focus",
      text: "He notado distracciones. ¿Qué tal un bloque de foco profundo sin móvil antes de tu próxima entrega?",
      action: { title: "Bloque de Foco Profundo", duration: 1.5 },
      category: "focus",
      minTasks: 3,
      priority: 1.3,
      cooldownHours: 48,
    },
    {
      id: "c1-break-pm",
      text: "Tu esfuerzo es enorme, pero el descanso es clave. ¿Agendamos una pausa programada de 15 minutos esta tarde?",
      action: { title: "Pausa Programada", duration: 0.25 },
      category: "rest",
      timeOfDay: ["afternoon", "evening"],
      priority: 0.9,
    },
    {
      id: "c1-desk-reset",
      text: "Tu entorno es clave. ¿Agendamos 15 minutos para ordenar tu escritorio antes de estudiar?",
      action: { title: "Ordenar Espacio de Estudio", duration: 0.25 },
      category: "organization",
      timeOfDay: ["morning"],
      priority: 0.95,
    },
    {
      id: "c1-quick-tasks",
      text: "Veo tareas pequeñas acumuladas. ¿Agrupamos un bloque de tareas rápidas para despacharlas todas juntas?",
      action: { title: "Bloque de Tareas Rápidas", duration: 1 },
      category: "organization",
      minTasks: 4,
      priority: 1.1,
    },
    {
      id: "c1-app-block",
      text: "Tu dedicación es admirable. Considera usar apps que bloqueen redes sociales durante tus horas de estudio para maximizar tu esfuerzo.",
      action: null,
      category: "focus",
      priority: 0.7,
      cooldownHours: 72,
    },
    {
      id: "c1-study-huddle",
      text: "¿Te animas a una sesión corta de estudio colaborativo para reforzar lo aprendido?",
      action: { title: "Sesión de Estudio Colaborativo", duration: 1 },
      category: "study",
      daysOfWeek: [1, 2, 3, 4],
      priority: 0.9,
    },
    {
      id: "c1-review-night",
      text: "Cierra el día con un repaso ligero de 20 minutos. ¿Lo agendo?",
      action: { title: "Repaso Ligero Nocturno", duration: 0.33 },
      category: "study",
      timeOfDay: ["evening"],
      priority: 0.85,
    },
  ],

  // -----------------------------------------------------------------
  // Cluster 2: "Académicos de Alto Rendimiento 🏆"
  // -----------------------------------------------------------------
  2: [
    {
      id: "c2-digital-off",
      text: "Tu rendimiento es excepcional, pero he notado poco descanso. ¿Agendamos una hora de desconexión antes de dormir?",
      action: { title: "Hora de Desconexión (sin pantallas)", duration: 1 },
      category: "rest",
      timeOfDay: ["evening", "night"],
      priority: 1.1,
    },
    {
      id: "c2-active-break",
      text: "Para evitar el burnout, es vital tomar pausas. ¿Agendamos un descanso activo de 15 minutos para estirar o caminar?",
      action: { title: "Descanso Activo", duration: 0.25 },
      category: "rest",
      priority: 1,
    },
    {
      id: "c2-hobby",
      text: "No olvides que la creatividad se nutre del ocio. ¿Qué tal si agendas tiempo para un hobby o para socializar esta semana?",
      action: { title: "Tiempo para Hobby/Socializar", duration: 2 },
      category: "wellbeing",
      daysOfWeek: [5, 6, 0],
      priority: 0.95,
    },
    {
      id: "c2-hydration",
      text: "El alto rendimiento consume mucha energía. ¿Agendamos recordatorios para hidratarte y tomar un snack saludable?",
      action: { title: "Pausa para Hidratación y Snack", duration: 0.15 },
      category: "wellbeing",
      priority: 0.9,
    },
    {
      id: "c2-reflection",
      text: "Has logrado mucho. ¿Qué tal si agendamos 10 minutos al final del día para reflexionar o escribir en un diario?",
      action: { title: "Bloque de Reflexión", duration: 0.2 },
      category: "reflection",
      timeOfDay: ["evening", "night"],
      priority: 1,
    },
    {
      id: "c2-free-time",
      text: "Recuerda: a veces, la mejor forma de ser productivo es no hacer nada. Permítete tiempo libre sin culpa.",
      action: null,
      category: "wellbeing",
      priority: 0.7,
      cooldownHours: 72,
    },
    {
      id: "c2-weekly-load",
      text: "Tu carga semanal está fuerte. ¿Agendamos un bloque de recuperación para bajar el ritmo?",
      action: { title: "Bloque de Recuperación", duration: 0.5 },
      category: "rest",
      minLoadHours: 14,
      priority: 1.1,
    },
    {
      id: "c2-early-focus",
      text: "Aprovechemos tu nivel. ¿Agendamos un bloque de enfoque temprano para la tarea más compleja?",
      action: { title: "Bloque de Enfoque Temprano", duration: 1.5 },
      category: "focus",
      timeOfDay: ["morning"],
      priority: 1.05,
    },
  ],

  // -----------------------------------------------------------------
  // Cluster 3: "Perfil en Riesgo ⚠️"
  // -----------------------------------------------------------------
  3: [
    {
      id: "c3-start-small",
      text: "A veces, lo más difícil es empezar. ¿Agendamos solo 25 minutos para la tarea más urgente? Un pequeño paso es una gran victoria.",
      action: { title: "Empezar Tarea (25 min)", duration: 0.5 },
      category: "focus",
      minTasks: 1,
      priority: 1.4,
    },
    {
      id: "c3-plan-week",
      text: "La organización es clave. ¿Agendamos un bloque de 15 minutos para planificar tu semana?",
      action: { title: "Planificar la Semana", duration: 0.25 },
      category: "organization",
      daysOfWeek: [0, 1, 5, 6],
      priority: 1.2,
    },
    {
      id: "c3-split-project",
      text: "Una tarea grande puede ser abrumadora. ¿Tomamos 10 minutos para dividir tu proyecto en pasos más pequeños?",
      action: { title: "Dividir Proyecto Grande", duration: 0.2 },
      category: "organization",
      minTasks: 2,
      priority: 1.2,
    },
    {
      id: "c3-reward-break",
      text: "Después de completar una tarea, ¡mereces una recompensa! ¿Agendamos un descanso de 15 minutos justo después?",
      action: { title: "Descanso de Recompensa", duration: 0.25 },
      category: "wellbeing",
      priority: 0.95,
    },
    {
      id: "c3-track-habits",
      text: "Añadir hábitos pequeños te ayudará a ver progreso. ¿Quieres iniciar con algo simple como revisar apuntes 5 minutos?",
      action: null,
      category: "habits",
      priority: 1,
    },
    {
      id: "c3-focus-reset",
      text: "Si hoy cuesta concentrarse, un bloque corto de 30 minutos puede ayudarte a retomar el ritmo.",
      action: { title: "Bloque de Reinicio (30 min)", duration: 0.5 },
      category: "focus",
      timeOfDay: ["morning", "afternoon"],
      priority: 1.1,
    },
    {
      id: "c3-clean-slate",
      text: "¿Qué tal si despejamos tu lista? Escoge 1 tarea y la convertimos en el objetivo principal de hoy.",
      action: { title: "Tarea Principal del Día", duration: 1 },
      category: "organization",
      minTasks: 3,
      priority: 1.1,
    },
    {
      id: "c3-energy-boost",
      text: "Una pequeña victoria cuenta. ¿Agendamos 10 minutos para revisar un tema sencillo y ganar momentum?",
      action: { title: "Mini Revisión (10 min)", duration: 0.2 },
      category: "study",
      priority: 1.05,
    },
  ],

  // -----------------------------------------------------------------
  // Default: usuarios sin clúster asignado
  // -----------------------------------------------------------------
  default: [
    {
      id: "d-first-task",
      text: "Un buen plan es el primer paso hacia el éxito. ¿Qué quieres lograr hoy? Añade tu primera tarea.",
      action: null,
      category: "organization",
      priority: 1.1,
    },
    {
      id: "d-first-habit",
      text: "Construir un hábito empieza con un solo día. ¿Cuál será el primer hábito que quieres seguir?",
      action: null,
      category: "habits",
      priority: 1,
    },
    {
      id: "d-focus-block",
      text: "¿Agendamos un bloque corto de enfoque para avanzar en lo más importante?",
      action: { title: "Bloque de Enfoque", duration: 1 },
      category: "focus",
      timeOfDay: ["morning", "afternoon"],
      priority: 1,
    },
    {
      id: "d-review-day",
      text: "Cierra el día con un repaso breve de lo aprendido. ¿Lo agendo?",
      action: { title: "Repaso Diario", duration: 0.25 },
      category: "study",
      timeOfDay: ["evening"],
      priority: 0.9,
    },
  ],
};

const DEFAULT_COOLDOWN_HOURS = 36;

const getTimeOfDay = (date) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const buildRecommendationContext = ({
  tasks = [],
  habits = [],
  events = [],
  riskScore = 0.3,
  now = new Date(),
}) => {
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const nowTime = now.getTime();
  const overdueTasks = tasks.filter((task) => {
    if (task.completed || !task.dueDate) return false;
    const due = new Date(task.dueDate).getTime();
    return !Number.isNaN(due) && due < nowTime;
  }).length;

  const habitCompletionRate =
    habits.length === 0
      ? null
      : habits.reduce((acc, habit) => {
          const completedDays = habit.completedDays || [];
          const completedCount = completedDays.filter(Boolean).length;
          return acc + completedCount / 7;
        }, 0) / habits.length;

  const weekAhead = nowTime + 7 * 24 * 60 * 60 * 1000;

  let weeklyLoadHours = 0;
  let upcomingEvents = 0;
  let todayLoadHours = 0;
  const todayKey = now.toDateString();

  events.forEach((event) => {
    const start =
      event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    const startTime = start.getTime();
    const endTime = end.getTime();
    if (startTime >= nowTime && startTime <= weekAhead) {
      upcomingEvents += 1;
      weeklyLoadHours += Math.max((endTime - startTime) / 3600000, 0);
    }
    if (start.toDateString() === todayKey) {
      todayLoadHours += Math.max((endTime - startTime) / 3600000, 0);
    }
  });

  return {
    pendingTasks,
    overdueTasks,
    habitCompletionRate,
    weeklyLoadHours,
    upcomingEvents,
    todayLoadHours,
    timeOfDay: getTimeOfDay(now),
    dayOfWeek: now.getDay(),
    riskScore: riskScore ?? 0.3,
  };
};

const getHistoryEntry = (historyMap, id) =>
  historyMap && id ? historyMap[id] : null;

const isOnCooldown = (historyEntry, cooldownHours) => {
  if (!historyEntry?.lastShownAt) return false;
  const lastShown = Number(historyEntry.lastShownAt);
  if (Number.isNaN(lastShown)) return false;
  const hoursSince = (Date.now() - lastShown) / (1000 * 60 * 60);
  return hoursSince < cooldownHours;
};

const scoreRecommendation = (rule, context, historyEntry) => {
  let score = rule.priority ?? 1;

  if (rule.timeOfDay && !rule.timeOfDay.includes(context.timeOfDay)) {
    score *= 0.25;
  }

  if (rule.daysOfWeek && !rule.daysOfWeek.includes(context.dayOfWeek)) {
    score *= 0.4;
  }

  if (rule.minRisk !== undefined && context.riskScore < rule.minRisk) {
    score *= 0.4;
  }

  if (rule.maxRisk !== undefined && context.riskScore > rule.maxRisk) {
    score *= 0.4;
  }

  if (rule.minTasks !== undefined && context.pendingTasks < rule.minTasks) {
    score *= 0.5;
  }

  if (rule.maxTasks !== undefined && context.pendingTasks > rule.maxTasks) {
    score *= 0.5;
  }

  if (
    rule.minLoadHours !== undefined &&
    context.weeklyLoadHours < rule.minLoadHours
  ) {
    score *= 0.6;
  }

  if (
    rule.maxLoadHours !== undefined &&
    context.weeklyLoadHours > rule.maxLoadHours
  ) {
    score *= 0.6;
  }

  if (context.riskScore >= 0.7) {
    if (["focus", "organization"].includes(rule.category)) {
      score += 1.2;
    } else if (rule.category === "wellbeing") {
      score -= 0.6;
    }
  }

  if (context.overdueTasks > 0) {
    if (["organization", "focus"].includes(rule.category)) {
      score += 0.7;
    } else if (rule.category === "wellbeing") {
      score -= 0.3;
    }
  }

  if (context.habitCompletionRate !== null) {
    if (context.habitCompletionRate < 0.4 && rule.category === "habits") {
      score += 0.8;
    }
    if (context.habitCompletionRate > 0.7 && rule.category === "wellbeing") {
      score += 0.4;
    }
  }

  if (context.weeklyLoadHours > 14 && rule.category === "rest") {
    score += 0.6;
  }
  if (context.weeklyLoadHours < 6 && rule.category === "study") {
    score += 0.4;
  }

  if (historyEntry) {
    const scheduled = historyEntry.scheduledCount || 0;
    const dismissed = historyEntry.dismissedCount || 0;
    const feedbackBoost = clamp((scheduled - dismissed) * 0.2, -0.6, 0.6);
    score += feedbackBoost;
  }

  return Math.max(score, 0);
};

const pickWeightedRecommendation = (candidates) => {
  const total = candidates.reduce((acc, { score }) => acc + score, 0);
  if (total <= 0) return null;
  let random = Math.random() * total;
  for (const candidate of candidates) {
    random -= candidate.score;
    if (random <= 0) return candidate.rule;
  }
  return candidates[candidates.length - 1]?.rule ?? null;
};

/**
 * Recibe el clúster del usuario y devuelve una recomendación (objeto).
 * @param {number|null} cluster - El número del clúster del usuario.
 * @param {object} context - Contexto derivado de hábitos, tareas, riesgo y eventos.
 * @param {object} historyMap - Mapa de historial por id de recomendación.
 * @returns {{id: string, text: string, action: object|null}} - Recomendación final.
 */
export const getRecommendationForProfile = (
  cluster,
  context,
  historyMap = {},
) => {
  const clusterKey =
    cluster !== null && cluster in recommendationRules ? cluster : "default";
  const possibleRecommendations = recommendationRules[clusterKey] || [];

  const candidates = possibleRecommendations
    .filter((rule) => !!rule.id)
    .map((rule) => {
      const historyEntry = getHistoryEntry(historyMap, rule.id);
      const cooldownHours = rule.cooldownHours ?? DEFAULT_COOLDOWN_HOURS;
      if (isOnCooldown(historyEntry, cooldownHours)) {
        return null;
      }
      return {
        rule,
        score: scoreRecommendation(rule, context, historyEntry),
      };
    })
    .filter(Boolean);

  if (candidates.length === 0) {
    const fallback = possibleRecommendations[0];
    return (
      fallback ?? {
        id: "fallback-default",
        text: "Sigue avanzando.",
        action: null,
      }
    );
  }

  return pickWeightedRecommendation(candidates);
};
