const ogs = require('open-graph-scraper');

async function test() {
  const options = { url: 'https://www.coderaxo.dev/', timeout: 5000 };
  const { result, error } = await ogs(options);
  console.log({ result, error });
}

test();
