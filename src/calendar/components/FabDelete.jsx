import { useAuthStore, useCalendarStore, useUiStore } from "../../hooks";

export const FabDelete = () => {
  const { startDeletingEvent, activeEvent, hasEventSelected } =
    useCalendarStore();
  const { isDateModalOpen } = useUiStore();
  const { user } = useAuthStore();

  // --- CORRECCIÓN 1.1: Lógica de propiedad unificada ---
  // Se comprueba 'user.uid' tanto del 'user' autenticado como del 'activeEvent.user'.
  // Ahora funcionará tanto para eventos manuales ({uid: '...'})
  // como para eventos importados ({uid: '...'} <- corregido en main.py).
  const isMyEvent = user?.uid === activeEvent?.user?.uid;
  // --- Fin CORRECCIÓN 1.1 ---

  const handleDelete = () => {
    if (!activeEvent) return;

    startDeletingEvent(activeEvent);
  };

  return (
    <>
      {isMyEvent ? (
        <button
          aria-label="btn-delete"
          onClick={handleDelete}
          className="btn btn-danger fab-danger"
          style={{
            display: hasEventSelected && !isDateModalOpen ? "" : "none",
          }}
        >
          <i className="fas fa-trash-alt"></i>
        </button>
      ) : null}
    </>
  );
};
