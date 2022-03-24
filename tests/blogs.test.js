const { expect } = require("chai");
const { describe } = require("eslint/lib/rule-tester/rule-tester");
const { get } = require("http");
const { test } = require("ramda");
const Page = require("./helpers/page");

let page = undefined;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  try {
    // await page.close();
  } catch (e) {}
});

describe("When Not logged in", async () => {
  const actions = [
    {
      method: "get",
      path: "https://localhost:3000/api/blogs/",
    },
    {
      method: "post",
      path: "https://localhost:3000/api/blogs/",
      data: { title: "T", content: "C" },
    },
  ];

  test("Blog related actions are prohibited", async () => {
    const results = await page.execRequest(actions);
    for (let result of results) {
      expect(result).toEqual({ error: "You must log in" });
    }
  });
});

describe("When logged in ", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("can see blog create form", async () => {
    const label = await page.getContentsOf("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("And using valid inputs", async () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const text = await page.getContentsOf("h5");
      expect(text).toEqual("Please confirm your entries");
    });

    test("Submitting then saving add blog to index page", async () => {
      await page.click("button.green");
      await page.waitFor(".card");

      const title = await page.getContentsOf(".card-title");
      const content = await page.getContentsOf("p");

      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
  });

  describe("And using invalid inputs", async () => {
    beforeEach(async () => {
      //No info given to inputs
      await page.click("form button");
    });
    test("the form shows an error message", async () => {
      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");
      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});