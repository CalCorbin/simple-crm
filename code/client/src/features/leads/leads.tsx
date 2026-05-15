import axios from "axios";
import { useEffect, useState } from "react";
import { Lead, Opportunity } from "@/types.ts";
import { LeadRow } from "./lead-row";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddLeadDialog } from "./add-lead-dialog";

export const Leads: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [oppCounts, setOppCounts] = useState<Record<number, number>>({});
    const [addLeadOpen, setAddLeadOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [refreshTrigger]);

    const fetchData = async () => {
        const [leadsRes, oppsRes] = await Promise.all([
            axios.get("/api/leads"),
            axios.get("/api/opportunities"),
        ]);
        setLeads(leadsRes.data);
        const counts: Record<number, number> = {};
        for (const opp of oppsRes.data as Opportunity[]) {
            counts[opp.lead.id] = (counts[opp.lead.id] ?? 0) + 1;
        }
        setOppCounts(counts);
    };

    const handleLeadAdded = () => {
        setAddLeadOpen(false);
        fetchData();
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Leads</h2>
                <Button onClick={() => setAddLeadOpen(true)}>Add Lead</Button>
            </div>
            <AddLeadDialog
                open={addLeadOpen}
                onOpenChange={setAddLeadOpen}
                onSuccess={handleLeadAdded}
                refreshTrigger={refreshTrigger}
            />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-56">Actions</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Phone Number</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map(lead => (
                        <LeadRow
                            lead={lead}
                            key={lead.id}
                            oppCount={oppCounts[lead.id] ?? 0}
                            onUpdate={fetchData}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
