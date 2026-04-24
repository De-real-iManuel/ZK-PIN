const { buildPoseidon } = require("circomlibjs");
require("dotenv").config();

async function run() {
    const pin = parseInt(process.env.PIN);

    if (isNaN(pin) || pin < 0 || pin > 9999) {
        console.error("Error: Set a valid PIN (0-9999) in your .env file: PIN=1234");
        process.exit(1);
    }

    const poseidon = await buildPoseidon();
    const hash = poseidon([pin]);
    const hashString = poseidon.F.toObject(hash).toString();

    const input = {
        pin: pin.toString(),
        publicHash: hashString
    };

    console.log(JSON.stringify(input, null, 2));
    process.exit(0);
}

run();
