
export function useDateUtils() {

    const MILLISPERDAY = 24 * 60 * 60 * 1000;

    function addDays(dtStr, count) {
        let tmpDt = new Date(dtStr);

        if ((tmpDt instanceof Date) && !isNaN(Number(count))) {

            let tmpDt2 = new Date(tmpDt.getTime() + count * MILLISPERDAY);

            return tmpDt2.toISOString().substring(0, 10);
        }

        return 'Invalid Date';
    }

    function diffDays(dtStr1, dtStr2) {
        let tmpDt1 = new Date(dtStr1);
        let tmpDt2 = new Date(dtStr2);

        if (tmpDt1 instanceof Date && tmpDt2 instanceof Date) {

            return Math.round((tmpDt2 - tmpDt1) / MILLISPERDAY);
        }

        return NaN;
    }

    return { addDays, diffDays }
}