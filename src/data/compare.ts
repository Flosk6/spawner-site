/**
 * The comparison page (/compare/): Spawner next to the other ways to get
 * preview environments, criterion by criterion, and the sources of every
 * statement about another tool. Spawner's answers hold for the release
 * named below, checked in its code; the others hold for the day the page
 * was checked, from each tool's own documentation. Cells use one mark of
 * Markdown, `code`.
 */
import { LICENSE_URL } from '../lib/site.ts';

/** When the page was last checked against every source. */
export const CHECKED = { iso: '2026-10-09', text: '9 October 2026' };

/** The release of Spawner the page describes. */
export const SPAWNER_VERSION = '2.1.0';

export const TITLE = 'Self-hosted preview environments: Spawner and the alternatives';

export const HEADING = 'Spawner and the alternatives for preview environments';

export const DESCRIPTION =
  'How Spawner compares with Coolify and Dokploy previews, Preevy, PullPreview, Uffizzi, Vercel, Render, Railway, Heroku review apps and Kubernetes platforms.';

export type CriterionId =
  | 'runs'
  | 'kubernetes'
  | 'compose'
  | 'pullRequests'
  | 'worktree'
  | 'protected'
  | 'policy'
  | 'sleep'
  | 'agents'
  | 'license'
  | 'price';

/** The questions that decide a choice, in the order of the tables' rows. */
export const CRITERIA: { id: CriterionId; label: string }[] = [
  { id: 'runs', label: 'Where it runs' },
  { id: 'kubernetes', label: 'Needs Kubernetes' },
  { id: 'compose', label: 'Starts from a Docker Compose file' },
  { id: 'pullRequests', label: 'A preview per pull request, built in' },
  { id: 'worktree', label: 'A preview from a local worktree, uncommitted changes included' },
  { id: 'protected', label: 'Previews protected by default' },
  { id: 'policy', label: 'Security policy on the compose file' },
  { id: 'sleep', label: 'Sleep and wake' },
  { id: 'agents', label: 'CLI and MCP server for coding agents' },
  { id: 'license', label: 'License' },
  { id: 'price', label: 'Price model' },
];

export interface Tool {
  name: string;
  cells: Record<CriterionId, string>;
}

/** Spawner's column, the first of every table: each answer checked in the code of 2.1.0. */
export const SPAWNER: Tool = {
  name: 'Spawner',
  cells: {
    runs: 'One Linux server of yours, dedicated to previews',
    kubernetes: 'No',
    compose: 'Yes: `.spawner/` holds a manifest and a Compose file',
    pullRequests: 'From CI: a job runs `spawner up`, then `spawner down`',
    worktree: 'Yes: `spawner up` sends the files git sees, uncommitted ones included',
    protected: 'Yes: team login, a token for agents, share links for guests',
    policy: 'Yes: an allowlist, checked before Docker runs the file',
    sleep: 'Yes: after 2 hours without activity; the team’s next visit wakes it',
    agents: 'Yes: a CLI with JSON output and stable exit codes, an MCP server with 9 tools',
    license: 'Apache-2.0',
    price: 'Free; you pay for the server',
  },
};

/** A family of tools, shown in one table after Spawner's column. */
export interface Group {
  /** The id of the group's heading. */
  id: string;
  title: string;
  summary: string;
  tools: Tool[];
}

