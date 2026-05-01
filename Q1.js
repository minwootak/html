const offsets = [
    [0,  36,  3, 41, 18],
    [1,  44, 10, 45,  2],
    [62,  6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39,  8, 14]
];

const RC = [0x01];

const xOrder = [3, 4, 0, 1, 2];
const yOrder = [2, 1, 0, 4, 3];

// ---- Preprocessing phase ----
function ASCIIfy(personalInfo) {
    let ASCIIfiedBits = [];
    for(let character of personalInfo) {
        let code = character.charCodeAt(0);
        let bits = code.toString(2).padStart(8, '0');
        for(let bit of bits) {
            ASCIIfiedBits.push(parseInt(bit));
        }
    }
    return ASCIIfiedBits;
}

function GetFirst200Bits(ASCIIfiedBits) {
    if(ASCIIfiedBits.length >= 200) {
        return ASCIIfiedBits.slice(0, 200);
    } else {
        throw new Error("Given information is less than 200 bits. Please extend the info and try again.");
    }
}

function ConvertIntoState(rawInfo) {
    let stateArray = [];
    for(let i = 0; i < 5; i++) {
        let row = [];
        for(let j = 0; j < 5; j++) {
            row.push(0);
        }
        stateArray.push(row);
    }

    for(let y = 0; y < 5; y++) {
        for(let x = 0; x < 5; x++) {
            let laneOrder = x + 5 * y;
            let bitOrder = laneOrder * 8;
            let lane = rawInfo.slice(bitOrder, bitOrder + 8);

            let laneValue = 0;
            for(let bit of lane) {
                laneValue = (laneValue << 1) | bit;
            }

            stateArray[x][y] = laneValue;
        }
    }
    return stateArray;
}

// ---- Helper ----
function rot(value, n) {
    n = n % 8;
    let bits = [];
    for(let bit of value.toString(2).padStart(8, '0')) {
        bits.push(parseInt(bit));
    }
    let shiftedBits = bits.slice(8 - n).concat(bits.slice(0, 8 - n));
    let result = 0;
    for(let bit of shiftedBits) {
        result = (result << 1) | bit;
    }
    return result & 0xFF;
}

// ---- Theta phase ----
function thetaStep1(stateArray) {
    let C = new Array(5).fill(0);
    for(let x = 0; x < 5; x++) {
        for(let y = 0; y < 5; y++) {
            C[x] = C[x] ^ stateArray[x][y];
        }
    }
    return C;
}

function thetaStep2(C) {
    let D = new Array(5).fill(0);
    for(let i = 0; i < 5; i++) {
        D[i] = C[(i - 1 + 5) % 5] ^ rot(C[(i + 1) % 5], 1);
    }
    return D;
}

function thetaStep3(stateArray, D) {
    let newStateArray = [];
    for(let x = 0; x < 5; x++) {
        let newArray = [];
        for(let y = 0; y < 5; y++) {
            newArray.push(stateArray[x][y] ^ D[x]);
        }
        newStateArray.push(newArray);
    }
    return newStateArray;
}

// ---- Rho phase ----
function rho(stateArray) {
    let newStateArray = [];
    for(let x = 0; x < 5; x++) {
        let newArray = [];
        for(let y = 0; y < 5; y++) {
            let offset = offsets[x][y] % 8;
            let currentCell = stateArray[x][y];
            let rotatedValue = rot(currentCell, offset);
            newArray.push(rotatedValue);
        }
        newStateArray.push(newArray);
    }
    return newStateArray;
}

// ---- Pi phase ----
function pi(stateArray) {
    let newStateArray = [];
    for(let x2 = 0; x2 < 5; x2++) {
        let newArray = [];
        for(let y2 = 0; y2 < 5; y2++) {
            let x = (x2 + y2 * 3) % 5;
            let y = x2;
            let currentCell = stateArray[x][y];
            newArray.push(currentCell);
        }
        newStateArray.push(newArray);
    }
    return newStateArray;
}

// ---- Chi phase ----
function chi(stateArray) {
    let newStateArray = [];
    for(let x = 0; x < 5; x++) {
        let newArray = [];
        for(let y = 0; y < 5; y++) {
            let currentCell = stateArray[x][y] ^ ((~stateArray[(x + 1) % 5][y] & 0xFF) & stateArray[(x + 2) % 5][y]);
            newArray.push(currentCell);
        }
        newStateArray.push(newArray);
    }
    return newStateArray;
}

// ---- Iota phase ----
function iota(stateArray) {
    let newStateArray = [];
    for(let x = 0; x < 5; x++) {
        let newArray = [];
        for(let y = 0; y < 5; y++) {
            let value = stateArray[x][y];
            if(x === 0 && y === 0) {
                value = value ^ RC[0];
            }
            newArray.push(value);
        }
        newStateArray.push(newArray);
    }
    return newStateArray;
}

// ---- Interaction ----
document.getElementById('q1').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('personalInfo').value;
    const preprocessingRes = ConvertIntoState(GetFirst200Bits(ASCIIfy(input)));
    const C = thetaStep1(preprocessingRes);
    const thetaRes = thetaStep3(preprocessingRes, thetaStep2(C));
    const rhoRes = rho(thetaRes);
    const piRes = pi(rhoRes);
    const chiRes = chi(piRes);
    const iotaRes = iota(chiRes);
    const output = document.getElementById('output');
    output.innerHTML = '';

    const Q1_phases = [
        ['Preprocessing', preprocessingRes],
        ['Theta', thetaRes],
        ['Rho', rhoRes],
        ['Pi', piRes],
        ['Chi', chiRes],
        ['Iota', iotaRes],
    ];

    for(let [phase, state] of Q1_phases) {
        let pre = document.createElement('pre');
        pre.textContent = formatState(phase, state);
        output.appendChild(pre);
    }

    let line = document.createElement('pre');
    line.textContent = '-------------------\n';
    output.appendChild(line);
});

function formatState(phase, state) {
    let result = ` ${phase}\n`;
    for(let y of yOrder) {
        let row = ' ';
        for(let x of xOrder) {
            row += state[x][y].toString(16).toUpperCase().padStart(2, '0') + ' ';
        }
        result += row + '\n';
    }
    return result;
}