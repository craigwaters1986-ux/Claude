# Third-party 3D anatomy data

`bodyparts3d-muscles.glb` (web) and `ios/Forma/Resources/bodyparts3d-muscles.usda` (iOS) are derived from **BodyParts3D**.

> BodyParts3D, © The Database Center for Life Science (DBCLS), https://dbarchive.biosciencedbc.jp/en/bodyparts3d/

**Changes made:** 194 muscle elements selected from the 4.0 "is-a" release, mapped to 16 training muscle groups, converted from mm/Z-up to m/Y-up, welded, simplified (≈ 974k → 80k triangles) with smooth normals added, and re-coloured at runtime. Three volumes are **not** from BodyParts3D: `abs__approx` and `lats__approx_L/R`, simple approximations added because the dataset has no rectus abdominis or latissimus dorsi meshes.

**Licence: needs confirmation before commercial release.** The sources disagree:

- The licence page (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html, last updated 2025-02-27) states **CC BY 4.0**.
- The headers inside the downloaded OBJ files state **CC BY-SA 2.1 Japan**.

Until DBCLS confirms which applies, treat these derived model files as **CC BY-SA 2.1 JP** (the more restrictive reading). Ship them as separate, clearly attributed assets under that licence. The built-in stylised mannequin, which has no third-party data, stays the default model. Whether share-alike reaches beyond the model files is a question for legal counsel.

Rebuild: `node tools/anatomy/build-bodyparts3d.mjs <dataset-dir>` (see docs/01-product-design.md).
