import { useState } from "react";
import { Lead } from "../../types";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LeadEditDialog } from "./lead-edit-dialog";
import { LeadOppPanel } from "./lead-opps-panel";

export const LeadRow: React.FC<{ lead: Lead; oppCount: number; onUpdate: () => void }> = ({ lead, oppCount, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showOpps, setShowOpps] = useState(false);

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
                <TableCell>{lead.firstName}</TableCell>
                <TableCell>{lead.lastName}</TableCell>
                <TableCell>{lead.age}</TableCell>
                <TableCell>{lead.phoneNumber}</TableCell>
            </TableRow>
            {showOpps && <LeadOppPanel lead={lead} />}
            <LeadEditDialog lead={lead} open={isEditing} onOpenChange={setIsEditing} onUpdate={onUpdate} />
        </>
    );
};