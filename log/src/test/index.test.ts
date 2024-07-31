import { ArtifactManager } from "../github/artifact";
import { GitHubClient } from "../github/types";
import { StatusChecker } from "../status";

const sites: Array<[string, string]> = [
  ["GitHub", "https://github.com"],
  ["Facebook", "https://facebook.com"],
  ["Google", "https://google.com"]
]

for (const [site, url] of sites) {
  test(`Test obtaining metrics from ${site}`, async () => {
    const statusChecker = new StatusChecker(site, url, console);
    await expect(statusChecker.verifyEndpoint()).resolves.toBe(true);
  })
}

test("Write to doc", async () => {
  const siteResult: Array<[string, boolean]> = [];

  for (const [site, url] of sites) {
    const statusChecker = new StatusChecker(site, url, console);
    siteResult.push([site, await statusChecker.verifyEndpoint()]);
  }
  const am = new ArtifactManager(null as unknown as GitHubClient, console);
  await am.generateArtifact(siteResult);
})
