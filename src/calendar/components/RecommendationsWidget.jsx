// src/calendar/components/RecommendationsWidget.jsx

import {
  useRecommendationStore,
  useUiStore,
  useCalendarStore,
} from "../../hooks";
import "./RecommendationsWidget.css";
import { addHours } from "date-fns";

export const RecommendationsWidget = () => {
  const { activeRecommendation, dismissRecommendation } =
    useRecommendationStore();
  const { openDateModal } = useUiStore();
  const { setActiveEvent } = useCalendarStore();

  const handleDismiss = () => {
    // Ahora pasamos el objeto completo a la función
    dismissRecommendation(activeRecommendation);
  };

  const handleSchedule = () => {
    if (!activeRecommendation?.action) return;
    const { title, duration } = activeRecommendation.action;
    setActiveEvent({
      title: title,
      notes: "Evento agendado desde una sugerencia inteligente.",
      start: new Date(),
      end: addHours(new Date(), duration),
    });
    openDateModal();
    dismissRecommendation(activeRecommendation);
  };

  if (!activeRecommendation) return null;

  return (
    <div className="recommendation-widget">
      <div className="widget-header">
        <i className="fa-solid fa-lightbulb"></i>
        <h4>Sugerencia Inteligente</h4>
      </div>
      <p className="widget-text">{activeRecommendation.text}</p>
      <div className="widget-actions">
        {activeRecommendation.action && (
          <button className="btn-accept" onClick={handleSchedule}>
            Agendar
          </button>
        )}
        <button className="btn-dismiss" onClick={handleDismiss}>
          Descartar
        </button>
      </div>
    </div>
  );
};
