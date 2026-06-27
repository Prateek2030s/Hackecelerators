import { Octokit } from '@octokit/rest';

const octokit = new Octokit();

export async function fetchRepoData(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');

  const { data: repoInfo } = await octokit.repos.get({ owner, repo });

  let fileTree = '';
  try {
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: repoInfo.default_branch || 'main',
      recursive: 'true',
    });
    fileTree = tree.tree
      .filter((item) => item.type === 'blob' || item.type === 'tree')
      .map((item) => `${item.type === 'tree' ? '📁' : '📄'} ${item.path}`)
      .slice(0, 100)
      .join('\n');
  } catch {
    fileTree = 'Could not fetch file tree';
  }

  let readme = '';
  try {
    const { data } = await octokit.repos.getReadme({ owner, repo });
    readme = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 3000);
  } catch {
    readme = 'No README found';
  }

  let manifest = '';
  for (const filename of ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod']) {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path: filename });
      if ('content' in data) {
        manifest = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 2000);
        break;
      }
    } catch {
      continue;
    }
  }

  const sourceFiles: string[] = [];
  const candidatePaths = [
    'src/index.ts', 'src/index.js', 'src/app.ts', 'src/app.js',
    'app/page.tsx', 'app/layout.tsx', 'index.ts', 'index.js', 'main.py', 'app.py',
    'src/main.rs', 'main.go',
  ];

  for (const path of candidatePaths) {
    if (sourceFiles.length >= 2) break;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if ('content' in data) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        sourceFiles.push(`--- ${path} ---\n${content.slice(0, 1500)}`);
      }
    } catch {
      continue;
    }
  }

  return {
    name: repoInfo.name,
    description: repoInfo.description || '',
    language: repoInfo.language || 'Unknown',
    stars: repoInfo.stargazers_count,
    fileTree,
    readme,
    manifest,
    sourceFiles: sourceFiles.join('\n\n'),
  };
}
