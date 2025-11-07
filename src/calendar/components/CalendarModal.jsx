import "./CalendarModal.css"; // <-- AÑADE ESTA LÍNEA
import { useEffect, useMemo, useState } from "react";
import { addHours, differenceInSeconds, setHours, setMinutes } from "date-fns"; // Importar setHours/setMinutes

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import Modal from "react-modal";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// CSS Adicional para mejorar el DatePicker
import "./CalendarModal.css";

import es from "date-fns/locale/es";
import { useCalendarStore, useUiStore, useSubjectStore } from "../../hooks";

registerLocale("es", es);

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "550px", // Un poco más ancho para el nuevo diseño
    width: "90%",
  },
};

Modal.setAppElement("#root");

export const CalendarModal = () => {
  const { isDateModalOpen, closeDateModal } = useUiStore();
  const { activeEvent, startSavingEvent } = useCalendarStore();
  const { subjects } = useSubjectStore();

  const [formSubmitted, setFormSubmitted] = useState(false);

  // --- ✅ CAMBIO 1: Estado para controlar si es todo el día ---
  const [isAllDay, setIsAllDay] = useState(false);
  // --- Fin CAMBIO 1 ---

  const [formValues, setFormValues] = useState({
    title: "",
    notes: "",
    start: new Date(),
    end: addHours(new Date(), 1), // Por defecto, 1 hora de duración
    subject: "",
  });

  const titleClass = useMemo(() => {
    if (!formSubmitted) return "";
    return formValues.title.length > 0 ? "" : "is-invalid";
  }, [formValues.title, formSubmitted]);

  useEffect(() => {
    if (activeEvent !== null) {
      setFormValues({ ...activeEvent });
      // Detectar si el evento cargado es de todo el día
      const diff = differenceInSeconds(activeEvent.end, activeEvent.start);
      setIsAllDay(diff === 0 || diff >= 86400); // 0 segundos o 24h+
    } else {
      // Resetear al crear nuevo evento
      const now = new Date();
      setFormValues({
        title: "",
        notes: "",
        start: now,
        end: addHours(now, 1),
        subject: "",
      });
      setIsAllDay(false);
    }
  }, [activeEvent]);

  const onInputChange = ({ target }) => {
    setFormValues({
      ...formValues,
      [target.name]: target.value,
    });
  };

  // --- ✅ CAMBIO 2: Un solo manejador para ambas fechas ---
  const onDateChanged = (event, changing) => {
    let newStart = formValues.start;
    let newEnd = formValues.end;

    if (changing === "start") {
      newStart = event;
      // Si la nueva fecha de inicio es posterior a la de fin, ajustamos la de fin
      if (event > formValues.end) {
        newEnd = addHours(event, 1); // Mantiene 1h de duración por defecto
      }
    } else {
      // changing === 'end'
      newEnd = event;
    }

    setFormValues({
      ...formValues,
      start: newStart,
      end: newEnd,
    });
  };
  // --- Fin CAMBIO 2 ---

  // --- ✅ CAMBIO 3: Manejador para la casilla "Todo el día" ---
  const onAllDayChange = ({ target }) => {
    const checked = target.checked;
    setIsAllDay(checked);
    if (checked) {
      // Si marca "Todo el día", ajusta las horas a 00:00 y 23:59 (o la misma hora si prefieres)
      const startOfDay = setHours(setMinutes(formValues.start, 0), 0);
      // Opción 1: Fin del día
      // const endOfDay = setHours(setMinutes(formValues.start, 59), 23);
      // Opción 2: Misma hora (para que BigCalendar lo marque como 'all day')
      const endOfDay = startOfDay;
      setFormValues({
        ...formValues,
        start: startOfDay,
        end: endOfDay,
      });
    } else {
      // Si desmarca, vuelve a poner una duración por defecto (ej: 1 hora)
      setFormValues({
        ...formValues,
        end: addHours(formValues.start, 1),
      });
    }
  };
  // --- Fin CAMBIO 3 ---

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormSubmitted(true);

    // Validar diferencia de fechas solo si NO es todo el día
    const difference = differenceInSeconds(formValues.end, formValues.start);
    if (!isAllDay && (isNaN(difference) || difference <= 0)) {
      Swal.fire("Fechas incorrectas", "Revisa las fechas ingresadas", "error");
      return;
    }

    if (formValues.title.length <= 0) return;

    await startSavingEvent(formValues);
    closeDateModal();
    setFormSubmitted(false);
  };

  return (
    <Modal
      isOpen={isDateModalOpen}
      onRequestClose={closeDateModal}
      style={customStyles}
      className="modal"
      overlayClassName="modal-fondo"
      closeTimeoutMS={200}
    >
      <h1> {activeEvent?.id ? "Editar Evento" : "Nuevo Evento"} </h1>
      <hr />
      <form className="container" onSubmit={onSubmit}>
        {/* --- ✅ CAMBIO 4: Diseño de Fechas Estilo Google Calendar --- */}
        <div className="date-time-picker-row">
          <div className="date-time-group">
            <label>Inicio:</label>
            <DatePicker
              selected={formValues.start}
              onChange={(event) => onDateChanged(event, "start")}
              className="form-control"
              dateFormat={isAllDay ? "Pp" : "Pp"} // Muestra fecha y hora
              showTimeSelect={!isAllDay} // Oculta hora si es todo el día
              locale="es"
              timeCaption="Hora"
            />
          </div>

          {!isAllDay && ( // Solo muestra el fin si NO es todo el día
            <div className="date-time-group">
              <label>Fin:</label>
              <DatePicker
                minDate={formValues.start} // Evita fecha fin anterior a inicio
                selected={formValues.end}
                onChange={(event) => onDateChanged(event, "end")}
                className="form-control"
                dateFormat="Pp"
                showTimeSelect
                locale="es"
                timeCaption="Hora"
              />
            </div>
          )}

          <div className="form-check all-day-checkbox">
            <input
              className="form-check-input"
              type="checkbox"
              name="isAllDay"
              checked={isAllDay}
              onChange={onAllDayChange}
              id="allDayCheck"
            />
            <label className="form-check-label" htmlFor="allDayCheck">
              Todo el día
            </label>
          </div>
        </div>
        {/* --- Fin CAMBIO 4 --- */}

        <div className="form-group mb-2">
          <label>Titulo y notas</label>
          <input
            type="text"
            className={`form-control ${titleClass}`}
            placeholder="Título del evento"
            name="title"
            autoComplete="off"
            value={formValues.title}
            onChange={onInputChange}
          />
          <small id="emailHelp" className="form-text text-muted">
            Una descripción corta
          </small>
        </div>

        <div className="form-group mb-2">
          <textarea
            type="text"
            className="form-control"
            placeholder="Notas"
            rows="3" // Un poco más grande
            name="notes"
            value={formValues.notes}
            onChange={onInputChange}
          ></textarea>
          <small id="emailHelp" className="form-text text-muted">
            Información adicional
          </small>
        </div>

        <div className="form-group mb-2">
          <label>Materia</label>
          <select
            name="subject"
            className="form-control"
            value={formValues.subject || ""}
            onChange={onInputChange}
          >
            <option value="">-- Sin materia --</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Puedes añadir aquí el selector de Repetición si lo deseas */}
        {/* <div className="form-group mb-2">
          <label>Repetir</label>
          <select name="recurrence" className="form-control" onChange={onInputChange}>
             <option value="">No se repite</option>
             <option value="daily">Diariamente</option>
             <option value="weekly">Semanalmente</option>
             // ... más opciones
          </select>
        </div> 
        */}

        <button type="submit" className="btn btn-outline-primary btn-block">
          <i className="far fa-save"></i>
          <span> Guardar</span>
        </button>
      </form>
    </Modal>
  );
};
