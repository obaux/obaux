import assert from 'node:assert/strict';
import { scoreDimension as s, gaugeProps as g } from './likert.js';
assert.deepEqual(s([1,1,1]), { score: 0, bucket: 'weak', answered: 3, total: 3 });
assert.deepEqual(s([5,5,5]), { score: 100, bucket: 'strong', answered: 3, total: 3 });
assert.equal(s([3,3,3]).score, 50); assert.equal(s([3,3,3]).bucket, 'steady');
assert.equal(s([4,5,2], { reverse: [2] }).score, 83);          // 2 -> 4; mean 4.33
assert.equal(s([5,5,1], { reverse: [2] }).score, 100);         // reverse-coded low = good
assert.equal(s([2,2,null]).answered, 2);                       // skips ignored
assert.equal(s([2,2,null]).score, 25);
assert.equal(s([null, undefined, NaN]).score, null);
assert.equal(s([9, 0, 'x']).score, null);                      // out of range ignored
assert.equal(s([3,4], { min: 1, max: 7 }).score, 42);          // 7-pt: mean 3.5 -> 41.7
assert.equal(s([2,2]).bucket, 'weak'); assert.equal(s([2,3]).score, 38);
assert.equal(s([4,4]).score, 75); assert.equal(s([4,4]).bucket, 'strong');
assert.equal(s([4,3]).score, 63); assert.equal(s([4,3]).bucket, 'steady');
assert.equal(s([3,3,3,4,3]).bucket, 'steady');
assert.deepEqual(g(s([5,5])), { value: 100, energy: 1.35 });
assert.deepEqual(g(s([])), { value: 0, energy: 0.6 });
console.log('likert ok');
