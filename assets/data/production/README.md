# Production mutashabihat dataset

Used by the **beta** and **production** builds. It must contain **only records whose status is `approved`** by the scientific committee.

It is intentionally empty in Sprint 1: no candidate record has been approved yet (the preliminary review cycle is QMT-49). Do not copy files from `assets/data/candidate/` or `assets/data/review/` here. The app also filters to `approved` at the repository layer, and `npm run check:production-bundle` fails if candidate data leaks into a production web export.
