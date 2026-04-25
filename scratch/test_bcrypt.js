const bcrypt = require("bcryptjs");

async function test() {
    const pass = "password123";
    const hash = await bcrypt.hash(pass, 10);
    console.log("Hash:", hash);
    const match = await bcrypt.compare(pass, hash);
    console.log("Match:", match);
    const mismatch = await bcrypt.compare("wrong", hash);
    console.log("Mismatch (should be false):", mismatch);
}

test();
