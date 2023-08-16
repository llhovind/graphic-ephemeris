<script setup>
import { ref } from 'vue';
import { useEphemerisStore } from '../stores/ephemeris';
import DataGraph from '../components/DataGraph.vue';
import DateRangePicker from '../components/DateRangePicker.vue';
import EphemerisTable from '../components/EphemerisTable.vue';
import EphemerisFilter from '../components/EphemerisFilter.vue';

const ephemerisStore = useEphemerisStore();

</script>

<template>
  <div class="bodycontainer">
    <header>
      <h2>Graphic Ephemeris</h2>
      <a href="https://github.com/llhovind/graphic-ephemeris" target="_blank" class="githubLink" title="See Me on GitHub"><img src="@/assets/github-mark.svg" alt="GitHub" /></a>
      <DateRangePicker />
    </header>
    <main>
      <div class="column expandable">
        <DataGraph class="expandable" />
        <div class="row spaceEvenly">
          <EphemerisTable model="geo" class="" />
          <EphemerisTable model="helio" class="" />
        </div>
      </div>
      <div class="column space-between">
        <EphemerisFilter /><div>
        <div class="notes">
          Notes:
          <ul>
            <li>Shows multiple time series data (ephemerides)</li>
            <li>Use the cursor to select the points</li>
            <li>Selected data is shown in the tables below</li>
            <li>Use the filter to select which time series to show</li>
          </ul>
        </div>
        <div class="hint"><span>&uArr;</span> hover to zoom</div>
        </div>
      </div>
    </main>
    <footer>&copy;2022-{{ new Date().getFullYear() }} <a href="http://www.hovind.com" target="_blank">Lawrence L Hovind</a></footer>
    <div class="dataloadingstatus" :class="{ active: ephemerisStore.loadingCnt > 0 }">
      <div class="message">LOADING DATA &hellip;</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');

div.bodycontainer {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 16px);
  width: calc(100vw - 16px);
}

header {
  background-image: linear-gradient(to right, rgba(9, 9, 255, .9), rgba(128, 0, 128, .9));
  color: white;
  text-align: center;
  font-size: 1.05rem;
  padding-bottom: 4px;
  margin-left: -4px;
  margin-bottom: 5px;
  border: 2px solid gold;
  border-radius: 6px;
  box-shadow: 2px 3px 6px gray;

  h2 {
    color: gold;
    letter-spacing: 2px;
    font-size: 1.6rem;
    font-weight: bold;
    font-family: Georgia, 'Times New Roman', Times, serif;
  }
}

a.githubLink {
  position: absolute;
  top: 6px;
  right: 6px;

  img {
    height: 24px;
    width: 24px;
  }
}

main {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}

footer {
  font-size: smaller;
  text-align: center;
  color: gray;
  padding-left: 1rem;
  padding-right: 1rem;
}

.column {
  display: flex;
  flex-direction: column;

  &.space-between {
    justify-content: space-between;
  }
}

.row {
  display: flex;
  flex-direction: row;

  &.spaceEvenly {
    justify-content: space-evenly;
  }
}

.expandable {
  flex: 1;
}

.notes {
  max-width: 20rem;
  font-family: 'Caveat', cursive;
  background: #ffc;
  padding: 1.0rem;
  box-shadow: 3px 4px 8px gray;
  transform: rotate(5deg) translateX(-12px);
  transition: transform .25s linear, box-shadow .25s linear;

  ul {
    padding-left: 1.0rem;
  }
}

.hint {
  color: gray;
  padding-left: 1.5rem;

  span {
    font-size: larger;
  }
}

.notes:hover {
  box-shadow: 8px 10px 14px gray;
  transform: scale(2) translate(-5.0rem, -4.0rem);
}

.dataloadingstatus {
  display: none;
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 10;
  height: 100vh;
  width: 100vw;
  background-color: rgba(128, 128, 128, .5);
  align-items: center;
  justify-content: center;

  .message {
    width: 20em;
    padding: 2em;
    background-color: rgba(243, 225, 64, 0.75);
    color: black;
    font-size: x-large;
    border: 3px solid #333;
    text-align: center;
    animation: colorChange 0.5s infinite alternate;
  }

  @keyframes colorChange {
    from {
      color: rgba(0, 0, 0, 1);
    }

    to {
      color: rgba(0, 0, 0, .1);
    }
  }

  &.active {
    display: flex;
  }
}
</style>