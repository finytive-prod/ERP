import React, { useMemo } from 'react';
import { 
  Layers, 
  Package, 
  ShoppingCart, 
  X, 
  Building2, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { Button, Badge } from '../../components/ui';

export interface MaterialMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialName: string;
  specification?: string;
  jobId?: string;
  componentId?: string;
  itemId?: string;
  onProcure?: (mappingInfo: any) => void;
}

export const MaterialMappingModal: React.FC<MaterialMappingModalProps> = ({
  isOpen,
  onClose,
  materialName,
  specification,
  jobId,
  componentId,
  itemId,
  onProcure,
}) => {
  const details = useMemo(() => {
    if (!isOpen || !materialName) return null;
    return ERPService.getMaterialMappingDetails(materialName, jobId, componentId, itemId);
  }, [isOpen, materialName, jobId, componentId, itemId]);

  if (!isOpen || !details) return null;

  const pctOrdered = details.totalRequiredQty > 0
    ? Math.min(100, Math.round((details.totalOrderedQty / details.totalRequiredQty) * 100))
    : 0;

  return (
    <div className="ui-modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="ui-modal-content"
        style={{
          maxWidth: '920px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 10,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={20} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  {materialName}
                </h3>
                <span
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid #334155',
                  }}
                >
                  Unit: {details.unit}
                </span>
                {specification && (
                  <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
                    ({specification})
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                Material Mapping & Consumption Breakdown across Project BOQ Lines & Orders
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: '1.3rem',
              color: '#94a3b8',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: '4px 8px',
              borderRadius: 4,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Stat Cards Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            {/* Total Required */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 700 }}>
                TOTAL BOQ REQUIRED
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0c4a6e', marginTop: 3 }}>
                {details.totalRequiredQty.toLocaleString('en-IN')} {details.unit}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: 2 }}>
                From {details.mappings.length} mapped BOQ {details.mappings.length === 1 ? 'line' : 'lines'}
              </div>
            </div>

            {/* Total Ordered in POs */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 700 }}>
                ALREADY PURCHASED
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e3a8a', marginTop: 3 }}>
                {details.totalOrderedQty.toLocaleString('en-IN')} {details.unit}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginTop: 2 }}>
                {pctOrdered}% of takeoff procured
              </div>
            </div>

            {/* Remaining Balance */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: details.balanceQty > 0 ? '#f0fdf4' : '#f8fafc',
                border: details.balanceQty > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: details.balanceQty > 0 ? '#15803d' : '#64748b', fontWeight: 700 }}>
                REMAINING TO BUY
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: details.balanceQty > 0 ? '#166534' : '#475569', marginTop: 3 }}>
                {details.balanceQty.toLocaleString('en-IN')} {details.unit}
              </div>
              <div style={{ fontSize: '0.72rem', color: details.balanceQty > 0 ? '#16a34a' : '#64748b', marginTop: 2 }}>
                {details.balanceQty === 0 ? '✓ 100% Fulfilled' : 'Procurement balance pending'}
              </div>
            </div>

            {/* Est Budget */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: '#fefce8',
                border: '1px solid #fef08a',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#a16207', fontWeight: 700 }}>
                ESTIMATED BUDGET
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#713f12', marginTop: 3 }}>
                ₹{details.totalEstBudget.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#ca8a04', marginTop: 2 }}>
                Target raw material value
              </div>
            </div>
          </div>

          {/* Dynamic Multiplication Explanation Banner */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Calculator size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
              <strong style={{ color: '#0f172a' }}>How Quantity is Calculated:</strong> In the BOQ, when you input outer quantity (e.g.{' '}
              <span style={{ fontWeight: 800, color: '#0369a1' }}>560 units</span>), each constituent material multiplier (e.g.{' '}
              <span style={{ fontWeight: 800, color: '#16a34a' }}>2 meters / unit</span>) automatically multiplies:{' '}
              <span style={{ fontWeight: 800, color: '#0f172a', backgroundColor: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>
                Outer Qty × Qty Per Unit = Total Required in Purchase
              </span>
              .
            </div>
          </div>

          {/* Where Mapped Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  📍 Where Mapped in BOQ Takeoffs ({details.mappings.length})
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Exact lines and parent items consuming this material
                </span>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px', width: 36, textAlign: 'center' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>Project / Job</th>
                    <th style={{ padding: '8px 10px' }}>BOQ Section & S.No</th>
                    <th style={{ padding: '8px 10px' }}>Parent Scope Item</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Outer Qty (Parent)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Multiplier Ratio</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Calculated Total</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate & Est Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {details.mappings.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                        No direct BOQ takeoff mappings found for this material.
                      </td>
                    </tr>
                  ) : (
                    details.mappings.map((m, idx) => (
                      <tr
                        key={`${m.jobId}-${m.lineId}-${idx}`}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc',
                        }}
                      >
                        <td style={{ textAlign: 'center', padding: '8px 10px', color: '#94a3b8', fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.jobId}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.jobTitle}</div>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            [{m.lineSNo || '-'}]
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>
                            {m.packageCode ? `[${m.packageCode}] ` : ''}{m.sectionTitle}
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.parentDescription}</div>
                          {m.isBomComponent ? (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: '#92400e',
                                backgroundColor: '#fef3c7',
                                padding: '1px 5px',
                                borderRadius: 3,
                                fontWeight: 700,
                              }}
                            >
                              📦 BOM Constituent Raw Material
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: '#166534',
                                backgroundColor: '#dcfce7',
                                padding: '1px 5px',
                                borderRadius: 3,
                                fontWeight: 700,
                              }}
                            >
                              Direct BOQ Supply Item
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {m.parentQty} {m.parentUnit}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {m.isBomComponent ? (
                            <span
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#f0fdf4',
                                color: '#166534',
                                borderRadius: 4,
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                border: '1px solid #bbf7d0',
                              }}
                            >
                              × {m.qtyPerUnit} {m.componentUnit} / {m.parentUnit}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>1 : 1</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 4,
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 900,
                              fontSize: '0.86rem',
                            }}
                          >
                            {m.totalRequiredQty} {m.componentUnit}
                          </div>
                          {m.isBomComponent && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 1 }}>
                              {m.parentQty} × {m.qtyPerUnit}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            ₹{m.totalCost.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            @ ₹{m.unitCost} / {m.componentUnit}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {details.mappings.length > 1 && (
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={6} style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>
                        GRAND TOTAL MAPPED REQUIREMENT:
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#0284c7', fontSize: '0.95rem' }}>
                        {details.totalRequiredQty.toLocaleString('en-IN')} {details.unit}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#0f172a', fontSize: '0.95rem' }}>
                        ₹{details.totalEstBudget.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Existing Purchase Orders Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  🛒 Linked Purchase Orders (POs) ({details.purchaseOrders.length})
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Orders placed with vendors for this material
                </span>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px' }}>PO Number</th>
                    <th style={{ padding: '8px 10px' }}>Project</th>
                    <th style={{ padding: '8px 10px' }}>Vendor</th>
                    <th style={{ padding: '8px 10px' }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Purchased Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Amount</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>PO Status</th>
                  </tr>
                </thead>
                <tbody>
                  {details.purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 18, textAlign: 'center', color: '#94a3b8' }}>
                        No Purchase Orders created yet for {materialName}. Full balance ({details.balanceQty} {details.unit}) is available to procure.
                      </td>
                    </tr>
                  ) : (
                    details.purchaseOrders.map((po, pIdx) => (
                      <tr
                        key={`${po.poId}-${pIdx}`}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: pIdx % 2 === 0 ? '#ffffff' : '#fafbfc',
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0284c7' }}>
                          {po.poId}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{po.jobId}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{po.vendorName}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{po.date}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>
                          {po.purchaseQty} {po.unit}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          ₹{po.purchaseRate.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹{po.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <Badge status={po.status as any} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Mapped across <strong>{details.mappings.length}</strong> BOQ items | Balance remaining: <strong>{details.balanceQty} {details.unit}</strong>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {onProcure && details.balanceQty > 0 && (
              <Button
                variant="accent"
                icon={<ShoppingCart size={14} />}
                onClick={() => {
                  onProcure(details);
                  onClose();
                }}
              >
                Procure Remaining {details.balanceQty} {details.unit}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
