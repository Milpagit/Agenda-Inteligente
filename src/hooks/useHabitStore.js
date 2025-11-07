// src/hooks/useHabitStore.js

import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore/lite";
import { FirebaseDB } from "../firebase/config";
import {
  onAddHabit,
  onDeleteHabit,
  onToggleHabitDay,
  onLoadHabits,
} from "../store/habits/habitSlice";
import Swal from "sweetalert2";

export const useHabitStore = () => {
  const dispatch = useDispatch();
  const { habits } = useSelector((state) => state.habits);
  const { user } = useSelector((state) => state.auth);

  const startLoadingHabits = useCallback(async () => {
    if (!user.uid) return;

    try {
      const collectionRef = collection(FirebaseDB, `users/${user.uid}/habits`);
      const docs = await getDocs(collectionRef);

      const habitsFromDB = [];
      docs.forEach((doc) => {
        habitsFromDB.push({ id: doc.id, ...doc.data() });
      });

      dispatch(onLoadHabits(habitsFromDB));
    } catch (error) {
      console.error("Error cargando hábitos:", error);
    }
  }, [user.uid, dispatch]);

  const startSavingHabit = useCallback(
    async (habitName) => {
      if (!user.uid) return;

      const newHabit = {
        name: habitName,
        completedDays: [false, false, false, false, false, false, false],
      };

      try {
        const docRef = await addDoc(
          collection(FirebaseDB, `users/${user.uid}/habits`),
          newHabit
        );
        dispatch(onAddHabit({ ...newHabit, id: docRef.id }));
      } catch (error) {
        Swal.fire("Error", "No se pudo guardar el hábito", "error");
      }
    },
    [user.uid, dispatch]
  );

  const startTogglingHabitDay = useCallback(
    async (habitId, dayIndex) => {
      if (!user.uid) return;
      const habitToUpdate = habits.find((h) => h.id === habitId);
      if (!habitToUpdate) return;

      const updatedCompletedDays = [...habitToUpdate.completedDays];
      updatedCompletedDays[dayIndex] = !updatedCompletedDays[dayIndex];

      const docRef = doc(FirebaseDB, `users/${user.uid}/habits/${habitId}`);
      try {
        await updateDoc(docRef, { completedDays: updatedCompletedDays });
        dispatch(onToggleHabitDay({ habitId, dayIndex }));
      } catch (error) {
        Swal.fire("Error", "No se pudo actualizar el hábito", "error");
      }
    },
    [user.uid, habits, dispatch]
  );

  const startDeletingHabit = useCallback(
    async (habitId) => {
      if (!user.uid) return;
      const docRef = doc(FirebaseDB, `users/${user.uid}/habits/${habitId}`);
      try {
        await deleteDoc(docRef);
        dispatch(onDeleteHabit(habitId));
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el hábito", "error");
      }
    },
    [user.uid, dispatch]
  );

  return {
    //* Propiedades
    habits,

    //* Métodos
    startLoadingHabits,
    startSavingHabit,
    startTogglingHabitDay,
    startDeletingHabit,
  };
};
