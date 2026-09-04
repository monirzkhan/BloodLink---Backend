// const twoSum = (numbers, target) => {
//     let left = 0;
//     let right=numbers.length-1;
//     while(left<right){
//         const sum=numbers[left]+numbers[right];
//         if (sum===target){
//             return true;
//         }
//         if(sum<target){
//             left++
//         }
//         else{
//             right--
//         }

//     }
//     return false;
// };
const twoSum = (numbers, target) => {
    const map = new Map();
    for(let i=0;i<numbers.length;i++){
        const needed = target - numbers[i];
        if(map.has(needed)){
            return [map.get(needed), i];
        }
        map.set(numbers[i], i);
    }
    return [];
}

twoSum([2, 7, 11, 15], 9);

const hasDuplicate = (numbers) => {
    const set = new Set();
    for(let i=0;i<numbers.length;i++){
        if(set.has(numbers[i])){
            return true;
        }
        set.add(numbers[i]);
    }
    return false;   
};

hasDuplicate([4, 7, 2, 9, 1]);
// false