import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { DataSource } from "typeorm";
import { Stage } from "../entity/Stage";
import { Opportunity } from "../entity/Opportunity";
import { createTestDataSource, createStage, createLead } from "./helpers";

let ds: DataSource;

beforeEach(async () => {
    ds = createTestDataSource();
    await ds.initialize();
});

afterEach(async () => {
    if (ds.isInitialized) await ds.destroy();
});

// Mirrors the cascade logic in index.ts PUT /settings/:key
async function applyStageLikelihoodChange(
    ds: DataSource,
    key: "wonStageLikelihood" | "lostStageLikelihood",
    newLikelihood: number
) {
    const status = key === "wonStageLikelihood" ? "won" : "lost";
    const stagesRepo = ds.manager.getRepository(Stage);
    const oppsRepo = ds.manager.getRepository(Opportunity);
    const stages = await stagesRepo.find({ where: { status } });
    for (const stage of stages) {
        const stageOpps = await oppsRepo.find({ where: { stage: { id: stage.id } } });
        stage.expectedValue = stageOpps.reduce((sum, opp) => sum + opp.value * newLikelihood, 0);
        await stagesRepo.save(stage);
    }
}

async function createOpp(ds: DataSource, stage: Stage, value: number, expectedValue: number) {
    const lead = await createLead(ds);
    return ds.manager.getRepository(Opportunity).save(
        Object.assign(new Opportunity(), { lead, stage, value, expectedValue })
    );
}

describe("wonStageLikelihood setting change", () => {
    it("recalculates Stage.expectedValue for a won stage", async () => {
        const stage = await createStage(ds, { status: "won", conversionLikelihood: 1.0, expectedValue: 10000 });
        await createOpp(ds, stage, 10000, 10000);

        await applyStageLikelihoodChange(ds, "wonStageLikelihood", 0.8);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(saved!.expectedValue).toBe(8000);
    });

    it("sums across all opportunities in the won stage", async () => {
        const stage = await createStage(ds, { status: "won", conversionLikelihood: 1.0, expectedValue: 15000 });
        await createOpp(ds, stage, 10000, 10000);
        await createOpp(ds, stage, 5000, 5000);

        await applyStageLikelihoodChange(ds, "wonStageLikelihood", 0.5);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(saved!.expectedValue).toBe(7500);
    });

    it("updates all won stages independently", async () => {
        const stageA = await createStage(ds, { name: "Won A", status: "won", order: 1, conversionLikelihood: 1.0, expectedValue: 10000 });
        const stageB = await createStage(ds, { name: "Won B", status: "won", order: 2, conversionLikelihood: 1.0, expectedValue: 4000 });
        await createOpp(ds, stageA, 10000, 10000);
        await createOpp(ds, stageB, 4000, 4000);

        await applyStageLikelihoodChange(ds, "wonStageLikelihood", 0.9);

        const savedA = await ds.manager.getRepository(Stage).findOne({ where: { id: stageA.id } });
        const savedB = await ds.manager.getRepository(Stage).findOne({ where: { id: stageB.id } });
        expect(savedA!.expectedValue).toBe(9000);
        expect(savedB!.expectedValue).toBe(3600);
    });

    it("sets expectedValue to 0 for a won stage with no opportunities", async () => {
        const stage = await createStage(ds, { status: "won", conversionLikelihood: 1.0, expectedValue: 0 });

        await applyStageLikelihoodChange(ds, "wonStageLikelihood", 0.8);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(saved!.expectedValue).toBe(0);
    });

    it("does not affect lost stages", async () => {
        const lostStage = await createStage(ds, { status: "lost", conversionLikelihood: 0.0, expectedValue: 500 });
        await createOpp(ds, lostStage, 10000, 500);

        await applyStageLikelihoodChange(ds, "wonStageLikelihood", 0.8);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: lostStage.id } });
        expect(saved!.expectedValue).toBe(500);
    });

    it("does not affect pending stages", async () => {
        const pendingStage = await createStage(ds, { status: "pending", conversionLikelihood: 0.4, expectedValue: 4000 });
        await createOpp(ds, pendingStage, 10000, 4000);

        await applyStageLikelihoodChange(ds, "wonStageLikelihood", 0.8);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: pendingStage.id } });
        expect(saved!.expectedValue).toBe(4000);
    });
});

describe("lostStageLikelihood setting change", () => {
    it("recalculates Stage.expectedValue for a lost stage", async () => {
        const stage = await createStage(ds, { status: "lost", conversionLikelihood: 0.0, expectedValue: 0 });
        await createOpp(ds, stage, 10000, 0);

        await applyStageLikelihoodChange(ds, "lostStageLikelihood", 0.1);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(saved!.expectedValue).toBe(1000);
    });

    it("sums across all opportunities in the lost stage", async () => {
        const stage = await createStage(ds, { status: "lost", conversionLikelihood: 0.0, expectedValue: 0 });
        await createOpp(ds, stage, 8000, 0);
        await createOpp(ds, stage, 2000, 0);

        await applyStageLikelihoodChange(ds, "lostStageLikelihood", 0.05);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(saved!.expectedValue).toBe(500);
    });

    it("does not affect won stages", async () => {
        const wonStage = await createStage(ds, { status: "won", conversionLikelihood: 1.0, expectedValue: 10000 });
        await createOpp(ds, wonStage, 10000, 10000);

        await applyStageLikelihoodChange(ds, "lostStageLikelihood", 0.1);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: wonStage.id } });
        expect(saved!.expectedValue).toBe(10000);
    });

    it("does not affect pending stages", async () => {
        const pendingStage = await createStage(ds, { status: "pending", conversionLikelihood: 0.4, expectedValue: 4000 });
        await createOpp(ds, pendingStage, 10000, 4000);

        await applyStageLikelihoodChange(ds, "lostStageLikelihood", 0.1);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: pendingStage.id } });
        expect(saved!.expectedValue).toBe(4000);
    });
});
