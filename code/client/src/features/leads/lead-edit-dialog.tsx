import { useState, useEffect } from "react";
import { Lead, CustomField } from "../../types";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const LeadEditDialog: React.FC<{
    lead: Lead;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}> = ({ lead, open, onOpenChange, onUpdate }) => {
    const [firstName, setFirstName] = useState(lead.firstName);
    const [lastName, setLastName] = useState(lead.lastName);
    const [age, setAge] = useState(`${lead.age}`);
    const [phoneNumber, setPhoneNumber] = useState(lead.phoneNumber);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(lead.customFields || {});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            axios.get("/api/custom-fields").then(res => setCustomFields(res.data));
        }
    }, [open]);

    const handleOpenChange = (next: boolean) => {
        if (!next) setError("");
        onOpenChange(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await axios.put(`/api/leads/${lead.id}`, {
                firstName,
                lastName,
                age,
                phoneNumber,
                customFields: customFieldValues,
            });
            onOpenChange(false);
            onUpdate();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setError((err as any).response.data);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Lead</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500">{error}</p>}
                    <div>
                        <label htmlFor="lead-first-name" className="block text-sm text-muted-foreground mb-1">First Name</label>
                        <input
                            id="lead-first-name"
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="lead-last-name" className="block text-sm text-muted-foreground mb-1">Last Name</label>
                        <input
                            id="lead-last-name"
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="lead-age" className="block text-sm text-muted-foreground mb-1">Age</label>
                        <input
                            id="lead-age"
                            type="text"
                            value={age}
                            onChange={e => setAge(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="lead-phone" className="block text-sm text-muted-foreground mb-1">Phone Number</label>
                        <input
                            id="lead-phone"
                            type="text"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    {customFields.map(field => (
                        <div key={field.id}>
                            <label htmlFor={`lead-custom-${field.name}`} className="block text-sm text-muted-foreground mb-1">{field.label}</label>
                            <input
                                id={`lead-custom-${field.name}`}
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
                            Update Lead
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
