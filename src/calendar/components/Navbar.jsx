// src/calendar/components/Navbar.jsx

import { useAuthStore } from "../../hooks";
import "./Navbar.css"; // ✅ Importa los nuevos estilos

export const Navbar = () => {
  const { startLogout, user } = useAuthStore();

  // Obtener la inicial del nombre del usuario para el avatar
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="navbar-container">
      <span className="navbar-brand">
        <i className="fas fa-calendar-alt"></i>
        &nbsp; CalendarApp
      </span>

      <div className="navbar-right-section">
        <div className="user-avatar">{userInitial}</div>

        <button onClick={startLogout} className="logout-btn">
          {/* ✅ Icono más minimalista de Font Awesome */}
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
};
