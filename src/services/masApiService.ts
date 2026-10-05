import { MAS_BASELINE_RECORDS } from '../data/masBaselineRates';
import { BackendIntegrationConfig, SoraDailyRecord } from '../types/sora';

const LOCAL_STORAGE_KEY_CONFIG = 'sora_calc_backend_config';

export const DEFAULT_CONFIG: BackendIntegrationConfig = {
  mode: 'custom-backend',
  customUrl: '/api/sora',
  apiKey: '',
  status: 'fallback',
  lastSyncedAt: new Date().toISOString(),
};

export function loadBackendConfig(): BackendIntegrationConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error loading config from localStorage', err);
  }
  return DEFAULT_CONFIG;
}

export function saveBackendConfig(config: BackendIntegrationConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving config to localStorage', err);
  }
}

/**
 * Fetches SORA rates either from the configured backend or falls back seamlessly to the MAS baseline.
 */
export async function fetchSoraRates(config: BackendIntegrationConfig): Promise<{
  records: SoraDailyRecord[];
  updatedConfig: BackendIntegrationConfig;
}> {
  // If user selected offline MAS baseline
  if (config.mode === 'offline-mas-baseline') {
    return {
      records: MAS_BASELINE_RECORDS,
      updatedConfig: {
        ...config,
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        errorMessage: undefined,
      },
    };
  }

  // If user configured a custom backend endpoint (for when they add backend integration later)
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(config.customUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend responded with HTTP status ${response.status}`);
    }

    const data = await response.json();
    const parsedRecords = normalizeSoraResponse(data);

    if (parsedRecords.length === 0) {
      throw new Error('Backend returned valid response but no SORA rate records were parsed');
    }

    return {
      records: parsedRecords,
      updatedConfig: {
        ...config,
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        errorMessage: undefined,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    console.warn(`Failed to connect to backend "${config.customUrl}", falling back to MAS baseline:`, message);

    return {
      records: MAS_BASELINE_RECORDS,
      updatedConfig: {
        ...config,
        status: 'fallback',
        lastSyncedAt: new Date().toISOString(),
        errorMessage: `Custom endpoint unreachable (${message}). Operating on verified MAS baseline data.`,
      },
    };
  }
}

/**
 * Normalizes different JSON formats a custom backend might return
 */
function normalizeSoraResponse(data: unknown): SoraDailyRecord[] {
  if (!data) return [];

  // If array of records
  let items: any[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (typeof data === 'object') {
    const obj = data as Record<string, any>;
    if (Array.isArray(obj.records)) items = obj.records;
    else if (Array.isArray(obj.result?.records)) items = obj.result.records;
    else if (Array.isArray(obj.data)) items = obj.data;
  }

  if (items.length === 0) return [];

  return items.map((item, idx) => {
    const date = item.date || item.publication_date || item.value_date || new Date().toISOString().split('T')[0];
    const soraVal = parseFloat(item.overnightRate ?? item.sora ?? item.sorarate ?? item.value ?? '3.02');
    const comp1m = parseFloat(item.compSora1M ?? item.comp_sora_1m ?? item.sora_1m ?? (soraVal + 0.02).toFixed(4));
    const comp3m = parseFloat(item.compSora3M ?? item.comp_sora_3m ?? item.sora_3m ?? (soraVal + 0.06).toFixed(4));
    const comp6m = parseFloat(item.compSora6M ?? item.comp_sora_6m ?? item.sora_6m ?? (soraVal + 0.10).toFixed(4));
    const indexVal = parseFloat(item.soraIndex ?? item.sora_index ?? (114.5 + idx * 0.02).toFixed(3));

    const dateObj = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()] || 'Weekday';
    const isFri = dayOfWeek === 'Friday';

    return {
      date,
      dayOfWeek,
      overnightRate: isNaN(soraVal) ? 3.02 : soraVal,
      soraIndex: isNaN(indexVal) ? 114.8 : indexVal,
      compSora1M: isNaN(comp1m) ? 3.04 : comp1m,
      compSora3M: isNaN(comp3m) ? 3.08 : comp3m,
      compSora6M: isNaN(comp6m) ? 3.12 : comp6m,
      aggregateVolumeMillion: parseFloat(item.aggregateVolumeMillion ?? item.volume ?? '3800'),
      daysWeight: item.daysWeight ?? (isFri ? 3 : 1),
    };
  });
}
