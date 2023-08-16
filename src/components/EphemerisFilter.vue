<script setup>
import { ref } from 'vue';
import { useEphemerisStore } from '@/stores/ephemeris';
import { InitialCaps } from '@/composables/utils';

const ephemerisStore = useEphemerisStore();

let filter = {};
ephemerisStore.selectedPlanets.forEach(selected => {
    filter[selected] = true;
});

function onFilterChanged() {
    
    let tmp = [];

    Object.keys(filter).forEach(key => {
        if (filter[key]) {
            tmp.push(+key);
        }
    })

    ephemerisStore.selectedPlanets = tmp;
}

</script>

<template>
    <div>
        <h2>Filter Planets</h2>
        <ul>
            <li v-for="planet in ephemerisStore.availablePlanets">
                <label :style="{ color: ephemerisStore.planetColors[planet] }"><input type="checkbox" v-model="filter[planet]" @change="onFilterChanged" />
                    &nbsp;{{ InitialCaps(ephemerisStore.planets[planet]) }}
                </label>
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
div {
    padding: 1rem 2.0rem;
    border: 2px solid gray;
    border-left: none;
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
    box-shadow: inset 4px 0 10px lightgray;
    background-color: white;
}

h2 {
    border-bottom: 3px solid grey;
}

ul {
    list-style: none;
    font-size: 1.05rem;
    padding-left: 20px;
}
</style>