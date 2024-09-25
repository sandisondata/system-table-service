"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repositoryTableService = void 0;
const class_1 = require("./class");
const repositoryTableService = new class_1.RepositoryTableService('repository-table-service', '_tables', ['uuid'], ['name', 'singular_name', 'is_enabled'], ['column_count', 'unique_key']);
exports.repositoryTableService = repositoryTableService;
