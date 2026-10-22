import { useState } from 'react';
import { getValue, REGIONS } from '../data/statistics';
import type { Layer, RegionCode, Statistics } from '../data/statistics';
import { formatNumber } from '../utils/formatNumber';

interface Props {
    tables: Statistics['tables'];
    year: number;
    region: RegionCode;
    layer: Layer;
    onRegionChange: (region: RegionCode) => void;
}

const columns = [
    { key: 'name', label: 'Region', unit: 'Statistical region' },
    { key: 'population', label: 'Population', unit: 'Residents · 1 January' },
    { key: 'employment', label: 'Employment', unit: '% · ages 15–74' },
    { key: 'unemployment', label: 'Unemployment', unit: '% · ages 15–74' },
    { key: 'gross', label: 'Gross earnings', unit: 'EUR / month' },
    { key: 'net', label: 'Net earnings', unit: 'EUR / month' },
] as const;

type Column = (typeof columns)[number]['key'];

export default function ComparisonTable({ tables, year, region, layer, onRegionChange }: Props) {
    const [sort, setSort] = useState<{ column: Column; ascending: boolean }>({
        column: 'name',
        ascending: true,
    });
    const sortDirection = sort.ascending ? 'ascending' : 'descending';
    const sortIcon = sort.ascending ? '↑' : '↓';
    const activeColumn = layer === 'Earnings' ? 'Gross earnings' : layer;
    const rows = (Object.keys(REGIONS) as RegionCode[]).map((code) => ({
        code,
        name: REGIONS[code],
        population: getValue(tables.IRS031, code, year),
        employment: getValue(tables.NBA031, code, year, { ContentsCode: 'NBA0311' }),
        unemployment: getValue(tables.NBA031, code, year, { ContentsCode: 'NBA0312' }),
        gross: getValue(tables.DSV041, code, year, { GRS_NET: 'GRS' }),
        net: getValue(tables.DSV041, code, year, { GRS_NET: 'NET' }),
    }));

    rows.sort((first, second) => {
        const a = first[sort.column];
        const b = second[sort.column];

        if (a === null) {
            return b === null ? 0 : 1;
        }
        if (b === null) {
            return -1;
        }
        const comparison =
            typeof a === 'string' && typeof b === 'string'
                ? a.localeCompare(b, 'lv-LV')
                : Number(a) - Number(b);

        return sort.ascending ? comparison : -comparison;
    });

    const hasData = rows.some((row) =>
        columns.some(({ key }) => key !== 'name' && row[key] !== null),
    );

    function exportCsv() {
        const lines = [
            [
                'Year',
                'Region code',
                ...columns.map(({ key, label, unit }) =>
                    key === 'name' ? label : `${label} (${unit})`,
                ),
            ],
            ...rows.map((row) => [year, row.code, ...columns.map(({ key }) => row[key] ?? '')]),
        ];
        const csv = lines
            .map((line) =>
                line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','),
            )
            .join('\r\n');

        const url = URL.createObjectURL(
            new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = `latvia-regions-${year}.csv`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return (
        <section className="comparison-card" aria-labelledby="comparison-title">
            <div className="section-heading">
                <h2 id="comparison-title">Compare regions</h2>
                <button
                    type="button"
                    className="quiet-button"
                    disabled={!hasData}
                    onClick={exportCsv}
                >
                    Export CSV
                </button>
            </div>
            <div
                className="table-scroll"
                role="region"
                aria-label="Regional comparison"
                tabIndex={0}
            >
                <table>
                    <caption className="visually-hidden">
                        Statistics for Latvia’s five regions, {year}. Activate a column heading to
                        sort; activate it again to reverse the order.
                    </caption>
                    <thead>
                        <tr>
                            {columns.map(({ key, label, unit }) => (
                                <th
                                    key={key}
                                    scope="col"
                                    data-active={label === activeColumn}
                                    aria-sort={sort.column === key ? sortDirection : undefined}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSort({
                                                column: key,
                                                ascending: sort.column !== key || !sort.ascending,
                                            })
                                        }
                                    >
                                        {label}
                                        <span className="sort-indicator" aria-hidden="true">
                                            {sort.column === key ? sortIcon : '↕'}
                                        </span>
                                        <small>{unit}</small>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.code} data-selected={row.code === region}>
                                {columns.map(({ key, label }) => {
                                    if (key === 'name') {
                                        return (
                                            <th key={key} scope="row">
                                                <button
                                                    type="button"
                                                    aria-pressed={row.code === region}
                                                    onClick={() => onRegionChange(row.code)}
                                                >
                                                    {row.name}
                                                </button>
                                            </th>
                                        );
                                    }
                                    return (
                                        <td key={key} data-active={label === activeColumn}>
                                            {formatNumber(
                                                row[key],
                                                key === 'employment' || key === 'unemployment'
                                                    ? 1
                                                    : 0,
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="table-note">
                Population at the start of the year; annual averages for other figures. — means
                unavailable.
            </p>
        </section>
    );
}
