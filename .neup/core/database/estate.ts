import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

/** The local SQLite database reserved for estate data. */
export const estateDatabase = SQLite.openDatabaseSync('estate.db');

/** Run database setup before using estateDatabase. */
export function initializeEstateDatabase() {
  estateDatabase.execSync('PRAGMA journal_mode = WAL;');
  const activityColumns = estateDatabase.getAllSync<{ name: string }>('PRAGMA table_info(activities)');
  const hasNewActivitySchema = activityColumns.some(({ name }) => name === 'activity_type');
  if (activityColumns.length > 0 && !hasNewActivitySchema) {
    estateDatabase.execSync('DROP TABLE activities;');
  }
  estateDatabase.execSync(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY NOT NULL,
      images TEXT,
      type TEXT,
      purpose TEXT,
      title TEXT,
      description TEXT,
      location TEXT,
      spacing TEXT,
      features TEXT,
      price TEXT,
      nearby TEXT,
      agents TEXT,
      savedOn TEXT,
      lifestyleIndex TEXT,
      link TEXT,
      savedVia TEXT
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY NOT NULL,
      activity_type TEXT NOT NULL,
      activity_on TEXT NOT NULL,
      activity_on_data TEXT,
      more_details TEXT,
      pushed_on TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      accountId TEXT NOT NULL UNIQUE,
      displayImage TEXT,
      type TEXT NOT NULL,
      loadedOn TEXT NOT NULL,
      isSelf INTEGER NOT NULL DEFAULT 0,
      createdOn TEXT
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      personName TEXT NOT NULL,
      phone TEXT NOT NULL,
      requirement TEXT NOT NULL,
      association TEXT NOT NULL,
      createdOn TEXT NOT NULL
    );
  `);
}

function json(value: unknown) {
  return value === undefined || value === null ? null : JSON.stringify(value);
}

function parseJson(value: unknown) {
  if (typeof value !== 'string' || !value) return value ?? undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function saveAuthenticatedAccount(account: { accountId: string; accountPhoto?: string; accountType?: string; createdOn?: string }) {
  if (!account.accountId) return;
  const loadedOn = new Date().toISOString();
  let displayImage = account.accountPhoto ?? null;
  if (displayImage && /^https?:\/\//i.test(displayImage) && FileSystem.documentDirectory) {
    const safeId = account.accountId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const directory = `${FileSystem.documentDirectory}accounts/`;
    const localUri = `${directory}${safeId}.jpg`;
    try {
      if (!(await FileSystem.getInfoAsync(localUri)).exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        const downloaded = await FileSystem.downloadAsync(displayImage, `${localUri}.download`);
        const compressed = await ImageManipulator.manipulateAsync(downloaded.uri, [{ resize: { width: 640 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG });
        await FileSystem.moveAsync({ from: compressed.uri, to: localUri });
        await FileSystem.deleteAsync(downloaded.uri, { idempotent: true });
      }
      displayImage = localUri;
    } catch (error) { console.warn('[accounts] unable to cache account image', account.accountId, error); }
  }
  const accountType = ['user', 'agent', 'agency'].includes(account.accountType ?? '') ? account.accountType! : 'user';
  estateDatabase.runSync(
    `INSERT INTO accounts (id, accountId, displayImage, type, loadedOn, isSelf, createdOn) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(accountId) DO UPDATE SET displayImage=excluded.displayImage, type=excluded.type, loadedOn=excluded.loadedOn, isSelf=excluded.isSelf`,
    account.accountId, account.accountId, displayImage, accountType, loadedOn, 1, account.createdOn ?? loadedOn,
  );
}

export function getStoredSelfAccount() {
  return estateDatabase.getFirstSync<{ accountId: string; displayImage: string | null; type: string }>('SELECT accountId, displayImage, type FROM accounts WHERE isSelf = 1 ORDER BY loadedOn DESC LIMIT 1') ?? null;
}

export function saveVisitedProperty(property: Record<string, any>) {
  const propertyId = String(property.id);
  const savedOn = new Date().toISOString();

  estateDatabase.runSync(
    `INSERT OR REPLACE INTO properties
      (id, images, type, purpose, title, description, location, spacing, features, price, nearby, agents, savedOn, lifestyleIndex, link, savedVia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    propertyId,
    json(property.images),
    json(property.type ?? property.category),
    json(property.purpose),
    property.title ?? null,
    property.description ?? null,
    json(property.location),
    json(property.spacing),
    json(property.features ?? property.amenities),
    json(property.price ?? property.pricing),
    json(property.nearby),
    json(property.agents ?? property.listingAgent),
    savedOn,
    json(property.lifestyleIndex),
    property.link ?? null,
    json(property.savedVia),
  );

  recordActivity('property.view', propertyId, { source: 'propertyPage' });
}

