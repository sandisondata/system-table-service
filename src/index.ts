import { Service } from './class';

export const service = new Service(
  'system-table-service',
  '_tables',
  ['uuid'],
  ['name', 'singular_name', 'is_enabled'],
  false,
  ['column_count', 'unique_key'],
);

export { CreateData, PrimaryKey, Row, UpdateData } from './class';
