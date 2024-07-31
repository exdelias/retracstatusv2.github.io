import { getInput, info, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { PullRequest } from "@octokit/webhooks-types";

import { PullRequestApi } from "./github/pullRequest";
import { generateCoreLogger } from "./util";
import { Repo } from "./github/types";

const getRepo = (ctx: Context):Repo => {

  return ctx.repo;
};

const repo = getRepo(context);

setOutput("repo", `${repo.owner}/${repo.repo}`);
