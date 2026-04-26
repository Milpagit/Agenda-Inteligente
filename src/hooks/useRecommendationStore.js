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
} from "firebase/firestore/lite";
import { FirebaseDB } from "../firebase/config";
import { getRecommendationForProfile } from "../core/recommendationEngine";
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
        };
        dispatch(onLoadRecommendation(recommendation));
        return;
      }

      if (user.cluster !== undefined) {
        const recommendationObject = getRecommendationForProfile(user.cluster);
        const recommendation = { id: null, ...recommendationObject };
        dispatch(onLoadRecommendation(recommendation));
      }
    } catch (error) {
      console.error("Error al cargar recomendaciones:", error);
    }
  }, [user.uid, user.cluster, dispatch]);

  const dismissRecommendation = useCallback(
    async (recommendation) => {
      if (!recommendation) return;

      dispatch(onDismissRecommendation());

      if (recommendation.id && user.uid) {
        try {
          const docRef = doc(
            FirebaseDB,
            `users/${user.uid}/recommendations/${recommendation.id}`,
          );
          await updateDoc(docRef, { viewed: true });
        } catch (error) {
          console.error("Error al actualizar la recomendación:", error);
        }
      }
    },
    [user.uid, dispatch],
  );

  return {
    activeRecommendation,

    startLoadingRecommendation,
    dismissRecommendation,
  };
};
