import { CustomField } from "@/types.ts";
import { Pill } from "./pill";

interface GroupBySelectorProps {
    customFields: CustomField[];
    groupBy: number | null;
    setGroupBy: (id: number | null) => void;
}

export const GroupBySelector: React.FC<GroupBySelectorProps> = ({ customFields, groupBy, setGroupBy }) => {
    if (customFields.length === 0) return null;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Group by</span>
            <Pill label="None" active={groupBy === null} onClick={() => setGroupBy(null)} />
            {customFields.map(f => (
                <Pill key={f.id} label={f.label} active={groupBy === f.id} onClick={() => setGroupBy(f.id)} />
            ))}
        </div>
    );
};
