describe("Backend API clients", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("functionsApi should use REACT_APP_FUNCTIONS_API_URL", () => {
    process.env.REACT_APP_FUNCTIONS_API_URL = "https://functions.example.com";

    const functionsApi = require("../../src/api/functionsApi").default;

    expect(functionsApi.defaults.baseURL).toBe("https://functions.example.com");
  });

  test("importApi should use REACT_APP_IMPORT_SCHEDULE_API_URL", () => {
    process.env.REACT_APP_IMPORT_SCHEDULE_API_URL =
      "https://import.example.com";

    const importApi = require("../../src/api/importApi").default;

    expect(importApi.defaults.baseURL).toBe("https://import.example.com");
  });

  test("alertsApi should use REACT_APP_ALERTS_API_URL", () => {
    process.env.REACT_APP_ALERTS_API_URL = "https://alerts.example.com";

    const alertsApi = require("../../src/api/alertsApi").default;

    expect(alertsApi.defaults.baseURL).toBe("https://alerts.example.com");
  });
});
