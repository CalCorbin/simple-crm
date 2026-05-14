import { useState, useEffect } from "react";
import { Opportunity, Stage, CustomField } from "./types";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const OppEditDialog: React.FC<{
    opportunity: Opportunity;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: (updated: Opportunity) => void;
}> = ({ opportunity, open, onOpenChange, onUpdate }) => {
    const [name, setName] = useState(opportunity.name || "");
    const [value, setValue] = useState(opportunity.value);
    const [stageId, setStageId] = useState(`${opportunity.stage.id}`);
    const [closeDate, setCloseDate] = useState(opportunity.closeDate || "");
    const [stages, setStages] = useState<Stage[]>([]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(opportunity.customFields || {});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setName(opportunity.name || "");
            setValue(opportunity.value);
            setStageId(`${opportunity.stage.id}`);
            setCloseDate(opportunity.closeDate || "");
            setCustomFieldValues(opportunity.customFields || {});
            setError("");
            Promise.all([
                axios.get("/api/stages"),
                axios.get("/api/custom-fields"),
            ]).then(([stagesRes, fieldsRes]) => {
                setStages(stagesRes.data);
                setCustomFields(fieldsRes.data.filter((f: CustomField) => f.entity === "opportunity"));
            });
        }
    }, [open, opportunity]);

    const handleOpenChange = (next: boolean) => {
        if (!next) setError("");
        onOpenChange(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await axios.put(`/api/opportunities/${opportunity.id}`, {
                name,
                value,
                stageId: parseInt(stageId),
                closeDate: closeDate || null,
                customFields: customFieldValues,
            });
            onUpdate(res.data);
            onOpenChange(false);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = (err as any).response?.data;
            setError(data?.error || data || "An error occurred");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Opportunity</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <label htmlFor="opp-name" className="block text-sm text-muted-foreground mb-1">Name</label>
                        <input
                            id="opp-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="opp-value" className="block text-sm text-muted-foreground mb-1">Value</label>
                        <input
                            id="opp-value"
                            type="number"
                            value={value}
                            onChange={e => setValue(parseFloat(e.target.value) || 0)}
                            className="block w-full p-2 border border-gray-300 rounded"
                            step="0.01"
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="opp-stage" className="block text-sm text-muted-foreground mb-1">Stage</label>
                        <select
                            id="opp-stage"
                            value={stageId}
                            onChange={e => setStageId(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        >
                            {stages.map(stage => (
                                <option key={stage.id} value={stage.id}>{stage.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="opp-close-date" className="block text-sm text-muted-foreground mb-1">Close Date</label>
                        <input
                            id="opp-close-date"
                            type="date"
                            value={closeDate}
                            onChange={e => setCloseDate(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    {customFields.map(field => (
                        <div key={field.id}>
                            <label htmlFor={`opp-custom-${field.name}`} className="block text-sm text-muted-foreground mb-1">{field.label}</label>
                            <input
                                id={`opp-custom-${field.name}`}
                                type="text"
                                value={customFieldValues[field.name] || ""}
                                onChange={e =>
                                    setCustomFieldValues({
                                        ...customFieldValues,
                                        [field.name]: e.target.value,
                                    })
                                }
                                className="block w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                    ))}
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            Update Opportunity
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
