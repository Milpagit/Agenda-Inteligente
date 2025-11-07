// src/auth/pages/OnboardingPage.jsx
import { useState } from "react";
import { useAuthStore, useForm } from "../../hooks";
import functionsApi from "../../api/functionsApi";
import Swal from "sweetalert2";
import { getAuth } from "firebase/auth"; // <-- La importación que añadimos
import "./OnboardingPage.css";

// Define el estado inicial para todas las preguntas del formulario
const onboardingFormFields = {
  edad: "",
  genero: "Prefiero no decir",
  promedioEstudio: "",
  redesSociales: "",
  streaming: "",
  trabaja: "No",
  asistencia: "",
  horasSueno: "",
  calidadDieta: "Regular",
  diasEjercicio: "",
  educacionPadres: "Preparatoria",
  saludMental: 5,
  actividadesExtra: "No",
  ultimaCalificacion: "",
  cargaAcademica: "",
  metodoEstudio: "Toma de apuntes",
  motivacion: 5,
  usaHerramientas: "No",
  nivelEstres: 5,
};

export const OnboardingPage = () => {
  const { formState, onInputChange } = useForm(onboardingFormFields);
  const { startSavingOnboardingProfile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ESTA ES LA LÓGICA CORREGIDA ---
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validar que los campos numéricos no estén vacíos
    if (
      formState.edad.trim() === "" ||
      formState.promedioEstudio.trim() === "" ||
      formState.asistencia.trim() === ""
    ) {
      Swal.fire(
        "Campos incompletos",
        "Por favor, llena todos los campos.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Obtenemos la instancia de Auth y el token FRESCO
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No se encontró un usuario autenticado.");
      }

      const token = await user.getIdToken(true); // Token fresco

      // Llamamos a la API (Cloud Function) enviando el token en los headers
      console.log("Enviando datos al modelo (con token)...");
      const { data } = await functionsApi.post(
        "",
        { data: formState },
        {
          headers: {
            Authorization: `Bearer ${token}`, // El header de autenticación
          },
        }
      );

      const { cluster } = data;
      console.log(`✅ ¡Modelo predijo el clúster: ${cluster}!`);
      await startSavingOnboardingProfile(formState, cluster);
    } catch (error) {
      console.error("Error al contactar el modelo:", error);
      Swal.fire(
        "Error del Modelo",
        "No se pudo predecir tu perfil. Revisa los datos o contacta al administrador.",
        "error"
      );
    }

    setIsSubmitting(false);
  };
  // --- FIN DE LA LÓGICA CORREGIDA ---

  // --- ESTE ES EL FORMULARIO QUE BORRÉ ACCIDENTALMENTE ---
  // --- AHORA ESTÁ RESTAURADO ---
  return (
    <div className="onboarding-container">
      <div className="onboarding-form">
        <h2>¡Bienvenido! Ayúdanos a conocerte mejor</h2>
        <p>
          Tus respuestas nos permitirán darte sugerencias personalizadas para
          mejorar tus hábitos de estudio.
        </p>

        <form onSubmit={handleSubmit}>
          {/* --- Sección 1: Información Personal y Académica --- */}
          <h3>Información Personal y Académica</h3>
          <div className="form-section">
            <div className="form-group">
              <label>Edad</label>
              <input
                type="number"
                name="edad"
                value={formState.edad}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 20"
                required
              />
            </div>
            <div className="form-group">
              <label>Género</label>
              <select
                name="genero"
                value={formState.genero}
                onChange={onInputChange}
                className="form-control"
              >
                <option>Masculino</option>
                <option>Femenino</option>
                <option>Otro</option>
                <option>Prefiero no decir</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nivel de educación de los padres</label>
              <select
                name="educacionPadres"
                value={formState.educacionPadres}
                onChange={onInputChange}
                className="form-control"
              >
                <option>Universidad o más</option>
                <option>Preparatoria</option>
                <option>Secundaria o menos</option>
              </select>
            </div>
            <div className="form-group">
              <label>Además de estudiar, ¿trabajas?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="trabaja"
                    value="Sí"
                    checked={formState.trabaja === "Sí"}
                    onChange={onInputChange}
                  />{" "}
                  Sí
                </label>
                <label>
                  <input
                    type="radio"
                    name="trabaja"
                    value="No"
                    checked={formState.trabaja === "No"}
                    onChange={onInputChange}
                  />{" "}
                  No
                </label>
              </div>
            </div>
          </div>

          {/* --- Sección 2: Hábitos de Estudio --- */}
          <h3>Hábitos de Estudio</h3>
          <div className="form-section">
            <div className="form-group">
              <label>Promedio de estudio diario (horas)</label>
              <input
                type="number"
                step="0.5"
                name="promedioEstudio"
                value={formState.promedioEstudio}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 3.5"
                required
              />
            </div>
            <div className="form-group">
              <label>Carga académica (Nº de materias)</label>
              <input
                type="number"
                name="cargaAcademica"
                value={formState.cargaAcademica}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 7"
                required
              />
            </div>
            <div className="form-group">
              <label>Porcentaje de asistencia a clase (%)</label>
              <input
                type="number"
                name="asistencia"
                value={formState.asistencia}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 90"
                required
              />
            </div>
            <div className="form-group">
              <label>Calificación de tu último examen</label>
              <input
                type="number"
                step="0.1"
                name="ultimaCalificacion"
                value={formState.ultimaCalificacion}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 8.5"
                required
              />
            </div>
            <div className="form-group">
              <label>Método de estudio predominante</label>
              <select
                name="metodoEstudio"
                value={formState.metodoEstudio}
                onChange={onInputChange}
                className="form-control"
              >
                <option>Toma de apuntes</option>
                <option>Resumen</option>
                <option>Práctica</option>
                <option>Mapas mentales</option>
                <option>Lectura pasiva</option>
                <option>Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>¿Usas herramientas de gestión de tiempo?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="usaHerramientas"
                    value="Sí"
                    checked={formState.usaHerramientas === "Sí"}
                    onChange={onInputChange}
                  />{" "}
                  Sí
                </label>
                <label>
                  <input
                    type="radio"
                    name="usaHerramientas"
                    value="No"
                    checked={formState.usaHerramientas === "No"}
                    onChange={onInputChange}
                  />{" "}
                  No
                </label>
              </div>
            </div>
          </div>

          {/* --- Sección 3: Estilo de Vida y Distracciones --- */}
          <h3>Estilo de Vida y Distracciones</h3>
          <div className="form-section">
            <div className="form-group">
              <label>Tiempo diario en redes sociales (horas)</label>
              <input
                type="number"
                step="0.5"
                name="redesSociales"
                value={formState.redesSociales}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 2"
                required
              />
            </div>
            <div className="form-group">
              <label>Tiempo diario viendo streaming (horas)</label>
              <input
                type="number"
                step="0.5"
                name="streaming"
                value={formState.streaming}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 1.5"
                required
              />
            </div>
            <div className="form-group">
              <label>Promedio de horas dormidas diarias</label>
              <input
                type="number"
                step="0.5"
                name="horasSueno"
                value={formState.horasSueno}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 7"
                required
              />
            </div>
            <div className="form-group">
              <label>Días a la semana que haces ejercicio</label>
              <input
                type="number"
                name="diasEjercicio"
                value={formState.diasEjercicio}
                onChange={onInputChange}
                className="form-control"
                placeholder="Ej: 3"
                required
              />
            </div>
            <div className="form-group">
              <label>Calidad de dieta</label>
              <select
                name="calidadDieta"
                value={formState.calidadDieta}
                onChange={onInputChange}
                className="form-control"
              >
                <option>Buena</option>
                <option>Regular</option>
                <option>Mala</option>
              </select>
            </div>
            <div className="form-group">
              <label>¿Tienes actividades extracurriculares?</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="actividadesExtra"
                    value="Sí"
                    checked={formState.actividadesExtra === "Sí"}
                    onChange={onInputChange}
                  />{" "}
                  Sí
                </label>
                <label>
                  <input
                    type="radio"
                    name="actividadesExtra"
                    value="No"
                    checked={formState.actividadesExtra === "No"}
                    onChange={onInputChange}
                  />{" "}
                  No
                </label>
              </div>
            </div>
          </div>

          {/* --- Sección 4: Bienestar Emocional (Corregida) --- */}
          <h3>Bienestar Emocional</h3>
          <div className="form-section full-width-section">
            <div className="form-group slider-group">
              <div className="slider-label-container">
                <label>Como calificarías tu salud mental (1-10)</label>
                <b className="slider-value">{formState.saludMental}</b>
              </div>
              <div className="slider-wrapper">
                <span>1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  name="saludMental"
                  value={formState.saludMental}
                  onChange={onInputChange}
                />
                <span>10</span>
              </div>
            </div>

            <div className="form-group slider-group">
              <div className="slider-label-container">
                <label>Nivel de motivación académica (1-10)</label>
                <b className="slider-value">{formState.motivacion}</b>
              </div>
              <div className="slider-wrapper">
                <span>1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  name="motivacion"
                  value={formState.motivacion}
                  onChange={onInputChange}
                />
                <span>10</span>
              </div>
            </div>

            <div className="form-group slider-group">
              <div className="slider-label-container">
                <label>
                  ¿Qué tan estresado te sientes con tus estudios? (1-10)
                </label>
                <b className="slider-value">{formState.nivelEstres}</b>
              </div>
              <div className="slider-wrapper">
                <span>1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  name="nivelEstres"
                  value={formState.nivelEstres}
                  onChange={onInputChange}
                />
                <span>10</span>
              </div>
            </div>
          </div>

          {/* */}
          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Analizando..." : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
};
{
  /* --- FIN DEL FORMULARIO --- */
}
