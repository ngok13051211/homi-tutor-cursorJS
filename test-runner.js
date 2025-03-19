/**
 * Helper script to run tests and handle errors
 * This can be useful when encountering issues with running Jest directly
 */

const { spawn } = require("child_process");
const path = require("path");

console.log("Running tests...");

// Get Jest binary path
const jestPath = path.join(__dirname, "node_modules", ".bin", "jest");

// Run Jest with --forceExit flag
const jest = spawn(jestPath, ["--forceExit"], {
  stdio: "inherit", // Forward stdout/stderr to this process
  shell: true, // Use shell on Windows
});

jest.on("error", (error) => {
  console.error("Failed to start Jest:", error.message);
  process.exit(1);
});

jest.on("close", (code) => {
  console.log(`Jest process exited with code ${code}`);
  process.exit(code);
});
