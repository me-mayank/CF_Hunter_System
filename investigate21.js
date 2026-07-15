const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ayush.json', 'utf8'));
const subs = data.result;

let okCount = 0;
let contestIdSet = new Set();
let nameSet = new Set();

subs.forEach(s => {
  if (s.verdict === 'OK') {
    okCount++;
    contestIdSet.add(`${s.problem.contestId}_${s.problem.index}`);
    nameSet.add(s.problem.name);
  }
});
console.log({okCount, contestIdSetSize: contestIdSet.size, nameSetSize: nameSet.size});
