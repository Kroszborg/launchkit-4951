import {
  buildLandingTemplate,
  buildIndexHtml,
  buildIndexJsx,
  buildPackageJson,
  buildReadme,
  buildTailwindConfig,
  buildViteConfig,
} from "@/lib/landing-template";
import type { CopyData } from "@/lib/schemas";

export async function POST(request: Request) {
  const { token, repoName, description, landingCode, productName } = await request.json();

  if (!token || !repoName) {
    return Response.json({ error: "Token and repo name required" }, { status: 400 });
  }

  try {
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
      return Response.json({ error: err.message || "Failed to create repo" }, { status: 400 });
    }

    const repoData = await createRes.json();
    const { full_name, html_url } = repoData;

    const indexHtml = buildIndexHtml(productName);
    const packageJsonContent = buildPackageJson(productName, description);
    const readmeContent = buildReadme(productName, description);

    const files = [
      { path: "src/LandingPage.jsx", content: landingCode },
      { path: "src/index.jsx", content: buildIndexJsx() },
      { path: "index.html", content: indexHtml },
      { path: "package.json", content: packageJsonContent },
      { path: "README.md", content: readmeContent },
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
      vercelUrl: `https://vercel.com/new/clone?repository-url=https://github.com/${full_name}&project-name=${repoName}&framework=vite`,
      netlifyUrl: `https://app.netlify.com/start/deploy?repository=https://github.com/${full_name}`,
      pagesUrl: `https://github.com/${full_name}/settings/pages`,
    });
  } catch (err) {
    console.error("GitHub create error:", err);
    return Response.json({ error: "Failed to create GitHub repo" }, { status: 500 });
  }
}
