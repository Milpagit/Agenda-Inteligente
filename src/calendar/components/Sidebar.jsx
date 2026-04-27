// src/calendar/components/Sidebar.jsx

import { Calendar } from "react-big-calendar";
import { localizer, getMessagesES } from "../../helpers";
import { useCalendarStore, useUiStore, useAuthStore } from "../../hooks";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Sidebar.css";
import { TaskList } from "./TaskList";
import { HabitTracker } from "./HabitTracker";
import { RecommendationsWidget } from "./RecommendationsWidget";
import { RiskMeter } from "./RiskMeter";
import { addHours } from "date-fns"; // Importar addHours

// --- Formatos del Mini-Calendario (D, L, M, MI...) ---
const miniCalFormats = {
  weekdayFormat: (date) => {
    const dayIndex = date.getDay();
    const spanishDays = ["D", "L", "M", "MI", "J", "V", "S"];
    return spanishDays[dayIndex];
  },
};

// --- Recibimos 'currentView' como prop desde CalendarPage ---
export const Sidebar = ({ currentView }) => {
  // Hooks
  const { openDateModal, openSubjectsModal } = useUiStore();
  const { setActiveEvent } = useCalendarStore();
  const { user } = useAuthStore(); // Hook para leer el 'user' (y riskScore)

  // Lógica para la fecha grande
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString("es-ES", { month: "long" });
  const year = today.getFullYear();

  // Función para el botón "Crear Evento"
  const handleCreateEventClick = () => {
    setActiveEvent(null); // Limpia evento activo
    openDateModal();
  };

  // --- Handler para el clic en el Mini-Calendario ---
  const handleMiniCalSelect = (slotInfo) => {
    // 'slotInfo.start' es el objeto Date del día en que el usuario hizo clic
    const clickedDate = slotInfo.start;

    // 1. Configuramos un nuevo evento en blanco con la fecha seleccionada
    setActiveEvent({
      title: "",
      notes: "",
      start: clickedDate,
      end: addHours(clickedDate, 1), // Por defecto, 1 hora de duración
      subject: null,
      user: { uid: user.uid, name: user.name }, // Aseguramos el 'user'
    });

    // 2. Abrimos el modal
    openDateModal();
  };

  return (
    <aside className="calendar-sidebar">
      <div className="date-display">
        <div className="date-number">{day}</div>
        <div className="date-text">
          {month} {year}
        </div>
      </div>

      {/* Botones de Acción */}
      <button
        className="btn btn-primary create-event-btn"
        onClick={handleCreateEventClick}
      >
        Crear Evento
      </button>

      <button
        className="btn btn-secondary manage-subjects-btn"
        onClick={openSubjectsModal}
      >
        Gestionar Materias
      </button>

      {/* Widget de Sugerencias (K-Means) */}
      <RecommendationsWidget />

      {/* Medidor de Riesgo (Regresión) */}
      <RiskMeter />

      {/* --- Mini Calendario (Renderizado Condicional) --- */}
      {/* Solo mostramos el mini-calendario si la vista NO es 'month' */}
      {currentView !== "month" && (
        <div className="mini-calendar-container">
          <Calendar
            localizer={localizer}
            defaultView="month"
            toolbar={false}
            style={{ height: 280 }}
            defaultDate={today}
            messages={getMessagesES()}
            formats={miniCalFormats}
            selectable // Permite seleccionar días
            onSelectSlot={handleMiniCalSelect} // Llama a nuestro handler
            onDrillDown={() => {}} // Desactiva el "zoom" por defecto
          />
        </div>
      )}

      {/* Widgets de Tareas y Hábitos */}
      <TaskList />
      <HabitTracker />
    </aside>
  );
};
