import { execSync } from "child_process";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { ReportFile } from "../types";
import { ActionLogger, GitHubClient, Repo } from "./types";

export class ArtifactManager {
  constructor(
    private readonly api: GitHubClient,
    private readonly logger: ActionLogger,
    private readonly artifactName: string,
  ) { }

  /**
   * Search on the previous GitHub runs for the artifacts and it tries to find a matching one.
   * If it does, it downloads it and parses the content. If not, it returns null
   */
  async getPreviousArtifact(repo: Repo, workflowName: string): Promise<Array<ReportFile> | null> {
    this.logger.info(`Looking for previous artifact for workflow: '${workflowName}'`);
    const workflows = await this.api.rest.actions.listRepoWorkflows(repo);

    this.logger.info("Available workflows: " + JSON.stringify(workflows.data.workflows.map(w => w?.name)));
    const workflow = workflows.data.workflows.find(w => w.name === workflowName);

    if (!workflow) {
      this.logger.error(`No workflow file found matching ${workflowName}`);
      return null;
    }

    this.logger.info(`Found workflow for ${workflow.name}`);

    const runs = await this.api.rest.actions.listWorkflowRuns({
      ...repo,
      workflow_id: workflow.id,
      status: "success",
      per_page: 1
    });

    if (runs.data.total_count === 0) {
      this.logger.error("No runs detected. Is this the first run?");
      return null;
    }

    this.logger.info(`Found ${runs.data.total_count} runs: ${JSON.stringify(runs.data.workflow_runs.map(w => w.run_started_at))}`)

    for (const run of runs.data.workflow_runs) {
      this.logger.info(`Searching for artifact in ${run.name}: ${run.id} - ${run.run_started_at}`);
      const artifacts = await this.api.rest.actions.listWorkflowRunArtifacts({
        ...repo,
        run_id: run.id
      });

      this.logger.info(`Found the following ${artifacts.data.total_count} artifacts: ${artifacts.data.artifacts.map(a => a.name)}`);

      this.logger.info(`Searching for artifact named ${this.artifactName}`);

      const artifact = artifacts.data.artifacts.find(artifact => artifact.name === this.artifactName);

      if (!artifact) {
        this.logger.info(`Found no artifact in ${run.name}: ${run.id} named ${this.artifactName}`);
        this.logger.debug(`Available artifacts ${artifacts.data.artifacts.map(a => a.name)}`);
        return null;
      }

      const response = await this.api.rest.actions.downloadArtifact({
        ...repo,
        artifact_id: artifact.id,
        archive_format: "zip"
      });
      await writeFile(`${this.artifactName}.zip`, Buffer.from(response.data as string));
      execSync(`unzip -o ${this.artifactName}.zip -d ./logs`);

      this.logger.info("Artifact downloaded correctly");

      const artifactLocation = resolve(`./logs/${this.artifactName}.json`);
      this.logger.info("Artifact downloaded to " + artifactLocation);

      const fileContent = await readFile(artifactLocation, "utf-8");
      this.logger.debug(`Old artifact: ${fileContent}`);
      try {
        const parsedFile: ReportFile[] = JSON.parse(fileContent);
        if (parsedFile.length > 0) {
          return parsedFile;
        }
      } catch (err) {
        this.logger.warn("Couldn't read file");
        this.logger.error(err as Error);
      }
    }
    return null;
  }


  /**
   * Writes the content of the array to a file and returns the file's location
   * @param reports the reports to be stringified
   * @returns The location of the file
   */
  async generateArtifact(reports: Array<ReportFile>): Promise<string> {
    const reportContent = JSON.stringify(reports);
    const location = resolve(`${this.artifactName}.json`);
    this.logger.debug(`Writing to ${location} the content of file ${reportContent}`);
    await writeFile(location, reportContent);
    return location;
  }
}

