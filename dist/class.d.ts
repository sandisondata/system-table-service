import { BaseService, Query } from 'base-service-class';
export { Query };
export type PrimaryKey = {
    uuid?: string;
};
type Data = {
    name: string;
    singular_name: string;
    is_enabled?: boolean;
};
export type System = {
    column_count?: number;
    unique_key?: string | null;
};
export type CreateData = PrimaryKey & Data;
export type Row = Required<PrimaryKey> & Required<Data> & Required<System>;
export type UpdateData = Partial<Data>;
export declare class Service extends BaseService<PrimaryKey, CreateData, Row, UpdateData, System> {
    preCreate(): Promise<void>;
    preUpdate(): Promise<void>;
    preDelete(): Promise<void>;
    postCreate(): Promise<void>;
    postUpdate(): Promise<void>;
    postDelete(): Promise<void>;
    createUniqueKey(query: Query, primaryKey: PrimaryKey, columns: string[]): Promise<void>;
    deleteUniqueKey(query: Query, primaryKey: PrimaryKey): Promise<void>;
}
