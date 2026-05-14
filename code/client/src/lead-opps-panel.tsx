import { useState, useEffect } from "react";
import { Opportunity } from "./types";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "./lib/utils";

export const LeadOppPanel: React.FC<{ leadId: number }> = ({ leadId }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    useEffect(() => {
        axios.get("/api/opportunities").then(res => {
            setOpportunities(res.data.filter((opp: Opportunity) => opp.lead.id === leadId));
        });
    }, [leadId]);

    const deleteOpportunity = async (oppId: number) => {
        await axios.delete(`/api/opportunities/${oppId}`);
        setOpportunities(prev => prev.filter(o => o.id !== oppId));
    };

    return (
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
    );
};
