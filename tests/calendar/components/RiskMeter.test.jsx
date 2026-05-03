import { render, screen } from "@testing-library/react";
import { RiskMeter } from "../../../src/calendar/components/RiskMeter";
import { useAuthStore } from "../../../src/hooks/useAuthStore";

jest.mock("../../../src/hooks/useAuthStore");
jest.mock("../../../src/api", () => ({
  riskApi: { defaults: { baseURL: "" }, post: jest.fn() },
}));
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
}));

beforeEach(() => jest.clearAllMocks());

describe("<RiskMeter />", () => {
  test("muestra riesgo Bajo cuando riskScore < 0.5", () => {
    useAuthStore.mockReturnValue({ user: { riskScore: 0.2 } });
    render(<RiskMeter />);
    expect(screen.getByText(/Bajo/i)).toBeTruthy();
    expect(screen.getByText(/20%/i)).toBeTruthy();
  });

  test("muestra riesgo Medio cuando riskScore está entre 0.5 y 0.7", () => {
    useAuthStore.mockReturnValue({ user: { riskScore: 0.6 } });
    render(<RiskMeter />);
    expect(screen.getByText(/Medio/i)).toBeTruthy();
    expect(screen.getByText(/60%/i)).toBeTruthy();
  });

  test("muestra riesgo Alto cuando riskScore > 0.7", () => {
    useAuthStore.mockReturnValue({ user: { riskScore: 0.85 } });
    render(<RiskMeter />);
    expect(screen.getByText(/Alto/i)).toBeTruthy();
    expect(screen.getByText(/85%/i)).toBeTruthy();
  });

  test("usa riskScore por defecto 0.3 si el usuario no tiene riskScore", () => {
    useAuthStore.mockReturnValue({ user: {} });
    render(<RiskMeter />);
    expect(screen.getByText(/Bajo/i)).toBeTruthy();
    expect(screen.getByText(/30%/i)).toBeTruthy();
  });

  test("renderiza sin romper con riskScore en límite exacto de 0.5", () => {
    useAuthStore.mockReturnValue({ user: { riskScore: 0.5 } });
    render(<RiskMeter />);
    // 50% está en zona Bajo (> 50 es Medio, no >= 50)
    expect(screen.getByText(/Bajo/i)).toBeTruthy();
  });
});
