"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.service = void 0;
const class_1 = require("./class");
exports.service = new class_1.Service('system-table-service', '_tables', ['uuid'], ['name', 'singular_name', 'is_enabled'], false, ['column_count', 'unique_key']);
