import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Column, Job } from '../lib/store';
import { JobCard } from './JobCard';

interface KanbanColumnProps {
  column: Column;
  jobs: Job[];
  onDoubleClick?: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, jobs, onDoubleClick }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div className="kanban-column" ref={setNodeRef} onDoubleClick={onDoubleClick}>
      <div className="kanban-column-header">
        <h3>{column.title}</h3>
        <span className="kanban-column-count">{jobs.length}</span>
      </div>
      
      <div className="kanban-column-content">
        <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
