export const VERSION = '1.0.0';
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
