import axios from "axios";
import { useEffect, useState } from "react";
import { Lead, Opportunity } from "./types";
import { LeadRow } from "./lead-row";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Leads: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [oppCounts, setOppCounts] = useState<Record<number, number>>({});

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

    return (
        <div className="w-full">
            <h2 className="text-xl font-bold mb-4">Leads</h2>
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
