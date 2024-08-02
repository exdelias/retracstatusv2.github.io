import { GitHubClient, ActionLogger, Repo } from "./types";
import { writeFile } from "fs/promises";
import { execSync } from "child_process";
const artifactName = "REPORT.json";

export class ArtifactManager {
  constructor(
    private readonly api: GitHubClient,
    private readonly logger: ActionLogger,
  ) { }

  async getPreviousArtifact(repo: Repo): Promise<string | null> {
    const workflows = await this.api.rest.actions.listRepoWorkflows(repo);

    const workflow = workflows.data.workflows.find(w => w.path.includes(process.env.WORKFLOW_FILENAME ?? ""));

    if (!workflow) {
      this.logger.error("No workflow file found");
      return null;
    }

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

    for (const run of runs.data.workflow_runs) {
      const artifacts = await this.api.rest.actions.listWorkflowRunArtifacts({
        ...repo,
        run_id: run.id
      });

      const artifact = artifacts.data.artifacts.find(artifact => artifact.name === artifactName);

      if (artifact) {
        const response = await this.api.rest.actions.downloadArtifact({
          ...repo,
          artifact_id: artifact.id,
          archive_format: "zip"
        });
        await writeFile(artifactName, Buffer.from(response.data as string));
        execSync(`unzip -o ${artifactName} -d ./logs`);

        this.logger.info("Artifact downloaded correctly");

      }
      return `./logs/${artifactName}`;
    }
  }


  generateArtifact(reports: Array<[string, boolean]>) {
    const file: Array<{
      name: string, status: Array<{
        result: number;
        timestamp: number;
      }>
    }> = [];
    for (const [name, result] of reports) {
      const metric: {
        name: string, status: Array<{
          result: number;
          timestamp: number;
        }>
      } = { name, status: [{ result: result ? 0 : 1, timestamp: new Date().getTime() }] };
      file.push(metric);
    }

    return writeFile("report.json", JSON.stringify(file));
  }
}
