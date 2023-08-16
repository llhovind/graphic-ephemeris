
export function findMinMax(arry) {
    let tmpMin = Infinity;
    let tmpMax = -Infinity;

    arry.forEach(elem => {
        if (+elem < tmpMin) {
            tmpMin = +elem;
        }
        if (+elem > tmpMax) {
            tmpMax = +elem;
        }

    });

    return { tmpMin, tmpMax }
}

export function InitialCaps(txt) {

    if (typeof txt === 'string') {

        let initial = txt[0];

        return initial.toLocaleUpperCase() + txt.substring(1);
    }

    return undefined

}

export function fixedNum(value, precision = 2) {

    if (typeof value === "number") {
        return value.toFixed(precision);
    }
    return "--";
}

export function convertArrayValuesToNumbers(arry) {

    arry.forEach(elem => {
        elem = +elem;
    })
}

export function diffArray_simple(arry1, arry2) {

    let diff = arry1.filter(x => !(arry2.includes(x) || arry2.includes(+x)))
        .concat(arry2.filter(x => !(arry1.includes(x) || arry1.includes(+x))));

    return diff;
}

export function intersectArray(arry1, arry2) {

    return arry1.filter(x => arry2.includes(x));
}