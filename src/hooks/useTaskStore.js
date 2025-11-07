// src/hooks/useTaskStore.js

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
  onAddTask,
  onDeleteTask,
  onToggleTask,
  onLoadTasks,
} from "../store/tasks/taskSlice";
import Swal from "sweetalert2";

export const useTaskStore = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  const startLoadingTasks = useCallback(async () => {
    if (!user.uid) return;

    try {
      const collectionRef = collection(FirebaseDB, `users/${user.uid}/tasks`);
      const docs = await getDocs(collectionRef);

      const tasksFromDB = [];
      docs.forEach((doc) => {
        tasksFromDB.push({ id: doc.id, ...doc.data() });
      });

      dispatch(onLoadTasks(tasksFromDB));
    } catch (error) {
      console.error("Error cargando tareas:", error);
    }
  }, [user.uid, dispatch]);

  const startSavingTask = useCallback(
    async (taskText) => {
      if (!user.uid) return;

      const newTask = { text: taskText, completed: false };
      try {
        const docRef = await addDoc(
          collection(FirebaseDB, `users/${user.uid}/tasks`),
          newTask
        );
        dispatch(onAddTask({ ...newTask, id: docRef.id }));
      } catch (error) {
        Swal.fire("Error", "No se pudo guardar la tarea", "error");
      }
    },
    [user.uid, dispatch]
  );

  const startTogglingTask = useCallback(
    async (taskId) => {
      if (!user.uid) return;
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate) return;

      const docRef = doc(FirebaseDB, `users/${user.uid}/tasks/${taskId}`);
      try {
        await updateDoc(docRef, { completed: !taskToUpdate.completed });
        dispatch(onToggleTask(taskId));
      } catch (error) {
        Swal.fire("Error", "No se pudo actualizar la tarea", "error");
      }
    },
    [user.uid, tasks, dispatch]
  );

  const startDeletingTask = useCallback(
    async (taskId) => {
      if (!user.uid) return;
      const docRef = doc(FirebaseDB, `users/${user.uid}/tasks/${taskId}`);
      try {
        await deleteDoc(docRef);
        dispatch(onDeleteTask(taskId));
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la tarea", "error");
      }
    },
    [user.uid, dispatch]
  );

  return {
    //* Propiedades
    tasks,

    //* Métodos
    startLoadingTasks,
    startSavingTask,
    startTogglingTask,
    startDeletingTask,
  };
};
