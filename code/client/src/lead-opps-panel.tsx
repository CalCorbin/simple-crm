import React, { useState, useEffect } from "react";
import { Lead, Opportunity } from "./types";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "./lib/utils";
import { OppEditDialog } from "./opp-edit-dialog";
import { OppAddDialog } from "./opp-add-dialog";

const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const LeadOppPanel: React.FC<{ lead: Lead }> = ({ lead }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
    const [addingOpp, setAddingOpp] = useState(false);

    useEffect(() => {
        axios.get("/api/opportunities").then(res => {
            setOpportunities(res.data.filter((opp: Opportunity) => opp.lead.id === lead.id));
        });
    }, [lead.id]);

    const deleteOpportunity = async (oppId: number) => {
        await axios.delete(`/api/opportunities/${oppId}`);
        setOpportunities(prev => prev.filter(o => o.id !== oppId));
    };

    const handleOppUpdated = (updated: Opportunity) => {
        setOpportunities(prev => prev.map(o => o.id === updated.id ? updated : o));
    };

    const handleOppAdded = (created: Opportunity) => {
        setOpportunities(prev => [...prev, created]);
    };

    return (
        <>
            <TableRow>
                <TableCell colSpan={5} className="bg-muted/30 p-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Opportunities</h3>
                            <Button size="sm" onClick={() => setAddingOpp(true)}>Add Opportunity</Button>
                        </div>
                        {opportunities.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No opportunities</p>
                        ) : (
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-x-4 text-sm">
                                <div className="text-xs font-medium text-muted-foreground pb-1.5">Name</div>
                                <div className="text-xs font-medium text-muted-foreground pb-1.5">Stage</div>
                                <div className="text-xs font-medium text-muted-foreground pb-1.5">Value</div>
                                <div className="text-xs font-medium text-muted-foreground pb-1.5">Expected</div>
                                <div className="text-xs font-medium text-muted-foreground pb-1.5">Close Date</div>
                                <div className="pb-1.5" />
                                <div className="col-span-6 border-t border-border" />
                                {opportunities.map(opp => (
                                    <React.Fragment key={opp.id}>
                                        <div className="py-2 font-medium">{opp.name || "Unnamed"}</div>
                                        <div className="py-2 text-muted-foreground">{opp.stage.name}</div>
                                        <div className="py-2">{formatCurrency(opp.value)}</div>
                                        <div className="py-2 text-muted-foreground">
                                            {formatCurrency(opp.expectedValue ?? opp.value * opp.stage.conversionLikelihood)}
                                        </div>
                                        <div className="py-2 text-muted-foreground">
                                            {opp.closeDate ? formatDate(opp.closeDate) : "—"}
                                        </div>
                                        <div className="py-2 flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => setEditingOpp(opp)}>
                                                Edit
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => deleteOpportunity(opp.id)}>
                                                Delete
                                            </Button>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                </TableCell>
            </TableRow>
            {editingOpp && (
                <OppEditDialog
                    opportunity={editingOpp}
                    open={true}
                    onOpenChange={(open) => { if (!open) setEditingOpp(null); }}
                    onUpdate={handleOppUpdated}
                />
            )}
            {addingOpp && (
                <OppAddDialog
                    lead={lead}
                    open={true}
                    onOpenChange={(open) => { if (!open) setAddingOpp(false); }}
                    onAdd={handleOppAdded}
                />
            )}
        </>
    );
};
