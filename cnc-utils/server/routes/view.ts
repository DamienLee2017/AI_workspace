import path from "path";
import fs from "fs";
import hbs from "hbs";
import type { Request, Response, Router } from "express";

const templatePath = path.resolve(__dirname, "../../index.html");
const template = hbs.compile(fs.readFileSync(templatePath, "utf-8"));

export function registerViewRoute(router: Router) {
  router.get("/{*path}", (_req: Request, res: Response) => {
    const html = template({
      ...res.locals,
    });
    res.type("html").send(html);
  });
}
