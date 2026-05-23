import React, { useState } from 'react';
import { Download, Upload, Plus } from 'lucide-react';
import { JobStoreProvider, useJobStore, COLUMNS } from './lib/store';
import { KanbanBoard } from './components/KanbanBoard';
import { AddJobModal } from './components/AddJobModal';

const AppContent: React.FC = () => {
  const { jobs, importJobs } = useJobStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<string | undefined>(undefined);
  const [viewFilter, setViewFilter] = useState<string>('all');

  const handleOpenModal = (statusId?: string) => {
    setDefaultStatus(statusId);
    setIsModalOpen(true);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(jobs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          importJobs(importedData);
          alert('Data imported successfully!');
        } else {
          alert('Invalid file format. Must be a JSON array.');
        }
      } catch (err) {
        alert('Error reading file. Is it a valid JSON?');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h1 className="logo">JAT</h1>
          <button className="btn-primary" onClick={() => handleOpenModal()} style={{ padding: '0.4rem 1rem' }}>
            <Plus size={16} /> Add Job
          </button>
        </div>

        <div className="view-tabs" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', flex: 1, justifyContent: 'center', margin: '0 2rem' }}>
          <button
            className="btn-secondary"
            onClick={() => setViewFilter('all')}
            style={{ backgroundColor: viewFilter === 'all' ? 'var(--primary-color)' : 'transparent', color: viewFilter === 'all' ? '#F9F6EE' : 'var(--text-color)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Dashboard
          </button>
          {COLUMNS.map(col => {
            let label = col.title;
            if (col.id === 'pipeline') label = 'Contact';
            if (col.id === 'applied') label = 'Waiting';
            if (col.id === 'follow-up') label = 'Follow Up';
            if (col.id === 'interview') label = 'Interview';
            if (col.id === 'rejected') label = 'Rejected';
            if (col.id === 'offered') label = 'Job Offered';

            return (
              <button
                key={col.id}
                className="btn-secondary"
                onClick={() => setViewFilter(col.id)}
                style={{ backgroundColor: viewFilter === col.id ? 'var(--primary-color)' : 'transparent', color: viewFilter === col.id ? '#F9F6EE' : 'var(--text-color)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="nav-links" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            onClick={exportData}
            title="Export JSON"
            style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
          >
            <Download size={20} />
          </button>
          <label
            className="btn-secondary"
            title="Import JSON"
            style={{ padding: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center' }}
          >
            <Upload size={20} />
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </label>
        </div>
      </nav>

      <main className="main-content">
        <KanbanBoard onDoubleClickColumn={handleOpenModal} viewFilter={viewFilter} />
        <div style={{
          textAlign: 'right',
          marginTop: '0.5rem',
          color: '#FF3131',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}>
          Total Job Applications: {jobs.filter(j => j.statusId !== 'pipeline').length}
        </div>
      </main>

      {isModalOpen && <AddJobModal onClose={() => setIsModalOpen(false)} defaultStatusId={defaultStatus} />}
    </div>
  );
};

function App() {
  return (
    <JobStoreProvider>
      <AppContent />
    </JobStoreProvider>
  );
}

export default App;

