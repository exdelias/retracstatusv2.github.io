import { setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";

import { envsafe, num, str } from "envsafe";
import moment from "moment";
import { ArtifactManager } from "./github/artifact";
import { Repo } from "./github/types";
import { StatusChecker } from "./status";
import { ReportFile } from "./types";
import { generateCoreLogger } from "./util";

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
const run = async () => {

  const token = env.GITHUB_TOKEN;
  const api = getOctokit(token);
  const artifactManager = new ArtifactManager(api, logger, env.ARTIFACT_NAME);

  const artifact = await artifactManager.getPreviousArtifact(repo, env.JOB_NAME);
  logger.info(`Found artifact with ${artifact?.length} elements`);

  const siteResult: Map<string, ReportFile> = new Map();

  if (artifact) {
    logger.info(`Mapping old report`);
    artifact.forEach(report => {
      siteResult.set(report.name, report)
    });
  }

  const now = moment().unix();

  // Run tests on each required source
  for (const [name, url] of sources) {
    const statusChecker = new StatusChecker(name, url, logger);
    const result = await statusChecker.verifyEndpoint();

    let report = siteResult.get(name);

    // Create report if it doesn't exist
    if (!report) {
      report = { name, status: [] };
    }

    // We push the value to the status array
    report.status.push({ timestamp: now, result });
    siteResult.set(name, report);
  }

  for (const [name, report] of siteResult) {
    const beforeCleanLength = report.status.length;
    // Clean old timestamp reports
    const cleanedStatus = report.status.filter(({ timestamp }) => Math.abs(moment.unix(timestamp).diff(moment.now(), "days")) < env.AGE_LIMIT);

    if (cleanedStatus.length !== beforeCleanLength) {
      logger.debug(`Removed ${beforeCleanLength - cleanedStatus.length} elements from '${name}'`);
    }

    if (cleanedStatus.length === 0) {
      // We delete empty entries
      siteResult.delete(name);
      logger.info(`Deleted report for '${name}' because it's empty`)
    } else {
      logger.info(`'${name}' status has ${cleanedStatus.length} status`);
      siteResult.set(name, { name, status: cleanedStatus });
    }
  }

  const file = await artifactManager.generateArtifact(Array.from(siteResult.values()));
  setOutput("file", file);
}

run().catch(setFailed);
