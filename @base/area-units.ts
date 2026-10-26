import * as SecureStore from 'expo-secure-store';

export type AreaUnitPreference = 'Aana system' | 'Meter system' | 'Feet system' | 'Kattha system';

const PREFERENCE_KEY = 'settings.unitPreference';
const SQ_METERS_PER_AANA = 31.796;
const AANA_PER_ROPANI = 16;
const SQ_METERS_PER_KATTHA = 338.63;
const SQ_METERS_PER_SQ_FOOT = 0.09290304;

export async function getAreaUnitPreference(): Promise<AreaUnitPreference> {
  try {
    const saved = await SecureStore.getItemAsync(PREFERENCE_KEY);
    if (saved === 'Meter system' || saved === 'Feet system' || saved === 'Kattha system' || saved === 'Aana system') return saved;
  } catch (error) {
    console.warn('Unable to load area unit preference:', error);
  }
  return 'Aana system';
}

export function formatPropertyArea(value: unknown, preference: AreaUnitPreference, suppliedUnit?: unknown): string | null {
  const rawValue = typeof value === 'string' ? value.trim() : value;
  const embedded = typeof rawValue === 'string' ? rawValue.match(/^([\d,.]+)\s*(.*)$/) : null;
  const numericValue = typeof rawValue === 'number' ? rawValue : embedded ? Number(embedded[1].replace(/,/g, '')) : NaN;
  if (!Number.isFinite(numericValue) || numericValue < 0) return value == null || value === '' ? null : String(value);

  const effectiveUnit = suppliedUnit ?? embedded?.[2];
  const unit = String(effectiveUnit ?? '').trim().toLowerCase();
  const squareMeters = toSquareMeters(numericValue, unit);
  if (squareMeters == null) return String(value);

  switch (preference) {
    case 'Meter system':
      return `${formatNumber(squareMeters)} m²`;
    case 'Feet system':
      return `${formatNumber(squareMeters / SQ_METERS_PER_SQ_FOOT)} ft²`;
    case 'Kattha system':
      return `${formatNumber(squareMeters / SQ_METERS_PER_KATTHA)} kattha`;
    case 'Aana system': {
      const totalAana = squareMeters / SQ_METERS_PER_AANA;
      const ropani = Math.floor(totalAana / AANA_PER_ROPANI);
      const remainingAana = totalAana - ropani * AANA_PER_ROPANI;
      if (ropani === 0) return `${formatNumber(totalAana)} aana`;
      return `${ropani} ropani ${formatNumber(remainingAana)} aana`;
    }
  }
}

function toSquareMeters(value: number, unit: string): number | null {
  if (!unit || ['m', 'm2', 'm^2', 'm²', 'sqm', 'sq m', 'square meter', 'square meters', 'meter', 'meters'].includes(unit)) return value;
  if (['ft2', 'ft^2', 'ft²', 'sqft', 'sq ft', 'square foot', 'square feet'].includes(unit)) return value * SQ_METERS_PER_SQ_FOOT;
  if (['aana', 'ana', 'aana(s)', 'anna'].includes(unit)) return value * SQ_METERS_PER_AANA;
  if (['ropani', 'ropanis'].includes(unit)) return value * SQ_METERS_PER_AANA * AANA_PER_ROPANI;
  if (['kattha', 'katthas'].includes(unit)) return value * SQ_METERS_PER_KATTHA;
  return null;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
}
