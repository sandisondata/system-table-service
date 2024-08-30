import { Query } from 'database';
import {
  checkPrimaryKey,
  checkUniqueKey,
  createRow,
  deleteRow,
  findByPrimaryKey,
  updateRow,
} from 'database-helpers';
import { Debug, MessageType } from 'node-debug';
import { BadRequestError, ConflictError, NotFoundError } from 'node-errors';
import { objectsEqual, pick } from 'node-utilities';

const debugSource = 'table.service';
const debugRows = 3;

const tableName = '_tables';
const instanceName = 'table';

const primaryKeyColumnNames = ['table_uuid'];
const dataColumnNames = ['table_name', 'singular_table_name', 'is_enabled'];
const systemColumnNames = ['column_count', 'unique_key'];
const columnNames = [
  ...primaryKeyColumnNames,
  ...dataColumnNames,
  ...systemColumnNames,
];

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
  unique_key: string;
};

export type CreateData = PrimaryKey & Data;
export type Row = PrimaryKey & Data & System;
export type UpdateData = Partial<Data>;

export const create = async (query: Query, createData: CreateData) => {
  const debug = new Debug(`${debugSource}.create`);
  debug.write(MessageType.Entry, `createData=${JSON.stringify(createData)}`);
  const primaryKey: PrimaryKey = { table_uuid: createData.table_uuid };
  debug.write(MessageType.Value, `primaryKey=${JSON.stringify(primaryKey)}`);
  debug.write(MessageType.Step, 'Checking primary key...');
  await checkPrimaryKey(query, tableName, instanceName, primaryKey);
  const uniqueKey1 = { table_name: createData.table_name };
  debug.write(MessageType.Value, `uniqueKey1=${JSON.stringify(uniqueKey1)}`);
  debug.write(MessageType.Step, 'Checking unique key 1...');
  await checkUniqueKey(query, tableName, instanceName, uniqueKey1);
  const uniqueKey2 = { singular_table_name: createData.singular_table_name };
  debug.write(MessageType.Value, `uniqueKey2=${JSON.stringify(uniqueKey2)}`);
  debug.write(MessageType.Step, 'Checking unique key 2...');
  await checkUniqueKey(query, tableName, instanceName, uniqueKey2);
  debug.write(MessageType.Step, 'Creating data table (and sequence)...');
  const text =
    `CREATE TABLE ${createData.table_name} (` +
    'id serial, ' +
    'creation_date timestamptz NOT NULL DEFAULT now(), ' +
    'created_by uuid NOT NULL DEFAULT uuid_nil(), ' +
    'last_update_date timestamptz NOT NULL DEFAULT now(), ' +
    'last_updated_by uuid NOT NULL DEFAULT uuid_nil(), ' +
    'file_count smallint NOT NULL DEFAULT 0, ' +
    `CONSTRAINT "${createData.table_uuid}_pk" PRIMARY KEY (id)` +
    ')';
  debug.write(MessageType.Value, `text=(${text})`);
  await query(text);
  debug.write(MessageType.Step, 'Creating row...');
  const createdRow = (await createRow(
    query,
    tableName,
    createData,
    columnNames,
  )) as Row;
  debug.write(MessageType.Exit, `createdRow=${JSON.stringify(createdRow)}`);
  return createdRow;
};

// TODO: query parameters + add actual query to helpers
export const find = async (query: Query) => {
  const debug = new Debug(`${debugSource}.find`);
  debug.write(MessageType.Entry);
  debug.write(MessageType.Step, 'Finding rows...');
  const rows = (await query(`SELECT * FROM ${tableName} ORDER BY table_uuid`))
    .rows as Row[];
  debug.write(
    MessageType.Exit,
    `rows(${debugRows})=${JSON.stringify(rows.slice(0, debugRows))}`,
  );
  return rows;
};

