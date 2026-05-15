import { useEffect, useState } from "react";
import axios from "axios";
import { CustomField, ForecastReport } from "@/types.ts";
import { GroupBySelector } from "./group-by-selector";
import { ForecastMatrix } from "./forecast-matrix";

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
                <GroupBySelector customFields={customFields} groupBy={groupBy} setGroupBy={setGroupBy} />
            </div>

            {forecast && <ForecastMatrix buckets={forecast.buckets} grouped={groupBy !== null} />}
        </div>
    );
};
