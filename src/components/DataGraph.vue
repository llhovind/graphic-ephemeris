<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue';
import * as d3 from 'd3';
import { useEphemerisStore } from '@/stores/ephemeris';
import { findMinMax, InitialCaps, intersectArray, diffArray_simple } from '@/composables/utils';
import JulianDate from 'julian-date';

const ephemerisStore = useEphemerisStore();
const svgRef = ref(null);
const trackingGridRef = ref(null);
const svgContainerRef = ref(null);
var svg = undefined;
const svgState = {
    dimensions: {},
    xMin: undefined,
    xMax: undefined,
    xScale: undefined,
    xScaleCT: undefined,
    yScale: undefined
};
const svgContainerState = reactive({ dimensions: {} });
var gridLayer = undefined;
var selectedModel = ref('geo');
var selectedDateLocked = ref(false);
var selectedAngle = ref(90);


// helper function(s)
// -------------------
function aspectAng(ang1, ang2 = 0) {

    let ang = Math.abs(ang1 - ang2);

    return ang > 180 ? 360 - ang : ang;
}


// begin component
// ----------------
onMounted(() => {

    initializeGraph();
    // add resize observer
    svgContainerState.dimensions = svgContainerRef.value.getBoundingClientRect();
    observer.observe(svgContainerRef.value);
});

onBeforeUnmount(() => {
    // remove resize observer
    observer.unobserve(svgContainerRef.value);
});

function drawEphemerisData() {

    setGraphScalesAndAxes();
    plotEphemerides();
}

function initializeGraph() {

    svgState.dimensions = svgRef.value.getBoundingClientRect();

    svg = d3.select(svgRef.value);

    // initialize tracking grid
    gridLayer = d3.select(trackingGridRef.value);

    // set tracking lines
    gridLayer.select('.vertical').select('line')
        .attr("stroke-width", 1)
        .attr("stroke", "#0909FF")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", svgState.dimensions.height)
        ;
    gridLayer.select('.horizontal').select('line')
        .attr("stroke-width", 1)
        .attr("stroke", "#0909FF")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", svgState.dimensions.width)
        .attr("y2", 0)
        ;
    // setup event grid and event listening
    gridLayer.select("rect.evtGrid").style("fill", "none")
        .attr('width', svgState.dimensions.width - 1)
        .attr('height', svgState.dimensions.height - 1)
        .style("transform", `translate(1px, 1px)`)
        .style("pointer-events", "all")
        .on('mousemove', mouseEvt)
        .on('mouseenter', mouseEvt)
        .on('mouseleave', mouseEvt)
        .on('click', mouseEvt)
        ;
}

function mouseEvt(evt) {

    if (evt.type === 'mousemove' && !selectedDateLocked.value) {
        let ppos = d3.pointer(evt);
        ephemerisStore.selectedDate = Math.round(svgState.xScale.invert(ppos[0]));
        selectedAngle.value = Math.round(svgState.yScale.invert(ppos[1]));
    }

    if (evt.type === 'mouseenter' && !selectedDateLocked.value) {
        gridLayer.select('.sight circle')
            .classed('animate', true)
            ;
    }

    if (evt.type === 'mouseleave' && !selectedDateLocked.value) {
        gridLayer.select('.sight circle')
            .classed('animate', false)
            ;
    }

    if (evt.type === 'click') {
        selectedDateLocked.value = !selectedDateLocked.value;
        if (!selectedDateLocked.value) {
            let ppos = d3.pointer(evt);
            ephemerisStore.selectedDate = Math.round(svgState.xScale.invert(ppos[0]));
            selectedAngle.value = Math.round(svgState.yScale.invert(ppos[1]));
        }

        gridLayer.select('.sight circle')
            .classed('animate', () => (selectedDateLocked.value ? false : true))
            .style('stroke', () => (selectedDateLocked.value ? 'red' : null))
            ;

        svg.classed('hideCursor', !selectedDateLocked.value);
    }
}

