import "./BottomNav.css";

export const BottomNav = () => {
  return (
    <nav className="bottom-nav" aria-label="Navegación inferior">
      <a className="bottom-nav-item" href="#calendar-section">
        <i className="fa-solid fa-calendar-days" aria-hidden="true"></i>
        <span>Calendario</span>
      </a>
      <a className="bottom-nav-item" href="#suggestions-section">
        <i className="fa-solid fa-lightbulb" aria-hidden="true"></i>
        <span>Sugerencias</span>
      </a>
      <a className="bottom-nav-item" href="#risk-section">
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        <span>Riesgo</span>
      </a>
      <a className="bottom-nav-item" href="#tasks-section">
        <i className="fa-solid fa-list-check" aria-hidden="true"></i>
        <span>Tareas</span>
      </a>
    </nav>
  );
};
