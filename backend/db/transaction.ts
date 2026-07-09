// db/transaction.ts

import { AppDataSource } from "./data-source";

export async function runInTransaction<T>(fn: (manager: any) => Promise<T>) {
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await fn(queryRunner.manager);
    await queryRunner.commitTransaction();
    return result;
  } catch (e) {
    await queryRunner.rollbackTransaction();
    throw e;
  } finally {
    await queryRunner.release();
  }
}
