import { Router } from "express";
import { openApiSpec } from "./openapi";

export const docsRouter = Router();

docsRouter.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

docsRouter.get("/docs", (_req, res) => {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Team Algebra Club Tracker API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
        persistAuthorization: true
      });
    </script>
  </body>
</html>`;
  res.type("html").send(html);
});