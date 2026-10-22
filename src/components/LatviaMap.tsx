import regions from '../data/regions.json';
import { REGIONS } from '../data/statistics';
import type { RegionCode } from '../data/statistics';

export default function LatviaMap({ region }: { region: RegionCode }) {
    const shapes = Object.entries(regions).sort(
        ([a], [b]) => Number(a === region) - Number(b === region),
    );

    return (
        <figure className="region-map">
            <p className="map-heading">Five statistical regions</p>
            <svg viewBox="0 0 1000 650" role="img" aria-labelledby="map-title map-description">
                <title id="map-title">Latvia’s five statistical regions</title>
                <desc id="map-description">
                    Rīga, Vidzeme, Kurzeme, Zemgale and Latgale. Boundaries as of 1 January 2026.
                </desc>
                {shapes.map(([code, { path, x, y }]) => (
                    <g key={code} data-region={code} data-selected={code === region}>
                        <path className="region-shape" d={path} fillRule="evenodd" />
                        <text className="region-name" x={x} y={y}>
                            {REGIONS[code as RegionCode]}
                        </text>
                    </g>
                ))}
            </svg>
            <div className="map-tools" role="group" aria-label="Map view">
                <button type="button" aria-label="Zoom in" disabled>
                    +
                </button>
                <button type="button" aria-label="Zoom out" disabled>
                    −
                </button>
                <button type="button" aria-label="Fit Latvia to map" disabled>
                    Fit
                </button>
            </div>
            <figcaption>
                Boundaries: 1 January 2026 ·{' '}
                <a href="https://data.gov.lv/dati/eng/dataset/robezas/resource/fa44b8cd-13d5-4306-b04a-f162d6057292">
                    CSB boundary data
                </a>
            </figcaption>
        </figure>
    );
}