function setGraphScalesAndAxes() {
    let tmpDts = Object.keys(ephemerisStore.ephemeridesIdxByDate['geo']);
    let { tmpMin, tmpMax } = findMinMax(tmpDts);
    svgState.xMin = parseInt(tmpMin);
    svgState.xMax = parseInt(tmpMax);

    // xScale is 1st Julian Day to Last Julian Day
    svgState.xScale = d3.scaleLinear()
        .domain([svgState.xMin, svgState.xMax])
        // the Range is brought in 2px so the Planet dots stay inside the graph area
        .range([2, svgState.dimensions.width - 2]);

    // xScaleCT is the same as xScale but in Civil Time instead
    svgState.xScaleCT = d3.scaleTime()
        .domain([new Date(new JulianDate().julian(svgState.xMin - 0.5).getDate()), new Date(new JulianDate().julian(svgState.xMax - 0.5).getDate())])
        // the Range is brought in 2px so the Planet dots stay inside the graph area
        .range([2, svgState.dimensions.width - 2]);

    // yScale is 0 to 180 degrees
    svgState.yScale = d3.scaleLinear()
        .domain([0, 180])
        // the Range is brought in 2px so the Planet dots stay inside the graph area
        .range([svgState.dimensions.height - 2, 2]);

    // draw axes
    const xAxis = d3.axisBottom().scale(svgState.xScaleCT);
    svg.select(".x-axis")
        .style("transform", `translateY(${svgState.dimensions.height}px)`)
        .call(xAxis);

    const yAxis = d3.axisLeft(svgState.yScale).tickValues([0, 30, 60, 90, 120, 150, 180]);
    svg.select(".y-axis")
        .style("transform", `translateX(-1px)`)
        .call(yAxis);
}

function plotEphemerides() {

    const ephemerisLayer = svg.select('.ephemerisLayer');
    // intersect the list of planets with the type of 'model', geo or helio
    const modelPlanets = selectedModel.value === 'geo' ? ephemerisStore.geoPlanets : ephemerisStore.helioPlanets;
    const planetsList = intersectArray(ephemerisStore.selectedPlanets, modelPlanets);
    const planetsListUnselected = diffArray_simple(ephemerisStore.selectedPlanets, modelPlanets);

    // enumerate thru the list of unselectedPlanets and remove
    planetsListUnselected.forEach(planet => {
        let removeDots = ephemerisLayer
            .selectAll('g.planet-' + planet)
            .remove()
            ;
    })

    // enumerate thru the list of selectedPlanets
    planetsList.forEach((planet) => {
        // get current data points
        let dots = ephemerisLayer
            .selectAll("g.planet-" + planet)
            .data(ephemerisStore.ephemerides[selectedModel.value][planet], function (d) { return parseInt(d.julianDate) });

        // update data points
        dots.transition().duration(140)
            .select('circle')
            .attr("cx", (d) => svgState.xScale(parseInt(d.julianDate)))
            .attr("cy", (d) => svgState.yScale(aspectAng(d.longitude)))
            ;

        // append new data points
        let newDots = dots.enter()
            .append("g")
            .classed("planet", true)
            .classed("planet-" + planet, true)
            .append("circle")
            .attr("fill", ephemerisStore.planetColors[planet])
            .attr("r", 2)
            .attr("cx", (d) => svgState.xScale(parseInt(d.julianDate)))
            .attr("cy", (d) => svgState.yScale(aspectAng(d.longitude)))
            ;

        // remove old data points
        dots.exit().remove();
    });

    // move the selectedDate line or to the middle if out of range and unlock
    if (ephemerisStore.selectedDate < svgState.xMin || ephemerisStore.selectedDate > svgState.xMax) {
        ephemerisStore.selectedDate = Math.round((svgState.xMax + svgState.xMin) / 2);
        selectedDateLocked.value = false;
    }
    
    positionCrosshairs();
}

function positionCrosshairs() {
    // position sight
    gridLayer.select('.sight')
        .style('transform', `translate(${svgState.xScale(ephemerisStore.selectedDate)}px, ${svgState.yScale(selectedAngle.value)}px)`)
        ;
    // position Date bar
    gridLayer.select('.vertical')
        .style('transform', `translateX(${svgState.xScale(ephemerisStore.selectedDate)}px)`)
        ;
    gridLayer.select('.vertical').select('tspan.jd')
        .text(ephemerisStore.selectedDate)
        ;
    gridLayer.select('.vertical').select('tspan.dt')
        .text(new JulianDate().julian(ephemerisStore.selectedDate).getDate().toLocaleDateString().substring(0, 10))
        ;
    // position Angle bar
    gridLayer.select('.horizontal')
        .style('transform', `translateY(${svgState.yScale(selectedAngle.value)}px)`)
        ;
    // check sight color and status
    gridLayer.select('.sight circle')
        // .classed('animate', () => (selectedDateLocked.value ? false : true))
        .style('stroke', () => (selectedDateLocked.value ? 'red' : null))
        ;
}

function onSelectionChange() {

    plotEphemerides();
}

// *** For Resizing Component
// add Resize Observer to redraw the graph
const observer = new ResizeObserver(entries => {
    entries.forEach(entry => {
        svgContainerState.dimensions = entry.contentRect;
    })
})

