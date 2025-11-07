// src/calendar/components/Sidebar.jsx

import { Calendar } from "react-big-calendar";
import { localizer, getMessagesES } from "../../helpers";
import { useCalendarStore, useUiStore } from "../../hooks";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Sidebar.css";
import { TaskList } from "./TaskList";
import { HabitTracker } from "./HabitTracker";
import { RecommendationsWidget } from "./RecommendationsWidget";

const miniCalFormats = {
  /**
   * Esta función le dice al mini-calendario cómo mostrar
   * las cabeceras de los días de la semana (D, L, M, MI...).
   */
  weekdayFormat: (date) => {
    // Obtenemos el índice del día (0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles...)
    const dayIndex = date.getDay();

    // Creamos nuestro array de iniciales en español
    const spanishDays = ["D", "L", "M", "MI", "J", "V", "S"];

    // Devolvemos la inicial correcta
    return spanishDays[dayIndex];
  },
};

export const Sidebar = () => {
  // Hooks to manage UI and calendar state
  const { openDateModal, openSubjectsModal } = useUiStore();
  const { setActiveEvent } = useCalendarStore();

  // Logic to display the current date
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString("es-ES", { month: "long" });
  const year = today.getFullYear();

  // Function for the "Crear Evento" button
  const handleCreateEventClick = () => {
    setActiveEvent(null); // Clear any previously active event
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

      {/* Button to create an event */}
      <button
        className="btn btn-primary create-event-btn"
        onClick={handleCreateEventClick}
      >
        Crear Evento
      </button>

      {/* New Button to Manage Subjects */}
      <button
        className="btn btn-secondary manage-subjects-btn"
        onClick={openSubjectsModal}
      >
        Gestionar Materias
      </button>

      <RecommendationsWidget />

      <div className="mini-calendar-container">
        <Calendar
          localizer={localizer}
          defaultView="month"
          toolbar={false}
          style={{ height: 280 }}
          defaultDate={today}
          messages={getMessagesES()} // Sets the mini-calendar days to Spanish
          formats={miniCalFormats} // <-- ✅ 2. Aplicamos los formatos aquí
        />
      </div>

      <TaskList />

      <HabitTracker />
    </aside>
  );
};
