import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddLead } from "./add-lead";

export const AddLeadDialog: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    refreshTrigger?: number;
}> = ({ open, onOpenChange, onSuccess, refreshTrigger }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Lead</DialogTitle>
                </DialogHeader>
                {open && <AddLead onSuccess={onSuccess} refreshTrigger={refreshTrigger} />}
            </DialogContent>
        </Dialog>
    );
};
