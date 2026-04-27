import { useState } from "react";
import { useAuthStore } from "../../hooks";
import { riskApi } from "../../api";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import "./RiskMeter.css";

export const RiskMeter = () => {
  const { user } = useAuthStore();
  const [riskData, setRiskData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const riskScore =
    riskData?.riskScore ?? (user.riskScore !== undefined ? user.riskScore : 0.3);
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

  const handleRiskClick = async () => {
    if (!riskApi.defaults.baseURL) {
      Swal.fire(
        "Configura el riesgo",
        "Falta REACT_APP_RISK_API_URL en el .env.",
        "warning",
      );
      return;
    }

    try {
      setIsLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No hay usuario autenticado.");
      }
      const token = await currentUser.getIdToken(true);
      const { data } = await riskApi.post(
        "",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setRiskData(data);

      const nextPercent = Math.round(data.riskScore * 100);
      const nextLabel =
        nextPercent > 70 ? "Alto" : nextPercent > 50 ? "Medio" : "Bajo";

      const factors = Array.isArray(data.factors) ? data.factors : [];
      const factorsHtml =
        factors.length === 0
          ? "<p>No hay factores adicionales detectados.</p>"
          : `<ul style="text-align:left;margin:0;padding-left:18px;">${factors
              .map(
                (factor) =>
                  `<li><strong>${factor.label}</strong>: ${factor.value} (${factor.impact > 0 ? "+" : ""}${factor.impact.toFixed(2)})</li>`,
              )
              .join("")}</ul>`;

      Swal.fire({
        title: `Riesgo ${nextLabel} (${nextPercent}%)`,
        html: factorsHtml,
        icon: "info",
      });
    } catch (error) {
      Swal.fire(
        "No se pudo actualizar",
        error.message || "Intenta de nuevo más tarde.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        <button
          type="button"
          className="risk-tooltip-icon"
          onClick={handleRiskClick}
          data-tooltip="Este índice resume tu riesgo actual."
          aria-label="Ver explicación del riesgo"
          disabled={isLoading}
        >
          ?
        </button>
        <span className="risk-meter-label" style={{ color: riskColor }}>
          {riskLabel} ({riskPercent}%)
        </span>
      </div>
    </div>
  );
};
