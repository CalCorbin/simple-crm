import { useState, useEffect } from "react";
import axios from "axios";
import { CustomField } from "../../types";

export const AddLead: React.FC<{ triggerRefresh?: number; onSuccess?: () => void }> = ({ triggerRefresh = 0, onSuccess }) => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [age, setAge] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCustomFields();
    }, [triggerRefresh]);

    const fetchCustomFields = async () => {
        const result = await axios.get("/api/custom-fields");
        setCustomFields(result.data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await axios.post("/api/leads", {
                firstName,
                lastName,
                age,
                phoneNumber,
                customFields: customFieldValues,
            });
            if (onSuccess) {
                onSuccess();
            } else {
                setSuccess(true);
                setFirstName("");
                setLastName("");
                setAge("");
                setPhoneNumber("");
                setCustomFieldValues({});
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setError((error as any).response.data);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">Lead added successfully</p>}
            <div>
                <label htmlFor="add-lead-first-name" className="block text-sm text-muted-foreground mb-1">First Name</label>
                <input
                    id="add-lead-first-name"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded"
                />
            </div>
            <div>
                <label htmlFor="add-lead-last-name" className="block text-sm text-muted-foreground mb-1">Last Name</label>
                <input
                    id="add-lead-last-name"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded"
                />
            </div>
            <div>
                <label htmlFor="add-lead-age" className="block text-sm text-muted-foreground mb-1">Age</label>
                <input
                    id="add-lead-age"
                    type="text"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded"
                />
            </div>
            <div>
                <label htmlFor="add-lead-phone" className="block text-sm text-muted-foreground mb-1">Phone Number</label>
                <input
                    id="add-lead-phone"
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded"
                />
            </div>
            {customFields.map(field => (
                <div key={field.id}>
                    <label htmlFor={`add-lead-custom-${field.name}`} className="block text-sm text-muted-foreground mb-1">{field.label}</label>
                    <input
                        id={`add-lead-custom-${field.name}`}
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
            <button type="submit" disabled={loading} className="block w-full p-2 bg-blue-500 text-white rounded">
                Add Lead
            </button>
        </form>
    );
};
