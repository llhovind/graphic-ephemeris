<script setup>
import { ref, watch } from 'vue';
import { useEphemerisStore } from '@/stores/ephemeris';
import { fixedNum, InitialCaps } from '@/composables/utils';
import JulianDate from 'julian-date';

const ephemerisStore = useEphemerisStore();
const props = defineProps(['model']);
const selectedEphemeris = ref({});
const planetList = (props.model === 'geo' ? ephemerisStore.geoPlanets : ephemerisStore.helioPlanets) || [];
const modelColors = { 'geo': 'green', 'helio': 'gold' }


function setSelectedEphemeris() {

    if (ephemerisStore.ephemeridesIdxByDate[props.model]) {
        selectedEphemeris.value = ephemerisStore.ephemeridesIdxByDate[props.model][ephemerisStore.selectedDate] || {};

        if (!selectedEphemeris.value.aspects) {
            // create aspects
            ephemerisStore.calculateAspects(selectedEphemeris.value);
        }
    }
}

function displayDate() {

    if (selectedEphemeris.value[0] && selectedEphemeris.value[0].julianDate) {

        return new JulianDate().julian(parseInt(selectedEphemeris.value[0].julianDate)).getDate().toLocaleDateString().substring(0, 10);
    }

    return '';
};

function angle(planet) {

    if (selectedEphemeris.value[planet]) {
        return fixedNum(selectedEphemeris.value[planet].longitude);
    }

    return '-';
}

function angleAsSign(planet) {

    if (selectedEphemeris.value[planet]) {
        return ephemerisStore.degreeAsSign(selectedEphemeris.value[planet].longitude);
    }

    return '-';
}

function speed(planet) {
    if (selectedEphemeris.value[planet]) {
        let retro = selectedEphemeris.value[planet].longitudeSpeed < 0 ? 'R' : '';
        return [Math.abs(fixedNum(selectedEphemeris.value[planet].longitudeSpeed)), retro];
    }

    return '-';
}

function latitude(planet) {
    if (selectedEphemeris.value[planet]) {
        return fixedNum(selectedEphemeris.value[planet].latitude);
    }

    return '-';
}

function aspect(planet1, planet2) {
    let tmpA = undefined;

    if (selectedEphemeris.value.aspects && selectedEphemeris.value.aspects[planet1]) {

        tmpA = selectedEphemeris.value.aspects[planet1][planet2];
    }

    return ephemerisStore.aspectSymbols[tmpA] || '';
}

function aspectColor(planet1, planet2) {
    let tmpA = undefined;

    if (selectedEphemeris.value.aspects && selectedEphemeris.value.aspects[planet1]) {

        tmpA = selectedEphemeris.value.aspects[planet1][planet2];
    }

    return ephemerisStore.aspectColors[tmpA] || 'inherit';
}


watch(() => ephemerisStore.selectedDate, setSelectedEphemeris);

</script>

<template>
    <div class="noexpand">
        <div class="row flagBorder" :style="{ background: modelColors[model] }">
            <div class="rotatedLabel">{{ InitialCaps(model) }}</div>
            <div class="whitebkgnd">
                <table class="ephemTable">
                    <thead>
                        <tr>
                            <th>
                                <div class="displayDate">{{ displayDate() }}</div>
                            </th>
                            <th>Long.</th>
                            <th>w/Sign</th>
                            <th>Speed</th>
                            <th>Lat.</th>
                            <th v-for="planet in planetList.slice(1)" :style="{ color: ephemerisStore.planetColors[planet] }">{{ ephemerisStore.planetSymbols[planet] }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="planet in planetList">
                            <td :style="{ color: ephemerisStore.planetColors[planet] }">{{ ephemerisStore.planets[planet] }}&nbsp;{{ ephemerisStore.planetSymbols[planet] }}</td>
                            <td>{{ angle(planet) }}</td>
                            <td>{{ angleAsSign(planet) }}</td>
                            <td>
                                <div class="speed">{{ speed(planet)[0] }}<span class="retro">{{ speed(planet)[1] }}</span></div>
                            </td>
                            <td class="tailSpace">{{ latitude(planet) }}</td>
                            <td v-for="planet2 in planetList.slice(1)" :class="{ aspects: planet2 > planet }">
                                <div class="symbol" :style="{ color: aspectColor(planet, planet2) }">{{ aspect(planet, planet2) }}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
div {
    display: inline-block;
    position: relative;
    background-color: white;

    &.row {
        display: flex;
        flex-direction: row;
    }

    &.noexpand {
        flex: 0;
    }

    &.flagBorder {
        margin-right: 1.0rem;
        padding-top: 1rem;
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
        align-items: center;
    }

    &.whitebkgnd {
        background-color: white;
    }

    &.rotatedLabel {
        width: 2.5rem;
        height: 2.5rem;
        background-color: transparent;
        color: white;
        transform: rotate(-90deg);
        font-size: x-large;
        font-weight: bold;
        flex-grow: 0;
    }

}

table.ephemTable {
    min-height: 9rem;
    line-height: 1.2rem;
    border-collapse: collapse;
    margin-top: 0.25rem;
    margin-right: 0.25rem;
    margin-bottom: 0.25rem;

    thead {

        th {
            border-bottom: 1px solid black;

            &:first-child {
                border: none;
            }

            .displayDate {
                font-size: 0.85rem;
                font-weight: bold;
            }
        }
    }

    tbody {

        tr {
            line-height: 1.0rem;

            td {
                padding: 3px 3px 3px 1.0rem;
                text-align: right;
                white-space: nowrap;

                .speed {
                    display: inline-block;
                    width: 3.0rem;
                }

                &.aspects {
                    padding: 0;
                    border-bottom: 1px dotted gray;
                    text-align: center;
                }

                .symbol {
                    display: inline-block;
                    height: 16px;
                    overflow: hidden;
                }

                &.tailSpace {
                    padding-right: 16px;
                }

                span.retro {
                    display: inline-block;
                    width: 0.7rem;
                    color: red;
                }
            }

            td:first-child {
                padding-left: 0.25rem;
            }

            &:first-child {

                td {
                    padding-top: 6px;
                }
            }
        }
    }
}</style>