import { DEFAULT_REGION, DEFAULT_YEAR, getValue, REGIONS } from '../data/statistics';
import type { Statistics } from '../data/statistics';
import { formatNumber } from '../utils/formatNumber';

export default function ComparisonTable({ tables }: { tables: Statistics['tables'] }) {
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
                        Statistics for Latvia’s five regions, {DEFAULT_YEAR}.
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
                                <th key={label} scope="col">
                                    {label}
                                    <small>{unit}</small>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(REGIONS).map(([code, name]) => (
                            <tr key={code} data-selected={code === DEFAULT_REGION}>
                                <th scope="row">{name}</th>
                                <td>{formatNumber(getValue(tables.IRS031, code, DEFAULT_YEAR))}</td>
                                <td>
                                    {formatNumber(
                                        getValue(tables.NBA031, code, DEFAULT_YEAR, {
                                            ContentsCode: 'NBA0311',
                                        }),
                                        1,
                                    )}
                                </td>
                                <td>
                                    {formatNumber(
                                        getValue(tables.NBA031, code, DEFAULT_YEAR, {
                                            ContentsCode: 'NBA0312',
                                        }),
                                        1,
                                    )}
                                </td>
                                <td>
                                    {formatNumber(
                                        getValue(tables.DSV041, code, DEFAULT_YEAR, {
                                            GRS_NET: 'GRS',
                                        }),
                                    )}
                                </td>
                                <td>
                                    {formatNumber(
                                        getValue(tables.DSV041, code, DEFAULT_YEAR, {
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
