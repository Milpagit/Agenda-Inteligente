// src/hooks/useCalendarStore.js

import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import Swal from "sweetalert2";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
} from "firebase/firestore/lite";
import { FirebaseDB } from "../firebase/config";
import { convertEventsToDateEvents } from "../helpers";
import {
  onAddNewEvent,
  onDeleteEvent,
  onLoadEvents,
  onSetActiveEvent,
  onUpdateEvent,
} from "../store/calendar/calendarSlice";

export const useCalendarStore = () => {
  const dispatch = useDispatch();
  const { events, activeEvent } = useSelector((state) => state.calendar);
  const { user } = useSelector((state) => state.auth);

  const setActiveEvent = useCallback(
    (calendarEvent) => {
      dispatch(onSetActiveEvent(calendarEvent));
    },
    [dispatch]
  );

  const startSavingEvent = useCallback(
    async (calendarEvent) => {
      if (!user.uid) return;

      // ✅ Preparamos el evento para guardarlo, asegurando que 'subject' esté incluido.
      const eventToSave = {
        title: calendarEvent.title,
        notes: calendarEvent.notes,
        start: calendarEvent.start,
        end: calendarEvent.end,
        user: { uid: user.uid, name: user.name },
        subject: calendarEvent.subject || null, // Guarda el objeto de materia o null si no hay
      };

      try {
        if (calendarEvent.id) {
          // Actualizando un evento existente
          const docRef = doc(
            FirebaseDB,
            `users/${user.uid}/events/${calendarEvent.id}`
          );
          await updateDoc(docRef, eventToSave);
          dispatch(onUpdateEvent({ ...calendarEvent }));
          Swal.fire(
            "Actualizado",
            "El evento ha sido actualizado con éxito",
            "success"
          );
          return;
        }

        // Creando un nuevo evento
        const docRef = await addDoc(
          collection(FirebaseDB, `users/${user.uid}/events`),
          eventToSave
        );
        dispatch(onAddNewEvent({ ...eventToSave, id: docRef.id }));
        Swal.fire("Creado", "El evento ha sido creado con éxito", "success");
      } catch (error) {
        console.log("error", error);
        Swal.fire("Error al guardar", error.message, "error");
      }
    },
    [user.uid, dispatch]
  );

  const startDeletingEvent = useCallback(async () => {
    if (!activeEvent?.id || !user.uid) return;
    try {
      const docRef = doc(
        FirebaseDB,
        `users/${user.uid}/events/${activeEvent.id}`
      );
      await deleteDoc(docRef);
      dispatch(onDeleteEvent());
      Swal.fire(
        "Eliminado",
        "El evento ha sido eliminado con éxito",
        "success"
      );
    } catch (error) {
      Swal.fire("Error al eliminar", error.message, "error");
    }
  }, [activeEvent, user.uid, dispatch]);

  const startLoadingEvents = useCallback(async () => {
    if (!user.uid) return;
    try {
      const collectionRef = collection(FirebaseDB, `users/${user.uid}/events`);
      const docs = await getDocs(collectionRef);
      const eventsFromDB = [];
      docs.forEach((doc) => {
        eventsFromDB.push({ id: doc.id, ...doc.data() });
      });
      const events = convertEventsToDateEvents(eventsFromDB);
      dispatch(onLoadEvents(events));
    } catch (error) {
      console.log("Error cargando eventos", error);
    }
  }, [user.uid, dispatch]);

  return {
    events,
    activeEvent,
    hasEventSelected: !!activeEvent,
    setActiveEvent,
    startDeletingEvent,
    startSavingEvent,
    startLoadingEvents,
  };
};
