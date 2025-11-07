// src/hooks/useUiStore.js
import { useDispatch, useSelector } from "react-redux";
// ✅ Importa las nuevas acciones
import {
  onCloseDateModal,
  onOpenDateModal,
  onOpenSubjectsModal,
  onCloseSubjectsModal,
} from "../store/ui/uiSlice";

export const useUiStore = () => {
  const { isDateModalOpen, isSubjectsModalOpen } = useSelector(
    (state) => state.ui
  ); // ✅ Lee el nuevo estado
  const dispatch = useDispatch();

  const openDateModal = () => dispatch(onOpenDateModal());
  const closeDateModal = () => dispatch(onCloseDateModal());

  // ✅ Añade las nuevas funciones
  const openSubjectsModal = () => dispatch(onOpenSubjectsModal());
  const closeSubjectsModal = () => dispatch(onCloseSubjectsModal());

  return {
    //* Propiedades
    isDateModalOpen,
    isSubjectsModalOpen, // ✅ Exporta la nueva propiedad

    //* Métodos
    openDateModal,
    closeDateModal,
    openSubjectsModal, // ✅ Exporta la nueva función
    closeSubjectsModal, // ✅ Exporta la nueva función
  };
};