export const GROUPS: Group[] = [
  {
    id: 'self-hosted-platforms',
    title: 'Self-hosted platforms: Coolify and Dokploy',
    summary:
      'Open source platforms that run your applications on servers of your own, production included, with previews of pull requests among their features.',
    tools: [
      {
        name: 'Coolify',
        cells: {
          runs: 'Your servers, over SSH; Coolify Cloud can host the dashboard',
          kubernetes: 'No',
          compose: 'Yes: Docker Compose is one of its build packs',
          pullRequests: 'Yes: through its GitHub App or a repository webhook',
          worktree: 'No: from a pull request, or an image tag built by CI',
          protected: 'No: basic authentication is an option, set with labels for Compose',
          policy: 'No: its docs ask you to review the compose file before deploying',
          sleep: 'Not documented',
          agents: 'Yes: a CLI and an MCP server',
          license: 'Apache-2.0',
          price: 'Free; Coolify Cloud from $5 a month',
        },
      },
      {
        name: 'Dokploy',
        cells: {
          runs: 'Your servers; Dokploy Cloud can host the dashboard',
          kubernetes: 'No: Docker, and Docker Swarm across servers',
          compose: 'Yes for its Compose services, but previews are for its Applications only',
          pullRequests: 'Yes: GitHub pull requests, for Applications',
          worktree: 'No preview; an Application can be deployed from an uploaded .zip',
          protected: 'No: basic authentication can be set per application',
          policy: 'Not documented',
          sleep: 'Not documented',
          agents: 'Yes: a CLI and an MCP server',
          license: 'Apache-2.0, except a proprietary directory',
          price: 'Free; Dokploy Cloud from $4.50 a month per server',
        },
      },
    ],
  },
  {
    id: 'machine-per-preview',
    title: 'A machine per preview: Preevy and PullPreview',
    summary: 'Tools that start a machine in your cloud account for each pull request, and run its Docker Compose file there.',
    tools: [
      {
        name: 'Preevy',
        cells: {
          runs: 'A machine it creates in your AWS, Google Cloud or Azure account, or a pod in your Kubernetes cluster',
          kubernetes: 'No: Kubernetes is one option',
          compose: 'Yes',
          pullRequests: 'From CI: a job runs `preevy up`',
          worktree: 'Yes: `preevy up` from your machine syncs the local files',
          protected: 'No: a service can be made private, behind a secret or a Livecycle login',
          policy: 'No: each preview has a machine of its own',
          sleep: 'Not documented',
          agents: 'A CLI; no MCP server documented',
          license: 'Apache-2.0',
          price: 'Free; you pay for the machines',
        },
      },
      {
        name: 'PullPreview',
        cells: {
          runs: 'A machine per preview in your AWS Lightsail or Hetzner account',
          kubernetes: 'No',
          compose: 'Yes, or a Helm chart',
          pullRequests: 'Yes: a GitHub Action, started by a label on the pull request',
          worktree: 'Its CLI deploys a local path, for debugging',
          protected: 'No: open to every address unless the `cidrs` input narrows it',
          policy: 'No: each preview has a machine of its own',
          sleep: 'Not documented; the `ttl` input deletes old previews',
          agents: 'A CLI; no MCP server documented',
          license: 'Prosperity Public License: noncommercial use, and a 30-day commercial trial',
          price: '€300 a year per organization for commercial use, plus the machines',
        },
      },
    ],
  },
  {
    id: 'front-end-platforms',
    title: 'Hosted front-end platforms: Vercel and Netlify',
    summary: 'Hosting built for web front ends and functions, with a preview for each push or pull request.',
    tools: [
      {
        name: 'Vercel',
        cells: {
          runs: 'Vercel’s platform',
          kubernetes: 'No',
          compose: 'No: translated by hand, app containers into services in `vercel.json` and databases from its Marketplace; containers (beta) run from a Dockerfile',
          pullRequests: 'Yes: a preview for each push and pull request',
          worktree: 'Yes: `vercel deploy` uploads the local directory',
          protected: 'Yes: Vercel Authentication, on by default for new projects',
          policy: 'Not applicable',
          sleep: 'Functions and containers scale down when idle',
          agents: 'Yes: a CLI and an MCP server',
          license: 'Proprietary',
          price: 'Free Hobby plan for personal use; Pro per developer seat, plus usage',
        },
      },
      {
        name: 'Netlify',
        cells: {
          runs: 'Netlify’s platform',
          kubernetes: 'No',
          compose: 'No',
          pullRequests: 'Yes: a Deploy Preview for each pull request',
          worktree: 'Yes: `netlify deploy` uploads a local folder as a draft',
          protected: 'No: a password or private visibility, depending on the plan',
          policy: 'Not applicable',
          sleep: 'Not applicable: static files and functions',
          agents: 'Yes: a CLI and an MCP server',
          license: 'Proprietary',
          price: 'Free plan; paid plans with monthly credits',
        },
      },
    ],
  },
  {
    id: 'application-platforms',
    title: 'Hosted application platforms: Render, Railway and Heroku',
    summary: 'Hosting for whole applications, databases included, with an environment for each pull request.',
    tools: [
      {
        name: 'Render',
        cells: {
          runs: 'Render’s platform',
          kubernetes: 'No',
          compose: 'No: services are described in a `render.yaml` Blueprint',
          pullRequests: 'Yes: preview environments, on a Pro workspace or higher',
          worktree: 'No: from git',
          protected: 'Not documented',
          policy: 'Not applicable',
          sleep: 'Free instances only, after 15 minutes without traffic',
          agents: 'Yes: a CLI and an MCP server',
          license: 'Proprietary',
          price: 'A workspace plan, plus instances prorated by the second',
        },
      },
      {
        name: 'Railway',
        cells: {
          runs: 'Railway’s platform',
          kubernetes: 'No',
          compose: 'No: each Compose service is set up by hand as a Railway service',
          pullRequests: 'Yes: PR environments, deleted when the pull request closes',
          worktree: 'Yes: `railway up` uploads the current directory',
          protected: 'Not documented',
          policy: 'Not applicable',
          sleep: 'Optional: a service sleeps 5 to 10 minutes after its last outbound traffic, and wakes on the next request',
          agents: 'Yes: a CLI and an MCP server',
          license: 'Proprietary',
          price: 'A plan with included usage, then usage by the second',
        },
      },
      {
        name: 'Heroku',
        cells: {
          runs: 'Heroku’s platform',
          kubernetes: 'No',
          compose: 'No: review apps are described in `app.json`',
          pullRequests: 'Yes: review apps, with Pipelines and the GitHub integration',
          worktree: 'No: from GitHub',
          protected: 'Not documented',
          policy: 'Not applicable',
          sleep: 'Eco dynos, after 30 minutes without traffic',
          agents: 'Yes: a CLI and an MCP server',
          license: 'Proprietary',
          price: 'Dynos and add-ons, prorated to the second',
        },
      },
    ],
  },
  {
    id: 'kubernetes-development',
    title: 'Kubernetes development platforms: Okteto and Signadot',
    summary: 'Development and preview environments inside a Kubernetes cluster.',
    tools: [
      {
        name: 'Okteto',
        cells: {
          runs: 'Your Kubernetes cluster, or Okteto’s managed service',
          kubernetes: 'Yes',
          compose: 'Yes: translated to Kubernetes',
          pullRequests: 'From CI: GitHub Actions or GitLab CI',
          worktree: 'Yes: `okteto up` syncs local files into a development container',
          protected: 'No: endpoints are public unless marked private',
          policy: 'Keys such as `privileged` are not supported, with a warning',
          sleep: 'Yes: idle previews sleep, after 1 hour by default',
          agents: 'A CLI and agent skills; no MCP server documented',
          license: 'CLI Apache-2.0; the platform is proprietary',
          price: 'Free plan for small teams; others on request',
        },
      },
      {
        name: 'Signadot',
        cells: {
          runs: 'An operator in your Kubernetes cluster, with Signadot’s hosted control plane',
          kubernetes: 'Yes',
          compose: 'No: it forks Kubernetes workloads',
          pullRequests: 'From CI: a job creates a sandbox per pull request',
          worktree: 'Yes: services running on your machine join a sandbox',
          protected: 'Yes: preview URLs need an API key or a Signadot login',
          policy: 'Not applicable',
          sleep: 'Not documented',
          agents: 'Yes: a CLI and an MCP server',
          license: 'CLI Apache-2.0; the platform is proprietary',
          price: 'Free Starter plan; usage-based plans above it',
        },
      },
    ],
  },
  {
    id: 'kubernetes-services',
    title: 'Environments as a service on Kubernetes: Bunnyshell, Shipyard and Qovery',
    summary: 'Services that create an environment for each pull request on Kubernetes clusters, yours or theirs.',
    tools: [
      {
        name: 'Bunnyshell',
        cells: {
          runs: 'Bunnyshell’s service, on a Kubernetes cluster you connect or one it manages',
          kubernetes: 'Yes',
          compose: 'Imported once into a `bunnyshell.yaml`',
          pullRequests: 'Yes: an ephemeral environment per pull request',
          worktree: 'Not documented',
          protected: 'Not documented',
          policy: 'Bind mounts are flagged for review at import',
          sleep: 'Yes: sleep and wake schedules, per environment or for the organization',
          agents: 'A CLI; no official MCP server documented',
          license: 'CLI MIT; the service is proprietary',
          price: 'By the minute of a running environment, plus your cluster',
        },
      },
      {
        name: 'Shipyard',
        cells: {
          runs: 'Shipyard’s cloud: a Kubernetes cluster per account',
          kubernetes: 'Not yours: Shipyard runs the cluster',
          compose: 'Yes',
          pullRequests: 'Yes',
          worktree: 'Not documented',
          protected: 'Yes: single sign-on through your git host, or bypass tokens',
          policy: 'Not documented',
          sleep: 'Yes: environments spin down after a time without visits',
          agents: 'Yes: a CLI and an MCP server',
          license: 'CLI Apache-2.0; the service is proprietary',
          price: 'From $500 a month for 3 concurrent environments',
        },
      },
      {
        name: 'Qovery',
        cells: {
          runs: 'Qovery’s control plane, deploying to Kubernetes clusters in your cloud',
          kubernetes: 'Yes: clusters Qovery manages',
          compose: 'No: a Dockerfile, an image or a Helm chart per service',
          pullRequests: 'Yes: preview environments for pull requests',
          worktree: 'Not documented',
          protected: 'Not documented',
          policy: 'Not applicable',
          sleep: 'Scheduled stop and start, previews included',
          agents: 'Yes: a CLI and an MCP server',
          license: 'CLI Apache-2.0; the platform is proprietary',
          price: 'From $299 a month, billed yearly',
        },
      },
    ],
  },
];

