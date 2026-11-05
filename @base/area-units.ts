import * as SecureStore from 'expo-secure-store';
import { formatNumber as formatGroupedNumber, type NumberingSystem } from '@neup/numbering-system';

export type AreaUnitPreference = 'Aana system' | 'Meter system' | 'Feet system' | 'Kattha system';

const PREFERENCE_KEY = 'settings.unitPreference';
const SQ_METERS_PER_AANA = 31.796;
const AANA_PER_ROPANI = 16;
const SQ_METERS_PER_KATTHA = 338.63;
const SQ_METERS_PER_SQ_FOOT = 0.09290304;

// Return true when a price basis represents a rate for one area unit.
export function isPricePerAreaUnit(basis: unknown): boolean {
  if (typeof basis !== 'string') return false;
  const normalized = basis.toLowerCase().replace(/[^a-z]/g, '');
  return normalized.includes('perunit') || normalized.includes('perana') || normalized.includes('perropani') || normalized.includes('perkattha') || normalized.includes('persqm') || normalized.includes('persquaremeter') || normalized.includes('persqft') || normalized.includes('persquarefoot');
}

// Format a price basis using the user's preferred area unit and slash-separated periods.
export function formatPropertyPrice(price: unknown, area: unknown, areaUnit: unknown, preference: AreaUnitPreference, numberingSystem: NumberingSystem = 'International'): string {
  if (price == null) return 'Price on request';
  if (typeof price !== 'object') {
    const amount = Number(price);
    const formattedAmount = Number.isFinite(amount) ? formatGroupedNumber(amount, numberingSystem) : String(price);
    return `NPR ${formattedAmount}`;
  }
  const record = price as Record<string, unknown>;
  const rawAmount = record.amount;
  const amount = rawAmount == null || rawAmount === '' ? NaN : Number(rawAmount);
  const basis = typeof record.basis === 'string' ? record.basis.trim() : '';
  const currency = typeof record.currency === 'string' ? record.currency.trim() : '';
  if (!Number.isFinite(amount)) return 'Price on request';
  const displayCurrency = currency || 'NPR';
  const normalizedBasis = normalizePriceBasis(basis, preference);
  return `${displayCurrency} ${formatGroupedNumber(amount, numberingSystem)}${normalizedBasis ? ` ${normalizedBasis}` : ''}`;
}

// Render API basis identifiers with the preferred area unit and readable billing periods.
function normalizePriceBasis(basis: string, preference: AreaUnitPreference): string {
  const normalized = basis.toLowerCase().replace(/[^a-z]/g, '');
  const segments: string[] = [];
  if (normalized.includes('perunit') || normalized.includes('perana') || normalized.includes('perropani') || normalized.includes('perkattha') || normalized.includes('persqm') || normalized.includes('persquaremeter') || normalized.includes('persqft') || normalized.includes('persquarefoot')) {
    segments.push(preferredAreaUnitLabel(preference));
  }
  if (normalized.includes('permonth')) segments.push('Month');
  else if (normalized.includes('peryear')) segments.push('Month');
  else if (normalized.includes('perday')) segments.push('Day');
  else if (normalized.includes('perweek')) segments.push('Week');
  return segments.map((segment) => `/${segment}`).join('');
}

// Get the singular display label for the preferred area unit.
function preferredAreaUnitLabel(preference: AreaUnitPreference): string {
  switch (preference) {
    case 'Meter system': return 'Meter';
    case 'Feet system': return 'Sq Ft';
    case 'Kattha system': return 'Kattha';
    case 'Aana system': return 'Aana';
  }
}

// Parse a listing area value into square meters using its supplied source unit.
export function propertyAreaInSquareMeters(value: unknown, suppliedUnit?: unknown): number | null {
  const rawValue = typeof value === 'string' ? value.trim() : value;
  const embedded = typeof rawValue === 'string' ? rawValue.match(/^([\d,.]+)\s*(.*)$/) : null;
  const numericValue = typeof rawValue === 'number' ? rawValue : embedded ? Number(embedded[1].replace(/,/g, '')) : NaN;
  if (!Number.isFinite(numericValue) || numericValue < 0) return null;
  const unit = String(suppliedUnit ?? embedded?.[2] ?? '').trim().toLowerCase();
  return toSquareMeters(numericValue, unit);
}

export async function getAreaUnitPreference(): Promise<AreaUnitPreference> {
  try {
    const saved = await SecureStore.getItemAsync(PREFERENCE_KEY);
    if (saved === 'Meter system' || saved === 'Feet system' || saved === 'Kattha system' || saved === 'Aana system') return saved;
  } catch {
    // Keep the default unit when the saved preference is unavailable.
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

/** Formats converted area measurements with compact decimal precision. */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
}
