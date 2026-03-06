let currEnd = -1;
let filteredReplacements = [];
const replacements = [
    { "start": 73, "end": 75, "val": "{date.tiec.thang_al}" },
    { "start": 64, "end": 66, "val": "{date.tiec.ngay_al}" },
    { "start": 48, "end": 52, "val": "{date.tiec.nam}" },
    { "start": 43, "end": 45, "val": "{date.tiec.thang}" },
    { "start": 38, "end": 40, "val": "{date.tiec.ngay}" },
    { "start": 17, "end": 19, "val": "{date.tiec.phut}" },
    { "start": 10, "end": 12, "val": "{date.tiec.gio}" }
];
replacements.sort((a, b) => b.start - a.start);

for (const rep of replacements) {
    if (currEnd === -1 || rep.end <= currEnd) {
        filteredReplacements.push(rep);
        currEnd = rep.start;
    }
}
console.log(filteredReplacements);
