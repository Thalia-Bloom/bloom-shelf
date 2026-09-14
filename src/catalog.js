export const VERSION = '1.3.0';
export const SELLER = 'Bloom Web Services LLC';
export const SUPPORT = 'support@thaliabloom.com';

export const SKUS = {
  'one-job-price-check': {
    slug: 'one-job-price-check',
    name: 'Handyman One-Job Price Check',
    tagline: 'One finished job. One clearer next price.',
    price_cents: 700,
    project_id: 'shelf-one-job-v1',
    zip_filename: 'Handyman-One-Job-Price-Check.zip',
    zip_path: '/assets/one-job-price-check.zip',
    description: 'Enter one finished job. See what it paid per working hour and get a transparent starting reference for a similar job. Hands-on time is only part of the work. Travel, shopping, estimates, admin, materials, helper wages, and overhead all count too.',
    contains: [
      'Handyman One-Job Price Check.xlsx',
      'A three-page quick-start PDF',
      'A clean Price Check sheet, a worked example, and plain-language limits',
    ],
    steps: [
      'Open Price Check and enter one finished job in the green cells.',
      'Count hands-on work, travel, shopping, estimating, scheduling, and invoicing.',
      'Read owner earnings per working hour and the starting reference.',
      'Check scope, risk, access, licensing, local demand, and customer fit before using the reference.',
    ],
    for_who: [
      'You are a solo handyman or small residential contractor.',
      'You have at least one finished job.',
      'You still price similar work from memory or instinct.',
      'You want to see every input behind the result.',
    ],
    not_for: [
      'You have no completed work yet.',
      'You need estimating software for a multi-crew company.',
      'You need a market price list or automatic customer quote.',
      'You need tax, accounting, legal, licensing, or financial advice.',
    ],
    limits: 'Results depend entirely on the numbers you enter. The starting reference covers your chosen owner-pay target, allocated overhead, direct costs, and uncertainty buffer. It does not include a profit margin after owner pay. The workbook cannot know local demand, hidden damage, access, schedule pressure, licensing, job risk, callbacks, taxes, customer fit, or what a customer will accept. No income, profit, price, or customer acceptance is guaranteed.',
  },
  'scope-change-sheet': {
    slug: 'scope-change-sheet',
    name: 'Handyman Scope + Change Sheet',
    tagline: 'Write the job. Record the change.',
    price_cents: 700,
    project_id: 'shelf-scope-change-v1',
    zip_filename: 'Handyman-Scope-Change-Sheet.zip',
    zip_path: '/assets/scope-change-sheet.zip',
    description: 'Small jobs get messy when the details live across a text thread, a quick phone call, and memory. This kit gives you one page for the job you agreed to do and one page for what changed after work started.',
    contains: [
      'An editable two-page Word file',
      'A print-ready PDF',
      'A fictional worked example',
      'A two-page quick-start guide',
    ],
    steps: [
      'Fill the Job Scope Sheet before work starts.',
      'Name what is included, excluded, and supplied by each person.',
      'Record assumptions, cleanup, price reference, and schedule window.',
      'If the job changes, pause when practical and fill one Change Note, including how the customer approved, declined, or asked you to pause.',
    ],
    for_who: [
      'You are a solo handyman or small residential contractor.',
      'You quote small jobs by text, email, document, or invoice software.',
      'Customers sometimes add work after you arrive.',
      'You want a cleaner record without buying a field-service app.',
    ],
    not_for: [
      'You need a state-specific legal contract.',
      'You need signatures, payments, scheduling, or customer messages automated.',
      'You run complex multi-crew construction projects.',
      'You need legal, tax, insurance, licensing, or safety advice.',
    ],
    limits: 'This kit is an operating record, not legal advice or a guaranteed contract. It does not guarantee customer approval, payment, fewer disputes, or job profit. Use your attorney, insurer, licensing board, and local rules when a formal contract, notice, permit, or specific wording is required.',
  },
  'gbp-visibility-kit': {
    slug: 'gbp-visibility-kit',
    name: 'Google Business Profile DIY Visibility Kit',
    tagline: 'Score your listing. Fix what you can see.',
    price_cents: 1900,
    project_id: 'shelf-gbp-diy-v1',
    zip_filename: 'GBP-DIY-Visibility-Kit.zip',
    zip_path: '/assets/gbp-visibility-kit.zip',
    description: 'A self-serve pack for scoring your own Google Business Profile from the public listing, then fixing the gaps you can edit. Categories, photos, hours, posts, Q&A, and a review-ask you send yourself. Nobody logs into your account. Nobody promises a Maps rank.',
    contains: [
      'A public-listing scorecard (CSV) and scoring rubric',
      'A DIY cleanup checklist and photo plan',
      'Review-ask, Q&A, and Google post templates',
      'A fictional worked example and a printable PDF of the kit',
    ],
    steps: [
      'Score your public listing with the rubric. Do not guess at private settings you cannot see.',
      'Write the three concrete gaps on the scorecard.',
      'Fix what you own: categories, services, description, hours, photos, posts, Q&A.',
      'Send the review-ask only to real past customers. Do not gate, buy, or invent reviews.',
    ],
    for_who: [
      'You own or operate a local service business.',
      'You can edit your own Google Business Profile.',
      'You want a written checklist, not another agency pitch.',
    ],
    not_for: [
      'You want someone else to log in and post for you.',
      'You want a guaranteed Maps rank, lead volume, or review count.',
      'You want a white-label agency report.',
    ],
    limits: 'This kit does not access your Google account, post on your behalf, or change your listing. Rankings, reviews, and leads depend on facts Google and customers already see, plus competitors you do not control. Fill templates only with true information about your business.',
  },
  'cleaning-quote-kit': {
    slug: 'cleaning-quote-kit',
    name: 'Post-Construction Cleaning Quote Kit',
    tagline: 'Turn a first commercial clean into a written number.',
    price_cents: 900,
    project_id: 'shelf-cleaning-quote-v1',
    zip_filename: 'Post-Construction-Cleaning-Quote-Kit.zip',
    zip_path: '/assets/cleaning-quote-kit.zip',
    description: 'A workbook for a residential cleaner with a first commercial post-construction lead. You type the square footage, crew, the labor rate you will actually quote, debris, restrooms, windows, and extras. The sheet shows the total, dollars per square foot, and dollars per labor hour after overhead. It does not pick the rate for you and it does not walk the building.',
    contains: [
      'An Excel/Sheets-friendly quote workbook with a worked fictional example',
      'A site-walk checklist and a scope/exclusions template',
      'A limits page and a printable PDF of the written parts',
    ],
    steps: [
      'Walk the site with the checklist. Write what is included and who supplies dumpsters, water, power, and insurance.',
      'Enter your rate, hours, and extras in the green cells.',
      'Read the total and the two check figures. If they look too low to stay in business, change the rate or the hours on purpose.',
      'Send the number with the walk sheet. Do not send only a total.',
    ],
    for_who: [
      'You run a residential cleaning business and have a real commercial post-construction lead.',
      'You can visit the building before you quote.',
      'You want a written number from your own rate, not a published market list.',
    ],
    not_for: [
      'You need a prevailing-wage table or janitorial estimating software.',
      'You will not walk the site.',
      'You need legal, insurance, or licensing advice.',
    ],
    limits: 'This is a calculator, not a bid service and not a market price list. It cannot see hidden construction dust, union rules, after-hours premiums, or what a general contractor will pay. No job, income, or customer acceptance is guaranteed.',
  },
  'sewing-test-square-pack': {
    slug: 'sewing-test-square-pack',
    name: 'Sewing Print-Scale Test Square Pack',
    tagline: 'Print the square. Measure it. Then cut.',
    price_cents: 300,
    project_id: 'shelf-sewing-squares-v1',
    zip_filename: 'Sewing-Print-Scale-Test-Square-Pack.zip',
    zip_path: '/assets/sewing-test-square-pack.zip',
    description: 'Four printable test squares: 4 inch and 10 cm, on US Letter and A4. Print at 100 percent, turn off fit-to-page, and measure the box with a hard ruler before you cut fabric. This is a standalone scale check when a PDF pattern’s square is missing or hard to find.',
    contains: [
      'Letter 4-inch and 10 cm squares',
      'A4 4-inch and 10 cm squares',
      'A how-to for printer settings and measuring',
    ],
    steps: [
      'Pick the paper size that is actually in the printer.',
      'Print at 100 percent / actual size. Turn off fit-to-page and shrink-to-fit.',
      'Measure the printed box, not the page.',
      'If the box is not exact, reprint before you cut.',
    ],
    for_who: [
      'You bought a PDF sewing pattern and need a test square.',
      'You have a ruler and a printer you can set to 100 percent.',
    ],
    not_for: [
      'You will print with “fit to page” turned on.',
      'You need a sewing pattern, a tiled-page joiner, or a grading tool.',
    ],
    limits: 'These files are not a sewing pattern and not a substitute for a pattern company’s own test square if they provided one. They do not guarantee garment fit. If the printed box is the wrong size, the rest of the pattern will be too.',
  },
  'creator-clip-pack': {
    slug: 'creator-clip-pack',
    name: 'Creator Clip Shot-List + Caption Pack',
    tagline: 'Recut what you already filmed. Write the captions on the picture.',
    price_cents: 1200,
    project_id: 'shelf-creator-clip-v1',
    zip_filename: 'Creator-Clip-Shot-List-Pack.zip',
    zip_path: '/assets/creator-clip-pack.zip',
    description: 'Worksheets for a shorter cut of a video you already have: a recut checklist, a shot list with in/out times, on-screen caption lines, and a one-transcript-per-upload rule. You still cut and export in your own editor. This pack does not render captions or publish anything.',
    contains: [
      'A recut checklist and a fill-in shot list',
      'A caption template and a one-transcript-per-upload note',
      'A fictional worked example and a printable PDF',
    ],
    steps: [
      'Note the source runtime and pick a target length.',
      'Mark keep and cut on the shot list with in/out times.',
      'Write one caption line that matches the picture for each keep.',
      'Export one transcript/caption file per published clip.',
    ],
    for_who: [
      'You already have a long video.',
      'You want a shorter cut with captions that sit on the picture.',
      'You have an editor you already use.',
    ],
    not_for: [
      'You need software to cut or caption for you.',
      'You want a follower, view, or revenue guarantee.',
    ],
    limits: 'This is paper, not an editor and not auto-captions. It does not upload, schedule, or remember brand decisions. No views, followers, or income are guaranteed.',
  },
  'furniture-pickup-sheet': {
    slug: 'furniture-pickup-sheet',
    name: 'Furniture Pickup Go/No-Go Sheet',
    tagline: 'One pickup. One keep-or-walk decision.',
    price_cents: 700,
    project_id: 'shelf-furniture-pickup-v1',
    zip_filename: 'Furniture-Pickup-Go-No-Go-Sheet.zip',
    zip_path: '/assets/furniture-pickup-sheet.zip',
    description: 'You found one dresser or chair on a curb or a Marketplace listing. Type asking price, repairs you can see, hours, fuel, fees, and your resale guess. The sheet shows money left, implied hourly, and GO / CAUTION / NO-GO. It does not know what it will sell for.',
    contains: [
      'An Excel pickup sheet with a Limits tab',
      'A photo and measure checklist',
      'A printable PDF of the written parts',
    ],
    steps: [
      'Measure the piece against the vehicle and the doorway before you drive.',
      'Fill the green cells. Expected resale is your guess.',
      'If pests or smoke is yes, the sheet says NO-GO. That is a safety call, not a bargain.',
      'Walk if the photos look worse in person.',
    ],
    for_who: [
      'You flip one piece at a time from a curb or Marketplace.',
      'You want a keep-or-walk call before you spend the afternoon.',
    ],
    not_for: [
      'You want software to price every piece in a warehouse.',
      'You want someone else to inspect, haul, or list it.',
    ],
    limits: 'This is not an appraisal, not comps, and not a listing bot. Expected resale is the number you typed. No sale, profit, or pickup is guaranteed.',
  },
  'coding-tool-decision-sheet': {
    slug: 'coding-tool-decision-sheet',
    name: 'Claude vs Codex vs Cursor Decision Worksheet',
    tagline: 'Write down what you already pay. Then pick.',
    price_cents: 500,
    project_id: 'shelf-coding-decision-v1',
    zip_filename: 'Coding-Tool-Decision-Worksheet.zip',
    zip_path: '/assets/coding-tool-decision-sheet.zip',
    description: 'A fill-in worksheet for someone already paying for two of Claude, Codex, and Cursor. You write the plans you actually pay for, what you opened this week, and which limits you hit. It does not rank the tools. If you only need Codex and CodexBar already works, skip Usage HUD.',
    contains: [
      'Tables for spend, last-7-days use, limits, and must-haves',
      'A keep / cancel / wait-30-days line',
      'A fictional filled example and a printable PDF',
    ],
    steps: [
      'Copy last month’s charges into the pay table. Use real dollars.',
      'Guess the last 7 days of what you actually opened.',
      'Mark limits you hit. “I don’t know” is allowed.',
      'Fill the decision line before you cancel anything.',
    ],
    for_who: [
      'You already pay for at least two of Claude, Codex, and Cursor.',
      'You want a keep/cancel note in your own handwriting.',
    ],
    not_for: [
      'You want a benchmark or a ranked winner.',
      'You want a usage meter or someone else to cancel a plan.',
    ],
    limits: 'Not a benchmark, not a review, not a usage meter. Tool prices and limits change. No savings are guaranteed. This worksheet does not replace CodexBar or Usage HUD.',
  },
};

export function skuList() {
  return Object.values(SKUS);
}

export function getSku(slug) {
  return SKUS[slug] || null;
}

export function priceLabel(cents) {
  return `$${(Number(cents) / 100).toFixed(0)}`;
}
