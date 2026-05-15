import { useEffect, useState } from "react";
import axios from "axios";
import { CustomField, ForecastBucket, ForecastReport } from "./types";

function bucketAccent(label: string): string {
    if (label === "Past") return "border-amber-400 bg-amber-50";
    if (label === "Beyond 6 Months" || label === "No Close Date") return "border-gray-300 bg-gray-50";
    return "border-blue-400 bg-white";
}

const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const Forecast: React.FC = () => {
    const [forecast, setForecast] = useState<ForecastReport | null>(null);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [groupBy, setGroupBy] = useState<number | null>(null);

    useEffect(() => {
        axios.get<CustomField[]>("/api/custom-fields").then(res => {
            setCustomFields(res.data.filter(f => f.entity === "opportunity"));
        });
    }, []);

    useEffect(() => {
        const url = groupBy ? `/api/forecast?groupBy=${groupBy}` : "/api/forecast";
        axios.get<ForecastReport>(url).then(res => setForecast(res.data));
    }, [groupBy]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Opportunities Forecast</h2>

                {customFields.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Group by</span>
                        <Pill label="None" active={groupBy === null} onClick={() => setGroupBy(null)} />
                        {customFields.map(f => (
                            <Pill key={f.id} label={f.label} active={groupBy === f.id} onClick={() => setGroupBy(f.id)} />
                        ))}
                    </div>
                )}
            </div>

            {forecast && <ForecastMatrix buckets={forecast.buckets} grouped={groupBy !== null} />}
        </div>
    );
};

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            active
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
    >
        {label}
    </button>
);

const ForecastMatrix: React.FC<{ buckets: ForecastBucket[]; grouped: boolean }> = ({ buckets, grouped }) => {
    const allValues = Array.from(
        new Set(buckets.flatMap(b => (b.groups ?? []).map(g => g.groupValue)))
    );
    const columns = [...allValues.filter(v => v !== "Unassigned"), ...allValues.filter(v => v === "Unassigned")];

    return (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Bucket</th>
                        {grouped && columns.map(v => (
                            <th key={v} className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">{v}</th>
                        ))}
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-100">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {buckets.map(bucket => {
                        const groupMap = Object.fromEntries((bucket.groups ?? []).map(g => [g.groupValue, g]));
                        const rowTotal = grouped
                            ? (bucket.groups ?? []).reduce((s, g) => s + g.totalExpectedValue, 0)
                            : (bucket.totalExpectedValue ?? 0);
                        const rowCount = grouped
                            ? (bucket.groups ?? []).reduce((s, g) => s + g.count, 0)
                            : (bucket.count ?? 0);
                        const isEmpty = rowCount === 0;

                        return (
                            <tr key={bucket.label} className={`hover:bg-gray-50 transition-colors ${isEmpty ? "opacity-40" : ""}`}>
                                <td className={`px-4 py-3 border-l-4 ${bucketAccent(bucket.label)}`}>
                                    <span className="font-semibold text-gray-800 text-xs uppercase tracking-wide">{bucket.label}</span>
                                </td>
                                {grouped && columns.map(v => {
                                    const g = groupMap[v];
                                    return (
                                        <td key={v} className="px-4 py-3 text-right">
                                            {g ? (
                                                <>
                                                    <div className="font-semibold text-gray-900 tabular-nums">{fmt(g.totalExpectedValue)}</div>
                                                    <div className="text-xs text-gray-400">{g.count}d</div>
                                                </>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 text-right bg-gray-50">
                                    <div className="font-bold text-gray-900 tabular-nums">{fmt(rowTotal)}</div>
                                    <div className="text-xs text-gray-400">{rowCount}d</div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
