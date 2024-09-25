import { Query } from 'database';
import { checkUniqueKey, findByPrimaryKey, updateRow } from 'database-helpers';
import { Debug, MessageType } from 'node-debug';
import { BadRequestError, ConflictError, NotFoundError } from 'node-errors';
import { RepositoryService, Row } from 'repository-service-class';
export { CreateData, Query, Row, UpdateData } from 'repository-service-class';

export type PrimaryKey = {
  uuid?: string;
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

type UniqueKeyColumn = {
  uuid: string;
  name: string;
  is_not_null: boolean;
};

const checkName = (name: string) => {
  const suffix = '_lookup_values';
  if (RegExp(`${suffix}$`).test(name)) {
    throw new BadRequestError(`name with suffix "${suffix}" is not allowed`);
  }
};

export class RepositoryTableService extends RepositoryService<
  PrimaryKey,
  Data,
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
      typeof this.updateData.name !== 'undefined' &&
      this.updateData.name !== this.row.name
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
      typeof this.updateData.singular_name !== 'undefined' &&
      this.updateData.singular_name !== this.row.singular_name
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
    const text =
      `CREATE TABLE ${this.row.name} (` +
      'id serial, ' +
      'creation_date timestamptz NOT NULL DEFAULT now(), ' +
      'created_by uuid NOT NULL DEFAULT uuid_nil(), ' +
      'last_update_date timestamptz NOT NULL DEFAULT now(), ' +
      'last_updated_by uuid NOT NULL DEFAULT uuid_nil(), ' +
      'file_count smallint NOT NULL DEFAULT 0, ' +
      `CONSTRAINT "${this.row.uuid}_pk" PRIMARY KEY (id)` +
      ')';
    debug.write(MessageType.Value, `text=(${text})`);
    await this.query(text);
    debug.write(MessageType.Exit);
  }

  async postUpdate() {
    const debug = new Debug(`${this.debugSource}.postUpdate`);
    debug.write(MessageType.Entry);
    if (this.row.name !== this.oldRow.name) {
      debug.write(MessageType.Step, 'Renaming data table...');
      let text =
        `ALTER TABLE ${this.oldRow.name} ` + `RENAME TO ${this.row.name}`;
      debug.write(MessageType.Value, `text=(${text})`);
      await this.query(text);
      debug.write(MessageType.Step, 'Renaming data table sequence...');
      text =
        `ALTER SEQUENCE ${this.oldRow.name}_id_seq ` +
        `RENAME TO ${this.row.name}_id_seq`;
      debug.write(MessageType.Value, `text=(${text})`);
      await this.query(text);
    }
    debug.write(MessageType.Exit);
  }

  async postDelete() {
    const debug = new Debug(`${this.debugSource}.postDelete`);
    debug.write(MessageType.Entry);
    debug.write(MessageType.Step, 'Dropping data table (and sequence)...');
    const text = `DROP TABLE ${this.row.name}`;
    debug.write(MessageType.Value, `text=(${text})`);
    await this.query(text);
    debug.write(MessageType.Exit);
  }

  async createUniqueKey(
    query: Query,
    primaryKey: Required<PrimaryKey>,
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
    })) as Row<PrimaryKey, Data, System>;
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
    let text = '';
    debug.write(MessageType.Step, 'Finding columns...');
    for (let i = 0; i < columns.length; i++) {
      text =
        'SELECT uuid, name, is_not_null ' +
        'FROM _columns ' +
        `WHERE uuid = "${columns[i]}" ` +
        'FOR UPDATE';
      debug.write(MessageType.Value, `text=(${text})`);
      const column: UniqueKeyColumn | null =
        (await query(text)).rows[0] || null;
      if (!column) {
        throw new NotFoundError(`Column ${i + 1} not found`);
      }
      if (column.uuid !== row.uuid) {
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
      text =
        `ALTER TABLE ${row.name} ` +
        `ADD CONSTRAINT "${row.uuid}_uk" ` +
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
        `WHERE uuid = "${columns[i]}"`;
      debug.write(MessageType.Value, `text=(${text})`);
      await query(text);
    }
    debug.write(MessageType.Step, 'Updating row...');
    await updateRow(query, this.tableName, primaryKey, {
      unique_key: JSON.stringify({ columns: columns }),
    });
    debug.write(MessageType.Exit);
  }

  async deleteUniqueKey(query: Query, primaryKey: Required<PrimaryKey>) {
    const debug = new Debug(`${this.debugSource}.deleteUniqueKey`);
    debug.write(MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
    debug.write(MessageType.Step, 'Finding row by primary key...');
    const row = (await findByPrimaryKey(query, this.tableName, primaryKey, {
      columnNames: this.columnNames,
      forUpdate: true,
    })) as Row<PrimaryKey, Data, System>;
    if (!row.unique_key) {
      throw new NotFoundError(`${row.name} table does not have a unique key`);
    }
    let text = '';
    debug.write(MessageType.Step, 'Dropping constraint...');
    try {
      text = `ALTER table ${row.name} ` + `DROP CONSTRAINT "${row.uuid}_uk"`;
      debug.write(MessageType.Value, `text=(${text})`);
      await query(text);
    } catch (error) {
      throw new Error('Could not drop constraint');
    }
    debug.write(MessageType.Step, 'Clearing column positions...');
    const columns: string[] = JSON.parse(row.unique_key).columns;
    text =
      'UPDATE _columns ' +
      'SET position_in_unique_key = null ' +
      `WHERE column_uuid IN (${columns.map((x) => `"${x}"`).join(', ')})`;
    debug.write(MessageType.Value, `text=(${text})`);
    await query(text);
    debug.write(MessageType.Step, 'Updating row...');
    await updateRow(query, this.tableName, primaryKey, { unique_key: null });
    debug.write(MessageType.Exit);
  }
}
