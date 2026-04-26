import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage, OnboardingPage } from "../auth";
import { CalendarPage } from "../calendar";
import { useAuthStore } from "../hooks";
import { LoadingPage } from "../shared";

export const AppRouter = () => {
  const { status, user } = useAuthStore();

  if (status === "checking") {
    return <LoadingPage />;
  }

  return (
    <Routes>
      {status === "not-authenticated" ? (
        <>
          <Route path="/auth/*" element={<LoginPage />} />
          <Route path="/*" element={<Navigate to={"/auth/login"} />} />
        </>
      ) : !user || !user.onboardingComplete ? (
        <>
          <Route path="/auth/onboarding" element={<OnboardingPage />} />
          <Route path="/*" element={<Navigate to="/auth/onboarding" />} />
        </>
      ) : (
        <>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
};