export function recordActivity(
  activityType: string,
  activityOn: unknown,
  moreDetails?: unknown,
  activityOnData?: unknown,
) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  estateDatabase.runSync(
    `INSERT INTO activities
      (id, activity_type, activity_on, activity_on_data, more_details, pushed_on)
      VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    activityType,
    typeof activityOn === 'string' ? activityOn : JSON.stringify(activityOn),
    json(activityOnData),
    json(moreDetails),
    null,
  );
}

export function saveReferral(referral: { type: string[]; personName: string; phone: string; requirement: string; association: string }) {
  const createdOn = new Date().toISOString();
  estateDatabase.runSync(
    `INSERT INTO referrals (id, type, personName, phone, requirement, association, createdOn) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    JSON.stringify(referral.type),
    referral.personName.trim(),
    referral.phone.trim(),
    referral.requirement.trim(),
    referral.association,
    createdOn,
  );
}

export function getReferrals() {
  return estateDatabase.getAllSync<{ id: string; type: string; personName: string; phone: string; requirement: string; association: string; createdOn: string }>('SELECT * FROM referrals ORDER BY createdOn DESC');
}

export function getReferral(id: string) {
  return estateDatabase.getFirstSync<{ id: string; type: string; personName: string; phone: string; requirement: string; association: string; createdOn: string }>('SELECT * FROM referrals WHERE id = ?', id) ?? null;
}

export function getStoredProperty(id: string): Record<string, any> | null {
  const row = estateDatabase.getFirstSync<{
    id: string;
    images: string | null;
    type: string | null;
    purpose: string | null;
    title: string | null;
    description: string | null;
    location: string | null;
    spacing: string | null;
    features: string | null;
    price: string | null;
    nearby: string | null;
    agents: string | null;
    savedOn: string | null;
    lifestyleIndex: string | null;
    link: string | null;
    savedVia: string | null;
  }>('SELECT * FROM properties WHERE id = ?', id);

  if (!row) return null;
  return {
    id: row.id,
    images: parseJson(row.images),
    type: parseJson(row.type),
    category: parseJson(row.type),
    purpose: parseJson(row.purpose),
    title: row.title,
    description: row.description,
    location: parseJson(row.location),
    spacing: parseJson(row.spacing),
    features: parseJson(row.features),
    amenities: parseJson(row.features),
    price: parseJson(row.price),
    pricing: parseJson(row.price),
    nearby: parseJson(row.nearby),
    agents: parseJson(row.agents),
    savedOn: row.savedOn,
    lifestyleIndex: parseJson(row.lifestyleIndex),
    link: row.link,
    savedVia: parseJson(row.savedVia),
  };
}

export function getStoredProperties(): Record<string, any>[] {
  const rows = estateDatabase.getAllSync<{ id: string; images: string | null; title: string | null; description: string | null; location: string | null; price: string | null }>('SELECT id, images, title, description, location, price FROM properties ORDER BY savedOn DESC');
  return rows.map((row) => ({ id: row.id, images: parseJson(row.images), title: row.title, description: row.description, location: parseJson(row.location), price: parseJson(row.price), pricing: parseJson(row.price) }));
}
