import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Layers, 
  Sparkles, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  DollarSign,
  Clock,
  ArrowDownCircle,
  RotateCcw,
  Info,
  Package
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { BOQVersion, BOQSection, BOQLine, MeasurementUnit, Job, Vendor, ItemMaster, BOQComponent, AVAILABLE_UNITS } from '../../types';
import { Modal, Button, Badge, useToast, BOQQuantityInput } from '../../components/ui';
import { getRenaultNissanTemplate, getInteriorLightingTemplate } from '../../services/boqTemplates';
import { PreBOQBreakdownModal } from './PreBOQBreakdownModal';

interface BOQBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  initialBOQ?: BOQVersion;
  onSaved: (boq: BOQVersion) => void;
}

export const BOQBuilderModal: React.FC<BOQBuilderModalProps> = ({
  isOpen,
  onClose,
  job,
  initialBOQ,
  onSaved,
}) => {
  const { showToast } = useToast();
  const currentUser = ERPService.getCurrentUser();
  const vendors = ERPService.getVendors();
  const itemsMaster = ERPService.getItems();

  // Multi-BOQ package identification
  const [boqTitle, setBoqTitle] = useState('');
  const [packageCode, setPackageCode] = useState('');
  const [boqType, setBoqType] = useState<BOQVersion['boqType']>('Original Offer');
  const [versionLabel, setVersionLabel] = useState('v1');

  // Workflow Step: 'items' (Step 1: Item & Qty Takeoff, Rates optional/pending) vs 'pricing' (Step 2: Admin Rates & Quoting)
  const [workflowStep, setWorkflowStep] = useState<'items' | 'pricing'>('items');

  const [sections, setSections] = useState<BOQSection[]>([]);
  const [revisionReason, setRevisionReason] = useState('');
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Pre-BOQ Material Breakdown (BOM) modal state
  const [breakdownTarget, setBreakdownTarget] = useState<{ sIdx: number; lIdx: number } | null>(null);

  const handleSaveBreakdownComponents = (comps: BOQComponent[], applyRateToParent?: boolean) => {
    if (!breakdownTarget) return;
    const copy = [...sections];
    const targetItem = copy[breakdownTarget.sIdx].items[breakdownTarget.lIdx];
    const parentQty = targetItem.qty || 1;
    targetItem.components = comps.map((c) => {
      const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : 1;
      const totalQty = Math.round(qtyPerUnit * parentQty * 100) / 100;
      const totalCost = Math.round(totalQty * (Number(c.unitCost) || 0) * 100) / 100;
      return {
        ...c,
        qtyPerUnit,
        totalQty,
        totalCost,
      };
    });
    if (applyRateToParent) {
      const totalCost = targetItem.components.reduce((sum, c) => sum + (c.totalCost || ((c.totalQty || 0) * (c.unitCost || 0))), 0);
      const unitRate = Math.round((totalCost / parentQty) * 100) / 100;
      targetItem.supplyRate = unitRate;
    }
    setSections(recalculate(copy));
    setBreakdownTarget(null);
  };

  // Initialize form from initialBOQ or fresh package
  useEffect(() => {
    if (initialBOQ) {
      setSections(JSON.parse(JSON.stringify(initialBOQ.sections)));
      setRevisionReason(initialBOQ.revisionReason || '');
      setBoqTitle(initialBOQ.title || `BOQ Package for ${job.id}`);
      setPackageCode(initialBOQ.packageCode || `PKG-${String(initialBOQ.versionNumber || 1).padStart(2, '0')}`);
      setBoqType(initialBOQ.boqType || 'Original Offer');
      setVersionLabel(initialBOQ.versionLabel || `v${initialBOQ.versionNumber || 1}`);
      if (initialBOQ.status === 'Rates Pending') {
        setWorkflowStep('pricing');
      } else {
        setWorkflowStep('pricing');
      }
    } else {
      const existingBoqs = ERPService.getBOQsForJob(job.id);
      const nextNum = existingBoqs.length + 1;
      setBoqTitle(`Package ${nextNum}: Electrical Works`);
      setPackageCode(`PKG-${String(nextNum).padStart(2, '0')}`);
      setBoqType('Original Offer');
      setVersionLabel('v1');
      setWorkflowStep('items');

      // Start with a clean blank BOQ structure (no pre-filled dummy items or quantities)
      setSections([
        {
          id: `sec-${Date.now()}`,
          sectionNumber: '1.00',
          title: 'CIRCUIT MAINS / POWER WIRING',
          sectionSupplyTotal: 0,
          sectionErectionTotal: 0,
          sectionGrandTotal: 0,
          items: [
            {
              id: `line-${Date.now()}-1`,
              sNo: '1.00',
              description: '',
              qty: 0,
              unit: 'Nos',
              supplyRate: 0,
              erectionRate: 0,
              supplyAmount: 0,
              erectionAmount: 0,
              totalAmount: 0,
            },
          ],
        },
      ]);
      setRevisionReason('Initial Bill of Quantities Takeoff');
    }
  }, [initialBOQ, isOpen, job.id]);

  // Recalculate section & grand totals
  const recalculate = (secs: BOQSection[]) => {
    return secs.map((sec) => {
      let secSupply = 0;
      let secErection = 0;
      const updatedItems = sec.items.map((item) => {
        const pQty = Number(item.qty) || 0;
        const supplyAmt = pQty * (item.supplyRate || 0);
        const erectionAmt = pQty * (item.erectionRate || 0);
        secSupply += supplyAmt;
        secErection += erectionAmt;

        // Synchronize child components totalQty and totalCost
        let syncedComponents = item.components;
        if (item.components && item.components.length > 0) {
          syncedComponents = item.components.map((c) => {
            const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : 1;
            const totalQty = Math.round(qtyPerUnit * pQty * 100) / 100;
            const totalCost = Math.round(totalQty * (Number(c.unitCost) || 0) * 100) / 100;
            return {
              ...c,
              qtyPerUnit,
              totalQty,
              totalCost,
            };
          });
        }

        return {
          ...item,
          components: syncedComponents,
          supplyAmount: Math.round(supplyAmt * 100) / 100,
          erectionAmount: Math.round(erectionAmt * 100) / 100,
          totalAmount: Math.round((supplyAmt + erectionAmt) * 100) / 100,
        };
      });
      return {
        ...sec,
        items: updatedItems,
        sectionSupplyTotal: Math.round(secSupply * 100) / 100,
        sectionErectionTotal: Math.round(secErection * 100) / 100,
        sectionGrandTotal: Math.round((secSupply + secErection) * 100) / 100,
      };
    });
  };

  // Add Section
  const handleAddSection = () => {
    const nextNum = sections.length + 1;
    const newSection: BOQSection = {
      id: `sec-${Date.now()}`,
      sectionNumber: `${nextNum}.00`,
      title: `NEW ELECTRICAL SECTION ${nextNum}.00`,
      sectionSupplyTotal: 0,
      sectionErectionTotal: 0,
      sectionGrandTotal: 0,
      items: [
        {
          id: `line-${Date.now()}-1`,
          sNo: '1.00',
          description: '',
          qty: 1,
          unit: 'Mtrs',
          supplyRate: 0,
          erectionRate: 0,
          supplyAmount: 0,
          erectionAmount: 0,
          totalAmount: 0,
        },
      ],
    };
    setSections(recalculate([...sections, newSection]));
  };

  // Remove Section
  const handleRemoveSection = (sectionIndex: number) => {
    if (sections.length <= 1) {
      showToast('Action Blocked', 'BOQ must have at least one section.', 'warning');
      return;
    }
    const updated = sections.filter((_, idx) => idx !== sectionIndex);
    setSections(recalculate(updated));
  };

  // Update Section Header
  const handleSectionHeaderChange = (sectionIndex: number, field: 'sectionNumber' | 'title', val: string) => {
    const copy = [...sections];
    copy[sectionIndex][field] = val;
    setSections(copy);
  };

  // Add Item inside Section
  const handleAddItem = (sectionIndex: number, afterLineIndex?: number) => {
    const copy = [...sections];
    const sec = copy[sectionIndex];
    const nextLineNum = sec.items.length + 1;
    const newLine: BOQLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sNo: `${nextLineNum}.00`,
      description: '',
      qty: 1,
      unit: 'Nos',
      supplyRate: 0,
      erectionRate: 0,
      supplyAmount: 0,
      erectionAmount: 0,
      totalAmount: 0,
    };

    if (afterLineIndex !== undefined && afterLineIndex >= 0) {
      sec.items.splice(afterLineIndex + 1, 0, newLine);
    } else {
      sec.items.push(newLine);
    }
    setSections(recalculate(copy));
  };

  // Remove Item from Section
  const handleRemoveItem = (sectionIndex: number, lineIndex: number) => {
    const copy = [...sections];
    if (copy[sectionIndex].items.length <= 1) {
      showToast('Action Blocked', 'Each section must have at least one line item. Delete the whole section instead.', 'warning');
      return;
    }
    copy[sectionIndex].items = copy[sectionIndex].items.filter((_, idx) => idx !== lineIndex);
    setSections(recalculate(copy));
  };

  // Update Item Field
  const handleItemChange = (sectionIndex: number, lineIndex: number, field: keyof BOQLine, val: any) => {
    const copy = [...sections];
    const line = copy[sectionIndex].items[lineIndex];

    if (field === 'vendorId') {
      line.vendorId = val;
      const v = vendors.find((x) => x.id === val);
      line.vendorName = v ? v.name : '';
    } else if (field === 'qty') {
      const newQty = typeof val === 'number' ? val : (parseFloat(val) || 0);
      line.qty = newQty;
      // CRITICAL: Automatically scale all child constituent BOM materials (e.g. 2mm wire 2m * 560 = 1,120m)
      if (line.components && line.components.length > 0) {
        line.components = line.components.map((c) => {
          const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : 1;
          const totalQty = Math.round(qtyPerUnit * newQty * 100) / 100;
          const totalCost = Math.round(totalQty * (Number(c.unitCost) || 0) * 100) / 100;
          return {
            ...c,
            qtyPerUnit,
            totalQty,
            totalCost,
          };
        });
      }
    } else if (field === 'supplyRate' || field === 'erectionRate') {
      (line as any)[field] = parseFloat(val) || 0;
    } else {
      (line as any)[field] = val;
    }

    setSections(recalculate(copy));
  };

  /**
   * Auto-Selection via SL.NO (1 to 85 from Stock details1 - Copy.xls)
   * Automatically populates description and unit, but DOES NOT hardcode price.
   */
  const handleSelectBySlNo = (sectionIndex: number, lineIndex: number, slNoVal: string) => {
    const num = parseInt(slNoVal, 10);
    const copy = [...sections];
    const line = copy[sectionIndex].items[lineIndex];

    if (isNaN(num)) {
      line.slNoRef = undefined;
      setSections(recalculate(copy));
      return;
    }

    line.slNoRef = num;
    const itm = itemsMaster.find((x) => x.slNo === num);
    if (itm) {
      line.itemId = itm.id;
      line.description = itm.name;
      line.unit = itm.unit;
      // Price is separate from product definition - preserve existing or default to 0
    }
    setSections(recalculate(copy));
  };

  /**
   * Auto-Selection via Item Master Dropdown
   */
  const handleSelectFromItemMaster = (sectionIndex: number, lineIndex: number, itemId: string) => {
    const itm = itemsMaster.find((x) => x.id === itemId);
    if (!itm) return;
    const copy = [...sections];
    const line = copy[sectionIndex].items[lineIndex];
    line.itemId = itm.id;
    line.slNoRef = itm.slNo;
    line.description = itm.name;
    line.unit = itm.unit;
    if (itm.defaultVendorId) {
      line.vendorId = itm.defaultVendorId;
      line.vendorName = itm.defaultVendorName;
    }
    setSections(recalculate(copy));
  };

  // Load Photo Quotation (Commercial Interior Power & Lighting from uploaded photo)
  const handleLoadPhotoQuotation = (withRates: boolean) => {
    const tSecs = getInteriorLightingTemplate(withRates);
    setSections(recalculate(tSecs));
    setBoqTitle('Commercial Interior Power, Lighting & PVC Conduits');
    setPackageCode('PKG-INT');
    setBoqType('Original Offer');
    setRevisionReason('Loaded from official quotation sheet (Circuit Mains, Light Points, Conduits, Junction Boxes, Fittings)');
    if (!withRates) {
      setWorkflowStep('items');
    } else {
      setWorkflowStep('pricing');
    }
    showToast('Quotation Loaded', `Populated all 5 sections matching the printed quotation sheet (${withRates ? 'Rates Quoted: ₹4,59,790' : 'Step 1: Rates Pending'}).`, 'success');
  };

  // Load Renault Nissan Industrial Offer (image copy.png)
  const handleLoadRenaultNissan = (withRates: boolean) => {
    const tSecs = getRenaultNissanTemplate(withRates);
    setSections(recalculate(tSecs));
    setBoqTitle('Renault Nissan Substation Electrical Works');
    setPackageCode('NPC/26-27/Q9516');
    setBoqType('Revised Offer');
    setRevisionReason('Loaded from Renault Nissan industrial quotation (Transformers, Assembly Jig, Mancooler Fans)');
    if (!withRates) {
      setWorkflowStep('items');
    } else {
      setWorkflowStep('pricing');
    }
    showToast('Quotation Loaded', `Populated Renault Nissan 3 sections (${withRates ? 'Rates Quoted' : 'Step 1: Rates Pending'}).`, 'success');
  };

  // Blank clean BOQ
  const handleResetBlank = () => {
    if (window.confirm('Reset this BOQ to a single blank section?')) {
      setSections([
        {
          id: `sec-${Date.now()}`,
          sectionNumber: '1.00',
          title: 'CIRCUIT MAINS / POWER WIRING',
          sectionSupplyTotal: 0,
          sectionErectionTotal: 0,
          sectionGrandTotal: 0,
          items: [
            {
              id: `line-${Date.now()}-1`,
              sNo: '1.00',
              description: '',
              qty: 0,
              unit: 'Nos',
              supplyRate: 0,
              erectionRate: 0,
              supplyAmount: 0,
              erectionAmount: 0,
              totalAmount: 0,
            },
          ],
        },
      ]);
      setBoqTitle(`BOQ Package for ${job.id}`);
      setPackageCode('PKG-01');
      setWorkflowStep('items');
      showToast('Blank BOQ Ready', 'Created single empty section for typing.', 'info');
    }
  };

  // Parse and import CSV
  const handleProcessCsvImport = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      showToast('Invalid CSV', 'CSV must have header and at least 1 data row.', 'danger');
      return;
    }

    const newSectionsMap: { [secName: string]: BOQLine[] } = {};
    const dataRows = lines.slice(1);

    dataRows.forEach((row, idx) => {
      const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, '').trim());
      
      const secTitle = cleanCols[0] || '1.00 CIRCUIT MAINS';
      const sNo = cleanCols[1] || String(idx + 1);
      const desc = cleanCols[2] || 'Electrical Line Item';
      const qty = parseFloat(cleanCols[3]) || 1;
      const unit = (cleanCols[4] || 'Nos') as MeasurementUnit;
      const supplyRate = parseFloat(cleanCols[5]) || 0;
      const erectionRate = parseFloat(cleanCols[6]) || 0;
      const vendorName = cleanCols[10] || cleanCols[7] || '';

      if (!newSectionsMap[secTitle]) {
        newSectionsMap[secTitle] = [];
      }

      const matchedItem = itemsMaster.find(i => i.name.toLowerCase() === desc.toLowerCase());

      newSectionsMap[secTitle].push({
        id: `line-${Date.now()}-${idx}`,
        sNo,
        slNoRef: matchedItem?.slNo,
        itemId: matchedItem?.id,
        description: desc,
        qty,
        unit,
        supplyRate,
        erectionRate,
        supplyAmount: qty * supplyRate,
        erectionAmount: qty * erectionRate,
        totalAmount: qty * supplyRate + qty * erectionRate,
        vendorName,
      });
    });

    const parsedSections: BOQSection[] = Object.keys(newSectionsMap).map((secTitle, sIdx) => ({
      id: `sec-${Date.now()}-${sIdx}`,
      sectionNumber: `${sIdx + 1}.00`,
      title: secTitle,
      items: newSectionsMap[secTitle],
      sectionSupplyTotal: 0,
      sectionErectionTotal: 0,
      sectionGrandTotal: 0,
    }));

    setSections(recalculate(parsedSections));
    setIsCsvImportOpen(false);
    setCsvText('');
    showToast('CSV Imported', `Loaded ${parsedSections.length} sections from CSV.`, 'success');
  };

  // Grand Totals Calculation
  const grandSupply = sections.reduce((sum, s) => sum + s.sectionSupplyTotal, 0);
  const grandErection = sections.reduce((sum, s) => sum + s.sectionErectionTotal, 0);
  const grandTotal = grandSupply + grandErection;

  // Total lines across all sections
  const totalLineCount = sections.reduce((acc, s) => acc + s.items.length, 0);

  /**
   * Save Step 1: Save as Draft (Rates Pending)
   */
  const handleSaveDraftRatesPending = () => {
    if (sections.length === 0 || totalLineCount === 0) {
      showToast('Error', 'Please add at least one section with line items.', 'danger');
      return;
    }

    const existingBoqs = ERPService.getBOQsForJob(job.id);
    const verNum = initialBOQ ? initialBOQ.versionNumber : existingBoqs.length + 1;
    const boqId = initialBOQ ? initialBOQ.id : `boq-${job.id.toLowerCase()}-pkg${Date.now().toString().slice(-4)}`;

    const newVersion: BOQVersion = {
      id: boqId,
      jobId: job.id,
      title: boqTitle.trim() || `BOQ Package for ${job.id}`,
      packageCode: packageCode.trim() || `PKG-${String(verNum).padStart(2, '0')}`,
      boqType,
      versionNumber: verNum,
      versionLabel: versionLabel || `v${verNum}`,
      isCurrent: true,
      status: 'Rates Pending',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      revisionReason: revisionReason.trim() || 'Items and quantities drafted; Rates pending Admin entry',
      sections: recalculate(sections),
      totalSupplyAmount: grandSupply,
      totalErectionAmount: grandErection,
      grandTotal,
    };

    const saved = ERPService.saveBOQVersion(newVersion, newVersion.revisionReason!);
    showToast('BOQ Saved (Rates Pending)', `Saved "${saved.title}". Ready for Admin pricing.`, 'info');
    onSaved(saved);
    onClose();
  };

  /**
   * Save Step 2: Finalize & Approve BOQ with Rates
   */
  const handleSaveFinalBOQ = () => {
    if (sections.length === 0 || totalLineCount === 0) {
      showToast('Error', 'Please add at least one section with line items.', 'danger');
      return;
    }

    if (!revisionReason.trim()) {
      showToast('Reason Required', 'Please enter a clear explanation for this BOQ creation/revision.', 'danger');
      return;
    }

    const existingBoqs = ERPService.getBOQsForJob(job.id);
    const verNum = initialBOQ ? (initialBOQ.status === 'Rates Pending' ? initialBOQ.versionNumber : initialBOQ.versionNumber + 1) : existingBoqs.length + 1;
    const boqId = initialBOQ ? initialBOQ.id : `boq-${job.id.toLowerCase()}-pkg${Date.now().toString().slice(-4)}`;

    const newVersion: BOQVersion = {
      id: boqId,
      jobId: job.id,
      title: boqTitle.trim() || `BOQ Package for ${job.id}`,
      packageCode: packageCode.trim() || `PKG-${String(verNum).padStart(2, '0')}`,
      boqType,
      versionNumber: verNum,
      versionLabel: versionLabel || `v${verNum}`,
      isCurrent: true,
      status: 'BOQ Prepared',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      revisionReason: revisionReason.trim(),
      sections: recalculate(sections),
      totalSupplyAmount: grandSupply,
      totalErectionAmount: grandErection,
      grandTotal,
    };

    const saved = ERPService.saveBOQVersion(newVersion, revisionReason.trim());
    showToast('BOQ Finalized & Published', `BOQ "${saved.title}" finalized with Grand Total ₹${grandTotal.toLocaleString('en-IN')}.`, 'success');
    onSaved(saved);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ui-modal-backdrop" onClick={onClose}>
      <div
        className="ui-modal-content"
        style={{
          maxWidth: '1360px',
          width: '98vw',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileSpreadsheet size={24} color="#0f766e" />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {initialBOQ ? `Edit BOQ: ${initialBOQ.title || initialBOQ.versionLabel}` : `Bill of Quantities (BOQ) Quotation Sheet`}
              </span>
              <Badge status={job.id} showIcon={false} variant="primary" />
              <Badge
                status={workflowStep === 'items' ? 'Step 1: Quantity Takeoff (Rates Pending)' : 'Step 2: Admin Rates Quoting'}
                variant={workflowStep === 'items' ? 'info' : 'warning'}
              />
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
              Contract Quotation Format with Separate <strong>Supply</strong> and <strong>Erection</strong> Rates. Enter <strong>Stock # (1-85)</strong> to auto-fill Description & UOM without pricing.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontSize: '1.4rem',
                padding: '4px 10px',
                color: '#64748b',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                lineHeight: 1,
              }}
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toolbar: Mode switcher, Template loaders, Actions */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Step 1 vs Step 2 Switcher */}
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: 6, padding: 3 }}>
            <button
              type="button"
              onClick={() => setWorkflowStep('items')}
              style={{
                padding: '6px 14px',
                borderRadius: 5,
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: workflowStep === 'items' ? '#ffffff' : 'transparent',
                color: workflowStep === 'items' ? '#0f766e' : '#475569',
                boxShadow: workflowStep === 'items' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Layers size={14} />
              Step 1: Takeoff (Items & Qty Only)
            </button>
            <button
              type="button"
              onClick={() => setWorkflowStep('pricing')}
              style={{
                padding: '6px 14px',
                borderRadius: 5,
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: workflowStep === 'pricing' ? '#d97706' : 'transparent',
                color: workflowStep === 'pricing' ? '#ffffff' : '#475569',
                boxShadow: workflowStep === 'pricing' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <DollarSign size={14} />
              Step 2: Admin Rates Quoting
            </button>
          </div>

          {/* Quick Template Buttons & Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              size="sm"
              variant="secondary"
              icon={<Sparkles size={14} color="#0f766e" />}
              onClick={() => handleLoadPhotoQuotation(workflowStep === 'pricing')}
              title="Loads exact 5 sections from uploaded photo (Circuit Mains, Light Points, PVC Conduit, Junction Boxes, Fittings)"
            >
              📋 Load Photo Quotation (Sample Sheet)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Sparkles size={14} color="#2563eb" />}
              onClick={() => handleLoadRenaultNissan(workflowStep === 'pricing')}
              title="Loads 3 industrial sections: PSW Transformers, Assembly Jig, Mancooler Fans"
            >
              🚗 Load Renault Nissan Offer
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<RotateCcw size={14} />}
              onClick={handleResetBlank}
              title="Start with single blank row"
            >
              Blank Sheet
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Upload size={14} />}
              onClick={() => setIsCsvImportOpen(true)}
            >
              CSV
            </Button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* BOQ Header Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              padding: '10px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
            }}
          >
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
                Package Title *
              </label>
              <input
                type="text"
                value={boqTitle}
                onChange={(e) => setBoqTitle(e.target.value)}
                placeholder="e.g. Commercial Interior Power & Lighting"
                style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #94a3b8', fontSize: '0.86rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
                Package / Reference Code
              </label>
              <input
                type="text"
                value={packageCode}
                onChange={(e) => setPackageCode(e.target.value)}
                placeholder="e.g. PKG-INT, NPC/26-27/Q9516"
                style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #94a3b8', fontSize: '0.86rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
                BOQ Classification
              </label>
              <select
                value={boqType}
                onChange={(e) => setBoqType(e.target.value as any)}
                style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #94a3b8', fontSize: '0.86rem' }}
              >
                <option value="Original Offer">Original Offer (Tender / Initial)</option>
                <option value="Revised Offer">Revised Offer (Post Negotiation)</option>
                <option value="Package Sub-BOQ">Package Sub-BOQ (HV, LV, Interior)</option>
                <option value="Variation / Extra Works">Variation / Extra Works (Change Order)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
                Version
              </label>
              <input
                type="text"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="v1"
                style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #94a3b8', fontSize: '0.86rem', textAlign: 'center', fontWeight: 800 }}
              />
            </div>
          </div>

          {/* Workflow Step Notification Banner */}
          {workflowStep === 'items' ? (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.84rem',
                color: '#1e40af',
              }}
            >
              <Info size={16} />
              <span>
                <strong>Takeoff Mode Active:</strong> Enter Section Titles, Serial Numbers (S.N), Stock # (1-85), Descriptions, Quantities and UOM. Rates default to 0 and can be saved as <strong>Rates Pending</strong>.
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.84rem',
                color: '#92400e',
              }}
            >
              <DollarSign size={16} />
              <span>
                <strong>Admin Rates Quoting Mode:</strong> Enter <strong>Supply Rate (₹)</strong> and <strong>Erection Rate (₹)</strong>. Amounts and totals will calculate in real time.
              </span>
            </div>
          )}

          {/* Authentic BOQ Quotation Spreadsheet Table */}
          <div className="boq-sheet-container">
            <table className="boq-sheet-table">
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: 60 }}>S. N</th>
                  <th rowSpan={2} style={{ width: 75 }} title="Excel SL.NO from Stock details1 - Copy.xls (1-85). Auto-fills description and unit.">
                    Stock #
                  </th>
                  <th rowSpan={2} style={{ minWidth: 320, textAlign: 'left', paddingLeft: 12 }}>
                    Description of Electrical Works / Specification
                  </th>
                  <th rowSpan={2} style={{ width: 75 }}>Qty</th>
                  <th rowSpan={2} style={{ width: 75 }}>Uom</th>
                  <th colSpan={2} style={{ backgroundColor: workflowStep === 'pricing' ? '#fef3c7' : '#f1f5f9' }}>
                    Rate (₹)
                  </th>
                  <th colSpan={2}>Amount (₹)</th>
                  <th rowSpan={2} style={{ width: 110 }}>Line Total (₹)</th>
                  <th rowSpan={2} style={{ width: 125 }}>Vendor</th>
                  <th rowSpan={2} style={{ width: 65 }}>Actions</th>
                </tr>
                <tr>
                  <th className="th-sub" style={{ width: 95, backgroundColor: workflowStep === 'pricing' ? '#fef3c7' : '#f8fafc' }}>
                    Supply
                  </th>
                  <th className="th-sub" style={{ width: 95, backgroundColor: workflowStep === 'pricing' ? '#fef3c7' : '#f8fafc' }}>
                    Erection
                  </th>
                  <th className="th-sub" style={{ width: 100 }}>Supply</th>
                  <th className="th-sub" style={{ width: 100 }}>Erection</th>
                </tr>
              </thead>

              <tbody>
                {sections.map((section, sIdx) => (
                  <React.Fragment key={section.id}>
                    {/* Full-width Section Title Banner Row (Matches the printed sheet section dividers) */}
                    <tr className="section-row">
                      <td colSpan={12} style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', borderTop: '2px solid #64748b', borderBottom: '2px solid #64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <input
                              type="text"
                              value={section.sectionNumber}
                              onChange={(e) => handleSectionHeaderChange(sIdx, 'sectionNumber', e.target.value)}
                              placeholder="1.00"
                              style={{
                                width: 70,
                                height: 30,
                                fontWeight: 800,
                                textAlign: 'center',
                                backgroundColor: '#ffffff',
                                border: '1px solid #94a3b8',
                                borderRadius: 4,
                                color: '#0f766e',
                              }}
                            />
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleSectionHeaderChange(sIdx, 'title', e.target.value)}
                              placeholder="SECTION TITLE (e.g. CIRCUIT MAINS / POWER WIRING, LIGHT POINT WIRING)..."
                              style={{
                                flex: 1,
                                height: 30,
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                backgroundColor: '#ffffff',
                                border: '1px solid #94a3b8',
                                borderRadius: 4,
                                color: '#0f172a',
                                padding: '0 10px',
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f766e' }}>
                              Section Total: ₹{section.sectionGrandTotal.toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddItem(sIdx)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: 4,
                                backgroundColor: '#0f766e',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Plus size={13} /> Add Item
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(sIdx)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.78rem',
                                borderRadius: 4,
                                backgroundColor: 'transparent',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                cursor: 'pointer',
                              }}
                              title="Delete this entire section"
                            >
                              ✕ Section
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Section Line Items */}
                    {section.items.map((line, lIdx) => (
                      <tr key={line.id} className="item-row">
                        {/* S. N (Serial Number / BOQ Line ID e.g. 1.00) */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <input
                              type="text"
                              value={line.sNo}
                              onChange={(e) => handleItemChange(sIdx, lIdx, 'sNo', e.target.value)}
                              style={{ textAlign: 'center', fontWeight: 700, width: '100%', minWidth: 46 }}
                              placeholder="1.00"
                              title="BOQ ID / Item Serial"
                            />
                            <button
                              type="button"
                              onClick={() => setBreakdownTarget({ sIdx, lIdx })}
                              style={{
                                padding: '2px 5px',
                                fontSize: '0.67rem',
                                fontWeight: 800,
                                backgroundColor: line.components && line.components.length > 0 ? '#f0fdf4' : '#eff6ff',
                                color: line.components && line.components.length > 0 ? '#166534' : '#1d4ed8',
                                border: line.components && line.components.length > 0 ? '1px solid #86efac' : '1px solid #bfdbfe',
                                borderRadius: 3,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                              title={`Directly open Add Component for BOQ item [${line.sNo || lIdx + 1}]`}
                            >
                              {line.components && line.components.length > 0 ? `📦 ${line.components.length}` : '+ Comp'}
                            </button>
                          </div>
                        </td>

                        {/* Stock # (Excel 1-85 Lookup) */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            max="85"
                            value={line.slNoRef !== undefined ? line.slNoRef : ''}
                            onChange={(e) => handleSelectBySlNo(sIdx, lIdx, e.target.value)}
                            placeholder="1-85"
                            title="Enter SL.NO (1-85) from Stock details1 - Copy.xls to auto-fill description and unit."
                            style={{
                              textAlign: 'center',
                              fontWeight: 800,
                              color: line.slNoRef ? '#1e40af' : '#64748b',
                              backgroundColor: line.slNoRef ? '#eff6ff' : '#ffffff',
                              borderColor: line.slNoRef ? '#3b82f6' : '#cbd5e1',
                            }}
                          />
                        </td>

                        {/* Description (Spacious text input + Pre-BOQ Material Breakdown inner box + quick item selector) */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => handleItemChange(sIdx, lIdx, 'description', e.target.value)}
                              placeholder="Description of electrical supply / installation work..."
                              style={{ fontWeight: 600, width: '100%' }}
                            />
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {/* Inner Box: Pre-BOQ Component / Material Breakdown */}
                              <button
                                type="button"
                                onClick={() => setBreakdownTarget({ sIdx, lIdx })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '4px 9px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  border: line.components && line.components.length > 0 ? '1px solid #86efac' : '1px dashed #93c5fd',
                                  backgroundColor: line.components && line.components.length > 0 ? '#f0fdf4' : '#eff6ff',
                                  color: line.components && line.components.length > 0 ? '#166534' : '#1d4ed8',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Click to add constituent components & admin prices directly"
                              >
                                <Package size={13} color={line.components && line.components.length > 0 ? '#16a34a' : '#2563eb'} />
                                {line.components && line.components.length > 0 ? (
                                  <span>
                                    📦 <strong>{line.components.length} Raw Materials</strong>
                                    {line.components.some(c => (c.unitCost || 0) > 0) && (
                                      <span style={{ marginLeft: 4, color: '#15803d', fontWeight: 800 }}>
                                        (₹{line.components.reduce((sum, c) => {
                                          const pQty = Number(line.qty) || 0;
                                          const ratio = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : (pQty > 0 ? (Number(c.totalQty) / pQty) : Number(c.totalQty) || 1);
                                          return sum + (ratio * pQty * (c.unitCost || 0));
                                        }, 0).toLocaleString('en-IN')})
                                      </span>
                                    )}
                                    : {line.components.map(c => {
                                      const pQty = Number(line.qty) || 0;
                                      const ratio = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : (pQty > 0 ? (Number(c.totalQty) / pQty) : Number(c.totalQty) || 1);
                                      const total = Math.round(ratio * pQty * 100) / 100;
                                      return `${total} ${c.unit} ${c.name}`;
                                    }).slice(0, 2).join(', ')}{line.components.length > 2 ? '...' : ''}
                                  </span>
                                ) : (
                                  <span>+ Add Components / BOM Breakdown (Admin Rates)</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Qty */}
                        <td style={{ minWidth: 140, verticalAlign: 'top' }}>
                          <BOQQuantityInput
                            value={line.qty}
                            onChange={(newQty) => handleItemChange(sIdx, lIdx, 'qty', newQty)}
                            unit={line.unit}
                            componentCount={line.components?.length || 0}
                            componentSummary={
                              line.components && line.components.length > 0
                                ? `Scales ${line.components.length} materials: ${line.components.map(c => `${c.qtyPerUnit || 1} ${c.unit} × ${line.qty} = ${Math.round((c.qtyPerUnit || 1) * line.qty * 100) / 100} ${c.unit} ${c.name}`).slice(0, 2).join(', ')}`
                                : undefined
                            }
                          />
                        </td>

                        {/* Uom */}
                        <td>
                          <select
                            value={line.unit}
                            onChange={(e) => handleItemChange(sIdx, lIdx, 'unit', e.target.value)}
                            style={{ textAlign: 'center', fontWeight: 600 }}
                          >
                            {AVAILABLE_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>

                        {/* Supply Rate (₹) */}
                        <td>
                          <input
                            type="number"
                            value={line.supplyRate}
                            onChange={(e) => handleItemChange(sIdx, lIdx, 'supplyRate', e.target.value)}
                            className={`rate-input ${workflowStep === 'pricing' ? 'rate-input-highlight' : ''}`}
                            placeholder="0"
                          />
                        </td>

                        {/* Erection Rate (₹) */}
                        <td>
                          <input
                            type="number"
                            value={line.erectionRate}
                            onChange={(e) => handleItemChange(sIdx, lIdx, 'erectionRate', e.target.value)}
                            className={`rate-input ${workflowStep === 'pricing' ? 'rate-input-highlight' : ''}`}
                            placeholder="0"
                          />
                        </td>

                        {/* Computed Supply Amount */}
                        <td style={{ textAlign: 'right', fontWeight: 600, backgroundColor: '#fafbfc' }}>
                          ₹{line.supplyAmount.toLocaleString('en-IN')}
                        </td>

                        {/* Computed Erection Amount */}
                        <td style={{ textAlign: 'right', fontWeight: 600, backgroundColor: '#fafbfc' }}>
                          ₹{line.erectionAmount.toLocaleString('en-IN')}
                        </td>

                        {/* Computed Line Total */}
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f766e', backgroundColor: '#fafbfc' }}>
                          ₹{line.totalAmount.toLocaleString('en-IN')}
                        </td>

                        {/* Vendor Assignment */}
                        <td>
                          <select
                            value={line.vendorId || ''}
                            onChange={(e) => handleItemChange(sIdx, lIdx, 'vendorId', e.target.value)}
                            style={{ fontSize: '0.75rem' }}
                          >
                            <option value="">Unassigned</option>
                            {vendors.map((v) => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Row Actions */}
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleAddItem(sIdx, lIdx)}
                              title="Insert new row below"
                              style={{
                                color: '#0f766e',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: 3,
                                width: 24,
                                height: 24,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                              }}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(sIdx, lIdx)}
                              title="Delete this row"
                              style={{
                                color: '#dc2626',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: 3,
                                width: 24,
                                height: 24,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {/* Blank spacer rows to match printed sheet aesthetic */}
                <tr style={{ height: 12, backgroundColor: '#f8fafc' }}>
                  <td colSpan={12} style={{ border: 'none' }}></td>
                </tr>

                {/* Sub-total Row (Matches the printed sheet "Total" line) */}
                <tr className="total-row">
                  <td colSpan={7} style={{ textAlign: 'right', paddingRight: 16, fontWeight: 800 }}>
                    Total:
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 8, fontWeight: 800 }}>
                    ₹{grandSupply.toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 8, fontWeight: 800 }}>
                    ₹{grandErection.toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 8, fontWeight: 900, color: '#0f766e' }}>
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2} style={{ backgroundColor: '#f8fafc' }}></td>
                </tr>

                {/* Grand Total Row (Matches the printed sheet "Grand Total" line) */}
                <tr className="grand-total-row">
                  <td colSpan={7} style={{ textAlign: 'right', paddingRight: 16, fontWeight: 900, fontSize: '1rem', letterSpacing: '0.02em' }}>
                    Grand Total:
                  </td>
                  <td colSpan={3} style={{ textAlign: 'right', paddingRight: 8, fontWeight: 900, fontSize: '1.15rem', color: '#0f766e' }}>
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2} style={{ backgroundColor: '#f1f5f9' }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add Section Button */}
          <button
            type="button"
            onClick={handleAddSection}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed #94a3b8',
              borderRadius: 6,
              backgroundColor: '#f8fafc',
              color: '#0f766e',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
          >
            <Plus size={18} /> Add Another BOQ Section
          </button>

          {/* Scope / Revision Reason */}
          <div style={{ marginTop: 4 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
              Reason / Scope Note for this BOQ Package <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="e.g. Interior lighting and circuit mains quotation prepared from architectural drawing revision 2."
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 4,
                border: '1px solid #94a3b8',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Quick Stats on Bottom Left */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.86rem' }}>
            <span>Sections: <strong>{sections.length}</strong></span>
            <span>Items: <strong>{totalLineCount}</strong></span>
            <span>Supply: <strong>₹{grandSupply.toLocaleString('en-IN')}</strong></span>
            <span>Erection: <strong>₹{grandErection.toLocaleString('en-IN')}</strong></span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f766e' }}>
              Grand Total: ₹{grandTotal.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            {/* Step 1 Draft Button */}
            <Button
              variant="secondary"
              icon={<Clock size={16} color="#d97706" />}
              onClick={handleSaveDraftRatesPending}
              title="Save all mapped items and quantities. Rates can remain 0 for Admin rate entry."
            >
              💾 Save Draft (Rates Pending)
            </Button>

            {/* Step 2 Finalize Button */}
            <Button
              variant="accent"
              icon={<CheckCircle2 size={16} />}
              onClick={handleSaveFinalBOQ}
            >
              ✅ Finalize & Quoted
            </Button>
          </div>
        </div>
      </div>

      {/* CSV Import Sub-modal */}
      {isCsvImportOpen && (
        <Modal
          isOpen={isCsvImportOpen}
          onClose={() => setIsCsvImportOpen(false)}
          title="Import BOQ from CSV Format"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
              Paste standard BOQ CSV data with columns: <code>Section, S.No, Description, Qty, Unit, Supply Rate, Erection Rate, Total, Vendor</code>
            </p>
            <textarea
              className="ui-input ui-textarea"
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`"1.00 CIRCUIT MAINS","1.00","Wiring to the Circuit mains...",560,"Mtrs",155,40\n"2.00 LIGHT POINTS","a","Wiring to the light points...",15,"Pts.",950,270`}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="secondary" onClick={() => setIsCsvImportOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleProcessCsvImport}>
                Parse & Populate BOQ
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pre-BOQ Material Breakdown & BOM Modal (Inner Box for components) */}
      {breakdownTarget && sections[breakdownTarget.sIdx]?.items[breakdownTarget.lIdx] && (
        <PreBOQBreakdownModal
          isOpen={Boolean(breakdownTarget)}
          onClose={() => setBreakdownTarget(null)}
          parentLine={sections[breakdownTarget.sIdx].items[breakdownTarget.lIdx]}
          onSaveComponents={handleSaveBreakdownComponents}
        />
      )}
    </div>
  );
};
