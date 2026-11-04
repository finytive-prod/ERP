import { BOQSection, BOQLine } from '../types';

function computeSectionTotals(items: BOQLine[]): { items: BOQLine[]; supplyTotal: number; erectionTotal: number; grandTotal: number } {
  let supplyTotal = 0;
  let erectionTotal = 0;
  const computedItems = items.map((item) => {
    const supplyAmount = (item.qty || 0) * (item.supplyRate || 0);
    const erectionAmount = (item.qty || 0) * (item.erectionRate || 0);
    supplyTotal += supplyAmount;
    erectionTotal += erectionAmount;
    return {
      ...item,
      supplyAmount,
      erectionAmount,
      totalAmount: supplyAmount + erectionAmount,
    };
  });
  return {
    items: computedItems,
    supplyTotal,
    erectionTotal,
    grandTotal: supplyTotal + erectionTotal,
  };
}

/**
 * Template 1: Renault Nissan Industrial Offer (NPC/26-27/Q9516)
 * As seen in image copy.png
 */
export function getRenaultNissanTemplate(includeRates: boolean = true): BOQSection[] {
  const rawSections: { sectionNumber: string; title: string; lines: Array<Omit<BOQLine, 'supplyAmount' | 'erectionAmount' | 'totalAmount'>> }[] = [
    {
      sectionNumber: '1.0',
      title: 'PSW Transformers - 16 Nos',
      lines: [
        { id: 'rn-1-1', sNo: '1', description: 'Supply and Laying of 1CX95 Sq mm Cu Flex Cable', qty: 2720, unit: 'Mtrs', supplyRate: includeRates ? 1943 : 0, erectionRate: includeRates ? 140 : 0 },
        { id: 'rn-1-2', sNo: '2', description: 'Supply and End Termination for Above Cable', qty: 64, unit: 'Nos', supplyRate: includeRates ? 650 : 0, erectionRate: includeRates ? 350 : 0 },
        { id: 'rn-1-3', sNo: '3', description: 'Supply and Laying of 1CX25 Sq mm Cu Flex Cable', qty: 2720, unit: 'Mtrs', supplyRate: includeRates ? 530 : 0, erectionRate: includeRates ? 60 : 0 },
        { id: 'rn-1-4', sNo: '4', description: 'Supply and End Termination for Above Cable', qty: 64, unit: 'Nos', supplyRate: includeRates ? 180 : 0, erectionRate: includeRates ? 120 : 0 },
        { id: 'rn-1-5', sNo: '5', description: 'Supply and Erection of 450X50 mm Perforated Cable Tray', qty: 54, unit: 'Mtrs', supplyRate: includeRates ? 1850 : 0, erectionRate: includeRates ? 380 : 0 },
        { id: 'rn-1-6', sNo: '6', description: 'Supply and Erection of 200X50 mm Perforated Cable Tray', qty: 54, unit: 'Mtrs', supplyRate: includeRates ? 1250 : 0, erectionRate: includeRates ? 340 : 0 },
        { id: 'rn-1-7', sNo: '7', description: 'Supply and Erection of 100X50 mm Perforated Cable Tray', qty: 72, unit: 'Mtrs', supplyRate: includeRates ? 950 : 0, erectionRate: includeRates ? 320 : 0 },
        { id: 'rn-1-8', sNo: '8', description: 'Supply and Erection of 50X6 mm GI Flat for Cable Tray Earthing', qty: 108, unit: 'Mtrs', supplyRate: includeRates ? 340 : 0, erectionRate: includeRates ? 140 : 0 },
        { id: 'rn-1-9', sNo: '9', description: 'Supply and Erection of 25X3 mm GI Flat for Cable Tray Earthing', qty: 45, unit: 'Mtrs', supplyRate: includeRates ? 180 : 0, erectionRate: includeRates ? 90 : 0 },
        { id: 'rn-1-10', sNo: '10', description: 'Supply and Erection of 8 SWG Cu Wire for Tray Earthing', qty: 145, unit: 'Mtrs', supplyRate: includeRates ? 210 : 0, erectionRate: includeRates ? 40 : 0 },
        { id: 'rn-1-11', sNo: '11', description: 'Supply and Fixing of Blue Sheet for Transformer Incoming Side', qty: 75, unit: 'Mtrs', supplyRate: includeRates ? 650 : 0, erectionRate: includeRates ? 180 : 0 },
        { id: 'rn-1-12', sNo: '12', description: 'Supply and Erection of DB, Cable Tray Support for Using MS Material with Necessary Accessories etc.,', qty: 410, unit: 'Kgs', supplyRate: includeRates ? 120 : 0, erectionRate: includeRates ? 60 : 0 },
        { id: 'rn-1-13', sNo: '13', description: 'Supply and Fixing of Identification Sticker and Metal cable Tag for Cable Side', qty: 1, unit: 'Lot', supplyRate: includeRates ? 45000 : 0, erectionRate: includeRates ? 25000 : 0 },
      ],
    },
    {
      sectionNumber: '2.0',
      title: 'Assembly Jig - 7 Nos',
      lines: [
        { id: 'rn-2-1', sNo: '1', description: 'Supply and Erection of 4 Way 7 Segment DB with Incomer 63A 4P MCB-1 No, Outgoings: 40A 2P RCBO- 3 Nos, 6A SP MCB - 24 Nos', qty: 1, unit: "No's", supplyRate: includeRates ? 24500 : 0, erectionRate: includeRates ? 4500 : 0 },
        { id: 'rn-2-2', sNo: '2', description: 'Supply and Laying of 4CX25 Sq mm Cu Ar Cable', qty: 125, unit: 'Mtrs', supplyRate: includeRates ? 1998 : 0, erectionRate: includeRates ? 140 : 0 },
        { id: 'rn-2-3', sNo: '3', description: 'Supply and Termination for Above Cable', qty: 2, unit: "No's", supplyRate: includeRates ? 1450 : 0, erectionRate: includeRates ? 650 : 0 },
        { id: 'rn-2-4', sNo: '4', description: 'Supply and Erection of 1Ph Industrial Plug And Socket with 6A DP MCB ( Make : Hensel )', qty: 7, unit: "No's", supplyRate: includeRates ? 9400 : 0, erectionRate: includeRates ? 1200 : 0 },
        { id: 'rn-2-5', sNo: '5', description: 'Supply and Laying of 3CX4 Sq mm Cu Flex Cable', qty: 250, unit: 'Mtrs', supplyRate: includeRates ? 290 : 0, erectionRate: includeRates ? 80 : 0 },
        { id: 'rn-2-6', sNo: '6', description: 'Supply and Termination for Above Cable', qty: 14, unit: "No's", supplyRate: includeRates ? 350 : 0, erectionRate: includeRates ? 300 : 0 },
        { id: 'rn-2-7', sNo: '7', description: 'Supply and Erection of 450X50 mm Perforated Cable Tray', qty: 20, unit: 'Mtrs', supplyRate: includeRates ? 1850 : 0, erectionRate: includeRates ? 380 : 0 },
        { id: 'rn-2-8', sNo: '8', description: 'Supply and Erection of 100X50 mm Perforated Cable Tray', qty: 50, unit: 'Mtrs', supplyRate: includeRates ? 950 : 0, erectionRate: includeRates ? 320 : 0 },
        { id: 'rn-2-9', sNo: '9', description: 'Supply and Erection of 50X6 mm GI Flat for Cable Tray Earthing', qty: 40, unit: 'Mtrs', supplyRate: includeRates ? 340 : 0, erectionRate: includeRates ? 140 : 0 },
        { id: 'rn-2-10', sNo: '10', description: 'Supply and Erection of 8 SWG Cu Wire for Tray Earthing', qty: 75, unit: 'Mtrs', supplyRate: includeRates ? 210 : 0, erectionRate: includeRates ? 40 : 0 },
        { id: 'rn-2-11', sNo: '11', description: 'Supply and Erection of DB, Cable Tray , Socket Box Support for Using MS Material with Necessary Accessories etc.,', qty: 150, unit: 'Kgs', supplyRate: includeRates ? 120 : 0, erectionRate: includeRates ? 60 : 0 },
        { id: 'rn-2-12', sNo: '12', description: 'Supply and Fixing of DB Safety Guard', qty: 1, unit: "No's", supplyRate: includeRates ? 4500 : 0, erectionRate: includeRates ? 1200 : 0 },
      ],
    },
    {
      sectionNumber: '3.0',
      title: 'Fan - 20 Nos',
      lines: [
        { id: 'rn-3-1', sNo: '1', description: 'Supply and Erection of 8 Way 7 Segment DB with Incomer 63A 4P MCB-1 No, Outgoings: 40A 2P RCBO- 3 Nos, 6A SP MCB - 24 Nos', qty: 2, unit: "No's", supplyRate: includeRates ? 24500 : 0, erectionRate: includeRates ? 4500 : 0 },
        { id: 'rn-3-2', sNo: '2', description: 'Supply and Laying of 4CX25 Sq mm Cu Ar Cable', qty: 300, unit: 'Mtrs', supplyRate: includeRates ? 1998 : 0, erectionRate: includeRates ? 140 : 0 },
        { id: 'rn-3-3', sNo: '3', description: 'Supply and Termination for Above Cable', qty: 4, unit: "No's", supplyRate: includeRates ? 1450 : 0, erectionRate: includeRates ? 650 : 0 },
        { id: 'rn-3-4', sNo: '4', description: 'Supply and Erection of 3Ph Wall Mounted Mancooler fan -750 W ( Make - Almonard)', qty: 20, unit: "No's", supplyRate: includeRates ? 16000 : 0, erectionRate: includeRates ? 2400 : 0 },
        { id: 'rn-3-5', sNo: '5', description: 'Supply and Erection of 3Ph DOL Starter for Fan', qty: 20, unit: "No's", supplyRate: includeRates ? 5400 : 0, erectionRate: includeRates ? 1200 : 0 },
        { id: 'rn-3-6', sNo: '6', description: 'Supply and Erection of 4 Way Non-Metalic Junction Box with Connector ( Make - Hensel )', qty: 20, unit: "No's", supplyRate: includeRates ? 840 : 0, erectionRate: includeRates ? 240 : 0 },
        { id: 'rn-3-7', sNo: '7', description: 'Supply and Laying of 4CX2.5 Sq mm Cu Ar Cable', qty: 800, unit: 'Mtrs', supplyRate: includeRates ? 245 : 0, erectionRate: includeRates ? 80 : 0 },
        { id: 'rn-3-8', sNo: '8', description: 'Supply and Termination for Above Cable', qty: 40, unit: "No's", supplyRate: includeRates ? 350 : 0, erectionRate: includeRates ? 300 : 0 },
        { id: 'rn-3-9', sNo: '9', description: 'Supply and Laying of 4CX2.5 Sq mm Cu Flex Cable', qty: 600, unit: 'Mtrs', supplyRate: includeRates ? 240 : 0, erectionRate: includeRates ? 50 : 0 },
        { id: 'rn-3-10', sNo: '10', description: 'Supply and Termination for Above Cable', qty: 40, unit: "No's", supplyRate: includeRates ? 350 : 0, erectionRate: includeRates ? 300 : 0 },
        { id: 'rn-3-11', sNo: '11', description: 'Supply and Erection of Wall Mouting 75X75X3 mm Square Tube Support', qty: 135, unit: 'Kgs', supplyRate: includeRates ? 120 : 0, erectionRate: includeRates ? 80 : 0 },
        { id: 'rn-3-12', sNo: '12', description: 'Supply and fixing of Base Plate 300X300X10mm', qty: 60, unit: "No's", supplyRate: includeRates ? 450 : 0, erectionRate: includeRates ? 150 : 0 },
        { id: 'rn-3-13', sNo: '13', description: 'Supply and Erection of Safety Rope', qty: 80, unit: 'Mtrs', supplyRate: includeRates ? 90 : 0, erectionRate: includeRates ? 30 : 0 },
        { id: 'rn-3-14', sNo: '14', description: 'Supply and fixing of Safty d Clamp', qty: 80, unit: "No's", supplyRate: includeRates ? 240 : 0, erectionRate: includeRates ? 120 : 0 },
      ],
    },
  ];

  return rawSections.map((sec, idx) => {
    const computed = computeSectionTotals(sec.lines as BOQLine[]);
    return {
      id: `sec-rn-${idx + 1}-${Date.now()}`,
      sectionNumber: sec.sectionNumber,
      title: sec.title,
      items: computed.items,
      sectionSupplyTotal: computed.supplyTotal,
      sectionErectionTotal: computed.erectionTotal,
      sectionGrandTotal: computed.grandTotal,
    };
  });
}

