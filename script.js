
// ==========================================
// CanSat Ground Station
// CSV Telemetry Replay
// ==========================================

const CSV_FILE = "telemetry.csv";
const REPLAY_INTERVAL = 1000;


// ==========================================
// HTML ELEMENTS
// ==========================================

const systemStatus =
    document.getElementById("system-status");

const communicationStatus =
    document.getElementById("communication-status");

const missionTime =
    document.getElementById("mission-time");

const packetCounter =
    document.getElementById("packet-count");

const temperatureDisplay =
    document.getElementById("temperature");

const pressureDisplay =
    document.getElementById("pressure");

const altitudeDisplay =
    document.getElementById("altitude");

const batteryDisplay =
    document.getElementById("battery");

const telemetryBody =
    document.getElementById("telemetry-body");


// ==========================================
// TELEMETRY ARRAYS
// ==========================================

let telemetryData = [];

let currentPacketIndex = 0;

let receivedPackets = 0;

let timeData = [];
let altitudeData = [];
let temperatureData = [];
let pressureData = [];


// ==========================================
// FORMAT TIME
// ==========================================

function formatMissionTime(milliseconds) {

    const totalSeconds =
        Math.floor(milliseconds / 1000);

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor((totalSeconds % 3600) / 60);

    const seconds =
        totalSeconds % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );
}


// ==========================================
// ALTITUDE CHART
// ==========================================

const altitudeChart =
    new Chart(
        document
            .getElementById("altitudeChart")
            .getContext("2d"),
        {

            type: "line",

            data: {

                labels: [],

                datasets: [{

                    label: "Altitude (m)",

                    data: [],

                    borderWidth: 2,

                    tension: 0.3,

                    fill: false

                }]

            },

            options: {

                responsive: true,

                animation: false,

                scales: {

                    x: {

                        title: {

                            display: true,

                            text: "Mission Time"

                        }

                    },

                    y: {

                        title: {

                            display: true,

                            text: "Altitude (m)"

                        }

                    }

                }

            }

        }
    );


// ==========================================
// TEMPERATURE CHART
// ==========================================

const temperatureChart =
    new Chart(
        document
            .getElementById("temperatureChart")
            .getContext("2d"),
        {

            type: "line",

            data: {

                labels: [],

                datasets: [{

                    label: "Temperature (°C)",

                    data: [],

                    borderWidth: 2,

                    tension: 0.3,

                    fill: false

                }]

            },

            options: {

                responsive: true,

                animation: false,

                scales: {

                    x: {

                        title: {

                            display: true,

                            text: "Mission Time"

                        }

                    },

                    y: {

                        title: {

                            display: true,

                            text: "Temperature (°C)"

                        }

                    }

                }

            }

        }
    );


// ==========================================
// PRESSURE CHART
// ==========================================

const pressureChart =
    new Chart(
        document
            .getElementById("pressureChart")
            .getContext("2d"),
        {

            type: "line",

            data: {

                labels: [],

                datasets: [{

                    label: "Pressure (hPa)",

                    data: [],

                    borderWidth: 2,

                    tension: 0.3,

                    fill: false

                }]

            },

            options: {

                responsive: true,

                animation: false,

                scales: {

                    x: {

                        title: {

                            display: true,

                            text: "Mission Time"

                        }

                    },

                    y: {

                        title: {

                            display: true,

                            text: "Pressure (hPa)"

                        }

                    }

                }

            }

        }
    );


// ==========================================
// LOAD CSV
// ==========================================

async function loadCSV() {

    try {

        communicationStatus.textContent =
            "LOADING";

        const response =
            await fetch(
                CSV_FILE + "?v=" + Date.now()
            );

        if (!response.ok) {

            throw new Error(
                "Could not load telemetry.csv"
            );

        }

        const csvText =
            await response.text();

        parseCSV(csvText);

    }

    catch (error) {

        console.error(
            "CSV loading error:",
            error
        );

        communicationStatus.textContent =
            "DISCONNECTED";

        systemStatus.textContent =
            "ERROR";

    }

}


// ==========================================
// PARSE CSV
// ==========================================

