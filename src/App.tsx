import { useEffect, useState } from 'react'
import { DEFAULT_REGION, DEFAULT_YEAR, getValue, loadStatistics, SOURCES } from './data/statistics'
import type { Statistics } from './data/statistics'

export default function App() {
    const [statistics, setStatistics] = useState<Statistics>({ tables: {}, failed: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        loadStatistics().then((result) => {
            if (active) {
                setStatistics(result)
                setLoading(false)
            }
        })
        return () => {
            active = false
        }
    }, [])

    async function reload() {
        setLoading(true)
        setStatistics(await loadStatistics(statistics.failed.length === 0))
        setLoading(false)
    }

    const { tables, failed } = statistics
    const figures = [
        {
            label: 'Population',
            value: getValue(tables.IRS031, DEFAULT_REGION, DEFAULT_YEAR),
            unit: '',
        },
        {
            label: 'Employment rate',
            value: getValue(tables.NBA031, DEFAULT_REGION, DEFAULT_YEAR, {
                ContentsCode: 'NBA0311',
            }),
            unit: '%',
        },
        {
            label: 'Gross monthly earnings',
            value: getValue(tables.DSV041, DEFAULT_REGION, DEFAULT_YEAR, { GRS_NET: 'GRS' }),
            unit: ' EUR',
        },
        {
            label: 'Employed people',
            value: getValue(tables.NBL061, DEFAULT_REGION, DEFAULT_YEAR, {
                NACE: 'TOTAL',
                ContentsCode: 'NBL061',
            }),
            unit: ' thousand',
        },
    ]

    return (
        <main className="welcome">
            <section className="welcome-card" aria-labelledby="app-title">
                <img className="brand-mark" src="/favicon.svg" width="36" height="36" alt="" />
                <p className="eyebrow">Regional statistics</p>
                <h1 id="app-title">Latvia Data Desk</h1>
                <p className="introduction">
                    Population, employment and earnings across Latvia’s five statistical regions.
                </p>
                <section className="data-preview" aria-labelledby="preview-title">
                    <h2 id="preview-title">Rīga region · {DEFAULT_YEAR}</h2>
                    <p className="data-note">
                        Population at the start of the year; annual averages for other figures.
                    </p>
                    <p className="load-status" role="status">
                        {loading
                            ? 'Loading statistics…'
                            : failed.length > 0
                              ? `Could not load: ${failed.map((id) => SOURCES[id].label).join(', ')}. Check your connection and retry. Earlier figures remain visible where available.`
                              : 'Data loaded from the Central Statistical Bureau of Latvia.'}
                    </p>
                    <dl className="figures">
                        {figures.map(({ label, value, unit }) => (
                            <div key={label}>
                                <dt>{label}</dt>
                                <dd>
                                    {value === null
                                        ? '—'
                                        : `${value.toLocaleString('en-GB')}${unit}`}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <button type="button" disabled={loading} onClick={() => void reload()}>
                        {failed.length > 0 ? 'Retry' : 'Refresh data'}
                    </button>
                    <p className="data-note">
                        Rīga region includes the city and surrounding territory. — means
                        unavailable.
                    </p>
                </section>
            </section>
        </main>
    )
}
