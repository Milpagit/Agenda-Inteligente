export const CalendarEvent = ({ event }) => {
  const { user, title } = event;
  return (
    <>
      <strong>{title}</strong>
      {/* --- CORRECCIÓN 1.1: Renderizado condicional ---
          Ahora verifica si 'user.name' existe antes de intentar mostrarlo.
          Los eventos manuales tendrán 'name', pero los importados (corregidos) 
          solo tendrán 'uid', por lo que 'user.name' será 'undefined'.
          Esto evita que se muestre " - undefined" en el calendario.
      --- Fin CORRECCIÓN 1.1 --- */}
      <span>{user?.name ? ` - ${user.name}` : ""}</span>
    </>
  );
};
