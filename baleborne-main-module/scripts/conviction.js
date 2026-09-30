function getConvictionSourceValue(
    actor,
    sourceSlug
) {
    if (
        !actor ||
        typeof sourceSlug !== "string" ||
        sourceSlug.length === 0
    ) {
        return null;
    }

    const normalizedSlug =
        sourceSlug.toLowerCase();

    const sourceItem =
        actor.items.find(
            item => {

                if (
                    ![
                        "effect",
                        "condition"
                    ].includes(
                        item.type
                    )
                ) {
                    return false;
                }

                const itemSlug =
                    item.slug ??
                    item.system?.slug ??
                    null;

                return (
                    typeof itemSlug === "string" &&
                    itemSlug.toLowerCase() ===
                        normalizedSlug
                );
            }
        );

    if (!sourceItem) {
        return null;
    }


    /*This part makes it to where conditions are able to be referenced for their value and used 
	in the code */
    if (
        sourceItem.type ===
        "condition"
    ) {

        const conditionValue =
            sourceItem.value ??
            sourceItem.system
                ?.value
                ?.value;

        const numericValue =
            Number(
                conditionValue
            );

        return Number.isFinite(
            numericValue
        )
            ? numericValue
            : null;
    }


    /**This part makes it to where effects are able to be referenced for their value and used 
	in the code */
    const badgeValue =
        sourceItem.system
            ?.badge
            ?.value;

    const numericValue =
        Number(
            badgeValue
        );

    return Number.isFinite(
        numericValue
    )
        ? numericValue
        : null;
}



Hooks.once("setup", () => {

    const RuleElements =
        game.pf2e?.RuleElements;

    if (!RuleElements) {

        console.error(
            "Baleborne Main Module | Could not access PF2e RuleElements."
        );

        return;
    }


    const FlatModifierRuleElement =
        RuleElements.builtin.FlatModifier;


    class BaleborneConvictionRuleElement
        extends FlatModifierRuleElement {

        static defineSchema() {
            return super.defineSchema();
        }


        constructor(
            source,
            options
        ) {

            const {
                valueFrom,
                valueMultiplier = 1,
                ...baseSource
            } = source;


            let value =
                baseSource.value ??
                0;

            if (
                typeof valueFrom === "string" &&
                valueFrom.length > 0
            ) {

                const sourceValue =
                    getConvictionSourceValue(
                        options.parent?.actor,
                        valueFrom
                    );


                const multiplier =
                    Number(
                        valueMultiplier
                    );


                if (
                    sourceValue !== null
                ) {

                    value =
                        sourceValue *
                        (
                            Number.isFinite(
                                multiplier
                            )
                                ? multiplier
                                : 1
                        );

                } else {

                    value = 0;
                }
            }


            const isPenalty =
                typeof value === "number" &&
                value < 0;


            const convictionSource = {
                ...baseSource,

                value,
                type: "untyped",

                slug: isPenalty
                    ? "conviction-penalty"
                    : "conviction-bonus",

                label:
                    baseSource.label ??
                    (
                        isPenalty
                            ? "Conviction Penalty"
                            : "Conviction Bonus"
                    )
            };


            super(
                convictionSource,
                options
            );
        }
    }


    RuleElements.custom.ConvictionRule =
        BaleborneConvictionRuleElement;


    console.log(
        "Baleborne Main Module | Conviction Rule registered"
    );
});