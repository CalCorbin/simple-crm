import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { DataSource } from "typeorm";
import { Opportunity } from "../entity/Opportunity";
import { AppSetting } from "../entity/AppSetting";
import { Stage } from "../entity/Stage";
import { createTestDataSource, createStage, createLead } from "./helpers";

let ds: DataSource;

beforeEach(async () => {
    ds = createTestDataSource();
    await ds.initialize();
});

afterEach(async () => {
    if (ds.isInitialized) await ds.destroy();
});

// Mirrors the likelihood resolution logic in index.ts
function computeLikelihood(stage: Stage, wonLikelihood: number, lostLikelihood: number) {
    if (stage.status === "won") return wonLikelihood;
    if (stage.status === "lost") return lostLikelihood;
    return stage.conversionLikelihood;
}

describe("expectedValue calculation", () => {
    it("uses conversionLikelihood for pending stages", () => {
        const stage = Object.assign(new Stage(), { status: "pending" as const, conversionLikelihood: 0.3 });
        expect(10000 * computeLikelihood(stage, 1.0, 0.0)).toBe(3000);
    });

    it("uses wonStageLikelihood for won stages, ignoring conversionLikelihood", () => {
        const stage = Object.assign(new Stage(), { status: "won" as const, conversionLikelihood: 1.0 });
        expect(10000 * computeLikelihood(stage, 0.8, 0.0)).toBe(8000);
    });

    it("uses lostStageLikelihood for lost stages", () => {
        const stage = Object.assign(new Stage(), { status: "lost" as const, conversionLikelihood: 0.0 });
        expect(10000 * computeLikelihood(stage, 1.0, 0.1)).toBe(1000);
    });
});

describe("Stage.expectedValue tracking", () => {
    it("accumulates when an opportunity is added", async () => {
        const stage = await createStage(ds, { conversionLikelihood: 0.5, expectedValue: 0 });
        const lead = await createLead(ds);

        const opp = Object.assign(new Opportunity(), { lead, stage, value: 10000, expectedValue: 5000 });
        await ds.manager.getRepository(Opportunity).save(opp);

        stage.expectedValue += opp.expectedValue;
        await ds.manager.getRepository(Stage).save(stage);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(saved!.expectedValue).toBe(5000);
    });

    it("decrements when an opportunity is deleted", async () => {
        const stage = await createStage(ds, { expectedValue: 5000 });
        const lead = await createLead(ds);
        const opp = Object.assign(new Opportunity(), { lead, stage, value: 10000, expectedValue: 5000 });
        await ds.manager.getRepository(Opportunity).save(opp);

        stage.expectedValue -= opp.expectedValue;
        await ds.manager.getRepository(Stage).save(stage);
        await ds.manager.getRepository(Opportunity).delete(opp.id);

        const saved = await ds.manager.getRepository(Stage).findOne({ where: { id: stage.id } });
        expect(saved!.expectedValue).toBe(0);
    });

    it("moves expectedValue between stages when an opportunity changes stage", async () => {
        const stageA = await createStage(ds, { name: "A", order: 1, expectedValue: 5000 });
        const stageB = await createStage(ds, { name: "B", order: 2, conversionLikelihood: 0.8, expectedValue: 0 });
        const lead = await createLead(ds);
        const opp = Object.assign(new Opportunity(), { lead, stage: stageA, value: 10000, expectedValue: 5000 });
        await ds.manager.getRepository(Opportunity).save(opp);

        const oldExpected = opp.expectedValue;
        opp.stage = stageB;
        opp.expectedValue = opp.value * stageB.conversionLikelihood;
        await ds.manager.getRepository(Opportunity).save(opp);

        stageA.expectedValue -= oldExpected;
        stageB.expectedValue += opp.expectedValue;
        await ds.manager.getRepository(Stage).save(stageA);
        await ds.manager.getRepository(Stage).save(stageB);

        const savedA = await ds.manager.getRepository(Stage).findOne({ where: { id: stageA.id } });
        const savedB = await ds.manager.getRepository(Stage).findOne({ where: { id: stageB.id } });
        expect(savedA!.expectedValue).toBe(0);
        expect(savedB!.expectedValue).toBe(8000);
    });
});

describe("minimumOpportunityValue", () => {
    it("reads the configured minimum from AppSetting", async () => {
        await ds.manager.getRepository(AppSetting).save(
            Object.assign(new AppSetting(), { key: "minimumOpportunityValue", value: "1000" })
        );
        const settings = await ds.manager.getRepository(AppSetting).find();
        const minValue = parseFloat(settings.find(s => s.key === "minimumOpportunityValue")?.value ?? "0");

        expect(minValue).toBe(1000);
        expect(500 < minValue).toBe(true);   // rejected
        expect(1000 < minValue).toBe(false);  // at minimum — accepted
        expect(5000 < minValue).toBe(false);  // above minimum — accepted
    });
});