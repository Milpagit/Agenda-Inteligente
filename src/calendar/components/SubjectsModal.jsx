// src/calendar/components/SubjectsModal.jsx
import { useState } from "react";
import Modal from "react-modal";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import Swal from "sweetalert2";
import importApi from "../../api/importApi"; // Usa la API correcta
import { getAuth } from "firebase/auth"; // <-- Importar getAuth
import {
  useUiStore,
  useSubjectStore,
  useForm,
  useCalendarStore,
} from "../../hooks";
import { addMonths } from "date-fns";

import "react-datepicker/dist/react-datepicker.css";
import "./SubjectsModal.css";

registerLocale("es", es);

// Paleta de colores
const presetColors = [
  "#46487A",
  "#7786C6",
  "#D9534F",
  "#F0AD4E",
  "#a07e17ff",
  "#1a791aff",
  "#5BC0DE",
  "#F9B0C3",
  "#6C757D",
  "#343A40",
];

const subjectFormFields = { name: "", color: presetColors[0] };

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "500px",
  },
};
Modal.setAppElement("#root");

export const SubjectsModal = () => {
  const { isSubjectsModalOpen, closeSubjectsModal } = useUiStore();
  const { subjects, startSavingSubject, startDeletingSubject } =
    useSubjectStore();
  const { startLoadingEvents } = useCalendarStore();
  const { name, color, onInputChange, onResetForm } =
    useForm(subjectFormFields);

  const [selectedFile, setSelectedFile] = useState(null);
  const [endDate, setEndDate] = useState(addMonths(new Date(), 4));
  const [isImporting, setIsImporting] = useState(false);

  const handleNewSubjectSubmit = (event) => {
    event.preventDefault();
    if (name.trim().length <= 1) return;
    startSavingSubject({ name, color });
    onResetForm();
  };
  const handleColorClick = (selectedColor) => {
    const fakeEvent = { target: { name: "color", value: selectedColor } };
    onInputChange(fakeEvent);
  };
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  // Función para leer archivo como Base64 (sin cambios)
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]); // Solo parte base64
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImportSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile || !endDate) {
      Swal.fire("Faltan datos", "Selecciona archivo y fecha fin.", "warning");
      return;
    }

    setIsImporting(true);
    Swal.fire({
      title: "Importando...",
      text: "Puede tardar... No cierres esta ventana.",
      allowOutsideClick: false,
      showConfirmButton: false, // 1. Ocultamos el botón que causa el error
      didOpen: () => {
        Swal.showLoading(); // 2. Llamamos al loader manualmente
      },
    });

    try {
      // --- Obtener token fresco ---
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado. Inicia sesión.");
      }
      const token = await user.getIdToken(true); // Token fresco
      console.log(
        "[handleImportSubmit] Fresh ID Token obtained:",
        token ? token.substring(0, 20) + "..." : "null"
      );
      // --- Fin Obtener Token ---

      const fileBase64 = await readFileAsBase64(selectedFile);
      // --- Enviar payload como JSON ---
      const payload = {
        fileData: fileBase64,
        endDate: endDate.toISOString(),
        fileType: selectedFile.type,
      };
      console.log("Payload being sent (JSON):", {
        ...payload,
        fileData: payload.fileData.substring(0, 50) + "...",
      });
      // --- Fin Enviar JSON ---

      // --- Llamar a importApi con ruta vacía y token en header ---
      await importApi.post("", payload, {
        // <-- Ruta vacía ''
        headers: {
          Authorization: `Bearer ${token}`, // Enviar token fresco
        },
      });
      // --- Fin Llamada ---

      Swal.fire("¡Éxito!", "Horario importado.", "success");
      startLoadingEvents();
      setSelectedFile(null);
      // closeSubjectsModal();
    } catch (error) {
      console.error("Error al importar horario:", error);
      const backendError = error.response?.data?.error;
      const displayError =
        backendError ||
        (error.message === "Network Error"
          ? "Error de red o CORS. Verifica los logs del servidor."
          : error.message) ||
        "No se pudo procesar el archivo.";
      // Añadir log específico para CORS
      if (error.code === "ERR_NETWORK" || error.message.includes("CORS")) {
        console.error("CORS Error Detail:", error);
      }
      Swal.fire("Error", displayError, "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isSubjectsModalOpen}
      onRequestClose={closeSubjectsModal}
      style={customStyles}
      className="modal"
      overlayClassName="modal-fondo"
      closeTimeoutMS={200}
    >
      <div className="subjects-modal-header">
        <h2>Gestionar Materias</h2>
      </div>
      <hr />
      <div className="subjects-container">
        {/* --- Sección: Importar Horario --- */}
        <div className="import-schedule-section">
          <h5>Importar Horario desde Archivo</h5>
          <form onSubmit={handleImportSubmit}>
            <div className="form-group">
              <label htmlFor="scheduleFile">Selecciona Imagen o PDF:</label>
              <input
                type="file"
                id="scheduleFile"
                className="form-control"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              {selectedFile && (
                <span className="file-name">Archivo: {selectedFile.name}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Fecha de Fin del Periodo:</label>
              <DatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                className="form-control"
                dateFormat="dd/MM/yyyy"
                locale="es"
                minDate={new Date()}
                disabled={isImporting}
              />
            </div>
            <button
              type="submit"
              className="btn btn-secondary import-schedule-btn"
              disabled={isImporting || !selectedFile}
            >
              <i
                className={`fa-solid ${
                  isImporting ? "fa-spinner fa-spin" : "fa-file-import"
                }`}
              ></i>
              {isImporting ? "Procesando..." : "Importar Horario"}
            </button>
          </form>
        </div>
        {/* --- Sección: Añadir Materia Manualmente --- */}
        <div className="add-subject-section">
          <h5>Añadir Materia Manualmente</h5>
          <form className="add-subject-form" onSubmit={handleNewSubjectSubmit}>
            <div className="form-group-name">
              <label htmlFor="subjectName">Nombre de la materia</label>
              <input
                id="subjectName"
                type="text"
                placeholder="Ej: Cálculo Diferencial"
                className="form-control"
                name="name"
                value={name}
                onChange={onInputChange}
              />
            </div>
            <div className="form-group-color">
              <label>Elige un color</label>
              <div className="color-palette">
                {presetColors.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    className={`color-swatch ${
                      color === preset ? "selected" : ""
                    }`}
                    style={{ backgroundColor: preset }}
                    onClick={() => handleColorClick(preset)}
                    title={preset}
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-add-subject">
              {" "}
              Añadir Materia Manual{" "}
            </button>
          </form>
        </div>
        {/* --- Sección: Lista de Materias Existentes --- */}
        <h5>Mis Materias</h5>
        <ul className="subjects-list">
          {subjects.map((subject) => (
            <li key={subject.id} className="subject-item">
              {" "}
              <span
                className="subject-color-dot"
                style={{ backgroundColor: subject.color }}
              ></span>{" "}
              <span className="subject-name">{subject.name}</span>{" "}
              <button
                className="delete-btn"
                onClick={() => startDeletingSubject(subject.id)}
              >
                {" "}
                &times;{" "}
              </button>{" "}
            </li>
          ))}
          {subjects.length === 0 && (
            <li className="no-subjects-message">
              No has añadido ninguna materia todavía.
            </li>
          )}
        </ul>
      </div>
    </Modal>
  );
};
