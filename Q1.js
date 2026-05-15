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

const KC = aesjs.utils.hex.toBytes("30fe8f03c4e5a3b3fd6c61149a815dc1");
const KS = aesjs.utils.hex.toBytes("c287da6ac055e4b963362af0a9d31b8b");
const NC = aesjs.utils.hex.toBytes("01ecf4202a509c36c0a5c87b67844541");
const c = aesjs.utils.utf8.toBytes("Minwoo");
const s = aesjs.utils.utf8.toBytes("Tak");
const Lt = aesjs.utils.utf8.toBytes("8h");

const sNumber = "S3818058";
const p = bigInt("178011905478542266528237562450159990145232156369120674273274450314442865788737020770612695252123463079567156784778466449970650770920727857050009668388144034129745221171818506047231150039301079959358067395348717066319802262019714966524135060945913707594956514672855690606794135837542707371727429551343320695239");
const g = bigInt("174068207532402095185811980123523436538604490794561350978495831040599953488455823147851597408940950725307797094915759492368300574252438761037084473467180148876118103083043754985190983472601550494691329488083395492313850000361646482644608492304078721818959999056496097769368017749273708962006689187956744210730");
const vpcName = "Minwoo";
const dataCenterName = "Tak";

const p2 = bigInt("8cb07b6f520e081c8eb473253041f13e57a697655f5782b61dd7af3d9dd44a5824922affa02d619eabea5e625835af9292b92a481caee1dcd128fcdd7132d973", 16);
const q2 = bigInt("853742bd61f0f0236696e1d8ee3ff76858be8189f0d86701b6cdc0c62b2e0c56792eaa6e50ac12a76eedb36bb718d27cd84449380df7230bb427a848dd7a096f", 16);
const n2 = p2.multiply(q2);
const phi2 = p2.minus(1).multiply(q2.minus(1));

const emailAddress = "s3818058@rmit.edu.vn";

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

function PrimeFactorization(sNumber) {
    let divider = 2;
    while(divider * divider <= sNumber) {
        if(sNumber % divider === 0) {
            sNumber /= divider;
        } else {
            divider++;
        }
    }
    return sNumber;
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

// ------ Q1 ------
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

// ------ Q3 ------
// ---- AES CBC ----
function Encrypt(plainText, aesKey, initVector) {
    const plainTextBytes = aesjs.padding.pkcs7.pad(plainText);

    const aes = new aesjs.ModeOfOperation.cbc(aesKey, initVector);
    const encryptedBytes = aes.encrypt(plainTextBytes);

    return aesjs.utils.hex.fromBytes(encryptedBytes);
}

function Decrypt(encryptedRes, aesKey, initVector) {
    const encryptedText = aesjs.utils.hex.toBytes(encryptedRes);

    const aes = new aesjs.ModeOfOperation.cbc(aesKey, initVector);
    const decryptedBytes = aesjs.padding.pkcs7.strip(aes.decrypt(encryptedText));

    return decryptedBytes;
}

// ---- Kerberos ----
function KerberosPhase1(sk, iv) {
    const c_UTF8 = aesjs.utils.utf8.fromBytes(c);
    const s_UTF8 = aesjs.utils.utf8.fromBytes(s);
    const Lt_UTF8 = aesjs.utils.utf8.fromBytes(Lt);
    const NC_Hex = aesjs.utils.hex.fromBytes(NC);
    const step1 = {c_UTF8, s_UTF8, Lt_UTF8, NC_Hex};

    const plainText = new Uint8Array([...sk, ...s, ...Lt, ...NC]);
    const EncryptedKC = Encrypt(plainText, KC, iv);

    const plainTicket = new Uint8Array([...sk, ...c, ...Lt]);
    const ticket = Encrypt(plainTicket, KS, iv);
    const step2 = {EncryptedKC, ticket};
    return {step1, step2, ticket};
}

function KerberosPhase2(ticket, sk, iv) {
    const timeStamp = aesjs.utils.utf8.toBytes("20260505120000");

    const plainAuth = new Uint8Array([...c, ...timeStamp, ...sk]);
    const auth = Encrypt(plainAuth, sk, iv);
    const step1 = {ticket, auth};

    const plainResponse = new Uint8Array([...timeStamp, ...sk]);
    const response = Encrypt(plainResponse, sk, iv);
    const step2 = {response};
    return {step1, step2, auth};
}

function VerifyClient(ticket, auth, iv) {
    const decryptedTicket = Decrypt(ticket, KS, iv);
    const extractedSk = decryptedTicket.slice(0, 16);
    const decryptedAuth = aesjs.utils.hex.fromBytes(Decrypt(auth, extractedSk, iv));
    return decryptedAuth.includes(aesjs.utils.hex.fromBytes(extractedSk));
}

function VerifyServer(response, sk, iv) {
    const decryptedResponse = aesjs.utils.hex.fromBytes(Decrypt(response, sk, iv));
    return decryptedResponse.includes(aesjs.utils.hex.fromBytes(sk));
}

// ------ Q4 ------
// ---- Random Generator ----
function getRandom() {
    const min = bigInt(2).pow(159);
    const max = bigInt(2).pow(160).minus(1);
    return bigInt.randBetween(min, max);
}

// ---- SHA1 Hash ----
function SHA1Hash(value) {
    return sha1(value);
}

// ---- Modular exponentiation algorithm operation on BigInteger ----
function ModularExponentiation(hashedValue) {
    const x = bigInt(hashedValue, 16);
    const y = bigInt(g).modPow(x, p);
    return y.toString(16);
}

// ------ Q5 ------
// ---- 512-bits Prime Number Generator ----
function generatePubKeyElements() {
    const min = bigInt(2).pow(511);
    const max = bigInt(2).pow(512).minus(1);
    let p;
    let q;

    do {
        p = bigInt.randBetween(min, max);
    } while(!p.isPrime());
    do {
        q = bigInt.randBetween(min, max);
    } while(!q.isPrime());
    
    let n = p.multiply(q);
    let phi = p.minus(1).multiply(q.minus(1));
    return {p, q, n, phi};
}

// ------ Interaction ------
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
        pre.textContent = formatResultLong(phase, bitsToHex(result));
        output.appendChild(pre);
    }
});

