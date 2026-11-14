import snapshot from './statistics-snapshot.json' with { type: 'json' };

export const REGIONS = {
    LV00A: 'Rīga',
    LV00C: 'Vidzeme',
    LV00B: 'Kurzeme',
    LV009: 'Zemgale',
    LV005: 'Latgale',
};

export const YEARS = [2021, 2022, 2023, 2024, 2025];
export const DEFAULT_YEAR = 2025;
export const DEFAULT_REGION = 'LV00A';
export const LAYERS = ['Population', 'Employment', 'Earnings', 'Unemployment'] as const;

export type RegionCode = keyof typeof REGIONS;
export type Layer = (typeof LAYERS)[number];
export type TableId = 'IRS031' | 'NBA031' | 'DSV041' | 'NBL061';

const sharedFilters = { AREA: ['LV', ...Object.keys(REGIONS)], TIME: YEARS.map(String) };

export const SOURCES: Record<
    TableId,
    { label: string; url: string; filters: Record<string, string[]> }
> = {
    IRS031: {
        label: 'Population',
        url: 'https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__POP__IR__IRS/IRS031/',
        filters: { ...sharedFilters, INDICATOR: ['POP_SY'], ContentsCode: ['IRS031'] },
    },
    NBA031: {
        label: 'Employment',
        url: 'https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__NBB__NBA/NBA031/',
        filters: { ...sharedFilters, AgeGroup: ['Y15-74'], ContentsCode: ['NBA0311', 'NBA0312'] },
    },
    DSV041: {
        label: 'Earnings',
        url: 'https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__DS__DSV/DSV041/',
        filters: {
            ...sharedFilters,
            GRS_NET: ['GRS', 'NET'],
            SECTOR: ['TOTAL'],
            ContentsCode: ['DSV041'],
        },
    },
    NBL061: {
        label: 'Employment by industry',
        url: 'https://data.stat.gov.lv/pxweb/en/OSP_PUB/START__EMP__NB__NBLA/NBL061/',
        filters: {
            ...sharedFilters,
            NACE: ['TOTAL', 'A', 'B-E', 'F', 'G_I', 'H_J', 'K-N', 'O', 'P', 'Q', 'R-U'],
            ContentsCode: ['NBL061', 'NBL0611'],
        },
    },
};

interface JsonStat {
    id: string[];
    size: number[];
    dimension: Record<string, { category: { index: Record<string, number> | string[] } }>;
    value: (number | null)[] | Record<number, number | null>;
    updated?: string;
}

interface TableData {
    data: JsonStat;
    fetchedAt: string;
    origin: 'bundled' | 'saved' | 'live';
}

export interface Statistics {
    tables: Partial<Record<TableId, TableData>>;
    failed: TableId[];
    errors: Partial<Record<TableId, string>>;
}

const tableIds = Object.keys(SOURCES) as TableId[];
const storageKey = 'latvia-data-desk:statistics:v1';
let cache: Statistics = { tables: readSavedTables(), failed: [], errors: {} };
let pending: Promise<Statistics> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Only replace a usable copy with a complete response for the requested selection.
// A published null is valid; absent dimensions or a truncated response are not.
function isTable(value: unknown, tableId: TableId): value is JsonStat {
    if (!isRecord(value)) {
        return false;
    }
    const { id, size, dimension, updated } = value;
    const filters = SOURCES[tableId].filters;
    if (
        !Array.isArray(id) ||
        !Array.isArray(size) ||
        id.length !== Object.keys(filters).length ||
        new Set(id).size !== id.length ||
        id.length !== size.length ||
        !isRecord(dimension) ||
        (updated !== undefined &&
            (typeof updated !== 'string' || !Number.isFinite(Date.parse(updated))))
    ) {
        return false;
    }

    let cells = 1;
    for (let i = 0; i < id.length; i++) {
        const name: unknown = id[i];
        if (typeof name !== 'string' || !Object.hasOwn(filters, name)) {
            return false;
        }
        const codes = filters[name]!;
        const entry = dimension[name];
        if (!isRecord(entry) || !isRecord(entry.category) || size[i] !== codes.length) {
            return false;
        }
        const index = entry.category.index;
        if (
            (!Array.isArray(index) && !isRecord(index)) ||
            Object.keys(index).length !== codes.length
        ) {
            return false;
        }
        const positions = codes.map((code) =>
            Array.isArray(index) ? index.indexOf(code) : index[code],
        );
        if (
            new Set(positions).size !== codes.length ||
            positions.some(
                (position) =>
                    typeof position !== 'number' ||
                    !Number.isInteger(position) ||
                    position < 0 ||
                    position >= codes.length,
            )
        ) {
            return false;
        }
        cells *= codes.length;
    }

    const values = value.value;
    if (Array.isArray(values)) {
        if (values.length !== cells) {
            return false;
        }
    } else if (
        !isRecord(values) ||
        Object.keys(values).some((key) => !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= cells)
    ) {
        return false;
    }
    return Object.values(values).every(
        (cell) => cell === null || (typeof cell === 'number' && Number.isFinite(cell)),
    );
}

