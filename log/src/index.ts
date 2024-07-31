import { getInput, info, setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { PullRequest } from "@octokit/webhooks-types";

import { generateCoreLogger } from "./util";
import { Repo } from "./github/types";
import { StatusChecker } from "./status";
import { envsafe, str } from "envsafe";

export const env = envsafe({
  SOURCES: str(),
  GITHUB_TOKEN: str(),
});

const getRepo = (ctx: Context):Repo => {

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
  const o = getOctokit(token);

  const siteResult:Array<[string,boolean]> = [];
  for(const [name,url] of sources) {
    const statusChecker = new StatusChecker(name, url, logger);
    const result = await statusChecker.verifyEndpoint();
    siteResult.push([name, result]);
  }
}

run().catch(setFailed);
