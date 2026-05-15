import "reflect-metadata";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { DataSource } from "typeorm";
import { Opportunity } from "../entity/Opportunity";
import { CustomField } from "../entity/CustomField";
import { getBucketLabel, getBucketLabels, buildForecastBuckets } from "../forecastUtils";
import { createTestDataSource, createLead, createStage } from "./helpers";

const TODAY = new Date("2026-05-15T00:00:00Z");

describe("getBucketLabel", () => {
    it("returns 'No Close Date' for null", () => {
        expect(getBucketLabel(null, TODAY)).toBe("No Close Date");
    });

    it("returns 'Past' for a close date in a prior month", () => {
        expect(getBucketLabel("2026-04-30", TODAY)).toBe("Past");
    });

    it("returns 'Past' for a close date in a prior year", () => {
        expect(getBucketLabel("2025-12-31", TODAY)).toBe("Past");
    });

    it("returns the current month label for the first of the current month", () => {
        expect(getBucketLabel("2026-05-01", TODAY)).toBe("May 2026");
    });

    it("returns the current month label for a mid-month date", () => {
        expect(getBucketLabel("2026-05-31", TODAY)).toBe("May 2026");
    });

    it("returns month 6 label for the last day of month 6", () => {
        expect(getBucketLabel("2026-10-31", TODAY)).toBe("Oct 2026");
    });

    it("returns 'Beyond 6 Months' for month 7 and beyond", () => {
        expect(getBucketLabel("2026-11-01", TODAY)).toBe("Beyond 6 Months");
    });

    it("returns 'Beyond 6 Months' for a far-future date", () => {
        expect(getBucketLabel("2030-01-01", TODAY)).toBe("Beyond 6 Months");
    });
});

describe("getBucketLabels", () => {
    it("returns 9 labels in the correct order", () => {
        const labels = getBucketLabels(TODAY);
        expect(labels).toEqual([
            "Past",
            "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026",
            "Beyond 6 Months",
            "No Close Date",
        ]);
    });

    it("wraps correctly across a year boundary", () => {
        const nov = new Date("2026-11-01T00:00:00Z");
        const labels = getBucketLabels(nov);
        expect(labels).toEqual([
            "Past",
            "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027", "Mar 2027", "Apr 2027",
            "Beyond 6 Months",
            "No Close Date",
        ]);
    });
});

