import { Query } from 'database';
export type PrimaryKey = {
    uuid: string;
};
export type Data = {
    name: string;
    singular_name: string;
    is_enabled?: boolean;
};
export type System = {
    column_count: number;
    unique_key: string | null;
};
export type CreateData = Partial<PrimaryKey> & Data;
export type Row = PrimaryKey & Required<Data> & System;
export type UpdateData = Partial<Data>;
export declare const create: (query: Query, createData: CreateData) => Promise<Row>;
export declare const find: (query: Query) => Promise<Row[]>;
export declare const findOne: (query: Query, primaryKey: PrimaryKey) => Promise<Row>;
export declare const update: (query: Query, primaryKey: PrimaryKey, updateData: UpdateData) => Promise<Row>;
export declare const delete_: (query: Query, primaryKey: PrimaryKey) => Promise<void>;
export declare const createUniqueKey: (query: Query, primaryKey: PrimaryKey, columns: string[]) => Promise<void>;
export declare const deleteUniqueKey: (query: Query, primaryKey: PrimaryKey) => Promise<void>;
