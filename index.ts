import dotenv from "dotenv";
import {
  DEVPOOL_OWNER_NAME,
  DEVPOOL_REPO_NAME,
  getAllIssues,
  getIssueByLabel,
  getProjectUrls,
  getRepoCredentials,
  GitHubIssue,
  checkIfForked,
  calculateStatistics,
  writeTotalRewardsToGithub,
  handleDevPoolIssue,
  createDevPoolIssue,
} from "./helpers/github";
import { readFile, writeFile } from "fs/promises";
import { Statistics } from "./types/statistics";
// init octokit
dotenv.config();

export type TwitterMap = Record<string, string>;

/**
 * Main function
 * TODO: retry on rate limit error
 * TODO: handle project deletion
 */
async function main() {
  let twitterMap: TwitterMap = {};
  try {
    twitterMap = JSON.parse(await readFile("./twitterMap.json", "utf8"));
  } catch (error) {
    console.log("Couldnt find twitter map artifact, creating a new one");
    await writeFile("./twitterMap.json", JSON.stringify({}));
  }

  // get devpool issues
  const devpoolIssues: GitHubIssue[] = await getAllIssues(DEVPOOL_OWNER_NAME, DEVPOOL_REPO_NAME);

  // aggregate projects.urls and opt settings
  const projectUrls = await getProjectUrls();

  // aggregate all project issues
  const allProjectIssues: GitHubIssue[] = [];

  const isFork = await checkIfForked(DEVPOOL_OWNER_NAME);
  // get all project issues (opened and closed)
  const projectIssues: GitHubIssue[] = await getAllIssues(DEVPOOL_OWNER_NAME, DEVPOOL_REPO_NAME);
  // aggregate all project issues
  allProjectIssues.push(...projectIssues);
  // for all issues
  for (const projectIssue of projectIssues) {
    // if issue exists in devpool
    const devpoolIssue = projectIssue;

    // adding www creates a link to an issue that does not count as a mention
    // helps with preventing a mention in partner's repo especially during testing
    const body = isFork ? projectIssue.html_url.replace("https://github.com", "https://www.github.com") : projectIssue.html_url;
    await handleDevPoolIssue(projectIssues, projectIssue, projectUrl, devpoolIssue, isFork);
  }
}

void (async () => {
  await main();
})();

// Expose the main only for testing purposes
if (process.env.NODE_ENV === "test") {
  exports.main = main;
}
