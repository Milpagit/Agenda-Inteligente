import axios from "axios";

// --- URL ESPECÍFICA PARA predict_student_profile ---
// Asegúrate que esta sea la URL correcta obtenida del despliegue
const functionsURL = "https://predict-student-profile-ft2xstpzha-uc.a.run.app";

const functionsApi = axios.create({
  baseURL: functionsURL,
});

// --- CORRECCIÓN: Interceptor Eliminado ---
// Se eliminó el interceptor que buscaba 'localStorage.getItem("token")'.
// El token AHORA debe ser inyectado manualmente en cada llamada
// (lo haremos en el siguiente paso en OnboardingPage.jsx)
// usando 'await auth.currentUser.getIdToken(true)'.
// Esto es más seguro y funciona con el auth de Firebase.

export default functionsApi;
