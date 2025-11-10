import { useEffect, useState } from "react";

import { Calendar } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../components/CalendarCustom.css";
import "./CalendarPage.css";

// Importa desde el "barril" de la carpeta 'calendar' (../index.js)
import {
  Navbar,
  CalendarEvent,
  CalendarModal,
  FabAddNew,
  FabDelete,
  Sidebar,
  CalendarToolbar,
  SubjectsModal,
  ProactiveAlertModal, // <-- 1. Importación del nuevo modal
} from "../";

// Importa desde el "barril" de la carpeta 'helpers' (../../helpers/index.js)
import { getMessagesES, localizer } from "../../helpers";

// Importa desde el "barril" de la carpeta 'hooks' (../../hooks/index.js)
import {
  useUiStore,
  useCalendarStore,
  useAuthStore,
  useTaskStore,
  useHabitStore,
  useRecommendationStore,
  useSubjectStore,
  useNotificationStore, // <-- 2. Importación del nuevo hook
} from "../../hooks";

export const CalendarPage = () => {
  // --- Hooks ---
  const { user } = useAuthStore();
  const { openDateModal } = useUiStore();
  const { events, setActiveEvent, startLoadingEvents } = useCalendarStore();
  const { subjects, startLoadingSubjects } = useSubjectStore();
  const { startLoadingTasks } = useTaskStore();
  const { startLoadingHabits } = useHabitStore();
  const { startLoadingRecommendation } = useRecommendationStore();
  const { startLoadingAlerts } = useNotificationStore(); // <-- 3. Usar el hook

  const [lastView, setLastView] = useState(
    localStorage.getItem("lastView") || "month"
  );

  // --- Lógica del Toolbar (sin cambios) ---
  const setToolbarStyle = (view) => {
    const root = document.documentElement;
    if (view === "month") {
      root.style.setProperty("--left", "4px");
      root.style.setProperty("--width", "65px");
    } else if (view === "week") {
      root.style.setProperty("--left", "74px");
      root.style.setProperty("--width", "85px");
    } else if (view === "day") {
      root.style.setProperty("--left", "164px");
      root.style.setProperty("--width", "55px");
    } else if (view === "agenda") {
      root.style.setProperty("--left", "224px");
      root.style.setProperty("--width", "85px");
    }
  };

  // --- useEffect principal de carga de datos ---
  useEffect(() => {
    if (user.uid) {
      startLoadingEvents();
      startLoadingTasks();
      startLoadingHabits();
      startLoadingSubjects();
      startLoadingRecommendation();
      startLoadingAlerts(); // <-- 4. LLAMAR A LA NUEVA FUNCIÓN
    }
  }, [user.uid]);

  // --- useEffect del Toolbar (sin cambios) ---
  useEffect(() => {
    setToolbarStyle(lastView);
  }, [lastView]);

  // --- Estilos de eventos (sin cambios) ---
  const eventStyleGetter = (event, start, end, isSelected) => {
    // Buscamos la materia completa en la lista de materias (subjects),
    // usando el ID que está guardado dentro del evento (event.subject).
    const eventSubject = subjects.find((s) => s.id === event.subject);

    // Si encontramos la materia, usamos su color. Si no, usamos un color por defecto.
    const backgroundColor = eventSubject ? eventSubject.color : "#7786C6";

    const style = {
      backgroundColor: backgroundColor,
      borderRadius: "8px",
      opacity: 0.9,
      color: "white",
      border: "0px",
      display: "block",
    };
    return { style };
  };

  // --- Handlers del calendario (sin cambios) ---
  const onDoubleClick = (event) => {
    openDateModal();
  };

  const onSelect = (event) => {
    setActiveEvent(event);
  };

  const onViewChanged = (view) => {
    localStorage.setItem("lastView", view);
    setLastView(view);
    setToolbarStyle(view);
  };

  // --- Render ---
  return (
    <>
      <Navbar />
      <div className="calendar-screen">
        <Sidebar currentView={lastView} />

        <div className="calendar-main-content">
          <Calendar
            culture="es"
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ flexGrow: 1 }}
            messages={getMessagesES()}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CalendarEvent,
              toolbar: CalendarToolbar,
            }}
            view={lastView}
            onView={onViewChanged}
            onSelectEvent={onSelect}
            onDoubleClickEvent={onDoubleClick}
          />
        </div>
      </div>
      {/* Renderiza todos los modales */}
      <CalendarModal />
      <SubjectsModal />
      <ProactiveAlertModal /> {/* <-- 5. RENDERIZAR EL NUEVO MODAL */}
      {/* Renderiza los botones flotantes */}
      <FabAddNew />
      <FabDelete />
    </>
  );
};
