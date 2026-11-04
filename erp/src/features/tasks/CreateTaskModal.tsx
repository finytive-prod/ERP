import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Building2, Briefcase, Calendar } from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { ClientSite, Job } from '../../types';
import { Modal, Button, useToast } from '../../components/ui';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSiteId?: string;
  defaultJobId?: string;
  allowedSiteIds?: string[];
  onTaskCreated?: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultSiteId,
  defaultJobId,
  allowedSiteIds,
  onTaskCreated,
}) => {
  const { showToast } = useToast();
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [form, setForm] = useState({
    siteId: '',
    jobId: '',
    title: '',
    description: '',
    unit: 'Sets',
    targetQty: '10',
    assignedSupervisor: 'Murugan P',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      let allSites = ERPService.getClientSites();
      if (allowedSiteIds && allowedSiteIds.length > 0) {
        allSites = allSites.filter((s) => allowedSiteIds.includes(s.id));
      }
      const allJobs = ERPService.getJobs();
      setSites(allSites);
      setJobs(allJobs);

      const initSiteId = (defaultSiteId && allSites.some((s) => s.id === defaultSiteId))
        ? defaultSiteId
        : (allSites[0]?.id || '');
      const siteJobs = initSiteId ? ERPService.getJobsForSite(initSiteId) : allJobs;
      const initJobId = (defaultJobId && siteJobs.some((j) => j.id === defaultJobId))
        ? defaultJobId
        : (siteJobs[0]?.id || allJobs[0]?.id || '');

      setForm((prev) => ({
        ...prev,
        siteId: initSiteId,
        jobId: initJobId,
        assignedSupervisor: allSites.find((s) => s.id === initSiteId)?.siteSupervisorName || 'Murugan P',
      }));
    }
  }, [isOpen, defaultSiteId, defaultJobId, allowedSiteIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteId) {
      showToast('Site Required', 'Please select a project site.', 'danger');
      return;
    }
    if (!form.jobId) {
      showToast('Job Required', 'Please select a project contract job.', 'danger');
      return;
    }
    if (!form.title.trim()) {
      showToast('Title Required', 'Please enter a task title.', 'danger');
      return;
    }
    const qty = parseFloat(form.targetQty) || 0;
    if (qty <= 0) {
      showToast('Target Qty Error', 'Please enter a target quantity > 0.', 'danger');
      return;
    }

    const currentSite = sites.find((s) => s.id === form.siteId);
    const currentJob = jobs.find((j) => j.id === form.jobId);

    ERPService.createTask({
      siteId: form.siteId,
      siteName: currentSite?.siteName,
      jobId: form.jobId,
      jobTitle: currentJob?.title,
      title: form.title.trim(),
      description: form.description.trim(),
      unit: form.unit,
      targetQty: qty,
      completedQty: 0,
      assignedSupervisor: form.assignedSupervisor.trim(),
      assignedWorkers: [form.assignedSupervisor.trim()],
      startDate: form.startDate,
      targetDate: form.targetDate,
      status: 'Pending',
    });

    showToast('Task Created', `Created task "${form.title}" for ${currentSite?.siteName}.`, 'success');
    if (onTaskCreated) onTaskCreated();
    onClose();
  };

  const currentSiteJobs = form.siteId ? ERPService.getJobsForSite(form.siteId) : jobs;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Site Execution Task" maxWidth="600px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              1. Project Site (Site-by-Site):
            </label>
            <select
              className="ui-select"
              value={form.siteId}
              onChange={(e) => {
                const sId = e.target.value;
                const sJobs = ERPService.getJobsForSite(sId);
                const sObj = sites.find((s) => s.id === sId);
                setForm({
                  ...form,
                  siteId: sId,
                  jobId: sJobs[0]?.id || form.jobId,
                  assignedSupervisor: sObj?.siteSupervisorName || form.assignedSupervisor,
                });
              }}
              style={{ width: '100%', height: 38, fontWeight: 700 }}
              required
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              2. Contract Job:
            </label>
            <select
              className="ui-select"
              value={form.jobId}
              onChange={(e) => setForm({ ...form, jobId: e.target.value })}
              style={{ width: '100%', height: 38, fontWeight: 700 }}
              required
            >
              {(currentSiteJobs.length > 0 ? currentSiteJobs : jobs).map((j) => (
                <option key={j.id} value={j.id}>
                  {j.id} - {j.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
            Task Title / Work Scope:
          </label>
          <input
            type="text"
            className="ui-input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Laying 1CX95 Cu Flex Cable on Cable Trays"
            style={{ width: '100%', height: 38 }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
            Description & Instructions:
          </label>
          <textarea
            className="ui-input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Scope of work, bays to install, tools and safety checks..."
            rows={2}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Target Quantity:
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              className="ui-input"
              value={form.targetQty}
              onChange={(e) => setForm({ ...form, targetQty: e.target.value })}
              style={{ width: '100%', height: 38, fontWeight: 700 }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Unit:
            </label>
            <input
              type="text"
              className="ui-input"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="e.g. Sets, Mtrs, Fans"
              style={{ width: '100%', height: 38 }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Assigned Supervisor:
            </label>
            <input
              type="text"
              className="ui-input"
              value={form.assignedSupervisor}
              onChange={(e) => setForm({ ...form, assignedSupervisor: e.target.value })}
              style={{ width: '100%', height: 38 }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Start Date:
            </label>
            <input
              type="date"
              className="ui-input"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              style={{ width: '100%', height: 38 }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Target Due Date:
            </label>
            <input
              type="date"
              className="ui-input"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              style={{ width: '100%', height: 38 }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<Plus size={16} />}>
            Create Site Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
