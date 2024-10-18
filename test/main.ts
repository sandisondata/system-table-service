import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Database } from 'database';
import { Debug, MessageType } from 'node-debug';
import { CreateData, PrimaryKey, service, UpdateData } from '../dist';

describe('main', (suiteContext) => {
  Debug.initialize(true);
  let database: Database;
  let uuid: string;
  before(() => {
    const debug = new Debug(`${suiteContext.name}.before`);
    debug.write(MessageType.Entry);
    database = Database.getInstance();
    debug.write(MessageType.Exit);
  });
  it('create', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    await database.transaction(async (query) => {
      const createData: CreateData = {
        name: 'gadgets',
        singular_name: 'gadget',
      };
      const row = await service.create(query, createData);
      uuid = row.uuid;
    });
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  it('find', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    await service.find(database.query);
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  it('findOne', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    const primaryKey: Required<PrimaryKey> = { uuid: uuid };
    await service.findOne(database.query, primaryKey);
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  it('update', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    await database.transaction(async (query) => {
      const primaryKey: Required<PrimaryKey> = { uuid: uuid };
      const updateData: UpdateData = {
        name: 'gizmos',
        singular_name: 'gizmo',
        is_enabled: true,
      };
      await service.update(query, primaryKey, updateData);
    });
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  it('delete', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    await database.transaction(async (query) => {
      const primaryKey: Required<PrimaryKey> = { uuid: uuid };
      await service.delete(query, primaryKey);
    });
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  after(async () => {
    const debug = new Debug(`${suiteContext.name}.after`);
    debug.write(MessageType.Entry);
    await database.disconnect();
    debug.write(MessageType.Exit);
  });
});
