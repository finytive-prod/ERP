import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  Search,
  PlusCircle,
  X,
  Boxes
} from 'lucide-react';
import { BOQLine, BOQComponent, MeasurementUnit, ItemMaster, AVAILABLE_UNITS, COMMON_CATEGORIES } from '../../types';
import { inferCategoryAndUnit, InferredProductDetails } from '../../utils/productInference';
import { ERPService } from '../../services/erpStorage';
import { Modal, Button, Badge, useToast, Input, Select, BOQQuantityInput } from '../../components/ui';

interface PreBOQBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentLine: BOQLine;
  onSaveComponents: (components: BOQComponent[], applyRateToParent?: boolean) => void;
}

export const PreBOQBreakdownModal: React.FC<PreBOQBreakdownModalProps> = ({
  isOpen,
  onClose,
  parentLine,
  onSaveComponents,
}) => {
  const { showToast } = useToast();
  const [itemsMaster, setItemsMaster] = useState<ItemMaster[]>([]);
  const [components, setComponents] = useState<BOQComponent[]>([]);

  // Search dropdown state
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // New Product Modal state
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [inferredDetails, setInferredDetails] = useState<InferredProductDetails | null>(null);
  const [lastInferredSpec, setLastInferredSpec] = useState<string>('');
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Electrical Accessories' as string,
    specification: '',
    unit: 'Nos' as MeasurementUnit,
    standardCost: '0',
  });
  const [targetRowForNewProduct, setTargetRowForNewProduct] = useState<number | null>(null);

  const loadItems = () => {
    setItemsMaster(ERPService.getItems());
  };

  useEffect(() => {
    loadItems();
    window.addEventListener('apex_storage_update', loadItems);
    return () => window.removeEventListener('apex_storage_update', loadItems);
  }, []);

  const createBlankComponent = (): BOQComponent => ({
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: '',
    specification: '',
    qtyPerUnit: 1,
    totalQty: Number(parentLine.qty) || 1,
    unit: 'Nos',
    unitCost: 0,
    totalCost: 0,
  });

  useEffect(() => {
    if (parentLine.components && parentLine.components.length > 0) {
      const pQty = Number(parentLine.qty) || 1;
      setComponents(
        parentLine.components.map((c) => {
          const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : 1;
          const totalQty = Math.round(qtyPerUnit * pQty * 100) / 100;
          return {
            ...c,
            qtyPerUnit,
            totalQty,
            unitCost: c.unitCost || 0,
            totalCost: Math.round(totalQty * (c.unitCost || 0) * 100) / 100,
          };
        })
      );
      setActiveSearchIdx(null);
    } else {
      // Directly open with 1 component row ready to add - no intermediate placeholder screen!
      setComponents([createBlankComponent()]);
      setActiveSearchIdx(0);
    }
  }, [parentLine, isOpen]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setActiveSearchIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update component fields (quantity auto-calculates total volume and admin-set unitCost auto-calculates total cost)
  const updateComponent = (index: number, field: keyof BOQComponent, val: any) => {
    const copy = [...components];
    const comp = copy[index];

    if (field === 'qtyPerUnit') {
      const q = typeof val === 'number' ? val : (parseFloat(val) || 0);
      comp.qtyPerUnit = q;
      comp.totalQty = Math.round(q * (Number(parentLine.qty) || 1) * 100) / 100;
      comp.totalCost = Math.round(comp.totalQty * (comp.unitCost || 0) * 100) / 100;
    } else if (field === 'unitCost') {
      const c = parseFloat(val) || 0;
      comp.unitCost = c;
      comp.totalCost = Math.round((comp.totalQty || 0) * c * 100) / 100;
    } else {
      (comp as any)[field] = val;
    }

    setComponents(copy);
  };

  // Add blank component row
  const handleAddComponent = () => {
    const newComp = createBlankComponent();
    const newIdx = components.length;
    setComponents([...components, newComp]);
    setActiveSearchIdx(newIdx);
  };

  // Remove component
  const handleRemoveComponent = (idx: number) => {
    if (components.length <= 1) {
      // Avoid leaving user with an empty screen - reset to blank row
      setComponents([createBlankComponent()]);
      setActiveSearchIdx(0);
      return;
    }
    setComponents(components.filter((_, i) => i !== idx));
    if (activeSearchIdx === idx) {
      setActiveSearchIdx(null);
    }
  };

  // Select item from search suggestions (CRITICAL: DO NOT auto-populate price; price is set by Admin)
  const handleSelectProduct = (index: number, item: ItemMaster) => {
    const copy = [...components];
    const comp = copy[index];
    comp.slNoRef = item.slNo;
    comp.itemId = item.id;
    comp.name = item.name;
    comp.specification = item.specification || '';
    comp.unit = item.unit;
    // Do NOT get automatic price from item master!
    // Price must be entered and set by admin edit. Preserve existing unitCost or default to 0.
    if (comp.unitCost === undefined) {
      comp.unitCost = 0;
    }
    comp.totalCost = Math.round((comp.totalQty || 0) * (comp.unitCost || 0) * 100) / 100;
    setComponents(copy);
    setActiveSearchIdx(null);
  };

  // Quick preset recipes (pure volume and product, no cost needed)
  const handleLoadPreset = (presetType: 'fan' | 'circuit' | 'socket' | 'light') => {
    const parentQty = parentLine.qty || 1;
    let newItems: BOQComponent[] = [];

    if (presetType === 'fan') {
      newItems = [
        {
          id: `comp-fan-1-${Date.now()}`,
          name: '1200mm Ceiling Fan Heavy Duty',
          specification: '1200mm sweep, white, with downrod',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Nos',
        },
        {
          id: `comp-fan-2-${Date.now()}`,
          slNoRef: 4,
          name: '1.5 Sq.mm wire-green 300mtrs',
          specification: '1.5 Sq.mm FRLS Copper Wire',
          qtyPerUnit: 15,
          totalQty: 15 * parentQty,
          unit: 'Mtrs',
        },
        {
          id: `comp-fan-3-${Date.now()}`,
          name: '25mm Medium Duty PVC Conduit Pipe',
          specification: '25mm ISI Mark Rigid PVC',
          qtyPerUnit: 3,
          totalQty: 3 * parentQty,
          unit: 'Mtrs',
        },
        {
          id: `comp-fan-4-${Date.now()}`,
          name: '6A Modular Switch 1-Way with Plate',
          specification: '6A 230V AC Modular White',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Nos',
        },
        {
          id: `comp-fan-5-${Date.now()}`,
          name: '2 Module GI / Metal Back Box',
          specification: 'Concealed Wall Mounting Box',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Nos',
        },
      ];
    } else if (presetType === 'circuit') {
      newItems = [
        {
          id: `comp-cct-1-${Date.now()}`,
          name: '2.5 Sq.mm Multi Strand PVC Copper Wire (Phase & Neutral)',
          specification: '2 Runs of 2.5 Sq.mm FRLS',
          qtyPerUnit: 2,
          totalQty: 2 * parentQty,
          unit: 'Mtrs',
        },
        {
          id: `comp-cct-2-${Date.now()}`,
          name: '1.5 Sq.mm Multi Strand PVC Copper Wire (Earth)',
          specification: '1 Run of 1.5 Sq.mm Green Earth',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Mtrs',
        },
        {
          id: `comp-cct-3-${Date.now()}`,
          name: '25mm PVC Conduit and Accessories',
          specification: 'Heavy duty conduit in floor / wall',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Mtrs',
        },
      ];
    } else if (presetType === 'socket') {
      newItems = [
        {
          id: `comp-skt-1-${Date.now()}`,
          name: '4.0 Sq.mm Multi Strand PVC Copper Wire (Phase/Neutral)',
          specification: '4.0 Sq.mm FRLS Red & Black',
          qtyPerUnit: 8,
          totalQty: 8 * parentQty,
          unit: 'Mtrs',
        },
        {
          id: `comp-skt-2-${Date.now()}`,
          name: '2.5 Sq.mm Earth Conductor Wire',
          specification: '2.5 Sq.mm Green Earth Wire',
          qtyPerUnit: 4,
          totalQty: 4 * parentQty,
          unit: 'Mtrs',
        },
        {
          id: `comp-skt-3-${Date.now()}`,
          name: '16A 3-Pin Combined Switched Socket with Plate',
          specification: 'Heavy Duty Power Socket White',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Set',
        },
        {
          id: `comp-skt-4-${Date.now()}`,
          name: '4 Module Concealed Metal Flush Box',
          specification: '16 SWG GI Box',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Nos',
        },
      ];
    } else {
      newItems = [
        {
          id: `comp-lt-1-${Date.now()}`,
          name: '1.5 Sq.mm FRLS Copper Wire (Phase, Neutral, Earth)',
          specification: '3 Runs of 1.5 Sq.mm (6 Mtr average run)',
          qtyPerUnit: 18,
          totalQty: 18 * parentQty,
          unit: 'Mtrs',
        },
        {
          id: `comp-lt-2-${Date.now()}`,
          name: '20mm Rigid PVC Conduit Pipe & Bends',
          specification: 'Ceiling conduit with saddles',
          qtyPerUnit: 4,
          totalQty: 4 * parentQty,
          unit: 'Mtrs',
        },
        {
          id: `comp-lt-3-${Date.now()}`,
          name: 'Ceiling Rose 3-Terminal / Junction Connector',
          specification: 'Heavy Duty Bakelite Ceiling Rose',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Nos',
        },
        {
          id: `comp-lt-4-${Date.now()}`,
          name: '6A Modular Switch with Cover Plate',
          specification: 'Single pole switch',
          qtyPerUnit: 1,
          totalQty: 1 * parentQty,
          unit: 'Nos',
        },
      ];
    }

    setComponents(newItems);
    showToast('Preset Loaded', `Populated ${newItems.length} constituent materials for this item.`, 'info');
  };

  // Open Quick Add Product Modal
  const handleOpenNewProductModal = (rowIndex: number | null, initialName = '') => {
    setTargetRowForNewProduct(rowIndex);
    const inf = inferCategoryAndUnit(initialName, itemsMaster);
    setNewProductForm({
      name: initialName,
      category: inf ? inf.category : 'Electrical Accessories',
      specification: inf?.specification || '',
      unit: inf ? inf.unit : (rowIndex !== null && components[rowIndex] ? components[rowIndex].unit : 'Nos'),
      standardCost: '0',
    });
    setInferredDetails(inf);
    setLastInferredSpec(inf?.specification || '');
    setIsNewProductModalOpen(true);
  };

  const handleProductNameChange = (name: string) => {
    const inf = inferCategoryAndUnit(name, itemsMaster);
    if (inf) {
      setNewProductForm((prev) => ({
        ...prev,
        name,
        category: inf.category,
        unit: inf.unit,
        specification: (!prev.specification || prev.specification === lastInferredSpec)
          ? (inf.specification || '')
          : prev.specification,
      }));
      setLastInferredSpec(inf.specification || '');
      setInferredDetails(inf);
    } else {
      setNewProductForm((prev) => ({ ...prev, name }));
      setInferredDetails(null);
    }
  };

  // Create new item in Item Master
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      showToast('Validation Error', 'Please enter a product name.', 'danger');
      return;
    }

    const created = ERPService.addItem({
      name: newProductForm.name.trim(),
      category: newProductForm.category,
      specification: newProductForm.specification.trim(),
      unit: newProductForm.unit,
      standardCost: parseFloat(newProductForm.standardCost) || 0,
    });

    setItemsMaster(ERPService.getItems());
    showToast('Product Created', `"${created.name}" was added to Item Master.`, 'success');
    setIsNewProductModalOpen(false);
    setInferredDetails(null);
    setLastInferredSpec('');

    // If triggered from a specific row, auto-select it
    if (targetRowForNewProduct !== null && targetRowForNewProduct < components.length) {
      handleSelectProduct(targetRowForNewProduct, created);
    }
  };

  const totalVolumeQty = components.reduce((sum, c) => sum + (c.totalQty || 0), 0);
  const totalComponentCost = Math.round(
    components.reduce((sum, c) => sum + ((c.totalQty || 0) * (c.unitCost || 0)), 0) * 100
  ) / 100;
  const parentQty = parentLine.qty || 1;
  const costPerParentUnit = Math.round((totalComponentCost / parentQty) * 100) / 100;

  const handleSave = (applyToSupplyRate: boolean = false) => {
    const valid = components.filter((c) => c.name.trim() !== '');
    if (valid.length === 0) {
      showToast('Validation', 'Please enter at least one product name/description.', 'warning');
      return;
    }
    onSaveComponents(valid, applyToSupplyRate);
    showToast(
      'BOM Saved',
      `Attached ${valid.length} constituent materials (Admin Cost: ₹${totalComponentCost.toLocaleString('en-IN')}) to "${(parentLine.description || 'BOQ Line').slice(0, 30)}..."`,
      'success'
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="ui-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
        <div
          className="ui-modal-content"
          style={{
            maxWidth: '1080px',
            width: '97vw',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: 8,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={22} color="#38bdf8" />
                <span style={{ fontSize: '1.18rem', fontWeight: 800 }}>
                  Pre-BOQ Material Breakdown & BOM (Bill of Materials)
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: '#0369a1',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  Admin Pricing & Recipe
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
                Define constituent products, raw materials, volume & admin rates for: <strong>"{parentLine.description || 'BOQ Line'}"</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                fontSize: '1.4rem',
                color: '#94a3b8',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Parent Line Context Box & Quick Recipe Presets */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Parent Context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                Parent Scope Item:
              </span>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                {parentLine.sNo ? `[${parentLine.sNo}] ` : ''}{parentLine.description || 'Unnamed Line Item'}
              </span>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                }}
              >
                Target Volume: {parentLine.qty} {parentLine.unit}
              </span>
            </div>

            {/* Quick Actions & Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Button
                size="sm"
                variant="secondary"
                icon={<PlusCircle size={14} color="#0284c7" />}
                onClick={() => handleOpenNewProductModal(null)}
                style={{ fontWeight: 700, color: '#0369a1' }}
              >
                + Add New Product to Master
              </Button>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', marginLeft: 6 }}>
                ⚡ Quick Recipe:
              </span>
              <button
                type="button"
                onClick={() => handleLoadPreset('fan')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                🌪️ Fan Point
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('circuit')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                ⚡ Circuit Mains
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('socket')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                🔌 15A Socket
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('light')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                💡 Light Point
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div
            style={{
              padding: '8px 20px',
              backgroundColor: '#eff6ff',
              borderBottom: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              fontSize: '0.82rem',
              color: '#1e40af',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={15} />
              <span>
                <strong>Direct Component Breakdown:</strong> Add raw materials, volumes, and admin-set unit prices. No automatic price is applied — prices are entered and edited directly by Admin.
              </span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid #93c5fd',
              }}
            >
              🔒 Admin Price Control (No Auto Pricing)
            </span>
          </div>

          {/* Modal Scrollable Table Body - DIRECTLY OPEN TABLE (No empty placeholder screen) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }} ref={searchContainerRef}>
            <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
              <table className="boq-sheet-table" style={{ width: '100%', minWidth: 880 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th style={{ minWidth: 260, textAlign: 'left', paddingLeft: 12 }}>
                      Product / Raw Material Description (Search in Master)
                    </th>
                    <th style={{ width: 105, textAlign: 'right' }}>
                      Qty / 1 {parentLine.unit || 'Unit'}
                    </th>
                    <th style={{ width: 135, textAlign: 'right', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      Total Qty ({parentLine.qty || 1} {parentLine.unit})
                    </th>
                    <th style={{ width: 85, textAlign: 'center' }}>UOM</th>
                    <th style={{ width: 135, textAlign: 'right', backgroundColor: '#fef3c7', color: '#92400e' }}>
                      Admin Rate / Price (₹)
                    </th>
                    <th style={{ width: 130, textAlign: 'right', backgroundColor: '#f0fdf4', color: '#166534' }}>
                      Total Amount (₹)
                    </th>
                    <th style={{ width: 40, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((comp, idx) => {
                    const searchQ = (comp.name || '').trim().toLowerCase();
                    const matchingItems = searchQ
                      ? itemsMaster.filter((item) => {
                          const nameLower = (item.name || '').toLowerCase();
                          const specLower = (item.specification || '').toLowerCase();
                          const slLower = item.slNo ? String(item.slNo).toLowerCase() : '';
                          const catLower = (item.category || '').toLowerCase();
                          return (
                            nameLower.includes(searchQ) ||
                            specLower.includes(searchQ) ||
                            slLower.includes(searchQ) ||
                            catLower.includes(searchQ)
                          );
                        })
                      : itemsMaster.slice(0, 15);

                    const isSearching = activeSearchIdx === idx;
                    const rowTotal = Math.round((comp.totalQty || 0) * (comp.unitCost || 0) * 100) / 100;

                    return (
                      <tr key={comp.id}>
                        {/* Serial */}
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                          {idx + 1}
                        </td>

                        {/* Product Description */}
                        <td style={{ position: 'relative' }}>
                          <div style={{ position: 'relative', width: '100%' }}>
                            <input
                              type="text"
                              value={comp.name}
                              onChange={(e) => {
                                updateComponent(idx, 'name', e.target.value);
                                setActiveSearchIdx(idx);
                              }}
                              onFocus={() => setActiveSearchIdx(idx)}
                              placeholder="Type component name (e.g. 1.5 sqmm wire, pvc conduit, switch)..."
                              style={{
                                fontWeight: 600,
                                width: '100%',
                                paddingRight: 28,
                                border: isSearching ? '2px solid #2563eb' : '1px solid #cbd5e1',
                              }}
                              autoFocus={idx === 0 && !comp.name}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: '#94a3b8',
                              }}
                            >
                              <Search size={14} />
                            </div>

                            {/* Dropdown suggestions */}
                            {isSearching && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 'calc(100% + 4px)',
                                  left: 0,
                                  right: 0,
                                  zIndex: 1200,
                                  backgroundColor: '#ffffff',
                                  borderRadius: 6,
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                                  border: '1px solid #94a3b8',
                                  maxHeight: 260,
                                  overflowY: 'auto',
                                }}
                              >
                                {/* Quick Add Option */}
                                <div
                                  onClick={() => {
                                    handleOpenNewProductModal(idx, comp.name);
                                    setActiveSearchIdx(null);
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#f0fdf4',
                                    borderBottom: '1px solid #bbf7d0',
                                    color: '#15803d',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <PlusCircle size={15} color="#16a34a" />
                                  <span>
                                    {searchQ
                                      ? `+ Add "${comp.name}" as New Product in Master`
                                      : '+ Add New Custom Product to Item Master'}
                                  </span>
                                </div>

                                {matchingItems.length > 0 ? (
                                  matchingItems.slice(0, 20).map((im) => (
                                    <div
                                      key={im.id}
                                      onClick={() => handleSelectProduct(idx, im)}
                                      style={{
                                        padding: '8px 12px',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'background-color 0.1s',
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                                    >
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                                          {im.slNo ? `SL #${im.slNo}: ` : ''}{im.name}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                                          {im.category} {im.specification ? `• ${im.specification}` : ''}
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          padding: '2px 6px',
                                          borderRadius: 4,
                                          backgroundColor: '#e2e8f0',
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          color: '#334155',
                                        }}
                                      >
                                        {im.unit}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                                    No matching items found. Click above to add as a new product!
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Qty Per Unit */}
                        <td style={{ minWidth: 125 }}>
                          <BOQQuantityInput
                            value={comp.qtyPerUnit}
                            onChange={(q) => updateComponent(idx, 'qtyPerUnit', q)}
                            unit={comp.unit}
                          />
                        </td>

                        {/* Total Volume */}
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0369a1', backgroundColor: '#f0f9ff', padding: '6px 10px' }}>
                          <div style={{ fontSize: '0.92rem' }}>
                            {comp.totalQty} {comp.unit}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>
                            {comp.qtyPerUnit} × {parentLine.qty || 1} {parentLine.unit}
                          </div>
                        </td>

                        {/* Uom */}
                        <td>
                          <select
                            value={comp.unit}
                            onChange={(e) => updateComponent(idx, 'unit', e.target.value)}
                            style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            {AVAILABLE_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>

                        {/* Admin Rate / Price (₹) - NO automatic price! */}
                        <td style={{ backgroundColor: '#fffbeb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700 }}>₹</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={comp.unitCost !== undefined && comp.unitCost !== 0 ? comp.unitCost : (comp.unitCost === 0 ? '' : comp.unitCost)}
                              onChange={(e) => updateComponent(idx, 'unitCost', e.target.value)}
                              placeholder="0.00"
                              title="Enter price set by admin (No automatic price)"
                              style={{
                                textAlign: 'right',
                                fontWeight: 800,
                                color: '#92400e',
                                width: 85,
                                padding: '4px 6px',
                                borderRadius: 4,
                                border: '1px solid #f59e0b',
                                backgroundColor: '#ffffff',
                              }}
                            />
                          </div>
                        </td>

                        {/* Total Amount (₹) */}
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#166534', backgroundColor: '#f0fdf4', fontSize: '0.88rem' }}>
                          ₹{rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Remove */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(idx)}
                            style={{
                              color: '#dc2626',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 4,
                            }}
                            title="Delete component"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Actions to add component row */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button size="sm" variant="accent" icon={<Plus size={14} />} onClick={handleAddComponent}>
                + Add Component Row
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<PlusCircle size={14} color="#0284c7" />}
                onClick={() => handleOpenNewProductModal(null)}
              >
                Create New Item Master
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: '0.86rem', flexWrap: 'wrap' }}>
              <span>Components: <strong>{components.filter(c => c.name.trim()).length}</strong></span>
              <span>Total Volume: <strong>{totalVolumeQty.toLocaleString('en-IN')} units</strong></span>
              <span style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                Total BOM Cost: <strong>₹{totalComponentCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </span>
              {parentQty > 0 && totalComponentCost > 0 && (
                <span style={{ color: '#0369a1', backgroundColor: '#e0f2fe', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                  Cost / 1 {parentLine.unit}: <strong>₹{costPerParentUnit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="accent"
                icon={<CheckCircle2 size={16} />}
                onClick={() => handleSave(false)}
                title="Save components and admin prices to this BOQ line"
              >
                Save & Attach to BOQ Line
              </Button>
              {totalComponentCost > 0 && (
                <Button
                  variant="primary"
                  icon={<Sparkles size={16} />}
                  onClick={() => handleSave(true)}
                  title={`Save components and set parent BOQ line Supply Rate to ₹${costPerParentUnit}`}
                >
                  Save & Apply Rate (₹{costPerParentUnit}) to BOQ
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add New Product to Item Master Modal */}
      <Modal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        title="Add New Product to Item Master"
        maxWidth="560px"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsNewProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" icon={<Plus size={16} />} onClick={handleCreateProduct}>
              Save Product to Master
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 0, marginBottom: 14 }}>
          Quickly register a new item master product into the ERP catalog.
        </p>
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
              Product / Material Name *
            </label>
            <input
              type="text"
              required
              value={newProductForm.name}
              onChange={(e) => handleProductNameChange(e.target.value)}
              placeholder="e.g. 1.5 Sq.mm FRLS Copper Wire, 25mm PVC Conduit, 16A Modular Switch..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 4,
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
              autoFocus
            />
            {inferredDetails && (
              <div
                style={{
                  marginTop: 8,
                  padding: '9px 12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#166534' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <Sparkles size={15} color="#16a34a" />
                    Auto-detected & Selected:
                    <span style={{ color: '#15803d', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>
                      {inferredDetails.category}
                    </span>
                    &bull;
                    <span style={{ color: '#15803d', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>
                      {inferredDetails.unit}
                    </span>
                  </span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#16a34a', color: '#ffffff', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>
                    ✓ Applied
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                    {inferredDetails.reason}
                  </span>
                  {inferredDetails.suggestedUnits.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 600 }}>Quick UOM:</span>
                      {inferredDetails.suggestedUnits.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setNewProductForm((prev) => ({ ...prev, unit: u }))}
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.73rem',
                            borderRadius: 4,
                            border: newProductForm.unit === u ? '1px solid #16a34a' : '1px solid #cbd5e1',
                            backgroundColor: newProductForm.unit === u ? '#16a34a' : '#ffffff',
                            color: newProductForm.unit === u ? '#ffffff' : '#334155',
                            fontWeight: newProductForm.unit === u ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {u} {newProductForm.unit === u ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
                <span>Category *</span>
                {inferredDetails?.category === newProductForm.category && (
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>✨ Suggested</span>
                )}
              </label>
              <select
                value={newProductForm.category}
                onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 4,
                  border: inferredDetails?.category === newProductForm.category ? '1px solid #16a34a' : '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  backgroundColor: '#ffffff',
                }}
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
                <span>Measurement Unit (UOM) *</span>
                {inferredDetails?.unit === newProductForm.unit && (
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>✨ Suggested</span>
                )}
              </label>
              <select
                value={newProductForm.unit}
                onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value as MeasurementUnit })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 4,
                  border: inferredDetails?.unit === newProductForm.unit ? '1px solid #16a34a' : '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  backgroundColor: '#ffffff',
                }}
              >
                {AVAILABLE_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
              <span>Specification / Size / Technical Details</span>
              {inferredDetails?.specification && newProductForm.specification === inferredDetails.specification && (
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>✨ Auto-filled</span>
              )}
            </label>
            <input
              type="text"
              value={newProductForm.specification}
              onChange={(e) => setNewProductForm({ ...newProductForm, specification: e.target.value })}
              placeholder="e.g. 1100V Grade ISI FRLS Copper, Medium Duty 25mm"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 4,
                border: '1px solid #cbd5e1',
                fontSize: '0.86rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
              Standard Cost (₹) (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={newProductForm.standardCost}
              onChange={(e) => setNewProductForm({ ...newProductForm, standardCost: e.target.value })}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 4,
                border: '1px solid #cbd5e1',
                fontSize: '0.86rem',
              }}
            />
          </div>
        </form>
      </Modal>
    </>
  );
};
