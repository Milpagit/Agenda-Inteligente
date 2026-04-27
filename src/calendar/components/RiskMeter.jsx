import { useAuthStore } from "../../hooks";
import "./RiskMeter.css";

export const RiskMeter = () => {
  const { user } = useAuthStore();

  const riskScore = user.riskScore !== undefined ? user.riskScore : 0.3;
  const riskPercent = Math.round(riskScore * 100);

  let riskLabel = "Bajo";
  let riskColor = "#5CB85C";
  if (riskPercent > 70) {
    riskLabel = "Alto";
    riskColor = "#D9534F";
  } else if (riskPercent > 50) {
    riskLabel = "Medio";
    riskColor = "#F0AD4E";
  }

  return (
    <div className="risk-meter-container">
      <h5>Tu Riesgo Académico</h5>
      <div className="risk-meter-bar">
        <div
          className="risk-meter-fill"
          style={{ width: `${riskPercent}%`, backgroundColor: riskColor }}
        ></div>
      </div>
      <div className="risk-meter-footer">
        <span
          className="risk-tooltip-icon"
          data-tooltip="Este índice funciona para calcular la probabilidad que tiene un alumno en terminar sus tareas sin problema y en tiempo y forma"
        >
          ?
        </span>
        <span className="risk-meter-label" style={{ color: riskColor }}>
          {riskLabel} ({riskPercent}%)
        </span>
      </div>
    </div>
  );
};
