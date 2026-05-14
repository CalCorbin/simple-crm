import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { DataSource } from "typeorm";
import request from "supertest";
import { buildApp } from "../index";
import { Stage } from "../entity/Stage";
import { AppSetting } from "../entity/AppSetting";
import { createTestDataSource, createStage, createLead } from "./helpers";

let ds: DataSource;
let app: ReturnType<typeof buildApp>;

beforeEach(async () => {
    ds = createTestDataSource();
    await ds.initialize();
    app = buildApp(ds);
});

afterEach(async () => {
    if (ds.isInitialized) await ds.destroy();
});

// ─── Leads ───────────────────────────────────────────────────────────────────

describe("POST /leads", () => {
    it("creates and returns a lead", async () => {
        const res = await request(app)
            .post("/leads")
            .send({ firstName: "Jane", lastName: "Doe", age: 28, phoneNumber: "555-1234" });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ firstName: "Jane", lastName: "Doe", age: 28 });
    });
});

describe("GET /leads", () => {
    it("returns all leads", async () => {
        await createLead(ds);
        const res = await request(app).get("/leads");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

describe("PUT /leads/:id", () => {
    it("updates lead fields", async () => {
        const lead = await createLead(ds);
        const res = await request(app)
            .put(`/leads/${lead.id}`)
            .send({ firstName: "Updated", lastName: "Name", age: 35, phoneNumber: "555-9999" });
        expect(res.status).toBe(200);
        expect(res.body.firstName).toBe("Updated");
        expect(res.body.age).toBe(35);
    });
});

// ─── Stages ──────────────────────────────────────────────────────────────────

describe("POST /stages", () => {
    it("creates a stage and assigns it order 1 when none exist", async () => {
        const res = await request(app)
            .post("/stages")
            .send({ name: "Prospect", status: "pending", conversionLikelihood: 0.3 });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ name: "Prospect", status: "pending", order: 1 });
    });

    it("assigns incrementing order values", async () => {
        await request(app).post("/stages").send({ name: "A", status: "pending", conversionLikelihood: 0.3 });
        const res = await request(app).post("/stages").send({ name: "B", status: "won", conversionLikelihood: 1.0 });
        expect(res.body.order).toBe(2);
    });
});

describe("GET /stages", () => {
    it("returns stages sorted by order ascending", async () => {
        await createStage(ds, { name: "Second", order: 2 });
        await createStage(ds, { name: "First", order: 1 });
        const res = await request(app).get("/stages");
        expect(res.status).toBe(200);
        expect(res.body[0].name).toBe("First");
        expect(res.body[1].name).toBe("Second");
    });
});

describe("PUT /stages/:id", () => {
    it("updates stage fields", async () => {
        const stage = await createStage(ds, { name: "Old", conversionLikelihood: 0.3 });
        const res = await request(app)
            .put(`/stages/${stage.id}`)
            .send({ name: "New", status: "won", conversionLikelihood: 1.0 });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("New");
        expect(res.body.status).toBe("won");
    });

    it("updates the order when provided", async () => {
        const stage = await createStage(ds, { order: 1 });
        const res = await request(app)
            .put(`/stages/${stage.id}`)
            .send({ name: stage.name, status: stage.status, conversionLikelihood: stage.conversionLikelihood, order: 5 });
        expect(res.body.order).toBe(5);
    });
});

describe("DELETE /stages/:id", () => {
    it("removes the stage", async () => {
        const stage = await createStage(ds);
        const res = await request(app).delete(`/stages/${stage.id}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
        const remaining = await ds.manager.getRepository(Stage).find();
        expect(remaining).toHaveLength(0);
    });
});

// ─── Settings ────────────────────────────────────────────────────────────────

describe("GET /settings", () => {
    it("returns all settings", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "minimumOpportunityValue", value: "500" })
        );
        const res = await request(app).get("/settings");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({ key: "minimumOpportunityValue", value: "500" });
    });
});

describe("PUT /settings/:key", () => {
    it("creates a new setting when the key does not exist", async () => {
        const res = await request(app)
            .put("/settings/minimumOpportunityValue")
            .send({ value: "1000" });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ key: "minimumOpportunityValue", value: "1000" });
    });

    it("updates an existing setting", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "minimumOpportunityValue", value: "500" })
        );
        const res = await request(app)
            .put("/settings/minimumOpportunityValue")
            .send({ value: "2000" });
        expect(res.status).toBe(200);
        expect(res.body.value).toBe("2000");
    });

    it("cascades wonStageLikelihood change to all won stages", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "wonStageLikelihood", value: "1.0" })
        );
        const stage = await createStage(ds, { status: "won", conversionLikelihood: 1.0, expectedValue: 10000 });
        const lead = await createLead(ds);
        await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 10000, name: "Deal" });

        await request(app).put("/settings/wonStageLikelihood").send({ value: "0.8" });

        const updated = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(updated!.expectedValue).toBe(8000);
    });

    it("cascades lostStageLikelihood change to all lost stages", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "lostStageLikelihood", value: "0.0" })
        );
        const stage = await createStage(ds, { status: "lost", conversionLikelihood: 0.0, expectedValue: 0 });
        const lead = await createLead(ds);
        await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 10000, name: "Deal" });

        await request(app).put("/settings/lostStageLikelihood").send({ value: "0.1" });

        const updated = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(updated!.expectedValue).toBe(1000);
    });
});

// ─── Custom Fields ────────────────────────────────────────────────────────────

describe("POST /custom-fields", () => {
    it("creates a custom field", async () => {
        const res = await request(app)
            .post("/custom-fields")
            .send({ name: "industry", label: "Industry", entity: "lead", type: "text" });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ name: "industry", label: "Industry" });
    });

    it("returns 400 when field name already exists", async () => {
        await request(app).post("/custom-fields").send({ name: "industry", label: "Industry" });
        const res = await request(app).post("/custom-fields").send({ name: "industry", label: "Industry 2" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Field name already exists");
    });
});

describe("GET /custom-fields", () => {
    it("returns all custom fields", async () => {
        await request(app).post("/custom-fields").send({ name: "industry", label: "Industry" });
        const res = await request(app).get("/custom-fields");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

describe("DELETE /custom-fields/:id", () => {
    it("removes the custom field", async () => {
        const created = await request(app)
            .post("/custom-fields")
            .send({ name: "industry", label: "Industry" });
        const res = await request(app).delete(`/custom-fields/${created.body.id}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
        const list = await request(app).get("/custom-fields");
        expect(list.body).toHaveLength(0);
    });
});

// ─── Opportunities ────────────────────────────────────────────────────────────

describe("minimumOpportunityValue enforcement on create", () => {
    it("rejects an opportunity whose value is below the minimum", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "minimumOpportunityValue", value: "1000" })
        );
        const stage = await createStage(ds);
        const lead = await createLead(ds);
        const res = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 999, name: "Too small" });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain("1000");
    });

    it("accepts an opportunity whose value equals the minimum", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "minimumOpportunityValue", value: "1000" })
        );
        const stage = await createStage(ds);
        const lead = await createLead(ds);
        const res = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 1000, name: "At minimum" });
        expect(res.status).toBe(200);
    });
});

