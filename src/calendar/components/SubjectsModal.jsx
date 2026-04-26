import { useState } from "react";
import Modal from "react-modal";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import Swal from "sweetalert2";
import importApi from "../../api/importApi";
import { getAuth } from "firebase/auth";
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

const MAX_SUBJECT_NAME_LENGTH = 60;
const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const subjectFormFields = { name: "", color: presetColors[0] };

const isAllowedImportFile = (file) =>
  file.type === "application/pdf" || file.type.startsWith("image/");

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

    const normalizedName = name.trim();
    if (
      normalizedName.length < 2 ||
      normalizedName.length > MAX_SUBJECT_NAME_LENGTH
    ) {
      Swal.fire(
        "Datos inválidos",
        `El nombre de la materia debe tener entre 2 y ${MAX_SUBJECT_NAME_LENGTH} caracteres.`,
        "warning",
      );
      return;
    }

    const isDuplicate = subjects.some(
      (subject) =>
        subject.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (isDuplicate) {
      Swal.fire(
        "Datos inválidos",
        "Ya tienes una materia con ese nombre.",
        "warning",
      );
      return;
    }

    startSavingSubject({ name: normalizedName, color });
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

    if (!isAllowedImportFile(selectedFile)) {
      Swal.fire(
        "Archivo no válido",
        "El archivo debe ser PDF o imagen.",
        "warning",
      );
      return;
    }

    if (selectedFile.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      Swal.fire(
        "Archivo muy grande",
        "El tamaño máximo permitido es de 10 MB.",
        "warning",
      );
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedEndDate = new Date(endDate);
    selectedEndDate.setHours(0, 0, 0, 0);

    if (selectedEndDate < today) {
      Swal.fire(
        "Fecha no válida",
        "La fecha de fin no puede ser anterior a hoy.",
        "warning",
      );
      return;
    }

    setIsImporting(true);
    Swal.fire({
      title: "Importando...",
      text: "Puede tardar... No cierres esta ventana.",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado. Inicia sesión.");
      }
      const token = await user.getIdToken(true);

      const fileBase64 = await readFileAsBase64(selectedFile);
      const payload = {
        fileData: fileBase64,
        endDate: endDate.toISOString(),
        fileType: selectedFile.type,
      };

      await importApi.post("", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire("¡Éxito!", "Horario importado.", "success");
      startLoadingEvents();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error al importar horario:", error);
      const backendError = error.response?.data?.error;
      const displayError =
        backendError ||
        (error.message === "Network Error"
          ? "Error de red o CORS. Verifica los logs del servidor."
          : error.message) ||
        "No se pudo procesar el archivo.";
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
                maxLength={MAX_SUBJECT_NAME_LENGTH}
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
              Añadir Materia Manual
            </button>
          </form>
        </div>
        <h5>Mis Materias</h5>
        <ul className="subjects-list">
          {subjects.map((subject) => (
            <li key={subject.id} className="subject-item">
              <span
                className="subject-color-dot"
                style={{ backgroundColor: subject.color }}
              ></span>
              <span className="subject-name">{subject.name}</span>
              <button
                className="delete-btn"
                onClick={() => startDeletingSubject(subject.id)}
              >
                &times;
              </button>
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
