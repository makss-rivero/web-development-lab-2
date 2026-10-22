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

export default function ComparisonTable({ tables, year, region, layer, onRegionChange }: Props) {
    const activeColumn = layer === 'Earnings' ? 'Gross earnings' : layer;

    return (
        <section className="comparison-card" aria-labelledby="comparison-title">
            <div className="section-heading">
                <h2 id="comparison-title">Compare regions</h2>
                <button type="button" className="quiet-button" disabled>
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
                        Statistics for Latvia’s five regions, {year}.
                    </caption>
                    <thead>
                        <tr>
                            {[
                                ['Region', 'Statistical region'],
                                ['Population', 'Residents · 1 January'],
                                ['Employment', '% · ages 15–74'],
                                ['Unemployment', '% · ages 15–74'],
                                ['Gross earnings', 'EUR / month'],
                                ['Net earnings', 'EUR / month'],
                            ].map(([label, unit]) => (
                                <th key={label} scope="col" data-active={label === activeColumn}>
                                    {label}
                                    <small>{unit}</small>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(REGIONS).map(([code, name]) => (
                            <tr key={code} data-selected={code === region}>
                                <th scope="row">
                                    <button
                                        type="button"
                                        aria-pressed={code === region}
                                        onClick={() => onRegionChange(code as RegionCode)}
                                    >
                                        {name}
                                    </button>
                                </th>
                                <td data-active={layer === 'Population'}>
                                    {formatNumber(getValue(tables.IRS031, code, year))}
                                </td>
                                <td data-active={layer === 'Employment'}>
                                    {formatNumber(
                                        getValue(tables.NBA031, code, year, {
                                            ContentsCode: 'NBA0311',
                                        }),
                                        1,
                                    )}
                                </td>
                                <td data-active={layer === 'Unemployment'}>
                                    {formatNumber(
                                        getValue(tables.NBA031, code, year, {
                                            ContentsCode: 'NBA0312',
                                        }),
                                        1,
                                    )}
                                </td>
                                <td data-active={layer === 'Earnings'}>
                                    {formatNumber(
                                        getValue(tables.DSV041, code, year, {
                                            GRS_NET: 'GRS',
                                        }),
                                    )}
                                </td>
                                <td>
                                    {formatNumber(
                                        getValue(tables.DSV041, code, year, {
                                            GRS_NET: 'NET',
                                        }),
                                    )}
                                </td>
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
