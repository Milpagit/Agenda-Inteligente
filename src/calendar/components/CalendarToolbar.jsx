// src/calendar/components/CalendarToolbar.jsx
import React, { useEffect, useRef } from "react";
import "./CalendarToolbar.css";

export const CalendarToolbar = ({ label, onNavigate, onView, view }) => {
  const viewBtnGroupRef = useRef(); // Referencia al contenedor de botones

  // Lógica de navegación (sin cambios)
  const goToBack = () => onNavigate("PREV");
  const goToNext = () => onNavigate("NEXT");
  const goToCurrent = () => onNavigate("TODAY");
  const handleViewChange = (newView) => onView(newView);

  // ✅ La magia para la animación automática
  useEffect(() => {
    const groupElement = viewBtnGroupRef.current;
    if (!groupElement) return;

    const activeButton = groupElement.querySelector("button.active");
    if (!activeButton) return;

    const { offsetLeft, offsetWidth } = activeButton;

    groupElement.style.setProperty("--left", `${offsetLeft}px`);
    groupElement.style.setProperty("--width", `${offsetWidth}px`);
  }, [view]); // Se ejecuta cada vez que la 'view' cambia

  return (
    <div className="custom-toolbar-container">
      {/* Sección Izquierda: Navegación y Título */}
      <div className="toolbar-section-left">
        <button className="nav-btn" onClick={goToCurrent}>
          Hoy
        </button>
        <button className="nav-btn-arrow" onClick={goToBack}>
          &lt;
        </button>
        <button className="nav-btn-arrow" onClick={goToNext}>
          &gt;
        </button>
        <span className="toolbar-label">{label}</span>
      </div>

      {/* Sección Derecha: Vistas */}
      <div className="toolbar-section-right">
        {/* ✅ Añadimos la referencia aquí */}
        <div ref={viewBtnGroupRef} className="view-btn-group">
          <button
            className={view === "month" ? "active" : ""}
            onClick={() => handleViewChange("month")}
          >
            Mes
          </button>
          <button
            className={view === "week" ? "active" : ""}
            onClick={() => handleViewChange("week")}
          >
            Semana
          </button>
          <button
            className={view === "day" ? "active" : ""}
            onClick={() => handleViewChange("day")}
          >
            Día
          </button>
          <button
            className={view === "agenda" ? "active" : ""}
            onClick={() => handleViewChange("agenda")}
          >
            Agenda
          </button>
        </div>
      </div>
    </div>
  );
};
