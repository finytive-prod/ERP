import { MeasurementUnit, ItemCategory, COMMON_CATEGORIES } from '../types';

export interface InferredProductDetails {
  category: ItemCategory;
  unit: MeasurementUnit;
  specification?: string;
  matchedKeyword?: string;
  suggestedUnits: MeasurementUnit[];
  reason: string;
}

export function inferCategoryAndUnit(
  inputName: string,
  existingItems?: { name: string; category: string; unit: MeasurementUnit; specification?: string }[]
): InferredProductDetails | null {
  const name = (inputName || '').trim().toLowerCase();
  if (!name || name.length < 2) return null;

  // 1. Direct or partial match against existing catalog in PostgreSQL
  if (existingItems && existingItems.length > 0) {
    const directMatch = existingItems.find(
      (item) => item.name.toLowerCase() === name
    );
    if (directMatch) {
      const cat = (COMMON_CATEGORIES.includes(directMatch.category as any)
        ? directMatch.category
        : 'Electrical Accessories') as ItemCategory;
      return {
        category: cat,
        unit: directMatch.unit,
        specification: directMatch.specification,
        matchedKeyword: directMatch.name,
        suggestedUnits: [directMatch.unit],
        reason: `Matched existing item in catalog: "${directMatch.name}"`,
      };
    }

    // Token match against existing products
    const words = name.split(/\s+/).filter((w) => w.length > 2);
    for (const item of existingItems) {
      const itemLower = item.name.toLowerCase();
      const matchCount = words.filter((w) => itemLower.includes(w)).length;
      if (matchCount >= 2 || (words.length === 1 && matchCount === 1 && words[0].length >= 4)) {
        const cat = (COMMON_CATEGORIES.includes(item.category as any)
          ? item.category
          : 'Electrical Accessories') as ItemCategory;
        return {
          category: cat,
          unit: item.unit,
          specification: item.specification,
          matchedKeyword: item.name,
          suggestedUnits: [item.unit],
          reason: `Pattern match with catalog item "${item.name}"`,
        };
      }
    }
  }

  // 2. Comprehensive electrical contracting domain knowledge rules

  // --- Wires & Cables ---
  if (
    name.includes('wire') ||
    name.includes('cable') ||
    name.includes('sq.mm') ||
    name.includes('sqmm') ||
    name.includes('core') ||
    name.includes('frls') ||
    name.includes('armoured') ||
    name.includes('submersible') ||
    name.includes('copper conductor') ||
    name.includes('aluminium cable') ||
    name.includes('polycab') ||
    name.includes('finolex') ||
    name.includes('rr kabel') ||
    name.includes('havells') ||
    name.includes('kei') ||
    name.includes('cat6') ||
    name.includes('lan cable') ||
    name.includes('coaxial') ||
    name.includes('cctv cable') ||
    name.includes('telephone wire') ||
    name.includes('flexible cable')
  ) {
    const isCoil =
      name.includes('coil') ||
      name.includes('bundle') ||
      name.includes('90m') ||
      name.includes('180m') ||
      name.includes('300m') ||
      name.includes('roll');
    return {
      category: 'Wires & Cables',
      unit: isCoil ? 'Coil' : 'Mtrs',
      specification: name.includes('sq')
        ? '1100V Grade FRLS Multi-strand Copper Conductor'
        : 'ISI Standard Electric Cable',
      matchedKeyword: 'wire / cable / conductor',
      suggestedUnits: ['Mtrs', 'Coil'],
      reason: 'Detected electrical wire, multi-core cable or conductor',
    };
  }

  // --- PVC Conduits & Fittings ---
  if (
    name.includes('conduit') ||
    name.includes('pvc pipe') ||
    name.includes('gi pipe') ||
    name.includes('pipe') ||
    name.includes('casing') ||
    name.includes('capping') ||
    name.includes('trunking') ||
    name.includes('cable tray') ||
    name.includes('raceway') ||
    name.includes('bend') ||
    name.includes('saddle') ||
    name.includes('junction box') ||
    name.includes('circular box') ||
    name.includes('fan box') ||
    name.includes('coupler') ||
    name.includes('tee') ||
    name.includes('elbow') ||
    name.includes('corrugated pipe') ||
    name.includes('flexible pipe')
  ) {
    const isFitting =
      name.includes('bend') ||
      name.includes('saddle') ||
      name.includes('box') ||
      name.includes('coupler') ||
      name.includes('clamp') ||
      name.includes('tee') ||
      name.includes('elbow');
    return {
      category: 'PVC Conduits & Fittings',
      unit: isFitting ? 'Nos' : 'Mtrs',
      specification: name.includes('25mm')
        ? '25mm Medium / Heavy Duty Rigid PVC'
        : name.includes('20mm')
        ? '20mm Medium Duty Rigid PVC'
        : 'ISI Marked Rigid Conduit & Accessories',
      matchedKeyword: isFitting ? 'conduit fitting / box' : 'conduit / pipe / trunking',
      suggestedUnits: isFitting ? ['Nos', 'Pkt'] : ['Mtrs', 'Nos'],
      reason: isFitting
        ? 'Detected conduit fitting / accessory (Nos)'
        : 'Detected electrical conduit piping or casing (Mtrs)',
    };
  }

  // --- Modular Switches & Sockets ---
  if (
    name.includes('switch') ||
    name.includes('socket') ||
    name.includes('modular') ||
    name.includes('dimmer') ||
    name.includes('regulator') ||
    name.includes('bell push') ||
    name.includes('grid plate') ||
    name.includes('cover plate') ||
    name.includes('plate') ||
    name.includes('gang box') ||
    name.includes('metal box') ||
    name.includes('flush box') ||
    name.includes('back box') ||
    name.includes('concealed box') ||
    name.includes('surface box') ||
    name.includes('module box') ||
    name.includes('roma') ||
    name.includes('crabtree') ||
    name.includes('legrand') ||
    name.includes('anchor rider') ||
    name.includes('blank plate') ||
    name.includes('rj45') ||
    name.includes('rj11') ||
    name.includes('tv socket')
  ) {
    const isSet =
      name.includes('combined') ||
      name.includes('with plate') ||
      name.includes('set') ||
      name.includes('assembly') ||
      name.includes('combo');
    return {
      category: 'Modular Switches & Sockets',
      unit: isSet ? 'Sets' : 'Nos',
      specification: name.includes('16a')
        ? '16A 230V AC Heavy Duty Modular'
        : name.includes('6a')
        ? '6A 230V AC Single Pole Modular'
        : 'ISI Grade White Polycarbonate Modular',
      matchedKeyword: 'switch / socket / plate',
      suggestedUnits: ['Nos', 'Sets'],
      reason: 'Detected modular wiring accessory, switch or socket',
    };
  }

  // --- Distribution Boards & MCBs ---
  if (
    name.includes('mcb') ||
    name.includes('rccb') ||
    name.includes('rcbo') ||
    name.includes('elcb') ||
    name.includes('mccb') ||
    name.includes('acb') ||
    name.includes('isolator') ||
    name.includes('breaker') ||
    name.includes('distribution board') ||
    name.includes('db ') ||
    name.endsWith(' db') ||
    name.includes('tpn') ||
    name.includes('spn') ||
    name.includes('vtpn') ||
    name.includes('busbar') ||
    name.includes('contactor') ||
    name.includes('overload relay') ||
    name.includes('changeover') ||
    name.includes('phase selector') ||
    name.includes('fuse') ||
    name.includes('cutout')
  ) {
    return {
      category: 'Distribution Boards & MCBs',
      unit: 'Nos',
      specification: name.includes('tpn')
        ? 'TPN Double Door Enclosure with Busbar'
        : '10kA C-Curve Modular Circuit Protection',
      matchedKeyword: 'mcb / breaker / db',
      suggestedUnits: ['Nos', 'Sets'],
      reason: 'Detected circuit breaker, isolator or distribution board',
    };
  }

  // --- Lighting & Luminaires ---
  if (
    name.includes('light') ||
    name.includes('led') ||
    name.includes('batten') ||
    name.includes('downlight') ||
    name.includes('spotlight') ||
    name.includes('panel light') ||
    name.includes('flood') ||
    name.includes('bulb') ||
    name.includes('lamp') ||
    name.includes('tube') ||
    name.includes('ceiling rose') ||
    name.includes('holder') ||
    name.includes('luminaire') ||
    name.includes('high bay') ||
    name.includes('street light') ||
    name.includes('profile light') ||
    name.includes('strip light') ||
    name.includes('rope light') ||
    name.includes('track light') ||
    name.includes('chandelier') ||
    name.includes('cob ') ||
    name.includes('driver') ||
    name.includes('ballast')
  ) {
    const isMtr = name.includes('strip') || name.includes('profile') || name.includes('rope');
    return {
      category: 'Lighting & Luminaires',
      unit: isMtr ? 'Mtrs' : 'Nos',
      specification: name.includes('led')
        ? 'Energy Efficient LED Luminaire 6500K Cool Daylight'
        : 'Electrical Lighting Luminaire & Fitting',
      matchedKeyword: isMtr ? 'strip / rope light' : 'light / led luminaire',
      suggestedUnits: isMtr ? ['Mtrs', 'Rolls'] : ['Nos', 'Sets'],
      reason: isMtr
        ? 'Detected linear strip/profile lighting (Mtrs)'
        : 'Detected luminaire, lamp or lighting fixture (Nos)',
    };
  }

  // --- Fans & Ventilation ---
  if (
    name.includes('fan') ||
    name.includes('exhaust') ||
    name.includes('mancooler') ||
    name.includes('ventilation') ||
    name.includes('blower') ||
    name.includes('sweep') ||
    name.includes('ceiling fan') ||
    name.includes('wall fan') ||
    name.includes('pedestal fan')
  ) {
    return {
      category: 'Fans & Ventilation',
      unit: 'Nos',
      specification: name.includes('1200')
        ? '1200mm Sweep Heavy Duty with Downrod'
        : 'High Air Delivery Electric Ventilation Fan',
      matchedKeyword: 'fan / ventilation',
      suggestedUnits: ['Nos', 'Sets'],
      reason: 'Detected ceiling/exhaust fan or ventilation equipment',
    };
  }

  // --- Earthing & Lightning Protection ---
  if (
    name.includes('earth') ||
    name.includes('grounding') ||
    name.includes('strip') ||
    name.includes('plate') ||
    name.includes('pit') ||
    name.includes('arrester') ||
    name.includes('bentonite') ||
    name.includes('chemical earth') ||
    name.includes('charcoal') ||
    name.includes('salt') ||
    name.includes('electrode') ||
    name.includes('rod')
  ) {
    let unit: MeasurementUnit = 'Nos';
    let suggested: MeasurementUnit[] = ['Nos'];
    if (name.includes('strip')) {
      unit = 'Mtrs';
      suggested = ['Mtrs', 'Kgs'];
    } else if (name.includes('pit') || name.includes('chamber')) {
      unit = 'Sets';
      suggested = ['Sets', 'Nos'];
    } else if (
      name.includes('compound') ||
      name.includes('chemical') ||
      name.includes('charcoal') ||
      name.includes('salt') ||
      name.includes('bentonite')
    ) {
      unit = 'Kgs';
      suggested = ['Kgs', 'Pkt'];
    } else if (name.includes('plate') || name.includes('rod') || name.includes('arrester') || name.includes('electrode')) {
      unit = 'Nos';
      suggested = ['Nos', 'Sets'];
    }

    return {
      category: 'Earthing & Lightning Protection',
      unit,
      specification: name.includes('copper')
        ? 'Electrolytic Grade Copper Conductor'
        : 'Hot Dip Galvanized (GI) Standard',
      matchedKeyword: 'earthing / lightning',
      suggestedUnits: suggested,
      reason: `Detected earthing component (${unit})`,
    };
  }

  // --- Hardware & Cable Management ---
  if (
    name.includes('tape') ||
    name.includes('screw') ||
    name.includes('raw plug') ||
    name.includes('fisher') ||
    name.includes('gland') ||
    name.includes('lug') ||
    name.includes('cable tie') ||
    name.includes('tie') ||
    name.includes('clip') ||
    name.includes('saddle clip') ||
    name.includes('fastener') ||
    name.includes('bolt') ||
    name.includes('nut') ||
    name.includes('washer') ||
    name.includes('clamp')
  ) {
    let unit: MeasurementUnit = 'Nos';
    let suggested: MeasurementUnit[] = ['Nos'];
    if (name.includes('tape')) {
      unit = 'Rolls';
      suggested = ['Rolls', 'Nos'];
    } else if (
      name.includes('screw') ||
      name.includes('tie') ||
      name.includes('raw plug') ||
      name.includes('fisher') ||
      name.includes('clip') ||
      name.includes('pkt')
    ) {
      unit = 'Pkt';
      suggested = ['Pkt', 'Nos'];
    } else if (name.includes('gland') || name.includes('lug') || name.includes('clamp')) {
      unit = 'Nos';
      suggested = ['Nos', 'Pkt'];
    }

    return {
      category: 'Hardware & Cable Management',
      unit,
      specification: name.includes('tape')
        ? 'PVC Flame Retardant Insulation Tape'
        : 'Brass / Zinc Plated Hardware Accessories',
      matchedKeyword: 'hardware / consumable',
      suggestedUnits: suggested,
      reason: `Detected hardware consumable or accessory (${unit})`,
    };
  }

  // Default fallback if no specific keyword matched
  return {
    category: 'Electrical Accessories',
    unit: 'Nos',
    specification: '',
    matchedKeyword: 'general',
    suggestedUnits: ['Nos', 'Sets', 'Lot'],
    reason: 'Defaulted to Electrical Accessories (Nos)',
  };
}
