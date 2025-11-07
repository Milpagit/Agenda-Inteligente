// src/hooks/useSubjectStore.js

import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
} from "firebase/firestore/lite";
import { FirebaseDB } from "../firebase/config";
import {
  onAddSubject,
  onDeleteSubject,
  onLoadSubjects,
} from "../store/subjects/subjectSlice";
import Swal from "sweetalert2";

export const useSubjectStore = () => {
  const dispatch = useDispatch();
  const { subjects } = useSelector((state) => state.subjects);
  const { user } = useSelector((state) => state.auth);

  const startLoadingSubjects = useCallback(async () => {
    if (!user.uid) return;
    try {
      const collectionRef = collection(
        FirebaseDB,
        `users/${user.uid}/subjects`
      );
      const docs = await getDocs(collectionRef);
      const subjectsFromDB = [];
      docs.forEach((doc) => {
        subjectsFromDB.push({ id: doc.id, ...doc.data() });
      });
      dispatch(onLoadSubjects(subjectsFromDB));
    } catch (error) {
      console.error("Error cargando materias:", error);
    }
  }, [user.uid, dispatch]);

  const startSavingSubject = useCallback(
    async (subjectData) => {
      if (!user.uid) return;
      try {
        const docRef = await addDoc(
          collection(FirebaseDB, `users/${user.uid}/subjects`),
          subjectData
        );
        dispatch(onAddSubject({ ...subjectData, id: docRef.id }));
      } catch (error) {
        Swal.fire("Error", "No se pudo guardar la materia", "error");
      }
    },
    [user.uid, dispatch]
  );

  const startDeletingSubject = useCallback(
    async (subjectId) => {
      if (!user.uid) return;
      try {
        const docRef = doc(
          FirebaseDB,
          `users/${user.uid}/subjects/${subjectId}`
        );
        await deleteDoc(docRef);
        dispatch(onDeleteSubject(subjectId));
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la materia", "error");
      }
    },
    [user.uid, dispatch]
  );

  return {
    //* Propiedades
    subjects,

    //* Métodos
    startLoadingSubjects,
    startSavingSubject,
    startDeletingSubject,
  };
};
