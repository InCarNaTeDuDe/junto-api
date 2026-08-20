import {
  DeepPartial,
  DeleteResult,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  UpdateResult,
} from "typeorm";
import { AppDataSource } from "../db/data-source";

export abstract class BaseRepository<T extends ObjectLiteral> {
  protected entityClass: EntityTarget<T>;

  constructor(entityClass: EntityTarget<T>) {
    this.entityClass = entityClass;
  }

  /**
   * Retrieves the underlying TypeORM Repository instance from AppDataSource.
   */
  protected get repo(): Repository<T> {
    return AppDataSource.getRepository(this.entityClass);
  }

  /**
   * Check if the database connection is active.
   */
  protected get isConnected(): boolean {
    return Boolean(AppDataSource.isInitialized);
  }

  /**
   * Create a new entity instance and persist it to the database.
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(data);
    return (await this.repo.save(entity as DeepPartial<T>)) as T;
  }

  /**
   * Find an entity by its primary ID.
   */
  async findById(
    id: string | number,
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    if (!this.isConnected) return null;
    const whereClause = { id } as unknown as FindOptionsWhere<T>;
    return this.repo.findOne({
      where: whereClause,
      ...(options || {}),
    });
  }

  /**
   * Find a single entity matching the specified options.
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    if (!this.isConnected) return null;
    return this.repo.findOne(options);
  }

  /**
   * Find all entities matching the query options.
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    if (!this.isConnected) return [];
    return this.repo.find(options);
  }

  /**
   * Alias for findAll with query options.
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    if (!this.isConnected) return [];
    return this.repo.find(options);
  }

  /**
   * Update an entity or set of entities matching conditions.
   */
  async update(
    criteria: string | number | FindOptionsWhere<T>,
    data: any,
  ): Promise<UpdateResult> {
    if (typeof criteria === "string" || typeof criteria === "number") {
      return this.repo.update(
        { id: criteria } as unknown as FindOptionsWhere<T>,
        data,
      );
    }
    return this.repo.update(criteria, data);
  }

  /**
   * Delete an entity or set of entities matching conditions.
   */
  async delete(
    criteria: string | number | FindOptionsWhere<T>,
  ): Promise<DeleteResult> {
    if (typeof criteria === "string" || typeof criteria === "number") {
      return this.repo.delete({
        id: criteria,
      } as unknown as FindOptionsWhere<T>);
    }
    return this.repo.delete(criteria);
  }

  /**
   * Count entities matching options.
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    if (!this.isConnected) return 0;
    return this.repo.count(options);
  }

  /**
   * Save a single entity instance or partial object.
   */
  async save(entity: DeepPartial<T>): Promise<T> {
    return this.repo.save(entity);
  }

  /**
   * Save multiple entity instances in batch.
   */
  async saveMany(entities: DeepPartial<T>[]): Promise<T[]> {
    if (!entities.length) return [];
    return this.repo.save(entities);
  }
}
