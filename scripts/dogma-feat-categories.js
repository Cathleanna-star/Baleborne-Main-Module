Hooks.once("init", () => {

    /* Baleborne Dogma Feat Types */

    CONFIG.PF2E.featCategories["dogma-feature"] =
        "BALEBORNE.FeatCategory.DogmaFeature";

    CONFIG.PF2E.featCategories["dogma-feat"] =
        "BALEBORNE.FeatCategory.DogmaFeat";


    console.log(
        "Baleborne Main Module | Dogma feat categories registered."
    );
});