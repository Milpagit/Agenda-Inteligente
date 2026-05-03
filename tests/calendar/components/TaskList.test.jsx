import { render, screen, fireEvent } from "@testing-library/react";
import { TaskList } from "../../../src/calendar/components/TaskList";
import { useTaskStore } from "../../../src/hooks";
import { useForm } from "../../../src/hooks";

jest.mock("../../../src/hooks", () => ({
  useTaskStore: jest.fn(),
  useForm: jest.fn(),
}));

const mockStartSavingTask = jest.fn();
const mockStartTogglingTask = jest.fn();
const mockStartDeletingTask = jest.fn();

const mockOnInputChange = jest.fn();
const mockOnResetForm = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useForm.mockReturnValue({
    taskText: "",
    onInputChange: mockOnInputChange,
    onResetForm: mockOnResetForm,
  });
});

describe("<TaskList />", () => {
  test("muestra el empty state cuando no hay tareas", () => {
    useTaskStore.mockReturnValue({
      tasks: [],
      startSavingTask: mockStartSavingTask,
      startTogglingTask: mockStartTogglingTask,
      startDeletingTask: mockStartDeletingTask,
    });

    render(<TaskList />);
    expect(screen.getByText(/Sin tareas pendientes/i)).toBeTruthy();
    expect(screen.getByText(/Añade tu primera tarea arriba/i)).toBeTruthy();
  });

  test("muestra la lista de tareas cuando existen", () => {
    useTaskStore.mockReturnValue({
      tasks: [
        { id: "1", text: "Estudiar cálculo", completed: false },
        { id: "2", text: "Entregar reporte", completed: true },
      ],
      startSavingTask: mockStartSavingTask,
      startTogglingTask: mockStartTogglingTask,
      startDeletingTask: mockStartDeletingTask,
    });

    render(<TaskList />);
    expect(screen.getByText("Estudiar cálculo")).toBeTruthy();
    expect(screen.getByText("Entregar reporte")).toBeTruthy();
  });

  test("muestra el progreso de tareas completadas", () => {
    useTaskStore.mockReturnValue({
      tasks: [
        { id: "1", text: "Tarea A", completed: true },
        { id: "2", text: "Tarea B", completed: false },
      ],
      startSavingTask: mockStartSavingTask,
      startTogglingTask: mockStartTogglingTask,
      startDeletingTask: mockStartDeletingTask,
    });

    render(<TaskList />);
    expect(screen.getByText("1 de 2")).toBeTruthy();
  });

  test("llama a startDeletingTask al hacer clic en el botón de eliminar", () => {
    useTaskStore.mockReturnValue({
      tasks: [{ id: "t1", text: "Tarea eliminable", completed: false }],
      startSavingTask: mockStartSavingTask,
      startTogglingTask: mockStartTogglingTask,
      startDeletingTask: mockStartDeletingTask,
    });

    render(<TaskList />);
    const deleteBtn = screen.getByRole("button", { name: /×/i });
    fireEvent.click(deleteBtn);
    expect(mockStartDeletingTask).toHaveBeenCalledWith("t1");
  });

  test("llama a startTogglingTask al hacer clic en el checkbox", () => {
    useTaskStore.mockReturnValue({
      tasks: [{ id: "t2", text: "Tarea toggle", completed: false }],
      startSavingTask: mockStartSavingTask,
      startTogglingTask: mockStartTogglingTask,
      startDeletingTask: mockStartDeletingTask,
    });

    render(<TaskList />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockStartTogglingTask).toHaveBeenCalledWith("t2");
  });
});
