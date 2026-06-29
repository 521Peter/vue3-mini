// 4 5 1 2 7 3 6 9
// 1
// 4 5
// 1 2
function LIS(arr) {
    const results = [[arr[0]]]
    for (let n of arr) {
        if (n === 0) continue
        for (let j = results.length - 1; j >= 0; j--) {
            const line = results[j]
            const tail = line[line.length - 1]
            if (n > tail) {
                results.push([...line, n])
                break
            }
        }
        results[0] = [n]
    }
    return results[results.length - 1]
}

function getSequence(arr, lis) {
    const result = []
    for (let l of lis) {
        let i = arr.indexOf(l)
        result.push(i)
    }
    return result
}

const arr = [4, 5, 1, 2, 7, 3, 6, 9]
console.log(LIS(arr));
console.log(getSequence(arr, LIS(arr)));
