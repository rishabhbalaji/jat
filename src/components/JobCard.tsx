import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Job } from '../lib/store';
import { SUB_STATUSES, useJobStore } from '../lib/store';
import { Clock, AlertCircle, Trash2, Edit2, ExternalLink, MapPin } from 'lucide-react';
import { AddJobModal } from './AddJobModal';

interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { deleteJob, updateJobSubStatus, user } = useJobStore();
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id, data: { type: 'Job', job } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if stale (unchanged for 14+ days)
  const isStale = job.statusId === 'waiting' && (Date.now() - new Date(job.updatedAt).getTime()) > 14 * 24 * 60 * 60 * 1000;
  // Format dates
  const formattedDateApplied = job.dateApplied ? new Date(job.dateApplied).toLocaleDateString() : new Date(job.createdAt).toLocaleDateString();
  const formattedDateUpdated = new Date(job.updatedAt).toLocaleDateString();

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`job-card ${isDragging ? 'job-card-dragging' : ''} ${isStale ? 'job-card-stale' : ''}`}
        onDoubleClick={(e) => {
          if (!user) return;
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
      <div className="job-card-header">
        <h4 className="job-company">{job.company}</h4>
        {isStale && <span title="Stale for 2+ weeks"><AlertCircle size={16} className="text-warning" /></span>}
      </div>
      <p className="job-role">{job.role}</p>
      {job.location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
          <MapPin size={14} />
          <span>{job.location}</span>
        </div>
      )}
      
      {job.subStatus && (
        <div className="job-card-status-badge">
          {(() => {
            const statusObj = SUB_STATUSES.find(s => s.id === job.subStatus);
            if (!statusObj) return null;
            if (job.statusId === 'interview') {
              return (
                <select 
                  className="status-badge-select" 
                  style={{ backgroundColor: statusObj.color + '20', color: statusObj.color, border: `1px solid ${statusObj.color}` }}
                  value={job.subStatus}
                  disabled={!user}
                  onChange={(e) => updateJobSubStatus(job.id, e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {SUB_STATUSES.filter(s => s.columnId === 'interview').map(s => (
                    <option key={s.id} value={s.id} style={{ color: '#18181b', backgroundColor: '#F9F6EE' }}>
                      {s.label}
                    </option>
                  ))}
                </select>
              );
            }
            return (
              <span 
                className="status-badge" 
                style={{ backgroundColor: statusObj.color + '20', color: statusObj.color, border: `1px solid ${statusObj.color}` }}
              >
                {statusObj.label}
              </span>
            );
          })()}
        </div>
      )}

      <div className="job-card-footer">
        <div className="job-card-footer-left">
          {job.statusId !== 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} />
                <span>Applied: {formattedDateApplied}</span>
              </div>
              {job.statusId !== 'applied' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a1a1aa', fontSize: '0.75rem' }}>
                  <Clock size={12} />
                  <span>Modified: {formattedDateUpdated}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="job-card-footer-right" style={{ display: 'flex', gap: '0.5rem' }}>
          {job.link && (
            <a 
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-button"
              style={{ color: 'var(--secondary-color)', display: 'flex', alignItems: 'center' }}
              onPointerDown={(e) => e.stopPropagation()}
              title="Open Job Link"
            >
              <ExternalLink size={16} />
            </a>
          )}
          {user && (
            <>
              <button 
                className="btn-edit icon-button" 
                style={{ color: '#a1a1aa' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Edit Job"
              >
                <Edit2 size={16} />
              </button>
              <button 
                className="btn-delete icon-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteJob(job.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Delete Job"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    {isEditing && (
      <AddJobModal 
        onClose={() => setIsEditing(false)} 
        jobToEdit={job}
      />
    )}
    </>
  );
};
