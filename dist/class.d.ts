import { BaseService, Query } from 'base-service-class';
export type PrimaryKey = {
    uuid?: string;
};
export type Data = {
    name: string;
    singular_name: string;
    is_enabled?: boolean;
};
export type System = {
    column_count?: number;
    unique_key?: string | null;
};
export declare class Service extends BaseService<PrimaryKey, Data, false, System> {
    preCreate(): Promise<void>;
    preUpdate(): Promise<void>;
    preDelete(): Promise<void>;
    postCreate(): Promise<void>;
    postUpdate(): Promise<void>;
    postDelete(): Promise<void>;
    createUniqueKey(query: Query, primaryKey: Required<PrimaryKey>, columns: string[]): Promise<void>;
    deleteUniqueKey(query: Query, primaryKey: Required<PrimaryKey>): Promise<void>;
}
export { CreateData, Query, Row, UpdateData } from 'base-service-class';
