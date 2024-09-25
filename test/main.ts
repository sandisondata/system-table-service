import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Database } from 'database';
import { Debug, MessageType } from 'node-debug';
import { repositoryTableService } from '../dist';

describe('main', (suiteContext) => {
  Debug.initialise(true);
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
      const row = await repositoryTableService.create(query, {
        name: 'gadgets',
        singular_name: 'gadget',
      });
      uuid = row.uuid;
    });
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  it('find', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    await repositoryTableService.find(database.query);
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  it('findOne', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    await repositoryTableService.findOne(database.query, { uuid: uuid });
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  it('update', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    await database.transaction(async (query) => {
      await repositoryTableService.update(
        query,
        { uuid: uuid },
        {
          name: 'gizmos',
          singular_name: 'gizmo',
          is_enabled: true,
        },
      );
    });
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  it('delete', async (testContext) => {
    const debug = new Debug(`${suiteContext.name}.test.${testContext.name}`);
    debug.write(MessageType.Entry);
    await database.transaction(async (query) => {
      await repositoryTableService.delete(query, { uuid: uuid });
    });
    debug.write(MessageType.Exit);
    assert.ok(true);
  });
  after(async () => {
    const debug = new Debug(`${suiteContext.name}.after`);
    debug.write(MessageType.Entry);
    await database.shutdown();
    debug.write(MessageType.Exit);
  });
});
