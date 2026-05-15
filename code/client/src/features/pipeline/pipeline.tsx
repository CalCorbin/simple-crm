import axios from "axios";
import { useEffect, useState } from "react";
import { PipelineReport } from "@/types.ts";
import { formatCurrency } from "../../lib/utils";

export const Pipeline: React.FC = () => {
    const [report, setReport] = useState<PipelineReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPipeline();
    }, []);

    const fetchPipeline = async () => {
        setLoading(true);
        const result = await axios.get("/api/pipeline");
        setReport(result.data);
        setLoading(false);
    };

    if (loading) return <p>Loading pipeline...</p>;
    if (!report) return <p>No pipeline data</p>;

    const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pipeline Report</h2>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-gray-600">Total Pipeline Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.totalValue)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-gray-600">Expected Close Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.expectedValue)}</p>
                </div>
            </div>

            <table className="table-auto w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Stage</th>
                        <th className="border p-2 text-right">Count</th>
                        <th className="border p-2 text-right">Pipeline $</th>
                        <th className="border p-2 text-right">Likelihood</th>
                        <th className="border p-2 text-right">Expected $</th>
                    </tr>
                </thead>
                <tbody>
                    {report.byStage.map(item => {
                        const bgClass = item.stage.status === "won" ? "bg-green-50" : item.stage.status === "lost" ? "bg-red-50" : "";
                        return (
                            <tr key={item.stage.id} className={bgClass}>
                                <td className="border p-2">
                                    <span className="font-medium">{item.stage.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">({item.stage.status})</span>
                                </td>
                                <td className="border p-2 text-right">{item.count}</td>
                                <td className="border p-2 text-right font-mono">{formatCurrency(item.totalValue)}</td>
                                <td className="border p-2 text-right font-mono">{formatPercent(item.stage.conversionLikelihood)}</td>
                                <td className="border p-2 text-right font-mono font-bold">{formatCurrency(item.expectedValue)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
