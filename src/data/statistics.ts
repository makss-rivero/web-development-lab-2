export const REGIONS = {
    LV00A: 'Rīga',
    LV00C: 'Vidzeme',
    LV00B: 'Kurzeme',
    LV009: 'Zemgale',
    LV005: 'Latgale',
}

export const YEARS = [2021, 2022, 2023, 2024, 2025]
export const DEFAULT_YEAR = 2025
export const DEFAULT_REGION = 'LV00A'

export type TableId = 'IRS031' | 'NBA031' | 'DSV041' | 'NBL061'

const sharedFilters = { AREA: ['LV', ...Object.keys(REGIONS)], TIME: YEARS.map(String) }

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
}

interface JsonStat {
    id: string[]
    size: number[]
    dimension: Record<string, { category: { index: Record<string, number> | string[] } }>
    value: (number | null)[] | Record<number, number | null>
    updated?: string
}

interface TableData {
    data: JsonStat
    fetchedAt: string
}

export interface Statistics {
    tables: Partial<Record<TableId, TableData>>
    failed: TableId[]
}

const tableIds = Object.keys(SOURCES) as TableId[]
let cache: Statistics = { tables: {}, failed: [] }
let pending: Promise<Statistics> | null = null

async function fetchTable(id: TableId): Promise<TableData> {
    const url = new URL(`https://api.stat.gov.lv/api/v2/tables/${id}/data`)

    url.searchParams.set('lang', 'en')
    url.searchParams.set('outputFormat', 'json-stat2')

    for (const [dimension, codes] of Object.entries(SOURCES[id].filters)) {
        url.searchParams.set(`valueCodes[${dimension}]`, codes.join(','))
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(15_000), cache: 'no-store' })

    if (!response.ok) {
        throw new Error(`Could not load ${id}: HTTP ${response.status}`)
    }

    const data: JsonStat = await response.json()
    if (
        !data ||
        !Array.isArray(data.id) ||
        !Array.isArray(data.size) ||
        data.id.length !== data.size.length ||
        !data.dimension ||
        !data.value
    ) {
        throw new Error(`Invalid data from ${id}`)
    }
    return { data, fetchedAt: new Date().toISOString() }
}

// Share one load between React mounts. Keep results until refresh or page reload.
// Retrying requests only failed sources; a failed refresh preserves earlier data.
export function loadStatistics(refresh = false): Promise<Statistics> {
    if (pending) {
        return pending
    }
    const ids = tableIds.filter((id) => refresh || !cache.tables[id] || cache.failed.includes(id))

    if (ids.length === 0) {
        return Promise.resolve(cache)
    }

    pending = Promise.allSettled(ids.map(fetchTable))
        .then((results) => {
            const tables = { ...cache.tables }
            const failed: TableId[] = []

            results.forEach((result, index) => {
                const id = ids[index]!
                if (result.status === 'fulfilled') {
                    tables[id] = result.value
                } else {
                    failed.push(id)
                }
            })
            cache = { tables, failed }
            return cache
        })
        .finally(() => {
            pending = null
        })
    return pending
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
        return null
    }
    const { id, size, dimension, value } = table.data
    const selection: Record<string, string> = { ...filters, AREA: area, TIME: String(year) }
    let offset = 0

    for (let i = 0; i < id.length; i++) {
        const name = id[i]!
        const categories = dimension[name]?.category?.index
        const count = size[i]
        if (!categories || !count) {
            return null
        }
        const code = selection[name]

        const position =
            code === undefined && count === 1
                ? 0
                : Array.isArray(categories)
                  ? categories.indexOf(code ?? '')
                  : categories[code ?? '']
        if (
            position === undefined ||
            !Number.isInteger(position) ||
            position < 0 ||
            position >= count
        ) {
            return null
        }
        offset = offset * count + position
    }

    const result = value[offset]
    return typeof result === 'number' && Number.isFinite(result) ? result : null
}