document.getElementById("q3").addEventListener("submit", function(e) {
    e.preventDefault();
    const plainText = aesjs.utils.utf8.toBytes(document.getElementById("plainText").value);
    const key = aesjs.padding.pkcs7.pad(aesjs.utils.utf8.toBytes(document.getElementById("key").value)).slice(0, 16);
    const initVector = aesjs.padding.pkcs7.pad(aesjs.utils.utf8.toBytes(document.getElementById("iv").value)).slice(0, 16);

    const encryptionRes = Encrypt(plainText, key, initVector);
    const decryptionRes = aesjs.utils.utf8.fromBytes(Decrypt(encryptionRes, key, initVector));

    const kerberosPhase1Res = KerberosPhase1(key, initVector);
    const kerberosPhase2Res = KerberosPhase2(kerberosPhase1Res.ticket, key, initVector);

    const output = document.getElementById("output");
    output.innerHTML = "";

    const Q3_phases = [
        ["Encryption", encryptionRes],
        ["Decryption", decryptionRes],
        ["Phase1-Client to AS", kerberosPhase1Res.step1], 
        ["Phase1-AS to Client", kerberosPhase1Res.step2],
        ["Phase2-Client to Server", kerberosPhase2Res.step1],
        ["Phase2-Server to Client", kerberosPhase2Res.step2],
        ["Verification-Server verifying Client", "isClientAuthenticated: " + VerifyClient(kerberosPhase1Res.ticket, kerberosPhase2Res.step1.auth, initVector)],
        ["Verification-Client verifying Server", "isServerAuthenticated: " + VerifyServer(kerberosPhase2Res.step2.response, key, initVector)]
    ];

    for(let [phase, result] of Q3_phases) {
        let pre = document.createElement("pre");
        if(phase.includes("Phase")) {
            pre.textContent = formatResultJSON(phase, result);
        } else if(phase.includes("Verification")) {
            pre.textContent = formatResultShort(phase, result);
        } else {
            pre.textContent = formatResultLong(phase, result);
        }
        output.appendChild(pre);
    }
});

