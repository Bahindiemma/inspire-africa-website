# Blog Categories

> Purpose: how editors add and manage blog categories in the CMS, and how the switch from a fixed list was made without losing data.
> Last reviewed: 2026-11-22

## For editors

Categories live in the CMS under **Content Manager → Category**. You don't need a developer to add one.

**Add a category while writing a post.** In a Blog Post, open the **category** field and click **+ Create a relation** at the bottom of the menu. Fill in the name, save, and the new category is selected on the post. It also appears in the Category list.

**Add or edit categories in one place.** Open **Content Manager → Category**.

| Field | What it does |
|-------|--------------|
| name | The label visitors see on post cards and at the top of a post. Must be unique. |
| slug | Filled in from the name. Leave it unless you have a reason to change it. |
| description | Optional note for editors. The site doesn't show it. |
| order | Lower numbers come first in the Category list. The starter categories use 10, 20, 30…, so a new one can go in between (e.g. 15). |
| color | Optional colour, same format as Tags (`#F8BD26`). |

**Rename a category** by editing its name. Every post that uses it shows the new name within seconds. There's nothing to update post by post.

**Rules the CMS enforces:**
- A post can't be **published** without a category. Drafts can be saved without one.
- A category that any post still uses can't be deleted. The error message lists those posts. Move them to another category, then delete it.

## For developers

- Collection type `api::category.category` (`inspire-africa-cms/src/api/category`). Blog Post `category` is a `manyToOne` relation to it, replacing the old fixed enumeration. Like Tag, it has no draft/publish, so a category created from inside a post can be used straight away.
- Guards: `inspire-africa-cms/src/bootstrap/category-guards.ts` (document-service middleware, covers single and bulk publish/delete and the REST API).
- Permissions: public token `find`/`findOne` (`seed-roles.ts`); Content Manager and Blog Editor admin roles get full CRUD (`seed-admin-roles.ts`).
- Revalidation: a Category create, update or delete posts `collection: "category"`, which refreshes the `blog-post` tag and the whole layout (`app/api/revalidate/route.ts`).
- Web: `lib/cms/blogs.ts` populates `category` (object form, never the comma shorthand) and maps it to the `category: string` the components use. It still accepts a plain string, and shows "Insights" if a post has no category.

### The migration (2026-11-22)

Changing a field's type makes Strapi drop the old column during its schema sync. The switch therefore happens in two steps on the first boot:

1. `database/migrations/2026.11.22T00.00.00.stash-blog-categories.js` runs **before** the sync and copies every `blog_posts` row's category (each draft and published row, every locale) into `blog_category_stash`. Strapi never manages that table, so it never drops it.
2. `src/bootstrap/migrate-blog-categories.ts` creates the starter categories (only when the Category collection is empty) and links each stashed row through the join table directly. It doesn't re-publish, which would push unsaved draft edits live. Applied rows are stamped `applied_at`, so it never runs twice.

`blog_category_stash` stays as an audit record. Drop it once you're satisfied. The CMS Dockerfile copies `database/` into the runtime image. Without that, the migration never ships.

**Deploy order:** CMS first, then the website. The new website asks the CMS for the category relation, which an old CMS rejects (the website would fall back to its built-in posts). The new CMS with the old website only blanks the category label until the website deploys.
