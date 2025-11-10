// src/calendar/components/CalendarToolbar.jsx
import React, { useEffect, useRef } from "react";
import "./CalendarToolbar.css";

// --- Acepta 'isMobile' como prop ---
export const CalendarToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  isMobile,
}) => {
  const viewBtnGroupRef = useRef(); // Referencia para la animación

  // Lógica de navegación
  const goToBack = () => onNavigate("PREV");
  const goToNext = () => onNavigate("NEXT");
  const goToCurrent = () => onNavigate("TODAY");
  const handleViewChange = (newView) => onView(newView);

  // Efecto para la animación deslizante (solo en escritorio)
  useEffect(() => {
    // Si es móvil, no calculamos la animación
    if (isMobile) return;

    const groupElement = viewBtnGroupRef.current;
    if (!groupElement) return;

    const activeButton = groupElement.querySelector("button.active");
    if (!activeButton) return;

    const { offsetLeft, offsetWidth } = activeButton;

    groupElement.style.setProperty("--left", `${offsetLeft}px`);
    groupElement.style.setProperty("--width", `${offsetWidth}px`);
  }, [view, isMobile]); // Se re-ejecuta si 'view' o 'isMobile' cambian

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
        {/* --- Añade la clase 'is-mobile' dinámicamente --- */}
        <div
          ref={viewBtnGroupRef}
          className={`view-btn-group ${isMobile ? "is-mobile" : ""}`}
        >
          {/* --- Oculta botones "Mes" y "Semana" si 'isMobile' es true --- */}
          {!isMobile && (
            <>
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
            </>
          )}

          {/* Estas vistas SÍ se muestran en móvil */}
          <button
            className={view === "day" ? "active" : ""}
            onClick={() => handleViewChange("day")}
          >
            Día
          </button>

          {/* (El botón "Agenda" lo quitamos, como acordamos) */}
        </div>
      </div>
    </div>
  );
};
