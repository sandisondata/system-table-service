import { BaseService, Query } from 'base-service-class';
export type PrimaryKey = {
    uuid?: string;
};
type Data = {
    name: string;
    singular_name: string;
    is_enabled?: boolean;
};
type System = {
    column_count?: number;
    unique_key?: string | null;
};
export type CreateData = PrimaryKey & Data;
export type UpdateData = Partial<Data>;
export type Row = Required<PrimaryKey> & Required<Data> & Required<System>;
export declare class Service extends BaseService<PrimaryKey, CreateData, UpdateData, Row, System> {
    preCreate(): Promise<void>;
    preUpdate(): Promise<void>;
    preDelete(): Promise<void>;
    postCreate(): Promise<void>;
    postUpdate(): Promise<void>;
    postDelete(): Promise<void>;
    /**
     * Creates a unique key constraint for a table based on the provided primary key and columns.
     * @param query The database query object
     * @param primaryKey The primary key of the table
     * @param columns An array of column UUIDs for the unique key constraint
     * @throws ConflictError if the table already has a unique key
     * @throws BadRequestError if no columns are specified or duplicate columns are provided
     * @throws NotFoundError if a column is not found or does not belong to the table
     * @throws BadRequestError if a column is nullable
     * @throws Error if adding the constraint fails
     */
    createUniqueKey(query: Query, primaryKey: PrimaryKey, columns: string[]): Promise<void>;
    /**
     * Deletes the unique key constraint for a table based on the provided primary key.
     * @param query The database query object
     * @param primaryKey The primary key of the table
     * @throws NotFoundError if the table does not have a unique key
     * @throws Error if the constraint cannot be dropped
     */
    deleteUniqueKey(query: Query, primaryKey: PrimaryKey): Promise<void>;
}
export {};
