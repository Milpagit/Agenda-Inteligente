import { useEffect, useState } from "react";

import { Calendar } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../components/CalendarCustom.css";
import "./CalendarPage.css";

import {
  Navbar,
  CalendarEvent,
  CalendarModal,
  FabAddNew,
  FabDelete,
  Sidebar,
  CalendarToolbar,
  SubjectsModal,
} from "../";

import { getMessagesES, localizer } from "../../helpers";
import {
  useUiStore,
  useCalendarStore,
  useAuthStore,
  useTaskStore,
  useHabitStore,
  useRecommendationStore,
  useSubjectStore,
} from "../../hooks";

export const CalendarPage = () => {
  const { user } = useAuthStore();
  const { openDateModal } = useUiStore();
  const { events, setActiveEvent, startLoadingEvents } = useCalendarStore();
  const { subjects, startLoadingSubjects } = useSubjectStore();
  const { startLoadingTasks } = useTaskStore();
  const { startLoadingHabits } = useHabitStore();
  const { startLoadingRecommendation } = useRecommendationStore();

  const [lastView, setLastView] = useState(
    localStorage.getItem("lastView") || "month"
  );

  // Lógica para la animación del toolbar
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

  // Carga todos los datos cuando el usuario se autentica
  useEffect(() => {
    if (user.uid) {
      startLoadingEvents();
      startLoadingTasks();
      startLoadingHabits();
      startLoadingSubjects();
      startLoadingRecommendation();
    }
  }, [user.uid]);

  // Actualiza el estilo del toolbar cuando la vista cambia
  useEffect(() => {
    setToolbarStyle(lastView);
  }, [lastView]);

  // ==================================================================
  // ========= FUNCIÓN CORREGIDA PARA PINTAR EVENTOS POR MATERIA =========
  // ==================================================================
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

  return (
    <>
      <Navbar />

      <div className="calendar-screen">
        <Sidebar />

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

      {/* Renderiza los botones flotantes */}
      <FabAddNew />
      <FabDelete />
    </>
  );
};
