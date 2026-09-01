// ==========================================
// CanSat Ground Station
// GitHub Pages CSV Telemetry Replay
// ==========================================


// ==========================================
// SETTINGS
// ==========================================

const CSV_FILE = "telemetry.csv";

// Time between telemetry packets
// 1000 = 1 second
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
// TELEMETRY DATA
// ==========================================

let telemetryData = [];

let currentPacketIndex = 0;

let receivedPackets = 0;


// ==========================================
// CHART DATA
// ==========================================

let timeData = [];

let altitudeData = [];

let temperatureData = [];


// ==========================================
// FORMAT MISSION TIME
// ==========================================

function formatMissionTime(milliseconds) {

    const totalSeconds =
        Math.floor(milliseconds / 1000);

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

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

const altitudeCtx =
    document
        .getElementById("altitudeChart")
        .getContext("2d");


const altitudeChart =
    new Chart(
        altitudeCtx,
        {

            type: "line",

            data: {

                labels: timeData,

                datasets: [

                    {

                        label: "Altitude (m)",

                        data: altitudeData,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

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

const temperatureCtx =
    document
        .getElementById("temperatureChart")
        .getContext("2d");


const temperatureChart =
    new Chart(
        temperatureCtx,
        {

            type: "line",

            data: {

                labels: timeData,

                datasets: [

                    {

                        label: "Temperature (°C)",

                        data: temperatureData,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

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
// LOAD CSV
// ==========================================

async function loadCSV() {

    try {

        communicationStatus.textContent =
            "LOADING";

        const response =
            await fetch(CSV_FILE);

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

        console.error(error);

        communicationStatus.textContent =
            "DISCONNECTED";

        systemStatus.textContent =
            "ERROR";

        console.error(
            "Make sure telemetry.csv is in the same folder as index.html"
        );

    }

}


// ==========================================
// PARSE CSV
// ==========================================

function parseCSV(csvText) {

    const lines =
        csvText.split(/\r?\n/);

    // Remove header
    lines.shift();

    telemetryData = [];


    lines.forEach(line => {

        if (!line.trim()) {
            return;
        }

        const columns =
            line.split(",");


        // We need 6 columns
        if (columns.length !== 6) {
            return;
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


        // Ignore corrupted rows

        if (

            !Number.isFinite(sample) ||

            !Number.isFinite(timeMs) ||

            !Number.isFinite(temperature) ||

            !Number.isFinite(pressure) ||

            !Number.isFinite(altitude) ||

            !Number.isFinite(relativeAltitude)

        ) {

            return;

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

    });


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
// REPLAY TELEMETRY
// ==========================================

function startReplay() {

    currentPacketIndex = 0;

    receivedPackets = 0;


    // Clear old graph data

    timeData.length = 0;

    altitudeData.length = 0;

    temperatureData.length = 0;


    altitudeChart.update();

    temperatureChart.update();


    // Clear table

    telemetryBody.innerHTML = "";


    sendNextPacket();

}


// ==========================================
// SEND NEXT PACKET
// ==========================================

function sendNextPacket() {

    if (
        currentPacketIndex >=
        telemetryData.length
    ) {

        // Restart from beginning

        currentPacketIndex = 0;

        receivedPackets = 0;

        timeData.length = 0;

        altitudeData.length = 0;

        temperatureData.length = 0;

        telemetryBody.innerHTML = "";

        altitudeChart.update();

        temperatureChart.update();

    }


    const data =
        telemetryData[currentPacketIndex];


    receivedPackets++;


    // ======================================
    // UPDATE SENSOR CARDS
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


    // Battery isn't present in CSV yet

    batteryDisplay.textContent =
        "N/A";


    // ======================================
    // UPDATE OVERVIEW
    // ======================================

    packetCounter.textContent =
        receivedPackets;


    missionTime.textContent =
        formatMissionTime(data.timeMs);


    // ======================================
    // UPDATE CHART DATA
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


    // Keep last 50 graph points

    if (timeData.length > 50) {

        timeData.shift();

        altitudeData.shift();

        temperatureData.shift();

    }


    altitudeChart.update();

    temperatureChart.update();


    // ======================================
    // ADD TELEMETRY TABLE ROW
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


    // Keep last 30 table rows

    if (
        telemetryBody.children.length > 30
    ) {

        telemetryBody.removeChild(
            telemetryBody.lastChild
        );

    }


    currentPacketIndex++;


    // Next packet

    setTimeout(
        sendNextPacket,
        REPLAY_INTERVAL
    );

}


// ==========================================
// START
// ==========================================

loadCSV();