export const findOne = async (query: Query, primaryKey: PrimaryKey) => {
  const debug = new Debug(`${debugSource}.findOne`);
  debug.write(MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
  debug.write(MessageType.Step, 'Finding row by primary key...');
  const row = (await findByPrimaryKey(
    query,
    tableName,
    instanceName,
    primaryKey,
    { columnNames: columnNames },
  )) as Row;
  debug.write(MessageType.Exit, `row=${JSON.stringify(row)}`);
  return row;
};

export const update = async (
  query: Query,
  primaryKey: PrimaryKey,
  updateData: UpdateData,
) => {
  const debug = new Debug(`${debugSource}.update`);
  debug.write(
    MessageType.Entry,
    `primaryKey=${JSON.stringify(primaryKey)};` +
      `updateData=${JSON.stringify(updateData)}`,
  );
  debug.write(MessageType.Step, 'Finding row by primary key...');
  const row = (await findByPrimaryKey(
    query,
    tableName,
    instanceName,
    primaryKey,
    { columnNames: columnNames, forUpdate: true },
  )) as Row;
  debug.write(MessageType.Value, `row=${JSON.stringify(row)}`);
  const mergedRow: Row = Object.assign({}, row, updateData);
  debug.write(MessageType.Value, `mergedRow=${JSON.stringify(mergedRow)}`);
  let updatedRow: Row = Object.assign({}, mergedRow);
  if (
    !objectsEqual(pick(mergedRow, dataColumnNames), pick(row, dataColumnNames))
  ) {
    if (mergedRow.table_name !== row.table_name) {
      const uniqueKey1 = { table_name: updateData.table_name };
      debug.write(
        MessageType.Value,
        `uniqueKey1=${JSON.stringify(uniqueKey1)}`,
      );
      debug.write(MessageType.Step, 'Checking unique key 1...');
      await checkUniqueKey(query, tableName, instanceName, uniqueKey1);
    }
    if (mergedRow.singular_table_name !== row.singular_table_name) {
      const uniqueKey2 = {
        singular_table_name: updateData.singular_table_name,
      };
      debug.write(
        MessageType.Value,
        `uniqueKey2=${JSON.stringify(uniqueKey2)}`,
      );
      debug.write(MessageType.Step, 'Checking unique key 2...');
      await checkUniqueKey(query, tableName, instanceName, uniqueKey2);
    }
    if (mergedRow.table_name !== row.table_name) {
      debug.write(MessageType.Step, 'Renaming data table...');
      let text =
        `ALTER TABLE ${row.table_name} ` + `RENAME TO ${updateData.table_name}`;
      debug.write(MessageType.Value, `text=(${text})`);
      await query(text);
      debug.write(MessageType.Step, 'Renaming data table sequence...');
      text =
        `ALTER SEQUENCE ${row.table_name}_id_seq ` +
        `RENAME TO ${updateData.table_name}_id_seq`;
      debug.write(MessageType.Value, `text=(${text})`);
      await query(text);
    }
    debug.write(MessageType.Step, 'Updating row...');
    updatedRow = (await updateRow(
      query,
      tableName,
      primaryKey,
      updateData,
      columnNames,
    )) as Row;
  }
  debug.write(MessageType.Exit, `updatedRow=${JSON.stringify(updatedRow)}`);
  return updatedRow;
};

export const delete_ = async (query: Query, primaryKey: PrimaryKey) => {
  const debug = new Debug(`${debugSource}.delete`);
  debug.write(MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
  debug.write(MessageType.Step, 'Finding row by primary key...');
  const row = (await findByPrimaryKey(
    query,
    tableName,
    instanceName,
    primaryKey,
    { forUpdate: true },
  )) as Row;
  debug.write(MessageType.Value, `row=${JSON.stringify(row)}`);
  debug.write(MessageType.Step, 'Dropping data table (and sequence)...');
  const text = `DROP TABLE ${row.table_name}`;
  debug.write(MessageType.Value, `text=(${text})`);
  await query(text);
  debug.write(MessageType.Step, 'Deleting row...');
  await deleteRow(query, tableName, primaryKey);
  debug.write(MessageType.Exit);
};

type UniqueKeyColumn = {
  table_uuid: string;
  column_name: string;
  is_not_null: boolean;
};

export const createUniqueKey = async (
  query: Query,
  primaryKey: PrimaryKey,
  columns: string[],
) => {
  const debug = new Debug(`${debugSource}.createUniqueKey`);
  debug.write(
    MessageType.Entry,
    `primaryKey=${JSON.stringify(primaryKey)};` +
      `columns=${JSON.stringify(columns)}`,
  );
  debug.write(MessageType.Step, 'Finding row by primary key...');
  const row = (await findByPrimaryKey(
    query,
    tableName,
    instanceName,
    primaryKey,
    { forUpdate: true },
  )) as Row;
  if (row.unique_key) {
    throw new ConflictError(
      `Table (${row.table_name}) already has a unique key`,
    );
  }
  if (!columns.length) {
    throw new BadRequestError('At least one column must be specified');
  }
  if (new Set(columns).size != columns.length) {
    throw new BadRequestError('Duplicate columns are not allowed');
  }
  const columnNames: string[] = [];
  let text = '';
  debug.write(MessageType.Step, 'Finding columns (for update)...');
  for (let i = 0; i < columns.length; i++) {
    text =
      'SELECT table_uuid, column_name, is_not_null ' +
      'FROM _columns ' +
      `WHERE column_uuid = "${columns[i]}" ` +
      'FOR UPDATE';
    debug.write(MessageType.Value, `text=(${text})`);
    const column: UniqueKeyColumn | null = (await query(text)).rows[0] || null;
    if (!column) {
      throw new NotFoundError(`Column ${i + 1} not found`);
    }
    if (column.table_uuid !== row.table_uuid) {
      throw new NotFoundError(
        `Column ${i + 1} (${column.column_name}) not found on table (${row.table_name})`,
      );
    }
    if (!column.is_not_null) {
      throw new BadRequestError(
        `Column ${i + 1} (${column.column_name}) cannot be nullable`,
      );
    }
    columnNames.push(column.column_name);
  }
  debug.write(MessageType.Step, 'Adding constraint...');
  try {
    text =
      `ALTER TABLE ${row.table_name} ` +
      `ADD CONSTRAINT "${row.table_uuid}_uk" ` +
      `UNIQUE (${columnNames.join(', ')})`;
    debug.write(MessageType.Value, `text=(${text})`);
    await query(text);
  } catch (error) {
    throw new Error('Could not add constraint');
  }
  debug.write(MessageType.Step, 'Setting column positions...');
  for (let i = 0; i < columns.length; i++) {
    text =
      'UPDATE _columns ' +
      `SET position_in_unique_key = ${i + 1} ` +
      `WHERE column_uuid = "${columns[i]}"`;
    debug.write(MessageType.Value, `text=(${text})`);
    await query(text);
  }
  debug.write(MessageType.Step, 'Updating row...');
  await updateRow(query, tableName, primaryKey, {
    unique_key: JSON.stringify({ columns: columns }),
  });
};

export const deleteUniqueKey = async (query: Query, primaryKey: PrimaryKey) => {
  const debug = new Debug(`${debugSource}.deleteUniqueKey`);
  debug.write(MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
  debug.write(MessageType.Step, 'Finding row by primary key...');
  const row = (await findByPrimaryKey(
    query,
    tableName,
    instanceName,
    primaryKey,
    { forUpdate: true },
  )) as Row;
  if (!row.unique_key) {
    throw new NotFoundError(
      `${row.table_name} table does not have a unique key`,
    );
  }
  const columns: string[] = JSON.parse(row.unique_key).columns;
  debug.write(MessageType.Step, 'Finding columns (for update)...');
  let text =
    'SELECT 1 ' +
    'FROM _columns ' +
    `WHERE column_uuid IN (${columns.map((x) => `"${x}"`).join(', ')})` +
    'FOR UPDATE';
  debug.write(MessageType.Value, `text=(${text})`);
  await query(text);
  debug.write(MessageType.Step, 'Dropping constraint...');
  try {
    text =
      `ALTER table ${row.table_name} ` +
      `DROP CONSTRAINT "${row.table_uuid}_uk"`;
    debug.write(MessageType.Value, `text=(${text})`);
    await query(text);
  } catch (error) {
    throw new Error('Could not drop constraint');
  }
  debug.write(MessageType.Step, 'Clearing column positions...');
  text =
    'UPDATE _columns ' +
    'SET position_in_unique_key = null ' +
    `WHERE column_uuid IN (${columns.map((x) => `"${x}"`).join(', ')})`;
  debug.write(MessageType.Value, `text=(${text})`);
  await query(text);
  debug.write(MessageType.Step, 'Updating row...');
  await updateRow(query, tableName, primaryKey, { unique_key: null });
};
