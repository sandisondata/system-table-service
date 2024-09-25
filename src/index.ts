import { RepositoryTableService } from './class';
export {
  CreateData,
  Data,
  PrimaryKey,
  Query,
  Row,
  System,
  UpdateData,
} from './class';

const repositoryTableService = new RepositoryTableService(
  'repository-table-service',
  '_tables',
  ['uuid'],
  ['name', 'singular_name', 'is_enabled'],
  ['column_count', 'unique_key'],
);

export { repositoryTableService };