function readSavedTables(): Statistics['tables'] {
    const tables: Statistics['tables'] = {};
    for (const id of tableIds) {
        tables[id] = {
            data: snapshot.tables[id],
            fetchedAt: snapshot.retrievedAt,
            origin: 'bundled',
        };
    }
    try {
        const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
        if (isRecord(saved)) {
            for (const id of tableIds) {
                const table = saved[id];
                if (
                    isRecord(table) &&
                    typeof table.fetchedAt === 'string' &&
                    Number.isFinite(Date.parse(table.fetchedAt)) &&
                    isTable(table.data, id) &&
                    Date.parse(table.data.updated ?? table.fetchedAt) >=
                        Date.parse(snapshot.tables[id].updated)
                ) {
                    tables[id] = { data: table.data, fetchedAt: table.fetchedAt, origin: 'saved' };
                }
            }
        }
    } catch {
        // Unavailable storage or a damaged cache must not hide the bundled data.
    }
    return tables;
}

function saveTables(tables: Statistics['tables']) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(tables));
    } catch {
        // Storage may be disabled or full. In-memory and bundled copies still work.
    }
}

export function getInitialStatistics(): Statistics {
    return cache;
}

function describeFailure(reason: unknown): string {
    if (reason instanceof Error) {
        if (reason.name === 'TimeoutError' || reason.name === 'AbortError') {
            return 'The request timed out after 15 seconds.';
        }
        if (reason instanceof TypeError) {
            return 'Could not connect to the statistics service.';
        }
        if (reason instanceof SyntaxError) {
            return 'The statistics service returned invalid JSON.';
        }
        return reason.message;
    }
    return 'The live update failed.';
}

async function fetchTable(id: TableId): Promise<TableData> {
    const url = new URL(`https://api.stat.gov.lv/api/v2/tables/${id}/data`);

    url.searchParams.set('lang', 'en');
    url.searchParams.set('outputFormat', 'json-stat2');

    for (const [dimension, codes] of Object.entries(SOURCES[id].filters)) {
        url.searchParams.set(`valueCodes[${dimension}]`, codes.join(','));
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(15_000), cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`The statistics service returned HTTP ${response.status}.`);
    }

    const data: unknown = await response.json();
    if (!isTable(data, id)) {
        throw new Error('The statistics service returned an incomplete or unexpected dataset.');
    }
    return { data, fetchedAt: new Date().toISOString(), origin: 'live' };
}

// Show saved data immediately, then share one live update between React mounts.
// Retry only failed sources; failed updates never remove the last usable copy.
export function loadStatistics(refresh = false): Promise<Statistics> {
    if (pending) {
        return pending;
    }
    const ids = tableIds.filter(
        (id) => refresh || cache.tables[id]?.origin !== 'live' || cache.failed.includes(id),
    );

    if (ids.length === 0) {
        return Promise.resolve(cache);
    }

    pending = Promise.allSettled(ids.map(fetchTable))
        .then((results) => {
            const tables = { ...cache.tables };
            const failed: TableId[] = [];
            const errors: Statistics['errors'] = {};

            results.forEach((result, index) => {
                const id = ids[index]!;
                if (result.status === 'fulfilled') {
                    tables[id] = result.value;
                } else {
                    failed.push(id);
                    errors[id] = describeFailure(result.reason);
                    console.warn(`Statistics update failed for ${id}:`, result.reason);
                }
            });
            cache = { tables, failed, errors };
            if (results.some((result) => result.status === 'fulfilled')) {
                saveTables(tables);
            }
            return cache;
        })
        .finally(() => {
            pending = null;
        });
    return pending;
}

// JSON-stat's last dimension varies fastest. Use its category indices instead
// of assuming the API always returns regions, years, and metrics in one order.
export function getValue(
    table: TableData | undefined,
    area: string,
    year: number,
    filters: Record<string, string> = {},
): number | null {
    if (!table) {
        return null;
    }
    const { id, size, dimension, value } = table.data;
    const selection: Record<string, string> = { ...filters, AREA: area, TIME: String(year) };
    let offset = 0;

    for (let i = 0; i < id.length; i++) {
        const name = id[i]!;
        const categories = dimension[name]?.category?.index;
        const count = size[i];
        if (!categories || !count) {
            return null;
        }
        const code = selection[name];

        const position =
            code === undefined && count === 1
                ? 0
                : Array.isArray(categories)
                  ? categories.indexOf(code ?? '')
                  : categories[code ?? ''];
        if (
            position === undefined ||
            !Number.isInteger(position) ||
            position < 0 ||
            position >= count
        ) {
            return null;
        }
        offset = offset * count + position;
    }

    const result = value[offset];
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
}

export function getLayerValue(
    tables: Statistics['tables'],
    layer: Layer,
    region: RegionCode,
    year: number,
) {
    if (layer === 'Population') {
        return getValue(tables.IRS031, region, year);
    }
    if (layer === 'Earnings') {
        return getValue(tables.DSV041, region, year, { GRS_NET: 'GRS' });
    }
    return getValue(tables.NBA031, region, year, {
        ContentsCode: layer === 'Employment' ? 'NBA0311' : 'NBA0312',
    });
}
