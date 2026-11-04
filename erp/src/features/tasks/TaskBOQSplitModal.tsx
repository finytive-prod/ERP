import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckSquare, 
  Building2, 
  Briefcase, 
  Calendar, 
  Boxes, 
  Check, 
  ChevronDown, 
  ChevronRight,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { getRenaultNissanTemplate } from '../../services/boqTemplates';
import { ClientSite, Job, BOQSection, SiteTask } from '../../types';
import { Modal, Button, useToast } from '../../components/ui';

interface TaskBOQSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSiteId?: string;
  defaultJobId?: string;
  onTasksCreated?: () => void;
}

export const TaskBOQSplitModal: React.FC<TaskBOQSplitModalProps> = ({
  isOpen,
  onClose,
  defaultSiteId,
  defaultJobId,
  onTasksCreated,
}) => {
  const { showToast } = useToast();
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  const [availableSections, setAvailableSections] = useState<BOQSection[]>([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>([]);
  const [supervisorName, setSupervisorName] = useState<string>('Murugan P');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (isOpen) {
      const allSites = ERPService.getClientSites();
      const allJobs = ERPService.getJobs();
      setSites(allSites);
      setJobs(allJobs);

      const initSiteId = defaultSiteId || (allSites[0]?.id || '');
      setSelectedSiteId(initSiteId);

      const siteJobs = initSiteId ? ERPService.getJobsForSite(initSiteId) : allJobs;
      const initJobId = defaultJobId || (siteJobs[0]?.id || allJobs[0]?.id || '');
      setSelectedJobId(initJobId);
    }
  }, [isOpen, defaultSiteId, defaultJobId]);

  // When job or site changes, load BOQ sections
  useEffect(() => {
    if (!isOpen) return;

    let sections: BOQSection[] = [];
    if (selectedJobId) {
      const boqs = ERPService.getBOQsForJob(selectedJobId);
      const jobBoq = boqs.find((b) => b.sections && b.sections.length > 0);
      if (jobBoq && jobBoq.sections && jobBoq.sections.length > 0) {
        sections = jobBoq.sections;
      }
    }

    // If job has no custom sections, load reference Renault Nissan BOQ sections (NPC/26-27/Q9516 from image copy.png)
    if (sections.length === 0) {
      sections = getRenaultNissanTemplate(true);
    }

    setAvailableSections(sections);
    // Select all sections by default
    setSelectedSectionIds(sections.map((s) => s.id));
    setExpandedSectionIds([sections[0]?.id || '']);
  }, [selectedJobId, selectedSiteId, isOpen]);

  const toggleSectionSelect = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const toggleExpand = (sectionId: string) => {
    setExpandedSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSelectAll = () => {
    setSelectedSectionIds(availableSections.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSectionIds([]);
  };

  const handleSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      showToast('Site Required', 'Please select a project site.', 'danger');
      return;
    }
    if (!selectedJobId) {
      showToast('Job Required', 'Please select a job project.', 'danger');
      return;
    }
    if (selectedSectionIds.length === 0) {
      showToast('Sections Required', 'Please select at least one BOQ section to split into tasks.', 'danger');
      return;
    }

    const currentSite = sites.find((s) => s.id === selectedSiteId);
    const currentJob = jobs.find((j) => j.id === selectedJobId);

    const sectionsToSplit = availableSections.filter((s) => selectedSectionIds.includes(s.id));
    let createdCount = 0;

    sectionsToSplit.forEach((section, idx) => {
      // Parse quantity and unit from section title or items (e.g. "PSW Transformers - 16 Nos" -> 16 Nos)
      const qtyMatch = section.title.match(/(\d+)\s*(Nos|No's|Sets|Units|Fans)/i);
      const parsedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : section.items.length || 1;
      const parsedUnit = qtyMatch ? qtyMatch[2] : 'Units';

      // Map line items to allocated materials for this task
      const allocatedMaterials = section.items.map((line, lineIdx) => ({
        id: `tam-gen-${Date.now()}-${idx}-${lineIdx}`,
        itemName: line.description,
        specification: `BOQ Item #${line.sNo || lineIdx + 1}`,
        unit: line.unit,
        allocatedQty: line.qty,
        consumedQty: 0,
        sourceType: 'JobBOQ' as const,
        allocatedAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      }));

      // Create SiteTask
      ERPService.createTask({
        jobId: selectedJobId,
        jobTitle: currentJob?.title || 'Project Contract Work',
        siteId: selectedSiteId,
        siteName: currentSite?.siteName || 'Project Site',
        boqSectionId: section.id,
        boqSectionTitle: section.title,
        title: `${section.title} - Execution & Erection`,
        description: `Split from BOQ: ${section.title}. Includes supply, cable laying, tray erection, and testing.`,
        assignedSupervisor: supervisorName || currentSite?.siteSupervisorName || 'Site Supervisor',
        assignedWorkers: [
          currentSite?.siteEngineerName || 'Vignesh S',
          supervisorName || 'Murugan P',
        ],
        unit: parsedUnit,
        targetQty: parsedQty,
        completedQty: 0,
        status: 'Pending',
        startDate,
        targetDate,
        allowedMaterials: section.items.slice(0, 5).map((l) => ({
          itemId: l.id,
          itemName: l.description,
          unit: l.unit,
          allowedPerUnit: Math.round((l.qty / Math.max(1, parsedQty)) * 100) / 100,
        })),
        allocatedMaterials,
        memberAssignments: [
          {
            id: `tma-init-${Date.now()}-${idx}`,
            memberId: 'sup-01',
            memberName: supervisorName || 'Murugan P',
            role: 'Supervisor',
            assignedDate: startDate,
            shiftOrHours: 'Full Day (8 hrs)',
            status: 'Scheduled',
            notes: `Supervising initial setup for ${section.title}`,
          },
        ],
      });
      createdCount++;
    });

    showToast(
      'Tasks Created Successfully',
      `Split ${createdCount} site execution tasks from BOQ for "${currentSite?.siteName}".`,
      'success'
    );
    if (onTasksCreated) onTasksCreated();
    onClose();
  };

  const filteredJobs = selectedSiteId ? ERPService.getJobsForSite(selectedSiteId) : jobs;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Split Site Tasks from BOQ (Reference: Offer NPC/26-27/Q9516)"
      maxWidth="840px"
    >
      <form onSubmit={handleSplitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Banner */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            fontSize: '0.86rem',
            color: '#1e40af',
          }}
        >
          <Layers size={22} style={{ flexShrink: 0, marginTop: 2, color: '#2563eb' }} />
          <div>
            <div style={{ fontWeight: 800 }}>Automated BOQ-to-Site Task Generation</div>
            <div style={{ marginTop: 2, color: '#3b82f6', fontSize: '0.8rem' }}>
              Select a project site and contract job. This will split major BOQ packages (like <strong>PSW Transformers</strong>, <strong>Assembly Jig</strong>, <strong>Mancooler Fans</strong> from reference doc) into site execution tasks with materials and supervisor assignments.
            </div>
          </div>
        </div>

        {/* Site and Job selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              1. Target Project Site:
            </label>
            <select
              className="ui-select"
              value={selectedSiteId}
              onChange={(e) => {
                const sId = e.target.value;
                setSelectedSiteId(sId);
                const sJobs = ERPService.getJobsForSite(sId);
                if (sJobs.length > 0) setSelectedJobId(sJobs[0].id);
              }}
              style={{ width: '100%', height: 40, fontWeight: 700 }}
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              2. Contract Job:
            </label>
            <select
              className="ui-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              style={{ width: '100%', height: 40, fontWeight: 700 }}
              required
            >
              {(filteredJobs.length > 0 ? filteredJobs : jobs).map((j) => (
                <option key={j.id} value={j.id}>
                  {j.id} - {j.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Supervisor and Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Site Supervisor:
            </label>
            <input
              type="text"
              className="ui-input"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="e.g. Murugan P"
              style={{ width: '100%', height: 40 }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Start Date:
            </label>
            <input
              type="date"
              className="ui-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', height: 40 }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Target Due Date:
            </label>
            <input
              type="date"
              className="ui-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ width: '100%', height: 40 }}
              required
            />
          </div>
        </div>

        {/* BOQ Sections List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
              Select BOQ Work Packages to Split ({selectedSectionIds.length} of {availableSections.length} selected):
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{ fontSize: '0.78rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Select All
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{ fontSize: '0.78rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Clear All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
            {availableSections.map((sec) => {
              const isSelected = selectedSectionIds.includes(sec.id);
              const isExpanded = expandedSectionIds.includes(sec.id);

              return (
                <div
                  key={sec.id}
                  style={{
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                    borderRadius: 8,
                    backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleSectionSelect(sec.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSectionSelect(sec.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                          {sec.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                          {sec.items.length} line items / materials included
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 12,
                          backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
                          color: isSelected ? '#1e40af' : '#64748b',
                          fontWeight: 700,
                        }}
                      >
                        {sec.items.length} Items
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(sec.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items Preview */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderTop: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Materials Allocated to this Task:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {sec.items.map((it, idx) => (
                          <div
                            key={it.id || idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '4px 6px',
                              backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
                              borderRadius: 4,
                            }}
                          >
                            <span style={{ color: '#334155' }}>
                              {it.sNo || idx + 1}. {it.description}
                            </span>
                            <span style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', marginLeft: 12 }}>
                              {it.qty} {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={<CheckSquare size={16} />}
            disabled={selectedSectionIds.length === 0}
          >
            Create {selectedSectionIds.length} Site Tasks from BOQ
          </Button>
        </div>
      </form>
    </Modal>
  );
};