/**
 * Template 2: Commercial Interior Power & Lighting BOQ
 * As seen in image.png
 */
export function getInteriorLightingTemplate(includeRates: boolean = true): BOQSection[] {
  const rawSections: { sectionNumber: string; title: string; lines: Array<Omit<BOQLine, 'supplyAmount' | 'erectionAmount' | 'totalAmount'>> }[] = [
    {
      sectionNumber: '1.0',
      title: 'CIRCUIT MAINS / POWER WIRING',
      lines: [
        {
          id: 'int-1-1',
          sNo: '1.00',
          description: 'Wiring to the Circuit mains (DB to switch board /power point) using 2 Runs of 2.5sqmm. with 1Run of 1.5 sqmm multi strand PVC insulated copper conductor in existing PVC conduit for Lighting & power circuit',
          qty: 560,
          unit: 'Mtrs',
          supplyRate: includeRates ? 155 : 0,
          erectionRate: includeRates ? 40 : 0,
        },
        {
          id: 'int-1-2',
          sNo: '2.00',
          description: 'Wiring to the Circuit mains (DB to switch board /power point) using 2 Runs of 4.0 sqmm. with 1Run of 2.5 sqmm multi strand PVC insulated copper conductor in existing PVC conduit for AC',
          qty: 450,
          unit: 'Mtrs',
          supplyRate: includeRates ? 195 : 0,
          erectionRate: includeRates ? 45 : 0,
        },
        {
          id: 'int-1-3',
          sNo: '3.00',
          description: 'Wiring to the Circuit mains (DB to switch board /power point) using 2 Runs of 1.5sqmm. with 1Run of 1.0 sqmm multi strand PVC insulated copper conductor (FRLS) in existing PVC conduit for Emergency Light',
          qty: 400,
          unit: 'Mtrs',
          supplyRate: includeRates ? 120 : 0,
          erectionRate: includeRates ? 35 : 0,
        },
      ],
    },
    {
      sectionNumber: '2.0',
      title: 'LIGHT POINT WIRING',
      lines: [
        { id: 'int-2-1', sNo: 'a', description: 'Wiring to the light points using 3 Runs of 1.5sqmm multi strand PVC insulated copper conductor (FRLS) wire (6Mtr length)', qty: 15, unit: 'Pts.', supplyRate: includeRates ? 950 : 0, erectionRate: includeRates ? 270 : 0 },
        { id: 'int-2-2', sNo: 'b', description: 'Secondary light Point maximum 3Mtr Length (10 Feet)', qty: 20, unit: 'Pts.', supplyRate: includeRates ? 650 : 0, erectionRate: includeRates ? 220 : 0 },
        {
          id: 'int-2-3',
          sNo: 'c',
          description: 'Fan Point',
          qty: 8,
          unit: 'Pts.',
          supplyRate: includeRates ? 1250 : 0,
          erectionRate: includeRates ? 350 : 0,
          components: [
            {
              id: 'comp-fp-1',
              name: '1200mm Heavy Duty Ceiling Fan',
              specification: '1200mm sweep, white with down rod & safety wire',
              qtyPerUnit: 1,
              totalQty: 8,
              unit: 'Nos',
              unitCost: 2100,
              totalCost: 16800,
            },
            {
              id: 'comp-fp-2',
              slNoRef: 4,
              name: '1.5 Sq.mm wire-green 300mtrs (Excel Stock #4)',
              specification: '1.5 Sq.mm FRLS Copper Wire for Fan Loop',
              qtyPerUnit: 15,
              totalQty: 120,
              unit: 'Mtrs',
              unitCost: 14,
              totalCost: 1680,
            },
            {
              id: 'comp-fp-3',
              name: '25mm Rigid PVC Conduit Pipe',
              specification: '25mm ISI Medium Duty Conduit',
              qtyPerUnit: 3,
              totalQty: 24,
              unit: 'Mtrs',
              unitCost: 38,
              totalCost: 912,
            },
            {
              id: 'comp-fp-4',
              name: '6A Modular 1-Way Switch with Plate',
              specification: '6A 230V Modular Switch',
              qtyPerUnit: 1,
              totalQty: 8,
              unit: 'Nos',
              unitCost: 95,
              totalCost: 760,
            },
            {
              id: 'comp-fp-5',
              name: '2 Module Concealed Metal Back Box',
              specification: 'Wall mounting GI Box',
              qtyPerUnit: 1,
              totalQty: 8,
              unit: 'Nos',
              unitCost: 65,
              totalCost: 520,
            },
          ],
        },
        { id: 'int-2-4', sNo: 'd', description: 'Exhaus Fan Point', qty: 3, unit: 'Pts.', supplyRate: includeRates ? 950 : 0, erectionRate: includeRates ? 270 : 0 },
        { id: 'int-2-5', sNo: 'e', description: 'Supply and Fixing of backbox and installation of 5A socket (switched socket supply your scope)', qty: 40, unit: 'Set', supplyRate: includeRates ? 180 : 0, erectionRate: includeRates ? 280 : 0 },
        { id: 'int-2-6', sNo: 'f', description: 'Supply and Fixing of backbox and installation of 15A socket (switched socket supply your scope)', qty: 20, unit: 'Set', supplyRate: includeRates ? 180 : 0, erectionRate: includeRates ? 280 : 0 },
        { id: 'int-2-7', sNo: 'g', description: 'Supply and Fixing of backbox and installation of 25A socket for Ac (switched socket supply your scope)', qty: 15, unit: 'Set', supplyRate: includeRates ? 180 : 0, erectionRate: includeRates ? 350 : 0 },
        { id: 'int-2-8', sNo: 'h', description: 'Termination of cables and wires', qty: 150, unit: 'Set', supplyRate: includeRates ? 60 : 0, erectionRate: includeRates ? 30 : 0 },
      ],
    },
    {
      sectionNumber: '3.0',
      title: 'EMPTY PVC CONDUIT',
      lines: [
        {
          id: 'int-3-1',
          sNo: '1.00',
          description: '25mm PVC Conduit and accessories in floor / ceiling including necessary acc.',
          qty: 300,
          unit: 'Mtrs',
          supplyRate: includeRates ? 68 : 0,
          erectionRate: includeRates ? 35 : 0,
        },
      ],
    },
    {
      sectionNumber: '4.0',
      title: 'JUNCTION BOXES',
      lines: [
        {
          id: 'int-4-1',
          sNo: '1.00',
          description: 'Supply and Erection of 150x150 Junction Boxes (Excel Stock #85)',
          qty: 18,
          unit: 'Nos',
          slNoRef: 85,
          itemId: 'itm-085',
          supplyRate: includeRates ? 480 : 0,
          erectionRate: includeRates ? 220 : 0,
        },
      ],
    },
    {
      sectionNumber: '5.0',
      title: 'LIGHT FITTINGS',
      lines: [
        { id: 'int-5-1', sNo: '1.00', description: 'Fixing, connecting, commissioning of 18W LED Fitting', qty: 38, unit: 'Nos', supplyRate: 0, erectionRate: includeRates ? 180 : 0 },
        { id: 'int-5-2', sNo: '2.00', description: 'Fixing, connecting, commissioning of Linear light Fitting', qty: 20, unit: 'Mtr', supplyRate: 0, erectionRate: includeRates ? 280 : 0 },
        { id: 'int-5-3', sNo: '3.00', description: 'Fixing, connecting, commissioning of Ceiling Fan', qty: 8, unit: 'Nos', supplyRate: 0, erectionRate: includeRates ? 280 : 0 },
        { id: 'int-5-4', sNo: '4.00', description: 'Supply, Fixing, connecting, commissioning of Fan Down Rod', qty: 8, unit: 'Nos', supplyRate: includeRates ? 120 : 0, erectionRate: includeRates ? 80 : 0 },
        { id: 'int-5-5', sNo: '5.00', description: 'Fixing of strip light fitting with driver', qty: 40, unit: 'Mtr', supplyRate: 0, erectionRate: includeRates ? 90 : 0 },
        { id: 'int-5-6', sNo: '6.00', description: 'Towards charges for cutting of wall and allied works', qty: 2, unit: 'Set', supplyRate: 0, erectionRate: includeRates ? 8000 : 0 },
      ],
    },
  ];

  return rawSections.map((sec, idx) => {
    const computed = computeSectionTotals(sec.lines as BOQLine[]);
    return {
      id: `sec-int-${idx + 1}-${Date.now()}`,
      sectionNumber: sec.sectionNumber,
      title: sec.title,
      items: computed.items,
      sectionSupplyTotal: computed.supplyTotal,
      sectionErectionTotal: computed.erectionTotal,
      sectionGrandTotal: computed.grandTotal,
    };
  });
}
