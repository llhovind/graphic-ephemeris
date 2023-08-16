<script setup>
import { ref, computed } from 'vue';
import { useEphemerisStore } from '@/stores/ephemeris';
import { useDateUtils } from '../composables/dateutils';

const ephemerisStore = useEphemerisStore();
const { addDays } = useDateUtils();

const endDateMin = computed(() => addDays(ephemerisStore.startDate, 44));
const endDateMax = computed(() => addDays(ephemerisStore.startDate, 729));


function onStartDateChange(evt) {
    console.log('Start Date changed. New Start Date is: ', ephemerisStore.startDate);
}

function limitMessage() {
    let msg = '';

    if (ephemerisStore.count <= 44) {
        msg = 'Min Limit: 45 reached';
    }
    if (ephemerisStore.count >= 729) {
        msg = 'Max Limit: 730 reached';
    }
    return msg;
}
</script>

<template>
    <div>
        Ephemerides from
        <input type="date" v-model.lazy="ephemerisStore.startDate" @change="onStartDateChange" />
        to
        <input type="date" v-model="ephemerisStore.endDate" :min="endDateMin" :max="endDateMax" />
        covering {{ ephemerisStore.count + 1 }} days. <span v-if="limitMessage().length">( {{ limitMessage() }} )</span>
    </div>
</template>

<style lang="scss" scoped>
input {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
}
</style>