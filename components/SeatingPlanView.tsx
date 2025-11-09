import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import type { Student, ClassData, SeatingChart } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { BLANK_SEATING_CHART } from '../constants';

interface SeatingPlanViewProps {
  students: Student[];
  classData: ClassData;
}

interface StudentNameCardProps {
  student: Student;
  id: string;
}

const StudentNameCard: React.FC<{ student: Student }> = ({ student }) => {
  return <div className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-center cursor-grabbing touch-none">
      {student.firstName} {student.lastName}
    </div>;
};

const DraggableStudentCard: React.FC<StudentNameCardProps> = ({ student, id }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    data: { studentId: student.studentId },
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <StudentNameCard student={student} />
    </div>
};

const SeatingPlanView: React.FC<SeatingPlanViewProps> = ({ students, classData }) => {
  const { data, saveData } = useAppContext();
  const [seatingChart, setSeatingChart] = useState<SeatingChart>(classData.seatingChart || BLANK_SEATING_CHART);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    // If the class data from props has a seating chart, use it. Otherwise, use a blank one.
    // This also handles the case where a chart is created for the first time.
    setSeatingChart(classData.seatingChart || BLANK_SEATING_CHART);
  }, [classData.seatingChart]);

  const handleGridChange = () => {
    const newArrangement = Array(seatingChart.rows)
      .fill(null)
      .map(() => Array(seatingChart.seatsPerRow).fill(null));

    // Try to preserve existing placements
    if (classData.seatingChart) {
      for (let r = 0; r < Math.min(seatingChart.rows, classData.seatingChart.rows); r++) {
        for (let c = 0; c < Math.min(seatingChart.seatsPerRow, classData.seatingChart.seatsPerRow); c++) {
          newArrangement[r][c] = classData.seatingChart.arrangement[r][c];
        }
      }
    }
    
    handleSave({ ...seatingChart, arrangement: newArrangement });
  };

  const handleSave = (newChart: SeatingChart) => {
    if (!data) return;
    const updatedClass = { ...classData, seatingChart: newChart };
    const updatedClasses = data.classes.map(c => c.classId === classData.classId ? updatedClass : c);
    saveData({ ...data, classes: updatedClasses });
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || !active.data.current) return;

    const studentId = active.data.current?.studentId;
    if (!studentId) return;

    const sourceId = active.id as string;
    const destinationId = over.id as string;
    if (sourceId === destinationId) return;

    const newArrangement = seatingChart.arrangement.map(row => [...row]);

    // Find current position of the dragged student
    let sourceRow: number | null = null, sourceCol: number | null = null;
    const isComingFromUnseated = sourceId.startsWith('unseated-');

    if (sourceId.startsWith('seat-')) {
      [sourceRow, sourceCol] = sourceId.split('-').slice(1).map(Number);
    }

    // Find where the student is being dropped
    const isDroppingOnSeat = destinationId.startsWith('seat-');
    const isDroppingOnUnseated = destinationId === 'unseated';

    // Remove student from their original position in the arrangement
    if (sourceRow !== null && sourceCol !== null) { // only if it was in a seat
      newArrangement[sourceRow][sourceCol] = null;
    }

    if (isDroppingOnSeat) {
      const [destRow, destCol] = destinationId.split('-').slice(1).map(Number);
      const studentInTargetSeat = newArrangement[destRow][destCol];

      // Place dragged student in the new seat
      newArrangement[destRow][destCol] = studentId;

      // If the target seat was occupied, move the occupant to the source position
      // (if the source was a seat, otherwise they become unseated)
      if (studentInTargetSeat && studentInTargetSeat !== studentId) {
        if (sourceRow !== null && sourceCol !== null) {
          newArrangement[sourceRow][sourceCol] = studentInTargetSeat;
        } else if (isComingFromUnseated) {
          // The source was the unseated list, so the swapped student becomes unseated.
          // We don't need to do anything here because the `seatedStudents` and `unseatedStudents`
          // memo will automatically recalculate and show the swapped student in the unseated list.
        }
      }
    } else if (isDroppingOnUnseated) {
      // Student is dropped into the unseated list, which is handled by removing them from their seat.
    }

    handleSave({ ...seatingChart, arrangement: newArrangement });
  };

  const { seatedStudents, unseatedStudents } = useMemo(() => {
    const seatedIds = new Set(seatingChart.arrangement.flat().filter(Boolean));
    const unseated = students.filter(s => !seatedIds.has(s.studentId));
    const seated = new Map(students.map(s => [s.studentId, s]));
    return { seatedStudents: seated, unseatedStudents: unseated };
  }, [students, seatingChart]);

  const activeStudent = useMemo(() => {
    if (!activeDragId) return null;
    const studentId = activeDragId.split('-').pop();
    return students.find(s => s.studentId === studentId);
  }, [activeDragId, students]);

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>

      <div className="space-y-6">
        <div className="flex items-center gap-6 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
          <div className="flex items-center gap-2">
            <label htmlFor="rows" className="text-sm font-medium">Rows:</label>
            <input
              type="number"
              id="rows"
              min="1"
              value={seatingChart.rows}
              onChange={(e) => setSeatingChart(s => ({ ...s, rows: parseInt(e.target.value, 10) || 1 }))}
              className="w-20 p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="seats" className="text-sm font-medium">Seats per Row:</label>
            <input
              type="number"
              id="seats"
              min="1"
              value={seatingChart.seatsPerRow}
              onChange={(e) => setSeatingChart(s => ({ ...s, seatsPerRow: parseInt(e.target.value, 10) || 1 }))}
              className="w-20 p-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm text-sm"
            />
          </div>
          <button onClick={handleGridChange} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-semibold text-sm">
            Apply Grid Size
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-3">
              <p className="text-center font-semibold text-gray-500 dark:text-gray-400 text-sm">[ Front of Classroom ]</p>
              {seatingChart.arrangement.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-3 justify-center">
                  {row.map((studentId, seatIndex) => {
                    const droppableId = `seat-${rowIndex}-${seatIndex}`;
                    const { isOver, setNodeRef } = useDroppable({ id: droppableId });
                    return (
                      <div
                        key={seatIndex}
                        ref={setNodeRef}
                        className={`w-36 h-16 border-2 border-dashed rounded-lg flex items-center justify-center
                          ${isOver ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}
                        `}
                      >
                        {studentId && seatedStudents.has(studentId) ? (
                          <DraggableStudentCard student={seatedStudents.get(studentId)!} id={`seat-${rowIndex}-${seatIndex}`} />
                        ) : (
                          <span className="text-gray-400 text-xs">Empty Seat</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <UnseatedStudentsList students={unseatedStudents} />
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeStudent ? <StudentNameCard student={activeStudent} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

const UnseatedStudentsList: React.FC<{ students: Student[] }> = ({ students }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'unseated' });
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
      <h3 className="font-bold text-lg mb-4">Unseated Students ({students.length})</h3>
      <div
        ref={setNodeRef}
        className={`space-y-2 p-2 min-h-[200px] rounded-md ${isOver ? 'bg-green-100 dark:bg-green-900/50' : ''}`}
      >
        {students.map((student) => (
          <DraggableStudentCard key={student.studentId} student={student} id={`unseated-${student.studentId}`} />
        ))}
      </div>
    </div>
  );
};

export default SeatingPlanView;