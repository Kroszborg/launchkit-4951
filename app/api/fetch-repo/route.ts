export async function POST(request: Request) {
  const { url } = await request.json();
  const match = (url as string).match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return Response.json({ error: "Invalid GitHub URL" }, { status: 400 });
  const [, owner, repo] = match;

  try {
    const headers = { Accept: "application/vnd.github.v3+json", "User-Agent": "LaunchKit" };

    const [repoRes, readmeRes, pkgRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers }),
    ]);

    const repoData = repoRes.ok ? await repoRes.json() : null;

    // README — up to 8000 chars to give AI enough context
    let readmeText = "";
    if (readmeRes.ok) {
      const rd = await readmeRes.json();
      readmeText = Buffer.from(rd.content, "base64").toString("utf-8").slice(0, 8000);
    }

    // package.json — extract name, description, keywords, key deps
    let packageInfo = "";
    if (pkgRes.ok) {
      try {
        const pkgFile = await pkgRes.json();
        const pkg = JSON.parse(Buffer.from(pkgFile.content, "base64").toString("utf-8"));
        const deps = Object.keys(pkg.dependencies || {}).slice(0, 20).join(", ");
        packageInfo = [
          pkg.description && `Package description: ${pkg.description}`,
          pkg.keywords?.length && `Keywords: ${pkg.keywords.join(", ")}`,
          deps && `Dependencies: ${deps}`,
        ]
          .filter(Boolean)
          .join("\n");
      } catch {
        // not a node project, fine
      }
    }

    return Response.json({
      name: repoData?.name || repo,
      description: repoData?.description || "",
      stars: repoData?.stargazers_count || 0,
      language: repoData?.language || "",
      topics: repoData?.topics || [],
      readme: readmeText,
      packageInfo,
      owner,
      repo,
      repoUrl: `https://github.com/${owner}/${repo}`,
    });
  } catch {
    return Response.json({ error: "Failed to fetch repo" }, { status: 500 });
  }
}
