export function bucketAccent(label: string): string {
    if (label === "Past") return "border-amber-400 bg-amber-50";
    if (label === "Beyond 6 Months" || label === "No Close Date") return "border-gray-300 bg-gray-50";
    return "border-blue-400 bg-white";
}

export const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
