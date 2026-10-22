import { getValue, REGIONS } from '../data/statistics';
import type { RegionCode, Statistics } from '../data/statistics';
import { formatNumber } from '../utils/formatNumber';

const industryGroups = [
    { code: 'A', name: 'Agriculture & forestry' },
    { code: 'B-E', name: 'Industry' },
    { code: 'F', name: 'Construction' },
    { code: 'G_I', name: 'Trade & hospitality' },
    { code: 'H_J', name: 'Transport & communication' },
    { code: 'K-N', name: 'Business & financial services' },
    { code: 'O', name: 'Public administration' },
    { code: 'P', name: 'Education' },
    { code: 'Q', name: 'Health & social work' },
    { code: 'R-U', name: 'Other activities' },
];

interface Props {
    tables: Statistics['tables'];
    year: number;
    region: RegionCode;
}

export default function RegionProfile({ tables, year, region }: Props) {
    const population = getValue(tables.IRS031, region, year);
    const national = getValue(tables.IRS031, 'LV', year);
    const share =
        population !== null && national !== null && national > 0
            ? (population / national) * 100
            : null;

    const industries = industryGroups
        .map(({ code, name }) => ({
            code,
            name,
            share: getValue(tables.NBL061, region, year, {
                NACE: code,
                ContentsCode: 'NBL0611',
            }),
        }))
        .filter((industry) => industry.share !== null)
        .sort((a, b) => (b.share ?? 0) - (a.share ?? 0))
        .slice(0, 4);

    return (
        <aside className="region-profile" aria-labelledby="profile-title">
            <div className="profile-overview">
                <p className="eyebrow">Region profile</p>
                <h2 id="profile-title">{REGIONS[region]}</h2>
                <p className="insight-label">Share of Latvia’s population</p>
                <p className="insight-value">
                    {formatNumber(share, 1)}
                    {share !== null && <span>%</span>}
                </p>
                <p className="muted">National total: {formatNumber(national)} residents</p>
                {region === 'LV00A' && (
                    <p className="profile-note">
                        Includes Rīga city and its surrounding territory.
                    </p>
                )}
            </div>
            <section className="employment-mix" aria-labelledby="industry-title">
                <h3 id="industry-title">Employment mix</h3>
                <p className="muted">Four largest groups · share of employed people</p>
                <ul className="industry-list">
                    {industries.map((industry) => (
                        <li key={industry.code}>
                            <div>
                                <span>{industry.name}</span>
                                <strong>{formatNumber(industry.share, 1)}%</strong>
                            </div>
                            <div className="industry-track" aria-hidden="true">
                                <span style={{ width: `${industry.share}%` }} />
                            </div>
                        </li>
                    ))}
                </ul>
                {industries.length === 0 && (
                    <p className="muted">No industry figures to display.</p>
                )}
            </section>
        </aside>
    );
}
