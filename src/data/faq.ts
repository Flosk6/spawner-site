/**
 * The questions of the home page, answered in a few lines with the page of
 * the docs that goes further. Answers use two marks of Markdown, `code` and
 * [links](/docs/), so that the same text gives the page's HTML and the plain
 * text of its structured data (FAQPage). Every answer holds for the release
 * the site describes.
 */
export interface Question {
  question: string;
  answer: string;
}

export const faq: Question[] = [
  {
    question: 'Is it free?',
    answer:
      'Yes. Spawner is open source under the Apache-2.0 license and runs entirely on your server: there is no hosted service and nothing to sign up for. You pay for the server.',
  },
  {
    question: 'Does it need Kubernetes?',
    answer:
      'No. It needs one Linux server, dedicated to previews: Ubuntu 22.04 or 24.04, or Debian 12, on amd64 or arm64, with 4 GiB of memory at least (8 GiB or more advised), ports 80 and 443, and a wildcard DNS record such as `*.preview.example.com`. The installer sets up Docker; each environment is a Docker Compose project behind Traefik. See [installing Spawner](/docs/install/).',
  },
  {
    question: 'Can I get a preview for each pull request?',
    answer:
      'Not by itself: Spawner does not watch your git host. A CI job runs `spawner up` when a pull request opens and `spawner down` when it closes; [the CI guide](/docs/ci/) has the workflows for GitHub Actions and GitLab CI.',
  },
  {
    question: 'Which stacks does it run?',
    answer:
      'Anything Docker Compose runs: any language, databases as services, and apps spread over several repositories. Two [examples](/docs/examples/) are ready to deploy: Node.js and PostgreSQL; Laravel, Next.js and MySQL.',
  },
  {
    question: 'Is it safe to run branches nobody has reviewed?',
    answer:
      'Spawner checks every compose file against an allowlist (no host mounts, privileged containers, host network or Docker socket), gives each environment its own network, and keeps previews behind your team’s login. Containers cannot reach the cloud’s metadata or the server’s own services, but they share its kernel and reach the internet: use a server dedicated to previews, with test data only. See [security](/docs/security/).',
  },
  {
    question: 'How do coding agents use it?',
    answer:
      'With the same CLI as people: `spawner up --wait --json` from their worktree, then the URL, the logs and commands in the environment, with exit codes they can act on. Or through its MCP server, in Claude Code, Codex, Cursor or any MCP client. `spawner init` adds the instructions to `AGENTS.md` or `CLAUDE.md`. See [coding agents](/docs/agents/).',
  },
  {
    question: 'Does Spawner send data anywhere?',
    answer:
      'No telemetry: Spawner sends nothing about your server, your projects or your people. Besides what you set up (git hosts, image registries, Let’s Encrypt and your DNS provider, GitHub login), a server makes one request on its own: the list of releases from `api.github.com` every 6 hours, which `SPAWNER_UPDATE_CHECK=false` turns off. The CLI talks to your server only ([network](/docs/install/#network)).',
  },
  {
    question: 'Can it run production, or several servers?',
    answer:
      'No: one installation runs previews on one server, dedicated to them. [What Spawner does not do](/docs/concepts/#what-spawner-does-not-do) lists its limits, and [the comparison](/compare/) sets it next to other tools.',
  },
];

const CODE = /`([^`]+)`/g;
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Escapes text for HTML. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** An answer as HTML: `code` and [links](/docs/), everything else escaped. */
export function answerHtml(answer: string): string {
  return escapeHtml(answer).replace(CODE, '<code>$1</code>').replace(LINK, '<a href="$2">$1</a>');
}

/** An answer as plain text, for structured data: the marks gone, the words kept. */
export function answerText(answer: string): string {
  return answer.replace(CODE, '$1').replace(LINK, '$1');
}

/** The questions as schema.org's FAQPage, from the same text as the page. */
export function faqJsonLd(questions: Question[], id: string): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    '@id': id,
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: answerText(item.answer) },
    })),
  };
}
