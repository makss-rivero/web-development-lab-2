import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import regions from '../data/regions.json';
import { getLayerValue, REGIONS } from '../data/statistics';
import type { Layer, RegionCode, Statistics } from '../data/statistics';
import { formatNumber } from '../utils/formatNumber';

interface MapProps {
    tables: Statistics['tables'];
    year: number;
    region: RegionCode;
    layer: Layer;
    onRegionChange: (region: RegionCode) => void;
}

function boundedView(x: number, y: number, zoom: number) {
    return {
        x: Math.max(0, Math.min(x, 1000 - 1000 / zoom)),
        y: Math.max(0, Math.min(y, 650 - 650 / zoom)),
        zoom,
    };
}

export default function LatviaMap({ tables, year, region, layer, onRegionChange }: MapProps) {
    const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
    const [activeRegion, setActiveRegion] = useState<RegionCode | null>(null);
    const drag = useRef<{
        pointerId: number;
        x: number;
        y: number;
        scale: number;
        view: typeof view;
    } | null>(null);

    const moved = useRef(false);
    const shapes = (Object.keys(REGIONS) as RegionCode[]).map((code) => ({
        ...regions[code],
        code,
        value: getLayerValue(tables, layer, code, year),
    }));
    const values = shapes.map(({ value }) => value).filter((value) => value !== null);
    const minimum = values.length ? Math.min(...values) : 0;
    const maximum = values.length ? Math.max(...values) : 0;
    const isRate = layer === 'Employment' || layer === 'Unemployment';
    const units = isRate ? '%' : layer === 'Earnings' ? 'EUR/month' : 'residents';

    const definition = isRate
        ? 'Annual rate · ages 15–74'
        : layer === 'Earnings'
          ? 'Average gross monthly earnings'
          : 'Population at start of year';

    function valueLabel(value: number | null) {
        return value === null ? 'Unavailable' : `${formatNumber(value, isRate ? 1 : 0)} ${units}`;
    }

    function color(value: number | null) {
        if (value === null) {
            return 'url(#missing-data)';
        }
        const fraction = maximum === minimum ? 0.5 : (value - minimum) / (maximum - minimum);
        return `hsl(215 55% ${94 - 24 * fraction}%)`;
    }

    function zoomBy(factor: number) {
        const zoom = Math.max(1, Math.min(4, view.zoom * factor));
        setView(
            boundedView(
                view.x + 500 / view.zoom - 500 / zoom,
                view.y + 325 / view.zoom - 325 / zoom,
                zoom,
            ),
        );
    }

    function pan(event: PointerEvent<SVGSVGElement>) {
        if (event.buttons === 0) {
            drag.current = null;
            return;
        }
        const start = drag.current;
        if (!start || event.pointerId !== start.pointerId) {
            return;
        }
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.hypot(dx, dy) < 5 && !moved.current) {
            return;
        }
        moved.current = true;
        setActiveRegion(null);
        if (start.view.zoom > 1) {
            event.currentTarget.setPointerCapture(event.pointerId);
            setView(
                boundedView(
                    start.view.x - dx / start.scale,
                    start.view.y - dy / start.scale,
                    start.view.zoom,
                ),
            );
        }
    }

    return (
        <figure className="region-map" onPointerLeave={() => setActiveRegion(null)}>
            <div className="map-heading">
                <p>
                    {layer === 'Earnings' ? 'Gross earnings' : layer} · {year}
                </p>
                <p
                    className="map-readout"
                    id="map-value"
                    role={activeRegion ? 'tooltip' : undefined}
                >
                    {activeRegion
                        ? `${REGIONS[activeRegion]} · ${valueLabel(getLayerValue(tables, layer, activeRegion, year))}`
                        : 'Select a region. Zoom in to pan.'}
                </p>
            </div>
            <div className="map-viewport">
                <svg
                    viewBox={`${view.x} ${view.y} ${1000 / view.zoom} ${650 / view.zoom}`}
                    role="group"
                    aria-labelledby="map-title"
                    aria-describedby="map-description"
                    data-zoomed={view.zoom > 1}
                    onPointerDown={(event) => {
                        if (event.button !== 0 || !event.isPrimary) {
                            return;
                        }
                        moved.current = false;
                        drag.current = {
                            pointerId: event.pointerId,
                            x: event.clientX,
                            y: event.clientY,
                            scale: event.currentTarget.getScreenCTM()?.a ?? 1,
                            view,
                        };
                    }}
                    onPointerMove={pan}
                    onPointerUp={() => {
                        drag.current = null;
                    }}
                    onPointerCancel={() => {
                        drag.current = null;
                        moved.current = true;
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            setActiveRegion(null);
                        }
                        if (
                            view.zoom > 1 &&
                            ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
                        ) {
                            event.preventDefault();
                            const dx =
                                Number(event.key === 'ArrowRight') -
                                Number(event.key === 'ArrowLeft');
                            const dy =
                                Number(event.key === 'ArrowDown') - Number(event.key === 'ArrowUp');
                            setView(
                                boundedView(
                                    view.x + (dx * 80) / view.zoom,
                                    view.y + (dy * 80) / view.zoom,
                                    view.zoom,
                                ),
                            );
                        }
                    }}
                >
                    <title id="map-title">Latvia’s five statistical regions</title>
                    <desc id="map-description">
                        Select with Enter or Space. When zoomed, drag or use arrow keys to pan.
                        Darker blue means a higher value. Escape dismisses the value preview.
                    </desc>
                    <defs>
                        <pattern
                            id="missing-data"
                            width="8"
                            height="8"
                            patternUnits="userSpaceOnUse"
                        >
                            <rect width="8" height="8" fill="#eef0f3" />
                            <path d="M0 8 8 0" stroke="#bdc6d3" />
                        </pattern>
                    </defs>
                    {shapes.map(({ code, path, x, y, value }) => (
                        <g
                            key={code}
                            data-region={code}
                            data-selected={code === region}
                            role="button"
                            tabIndex={0}
                            aria-label={`${REGIONS[code]}: ${valueLabel(value)}`}
                            aria-pressed={code === region}
                            onPointerEnter={() => {
                                if (!drag.current) {
                                    setActiveRegion(code);
                                }
                            }}
                            onFocus={(event) => {
                                setActiveRegion(code);
                                if (event.currentTarget.matches(':focus-visible')) {
                                    setView(
                                        boundedView(
                                            x - 500 / view.zoom,
                                            y - 325 / view.zoom,
                                            view.zoom,
                                        ),
                                    );
                                }
                            }}
                            onBlur={() => setActiveRegion(null)}
                            onClick={() => {
                                if (!moved.current) {
                                    onRegionChange(code);
                                    setActiveRegion(code);
                                }
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    onRegionChange(code);
                                    setActiveRegion(code);
                                }
                            }}
                        >
                            <path
                                className="region-shape"
                                d={path}
                                fill={color(value)}
                                fillRule="evenodd"
                            />
                            <text className="region-name" x={x} y={y}>
                                {REGIONS[code]}
                            </text>
                        </g>
                    ))}
                    <path
                        className="region-selection"
                        d={regions[region].path}
                        fillRule="evenodd"
                        aria-hidden="true"
                    />
                </svg>
                <div className="map-tools" role="group" aria-label="Map view">
                    <button
                        type="button"
                        aria-label="Zoom in"
                        disabled={view.zoom === 4}
                        onClick={() => zoomBy(1.5)}
                    >
                        +
                    </button>
                    <button
                        type="button"
                        aria-label="Zoom out"
                        disabled={view.zoom === 1}
                        onClick={() => zoomBy(1 / 1.5)}
                    >
                        −
                    </button>
                    <button
                        type="button"
                        aria-label="Fit Latvia to map"
                        onClick={() => setView({ x: 0, y: 0, zoom: 1 })}
                    >
                        Fit
                    </button>
                </div>
            </div>
            <div className="map-legend">
                <p>
                    {definition} · {units}
                </p>
                {values.length > 0 && (
                    <div className="map-scale">
                        <span>{formatNumber(minimum, isRate ? 1 : 0)}</span>
                        <span
                            className="map-gradient"
                            aria-hidden="true"
                            style={minimum === maximum ? { background: color(minimum) } : undefined}
                        />
                        <span>{formatNumber(maximum, isRate ? 1 : 0)}</span>
                    </div>
                )}
                <p className="map-legend-note">
                    {values.length > 0 && 'Darker = higher · scale for selected year'}
                    {values.length < shapes.length && (
                        <span className="map-missing">Unavailable</span>
                    )}
                </p>
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
