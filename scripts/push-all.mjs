import { execSync } from "node:child_process";

const name = "georgehuntuk-droid";
const email = "georgehuntuk-droid@users.noreply.github.com";
const message = "feat: implement bulk lesson packages credits and complimentary billing upgrades";

try {
  console.log("Configuring git user...");
  execSync(`git config user.name "${name}"`, { stdio: "inherit" });
  execSync(`git config user.email "${email}"`, { stdio: "inherit" });

  console.log("Adding changes...");
  execSync("git add .", { stdio: "inherit" });

  console.log("Committing changes...");
  execSync(`git commit -m "${message}"`, { stdio: "inherit" });

  console.log("Pushing changes to GitHub...");
  execSync("git push", { stdio: "inherit" });

  console.log("Push completed successfully!");
} catch (error) {
  console.error("An error occurred during git operations:", error.message);
}
