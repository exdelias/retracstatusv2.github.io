import { StatusChecker } from "../status";

const sites:Array<[string,string]> = [
  ["GitHub", "https://github.com"],
  ["Facebook", "https://facebook.com"],
  ["Google", "https://google.com"]
]

for(const [site,url] of sites) {
  test(`Test obtaining metrics from ${site}`, async () => {
    const statusChecker = new StatusChecker(site, url, console);
    await expect(statusChecker.verifyEndpoint()).resolves.toBe(true);
  })
}
