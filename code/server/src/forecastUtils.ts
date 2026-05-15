const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(year: number, month: number): string {
    return `${MONTH_ABBR[month]} ${year}`;
}

export function getBucketLabels(today: Date): string[] {
    const labels = ["Past"];
    for (let i = 0; i < 6; i++) {
        const m = (today.getUTCMonth() + i) % 12;
        const y = today.getUTCFullYear() + Math.floor((today.getUTCMonth() + i) / 12);
        labels.push(monthLabel(y, m));
    }
    labels.push("Beyond 6 Months", "No Close Date");
    return labels;
}

export function getBucketLabel(closeDate: string | null, today: Date): string {
    if (!closeDate) return "No Close Date";
    const close = new Date(closeDate + "T00:00:00Z");
    const cy = today.getUTCFullYear(), cm = today.getUTCMonth();
    const fy = close.getUTCFullYear(), fm = close.getUTCMonth();
    if (fy < cy || (fy === cy && fm < cm)) return "Past";
    for (let i = 0; i < 6; i++) {
        const tm = (cm + i) % 12;
        const ty = cy + Math.floor((cm + i) / 12);
        if (fy === ty && fm === tm) return monthLabel(ty, tm);
    }
    return "Beyond 6 Months";
}

export function buildForecastBuckets(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openOpps: { closeDate?: string | null; expectedValue?: number; customFields?: Record<string, any> }[],
    today: Date,
    customField?: { name: string } | null
): object[] {
    const labels = getBucketLabels(today);
    return labels.map(label => {
        const bucketOpps = openOpps.filter(opp => getBucketLabel(opp.closeDate ?? null, today) === label);
        if (customField) {
            const groupMap = new Map<string, { count: number; totalExpectedValue: number }>();
            for (const opp of bucketOpps) {
                const key = opp.customFields?.[customField.name] || "Unassigned";
                const entry = groupMap.get(key) ?? { count: 0, totalExpectedValue: 0 };
                entry.count++;
                entry.totalExpectedValue += opp.expectedValue ?? 0;
                groupMap.set(key, entry);
            }
            const groups = Array.from(groupMap.entries()).map(([groupValue, data]) => ({ groupValue, ...data }));
            return { label, groups };
        }
        return {
            label,
            count: bucketOpps.length,
            totalExpectedValue: bucketOpps.reduce((sum, opp) => sum + (opp.expectedValue ?? 0), 0),
        };
    });
}
