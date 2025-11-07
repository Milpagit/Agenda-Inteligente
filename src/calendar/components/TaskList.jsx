// src/calendar/components/TaskList.jsx

import { useTaskStore, useForm } from "../../hooks";
import "./TaskList.css";
import { useEffect, useMemo, memo, useRef } from "react"; // Se importa 'memo'

export const TaskList = memo(() => {
  const { tasks, startSavingTask, startTogglingTask, startDeletingTask } =
    useTaskStore();

  // ✅ Evitamos recrear el initialForm en cada render
  const formInitial = useRef({ taskText: "" }).current;

  const { taskText, onInputChange, onResetForm } = useForm(formInitial);

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );
  const totalTasks = useMemo(() => tasks.length, [tasks]);

  // ✅ DEPURACIÓN: saber si el componente se desmonta (causaría reseteo)
  useEffect(() => {
    console.log("TaskList montado");
    return () => console.log("TaskList desmontado");
  }, []);

  // ✅ DEPURACIÓN: ver cómo cambia el valor del input
  useEffect(() => {
    console.log("Render TaskList - taskText:", taskText);
  });

  const handleNewTaskSubmit = (event) => {
    event.preventDefault();
    if (taskText.trim().length <= 1) return;
    startSavingTask(taskText);
    onResetForm();
  };

  const handleTaskToggle = (taskId) => {
    startTogglingTask(taskId);
  };

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h3>Tareas Pendientes</h3>
        {totalTasks > 0 && (
          <span className="task-progress">
            {completedTasks} de {totalTasks}
          </span>
        )}
      </div>

      <form className="add-task-form" onSubmit={handleNewTaskSubmit}>
        <input
          type="text"
          placeholder="Añadir nueva tarea..."
          name="taskText"
          value={taskText}
          onChange={onInputChange}
        />
        <button type="submit">+</button>
      </form>

      <ul className="task-list">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`task-item ${task.completed ? "completed" : ""}`}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => handleTaskToggle(task.id)}
            />
            <span className="task-text">{task.text}</span>
            <button
              className="delete-btn"
              onClick={() => startDeletingTask(task.id)}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});
