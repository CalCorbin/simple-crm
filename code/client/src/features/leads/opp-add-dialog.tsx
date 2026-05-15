import { useState, useEffect } from "react";
import { Lead, Opportunity, Stage, CustomField } from "../../types";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { extractApiError } from "../../lib/utils";

export const OppAddDialog: React.FC<{
    lead: Lead;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (created: Opportunity) => void;
}> = ({ lead, open, onOpenChange, onAdd }) => {
    const [name, setName] = useState("");
    const [value, setValue] = useState(0);
    const [stageId, setStageId] = useState("");
    const [closeDate, setCloseDate] = useState("");
    const [stages, setStages] = useState<Stage[]>([]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get("/api/stages"),
            axios.get("/api/custom-fields"),
        ]).then(([stagesRes, fieldsRes]) => {
            const fetchedStages: Stage[] = stagesRes.data;
            setStages(fetchedStages);
            if (fetchedStages.length > 0) setStageId(`${fetchedStages[0].id}`);
            setCustomFields(fieldsRes.data.filter((f: CustomField) => f.entity === "opportunity"));
        }).catch(() => setError("Failed to load form data"));
    }, []);

    const handleOpenChange = (next: boolean) => {
        if (!next) setError("");
        onOpenChange(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await axios.post("/api/opportunities", {
                leadId: lead.id,
                stageId: parseInt(stageId),
                name,
                value,
                closeDate: closeDate || null,
                customFields: customFieldValues,
            });
            onAdd(res.data);
            onOpenChange(false);
        } catch (err) {
            setError(extractApiError(err));
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Opportunity</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        For {lead.firstName} {lead.lastName}
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <label htmlFor="add-opp-name" className="block text-sm text-muted-foreground mb-1">Name</label>
                        <input
                            id="add-opp-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="add-opp-value" className="block text-sm text-muted-foreground mb-1">Value</label>
                        <input
                            id="add-opp-value"
                            type="number"
                            value={value}
                            onChange={e => setValue(parseFloat(e.target.value) || 0)}
                            className="block w-full p-2 border border-gray-300 rounded"
                            step="0.01"
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="add-opp-stage" className="block text-sm text-muted-foreground mb-1">Stage</label>
                        <select
                            id="add-opp-stage"
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
                        <label htmlFor="add-opp-close-date" className="block text-sm text-muted-foreground mb-1">Close Date</label>
                        <input
                            id="add-opp-close-date"
                            type="date"
                            value={closeDate}
                            onChange={e => setCloseDate(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    {customFields.map(field => (
                        <div key={field.id}>
                            <label htmlFor={`add-opp-custom-${field.name}`} className="block text-sm text-muted-foreground mb-1">{field.label}</label>
                            <input
                                id={`add-opp-custom-${field.name}`}
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
                            Add Opportunity
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
