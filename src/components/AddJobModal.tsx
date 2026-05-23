import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useJobStore, SUB_STATUSES, COLUMNS, COLUMN_DEFAULT_SUBSTATUS } from '../lib/store';
import type { Job } from '../lib/store';
import { X } from 'lucide-react';

interface AddJobModalProps {
  onClose: () => void;
  jobToEdit?: Job;
  defaultStatusId?: string;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({ onClose, jobToEdit, defaultStatusId }) => {
  const { addJob, updateJob, updateJobSubStatus } = useJobStore();
  const [company, setCompany] = useState(jobToEdit?.company || '');
  const [role, setRole] = useState(jobToEdit?.role || '');
  const initialStatusId = jobToEdit?.statusId || defaultStatusId || COLUMNS[0].id;
  const [subStatus, setSubStatus] = useState(jobToEdit?.subStatus || COLUMN_DEFAULT_SUBSTATUS[initialStatusId]);
  const [statusId, setStatusId] = useState(initialStatusId);
  const [dateApplied, setDateApplied] = useState(jobToEdit?.dateApplied || new Date().toISOString().split('T')[0]);
  const [link, setLink] = useState(jobToEdit?.link || '');
  const [location, setLocation] = useState(jobToEdit?.location || '');
  const [workplaceType, setWorkplaceType] = useState(jobToEdit?.workplaceType || '');
  const [notes, setNotes] = useState(jobToEdit?.notes || '');
  const [salary, setSalary] = useState(jobToEdit?.salary || '');
  const [contactName, setContactName] = useState(jobToEdit?.contactName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim() && role.trim()) {
      if (jobToEdit) {
        updateJob(jobToEdit.id, { company: company.trim(), role: role.trim(), dateApplied, link: link.trim(), location: location.trim(), workplaceType, notes: notes.trim(), salary: salary.trim(), contactName: contactName.trim() });
        // Handle status update if it changed
        if (jobToEdit.subStatus !== subStatus) {
           updateJobSubStatus(jobToEdit.id, subStatus);
        }
      } else {
        addJob(company.trim(), role.trim(), statusId, subStatus, dateApplied, link.trim(), location.trim(), workplaceType, notes.trim(), salary.trim(), contactName.trim());
      }
      onClose();
    }
  };

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{jobToEdit ? 'Edit Application' : 'Add New Application'}</h2>
          <button onClick={onClose} className="icon-button" type="button"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="company">Company <span style={{ color: 'var(--secondary-color)' }}>*</span></label>
            <input
              type="text"
              id="company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Google"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role <span style={{ color: 'var(--secondary-color)' }}>*</span></label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. London, New York"
            />
          </div>
          <div className="form-group">
            <label>Workplace Type</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['Remote', 'Hybrid', 'On-site'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWorkplaceType(type === workplaceType ? '' : type)}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    borderRadius: '4px',
                    border: `1px solid ${workplaceType === type ? 'var(--secondary-color)' : '#334155'}`,
                    backgroundColor: workplaceType === type ? 'rgba(59, 130, 246, 0.1)' : '#0b1120',
                    color: workplaceType === type ? 'var(--secondary-color)' : 'var(--text-color)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="salary">Salary</label>
              <input
                type="text"
                id="salary"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                placeholder="e.g. £80k - £100k"
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="contactName">Contact Name</label>
              <input
                type="text"
                id="contactName"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add details about interviews, requirements, etc..."
              rows={3}
              style={{ padding: '0.5rem', border: '1px solid #334155', backgroundColor: '#0b1120', color: 'var(--text-color)', borderRadius: '4px', resize: 'vertical' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="dateApplied">Date Applied</label>
            <input
              type="date"
              id="dateApplied"
              value={dateApplied}
              onChange={e => setDateApplied(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', flex: 1 }} 
                onClick={() => {
                  const today = new Date();
                  setDateApplied(today.toISOString().split('T')[0]);
                }}
              >
                Today
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', flex: 1 }} 
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDateApplied(yesterday.toISOString().split('T')[0]);
                }}
              >
                Yesterday
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="link">Job Link</label>
            <input
              type="url"
              id="link"
              placeholder="https://..."
              value={link}
              onChange={e => setLink(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="statusId">Status</label>
            <select
              id="statusId"
              value={statusId}
              onChange={e => {
                const newStatusId = e.target.value;
                setStatusId(newStatusId);
                setSubStatus(COLUMN_DEFAULT_SUBSTATUS[newStatusId]);
              }}
            >
              {COLUMNS.map(col => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
          </div>
          
          {statusId === 'interview' && (
            <div className="form-group">
              <label htmlFor="subStatus">Interview Round</label>
              <select
                id="subStatus"
                value={subStatus}
                onChange={e => setSubStatus(e.target.value)}
              >
                {SUB_STATUSES.filter(s => s.columnId === 'interview').map(status => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{jobToEdit ? 'Save Changes' : 'Add Job'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
