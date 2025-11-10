// src/hooks/useAuthStore.js

import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile, // <-- 1. IMPORTAR updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore/lite";
import { FirebaseAuth, FirebaseDB } from "../firebase/config";
import {
  onChecking,
  onLogin,
  onLogout,
  clearErrorMessage,
} from "../store/auth/authSlice";
import { onLogoutCalendar } from "../store/calendar/calendarSlice";

export const useAuthStore = () => {
  const { status, user, errorMessage } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FirebaseAuth, async (user) => {
      if (!user) {
        dispatch(onLogout());
        return;
      }

      // Abre el "expediente" del usuario en Firestore
      const userDocRef = doc(FirebaseDB, `users/${user.uid}`);
      const userDocSnap = await getDoc(userDocRef);

      // --- ✅ INICIO DE LA CORRECCIÓN ---
      // Leemos todos los datos del perfil de Firestore
      const onboardingComplete =
        userDocSnap.exists() && userDocSnap.data().onboardingComplete;
      const cluster = userDocSnap.exists() ? userDocSnap.data().cluster : null;
      // Añadimos el riskScore (con un valor por defecto si no existe)
      const riskScore = userDocSnap.exists()
        ? userDocSnap.data().riskScore
        : 0.3;
      // --- ✅ FIN DE LA CORRECCIÓN ---

      const { uid, displayName, email } = user;

      dispatch(
        onLogin({
          name: displayName || email,
          uid: uid,
          onboardingComplete,
          cluster,
          riskScore, // <-- ✅ AÑADIDO
        })
      );
    });

    return () => unsubscribe();
  }, [dispatch]);

  const startLogin = async ({ email, password }) => {
    // ... (Esta función está bien, no cambia)
    dispatch(onChecking());
    try {
      await signInWithEmailAndPassword(FirebaseAuth, email, password);
    } catch (error) {
      dispatch(onLogout("Credenciales incorrectas"));
      setTimeout(() => dispatch(clearErrorMessage()), 10);
    }
  };

  const startRegister = async ({ name, email, password }) => {
    dispatch(onChecking());
    try {
      // 1. Crea el usuario
      const resp = await createUserWithEmailAndPassword(
        FirebaseAuth,
        email,
        password
      );
      const { uid } = resp.user;

      // 2. Actualiza el perfil de AUTH con el nombre
      await updateProfile(FirebaseAuth.currentUser, { displayName: name });

      // 3. CREA el documento inicial en FIRESTORE
      const userDocRef = doc(FirebaseDB, `users/${uid}`);
      const newProfile = {
        onboardingComplete: false,
        cluster: null,
        onboardingData: {}, // Lo dejamos vacío por ahora
      };
      await setDoc(userDocRef, newProfile);

      // 4. Loguea al usuario en Redux (el listener onAuthStateChanged
      //    también lo hará, pero esto es más rápido e inmediato)
      dispatch(
        onLogin({
          name: name,
          uid: uid,
          onboardingComplete: false,
          cluster: null,
        })
      );
    } catch (error) {
      dispatch(onLogout(error.message));
      setTimeout(() => dispatch(clearErrorMessage()), 10);
    }
  };

  const startSavingOnboardingProfile = async (onboardingData, cluster) => {
    // ... (Esta función está bien, pero setDoc debe ser 'merge' para no borrar lo anterior)
    if (!user.uid) return;
    dispatch(onChecking());
    try {
      const userDocRef = doc(FirebaseDB, `users/${user.uid}`);
      const profileData = {
        onboardingData,
        cluster: cluster === undefined ? null : cluster,
        onboardingComplete: true,
      };
      // --- 3. CORRECCIÓN: Usar { merge: true } ---
      // Esto asegura que actualizamos el doc sin borrar otros campos
      await setDoc(userDocRef, profileData, { merge: true });
      dispatch(onLogin({ ...user, ...profileData }));
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      dispatch(onLogout("No se pudo guardar el perfil. Intenta de nuevo."));
    }
  };

  const startLogout = async () => {
    // ... (Esta función está bien, no cambia)
    await signOut(FirebaseAuth);
    dispatch(onLogoutCalendar());
    dispatch(onLogout());
  };

  return {
    // * Propiedades
    status,
    user,
    errorMessage,

    // * Métodos
    startLogin,
    startLogout,
    startRegister,
    startSavingOnboardingProfile,
  };
};
