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
exports.Service = void 0;
const base_service_class_1 = require("base-service-class");
const database_helpers_1 = require("database-helpers");
const node_debug_1 = require("node-debug");
const node_errors_1 = require("node-errors");
const checkName = (name) => {
    const suffix = '_lookup_values';
    if (RegExp(`${suffix}$`).test(name)) {
        throw new node_errors_1.BadRequestError(`name with suffix "${suffix}" is not allowed`);
    }
};
class Service extends base_service_class_1.BaseService {
    preCreate() {
        return __awaiter(this, void 0, void 0, function* () {
            const debug = new node_debug_1.Debug(`${this.debugSource}.preCreate`);
            debug.write(node_debug_1.MessageType.Entry);
            debug.write(node_debug_1.MessageType.Step, 'Checking name...');
            checkName(this.createData.name);
            const uniqueKey1 = { name: this.createData.name };
            debug.write(node_debug_1.MessageType.Value, `uniqueKey1=${JSON.stringify(uniqueKey1)}`);
            debug.write(node_debug_1.MessageType.Step, 'Checking unique key 1...');
            yield (0, database_helpers_1.checkUniqueKey)(this.query, this.tableName, uniqueKey1);
            const uniqueKey2 = { singular_name: this.createData.singular_name };
            debug.write(node_debug_1.MessageType.Value, `uniqueKey2=${JSON.stringify(uniqueKey2)}`);
            debug.write(node_debug_1.MessageType.Step, 'Checking unique key 2...');
            yield (0, database_helpers_1.checkUniqueKey)(this.query, this.tableName, uniqueKey2);
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    preUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            const debug = new node_debug_1.Debug(`${this.debugSource}.preUpdate`);
            debug.write(node_debug_1.MessageType.Entry);
            if (typeof this.updateData.name !== 'undefined' &&
                this.updateData.name !== this.row.name) {
                debug.write(node_debug_1.MessageType.Step, 'Checking name...');
                checkName(this.updateData.name);
                const uniqueKey1 = { name: this.updateData.name };
                debug.write(node_debug_1.MessageType.Value, `uniqueKey1=${JSON.stringify(uniqueKey1)}`);
                debug.write(node_debug_1.MessageType.Step, 'Checking unique key 1...');
                yield (0, database_helpers_1.checkUniqueKey)(this.query, this.tableName, uniqueKey1);
            }
            if (typeof this.updateData.singular_name !== 'undefined' &&
                this.updateData.singular_name !== this.row.singular_name) {
                const uniqueKey2 = {
                    singular_name: this.updateData.singular_name,
                };
                debug.write(node_debug_1.MessageType.Value, `uniqueKey2=${JSON.stringify(uniqueKey2)}`);
                debug.write(node_debug_1.MessageType.Step, 'Checking unique key 2...');
                yield (0, database_helpers_1.checkUniqueKey)(this.query, this.tableName, uniqueKey2);
            }
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    preDelete() {
        return __awaiter(this, void 0, void 0, function* () {
            const debug = new node_debug_1.Debug(`${this.debugSource}.preDelete`);
            debug.write(node_debug_1.MessageType.Entry);
            // TODO: Check foreign key instance(s) exist (add to database-helpers)
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    postCreate() {
        return __awaiter(this, void 0, void 0, function* () {
            const debug = new node_debug_1.Debug(`${this.debugSource}.postCreate`);
            debug.write(node_debug_1.MessageType.Entry);
            debug.write(node_debug_1.MessageType.Step, 'Creating data table (and sequence)...');
            const sql = `CREATE TABLE ${this.row.name} (` +
                'id serial, ' +
                'creation_date timestamptz NOT NULL DEFAULT now(), ' +
                'created_by uuid NOT NULL DEFAULT uuid_nil(), ' +
                'last_update_date timestamptz NOT NULL DEFAULT now(), ' +
                'last_updated_by uuid NOT NULL DEFAULT uuid_nil(), ' +
                'file_count smallint NOT NULL DEFAULT 0, ' +
                `CONSTRAINT "${this.row.uuid}_pk" PRIMARY KEY (id)` +
                ')';
            debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
            yield this.query(sql);
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    postUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            const debug = new node_debug_1.Debug(`${this.debugSource}.postUpdate`);
            debug.write(node_debug_1.MessageType.Entry);
            if (this.row.name !== this.oldRow.name) {
                debug.write(node_debug_1.MessageType.Step, 'Renaming data table...');
                let sql = `ALTER TABLE ${this.oldRow.name} ` + `RENAME TO ${this.row.name}`;
                debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
                yield this.query(sql);
                debug.write(node_debug_1.MessageType.Step, 'Renaming data table sequence...');
                sql =
                    `ALTER SEQUENCE ${this.oldRow.name}_id_seq ` +
                        `RENAME TO ${this.row.name}_id_seq`;
                debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
                yield this.query(sql);
            }
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    postDelete() {
        return __awaiter(this, void 0, void 0, function* () {
            const debug = new node_debug_1.Debug(`${this.debugSource}.postDelete`);
            debug.write(node_debug_1.MessageType.Entry);
            debug.write(node_debug_1.MessageType.Step, 'Dropping data table (and sequence)...');
            const sql = `DROP TABLE ${this.row.name}`;
            debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
            yield this.query(sql);
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    createUniqueKey(query, primaryKey, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            const debug = new node_debug_1.Debug(`${this.debugSource}.createUniqueKey`);
            debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)};` +
                `columns=${JSON.stringify(columns)}`);
            debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
            const row = (yield (0, database_helpers_1.findByPrimaryKey)(query, this.tableName, primaryKey, {
                columnNames: this.columnNames,
                forUpdate: true,
            }));
            if (row.unique_key) {
                throw new node_errors_1.ConflictError(`Table (${row.name}) already has a unique key`);
            }
            if (!columns.length) {
                throw new node_errors_1.BadRequestError('At least one column must be specified');
            }
            if (new Set(columns).size != columns.length) {
                throw new node_errors_1.BadRequestError('Duplicate columns are not allowed');
            }
            const columnNames = [];
            let sql = '';
            debug.write(node_debug_1.MessageType.Step, 'Finding columns...');
            for (let i = 0; i < columns.length; i++) {
                sql =
                    'SELECT table_uuid, name, is_not_null ' +
                        'FROM _columns ' +
                        `WHERE uuid = "${columns[i]}" ` +
                        'FOR UPDATE';
                debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
                const column = (yield query(sql)).rows[0] || null;
                if (!column) {
                    throw new node_errors_1.NotFoundError(`Column ${i + 1} not found`);
                }
                if (column.table_uuid !== row.uuid) {
                    throw new node_errors_1.NotFoundError(`Column ${i + 1} (${column.name}) not found on table (${row.name})`);
                }
                if (!column.is_not_null) {
                    throw new node_errors_1.BadRequestError(`Column ${i + 1} (${column.name}) cannot be nullable`);
                }
                columnNames.push(column.name);
            }
            debug.write(node_debug_1.MessageType.Step, 'Adding constraint...');
            try {
                sql =
                    `ALTER TABLE ${row.name} ` +
                        `ADD CONSTRAINT "${row.uuid}_uk" ` +
                        `UNIQUE (${columnNames.join(', ')})`;
                debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
                yield query(sql);
            }
            catch (error) {
                throw new Error('Could not add constraint');
            }
            debug.write(node_debug_1.MessageType.Step, 'Setting column positions...');
            for (let i = 0; i < columns.length; i++) {
                sql =
                    'UPDATE _columns ' +
                        `SET position_in_unique_key = ${i + 1} ` +
                        `WHERE uuid = "${columns[i]}"`;
                debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
                yield query(sql);
            }
            debug.write(node_debug_1.MessageType.Step, 'Updating row...');
            yield (0, database_helpers_1.updateRow)(query, this.tableName, primaryKey, {
                unique_key: JSON.stringify({ columns: columns }),
            });
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    deleteUniqueKey(query, primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const debug = new node_debug_1.Debug(`${this.debugSource}.deleteUniqueKey`);
            debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
            debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
            const row = (yield (0, database_helpers_1.findByPrimaryKey)(query, this.tableName, primaryKey, {
                columnNames: this.columnNames,
                forUpdate: true,
            }));
            if (!row.unique_key) {
                throw new node_errors_1.NotFoundError(`${row.name} table does not have a unique key`);
            }
            let sql = '';
            debug.write(node_debug_1.MessageType.Step, 'Dropping constraint...');
            try {
                sql = `ALTER table ${row.name} ` + `DROP CONSTRAINT "${row.uuid}_uk"`;
                debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
                yield query(sql);
            }
            catch (error) {
                throw new Error('Could not drop constraint');
            }
            debug.write(node_debug_1.MessageType.Step, 'Clearing column positions...');
            const columns = JSON.parse(row.unique_key).columns;
            sql =
                'UPDATE _columns ' +
                    'SET position_in_unique_key = null ' +
                    `WHERE column_uuid IN (${columns.map((x) => `"${x}"`).join(', ')})`;
            debug.write(node_debug_1.MessageType.Value, `sql=(${sql})`);
            yield query(sql);
            debug.write(node_debug_1.MessageType.Step, 'Updating row...');
            yield (0, database_helpers_1.updateRow)(query, this.tableName, primaryKey, { unique_key: null });
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
}
exports.Service = Service;
