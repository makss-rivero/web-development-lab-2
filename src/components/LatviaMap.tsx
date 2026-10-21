import regions from '../data/regions.json'
import { REGIONS } from '../data/statistics'

export default function LatviaMap() {
    return (
        <figure className="region-map">
            <svg viewBox="0 0 1000 650" role="img" aria-labelledby="map-title map-description">
                <title id="map-title">Latvia’s five statistical regions</title>
                <desc id="map-description">
                    Rīga, Vidzeme, Kurzeme, Zemgale and Latgale. Boundaries as of 1 January 2026.
                </desc>
                {Object.entries(regions).map(([code, { path, x, y }]) => (
                    <g key={code} data-region={code}>
                        <path className="region-shape" d={path} fillRule="evenodd" />
                        <text className="region-name" x={x} y={y}>
                            {REGIONS[code as keyof typeof REGIONS]}
                        </text>
                    </g>
                ))}
            </svg>
            <figcaption>
                Boundaries: 1 January 2026 ·{' '}
                <a href="https://data.gov.lv/dati/eng/dataset/robezas/resource/fa44b8cd-13d5-4306-b04a-f162d6057292">
                    Central Statistical Bureau of Latvia
                </a>
            </figcaption>
        </figure>
    )
}
