import { useState, useEffect, useRef } from "react";
import { Lead, CustomField, Opportunity } from "./types";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "./lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export const LeadRow: React.FC<{ lead: Lead; oppCount: number; onUpdate: () => void }> = ({ lead, oppCount, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showOpps, setShowOpps] = useState(false);
    const [firstName, setFirstName] = useState(lead.firstName);
    const [lastName, setLastName] = useState(lead.lastName);
    const [age, setAge] = useState(`${lead.age}`);
    const [phoneNumber, setPhoneNumber] = useState(lead.phoneNumber);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(lead.customFields || {});
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const oppsFetched = useRef(false);

    useEffect(() => {
        if (isEditing) {
            fetchCustomFields();
        }
    }, [isEditing]);

    useEffect(() => {
        if (!showOpps || oppsFetched.current) return;
        oppsFetched.current = true;
        axios.get("/api/opportunities").then(res => {
            setOpportunities(res.data.filter((opp: Opportunity) => opp.lead.id === lead.id));
        });
    }, [showOpps, lead.id]);

    const fetchCustomFields = async () => {
        const result = await axios.get("/api/custom-fields");
        setCustomFields(result.data);
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
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setError((error as any).response.data);
        }
        setLoading(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) setError("");
        setIsEditing(open);
    };

    const deleteOpportunity = async (oppId: number) => {
        await axios.delete(`/api/opportunities/${oppId}`);
        setOpportunities(prev => prev.filter(o => o.id !== oppId));
    };

    return (
        <>
            <TableRow>
                <TableCell>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                        <Button
                            variant={showOpps ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setShowOpps(!showOpps)}
                            className="gap-1.5"
                        >
                            Opportunities
                            {oppCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
                                    {oppCount}
                                </span>
                            )}
                            {showOpps ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                </TableCell>
                <TableCell>{firstName}</TableCell>
                <TableCell>{lastName}</TableCell>
                <TableCell>{age}</TableCell>
                <TableCell>{phoneNumber}</TableCell>
            </TableRow>
            {showOpps && (
                <TableRow>
                    <TableCell colSpan={5} className="bg-muted/30 p-4">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Opportunities</h3>
                            {opportunities.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No opportunities</p>
                            ) : (
                                <Table>
                                    <TableBody>
                                        {opportunities.map(opp => (
                                            <TableRow key={opp.id}>
                                                <TableCell className="font-medium">{opp.name || "Unnamed"}</TableCell>
                                                <TableCell className="text-muted-foreground">{opp.stage.name}</TableCell>
                                                <TableCell>{formatCurrency(opp.value)}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    Expected: {formatCurrency(opp.value * opp.stage.conversionLikelihood)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => deleteOpportunity(opp.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}

            <Dialog open={isEditing} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Lead</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="text-red-500">{error}</p>}
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Age"
                            value={age}
                            onChange={e => setAge(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                        {customFields.map(field => (
                            <input
                                key={field.id}
                                type="text"
                                placeholder={field.label}
                                value={customFieldValues[field.name] || ""}
                                onChange={e =>
                                    setCustomFieldValues({
                                        ...customFieldValues,
                                        [field.name]: e.target.value,
                                    })
                                }
                                className="block w-full p-2 border border-gray-300 rounded"
                            />
                        ))}
                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full">
                                Update Lead
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};