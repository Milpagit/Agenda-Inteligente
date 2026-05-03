import { render, screen, fireEvent } from "@testing-library/react";
import { HabitTracker } from "../../../src/calendar/components/HabitTracker";
import { useHabitStore, useForm } from "../../../src/hooks";

jest.mock("../../../src/hooks", () => ({
  useHabitStore: jest.fn(),
  useForm: jest.fn(),
}));

const mockStartSavingHabit = jest.fn();
const mockStartTogglingHabitDay = jest.fn();
const mockStartDeletingHabit = jest.fn();
const mockOnInputChange = jest.fn();
const mockOnResetForm = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useForm.mockReturnValue({
    habitName: "",
    onInputChange: mockOnInputChange,
    onResetForm: mockOnResetForm,
  });
});

describe("<HabitTracker />", () => {
  test("muestra el empty state cuando no hay hábitos", () => {
    useHabitStore.mockReturnValue({
      habits: [],
      startSavingHabit: mockStartSavingHabit,
      startTogglingHabitDay: mockStartTogglingHabitDay,
      startDeletingHabit: mockStartDeletingHabit,
    });

    render(<HabitTracker />);
    expect(screen.getByText(/Aún no tienes hábitos/i)).toBeTruthy();
    expect(screen.getByText(/Crea tu primer hábito arriba/i)).toBeTruthy();
  });

  test("muestra la lista de hábitos cuando existen", () => {
    useHabitStore.mockReturnValue({
      habits: [
        {
          id: "h1",
          name: "Ejercicio",
          completedDays: [true, false, true, false, false, false, false],
        },
      ],
      startSavingHabit: mockStartSavingHabit,
      startTogglingHabitDay: mockStartTogglingHabitDay,
      startDeletingHabit: mockStartDeletingHabit,
    });

    render(<HabitTracker />);
    expect(screen.getByText("Ejercicio")).toBeTruthy();
  });

  test("muestra 7 círculos de días para cada hábito", () => {
    useHabitStore.mockReturnValue({
      habits: [
        {
          id: "h1",
          name: "Lectura",
          completedDays: [false, false, false, false, false, false, false],
        },
      ],
      startSavingHabit: mockStartSavingHabit,
      startTogglingHabitDay: mockStartTogglingHabitDay,
      startDeletingHabit: mockStartDeletingHabit,
    });

    render(<HabitTracker />);
    const circles = document.querySelectorAll(".day-circle");
    expect(circles.length).toBe(7);
  });

  test("llama a startTogglingHabitDay al hacer clic en un círculo", () => {
    useHabitStore.mockReturnValue({
      habits: [
        {
          id: "h2",
          name: "Meditación",
          completedDays: [false, false, false, false, false, false, false],
        },
      ],
      startSavingHabit: mockStartSavingHabit,
      startTogglingHabitDay: mockStartTogglingHabitDay,
      startDeletingHabit: mockStartDeletingHabit,
    });

    render(<HabitTracker />);
    const circles = document.querySelectorAll(".day-circle");
    fireEvent.click(circles[0]);
    expect(mockStartTogglingHabitDay).toHaveBeenCalledWith("h2", 0);
  });

  test("llama a startDeletingHabit al hacer clic en el botón eliminar", () => {
    useHabitStore.mockReturnValue({
      habits: [
        {
          id: "h3",
          name: "Hidratación",
          completedDays: [true, true, true, true, true, true, true],
        },
      ],
      startSavingHabit: mockStartSavingHabit,
      startTogglingHabitDay: mockStartTogglingHabitDay,
      startDeletingHabit: mockStartDeletingHabit,
    });

    render(<HabitTracker />);
    const deleteBtn = screen.getByRole("button", { name: /×/i });
    fireEvent.click(deleteBtn);
    expect(mockStartDeletingHabit).toHaveBeenCalledWith("h3");
  });

  test("el círculo completado tiene clase 'completed'", () => {
    useHabitStore.mockReturnValue({
      habits: [
        {
          id: "h4",
          name: "Correr",
          completedDays: [true, false, false, false, false, false, false],
        },
      ],
      startSavingHabit: mockStartSavingHabit,
      startTogglingHabitDay: mockStartTogglingHabitDay,
      startDeletingHabit: mockStartDeletingHabit,
    });

    render(<HabitTracker />);
    const circles = document.querySelectorAll(".day-circle");
    expect(circles[0].classList.contains("completed")).toBe(true);
    expect(circles[1].classList.contains("completed")).toBe(false);
  });
});