/** A short note under each family's table, with what its own documentation says about its limits. */
export const NOTES: Record<string, string> = {
  'self-hosted-platforms':
    'A preview runs the code of the pull request on your server: Coolify’s documentation warns that “a pull request can run code on the deployment server”, and Dokploy’s says “we recommend not using preview deployments for public repositories”.',
  'machine-per-preview':
    'Each preview gets a machine of its own, kernel included, and costs one. Preevy’s URLs go through Livecycle’s hosted tunnel unless you run your own, and its last release dates from June 2025. PullPreview’s license allows noncommercial use and a 30-day commercial trial.',
  'front-end-platforms':
    'Nothing to operate. Neither runs a Docker Compose file: Vercel’s guide says of it “Vercel does not read any of it”.',
  'application-platforms':
    'Railway “does not run docker-compose.yml files directly”, Render describes services in a Blueprint, and in February 2026 Heroku moved to “a sustaining engineering model focused on stability, security, reliability, and support”.',
  'kubernetes-development':
    'They reuse your cluster, your manifests and what your team knows. Signadot deploys only the services a change touches and routes requests through them.',
  'kubernetes-services':
    'Without a new product, Argo CD’s pull request generator or Helm in CI does it with what you already run.',
};

/** When Spawner is the right tool, as plain facts of the release above. */
export const FITS: string[] = [
  'You want a preview of every branch, and of work nobody has pushed yet, for your team and its coding agents.',
  'Your app already runs with Docker Compose: its database, API and workers come up together, as they are.',
  'You would rather look after one Linux server than a Kubernetes cluster or a service billed per seat.',
  'Previews must stay private: behind your team’s login, with share links for guests.',
  'You want a fixed cost: many environments on one server, asleep when nobody uses them.',
];