document.getElementById("q4").addEventListener("submit", function(e) {
    e.preventDefault();
    const randomValue = getRandom(16);
    const sha1HashRes = SHA1Hash(randomValue.toString(16));
    
    const exponentationRes = ModularExponentiation(SHA1Hash(sNumber));

    const randomA = getRandom(16);
    const randomB = getRandom(16);

    const A = SHA1Hash(randomA.toString(16) + vpcName);
    const B = SHA1Hash(randomB.toString(16) + dataCenterName);

    const exponentiationResA = ModularExponentiation(A);
    const exponentiationResB = ModularExponentiation(B);

    const GA = bigInt(exponentiationResA, 16);
    const GB = bigInt(exponentiationResB, 16);
    const secretKeyMinwoo = GB.modPow(bigInt(A, 16), p);
    const secretKeyTak = GA.modPow(bigInt(B, 16), p);

    const output = document.getElementById("output");
    output.innerHTML = "";

    const Q4_phases = [
        ["RandomValue", randomValue.toString(16)],
        ["HashResult", sha1HashRes],
        ["ModularExponentationResult", exponentationRes],
        ["randomValue-A", randomA.toString(16)],
        ["randomValue-B", randomB.toString(16)],
        ["randomValue-A-Hashed + vpcName", SHA1Hash(randomA.toString(16) + vpcName)],
        ["randomValue-B-Hashed + dataCenterName", SHA1Hash(randomB.toString(16) + dataCenterName)],
        ["ModularExponentiationResult-A", exponentiationResA],
        ["ModularExponentiationResult-B", exponentiationResB],
        ["DoesSecretKeysMatch?", (secretKeyMinwoo.toString(16) === secretKeyTak.toString(16))]
    ];

    for(let [phase, result] of Q4_phases) {
        let pre = document.createElement("pre");
        if(phase.includes("Modular")) {
            pre.textContent = formatResultLong(phase, result);
        } else {
            pre.textContent = formatResultShort(phase, result);
        }
        output.appendChild(pre);
    }
});

document.getElementById("q5").addEventListener("submit", function(e) {
    e.preventDefault();
    const sNumbersWithoutS = sNumber.replace(/\D/g, "");
    const largestPrime = PrimeFactorization(sNumbersWithoutS);
    const pubKeyElements = {p2, q2, n2, phi2};

    const output = document.getElementById("output");
    output.innerHTML = "";

    const Q5_phases = [
        ["LargestPrimeNumber", largestPrime],
        ["LargestPrimeNumberinHex", largestPrime.toString(16)],
        ["p", pubKeyElements.p2.toString(16)],
        ["q", pubKeyElements.q2.toString(16)],
        ["n", pubKeyElements.n2.toString(16)],
        ["phi", pubKeyElements.phi2.toString(16)],
        ["e", largestPrime.toString(16)],
        ["emailHex", bitsToHex(ASCIIfy(emailAddress))]
    ]

    for(let [phase, result] of Q5_phases) {
        let pre = document.createElement("pre");
        if(phase === "p" || phase === "q" || phase === "n" || phase === "phi") {
            pre.textContent = formatResultExtraLong(phase, result);
        } else {
            pre.textContent = formatResultShort(phase, result);
        }
        output.appendChild(pre);
    }
});

// ---- print ----
function formatState(phase, state) {
    let result = `${phase}\n`;
    for(let y of yOrder) {
        let row = " ";
        for(let x of xOrder) {
            row += state[x][y].toString(16).toUpperCase().padStart(2, '0') + " ";
        }
        result += row + "\n";
    }
    return result;
}

function formatResultLong(phase, result) {
    let res = `${phase}\n`;
    for(let i=0; i<result.length; i++) {
        if(i === result.length/2) {
            res += "\n";
        }
        res += result[i];
    }
    return res;
}

function formatResultShort(phase, result) {
    let res = `${phase}\n`;
    res += result;
    return res;
}

function formatResultJSON(phase, result) {
    let res = ` ${phase}\n`;
    res += JSON.stringify(result, null, 2);
    return res;
}

function formatResultExtraLong(phase, result) {
    let res = `${phase}\n`;
    for(let i=0; i<result.length; i++) {
        if(i !== 0 && i%40 === 0) {
            res += "\n";
        }
        res += result[i];
    }
    return res;
}