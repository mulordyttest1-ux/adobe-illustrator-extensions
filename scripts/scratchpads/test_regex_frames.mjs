import { SchemaInjector } from './wedding-cep/cep/js/logic/SchemaInjector.js';

const frames = [
    { id: 1, text: "VÀO LÚC : 11 GIỜ 00 - Thứ Tư" },
    { id: 2, text: "10 . 01 . 2026" },
    { id: 3, text: "(Nhằm ngày 22 tháng 11 năm Mậu Thân)" }
];

const result = SchemaInjector.computeChanges(frames);

console.log("=== OUTPUT OF SchemaInjector.computeChanges ===");
console.log(JSON.stringify(result.changes, null, 2));