function parseCSV(csvText) {

    const lines =
        csvText.split(/\r?\n/);

    telemetryData = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {

        const line =
            lines[i].trim();

        if (!line) {
            continue;
        }

        const columns =
            line.split(",");

        // Need six columns
        if (columns.length !== 6) {

            console.warn(
                "Skipped corrupted row:",
                line
            );

            continue;
        }


        const sample =
            Number(columns[0]);

        const timeMs =
            Number(columns[1]);

        const temperature =
            Number(columns[2]);

        const pressure =
            Number(columns[3]);

        const altitude =
            Number(columns[4]);

        const relativeAltitude =
            Number(columns[5]);


        // Check for invalid values

        if (

            !Number.isFinite(sample) ||

            !Number.isFinite(timeMs) ||

            !Number.isFinite(temperature) ||

            !Number.isFinite(pressure) ||

            !Number.isFinite(altitude) ||

            !Number.isFinite(relativeAltitude)

        ) {

            console.warn(
                "Skipped invalid row:",
                line
            );

            continue;
        }


        telemetryData.push({

            sample: sample,

            timeMs: timeMs,

            temperature: temperature,

            pressure: pressure,

            altitude: altitude,

            relativeAltitude:
                relativeAltitude

        });

    }


    console.log(
        "Valid telemetry packets:",
        telemetryData.length
    );


    if (telemetryData.length === 0) {

        communicationStatus.textContent =
            "DISCONNECTED";

        systemStatus.textContent =
            "NO DATA";

        return;

    }


    communicationStatus.textContent =
        "CONNECTED";

    systemStatus.textContent =
        "ACTIVE";


    startReplay();

}


// ==========================================
// START REPLAY
// ==========================================

function startReplay() {

    currentPacketIndex = 0;

    receivedPackets = 0;


    // Clear chart data

    timeData = [];

    altitudeData = [];

    temperatureData = [];

    pressureData = [];


    altitudeChart.data.labels =
        timeData;

    altitudeChart.data.datasets[0].data =
        altitudeData;


    temperatureChart.data.labels =
        timeData;

    temperatureChart.data.datasets[0].data =
        temperatureData;


    pressureChart.data.labels =
        timeData;

    pressureChart.data.datasets[0].data =
        pressureData;


    altitudeChart.update();

    temperatureChart.update();

    pressureChart.update();


    telemetryBody.innerHTML = "";


    sendNextPacket();

}


// ==========================================
// SEND NEXT TELEMETRY PACKET
// ==========================================

function sendNextPacket() {

    // ======================================
    // STOP AT END
    // ======================================

    if (
        currentPacketIndex >=
        telemetryData.length
    ) {

        communicationStatus.textContent =
            "COMPLETED";

        systemStatus.textContent =
            "MISSION COMPLETE";

        console.log(
            "Telemetry replay completed."
        );

        return;

    }


    const data =
        telemetryData[currentPacketIndex];


    receivedPackets++;


    // ======================================
    // SENSOR CARDS
    // ======================================

    temperatureDisplay.textContent =
        data.temperature.toFixed(2) +
        " °C";


    pressureDisplay.textContent =
        data.pressure.toFixed(2) +
        " hPa";


    altitudeDisplay.textContent =
        data.altitude.toFixed(2) +
        " m";


    batteryDisplay.textContent =
        "N/A";


    // ======================================
    // OVERVIEW
    // ======================================

    packetCounter.textContent =
        receivedPackets;


    missionTime.textContent =
        formatMissionTime(data.timeMs);


    // ======================================
    // GRAPH DATA
    // ======================================

    const displayTime =
        formatMissionTime(data.timeMs);


    timeData.push(displayTime);


    altitudeData.push(
        data.altitude
    );


    temperatureData.push(
        data.temperature
    );


    // THIS IS THE IMPORTANT PART
    // PRESSURE DATA IS ADDED HERE

    pressureData.push(
        data.pressure
    );


    // Keep last 50 points

    if (timeData.length > 50) {

        timeData.shift();

        altitudeData.shift();

        temperatureData.shift();

        pressureData.shift();

    }


    // ======================================
    // UPDATE ALTITUDE GRAPH
    // ======================================

    altitudeChart.data.labels =
        timeData;

    altitudeChart.data.datasets[0].data =
        altitudeData;

    altitudeChart.update();


    // ======================================
    // UPDATE TEMPERATURE GRAPH
    // ======================================

    temperatureChart.data.labels =
        timeData;

    temperatureChart.data.datasets[0].data =
        temperatureData;

    temperatureChart.update();


    // ======================================
    // UPDATE PRESSURE GRAPH
    // ======================================

    pressureChart.data.labels =
        timeData;

    pressureChart.data.datasets[0].data =
        pressureData;

    pressureChart.update();


    // ======================================
    // TELEMETRY TABLE
    // ======================================

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>
            ${displayTime}
        </td>

        <td>
            ${data.temperature.toFixed(2)} °C
        </td>

        <td>
            ${data.pressure.toFixed(2)} hPa
        </td>

        <td>
            ${data.altitude.toFixed(2)} m
        </td>

        <td>
            N/A
        </td>

    `;


    telemetryBody.prepend(row);


    // Keep 30 rows

    if (
        telemetryBody.children.length > 30
    ) {

        telemetryBody.removeChild(
            telemetryBody.lastChild
        );

    }


    currentPacketIndex++;


    // ======================================
    // NEXT PACKET
    // ======================================

    setTimeout(
        sendNextPacket,
        REPLAY_INTERVAL
    );

}


// ==========================================
// START APPLICATION
// ==========================================

loadCSV();
