import { Query } from 'database';
export type PrimaryKey = {
    table_uuid: string;
};
export type Data = {
    table_name: string;
    singular_table_name: string;
    is_enabled?: boolean;
    column_count: number;
};
export type CreateData = PrimaryKey & Omit<Data, 'column_count'>;
export type Row = PrimaryKey & Required<Data>;
export type UpdateData = Partial<Omit<Data, 'column_count'>>;
export declare const create: (query: Query, createData: CreateData) => Promise<Row>;
export declare const find: (query: Query) => Promise<Row[]>;
export declare const findOne: (query: Query, primaryKey: PrimaryKey) => Promise<Row>;
export declare const update: (query: Query, primaryKey: PrimaryKey, updateData: UpdateData) => Promise<Row>;
export declare const delete_: (query: Query, primaryKey: PrimaryKey) => Promise<void>;
