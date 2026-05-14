import { DataSource } from "typeorm";
import { Lead } from "../entity/Lead";
import { Stage } from "../entity/Stage";
import { Opportunity } from "../entity/Opportunity";
import { AppSetting } from "../entity/AppSetting";
import { CustomField } from "../entity/CustomField";

export function createTestDataSource() {
    return new DataSource({
        type: "sqlite",
        database: ":memory:",
        synchronize: true,
        logging: false,
        entities: [Lead, Stage, Opportunity, AppSetting, CustomField],
    });
}

export async function createStage(ds: DataSource, overrides: Partial<Stage> = {}) {
    return ds.manager.getRepository(Stage).save(
        Object.assign(new Stage(), {
            name: "Test Stage",
            status: "pending" as const,
            conversionLikelihood: 0.5,
            order: 1,
            expectedValue: 0,
            ...overrides,
        })
    );
}

export async function createLead(ds: DataSource) {
    return ds.manager.getRepository(Lead).save(
        Object.assign(new Lead(), {
            firstName: "Test",
            lastName: "Lead",
            age: 30,
            phoneNumber: "555-0000",
        })
    );
}