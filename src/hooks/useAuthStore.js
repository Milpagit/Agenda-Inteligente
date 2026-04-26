// src/hooks/useAuthStore.js

import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
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

      const userDocRef = doc(FirebaseDB, `users/${user.uid}`);
      const userDocSnap = await getDoc(userDocRef);

      const onboardingComplete =
        userDocSnap.exists() && userDocSnap.data().onboardingComplete;
      const cluster = userDocSnap.exists() ? userDocSnap.data().cluster : null;
      const riskScore = userDocSnap.exists()
        ? userDocSnap.data().riskScore
        : 0.3;

      const { uid, displayName, email } = user;

      dispatch(
        onLogin({
          name: displayName || email,
          uid: uid,
          onboardingComplete,
          cluster,
          riskScore,
        }),
      );
    });

    return () => unsubscribe();
  }, [dispatch]);

  const startLogin = async ({ email, password }) => {
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
      const resp = await createUserWithEmailAndPassword(
        FirebaseAuth,
        email,
        password,
      );
      const { uid } = resp.user;

      await updateProfile(FirebaseAuth.currentUser, { displayName: name });

      const userDocRef = doc(FirebaseDB, `users/${uid}`);
      const newProfile = {
        onboardingComplete: false,
        cluster: null,
        onboardingData: {},
      };
      await setDoc(userDocRef, newProfile);

      dispatch(
        onLogin({
          name: name,
          uid: uid,
          onboardingComplete: false,
          cluster: null,
        }),
      );
    } catch (error) {
      dispatch(onLogout(error.message));
      setTimeout(() => dispatch(clearErrorMessage()), 10);
    }
  };

  const startSavingOnboardingProfile = async (onboardingData, cluster) => {
    if (!user.uid) return;
    dispatch(onChecking());
    try {
      const userDocRef = doc(FirebaseDB, `users/${user.uid}`);
      const profileData = {
        onboardingData,
        cluster: cluster === undefined ? null : cluster,
        onboardingComplete: true,
      };
      await setDoc(userDocRef, profileData, { merge: true });
      dispatch(onLogin({ ...user, ...profileData }));
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      dispatch(onLogout("No se pudo guardar el perfil. Intenta de nuevo."));
    }
  };

  const startLogout = async () => {
    await signOut(FirebaseAuth);
    dispatch(onLogoutCalendar());
    dispatch(onLogout());
  };

  return {
    status,
    user,
    errorMessage,

    startLogin,
    startLogout,
    startRegister,
    startSavingOnboardingProfile,
  };
};
