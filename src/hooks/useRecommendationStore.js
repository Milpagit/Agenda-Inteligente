// src/hooks/useRecommendationStore.js
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
  increment,
} from "firebase/firestore/lite";
import { FirebaseDB } from "../firebase/config";
import {
  buildRecommendationContext,
  getRecommendationForProfile,
} from "../core/recommendationEngine";
import {
  onLoadRecommendation,
  onDismissRecommendation,
} from "../store/recommendations/recommendationSlice";

export const useRecommendationStore = () => {
  const dispatch = useDispatch();
  const { activeRecommendation } = useSelector(
    (state) => state.recommendations,
  );
  const { user } = useSelector((state) => state.auth);
  const { tasks } = useSelector((state) => state.tasks);
  const { habits } = useSelector((state) => state.habits);
  const { events } = useSelector((state) => state.calendar);

  const buildHistoryMap = useCallback(async () => {
    if (!user.uid) return {};
    const historyRef = collection(
      FirebaseDB,
      `users/${user.uid}/recommendationHistory`,
    );
    const historySnapshot = await getDocs(historyRef);
    const historyMap = {};
    historySnapshot.forEach((docSnap) => {
      historyMap[docSnap.id] = docSnap.data();
    });
    return historyMap;
  }, [user.uid]);

  const upsertRecommendationHistory = useCallback(
    async (recommendation, updates) => {
      if (!user.uid || !recommendation?.id) return;
      const historyDocRef = doc(
        FirebaseDB,
        `users/${user.uid}/recommendationHistory/${recommendation.id}`,
      );
      await setDoc(
        historyDocRef,
        {
          id: recommendation.id,
          text: recommendation.text || "",
          lastUpdatedAt: Date.now(),
          ...updates,
        },
        { merge: true },
      );
    },
    [user.uid],
  );

  const startLoadingRecommendation = useCallback(async () => {
    if (!user.uid) return;

    try {
      const recommendationsRef = collection(
        FirebaseDB,
        `users/${user.uid}/recommendations`,
      );
      const q = query(recommendationsRef, where("viewed", "==", false));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const firstAlert = querySnapshot.docs[0];
        const recommendation = {
          id: firstAlert.id,
          text: firstAlert.data().text,
          action: null,
          source: "firebase",
        };
        dispatch(onLoadRecommendation(recommendation));
        return;
      }

      if (user.cluster !== undefined) {
        const historyMap = await buildHistoryMap();
        const context = buildRecommendationContext({
          tasks,
          habits,
          events,
          riskScore: user.riskScore,
          now: new Date(),
        });
        const recommendationObject = getRecommendationForProfile(
          user.cluster,
          context,
          historyMap,
        );
        if (!recommendationObject) return;
        const recommendation = { ...recommendationObject, source: "local" };
        dispatch(onLoadRecommendation(recommendation));
        await upsertRecommendationHistory(recommendation, {
          lastShownAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("Error al cargar recomendaciones:", error);
    }
  }, [
    user.uid,
    user.cluster,
    user.riskScore,
    tasks,
    habits,
    events,
    dispatch,
    buildHistoryMap,
    upsertRecommendationHistory,
  ]);

  const dismissRecommendation = useCallback(
    async (recommendation, action = "dismissed") => {
      if (!recommendation) return;

      dispatch(onDismissRecommendation());

      if (recommendation.id && user.uid) {
        try {
          const historyUpdates = {
            lastAction: action,
            lastActionAt: Date.now(),
          };
          if (action === "scheduled") {
            historyUpdates.scheduledCount = increment(1);
          }
          if (action === "dismissed") {
            historyUpdates.dismissedCount = increment(1);
          }
          await upsertRecommendationHistory(recommendation, historyUpdates);

          if (recommendation.source === "firebase") {
            const docRef = doc(
              FirebaseDB,
              `users/${user.uid}/recommendations/${recommendation.id}`,
            );
            await updateDoc(docRef, { viewed: true });
          }
        } catch (error) {
          console.error("Error al actualizar la recomendación:", error);
        }
      }
    },
    [user.uid, dispatch, upsertRecommendationHistory],
  );

  return {
    activeRecommendation,

    startLoadingRecommendation,
    dismissRecommendation,
  };
};
