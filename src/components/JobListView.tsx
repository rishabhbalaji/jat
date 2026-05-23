import React, { useState } from 'react';
import type { Job } from '../lib/store';
import { SUB_STATUSES, useJobStore } from '../lib/store';
import { Clock, Trash2, Edit2, ExternalLink, MapPin, DollarSign, User, FileText } from 'lucide-react';
import { AddJobModal } from './AddJobModal';

interface JobListViewProps {
  jobs: Job[];
}

export const JobListView: React.FC<JobListViewProps> = ({ jobs }) => {
  const { deleteJob, updateJobSubStatus } = useJobStore();
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  if (jobs.length === 0) {
    return <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No jobs in this column yet.</div>;
  }

  return (
    <div className="job-list-view">
      {jobs.map(job => {
        const formattedDateApplied = job.dateApplied ? new Date(job.dateApplied).toLocaleDateString() : '';
        const formattedDateUpdated = new Date(job.updatedAt).toLocaleDateString();

        return (
          <div key={job.id} className="job-list-card" onDoubleClick={() => setEditingJobId(job.id)}>
            <div className="job-list-card-header">
              <div className="job-list-card-title">
                <h3>{job.company}</h3>
                {job.link && (
                  <a href={job.link} target="_blank" rel="noopener noreferrer" className="icon-button" style={{ color: 'var(--secondary-color)' }}>
                    <ExternalLink size={20} />
                  </a>
                )}
              </div>
              <div className="job-list-card-actions">
                <button className="btn-edit icon-button" onClick={() => setEditingJobId(job.id)}><Edit2 size={18} /></button>
                <button className="btn-delete icon-button" onClick={() => deleteJob(job.id)}><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="job-list-card-meta">
              <span className="job-role-list">{job.role}</span>
              {job.location && <span className="meta-item"><MapPin size={14}/> {job.location}</span>}
              {job.salary && <span className="meta-item" style={{ color: '#fbbf24' }}><DollarSign size={14}/> {job.salary}</span>}
              {job.contactName && <span className="meta-item"><User size={14}/> {job.contactName}</span>}
            </div>

            {job.notes && (
              <div className="job-list-card-body">
                <div className="job-list-notes">
                  <FileText size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#94a3b8' }} />
                  <p>{job.notes}</p>
                </div>
              </div>
            )}

            <div className="job-list-card-footer">
              <div className="job-list-dates">
                 {job.statusId !== 'pipeline' && <span><Clock size={14}/> Applied: {formattedDateApplied}</span>}
                 {job.statusId !== 'pipeline' && job.statusId !== 'applied' && <span><Clock size={14}/> Modified: {formattedDateUpdated}</span>}
              </div>
              
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
                          onChange={(e) => updateJobSubStatus(job.id, e.target.value)}
                        >
                          {SUB_STATUSES.filter(s => s.columnId === 'interview').map(s => (
                            <option key={s.id} value={s.id} style={{ color: '#f8fafc', backgroundColor: '#0b1120' }}>
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
            </div>
          </div>
        );
      })}

      {editingJobId && (
        <AddJobModal 
          onClose={() => setEditingJobId(null)} 
          jobToEdit={jobs.find(j => j.id === editingJobId)}
        />
      )}
    </div>
  );
};
