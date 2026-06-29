function LIS(arr: any[]) {
  const results = [[arr[0]]];
  for (let n of arr) {
    for (let j = results.length - 1; j >= 0; j--) {
      const line = results[j];
      const tail = line[line.length - 1];
      if (n > tail) {
        results.push([...line, n]);
        break;
      }
    }
    results[0] = [n];
  }
  return results[results.length - 1];
}

export function getSequence(arr: any[]) {
  const result = [];
  for (let l of LIS(arr)) {
    let i = arr.indexOf(l);
    result.push(i);
  }
  return result;
}

console.log(getSequence([4, 5, 1, 2, 2, 7, 3, 6, 9]));
