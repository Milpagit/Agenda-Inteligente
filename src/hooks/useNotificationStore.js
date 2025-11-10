import { useDispatch, useSelector } from "react-redux";
import { getAuth } from "firebase/auth";
import {
  onLoadAlerts,
  onCloseAlertsModal,
} from "../store/notifications/notificationSlice";
import alertsApi from "../api/alertsApi"; // <-- (Este es el que tendrías que crear)

export const useNotificationStore = () => {
  const dispatch = useDispatch();
  const { proactiveAlerts, isModalOpen } = useSelector(
    (state) => state.notifications
  );

  const startLoadingAlerts = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado");

      const token = await user.getIdToken(true);

      const { data } = await alertsApi.get("", {
        // Hacemos un GET
        headers: { Authorization: `Bearer ${token}` },
      });

      dispatch(onLoadAlerts(data.alerts));
    } catch (error) {
      console.error("Error al cargar alertas proactivas:", error);
    }
  };

  const closeAlertsModal = () => {
    dispatch(onCloseAlertsModal());
  };

  return {
    // Propiedades
    proactiveAlerts,
    isModalOpen,
    // Métodos
    startLoadingAlerts,
    closeAlertsModal,
  };
};