describe("minimumOpportunityValue enforcement on update", () => {
    it("rejects an update that brings value below the minimum", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "minimumOpportunityValue", value: "1000" })
        );
        const stage = await createStage(ds);
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 5000, name: "Big deal" });
        const res = await request(app)
            .put(`/opportunities/${created.body.id}`)
            .send({ value: 500 });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain("1000");
    });

    it("accepts an update that keeps value at or above the minimum", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "minimumOpportunityValue", value: "1000" })
        );
        const stage = await createStage(ds);
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 5000, name: "Big deal" });
        const res = await request(app)
            .put(`/opportunities/${created.body.id}`)
            .send({ value: 2000 });
        expect(res.status).toBe(200);
        expect(res.body.value).toBe(2000);
    });
});

describe("PUT /opportunities/:id field updates", () => {
    it("updates the name when provided", async () => {
        const stage = await createStage(ds);
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 5000, name: "Original" });
        const res = await request(app)
            .put(`/opportunities/${created.body.id}`)
            .send({ name: "Renamed" });
        expect(res.body.name).toBe("Renamed");
    });

    it("updates customFields when provided", async () => {
        const stage = await createStage(ds);
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 5000, name: "Deal" });
        const res = await request(app)
            .put(`/opportunities/${created.body.id}`)
            .send({ customFields: { region: "west" } });
        expect(res.body.customFields).toEqual({ region: "west" });
    });

    it("uses wonStageLikelihood when the opportunity is on a won stage", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "wonStageLikelihood", value: "0.9" })
        );
        const stage = await createStage(ds, { status: "won", conversionLikelihood: 1.0, expectedValue: 0 });
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 10000, name: "Deal" });
        const res = await request(app)
            .put(`/opportunities/${created.body.id}`)
            .send({ value: 20000 });
        expect(res.body.expectedValue).toBe(18000);
    });

    it("uses lostStageLikelihood when the opportunity is on a lost stage", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "lostStageLikelihood", value: "0.05" })
        );
        const stage = await createStage(ds, { status: "lost", conversionLikelihood: 0.0, expectedValue: 0 });
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 10000, name: "Deal" });
        const res = await request(app)
            .put(`/opportunities/${created.body.id}`)
            .send({ value: 20000 });
        expect(res.body.expectedValue).toBe(1000);
    });
});

