import { Query } from 'database';
export type PrimaryKey = {
    table_uuid: string;
};
export type Data = {
    table_name: string;
    singular_table_name: string;
    is_enabled?: boolean;
};
export type System = {
    column_count: number;
    has_unique_key: boolean;
};
export type CreateData = PrimaryKey & Data;
export type Row = PrimaryKey & Data & System;
export type UpdateData = Partial<Data>;
export declare const create: (query: Query, createData: CreateData) => Promise<Row>;
export declare const find: (query: Query) => Promise<Row[]>;
export declare const findOne: (query: Query, primaryKey: PrimaryKey) => Promise<Row>;
export declare const update: (query: Query, primaryKey: PrimaryKey, updateData: UpdateData) => Promise<Row>;
export declare const delete_: (query: Query, primaryKey: PrimaryKey) => Promise<void>;
export declare const createUniqueKey: (query: Query, primaryKey: PrimaryKey, columns: string[]) => Promise<void>;
export declare const deleteUniqueKey: (query: Query, primaryKey: PrimaryKey) => Promise<void>;
