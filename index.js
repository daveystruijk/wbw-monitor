const puppeteer = require('puppeteer');
const config = require('./config');
require('console-stamp')(console, 'yyyy-mm-dd HH:MM:ss');

const baseUrl = 'https://wiebetaaltwat.nl';
const listId = config.list;
const checkFrequency = 30; // seconds

async function sleep(ms = 0) {
  return new Promise(r => setTimeout(r, ms));
}

async function checkForNewEntries(page) {
  // Navigate to list
  await page.goto(`${baseUrl}/lists/${listId}/expenses?order=desc&sort=payed_on`, {
    waitUntil: 'networkidle2',
  });

  // Find entries that need to be edited
  const links = await page.evaluate(() => {
    function getText(node) {
      text = node.childNodes[0].nodeValue;
      return text.trim();
    }
    const trSelector = 'tbody tr';
    const rows = Array.from(document.querySelectorAll(trSelector));
    return rows.map(row => {
      const name = getText(row.querySelector('.expense-name'))
      const people = getText(row.querySelector('.expense-participants'))
      if (name.toLowerCase().includes('brood') && people.includes('Davey')) {
        return row.getAttribute('href');
      } else {
        return null;
      }
    }).filter(url => {
      return url !== null;
    });
  });

  // Edit entries
  for (let link of links) {
    if (link === undefined) { return; }
    console.log(link);
    await page.goto(baseUrl + link, {waitUntil: 'networkidle2'});
    peopleSelector = 'div.participants';
    await page.waitForSelector(peopleSelector);
    const names = await page.evaluate(() => {
      function getText(node) {
        text = node.childNodes[0].nodeValue;
        return text.trim();
      }
      names = Array.from(document.querySelectorAll('.participants .participants-name'));
      names.map(name => {
        if (getText(name) === 'Davey') {
          const item = name.closest('.participants-item');
          const minusBtn = item.querySelector('.btn.minus');
          minusBtn.click();
        }
      });
    });
    await page.click('button.button.ng-binding');
    await sleep(5000);
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  // Login
  await page.goto(`${baseUrl}/login`, {waitUntil: 'networkidle2'});
  await page.type('input[type="email"]', config.username);
  await page.type('input[type="password"]', config.password);
  await page.click('form.form button');
  await page.waitForSelector('table.ng-scope');

  while (1) {
    console.log('Checking...');
    await checkForNewEntries(page);
    await sleep(checkFrequency * 1000);
  }

  await browser.close();
})();

