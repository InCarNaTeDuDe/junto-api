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
  public get repo(): Repository<T> {
    return AppDataSource.getRepository(this.entityClass);
  }

  /**
   * Alias for repo.
   */
  public get repository(): Repository<T> {
    return this.repo;
  }

  /**
   * Check if the database connection is active.
   */
  public get isConnected(): boolean {
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
   * Add a new entity (general helper method alias for create & save).
   */
  async add(data: DeepPartial<T>): Promise<T> {
    return this.create(data);
  }

  /**
   * Add multiple entities in batch (general helper method).
   */
  async addMany(entities: DeepPartial<T>[]): Promise<T[]> {
    return this.saveMany(entities);
  }

  /**
   * Find an entity by its primary ID.
   */
  async findById(
    id: string | number,
    options?: FindOneOptions<T>,
  ): Promise<any> {
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
  async findOne(options: FindOneOptions<T>): Promise<any> {
    if (!this.isConnected) return null;
    return this.repo.findOne(options);
  }

  /**
   * Find a single entity matching the where condition.
   */
  async findOneBy(where: FindOptionsWhere<T>): Promise<any> {
    if (!this.isConnected) return null;
    return this.repo.findOne({ where });
  }

  /**
   * Find all entities matching the query options.
   */
  async findAll(options?: FindManyOptions<T>): Promise<any[]> {
    if (!this.isConnected) return [];
    return this.repo.find(options);
  }

  /**
   * Alias for findAll with query options.
   */
  async find(options?: FindManyOptions<T>): Promise<any[]> {
    if (!this.isConnected) return [];
    return this.repo.find(options);
  }

  /**
   * Find entities matching where conditions.
   */
  async findBy(where: FindOptionsWhere<T>): Promise<any[]> {
    if (!this.isConnected) return [];
    return this.repo.find({ where });
  }

  /**
   * Update an entity or set of entities matching conditions.
   */
  async update(
    criteria: string | number | FindOptionsWhere<T>,
    data: any,
  ): Promise<UpdateResult> {
    if (!this.isConnected) {
      throw new Error("Database is not connected");
    }

    if (typeof criteria === "string" || typeof criteria === "number") {
      return this.repo.update(
        { id: criteria } as unknown as FindOptionsWhere<T>,
        data,
      );
    }

    return this.repo.update(criteria, data);
  }

  /**
   * Update an entity by ID and return the fresh updated entity.
   */
  async updateAndGet(
    id: string | number,
    data: any,
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    await this.update(id, data);
    return this.findById(id, options);
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
   * Soft-delete an entity by marking isDeleted = 1 if supported, or deleting.
   */
  async softDelete(
    criteria: string | number | FindOptionsWhere<T>,
  ): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error("Database is not connected");
    }

    const targetWhere =
      typeof criteria === "string" || typeof criteria === "number"
        ? ({ id: criteria } as unknown as FindOptionsWhere<T>)
        : criteria;

    const result = await this.repo.update(targetWhere, { isDeleted: 1 } as any);

    return (result.affected ?? 0) > 0;
  }

  /**
   * Check if an entity matching the criteria exists.
   */
  async exists(
    options: FindOneOptions<T> | FindOptionsWhere<T>,
  ): Promise<boolean> {
    if (!this.isConnected) return false;
    const findOptions: FindManyOptions<T> =
      options && typeof options === "object" && "where" in options
        ? (options as FindManyOptions<T>)
        : ({ where: options as FindOptionsWhere<T> } as FindManyOptions<T>);
    const count = await this.repo.count(findOptions);
    return count > 0;
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

  /**
   * Clear all records in the table (utility method).
   */
  async clear(): Promise<void> {
    if (this.isConnected) {
      await this.repo.clear();
    }
  }
}
