import axios from "axios";

// --- ✅ USA LA URL CORRECTA DE CLOUD RUN ---
const importScheduleURL = "https://importschedule-ft2xstpzha-uc.a.run.app";

const importApi = axios.create({
  baseURL: importScheduleURL,
});

// --- CORRECCIÓN: Interceptor Eliminado ---
// Se eliminó el interceptor que buscaba 'localStorage.getItem("token")'.
// La llamada a esta API (en SubjectsModal.jsx) YA inyecta el token
// manualmente usando 'await auth.currentUser.getIdToken(true)',
// lo cual es el método correcto y seguro.
// Este interceptor estaba roto y no hacía nada.

export default importApi;
