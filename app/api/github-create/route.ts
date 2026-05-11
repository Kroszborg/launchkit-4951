import {
  buildIndexHtml,
  buildIndexJsx,
  buildPackageJson,
  buildReadme,
  buildTailwindConfig,
  buildViteConfig,
} from "@/lib/landing-template";

export async function POST(request: Request) {
  const { token, repoName, description, landingCode, productName } = await request.json();

  if (!token || !repoName) {
    return Response.json({ error: "Token and repo name required" }, { status: 400 });
  }

  try {
    // Validate token first
    const meRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "LaunchKit",
      },
    });
    if (!meRes.ok) {
      return Response.json(
        { error: "Invalid GitHub token. Make sure it has the 'repo' scope." },
        { status: 401 }
      );
    }

    // Create repo
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "LaunchKit",
      },
      body: JSON.stringify({
        name: repoName,
        description: description || `Landing page for ${productName}`,
        private: false,
        auto_init: false,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      const ghErrors = err.errors as Array<{ code: string; field: string }> | undefined;
      const alreadyExists = ghErrors?.some((e) => e.code === "already_exists");
      const errorMsg = alreadyExists
        ? `A repo named "${repoName}" already exists on your account. Use a different name.`
        : err.message || "Failed to create repo";
      return Response.json({ error: errorMsg }, { status: 400 });
    }

    const repoData = await createRes.json();
    const { full_name, html_url } = repoData;

    // Push all files
    const files = [
      { path: "src/LandingPage.jsx", content: landingCode },
      { path: "src/index.jsx", content: buildIndexJsx() },
      { path: "index.html", content: buildIndexHtml(productName) },
      { path: "package.json", content: buildPackageJson(productName, description) },
      { path: "README.md", content: buildReadme(productName, description) },
      { path: "tailwind.config.js", content: buildTailwindConfig() },
      { path: "vite.config.js", content: buildViteConfig() },
      { path: ".gitignore", content: "node_modules\ndist\n.env" },
    ];

    for (const file of files) {
      const fileRes = await fetch(
        `https://api.github.com/repos/${full_name}/contents/${file.path}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "LaunchKit",
          },
          body: JSON.stringify({
            message: `Add ${file.path}`,
            content: Buffer.from(file.content).toString("base64"),
          }),
        }
      );
      if (!fileRes.ok) {
        const errBody = await fileRes.json().catch(() => ({}));
        console.error(`Failed to push ${file.path}:`, errBody);
      }
    }

    return Response.json({
      repoUrl: html_url,
      fullName: full_name,
      vercelUrl: `https://vercel.com/new/import?s=${encodeURIComponent(`https://github.com/${full_name}`)}`,
      netlifyUrl: `https://app.netlify.com/start/deploy?repository=https://github.com/${full_name}`,
      pagesUrl: `https://github.com/${full_name}/settings/pages`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GitHub create error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
