import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

export interface Job {
  id: string;
  company: string;
  role: string;
  statusId: string;
  subStatus?: string;
  dateApplied?: string;
  link?: string;
  location?: string;
  notes?: string;
  salary?: string;
  contactName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubStatus {
  id: string;
  label: string;
  color: string;
  columnId: string;
}

export const SUB_STATUSES: SubStatus[] = [
  { id: 'pipeline', label: 'To Apply / Contact', color: '#3b82f6', columnId: 'pipeline' },
  { id: 'waiting', label: 'Waiting', color: '#64748b', columnId: 'waiting' },
  { id: 'follow-up', label: 'Follow Up', color: '#f59e0b', columnId: 'follow-up' },
  { id: 'hr-screen', label: 'HR Screen', color: '#8b5cf6', columnId: 'interview' },
  { id: 'technical', label: 'Technical', color: '#f97316', columnId: 'interview' },
  { id: 'take-home', label: 'Take-home', color: '#ec4899', columnId: 'interview' },
  { id: 'final', label: 'Final Round', color: '#eab308', columnId: 'interview' },
  { id: 'offer', label: 'Offer Received', color: '#22c55e', columnId: 'offered' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444', columnId: 'rejected' },
];

export const COLUMN_DEFAULT_SUBSTATUS: Record<string, string> = {
  'pipeline': 'pipeline',
  'waiting': 'waiting',
  'follow-up': 'follow-up',
  'interview': 'hr-screen',
  'offered': 'offer',
  'rejected': 'rejected'
};

export interface Column {
  id: string;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: 'pipeline', title: 'Pipeline / Contact' },
  { id: 'waiting', title: 'Waiting for Response' },
  { id: 'follow-up', title: '2 Week Follow Up Needed' },
  { id: 'interview', title: 'Interview Stage' },
  { id: 'rejected', title: 'Rejected' },
  { id: 'offered', title: 'Job Offered' },
];

interface JobStoreState {
  jobs: Job[];
  loading: boolean;
}

interface JobStoreContextValue extends JobStoreState {
  addJob: (company: string, role: string, statusId: string, subStatus?: string, dateApplied?: string, link?: string, location?: string, notes?: string, salary?: string, contactName?: string) => void;
  updateJobStatus: (id: string, newStatusId: string) => void;
  updateJobSubStatus: (id: string, newSubStatusId: string) => void;
  updateJob: (id: string, updates: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteJob: (id: string) => void;
  resetJobs: () => void;
  importJobs: (jobs: Job[]) => void;
}

const JobStoreContext = createContext<JobStoreContextValue | undefined>(undefined);

export const JobStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<JobStoreState>({ jobs: [], loading: true });

  useEffect(() => {
    // Initial fetch
    const fetchJobs = async () => {
      const { data, error } = await supabase.from('jobs').select('*');
      if (error) {
        console.error('Error fetching jobs:', error);
      } else if (data) {
        setState({ jobs: data as Job[], loading: false });
      }
    };

    fetchJobs();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newJob = payload.new as Job;
            setState(prev => ({ ...prev, jobs: [...prev.jobs.filter(j => j.id !== newJob.id), newJob] }));
          } else if (payload.eventType === 'UPDATE') {
            const updatedJob = payload.new as Job;
            setState(prev => ({
              ...prev,
              jobs: prev.jobs.map(j => (j.id === updatedJob.id ? updatedJob : j))
            }));
          } else if (payload.eventType === 'DELETE') {
            setState(prev => ({
              ...prev,
              jobs: prev.jobs.filter(j => j.id !== payload.old.id)
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addJob = async (company: string, role: string, statusId: string, subStatus?: string, dateApplied?: string, link?: string, location?: string, notes?: string, salary?: string, contactName?: string) => {
    const newJob: Job = {
      id: uuidv4(),
      company,
      role,
      statusId,
      subStatus,
      dateApplied,
      link,
      location,
      notes,
      salary,
      contactName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Optimistic UI update
    setState(prev => ({ ...prev, jobs: [...prev.jobs, newJob] }));

    // Persist to DB
    const { error } = await supabase.from('jobs').insert([newJob]);
    if (error) console.error("Error adding job:", error);
  };

  const updateJobStatus = async (id: string, newStatusId: string) => {
    const job = state.jobs.find(j => j.id === id);
    if (!job) return;

    let newSubStatus = job.subStatus;
    if (job.statusId !== newStatusId) {
       const currentSubStatusObj = SUB_STATUSES.find(s => s.id === job.subStatus);
       if (!currentSubStatusObj || currentSubStatusObj.columnId !== newStatusId) {
         newSubStatus = COLUMN_DEFAULT_SUBSTATUS[newStatusId];
       }
    }

    const updates = { 
      statusId: newStatusId, 
      subStatus: newSubStatus,
      updatedAt: new Date().toISOString() 
    };

    // Optimistic UI
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(j => j.id === id ? { ...j, ...updates } : j)
    }));

    // Persist
    const { error } = await supabase.from('jobs').update(updates).eq('id', id);
    if (error) console.error("Error updating job status:", error);
  };

  const updateJobSubStatus = async (id: string, newSubStatusId: string) => {
    const job = state.jobs.find(j => j.id === id);
    if (!job) return;

    const subStatusObj = SUB_STATUSES.find(s => s.id === newSubStatusId);
    const newStatusId = subStatusObj ? subStatusObj.columnId : job.statusId;

    const updates: Partial<Job> = {
      statusId: newStatusId, 
      subStatus: newSubStatusId,
      updatedAt: new Date().toISOString()
    };

    if (newStatusId === 'pipeline' && job.statusId !== 'pipeline') {
      updates.dateApplied = '';
    }

    // Optimistic UI
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(j => j.id === id ? { ...j, ...updates } : j)
    }));

    // Persist
    const { error } = await supabase.from('jobs').update(updates).eq('id', id);
    if (error) console.error("Error updating job substatus:", error);
  };

  const updateJob = async (id: string, updates: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const updatePayload = { ...updates, updatedAt: new Date().toISOString() };
    
    // Optimistic UI
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(job => job.id === id ? { ...job, ...updatePayload } : job)
    }));

    // Persist
    const { error } = await supabase.from('jobs').update(updatePayload).eq('id', id);
    if (error) console.error("Error updating job:", error);
  };

  const deleteJob = async (id: string) => {
    // Optimistic UI
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.filter(job => job.id !== id)
    }));

    // Persist
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) console.error("Error deleting job:", error);
  };

  const resetJobs = async () => {
    // Optimistic UI
    setState(prev => ({ ...prev, jobs: [] }));
    
    // Note: This requires a TRUNCATE or bulk delete. Supabase delete requires a filter.
    const { error } = await supabase.from('jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error("Error resetting jobs:", error);
  };

  const importJobs = async (importedJobs: Job[]) => {
    // Optimistic UI
    setState(prev => ({ ...prev, jobs: [...prev.jobs, ...importedJobs] }));

    // Persist
    const { error } = await supabase.from('jobs').insert(importedJobs);
    if (error) console.error("Error importing jobs:", error);
  };

  return (
    <JobStoreContext.Provider value={{ ...state, addJob, updateJobStatus, updateJobSubStatus, updateJob, deleteJob, resetJobs, importJobs }}>
      {children}
    </JobStoreContext.Provider>
  );
};

export const useJobStore = () => {
  const context = useContext(JobStoreContext);
  if (!context) {
    throw new Error('useJobStore must be used within a JobStoreProvider');
  }
  return context;
};
