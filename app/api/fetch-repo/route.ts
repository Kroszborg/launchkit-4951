export async function POST(request: Request) {
  const { url } = await request.json();
  const match = (url as string).match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return Response.json({ error: "Invalid GitHub URL" }, { status: 400 });
  const [, owner, repo] = match;

  try {
    const [repoRes, readmeRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "LaunchKit" },
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "LaunchKit" },
      }),
    ]);

    const repoData = repoRes.ok ? await repoRes.json() : null;
    let readmeText = "";
    if (readmeRes.ok) {
      const rd = await readmeRes.json();
      readmeText = Buffer.from(rd.content, "base64").toString("utf-8").slice(0, 3000);
    }

    return Response.json({
      name: repoData?.name || repo,
      description: repoData?.description || "",
      stars: repoData?.stargazers_count || 0,
      language: repoData?.language || "",
      topics: repoData?.topics || [],
      readme: readmeText,
      owner,
      repo,
    });
  } catch {
    return Response.json({ error: "Failed to fetch repo" }, { status: 500 });
  }
}
