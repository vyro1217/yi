tsconfig upgraded to ES2021

The project `tsconfig.json` has been upgraded to target `ES2021` with `lib: ["ES2021"]` in this branch. This enables modern JS APIs like `String.prototype.replaceAll` and reduces the need for compatibility workarounds. Ensure your Node runtime is v16+ before merging to main.

If you prefer to keep `ES2020`, revert `tsconfig.json` and I'll adapt code to avoid `replaceAll` usage.