function onResizeEvent() {

    initializeGraph();
    if (ephemerisStore.ephemeridesIdxByDate['geo']) {
        drawEphemerisData();
    }
}


// **** Watchers
//
watch(() => ephemerisStore.ephemeridesIdxByDate, drawEphemerisData);
watch(selectedModel, drawEphemerisData);
watch(() => ephemerisStore.selectedDate, positionCrosshairs);
watch(selectedAngle, positionCrosshairs);
watch(() => ephemerisStore.selectedPlanets, onSelectionChange);
watch(() => svgContainerState.dimensions, onResizeEvent);

</script>

<template>
    <div ref="svgContainerRef" class="svg-container">
        <div class="perspective">
            <span>Perspective: </span><label v-for="model in ephemerisStore.models" class="modelRadioGrp"><input type="radio" name="model" :value="model" v-model="selectedModel">{{ InitialCaps(model) }}centric</label>
        </div>
        <svg ref="svgRef" class="svg-content hideCursor">
            <g class="y-axis" />
            <text class="y-axisLabel">Degrees From Origin</text>
            <g class="x-axis" />
            <g class="ephemerisLayer" />
            <text class="annotation1">Click to {{ selectedDateLocked ? 'Unlock' : 'Lock' }} Crosshairs</text>
            <g ref="trackingGridRef" class="trackingLayer">
                <g class="horizontal">
                    <line></line>
                </g>
                <g class="vertical">
                    <rect class="label"></rect>
                    <text class="label">
                        <tspan class="dt" x="0" dy="0em">00/00/00</tspan>
                        <tspan class="jd" x="0" dy="1.0em"></tspan>
                    </text>
                    <text v-if="selectedDateLocked" class="lock">Locked</text>
                    <line></line>
                </g>
                <g class="sight">
                    <circle r="12" />
                </g>
                <rect class="evtGrid"></rect>
            </g>
        </svg>
    </div>
</template>

<style lang="scss" scoped>
.modelRadioGrp {
    margin-left: 1.0rem;

    input {
        margin-right: 0.25rem;
    }
}

div.svg-container {
    display: flex;
    flex: 1;
    position: relative;
    overflow: hidden;
    margin-bottom: 8px;
    box-shadow: 3px 1px 10px gray;
}

svg {
    --margin-left: 4.0rem;
    --margin-top: 3.2rem;
    --margin-right: 30px;
    --margin-bottom: 2.5rem;

    margin-left: var(--margin-left);
    margin-top: var(--margin-top);
    background-color: white;

    &.svg-content {
        position: absolute;
        top: 0;
        left: 0;
        height: calc(100% - var(--margin-top) - var(--margin-bottom));
        width: calc(100% - var(--margin-left) - var(--margin-right));
        max-height: calc(100% - var(--margin-top) - var(--margin-bottom));
        max-width: calc(100% - var(--margin-left) - var(--margin-right));
        color: black;
        overflow: visible;

        .y-axisLabel {
            letter-spacing: 0.15rem;
            word-spacing: 0.5rem;
            text-anchor: middle;
            transform: translate(-2.70rem, 50%) rotate(-90deg);
        }

        .annotation1 {
            font-size: smaller;
            fill: gray;
            text-anchor: end;
            transform: translate(100%, -1.9rem);
        }
    }

    &.hideCursor {
        cursor: none;
    }

    @keyframes pulse_cursor {
        from {
            opacity: 1;
        }

        to {
            opacity: .1;
        }

    }

    g.trackingLayer {

        g.sight {

            circle {
                stroke-width: 1.5;
                stroke: #0909ff;
                fill: none;
                opacity: 1;

                &.animate {
                    animation: pulse_cursor 1s infinite;
                }
            }
        }

        rect.evtGrid {
            fill: none;
        }

        rect.label {
            height: 1.7rem;
            width: 5rem;
            fill: rgba(0, 89, 255, 0.842);
            opacity: 0.4;
            transform: translate(-2.5rem, -1.7rem);


        }

        text.label {
            text-anchor: middle;
            font-size: 0.8rem;
            font-weight: normal;
            transform: translateY(-1.0rem);

            tspan.jd {
                font-weight: bold;
            }

        }

        text.lock {
            text-anchor: middle;
            font-size: smaller;
            fill: goldenrod;
            transform: translateY(0.75rem);
        }
    }
}

.perspective {
    padding-top: 4px;
    padding-left: 1.0rem;

    span {
        font-weight: bold;
    }
}
</style>