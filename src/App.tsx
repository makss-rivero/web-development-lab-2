import { useEffect, useState } from 'react';
import ComparisonTable from './components/ComparisonTable';
import LatviaMap from './components/LatviaMap';
import RegionProfile from './components/RegionProfile';
import {
    DEFAULT_REGION,
    DEFAULT_YEAR,
    getInitialStatistics,
    LAYERS,
    loadStatistics,
    SOURCES,
    YEARS,
} from './data/statistics';
import type { Layer, RegionCode, Statistics, TableId } from './data/statistics';

const dataDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

export default function App() {
    const [statistics, setStatistics] = useState<Statistics>(getInitialStatistics);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(DEFAULT_YEAR);
    const [region, setRegion] = useState<RegionCode>(DEFAULT_REGION);
    const [layer, setLayer] = useState<Layer>('Population');

    useEffect(() => {
        let active = true;
        loadStatistics().then((result) => {
            if (active) {
                setStatistics(result);
                setLoading(false);
            }
        });
        return () => {
            active = false;
        };
    }, []);

    async function reload() {
        setLoading(true);
        setStatistics(await loadStatistics(statistics.failed.length === 0));
        setLoading(false);
    }

    const { tables, failed, errors } = statistics;
    let status = 'Statistics updated from the official source.';
    if (loading) {
        status = 'Showing available statistics while checking for updates…';
    } else if (failed.length > 0) {
        status = `Live update unavailable for: ${failed.map((id) => SOURCES[id].label).join(', ')}. `;
        status += 'Showing saved official figures. Check data dates below or retry the update.';
    }

    return (
        <>
            <header className="app-header">
                <div className="header-inner">
                    <div className="brand">
                        <img src="/favicon.svg" width="32" height="32" alt="" />
                        <div>
                            <h1>Latvia Data Desk</h1>
                            <p>Regional statistics</p>
                        </div>
                    </div>
                    <a href="#sources">
                        Data sources <span aria-hidden="true">↗</span>
                    </a>
                </div>
            </header>
            <main className="workspace">
                <section className="toolbar" aria-label="Dashboard filters">
                    <div className="layer-control">
                        <span className="control-label" id="layer-label">
                            Map layer
                        </span>
                        <div className="layers" role="group" aria-labelledby="layer-label">
                            {LAYERS.map((label) => (
                                <button
                                    key={label}
                                    type="button"
                                    aria-pressed={layer === label}
                                    onClick={() => setLayer(label)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <label className="year-control">
                        Reference year
                        <select
                            value={year}
                            onChange={(event) => setYear(Number(event.target.value))}
                        >
                            {YEARS.toReversed().map((year) => (
                                <option key={year}>{year}</option>
                            ))}
                        </select>
                    </label>
                </section>
                <div className="data-status" data-error={failed.length > 0 && !loading}>
                    <div>
                        <p role="status">{status}</p>
                        <details className="data-details">
                            <summary>Data availability and dates</summary>
                            <ul>
                                {(Object.keys(SOURCES) as TableId[]).map((id) => {
                                    const table = tables[id];
                                    return (
                                        <li key={id}>
                                            <strong>{SOURCES[id].label}:</strong>{' '}
                                            {table ? (
                                                <>
                                                    {table.origin === 'live'
                                                        ? 'Updated this visit'
                                                        : 'Saved official copy'}
                                                    {' · retrieved '}
                                                    {dataDate.format(new Date(table.fetchedAt))}
                                                    {table.data.updated && (
                                                        <>
                                                            {' · source updated '}
                                                            {dataDate.format(
                                                                new Date(table.data.updated),
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                'Unavailable'
                                            )}
                                            {errors[id] && <p>{errors[id]}</p>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </details>
                    </div>
                    <button type="button" disabled={loading} onClick={() => void reload()}>
                        {failed.length > 0 ? 'Retry' : 'Refresh data'}
                    </button>
                </div>
                <div aria-busy={loading}>
                    <div className="exploration">
                        <LatviaMap
                            tables={tables}
                            year={year}
                            region={region}
                            layer={layer}
                            onRegionChange={setRegion}
                        />
                        <RegionProfile tables={tables} year={year} region={region} />
                    </div>
                    <ComparisonTable
                        tables={tables}
                        year={year}
                        region={region}
                        layer={layer}
                        onRegionChange={setRegion}
                    />
                </div>
                <footer className="app-footer" id="sources">
                    <p>Source: Central Statistical Bureau of Latvia</p>
                    <nav aria-label="Statistics sources">
                        {Object.entries(SOURCES).map(([id, source]) => (
                            <a key={id} href={source.url}>
                                {source.label}
                            </a>
                        ))}
                    </nav>
                </footer>
            </main>
        </>
    );
}
