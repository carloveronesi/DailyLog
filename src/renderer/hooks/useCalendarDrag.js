import { useState, useRef, useEffect, useMemo } from 'react';
import { SLOT_MINUTES } from '../domain/tasks';
import { slotIndex } from '../domain/calendar';

export function useCalendarDrag({ onOpenSlot, onMoveTask, onResizeTask, getColDate, clampToSection }) {
  const [activeDragCol, setActiveDragCol] = useState(null);
  
  const [dragStart, setDragStart] = useState(null);
  const [dragHover, setDragHover] = useState(null);

  const [moveTaskBlock, setMoveTaskBlock] = useState(null);
  const [moveTaskDelta, setMoveTaskDelta] = useState(0);
  const pendingMoveRef = useRef(null);

  const [resizeTaskBlock, setResizeTaskBlock] = useState(null);
  const [resizeTaskDelta, setResizeTaskDelta] = useState(0);
  const [resizeTaskDirection, setResizeTaskDirection] = useState(null);

  const isDraggingEmpty = dragStart !== null && dragHover !== null && activeDragCol !== null;
  const isMoving = moveTaskBlock !== null && activeDragCol !== null;
  const isResizing = resizeTaskBlock !== null && activeDragCol !== null;
  const isAnyDragging = dragStart !== null || isMoving || isResizing;

  const selection = useMemo(() => {
    if (!isDraggingEmpty) return null;
    const start = Math.min(dragStart, dragHover);
    const end = Math.max(dragStart, dragHover) + SLOT_MINUTES;
    const startIndex = slotIndex(start);
    const endIndex = slotIndex(end - SLOT_MINUTES);
    if (startIndex < 0 || endIndex < 0) return null;
    return {
      startIndex,
      span: endIndex - startIndex + 1,
    };
  }, [dragStart, dragHover, isDraggingEmpty]);

  useEffect(() => {
    function handleUp() {
      if (isDraggingEmpty) {
        let start = Math.min(dragStart, dragHover);
        let end = Math.max(dragStart, dragHover) + SLOT_MINUTES;
        
        if (clampToSection) {
            start = clampToSection(activeDragCol, start);
            end = clampToSection(activeDragCol, end);
        }

        const colDate = getColDate ? getColDate(activeDragCol) : null;

        setDragStart(null);
        setDragHover(null);
        setActiveDragCol(null);
        
        if (getColDate) {
            onOpenSlot?.({ date: colDate, start, end });
        } else {
            onOpenSlot?.({ start, end });
        }
      } else if (isMoving) {
        if (moveTaskDelta !== 0 && onMoveTask) {
           const newStart = moveTaskBlock.start + moveTaskDelta;
           const colDate = getColDate ? getColDate(activeDragCol) : null;
           if (getColDate) {
               onMoveTask(colDate, { start: moveTaskBlock.start, end: moveTaskBlock.end, newStart });
           } else {
               onMoveTask({ start: moveTaskBlock.start, end: moveTaskBlock.end, newStart });
           }
        }
        setMoveTaskBlock(null);
        setMoveTaskDelta(0);
        pendingMoveRef.current = null;
        setActiveDragCol(null);
      } else if (isResizing) {
        if (resizeTaskDelta !== 0 && onResizeTask) {
           let newStart = resizeTaskBlock.start;
           let newEnd = resizeTaskBlock.end;
           
           if (resizeTaskDirection === 'top') {
              newStart = resizeTaskBlock.start + resizeTaskDelta;
           } else {
              newEnd = resizeTaskBlock.end + resizeTaskDelta;
           }

           if (newEnd > newStart) {
              const colDate = getColDate ? getColDate(activeDragCol) : null;
              if (getColDate) {
                  onResizeTask(colDate, { start: resizeTaskBlock.start, end: resizeTaskBlock.end, newStart, newEnd });
              } else {
                  onResizeTask({ start: resizeTaskBlock.start, end: resizeTaskBlock.end, newStart, newEnd });
              }
           }
        }
        setResizeTaskBlock(null);
        setResizeTaskDelta(0);
        setResizeTaskDirection(null);
        setActiveDragCol(null);
      } else if (pendingMoveRef.current) {
        pendingMoveRef.current = null;
      }
    }

    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [dragStart, dragHover, activeDragCol, isDraggingEmpty, isMoving, isResizing, moveTaskBlock, moveTaskDelta, resizeTaskBlock, resizeTaskDelta, resizeTaskDirection, onOpenSlot, onMoveTask, onResizeTask, getColDate, clampToSection]);

  useEffect(() => {
    function handleMove(e) {
      if (!pendingMoveRef.current || isMoving || isResizing || isDraggingEmpty) return;
      const { startY, block, colIdx } = pendingMoveRef.current;
      if (Math.abs(e.clientY - startY) < 5) return;
      setActiveDragCol(colIdx);
      setMoveTaskBlock({ ...block });
      setMoveTaskDelta(0);
      pendingMoveRef.current = null;
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [isMoving, isResizing, isDraggingEmpty]);

  return {
    activeDragCol, setActiveDragCol,
    dragStart, setDragStart,
    dragHover, setDragHover,
    moveTaskBlock, setMoveTaskBlock,
    moveTaskDelta, setMoveTaskDelta,
    resizeTaskBlock, setResizeTaskBlock,
    resizeTaskDelta, setResizeTaskDelta,
    resizeTaskDirection, setResizeTaskDirection,
    pendingMoveRef,
    isDraggingEmpty, isMoving, isResizing, isAnyDragging, selection
  };
}