describe("PUT /opportunities/:id stage change", () => {
    it("moves Stage.expectedValue from the old stage to the new stage", async () => {
        const stageA = await createStage(ds, { name: "A", order: 1, conversionLikelihood: 0.5, expectedValue: 0 });
        const stageB = await createStage(ds, { name: "B", order: 2, conversionLikelihood: 0.8, expectedValue: 0 });
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stageA.id, value: 10000, name: "Deal" });

        await request(app)
            .put(`/opportunities/${created.body.id}`)
            .send({ stageId: stageB.id });

        const savedA = await ds.manager.getRepository(Stage).findOne({ where: { id: stageA.id } });
        const savedB = await ds.manager.getRepository(Stage).findOne({ where: { id: stageB.id } });
        expect(savedA!.expectedValue).toBe(0);
        expect(savedB!.expectedValue).toBe(8000);
    });

    it("handles moving an opportunity with zero expectedValue between stages", async () => {
        // conversionLikelihood: 0 means opp.expectedValue = 0 and stageA.expectedValue = 0,
        // exercising the || 0 fallbacks on both opp.expectedValue and oldStage.expectedValue.
        const stageA = await createStage(ds, { name: "A", order: 1, conversionLikelihood: 0, expectedValue: 0 });
        const stageB = await createStage(ds, { name: "B", order: 2, conversionLikelihood: 0.5, expectedValue: 0 });
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stageA.id, value: 10000, name: "Deal" });

        await request(app)
            .put(`/opportunities/${created.body.id}`)
            .send({ stageId: stageB.id });

        const savedB = await ds.manager.getRepository(Stage).findOne({ where: { id: stageB.id } });
        expect(savedB!.expectedValue).toBe(5000);
    });
});

describe("GET /opportunities", () => {
    it("returns all opportunities", async () => {
        const stage = await createStage(ds);
        const lead = await createLead(ds);
        await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 5000, name: "Deal" });
        const res = await request(app).get("/opportunities");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

describe("DELETE /opportunities/:id", () => {
    it("removes the opportunity", async () => {
        const stage = await createStage(ds);
        const lead = await createLead(ds);
        const created = await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 5000, name: "Deal" });
        const res = await request(app).delete(`/opportunities/${created.body.id}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
        const list = await request(app).get("/opportunities");
        expect(list.body).toHaveLength(0);
    });
});

// ─── Pipeline ─────────────────────────────────────────────────────────────────

describe("GET /pipeline", () => {
    it("aggregates totalValue and expectedValue across all stages", async () => {
        const stage = await createStage(ds, { conversionLikelihood: 0.5, expectedValue: 0 });
        const lead = await createLead(ds);
        await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 10000, name: "Deal A" });
        await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 6000, name: "Deal B" });
        const res = await request(app).get("/pipeline");
        expect(res.status).toBe(200);
        expect(res.body.totalValue).toBe(16000);
        expect(res.body.expectedValue).toBe(8000);
    });

    it("returns per-stage counts and totals", async () => {
        const stage = await createStage(ds, { name: "Prospect", conversionLikelihood: 0.4, expectedValue: 0 });
        const lead = await createLead(ds);
        await request(app)
            .post("/opportunities")
            .send({ leadId: lead.id, stageId: stage.id, value: 5000, name: "Deal" });
        const res = await request(app).get("/pipeline");
        expect(res.body.byStage[0]).toMatchObject({
            count: 1,
            totalValue: 5000,
            expectedValue: 2000,
        });
    });
});
