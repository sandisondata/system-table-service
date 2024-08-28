"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUniqueKey = exports.createUniqueKey = exports.delete_ = exports.update = exports.findOne = exports.find = exports.create = void 0;
const database_helpers_1 = require("database-helpers");
const node_debug_1 = require("node-debug");
const node_errors_1 = require("node-errors");
const node_utilities_1 = require("node-utilities");
const debugSource = 'table.service';
const debugRows = 3;
const tableName = '_tables';
const instanceName = 'table';
const primaryKeyColumnNames = ['table_uuid'];
const dataColumnNames = ['table_name', 'singular_table_name', 'is_enabled'];
const systemColumnNames = ['column_count', 'has_unique_key'];
const columnNames = [
    ...primaryKeyColumnNames,
    ...dataColumnNames,
    ...systemColumnNames,
];
const create = (query, createData) => __awaiter(void 0, void 0, void 0, function* () {
    const debug = new node_debug_1.Debug(`${debugSource}.create`);
    debug.write(node_debug_1.MessageType.Entry, `createData=${JSON.stringify(createData)}`);
    const primaryKey = { table_uuid: createData.table_uuid };
    debug.write(node_debug_1.MessageType.Value, `primaryKey=${JSON.stringify(primaryKey)}`);
    debug.write(node_debug_1.MessageType.Step, 'Checking primary key...');
    yield (0, database_helpers_1.checkPrimaryKey)(query, tableName, instanceName, primaryKey);
    const uniqueKey1 = { table_name: createData.table_name };
    debug.write(node_debug_1.MessageType.Value, `uniqueKey1=${JSON.stringify(uniqueKey1)}`);
    debug.write(node_debug_1.MessageType.Step, 'Checking unique key 1...');
    yield (0, database_helpers_1.checkUniqueKey)(query, tableName, instanceName, uniqueKey1);
    const uniqueKey2 = { singular_table_name: createData.singular_table_name };
    debug.write(node_debug_1.MessageType.Value, `uniqueKey2=${JSON.stringify(uniqueKey2)}`);
    debug.write(node_debug_1.MessageType.Step, 'Checking unique key 2...');
    yield (0, database_helpers_1.checkUniqueKey)(query, tableName, instanceName, uniqueKey2);
    debug.write(node_debug_1.MessageType.Step, 'Creating data table (and sequence)...');
    const text = `CREATE TABLE ${createData.table_name} (` +
        'id serial, ' +
        'creation_date timestamptz NOT NULL DEFAULT now(), ' +
        'created_by uuid NOT NULL DEFAULT uuid_nil(), ' +
        'last_update_date timestamptz NOT NULL DEFAULT now(), ' +
        'last_updated_by uuid NOT NULL DEFAULT uuid_nil(), ' +
        'file_count smallint NOT NULL DEFAULT 0, ' +
        `CONSTRAINT "${createData.table_uuid}_pk" PRIMARY KEY (id)` +
        ')';
    debug.write(node_debug_1.MessageType.Value, `text=(${text})`);
    yield query(text);
    debug.write(node_debug_1.MessageType.Step, 'Creating row...');
    const createdRow = (yield (0, database_helpers_1.createRow)(query, tableName, createData, columnNames));
    debug.write(node_debug_1.MessageType.Exit, `createdRow=${JSON.stringify(createdRow)}`);
    return createdRow;
});
exports.create = create;
// TODO: query parameters + add actual query to helpers
const find = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const debug = new node_debug_1.Debug(`${debugSource}.find`);
    debug.write(node_debug_1.MessageType.Entry);
    debug.write(node_debug_1.MessageType.Step, 'Finding rows...');
    const rows = (yield query(`SELECT * FROM ${tableName} ORDER BY table_uuid`))
        .rows;
    debug.write(node_debug_1.MessageType.Exit, `rows(${debugRows})=${JSON.stringify(rows.slice(0, debugRows))}`);
    return rows;
});
exports.find = find;
const findOne = (query, primaryKey) => __awaiter(void 0, void 0, void 0, function* () {
    const debug = new node_debug_1.Debug(`${debugSource}.findOne`);
    debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
    debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
    const row = (yield (0, database_helpers_1.findByPrimaryKey)(query, tableName, instanceName, primaryKey, { columnNames: columnNames }));
    debug.write(node_debug_1.MessageType.Exit, `row=${JSON.stringify(row)}`);
    return row;
});
exports.findOne = findOne;
const update = (query, primaryKey, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const debug = new node_debug_1.Debug(`${debugSource}.update`);
    debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)};` +
        `updateData=${JSON.stringify(updateData)}`);
    debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
    const row = (yield (0, database_helpers_1.findByPrimaryKey)(query, tableName, instanceName, primaryKey, { columnNames: columnNames, forUpdate: true }));
    debug.write(node_debug_1.MessageType.Value, `row=${JSON.stringify(row)}`);
    const mergedRow = Object.assign({}, row, updateData);
    debug.write(node_debug_1.MessageType.Value, `mergedRow=${JSON.stringify(mergedRow)}`);
    let updatedRow = Object.assign({}, mergedRow);
    if (!(0, node_utilities_1.objectsEqual)((0, node_utilities_1.pick)(mergedRow, dataColumnNames), (0, node_utilities_1.pick)(row, dataColumnNames))) {
        if (mergedRow.table_name !== row.table_name) {
            const uniqueKey1 = { table_name: updateData.table_name };
            debug.write(node_debug_1.MessageType.Value, `uniqueKey1=${JSON.stringify(uniqueKey1)}`);
            debug.write(node_debug_1.MessageType.Step, 'Checking unique key 1...');
            yield (0, database_helpers_1.checkUniqueKey)(query, tableName, instanceName, uniqueKey1);
        }
        if (mergedRow.singular_table_name !== row.singular_table_name) {
            const uniqueKey2 = {
                singular_table_name: updateData.singular_table_name,
            };
            debug.write(node_debug_1.MessageType.Value, `uniqueKey2=${JSON.stringify(uniqueKey2)}`);
            debug.write(node_debug_1.MessageType.Step, 'Checking unique key 2...');
            yield (0, database_helpers_1.checkUniqueKey)(query, tableName, instanceName, uniqueKey2);
        }
        if (mergedRow.table_name !== row.table_name) {
            debug.write(node_debug_1.MessageType.Step, 'Renaming data table...');
            let text = `ALTER TABLE ${row.table_name} ` + `RENAME TO ${updateData.table_name}`;
            debug.write(node_debug_1.MessageType.Value, `text=(${text})`);
            yield query(text);
            debug.write(node_debug_1.MessageType.Step, 'Renaming data table sequence...');
            text =
                `ALTER SEQUENCE ${row.table_name}_id_seq ` +
                    `RENAME TO ${updateData.table_name}_id_seq`;
            debug.write(node_debug_1.MessageType.Value, `text=(${text})`);
            yield query(text);
        }
        debug.write(node_debug_1.MessageType.Step, 'Updating row...');
        updatedRow = (yield (0, database_helpers_1.updateRow)(query, tableName, primaryKey, updateData, columnNames));
    }
    debug.write(node_debug_1.MessageType.Exit, `updatedRow=${JSON.stringify(updatedRow)}`);
    return updatedRow;
});
exports.update = update;
const delete_ = (query, primaryKey) => __awaiter(void 0, void 0, void 0, function* () {
    const debug = new node_debug_1.Debug(`${debugSource}.delete`);
    debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
    debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
    const row = (yield (0, database_helpers_1.findByPrimaryKey)(query, tableName, instanceName, primaryKey, { forUpdate: true }));
    debug.write(node_debug_1.MessageType.Value, `row=${JSON.stringify(row)}`);
    debug.write(node_debug_1.MessageType.Step, 'Dropping data table (and sequence)...');
    const text = `DROP TABLE ${row.table_name}`;
    debug.write(node_debug_1.MessageType.Value, `text=(${text})`);
    yield query(text);
    debug.write(node_debug_1.MessageType.Step, 'Deleting row...');
    yield (0, database_helpers_1.deleteRow)(query, tableName, primaryKey);
    debug.write(node_debug_1.MessageType.Exit);
});
exports.delete_ = delete_;
const createUniqueKey = (query, primaryKey, columns) => __awaiter(void 0, void 0, void 0, function* () {
    const debug = new node_debug_1.Debug(`${debugSource}.createUniqueKey`);
    debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)};` +
        `columns=${JSON.stringify(columns)}`);
    debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
    const row = (yield (0, database_helpers_1.findByPrimaryKey)(query, tableName, instanceName, primaryKey, { forUpdate: true }));
    if (row.has_unique_key) {
        throw new node_errors_1.ConflictError(`Table (${row.table_name}) already has a unique key`);
    }
    if (!columns.length) {
        throw new node_errors_1.BadRequestError('At least one column must be specified');
    }
    if (new Set(columns).size != columns.length) {
        throw new node_errors_1.BadRequestError('Duplicate columns are not allowed');
    }
    const columnNames = [];
    for (let i = 0; i < columns.length; i++) {
        debug.write(node_debug_1.MessageType.Step, `Finding column ${i + 1}...`);
        const column = (yield query('SELECT table_uuid, column_name, is_not_null ' +
            'FROM _columns ' +
            'WHERE column_uuid = $1 ' +
            'LIMIT 1 FOR UPDATE', [columns[i]])).rows[0] || null;
        if (!column) {
            throw new node_errors_1.NotFoundError(`Column ${i + 1} not found`);
        }
        if (column.table_uuid !== row.table_uuid) {
            throw new node_errors_1.NotFoundError(`Column ${i + 1} (${column.column_name}) not found on table (${row.table_name})`);
        }
        if (!column.is_not_null) {
            throw new node_errors_1.BadRequestError(`Column ${i + 1} (${column.column_name}) cannot be nullable`);
        }
        columnNames.push(column.column_name);
    }
    debug.write(node_debug_1.MessageType.Step, 'Adding constraint...');
    try {
        yield query(`ALTER TABLE ${row.table_name} ` +
            `ADD CONSTRAINT "${row.table_uuid}_uk" ` +
            `UNIQUE (${columnNames.join(', ')})`);
    }
    catch (error) {
        throw new Error('Could not add constraint');
    }
    for (let i = 0; i < columns.length; i++) {
        debug.write(node_debug_1.MessageType.Step, `Setting column position ${i + 1}...`);
        yield query('UPDATE _columns ' +
            `SET unique_key_column_position = $1 ` +
            `WHERE column_uuid = $2`, [i + 1, columns[i]]);
    }
    debug.write(node_debug_1.MessageType.Step, 'Updating row...');
    yield (0, database_helpers_1.updateRow)(query, tableName, primaryKey, { has_unique_key: true });
});
exports.createUniqueKey = createUniqueKey;
const deleteUniqueKey = (query, primaryKey) => __awaiter(void 0, void 0, void 0, function* () {
    const debug = new node_debug_1.Debug(`${debugSource}.deleteUniqueKey`);
    debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
    debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
    const row = (yield (0, database_helpers_1.findByPrimaryKey)(query, tableName, instanceName, primaryKey, { forUpdate: true }));
    if (!row.has_unique_key) {
        throw new node_errors_1.NotFoundError(`${row.table_name} table doesn't have a unique key`);
    }
    debug.write(node_debug_1.MessageType.Step, 'Dropping constraint...');
    try {
        yield query(`ALTER table ${row.table_name} DROP CONSTRAINT "${row.table_uuid}_uk"`);
    }
    catch (error) {
        throw new Error('Could not drop constraint');
    }
    debug.write(node_debug_1.MessageType.Step, 'Clearing column positions...');
    yield query('UPDATE _columns ' +
        'SET unique_key_column_position = null ' +
        'WHERE unique_key_column_position IS NOT NULL');
    debug.write(node_debug_1.MessageType.Step, 'Updating row...');
    yield (0, database_helpers_1.updateRow)(query, tableName, primaryKey, { has_unique_key: false });
});
exports.deleteUniqueKey = deleteUniqueKey;
