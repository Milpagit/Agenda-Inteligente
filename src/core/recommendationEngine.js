// src/core/recommendationEngine.js

/**
 * Este es el "Libro de Jugadas" de la inteligencia artificial.
 * Cada recomendación es un objeto con dos propiedades:
 * - text: El consejo que verá el usuario.
 * - action: Un objeto con datos para una acción (o null si es solo informativo).
 * - title: El título del evento a agendar.
 * - duration: La duración en horas del evento.
 */
const recommendationRules = {
  // -----------------------------------------------------------------
  // Cluster 0: "Disciplinados y Saludables 🧘‍♂️"
  // Objetivo: Proponer retos, técnicas de profundización y reforzar el buen trabajo.
  // -----------------------------------------------------------------
  0: [
    {
      text: "Tu balance entre estudio y bienestar es excelente. Para ir un paso más allá, ¿pruebas la técnica de Feynman para dominar un tema complejo? Te agendo un bloque para intentarlo.",
      action: { title: "Práctica: Técnica Feynman", duration: 1 },
    },
    {
      text: "Mantienes una gran disciplina. Para evitar la monotonía, ¿agendamos una sesión de 'revisión activa' donde te expliques los temas a ti mismo en voz alta?",
      action: { title: "Sesión de Revisión Activa", duration: 1.5 },
    },
    {
      text: "Tu memoria es excelente. Para retener información a muy largo plazo, ¿probamos agendar sesiones de 'Repetición Espaciada' para tus materias clave?",
      action: { title: "Estudio con Repetición Espaciada", duration: 0.5 },
    },
    {
      text: "Tu constancia con el ejercicio es admirable. Recuerda que un cuerpo sano apoya una mente sana. ¡Sigue así!",
      action: null,
    },
    {
      text: "Mantienes un gran foco. Para potenciarlo aún más, ¿qué tal una breve sesión de mindfulness antes de tu próxima sesión de estudio intensivo?",
      action: { title: "Sesión de Mindfulness", duration: 0.25 },
    },
    {
      text: "¡Vas por un camino excelente! No hay sugerencias críticas por ahora. Tu balance es tu mayor fortaleza.",
      action: null,
    },
  ],

  // -----------------------------------------------------------------
  // Cluster 1: "Socialmente Activos y Esforzados 📱"
  // Objetivo: Mejorar la eficiencia del estudio y ayudar a gestionar distracciones.
  // -----------------------------------------------------------------
  1: [
    {
      text: "Estás invirtiendo mucho tiempo, ¡genial! Para hacerlo más efectivo, ¿agendamos una sesión de estudio usando la técnica Pomodoro (25 min de foco, 5 de descanso)?",
      action: { title: "Estudio con Pomodoro", duration: 0.5 },
    },
    {
      text: "He notado un alto uso de redes sociales. Para mejorar tu concentración, ¿qué tal un bloque de 'Foco Profundo' sin móvil antes de tu próxima entrega?",
      action: { title: "Bloque de Foco Profundo", duration: 1.5 },
    },
    {
      text: "Tu esfuerzo es enorme, pero el descanso es clave para la memoria. ¿Agendamos una pausa programada de 15 minutos entre tus bloques de estudio de la tarde?",
      action: { title: "Pausa Programada", duration: 0.25 },
    },
    {
      text: "Tu entorno de estudio es clave. Un espacio ordenado promueve una mente ordenada. ¿Agendamos 15 minutos para organizar tu escritorio antes de empezar a estudiar?",
      action: { title: "Organizar Espacio de Estudio", duration: 0.25 },
    },
    {
      text: "Veo que tienes varias tareas pequeñas en tu lista. ¿Probamos agruparlas en un 'bloque de tareas rápidas' para despacharlas todas juntas y sentir el avance?",
      action: { title: "Bloque de Tareas Rápidas", duration: 1 },
    },
    {
      text: "Tu dedicación es admirable. Considera usar apps que bloqueen redes sociales durante tus horas de estudio para maximizar ese gran esfuerzo que haces.",
      action: null,
    },
  ],

  // -----------------------------------------------------------------
  // Cluster 2: "Académicos de Alto Rendimiento 🏆"
  // Objetivo: Fomentar el descanso y el bienestar para prevenir el burnout y mantener el rendimiento.
  // -----------------------------------------------------------------
  2: [
    {
      text: "Tu rendimiento es excepcional, pero he notado que duermes poco. El descanso es clave para el alto rendimiento a largo plazo. ¿Agendamos una hora de 'desconexión' antes de dormir?",
      action: { title: "Hora de Desconexión (sin pantallas)", duration: 1 },
    },
    {
      text: "Eres una máquina de estudiar. Para evitar el burnout, es vital tomar pausas. ¿Agendamos un breve descanso activo de 15 minutos para estirar o caminar?",
      action: { title: "Descanso Activo", duration: 0.25 },
    },
    {
      text: "Tu dedicación es impresionante. No olvides que la creatividad se nutre del ocio. ¿Qué tal si agendas tiempo para un hobby o para socializar esta semana?",
      action: { title: "Tiempo para Hobby/Socializar", duration: 2 },
    },
    {
      text: "El alto rendimiento consume mucha energía. ¿Agendamos recordatorios para hidratarte y comer un snack saludable durante tus largas sesiones de estudio?",
      action: { title: "Pausa para Hidratación y Snack", duration: 0.15 },
    },
    {
      text: "Has logrado mucho. Para procesar tus victorias y evitar el agotamiento, ¿qué tal si agendamos 10 minutos al final del día solo para reflexionar o escribir en un diario?",
      action: { title: "Bloque de Reflexión", duration: 0.2 },
    },
    {
      text: "Recuerda: a veces, la mejor forma de ser productivo es no hacer nada. Permítete tener tiempo libre sin culpa. ¡Te lo has ganado!",
      action: null,
    },
  ],

  // -----------------------------------------------------------------
  // Cluster 3: "Perfil en Riesgo ⚠️"
  // Objetivo: Motivar, proponer pequeños pasos y fomentar la organización básica para construir momentum.
  // -----------------------------------------------------------------
  3: [
    {
      text: "A veces, lo más difícil es empezar. ¿Qué te parece si agendamos solo 25 minutos para la tarea más urgente? Un pequeño paso es una gran victoria.",
      action: { title: "Empezar Tarea (25 min)", duration: 0.5 },
    },
    {
      text: "Veo que tienes varias tareas pendientes y la organización es clave. ¿Agendamos un bloque de 15 minutos solo para planificar tu semana?",
      action: { title: "Planificar la Semana", duration: 0.25 },
    },
    {
      text: "Una tarea grande puede ser abrumadora. ¿Tomamos 10 minutos para dividir tu 'Proyecto Final' en pasos más pequeños y manejables en tu lista de tareas?",
      action: { title: "Dividir Proyecto Grande", duration: 0.2 },
    },
    {
      text: "Después de completar una tarea, ¡mereces una recompensa! ¿Agendamos un descanso de 15 minutos para ver un video o escuchar música justo después?",
      action: { title: "Descanso de Recompensa", duration: 0.25 },
    },
    {
      text: "¡Ánimo! Cada pequeño esfuerzo cuenta. Recuerda añadir tus tareas y hábitos para que pueda ayudarte a ver tu progreso.",
      action: null,
    },
    {
      text: "Construir un hábito positivo es poderoso. ¿Qué tal si empezamos con uno muy pequeño, como 'Revisar apuntes por 5 minutos'? Puedes añadirlo en la sección de hábitos.",
      action: null,
    },
  ],

  // -----------------------------------------------------------------
  // Default: Para usuarios sin clúster asignado.
  // -----------------------------------------------------------------
  default: [
    {
      text: "Un buen plan es el primer paso hacia el éxito. ¿Qué quieres lograr hoy? Añade tu primera tarea.",
      action: null,
    },
    {
      text: "Construir un buen hábito empieza con un solo día. ¿Cuál será el primer hábito que quieres seguir?",
      action: null,
    },
  ],
};

/**
 * Recibe el clúster del usuario y devuelve una recomendación (objeto).
 * @param {number|null} cluster - El número del clúster del usuario.
 * @returns {{text: string, action: object|null}} - Un objeto de recomendación.
 */
export const getRecommendationForProfile = (cluster) => {
  // Asegurarse de que el clúster es un número válido o usar 'default'
  const clusterKey =
    cluster !== null && cluster in recommendationRules ? cluster : "default";
  const possibleRecommendations = recommendationRules[clusterKey];

  // Selecciona una recomendación aleatoria de la lista para ese perfil
  const randomIndex = Math.floor(
    Math.random() * possibleRecommendations.length
  );

  return possibleRecommendations[randomIndex];
};
