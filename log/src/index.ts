import { setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";

import { envsafe, num, str } from "envsafe";
import { ArtifactManager } from "./github/artifact";
import { Repo } from "./github/types";
import { StatusChecker } from "./status";
import { generateCoreLogger } from "./util";
import moment from "moment";
import { ReportFile, Status } from "./types";
import { stat } from "fs";

export const env = envsafe({
  SOURCES: str(),
  GITHUB_TOKEN: str(),
  JOB_NAME: str(),
  ARTIFACT_NAME: str({
    default: "report",
    desc: "Name of the artifact file name"
  }),
  AGE_LIMIT: num({
    default: 45,
    desc: "Limit age (in days) of how old can the timestamps be"
  })
});

const getRepo = (ctx: Context): Repo => {

  return ctx.repo;
};

const repo = getRepo(context);

setOutput("repo", `${repo.owner}/${repo.repo}`);

/**
 * Inputs must be in style of
 * ```log
 * site->https://example.com/health
 * site2->https://health.com
 * ```
 * 
 * The `->` is the delimeter between the site name and the url
 */
const sources = env.SOURCES.trim().split("\n").map((line) => line.split("->"));

const logger = generateCoreLogger();
logger.info("Job names is: " + env.JOB_NAME);
const run = async () => {

  const token = env.GITHUB_TOKEN;
  const api = getOctokit(token);
  const artifactManager = new ArtifactManager(api, logger, env.ARTIFACT_NAME);

  const artifact = await artifactManager.getPreviousArtifact(repo, env.JOB_NAME);
  logger.info(`Artifact: ${artifact}`);

  const siteResult: Map<string, ReportFile> = new Map();

  if (artifact) {
    const reports: Array<ReportFile> = JSON.parse(artifact);
    reports.forEach(report => {
      siteResult.set(report.name, report)
    });
  }

  // Run tests on each required source
  for (const [name, url] of sources) {
    // TODO: Check if name already exists
    const statusChecker = new StatusChecker(name, url, logger);
    const result = await statusChecker.verifyEndpoint();

    // Create if it doesn't exist
    if (!siteResult.has(name)) {
      siteResult.set(name, { name, status: [] });
    }

    // We push the value to the status array
    siteResult.get(name)?.status.push({ timestamp: new Date().getTime(), result });
  }

  // TODO: Remove things older than X days
  for (let [name, status] of siteResult) {

    // Clean old timestamp reports
    const cleanedStatus = status.status.filter(({ timestamp }) => Math.abs(moment.unix(timestamp).diff(moment.now(), "days")) < env.AGE_LIMIT);

    if (cleanedStatus.length === 0) {
      // We delete empty entries
      siteResult.delete(name);
    } else {
      siteResult.set(name, { name, status: cleanedStatus });
    }
  }

  await artifactManager.generateArtifact(Array.from(siteResult.values()));
}

run().catch(setFailed);
