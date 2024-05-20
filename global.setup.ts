import { FullConfig, chromium } from "@playwright/test";

//Global setup for creating a login cookie for all workers.
async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://eu.phrase-qa.com/");


  if (baseURL === "https://eu.phrase-qa.com" || baseURL === "https://eu.phrase-staging.com") {
    //set domain for cookies
    let domain;
    if (baseURL === "https://eu.phrase-qa.com") domain = ".phrase-qa.com";
    else domain = ".phrase-staging.com";

    //Avoid the cookies popup
    await context.addCookies([
      {
        name: "OptanonConsent",
        value:
          "isGpcEnabled=0&datestamp=Fri+Apr+14+2024+15%3A38%3A54+GMT%2B0200+(Central+European+Summer+Time)&version=202209.2.0&isIABGlobal=false&hosts=&consentId=c2ae798f-73be-4fb0-b64e-940943e3a199&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0004%3A1",
        domain: domain,
        path: "/", // Added the path attribute
        sameSite: "Lax",
      },
      {
        name: "OptanonAlertBoxClosed",
        value: "2023-05-22T13:58:33.325Z",
        domain: domain,
        path: "/", // Added the path attribute
        sameSite: "Lax",
      },
    ]);
    await page.goto("https://eu.phrase-qa.com");
    await page.waitForURL(baseURL + "/idm-ui/signin");
  }
  await await page.context().storageState({ path: storageState as string });
}

export default globalSetup;