/** When another tool fits better, and which one: `href` leads to its details below. */
export const ELSEWHERE: { need: string; tools: string; href: string }[] = [
  { need: 'Production and previews in one tool', tools: 'Coolify or Dokploy', href: '#self-hosted-platforms' },
  { need: 'A machine of its own for each preview, kernel included', tools: 'Preevy or PullPreview', href: '#machine-per-preview' },
  { need: 'A front end that already runs on Vercel or Netlify', tools: 'their previews', href: '#front-end-platforms' },
  { need: 'An app already hosted on Render, Railway or Heroku', tools: 'their pull request environments', href: '#application-platforms' },
  { need: 'A Kubernetes cluster you already run', tools: 'Okteto, Signadot, Bunnyshell, Shipyard or Qovery', href: '#kubernetes-development' },
  { need: 'Several servers, single sign-on or private registries', tools: 'not Spawner, see what it does not do', href: '#limits' },
];

export type SummaryId = 'runs' | 'compose' | 'pullRequests' | 'worktree' | 'cost';

/** The few questions that place each family of tools, for the summary table. */
export const SUMMARY_CRITERIA: { id: SummaryId; label: string }[] = [
  { id: 'runs', label: 'Runs on' },
  { id: 'compose', label: 'Runs your Compose file' },
  { id: 'pullRequests', label: 'A preview per pull request' },
  { id: 'worktree', label: 'A preview of unpushed work' },
  { id: 'cost', label: 'Cost' },
];

