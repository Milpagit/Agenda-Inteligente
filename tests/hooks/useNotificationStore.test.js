import { act, renderHook } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { getAuth } from "firebase/auth";
import alertsApi from "../../src/api/alertsApi";
import { useNotificationStore } from "../../src/hooks/useNotificationStore";
import {
  onCloseAlertsModal,
  onLoadAlerts,
} from "../../src/store/notifications/notificationSlice";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("../../src/api/alertsApi", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe("Tests on useNotificationStore hook", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockImplementation((selector) =>
      selector({
        notifications: {
          proactiveAlerts: [],
          isModalOpen: false,
        },
      }),
    );
  });

  test("startLoadingAlerts should request alerts and dispatch them", async () => {
    const alerts = [{ text: "Recordatorio", insistencia: "media" }];

    getAuth.mockReturnValue({
      currentUser: {
        getIdToken: jest.fn().mockResolvedValue("test-token"),
      },
    });
    alertsApi.get.mockResolvedValue({ data: { alerts } });

    const { result } = renderHook(() => useNotificationStore());

    await act(async () => {
      await result.current.startLoadingAlerts();
    });

    expect(alertsApi.get).toHaveBeenCalledWith("", {
      headers: { Authorization: "Bearer test-token" },
    });
    expect(dispatch).toHaveBeenCalledWith(onLoadAlerts(alerts));
  });

  test("closeAlertsModal should dispatch close action", () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.closeAlertsModal();
    });

    expect(dispatch).toHaveBeenCalledWith(onCloseAlertsModal());
  });
});
