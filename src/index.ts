import {
  CreateData,
  PrimaryKey,
  Query,
  Row,
  Service,
  System,
  UpdateData,
} from './class';

export { CreateData, PrimaryKey, Query, Row, System, UpdateData };

const service = new Service(
  'system-table-service',
  '_tables',
  ['uuid'],
  ['name', 'singular_name', 'is_enabled'],
  false,
  ['column_count', 'unique_key'],
);

export { service };
