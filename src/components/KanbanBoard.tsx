import React, { useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useJobStore, COLUMNS } from '../lib/store';
import type { Job } from '../lib/store';
import { KanbanColumn } from './KanbanColumn';
import { JobCard } from './JobCard';
import { JobListView } from './JobListView';
import { AddJobModal } from './AddJobModal';
import { SUB_STATUSES } from '../lib/store';

interface KanbanBoardProps {
  onDoubleClickColumn?: (columnId: string) => void;
  viewFilter: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onDoubleClickColumn, viewFilter }) => {
  const { jobs, updateJobStatus, updateJobSubStatus } = useJobStore();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [promptJobId, setPromptJobId] = useState<string | null>(null);
  const [editPromptJob, setEditPromptJob] = useState<Job | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Job') {
      setActiveJob(active.data.current.job);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAJob = active.data.current?.type === 'Job';
    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverAJob = over.data.current?.type === 'Job';

    if (!isActiveAJob) return;

    const activeJobData = active.data.current?.job as Job;
    const activeColumnId = activeJobData.statusId;
    const overColumnId = isOverAColumn ? overId : over.data.current?.job.statusId;

    // Dropping a job over another job
    if (isOverAJob) {
      const overJobStatus = over.data.current?.job.statusId;
      updateJobStatus(activeId.toString(), overJobStatus);
    }
    
    // Dropping a job over a column
    if (isOverAColumn) {
      updateJobStatus(activeId.toString(), overId.toString());
    }

    if (!activeColumnId || !overColumnId) return;

    if (activeColumnId !== overColumnId) {
      updateJobStatus(activeId.toString(), overColumnId.toString());
      
      // If moving out of pipeline, pop up edit modal for missing fields (like Date Applied)
      if (activeColumnId === 'pipeline' && overColumnId !== 'pipeline') {
        setEditPromptJob(activeJobData);
      }
      // If moving into interview stage, prompt for the specific round (unless we already opened edit modal)
      else if (overColumnId === 'interview' && activeColumnId !== 'interview') {
        setPromptJobId(activeId.toString());
      }
    }
  };

  return (
    <div className="kanban-board-container">
      <div className="kanban-board">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {viewFilter === 'all' ? (
            <>
              {/* Main 4 columns */}
              {COLUMNS.slice(0, 4).map(col => (
                <KanbanColumn 
                  key={col.id} 
                  column={col} 
                  jobs={jobs.filter(j => j.statusId === col.id)} 
                  onDoubleClick={() => onDoubleClickColumn?.(col.id)}
                />
              ))}

              {/* Stacked columns for Rejected and Offered */}
              <div className="kanban-stacked-columns">
                {COLUMNS.filter(c => c.id === 'rejected' || c.id === 'offered').map(col => (
                  <KanbanColumn 
                    key={col.id} 
                    column={col} 
                    jobs={jobs.filter(j => j.statusId === col.id)} 
                    onDoubleClick={() => onDoubleClickColumn?.(col.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, width: '100%' }}>
              <JobListView jobs={jobs.filter(j => j.statusId === viewFilter)} />
            </div>
          )}

          <DragOverlay>
            {activeJob ? <JobCard job={activeJob} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {editPromptJob && (
        <AddJobModal 
          jobToEdit={editPromptJob} 
          onClose={() => setEditPromptJob(null)} 
        />
      )}

      {promptJobId && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Select Interview Round</h2>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Which round is this?</label>
                <select 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #dcdcdc' }}
                  onChange={(e) => {
                    updateJobSubStatus(promptJobId, e.target.value);
                    setPromptJobId(null);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select round...</option>
                  {SUB_STATUSES.filter(s => s.columnId === 'interview').map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setPromptJobId(null)}>Skip (Default to HR Screen)</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
