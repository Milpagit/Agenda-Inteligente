import { useEffect, useMemo, useState } from "react";
import { addHours, differenceInSeconds, setHours, setMinutes } from "date-fns";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Modal from "react-modal";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";

import "./CalendarModal.css";
import { useCalendarStore, useUiStore, useSubjectStore } from "../../hooks";

registerLocale("es", es);

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 120;
const NOTES_MAX_LENGTH = 600;

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "550px",
    width: "90%",
  },
};

Modal.setAppElement("#root");

const getDefaultFormValues = () => {
  const now = new Date();
  return {
    title: "",
    notes: "",
    start: now,
    end: addHours(now, 1),
    subject: "",
  };
};

export const CalendarModal = () => {
  const { isDateModalOpen, closeDateModal } = useUiStore();
  const { activeEvent, events, startSavingEvent } = useCalendarStore();
  const { subjects } = useSubjectStore();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [formValues, setFormValues] = useState(getDefaultFormValues);

  const titleClass = useMemo(() => {
    if (!formSubmitted) return "";
    const trimmedTitle = (formValues.title || "").trim();
    return trimmedTitle.length >= TITLE_MIN_LENGTH ? "" : "is-invalid";
  }, [formValues.title, formSubmitted]);

  useEffect(() => {
    if (activeEvent !== null) {
      setFormValues({ ...activeEvent });
      const diff = differenceInSeconds(activeEvent.end, activeEvent.start);
      setIsAllDay(diff === 0 || diff >= 86400);
      return;
    }

    setFormValues(getDefaultFormValues());
    setIsAllDay(false);
  }, [activeEvent]);

  const onInputChange = ({ target }) => {
    setFormValues({
      ...formValues,
      [target.name]: target.value,
    });
  };

  const onDateChanged = (dateValue, changing) => {
    if (!dateValue) return;

    let newStart = formValues.start;
    let newEnd = formValues.end;

    if (changing === "start") {
      newStart = dateValue;
      if (dateValue > formValues.end) {
        newEnd = addHours(dateValue, 1);
      }
    } else {
      newEnd = dateValue;
    }

    setFormValues({
      ...formValues,
      start: newStart,
      end: newEnd,
    });
  };

  const onAllDayChange = ({ target }) => {
    const checked = target.checked;
    setIsAllDay(checked);

    if (checked) {
      const startOfDay = setHours(setMinutes(formValues.start, 0), 0);
      setFormValues({
        ...formValues,
        start: startOfDay,
        end: startOfDay,
      });
      return;
    }

    setFormValues({
      ...formValues,
      end: addHours(formValues.start, 1),
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormSubmitted(true);

    const title = (formValues.title || "").trim();
    const notes = (formValues.notes || "").trim();

    if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
      Swal.fire(
        "Título inválido",
        `El título debe tener entre ${TITLE_MIN_LENGTH} y ${TITLE_MAX_LENGTH} caracteres.`,
        "error",
      );
      return;
    }

    if (notes.length > NOTES_MAX_LENGTH) {
      Swal.fire(
        "Notas inválidas",
        `Las notas no pueden exceder ${NOTES_MAX_LENGTH} caracteres.`,
        "error",
      );
      return;
    }

    const difference = differenceInSeconds(formValues.end, formValues.start);
    if (!isAllDay && (isNaN(difference) || difference <= 0)) {
      Swal.fire("Fechas incorrectas", "Revisa las fechas ingresadas.", "error");
      return;
    }

    // --- Detección de conflictos de horario ---
    if (!isAllDay) {
      const newStart = formValues.start.getTime();
      const newEnd = formValues.end.getTime();
      const conflicting = events.filter((ev) => {
        if (ev.id && ev.id === activeEvent?.id) return false; // excluir el evento actual al editar
        const evStart =
          ev.start instanceof Date
            ? ev.start.getTime()
            : new Date(ev.start).getTime();
        const evEnd =
          ev.end instanceof Date
            ? ev.end.getTime()
            : new Date(ev.end).getTime();
        return newStart < evEnd && evStart < newEnd;
      });

      if (conflicting.length > 0) {
        const conflictTitles = conflicting
          .slice(0, 3)
          .map((ev) => `"${ev.title}"`)
          .join(", ");
        const { isConfirmed } = await Swal.fire({
          title: "Conflicto de horario",
          html: `Este evento se superpone con: ${conflictTitles}.<br><br>¿Deseas guardarlo de todas formas?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, guardar",
          cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return;
      }
    }
    // --- Fin detección de conflictos ---

    await startSavingEvent({
      ...formValues,
      title,
      notes,
    });
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
      <h1>{activeEvent?.id ? "Editar Evento" : "Nuevo Evento"}</h1>
      <hr />
      <form className="container" onSubmit={onSubmit}>
        <div className="date-time-picker-row">
          <div className="date-time-group">
            <label>Inicio:</label>
            <DatePicker
              selected={formValues.start}
              onChange={(eventDate) => onDateChanged(eventDate, "start")}
              className="form-control"
              dateFormat={isAllDay ? "P" : "Pp"}
              showTimeSelect={!isAllDay}
              locale="es"
              timeCaption="Hora"
            />
          </div>

          {!isAllDay && (
            <div className="date-time-group">
              <label>Fin:</label>
              <DatePicker
                minDate={formValues.start}
                selected={formValues.end}
                onChange={(eventDate) => onDateChanged(eventDate, "end")}
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

        <div className="form-group mb-2">
          <label>Título y notas</label>
          <input
            type="text"
            className={`form-control ${titleClass}`}
            placeholder="Título del evento"
            name="title"
            autoComplete="off"
            value={formValues.title || ""}
            onChange={onInputChange}
            minLength={TITLE_MIN_LENGTH}
            maxLength={TITLE_MAX_LENGTH}
            required
          />
          <small className="form-text text-muted">Una descripción corta</small>
        </div>

        <div className="form-group mb-2">
          <textarea
            className="form-control"
            placeholder="Notas"
            rows="3"
            name="notes"
            value={formValues.notes || ""}
            onChange={onInputChange}
            maxLength={NOTES_MAX_LENGTH}
          ></textarea>
          <small className="form-text text-muted">Información adicional</small>
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

        <button type="submit" className="btn btn-outline-primary btn-block">
          <i className="far fa-save"></i>
          <span> Guardar</span>
        </button>
      </form>
    </Modal>
  );
};
