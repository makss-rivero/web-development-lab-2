import { useEffect, useState } from 'react';
import ComparisonTable from './components/ComparisonTable';
import LatviaMap from './components/LatviaMap';
import RegionProfile from './components/RegionProfile';
import {
    DEFAULT_REGION,
    DEFAULT_YEAR,
    LAYERS,
    loadStatistics,
    SOURCES,
    YEARS,
} from './data/statistics';
import type { Layer, RegionCode, Statistics } from './data/statistics';

export default function App() {
    const [statistics, setStatistics] = useState<Statistics>({ tables: {}, failed: [] });
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

    const { tables, failed } = statistics;
    let status = 'Statistics loaded.';
    if (loading) {
        status = 'Loading official statistics…';
    } else if (failed.length > 0) {
        status = `Could not load: ${failed.map((id) => SOURCES[id].label).join(', ')}. `;
        status += 'Earlier figures are kept when available; — means unavailable. Retry to update.';
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
                    <p role="status">{status}</p>
                    <button type="button" disabled={loading} onClick={() => void reload()}>
                        {failed.length > 0 ? 'Retry' : 'Refresh data'}
                    </button>
                </div>
                <div aria-busy={loading}>
                    <div className="exploration">
                        <LatviaMap region={region} />
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
