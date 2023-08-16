import { ref, reactive, computed, watch } from 'vue';
import { defineStore } from 'pinia';
import axios from 'axios';
import { useDateUtils } from '../composables/dateutils';
import { diffArray_simple } from '../composables/utils';

const { addDays, diffDays } = useDateUtils();

export const useEphemerisStore = defineStore('ephemeris', () => {
  const MILLISPERDAY = 24 * 60 * 60 * 1000;
  const loadingCnt = ref(0);
  // const startDate = ref(new Date().toISOString().substring(0, 10));
  const startDate = ref('2023-06-10');
  const count = ref(239);
  const endDate = ref(addDays(startDate.value, count.value));
  const selectedDate = ref(1);
  const models = ['geo', 'helio'];
  const planets = ref({});
  const availablePlanets = ref([]);
  const geoPlanets = ref([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const helioPlanets = ref([2, 3, 4, 5, 6, 7, 8, 9, 14]);
  const selectedPlanets = ref([0, 2, 3, 4, 5, 6, 14]);
  const unselectedPlanets = computed(() => { return diffArray_simple(availablePlanets.value, selectedPlanets.value) });
  const ephemerides = ref({});
  const ephemeridesIdxByDate = ref({});
  const aspectAngles = ref([0, 90, 120, 180]);
  const planetColors = [
    "gold",
    "silver",
    "grey",
    "pink",
    "red",
    "orange",
    "indianred",
    "darkgoldenrod",
    "lightblue",
    "orchid",
    "mean_node",
    "lightgreen",
    "mean_apog",
    "oscu_apog",
    "brown",
  ];
  const planetSymbols = [
    "\u2609",
    "\u263e",
    "\u263f",
    "\u2640",
    "\u2642",
    "\u2643",
    "\u2644",
    "\u2645",
    "\u2646",
    "\u2647",
    "10",
    "\u260a",
    "12",
    "13",
    "\u2295"
  ];
  const aspectSymbols = {
    0: '\u260C',
    90: '\u25A1',
    120: '\u25B3',
    180: '\u260D'
  };
  const aspectColors = {
    0: 'black',
    90: 'red',
    120: 'green',
    180: 'red'
  };
  const signSymbols = [
    "\u2648",
    "\u2649",
    "\u264A",
    "\u264B",
    "\u264C",
    "\u264D",
    "\u264E",
    "\u264F",
    "\u2650",
    "\u2651",
    "\u2652",
    "\u2653",
  ];

  function updateCount() {
    count.value = diffDays(startDate.value, endDate.value);

    if (isNaN(count.value)) {
      // if the count is not a number, reset to minimum
      count.value = 44;
    }

    if (count.value < 44) {
      count.value = 44;
    }
    if (count.value > 729) {
      count.value = 729;
    }

    endDate.value = addDays(startDate.value, count.value);

    getEphemerides();
  }

  function getEphemerides() {

    let qry = '?models=' + models.join();
    qry += '&planets=' + availablePlanets.value.join();
    qry += '&startDate=' + startDate.value + 'T12:00:00Z';
    qry += '&endDate=' + endDate.value + 'T12:00:00Z';

    loadingCnt.value++;

    return axios.get('api/v1/ephemeris' + qry)
      .then(response => {

        ephemerides.value = response.data.content.ephemerides;
        ephemeridesIdxByDate.value = pivotEphemerides(response.data.content.ephemerides);

        return 'Ephemerides retrieved';
      })
      .catch(err => {
        console.log(err);

        return Promise.reject(err);
      })
      .finally(() => { loadingCnt.value-- })
  }

  function pivotEphemerides(ephemerides) {
    // 'ephemerides' comes in as models{} -> planets{} -> days[]
    // this will change it to models{} -> days{} -> planets{}
    // giving up a Date index into the ephemerides

    let tmpEphem = {};

    Object.keys(ephemerides).forEach(model => {

      tmpEphem[model] = {};

      Object.keys(ephemerides[model]).forEach(planet => {

        ephemerides[model][planet].forEach(ephem => {
          // this object's keys will be the integer value fo the Julian Date of the ephem
          let jDt = parseInt(ephem.julianDate);

          tmpEphem[model][jDt] = tmpEphem[model][jDt] || {};
          tmpEphem[model][jDt][planet] = ephem;
        })
      })
    })

    return tmpEphem;
  }

  function aspectAng(ang1, ang2 = 0) {

    let ang = Math.abs(ang1 - ang2);

    return ang > 180 ? 360 - ang : ang;
  }

  function calculateAspects(ephemeridesForDate) {

    // ephemeridesForDate is an object with the planets as keys
    let planets = Object.keys(ephemeridesForDate);
    let tmpAspects = {};

    for (let i = 0; i < planets.length; i++) {

      for (let j = (i + 1); j < planets.length; j++) {

        let aspAng = aspectAng(ephemeridesForDate[planets[i]].longitude, ephemeridesForDate[planets[j]].longitude);
        let variance = Math.abs(ephemeridesForDate[planets[i]].longitudeSpeed - ephemeridesForDate[planets[j]].longitudeSpeed) / 2;
        if (variance < 2) {
          variance = 2;
        }

        for (let n = 0; n < aspectAngles.value.length; n++) {

          let lowmark = aspectAngles.value[n] - variance;
          let highmark = aspectAngles.value[n] + variance;

          if ((aspAng >= lowmark) && (aspAng <= highmark)) {

            tmpAspects[planets[i]] = tmpAspects[planets[i]] || {};

            tmpAspects[planets[i]][planets[j]] = aspectAngles.value[n];
          }
        }
      }
    }
    // attach aspects to the empheris
    ephemeridesForDate.aspects = ref(tmpAspects);

    return
  }

  function degreeAsSign(degrees) {

    if (typeof degrees === 'number') {
      let sign = parseInt(degrees / 30);
      let deg = degrees % 30;
      deg = deg.toFixed(2);

      return deg + ' ' + signSymbols[sign];
    }

    return 'x';
  }

  function getPlanets() {

    loadingCnt.value++;

    return axios.get('api/v1/planetNames')
      .then(response => {

        planets.value = response.data.content;
        // make available array
        availablePlanets.value = Object.keys(planets.value).map((elem) => +elem).sort((a, b) => a - b);
      })
      .catch(err => {
        console.log(err);

        return Promise.reject(err);
      })
      .finally(() => { loadingCnt.value-- })
  }

  getPlanets()
    .then(response => {

      getEphemerides();
    });

  watch(startDate, updateCount);
  watch(endDate, updateCount);

  return {
    loadingCnt, startDate, count, endDate, selectedDate, ephemerides, ephemeridesIdxByDate, models,
    planets, planetColors, planetSymbols, aspectSymbols, aspectColors, availablePlanets, geoPlanets,
    helioPlanets, selectedPlanets, unselectedPlanets, degreeAsSign, calculateAspects,
    getEphemerides
  }
})
