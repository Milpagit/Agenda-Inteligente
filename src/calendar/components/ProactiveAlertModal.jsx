import Modal from "react-modal";
import { useNotificationStore } from "../../hooks";

// --- ✅ 1. Importa el CSS para el nuevo diseño ---
import "./ProactiveAlertModal.css";

// --- ✅ 2. Importa tu imagen de la mascota ---
// (Asegúrate de que la ruta sea correcta. Esto asume que 'assets' está en src/)
import mascotImage from "../../assets/mascota.png";

// Estilos JS para centrar el modal (sin cambios)
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "480px", // Un ancho un poco más pequeño para este diseño
    width: "90%",
  },
};

Modal.setAppElement("#root");

export const ProactiveAlertModal = () => {
  const { isModalOpen, proactiveAlerts, closeAlertsModal } =
    useNotificationStore();

  // Contamos los pendientes
  const pendingCount = proactiveAlerts.length;

  return (
    <Modal
      isOpen={isModalOpen}
      onRequestClose={closeAlertsModal}
      style={customStyles}
      className="modal proactive-alert-modal" // <-- 3. Añadimos una clase CSS
      overlayClassName="modal-fondo"
    >
      {/* --- 4. Encabezado con la Mascota --- */}
      <div className="alert-header">
        <img src={mascotImage} alt="Mascota" className="alert-mascot" />
      </div>

      {/* --- 5. Título y Resumen --- */}
      <h1>¡Bienvenido!</h1>
      <p className="alert-summary">
        Tienes <strong>{pendingCount}</strong>{" "}
        {pendingCount === 1 ? "pendiente importante" : "pendientes importantes"}
        :
      </p>

      {/* --- 6. Lista de Pendientes --- */}
      <ul className="alerts-list">
        {proactiveAlerts.map((alert, index) => (
          <li key={index} className={`alerta-${alert.insistencia}`}>
            {/* Usamos solo el texto de la alerta */}
            {alert.text.replace("(Modo Prueba)", "").trim()}
          </li>
        ))}
      </ul>

      {/* --- 7. Botón "Aceptar" --- */}
      <button className="btn btn-primary" onClick={closeAlertsModal}>
        Aceptar
      </button>
    </Modal>
  );
};