describe("buildForecastBuckets without groupBy", () => {
    let ds: DataSource;

    beforeEach(async () => {
        ds = createTestDataSource();
        await ds.initialize();
    });

    afterEach(async () => {
        await ds.destroy();
    });

    it("excludes won-stage opportunities from all buckets", async () => {
        const lead = await createLead(ds);
        const wonStage = await createStage(ds, { status: "won", conversionLikelihood: 1 });
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage: wonStage, value: 100, expectedValue: 100, closeDate: "2026-05-20" })
        );
        const all = await ds.manager.getRepository(Opportunity).find();
        const open = all.filter(opp => opp.stage.status === "pending");
        const buckets = buildForecastBuckets(open, TODAY) as { label: string; count: number }[];
        const total = buckets.reduce((s, b) => s + b.count, 0);
        expect(total).toBe(0);
    });

    it("excludes lost-stage opportunities from all buckets", async () => {
        const lead = await createLead(ds);
        const lostStage = await createStage(ds, { status: "lost", conversionLikelihood: 0 });
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage: lostStage, value: 100, expectedValue: 0, closeDate: "2026-05-20" })
        );
        const all = await ds.manager.getRepository(Opportunity).find();
        const open = all.filter(opp => opp.stage.status === "pending");
        const buckets = buildForecastBuckets(open, TODAY) as { label: string; count: number }[];
        const total = buckets.reduce((s, b) => s + b.count, 0);
        expect(total).toBe(0);
    });

    it("places a past-close-date opportunity in the 'Past' bucket", async () => {
        const lead = await createLead(ds);
        const stage = await createStage(ds);
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage, value: 200, expectedValue: 100, closeDate: "2026-03-15" })
        );
        const all = await ds.manager.getRepository(Opportunity).find();
        const open = all.filter(opp => opp.stage.status === "pending");
        const buckets = buildForecastBuckets(open, TODAY) as { label: string; count: number }[];
        const past = buckets.find(b => b.label === "Past")!;
        expect(past.count).toBe(1);
    });

    it("places a null-close-date opportunity in the 'No Close Date' bucket", async () => {
        const lead = await createLead(ds);
        const stage = await createStage(ds);
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage, value: 200, expectedValue: 100, closeDate: null })
        );
        const all = await ds.manager.getRepository(Opportunity).find();
        const open = all.filter(opp => opp.stage.status === "pending");
        const buckets = buildForecastBuckets(open, TODAY) as { label: string; count: number }[];
        const ncd = buckets.find(b => b.label === "No Close Date")!;
        expect(ncd.count).toBe(1);
    });

    it("sums totalExpectedValue correctly for a bucket", async () => {
        const lead = await createLead(ds);
        const stage = await createStage(ds);
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage, value: 400, expectedValue: 200, closeDate: "2026-06-10" })
        );
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage, value: 600, expectedValue: 300, closeDate: "2026-06-25" })
        );
        const all = await ds.manager.getRepository(Opportunity).find();
        const open = all.filter(opp => opp.stage.status === "pending");
        const buckets = buildForecastBuckets(open, TODAY) as { label: string; count: number; totalExpectedValue: number }[];
        const jun = buckets.find(b => b.label === "Jun 2026")!;
        expect(jun.count).toBe(2);
        expect(jun.totalExpectedValue).toBe(500);
    });
});

describe("buildForecastBuckets with groupBy", () => {
    let ds: DataSource;

    beforeEach(async () => {
        ds = createTestDataSource();
        await ds.initialize();
    });

    afterEach(async () => {
        await ds.destroy();
    });

    it("splits a bucket into groups by custom field value", async () => {
        const lead = await createLead(ds);
        const stage = await createStage(ds);
        const field = await ds.manager.getRepository(CustomField).save(
            Object.assign(new CustomField(), { name: "region", label: "Region", entity: "opportunity", type: "text" })
        );
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage, value: 100, expectedValue: 50, closeDate: "2026-07-01", customFields: { region: "East" } })
        );
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage, value: 200, expectedValue: 100, closeDate: "2026-07-15", customFields: { region: "West" } })
        );
        const all = await ds.manager.getRepository(Opportunity).find();
        const open = all.filter(opp => opp.stage.status === "pending");
        const buckets = buildForecastBuckets(open, TODAY, field) as { label: string; groups: { groupValue: string; count: number }[] }[];
        const jul = buckets.find(b => b.label === "Jul 2026")!;
        const groupValues = jul.groups.map(g => g.groupValue).sort();
        expect(groupValues).toEqual(["East", "West"]);
    });

    it("places an opportunity missing the grouped field into 'Unassigned'", async () => {
        const lead = await createLead(ds);
        const stage = await createStage(ds);
        const field = await ds.manager.getRepository(CustomField).save(
            Object.assign(new CustomField(), { name: "region", label: "Region", entity: "opportunity", type: "text" })
        );
        await ds.manager.getRepository(Opportunity).save(
            Object.assign(new Opportunity(), { lead, stage, value: 100, expectedValue: 50, closeDate: "2026-08-10", customFields: {} })
        );
        const all = await ds.manager.getRepository(Opportunity).find();
        const open = all.filter(opp => opp.stage.status === "pending");
        const buckets = buildForecastBuckets(open, TODAY, field) as { label: string; groups: { groupValue: string; count: number }[] }[];
        const aug = buckets.find(b => b.label === "Aug 2026")!;
        expect(aug.groups[0].groupValue).toBe("Unassigned");
        expect(aug.groups[0].count).toBe(1);
    });
});