/** A family of tools in the summary table: its answers hold for the tools named, as the details below say. */
export interface Family {
  name: string;
  tools?: string;
  cells: Record<SummaryId, string>;
}

export const FAMILIES: Family[] = [
  {
    name: 'Spawner',
    cells: {
      runs: 'One Linux server of yours',
      compose: 'Yes, after a policy check',
      pullRequests: 'From CI',
      worktree: 'Yes',
      cost: 'Free, plus the server',
    },
  },
  {
    name: 'Self-hosted platforms',
    tools: 'Coolify, Dokploy',
    cells: {
      runs: 'Your servers',
      compose: 'Yes (Dokploy: not in previews)',
      pullRequests: 'Built in',
      worktree: 'No',
      cost: 'Free, plus the servers',
    },
  },
  {
    name: 'A machine per preview',
    tools: 'Preevy, PullPreview',
    cells: {
      runs: 'A cloud machine per preview',
      compose: 'Yes',
      pullRequests: 'From CI',
      worktree: 'Yes, from their CLI',
      cost: 'The machines (PullPreview: a paid license for companies)',
    },
  },
  {
    name: 'Front-end hosting',
    tools: 'Vercel, Netlify',
    cells: {
      runs: 'Their platform',
      compose: 'No',
      pullRequests: 'Built in',
      worktree: 'Yes, from their CLI',
      cost: 'Free tier, then paid',
    },
  },
  {
    name: 'Application hosting',
    tools: 'Render, Railway, Heroku',
    cells: {
      runs: 'Their platform',
      compose: 'No',
      pullRequests: 'Built in',
      worktree: 'Railway only',
      cost: 'Paid, by usage',
    },
  },
  {
    name: 'Kubernetes platforms',
    tools: 'Okteto, Signadot, Bunnyshell, Shipyard, Qovery',
    cells: {
      runs: 'A Kubernetes cluster',
      compose: 'Okteto, Shipyard; Bunnyshell imports it',
      pullRequests: 'Built in or from CI',
      worktree: 'Okteto, Signadot',
      cost: 'Paid; some free tiers',
    },
  },
];

