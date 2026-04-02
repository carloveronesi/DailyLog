import { useState, useEffect, useCallback } from "react";
import { loadTodos, saveTodos } from "../services/storage/todo";

export function useTodos() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  const addTodo = useCallback((todoData) => {
    setTodos((prev) => {
      const newTodo = {
        id: crypto.randomUUID(),
        title: todoData.title || "",
        description: todoData.description || "",
        group: todoData.group || "DA FARE",
        startDate: todoData.startDate || null,
        endDate: todoData.endDate || null,
        isDone: false,
        subtasks: todoData.subtasks || [],
        tags: todoData.tags || [],
        project: todoData.project || "",
        createdAt: Date.now(),
      };
      const updated = [...prev, newTodo];
      saveTodos(updated);
      return updated;
    });
  }, []);

  const updateTodo = useCallback((id, updates) => {
    setTodos((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        
        // Ensure subtasks, tags and project exist in the merged object
        const merged = { 
          ...t, 
          ...updates,
          subtasks: updates.subtasks !== undefined ? updates.subtasks : (t.subtasks || []),
          tags: updates.tags !== undefined ? updates.tags : (t.tags || []),
          project: updates.project !== undefined ? updates.project : (t.project || ""),
        };
        return merged;
      });
      saveTodos(updated);
      return updated;
    });
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTodos(updated);
      return updated;
    });
  }, []);

  const toggleDone = useCallback((id) => {
    setTodos((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t));
      saveTodos(updated);
      return updated;
    });
  }, []);

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleDone,
  };
}
