// src/calendar/components/HabitTracker.jsx

import { useHabitStore, useForm } from "../../hooks";
import "./HabitTracker.css";
import { memo } from "react"; // Se importa 'memo'

const newHabitForm = { habitName: "" };
const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"];

export const HabitTracker = memo(() => {
  const {
    habits,
    startSavingHabit,
    startTogglingHabitDay,
    startDeletingHabit,
  } = useHabitStore();
  const { habitName, onInputChange, onResetForm } = useForm(newHabitForm);

  const handleNewHabitSubmit = (event) => {
    event.preventDefault();
    if (habitName.trim().length <= 1) return;
    startSavingHabit(habitName);
    onResetForm();
  };

  const handleDayClick = (habitId, dayIndex) => {
    startTogglingHabitDay(habitId, dayIndex);
  };

  return (
    <div className="habit-tracker-container">
      <div className="habit-header">
        <h3>Seguimiento de Hábitos</h3>
      </div>

      <form className="add-habit-form" onSubmit={handleNewHabitSubmit}>
        <input
          type="text"
          placeholder="Nuevo hábito..."
          name="habitName"
          value={habitName}
          onChange={onInputChange}
        />
        <button type="submit">+</button>
      </form>

      <ul className="habit-list">
        {habits.map((habit) => (
          <li key={habit.id} className="habit-item">
            <span className="habit-name">{habit.name}</span>
            <button
              className="delete-btn"
              onClick={() => startDeletingHabit(habit.id)}
            >
              &times;
            </button>
            <div className="habit-week-tracker">
              {daysOfWeek.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`day-circle ${
                    habit.completedDays[dayIndex] ? "completed" : ""
                  }`}
                  onClick={() => handleDayClick(habit.id, dayIndex)}
                >
                  {day}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