export interface Source {
  /** What the page supports, in a few words. */
  label: string;
  url: string;
}

/** The pages each statement of the comparison comes from, checked on the day above. */
export const SOURCES: { tool: string; sources: Source[] }[] = [
  {
    tool: 'Spawner 2.1.0',
    sources: [
      { label: 'what the CLI sends', url: '/docs/cli/#up' },
      { label: 'the MCP server', url: '/docs/cli/#mcp-server' },
      { label: 'protected previews', url: '/docs/concepts/#protected-previews' },
      { label: 'sleep and lifetime', url: '/docs/concepts/#lifetime-sleep-and-limits' },
      { label: 'the compose policy', url: '/docs/security/#the-compose-policy' },
      { label: 'previews for pull requests', url: '/docs/ci/' },
      { label: 'license', url: LICENSE_URL },
    ],
  },
  {
    tool: 'Coolify',
    sources: [
      { label: 'preview deployments', url: 'https://coolify.io/docs/applications/deployments/preview-deployments' },
      { label: 'Docker Compose', url: 'https://coolify.io/docs/applications/builds/docker-compose' },
      { label: 'security model', url: 'https://coolify.io/docs/core/security-model' },
      { label: 'basic authentication', url: 'https://coolify.io/docs/core/networking/proxy/traefik/basic-auth' },
      { label: 'MCP server', url: 'https://coolify.io/docs/mcp/overview' },
      { label: 'CLI', url: 'https://github.com/coollabsio/coolify-cli' },
      { label: 'pricing', url: 'https://coolify.io/pricing' },
    ],
  },
  {
    tool: 'Dokploy',
    sources: [
      { label: 'preview deployments', url: 'https://docs.dokploy.com/docs/core/applications/preview-deployments' },
      { label: 'previews for Compose services, an open request', url: 'https://github.com/Dokploy/dokploy/issues/2028' },
      { label: 'CVE-2025-53825', url: 'https://github.com/Dokploy/dokploy/security/advisories/GHSA-h67g-mpq5-6ph5' },
      { label: 'sources, .zip upload', url: 'https://docs.dokploy.com/docs/core/providers' },
      { label: 'basic authentication', url: 'https://docs.dokploy.com/docs/core/applications/advanced' },
      { label: 'Dokploy Cloud', url: 'https://docs.dokploy.com/docs/core/cloud' },
      { label: 'MCP server', url: 'https://github.com/Dokploy/mcp' },
      { label: 'CLI', url: 'https://github.com/Dokploy/cli' },
      { label: 'license', url: 'https://github.com/Dokploy/dokploy/blob/canary/LICENSE.MD' },
      { label: 'pricing', url: 'https://dokploy.com/pricing' },
    ],
  },
  {
    tool: 'Preevy',
    sources: [
      { label: 'README: drivers, private services, tunnel', url: 'https://github.com/livecycle/preevy' },
      { label: 'releases', url: 'https://github.com/livecycle/preevy/releases' },
      { label: 'documentation', url: 'https://preevy.dev/' },
    ],
  },
  {
    tool: 'PullPreview',
    sources: [
      { label: 'README', url: 'https://github.com/pullpreview/action' },
      { label: 'inputs: cidrs, ttl', url: 'https://github.com/pullpreview/action/wiki/Inputs' },
      { label: 'CLI', url: 'https://github.com/pullpreview/action/wiki/CLI' },
      { label: 'license', url: 'https://github.com/pullpreview/action/blob/main/LICENSE' },
      { label: 'pricing', url: 'https://pullpreview.com/' },
    ],
  },
  {
    tool: 'Uffizzi',
    sources: [
      { label: 'repository and its last commit', url: 'https://github.com/UffizziCloud/uffizzi' },
      { label: 'documentation', url: 'https://docs.uffizzi.com/' },
    ],
  },
  {
    tool: 'Vercel',
    sources: [
      { label: 'deployment protection', url: 'https://vercel.com/docs/deployment-protection' },
      {
        label: 'protection on by default for new projects',
        url: 'https://vercel.com/changelog/deployment-protection-is-now-enabled-by-default-for-new-projects',
      },
      { label: 'Docker Compose', url: 'https://vercel.com/kb/guide/docker-compose-concepts-on-vercel' },
      { label: 'container images', url: 'https://vercel.com/docs/functions/container-images' },
      { label: 'vercel deploy', url: 'https://vercel.com/docs/cli/deploy' },
      { label: 'MCP server', url: 'https://vercel.com/docs/agent-resources/vercel-mcp' },
      { label: 'pricing', url: 'https://vercel.com/pricing' },
    ],
  },
  {
    tool: 'Netlify',
    sources: [
      { label: 'Deploy Previews', url: 'https://docs.netlify.com/deploy/deploy-types/deploy-previews/' },
      { label: 'password protection', url: 'https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/' },
      { label: 'netlify deploy', url: 'https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/' },
      { label: 'MCP server', url: 'https://github.com/netlify/netlify-mcp' },
      { label: 'pricing', url: 'https://www.netlify.com/pricing/' },
    ],
  },
  {
    tool: 'Render',
    sources: [
      { label: 'preview environments', url: 'https://render.com/docs/preview-environments' },
      { label: 'Docker Compose, a feature request', url: 'https://feedback.render.com/features/p/support-docker-compose' },
      { label: 'free instances', url: 'https://render.com/docs/free' },
      { label: 'MCP server', url: 'https://render.com/docs/mcp-server' },
      { label: 'CLI', url: 'https://render.com/docs/cli' },
      { label: 'pricing', url: 'https://render.com/pricing' },
    ],
  },
  {
    tool: 'Railway',
    sources: [
      { label: 'PR environments', url: 'https://docs.railway.com/environments' },
      { label: 'Docker Compose', url: 'https://docs.railway.com/guides/docker-compose' },
      { label: 'serverless', url: 'https://docs.railway.com/deployments/serverless' },
      { label: 'railway up', url: 'https://docs.railway.com/cli/up' },
      { label: 'MCP server', url: 'https://docs.railway.com/ai/mcp-server' },
      { label: 'pricing', url: 'https://railway.com/pricing' },
    ],
  },
  {
    tool: 'Heroku',
    sources: [
      { label: 'review apps', url: 'https://devcenter.heroku.com/articles/github-integration-review-apps' },
      { label: 'Eco dynos', url: 'https://devcenter.heroku.com/articles/eco-dyno-hours' },
      { label: 'usage and billing', url: 'https://devcenter.heroku.com/articles/usage-and-billing' },
      { label: 'CLI', url: 'https://devcenter.heroku.com/articles/heroku-cli' },
      { label: 'MCP server', url: 'https://devcenter.heroku.com/articles/heroku-mcp-server' },
      { label: 'an update on Heroku, February 2026', url: 'https://www.heroku.com/blog/an-update-on-heroku/' },
    ],
  },
  {
    tool: 'Okteto',
    sources: [
      { label: 'previews', url: 'https://www.okteto.com/docs/previews/' },
      { label: 'Docker Compose', url: 'https://www.okteto.com/docs/reference/docker-compose/' },
      { label: 'private endpoints', url: 'https://www.okteto.com/docs/core/endpoints/private-endpoints' },
      { label: 'sleep and cleanup', url: 'https://www.okteto.com/docs/admin/cleanup/' },
      { label: 'coding agents', url: 'https://www.okteto.com/docs/agentic' },
      { label: 'CLI', url: 'https://github.com/okteto/okteto' },
      { label: 'pricing', url: 'https://www.okteto.com/pricing/' },
    ],
  },
  {
    tool: 'Signadot',
    sources: [
      { label: 'overview', url: 'https://www.signadot.com/docs/overview' },
      { label: 'pull requests from GitHub Actions', url: 'https://www.signadot.com/docs/guides/integrate-ci/github' },
      { label: 'preview URLs', url: 'https://www.signadot.com/docs/reference/sandboxes/preview-urls' },
      { label: 'MCP server', url: 'https://www.signadot.com/docs/integrations/mcp' },
      { label: 'CLI', url: 'https://github.com/signadot/cli' },
      { label: 'pricing', url: 'https://www.signadot.com/pricing/' },
    ],
  },
  {
    tool: 'Bunnyshell',
    sources: [
      { label: 'ephemeral environments', url: 'https://documentation.bunnyshell.com/docs/quickstart-ephemeral-environments' },
      { label: 'Docker Compose import', url: 'https://www.bunnyshell.com/guides/preview-environments-with-docker-compose/' },
      { label: 'clusters', url: 'https://www.bunnyshell.com/integrations/' },
      { label: 'sleep schedules', url: 'https://www.bunnyshell.com/staging-management/' },
      { label: 'CLI', url: 'https://github.com/bunnyshell/cli' },
      { label: 'pricing', url: 'https://www.bunnyshell.com/pricing/' },
    ],
  },
  {
    tool: 'Shipyard',
    sources: [
      { label: 'documentation', url: 'https://docs.shipyard.build/' },
      { label: 'authentication', url: 'https://docs.shipyard.build/authentication' },
      { label: 'sleep settings', url: 'https://docs.shipyard.build/sleep-settings' },
      { label: 'MCP server', url: 'https://docs.shipyard.build/mcp' },
      { label: 'CLI', url: 'https://github.com/shipyard/shipyard-cli' },
      { label: 'security, clusters', url: 'https://shipyard.build/security/' },
      { label: 'pricing', url: 'https://shipyard.build/pricing/' },
    ],
  },
  {
    tool: 'Qovery',
    sources: [
      { label: 'introduction', url: 'https://www.qovery.com/docs/getting-started/introduction' },
      { label: 'preview environments', url: 'https://www.qovery.com/docs/getting-started/guides/use-cases/preview-environments' },
      { label: 'deployment sources', url: 'https://www.qovery.com/docs/getting-started/guides/getting-started/deploy-your-first-application' },
      { label: 'scheduled stop and start', url: 'https://www.qovery.com/docs/configuration/deployment-rule' },
      { label: 'MCP server', url: 'https://www.qovery.com/docs/copilot/mcp-server' },
      { label: 'CLI', url: 'https://github.com/Qovery/qovery-cli' },
      { label: 'pricing', url: 'https://www.qovery.com/pricing' },
    ],
  },
  {
    tool: 'Argo CD',
    sources: [
      { label: 'pull request generator', url: 'https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Pull-Request/' },
    ],
  },
];

/** A piece of a cell: plain text, or the inside of a `code` mark. */
export interface Span {
  code: boolean;
  text: string;
}

/** Splits a cell on its `code` marks, so that a template prints it without HTML. */
export function codeSpans(text: string): Span[] {
  return text
    .split('`')
    .map((part, index) => ({ code: index % 2 === 1, text: part }))
    .filter((span) => span.text !== '');
}

export interface PageUrls {
  /** The page's absolute URL. */
  url: string;
  /** The home page's absolute URL, which carries #website and #software. */
  home: string;
}

/**
 * The structured data of the page: a WebPage about the SoftwareApplication
 * the home page describes, reviewed on the day it was checked, and its
 * breadcrumb trail.
 */
export function compareJsonLd({ url, home }: PageUrls): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: HEADING,
        description: DESCRIPTION,
        inLanguage: 'en',
        isPartOf: { '@id': `${home}#website` },
        about: { '@id': `${home}#software` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        dateModified: CHECKED.iso,
        lastReviewed: CHECKED.iso,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Spawner', item: home },
          { '@type': 'ListItem', position: 2, name: 'Spawner and the alternatives', item: url },
        ],
      },
    ],
  };
}
