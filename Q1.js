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

const kDateRes = "4aca50014674bace27a0633cc2767ce3ae3e72cf90656592d98714478c7c7156";
const kRegionRes = "aa1d7bdd925a2d4fe642af67cd577daba040cd0f16df3b4f7a54fc6db49f5b7c";
const kServiceRes = "262ef0c1ace903a38c06e55d5c669fa43bbdd31abbf6f2e122ea14a1bbd3188a";
const kSigningRes = "a0f2993c415bbb018efb555f3207e51a19b0300434279c60ce42b842fdc361dc";
const stringToSign = "AWS4-HMAC-SHA256\n20260414M123600Z\n20260414/us-east-1/iam/aws4_request\nf536975d06c0309214f805bb90ccff089219ecd68b2577efef23edd43b7e1a59";

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
    for(let bit of value.toString(2).padStart(8, "0")) {
        bits.push(parseInt(bit));
    }
    let shiftedBits = bits.slice(8 - n).concat(bits.slice(0, 8 - n));
    let result = 0;
    for(let bit of shiftedBits) {
        result = (result << 1) | bit;
    }
    return result & 0xFF;
}

function bitsToHex(bits) {
    let hex = '';
    for(let i=0; i<bits.length; i+=8) {
        let byte = 0;
        for(let j=0; j<8; j++) {
            byte = (byte << 1) | bits[i + j];
        }
        hex += byte.toString(16).padStart(2, '0');
    }
    return hex;
}

function hexToBits(hex) {
    let bits = [];
    for(let i=0; i<hex.length; i+=2) {
        let byte = parseInt(hex.slice(i, i+2), 16);
        for(let j=7; j>=0; j--) {
            bits.push((byte >> j) & 1);
        }
    }
    return bits;
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

// ------ Q2 ------
// ---- preprocessing ----
function addPadding(input) {
    const bitsLimit = 64 * 8;
    const length = input.length;

    if(length < bitsLimit) {
        const paddngAmount = bitsLimit - length;
        for(let i=0; i<paddngAmount; i++) {
            input.push(0);
        }
    } else if(length>bitsLimit) {
        return input.slice(0, bitsLimit);
    }
    return input;
}

// ---- XOR  ----
function XOR(type, key) {
    const isIpad = (type === "ipad");
    const padType = isIpad ? 0x36 : 0x5c;
    const bits = [];
    for(let i=0; i<8; i++) {
        bits.push((padType >> (7-i)) & 1);
    }

    let result = [];
    for(let i=0; i<key.length; i++) {
        result.push(key[i] ^ bits[i%8]);
    }
    return result;
}

// ---- Interaction ----
document.getElementById("q1").addEventListener("submit", function(e) {
    e.preventDefault();
    const input = document.getElementById("personalInfo").value;
    const preprocessingRes = ConvertIntoState(GetFirst200Bits(ASCIIfy(input)));
    const C = thetaStep1(preprocessingRes);
    const thetaRes = thetaStep3(preprocessingRes, thetaStep2(C));
    const rhoRes = rho(thetaRes);
    const piRes = pi(rhoRes);
    const chiRes = chi(piRes);
    const iotaRes = iota(chiRes);
    const output = document.getElementById("output");
    output.innerHTML = "";

    const Q1_phases = [
        ["Preprocessing", preprocessingRes],
        ["Theta", thetaRes],
        ["Rho", rhoRes],
        ["Pi", piRes],
        ["Chi", chiRes],
        ["Iota", iotaRes],
    ];

    for(let [phase, state] of Q1_phases) {
        let pre = document.createElement("pre");
        pre.textContent = formatState(phase, state);
        output.appendChild(pre);
    }

    let line = document.createElement("pre");
    line.textContent = "-------------------\n";
    output.appendChild(line);
});

document.getElementById("q2").addEventListener("submit", function(e) {
    e.preventDefault();
    const input = "AWS4" + document.getElementById("key").value.trim();
    const date = document.getElementById("date").value.trim();
    const region = document.getElementById("region").value.trim();
    const service = document.getElementById("service").value.trim();
    const signing = document.getElementById("sign").value.trim();

    const paddedInput = addPadding(ASCIIfy(input));
    const kDate_phase1 = XOR("ipad", paddedInput);
    const kDate_phase2 = XOR("opad", paddedInput);

    const paddedkDate = addPadding(hexToBits(kDateRes));
    const kRegion_phase1 = XOR("ipad", paddedkDate);
    const kRegion_phase2 = XOR("opad", paddedkDate);

    const paddedkRegion = addPadding(hexToBits(kRegionRes));
    const kService_phase1 = XOR("ipad", paddedkRegion);
    const kService_phase2 = XOR("opad", paddedkRegion);

    const paddedkService = addPadding(hexToBits(kServiceRes));
    const kSigning_phase1 = XOR("ipad", paddedkService);
    const kSigning_phase2 = XOR("opad", paddedkService);

    const paddedkSigning = addPadding(hexToBits(kSigningRes));
    const signature_phase1 = XOR("ipad", paddedkSigning);
    const signature_phase2 = XOR("opad", paddedkSigning);
    
    const output = document.getElementById("output");
    output.innerHTML = "";

    const messages = [
        ["date", bitsToHex(ASCIIfy(date))],
        ["region", bitsToHex(ASCIIfy(region))],
        ["service", bitsToHex(ASCIIfy(service))],
        ["signing", bitsToHex(ASCIIfy(signing))],
        ["String to sign", bitsToHex(ASCIIfy(stringToSign))]
    ]

    for(let [message, result] of messages) {
        let pre = document.createElement("pre");
        pre.textContent = " " + message + " in hex: " + result + "\n";
        output.appendChild(pre);
    }

    let line = document.createElement("pre");
    line.textContent = " -------------------\n";
    output.appendChild(line);

    const Q2_phases = [
        ["Preprocessing", paddedInput],
        ["inner", kDate_phase1],
        ["kDate-XOR opad", kDate_phase2],
        ["Preprocessing", paddedkDate],
        ["kRegion-XOR ipad", kRegion_phase1],
        ["kRegion-XOR opad", kRegion_phase2],
        ["preprocessing", paddedkRegion],
        ["kService-XOR ipad", kService_phase1],
        ["kService-XOR opad", kService_phase2],
        ["Preprocessing", paddedkService],
        ["kSigning-XOR ipad", kSigning_phase1],
        ["kSigning-XOR opad", kSigning_phase2],
        ["Preprocessing", paddedkSigning],
        ["signature-XOR ipad", signature_phase1],
        ["signature-XOR opad", signature_phase2]
    ];

    for(let [phase, result] of Q2_phases) {
        let pre = document.createElement("pre");
        pre.textContent = formatResult(phase, bitsToHex(result));
        output.appendChild(pre);
    }
});

// ---- print ----
function formatState(phase, state) {
    let result = ` ${phase}\n`;
    for(let y of yOrder) {
        let row = " ";
        for(let x of xOrder) {
            row += state[x][y].toString(16).toUpperCase().padStart(2, '0') + " ";
        }
        result += row + "\n";
    }
    return result;
}

function formatResult(phase, result) {
    let res = ` ${phase}\n` + " ";
    for(let i=0; i<result.length; i++) {
        if(i === result.length/2) {
            res += "\n" + " ";
        }
        res += result[i];
    }
    return res;
}