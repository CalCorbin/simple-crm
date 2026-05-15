import { ForecastBucket } from "@/types.ts";
import { bucketAccent, fmt } from "./forecast-utils";

interface ForecastMatrixProps {
    buckets: ForecastBucket[];
    grouped: boolean;
}

export const ForecastMatrix: React.FC<ForecastMatrixProps> = ({ buckets, grouped }) => {
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
