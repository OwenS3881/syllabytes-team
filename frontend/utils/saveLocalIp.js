// saveLocalIP.js
const os = require("os");
const fs = require("fs");
const path = require("path");

// Get network interfaces
const interfaces = os.networkInterfaces();

// Find the first non-internal IPv4 address
let localIP = null;
for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
            localIP = iface.address;
            break;
        }
    }
    if (localIP) break;
}

// If no IP found
if (!localIP) {
    console.error("Could not find local IP address.");
    process.exit(1);
}

// Create JS file content
const output = `// Auto-generated file
export const LOCAL_IP = "${localIP}";
`;

// Define output path (you can change this)
const filePath = path.join(__dirname, "../constants/localIP.js");

// Write to file
fs.writeFileSync(filePath, output, "utf8");
console.log(`Local IP (${localIP}) saved to ${filePath}`);
