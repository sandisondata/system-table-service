import { BaseService, Query } from 'base-service-class';
import { checkUniqueKey, findByPrimaryKey, updateRow } from 'database-helpers';
import { Debug, MessageType } from 'node-debug';
import { BadRequestError, ConflictError, NotFoundError } from 'node-errors';

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

type UniqueKeyColumn = {
  table_uuid: string;
  name: string;
  is_not_null: boolean;
};

const checkName = (name: string) => {
  const suffix = '_lookup_values';
  if (RegExp(`${suffix}$`).test(name)) {
    throw new BadRequestError(`name with suffix "${suffix}" is not allowed`);
  }
};

export class Service extends BaseService<
  PrimaryKey,
  CreateData,
  UpdateData,
  Row,
  System
> {
  async preCreate() {
    const debug = new Debug(`${this.debugSource}.preCreate`);
    debug.write(MessageType.Entry);
    debug.write(MessageType.Step, 'Checking name...');
    checkName(this.createData.name);
    const uniqueKey1 = { name: this.createData.name };
    debug.write(MessageType.Value, `uniqueKey1=${JSON.stringify(uniqueKey1)}`);
    debug.write(MessageType.Step, 'Checking unique key 1...');
    await checkUniqueKey(this.query, this.tableName, uniqueKey1);
    const uniqueKey2 = { singular_name: this.createData.singular_name };
    debug.write(MessageType.Value, `uniqueKey2=${JSON.stringify(uniqueKey2)}`);
    debug.write(MessageType.Step, 'Checking unique key 2...');
    await checkUniqueKey(this.query, this.tableName, uniqueKey2);
    debug.write(MessageType.Exit);
  }

  async preUpdate() {
    const debug = new Debug(`${this.debugSource}.preUpdate`);
    debug.write(MessageType.Entry);
    if (
      typeof this.updateData.name != 'undefined' &&
      this.updateData.name != this.row.name
    ) {
      debug.write(MessageType.Step, 'Checking name...');
      checkName(this.updateData.name);
      const uniqueKey1 = { name: this.updateData.name };
      debug.write(
        MessageType.Value,
        `uniqueKey1=${JSON.stringify(uniqueKey1)}`,
      );
      debug.write(MessageType.Step, 'Checking unique key 1...');
      await checkUniqueKey(this.query, this.tableName, uniqueKey1);
    }
    if (
      typeof this.updateData.singular_name != 'undefined' &&
      this.updateData.singular_name != this.row.singular_name
    ) {
      const uniqueKey2 = {
        singular_name: this.updateData.singular_name,
      };
      debug.write(
        MessageType.Value,
        `uniqueKey2=${JSON.stringify(uniqueKey2)}`,
      );
      debug.write(MessageType.Step, 'Checking unique key 2...');
      await checkUniqueKey(this.query, this.tableName, uniqueKey2);
    }
    debug.write(MessageType.Exit);
  }

  async preDelete() {
    const debug = new Debug(`${this.debugSource}.preDelete`);
    debug.write(MessageType.Entry);
    // TODO: Check foreign key instance(s) exist (add to database-helpers)
    debug.write(MessageType.Exit);
  }

  async postCreate() {
    const debug = new Debug(`${this.debugSource}.postCreate`);
    debug.write(MessageType.Entry);
    debug.write(MessageType.Step, 'Creating data table (and sequence)...');
    const sql =
      `CREATE TABLE ${this.createdRow.name} (` +
      'id serial, ' +
      'creation_date timestamptz NOT NULL DEFAULT now(), ' +
      'created_by uuid NOT NULL DEFAULT uuid_nil(), ' +
      'last_update_date timestamptz NOT NULL DEFAULT now(), ' +
      'last_updated_by uuid NOT NULL DEFAULT uuid_nil(), ' +
      'file_count smallint NOT NULL DEFAULT 0, ' +
      `CONSTRAINT "${this.createdRow.uuid}_pk" PRIMARY KEY (id)` +
      ')';
    debug.write(MessageType.Value, `sql=(${sql})`);
    await this.query(sql);
    debug.write(MessageType.Exit);
  }

  async postUpdate() {
    const debug = new Debug(`${this.debugSource}.postUpdate`);
    debug.write(MessageType.Entry);
    if (this.updatedRow.name != this.row.name) {
      debug.write(MessageType.Step, 'Renaming data table...');
      let sql =
        `ALTER TABLE ${this.row.name} ` + `RENAME TO ${this.updatedRow.name}`;
      debug.write(MessageType.Value, `sql=(${sql})`);
      await this.query(sql);
      debug.write(MessageType.Step, 'Renaming data table sequence...');
      sql =
        `ALTER SEQUENCE ${this.row.name}_id_seq ` +
        `RENAME TO ${this.updatedRow.name}_id_seq`;
      debug.write(MessageType.Value, `sql=(${sql})`);
      await this.query(sql);
    }
    debug.write(MessageType.Exit);
  }

  async postDelete() {
    const debug = new Debug(`${this.debugSource}.postDelete`);
    debug.write(MessageType.Entry);
    debug.write(MessageType.Step, 'Dropping data table (and sequence)...');
    const sql = `DROP TABLE ${this.row.name}`;
    debug.write(MessageType.Value, `sql=(${sql})`);
    await this.query(sql);
    debug.write(MessageType.Exit);
  }

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
  async createUniqueKey(
    query: Query,
    primaryKey: PrimaryKey,
    columns: string[],
  ) {
    const debug = new Debug(`${this.debugSource}.createUniqueKey`);
    debug.write(
      MessageType.Entry,
      `primaryKey=${JSON.stringify(primaryKey)};` +
        `columns=${JSON.stringify(columns)}`,
    );
    debug.write(MessageType.Step, 'Finding row by primary key...');
    const row = (await findByPrimaryKey(query, this.tableName, primaryKey, {
      columnNames: this.columnNames,
      forUpdate: true,
    })) as Row;
    if (row.unique_key) {
      throw new ConflictError(`Table (${row.name}) already has a unique key`);
    }
    if (!columns.length) {
      throw new BadRequestError('At least one column must be specified');
    }
    if (new Set(columns).size != columns.length) {
      throw new BadRequestError('Duplicate columns are not allowed');
    }
    const columnNames: string[] = [];
    let sql = '';
    debug.write(MessageType.Step, 'Finding columns...');
    for (let i = 0; i < columns.length; i++) {
      sql =
        'SELECT table_uuid, name, is_not_null ' +
        'FROM _columns ' +
        `WHERE uuid = "${columns[i]}" ` +
        'FOR UPDATE';
      debug.write(MessageType.Value, `sql=(${sql})`);
      const column: UniqueKeyColumn | null = (await query(sql)).rows[0] || null;
      if (!column) {
        throw new NotFoundError(`Column ${i + 1} not found`);
      }
      if (column.table_uuid != row.uuid) {
        throw new NotFoundError(
          `Column ${i + 1} (${column.name}) not found on table (${row.name})`,
        );
      }
      if (!column.is_not_null) {
        throw new BadRequestError(
          `Column ${i + 1} (${column.name}) cannot be nullable`,
        );
      }
      columnNames.push(column.name);
    }
    debug.write(MessageType.Step, 'Adding constraint...');
    try {
      sql =
        `ALTER TABLE ${row.name} ` +
        `ADD CONSTRAINT "${row.uuid}_uk" ` +
        `UNIQUE (${columnNames.join(', ')})`;
      debug.write(MessageType.Value, `sql=(${sql})`);
      await query(sql);
    } catch (error) {
      throw new Error('Could not add constraint');
    }
    debug.write(MessageType.Step, 'Setting column positions...');
    for (let i = 0; i < columns.length; i++) {
      sql =
        'UPDATE _columns ' +
        `SET position_in_unique_key = ${i + 1} ` +
        `WHERE uuid = "${columns[i]}"`;
      debug.write(MessageType.Value, `sql=(${sql})`);
      await query(sql);
    }
    debug.write(MessageType.Step, 'Updating row...');
    await updateRow(query, this.tableName, primaryKey, {
      unique_key: JSON.stringify({ columns: columns }),
    });
    debug.write(MessageType.Exit);
  }

  /**
   * Deletes the unique key constraint for a table based on the provided primary key.
   * @param query The database query object
   * @param primaryKey The primary key of the table
   * @throws NotFoundError if the table does not have a unique key
   * @throws Error if the constraint cannot be dropped
   */
  async deleteUniqueKey(query: Query, primaryKey: PrimaryKey) {
    const debug = new Debug(`${this.debugSource}.deleteUniqueKey`);
    debug.write(MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
    debug.write(MessageType.Step, 'Finding row by primary key...');
    const row = (await findByPrimaryKey(query, this.tableName, primaryKey, {
      columnNames: this.columnNames,
      forUpdate: true,
    })) as Row;
    if (!row.unique_key) {
      throw new NotFoundError(`${row.name} table does not have a unique key`);
    }
    let sql = '';
    debug.write(MessageType.Step, 'Dropping constraint...');
    try {
      sql = `ALTER table ${row.name} ` + `DROP CONSTRAINT "${row.uuid}_uk"`;
      debug.write(MessageType.Value, `sql=(${sql})`);
      await query(sql);
    } catch (error) {
      throw new Error('Could not drop constraint');
    }
    debug.write(MessageType.Step, 'Clearing column positions...');
    const columns: string[] = JSON.parse(row.unique_key).columns;
    sql =
      'UPDATE _columns ' +
      'SET position_in_unique_key = null ' +
      `WHERE column_uuid IN (${columns.map((x) => `"${x}"`).join(', ')})`;
    debug.write(MessageType.Value, `sql=(${sql})`);
    await query(sql);
    debug.write(MessageType.Step, 'Updating row...');
    await updateRow(query, this.tableName, primaryKey, { unique_key: null });
    debug.write(MessageType.Exit);
  }
}
