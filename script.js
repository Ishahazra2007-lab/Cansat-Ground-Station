
// ==========================================
// CanSat Ground Station
// CSV Upload Telemetry System
// ==========================================


// ==========================================
// SETTINGS
// ==========================================

// Time between telemetry packets
// 1000 = 1 second

const REPLAY_INTERVAL = 1000;


// ==========================================
// HTML ELEMENTS
// ==========================================

const csvFile =
    document.getElementById("csvFile");

const uploadButton =
    document.getElementById("uploadButton");

const fileName =
    document.getElementById("file-name");


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


const liveLabel =
    document.getElementById("live-label");

const statusDot =
    document.getElementById("status-dot");


// ==========================================
// DATA
// ==========================================

let telemetryData = [];

let currentPacketIndex = 0;

let receivedPackets = 0;

let replayTimer = null;


// ==========================================
// GRAPH DATA
// ==========================================

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

const altitudeChart =

    new Chart(

        document
            .getElementById("altitudeChart")
            .getContext("2d"),

        {

            type: "line",

            data: {

                labels: [],

                datasets: [

                    {

                        label: "Altitude (m)",

                        data: [],

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

const temperatureChart =

    new Chart(

        document
            .getElementById("temperatureChart")
            .getContext("2d"),

        {

            type: "line",

            data: {

                labels: [],

                datasets: [

                    {

                        label:
                            "Temperature (°C)",

                        data: [],

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

                datasets: [

                    {

                        label:
                            "Pressure (hPa)",

                        data: [],

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

                            text: "Pressure (hPa)"

                        }

                    }

                }

            }

        }

    );


// ==========================================
// FILE SELECTION
// ==========================================

csvFile.addEventListener(
    "change",
    function () {

        if (csvFile.files.length === 0) {

            fileName.textContent =
                "No telemetry file selected";

            return;

        }


        const file =
            csvFile.files[0];


        fileName.textContent =
            "Selected: " + file.name;

    }
);


// ==========================================
// UPLOAD BUTTON
// ==========================================

uploadButton.addEventListener(
    "click",
    function () {

        if (csvFile.files.length === 0) {

            alert(
                "Please select a CSV telemetry file first."
            );

            return;

        }


        const file =
            csvFile.files[0];


        readCSVFile(file);

    }
);


// ==========================================
// READ CSV FILE
// ==========================================

function readCSVFile(file) {

    // Stop previous replay

    if (replayTimer) {

        clearTimeout(replayTimer);

        replayTimer = null;

    }


    systemStatus.textContent =
        "PROCESSING";


    communicationStatus.textContent =
        "PROCESSING";


    liveLabel.textContent =
        "PROCESSING";


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            const csvText =
                event.target.result;


            parseCSV(csvText);

        };


    reader.onerror =
        function () {

            systemStatus.textContent =
                "ERROR";


            communicationStatus.textContent =
                "ERROR";


            liveLabel.textContent =
                "ERROR";


            alert(
                "Could not read the CSV file."
            );

        };


    reader.readAsText(file);

}


// ==========================================
// PARSE CSV
// ==========================================

function parseCSV(csvText) {

    const lines =
        csvText.split(/\r?\n/);


    telemetryData = [];


    if (lines.length < 2) {

        alert(
            "The CSV file does not contain telemetry data."
        );

        return;

    }


    // ======================================
    // FIND HEADER
    // ======================================

    const header =
        lines[0]
            .trim()
            .toLowerCase();


    console.log(
        "CSV Header:",
        header
    );


    // ======================================
    // PROCESS ROWS
    // ======================================

    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i].trim();


        if (!line) {
            continue;
        }


        const columns =
            line.split(",");


        // Expected format:
        //
        // Sample
        // Time(ms)
        // Temperature(C)
        // Pressure(hPa)
        // Altitude(m)
        // RelativeAltitude(m)

        if (columns.length < 6) {

            console.warn(
                "Skipped invalid row:",
                line
            );

            continue;

        }


        const sample =
            Number(
                columns[0].trim()
            );


        const timeMs =
            Number(
                columns[1].trim()
            );


        const temperature =
            Number(
                columns[2].trim()
            );


        const pressure =
            Number(
                columns[3].trim()
            );


        const altitude =
            Number(
                columns[4].trim()
            );


        const relativeAltitude =
            Number(
                columns[5].trim()
            );


        // ==================================
        // VALIDATE DATA
        // ==================================

        if (

            !Number.isFinite(sample) ||

            !Number.isFinite(timeMs) ||

            !Number.isFinite(temperature) ||

            !Number.isFinite(pressure) ||

            !Number.isFinite(altitude) ||

            !Number.isFinite(relativeAltitude)

        ) {

            console.warn(
                "Skipped corrupted row:",
                line
            );

            continue;

        }


        // ==================================
        // STORE DATA
        // ==================================

        telemetryData.push({

            sample:
                sample,

            timeMs:
                timeMs,

            temperature:
                temperature,

            pressure:
                pressure,

            altitude:
                altitude,

            relativeAltitude:
                relativeAltitude

        });

    }


    console.log(
        "Valid telemetry packets:",
        telemetryData.length
    );


    // ======================================
    // CHECK DATA
    // ======================================

    if (telemetryData.length === 0) {

        systemStatus.textContent =
            "NO DATA";


        communicationStatus.textContent =
            "DISCONNECTED";


        liveLabel.textContent =
            "NO DATA";


        alert(
            "No valid telemetry rows were found in the CSV."
        );


        return;

    }


    // ======================================
    // START TELEMETRY
    // ======================================

    systemStatus.textContent =
        "ACTIVE";


    communicationStatus.textContent =
        "CONNECTED";


    liveLabel.textContent =
        "LIVE";


    startReplay();

}


// ==========================================
// START REPLAY
// ==========================================

function startReplay() {

    currentPacketIndex = 0;

    receivedPackets = 0;


    // Clear graph data

    timeData = [];

    altitudeData = [];

    temperatureData = [];

    pressureData = [];


    // Clear table

    telemetryBody.innerHTML = "";


    // Clear charts

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


    // Start

    sendNextPacket();

}


// ==========================================
// SEND TELEMETRY PACKET
// ==========================================

function sendNextPacket() {

    // ======================================
    // STOP AT LAST PACKET
    // ======================================

    if (

        currentPacketIndex >=
        telemetryData.length

    ) {

        systemStatus.textContent =
            "MISSION COMPLETE";


        communicationStatus.textContent =
            "COMPLETED";


        liveLabel.textContent =
            "COMPLETE";


        statusDot.style.background =
            "#22c55e";


        console.log(
            "Telemetry replay completed."
        );


        return;

    }


    // ======================================
    // CURRENT PACKET
    // ======================================

    const data =
        telemetryData[
            currentPacketIndex
        ];


    receivedPackets++;


    // ======================================
    // SENSOR VALUES
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


    // Battery is not in current CSV

    batteryDisplay.textContent =
        "N/A";


    // ======================================
    // OVERVIEW
    // ======================================

    packetCounter.textContent =
        receivedPackets;


    missionTime.textContent =
        formatMissionTime(
            data.timeMs
        );


    // ======================================
    // GRAPH DATA
    // ======================================

    const displayTime =
        formatMissionTime(
            data.timeMs
        );


    timeData.push(
        displayTime
    );


    altitudeData.push(
        data.altitude
    );


    temperatureData.push(
        data.temperature
    );


    pressureData.push(
        data.pressure
    );


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
            ${data.sample}
        </td>

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
            ${data.relativeAltitude.toFixed(2)} m
        </td>

    `;


    telemetryBody.prepend(row);


    // Keep last 30 rows

    if (
        telemetryBody.children.length > 30
    ) {

        telemetryBody.removeChild(
            telemetryBody.lastChild
        );

    }


    // ======================================
    // NEXT PACKET
    // ======================================

    currentPacketIndex++;


    replayTimer =
        setTimeout(
            sendNextPacket,
            REPLAY_INTERVAL
        );

}
