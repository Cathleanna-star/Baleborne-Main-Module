const DOGMA_METER_MODULE_ID =
    "baleborne-main-module";

const DOGMA_METER_FEATURE_CATEGORY =
    "dogma-feature";

/*This counts the Vow feats */
function getVowCount(actor) {
	return actor?.itemTypes?.feat?.filter(
		feat =>
			feat.system
				?.traits
				?.value 
				?.includes("vow")
	).length ?? 0;
}

/* Makes Dogma Level and Dogma Attribute usable in rule elements */

async function syncDogmaAliases(actor) {

    if (
        !actor ||
        actor.type !== "character" ||
        !actor.isOwner
    ) {
        return;
    }


    const dogmaLevel =
        Number(
            actor.getFlag(
                DOGMA_METER_MODULE_ID,
                "dogmaLevel"
            ) ?? 0
        );

    if (
        Number.isFinite(
            dogmaLevel
        )
    ) {

        const currentDogmaLevelAlias =
            Number(
                actor.getFlag(
                    "world",
                    "baleborneDogmaLevel"
                ) ?? 0
            );

        if (
            currentDogmaLevelAlias !==
            dogmaLevel
        ) {

            await actor.setFlag(
                "world",
                "baleborneDogmaLevel",
                dogmaLevel
            );
        }
    }

      const dogmaAttribute =
        actor.getFlag(
            DOGMA_METER_MODULE_ID,
            "dogmaAttribute"
        );

    const dogmaAttributeModifier =
        Number(
            actor.system
                ?.abilities
                ?.[dogmaAttribute]
                ?.mod ?? 0
        );

    const currentDogmaAttributeModifier =
        Number(
            actor.getFlag(
                "world",
                "baleborneDogmaAttributeModifier"
            ) ?? 0
        );

    if (
        currentDogmaAttributeModifier !==
        dogmaAttributeModifier
    ) {

        await actor.setFlag(
            "world",
            "baleborneDogmaAttributeModifier",
            dogmaAttributeModifier
        );
    }
}


/*Finds the character's Dogma*/

function getDogmaMeterFeature(actor) {

    return actor.itemTypes
        ?.feat
        ?.find(
            feat =>
                feat.system.category ===
                DOGMA_METER_FEATURE_CATEGORY
        ) ?? null;
}

function getDogmaMeterType(actor) {

    const dogmaFeature =
        getDogmaMeterFeature(actor);


    if (!dogmaFeature) {
        return null;
    }


    const identifier =
        (
            dogmaFeature.system?.slug ??
            dogmaFeature.name ??
            ""
        )
            .trim()
            .toLowerCase();


    if (
        identifier === "corrupt" ||
        identifier.includes("corrupt")
    ) {
        return "corrupt";
    }


    if (
        identifier === "pure" ||
        identifier.includes("pure")
    ) {
        return "pure";
    }


    if (
        identifier === "betwixt" ||
        identifier.includes("betwixt")
    ) {
        return "betwixt";
    }


    return null;
}


/* Finds and gets dogma attribute modifier */

function getDogmaMeterAttributeModifier(
    actor,
    attribute
) {

    if (
        !["wis", "cha"].includes(
            attribute
        )
    ) {
        return null;
    }


    return Number(
        actor.system
            ?.abilities
            ?.[attribute]
            ?.mod ?? 0
    );
}


/* Gets the Dogma Meter information so it's usable*/
export function getDogmaMeterData(actor) {

    const dogmaType =
        getDogmaMeterType(actor);


    /* -------------------------------------------------------- */
    /* No Dogma                                                 */
    /* -------------------------------------------------------- */

    if (!dogmaType) {

        return {
            active: false,
            dogmaType: null,
            label: "Dogma Meter",
            max: 0,
            initial: 0,
            threshold: 0,
            thresholdRatio: 0,
            direction: null,
            theme: "neutral",
            profile: "none",
            attribute: null,
            modifier: null,
            base: null
        };
    }


    /* -------------------------------------------------------- */
    /* Read Configuration Supplied By Dogma Feature             */
    /* -------------------------------------------------------- */

    const dogmaAttribute =
        actor.getFlag(
            DOGMA_METER_MODULE_ID,
            "dogmaAttribute"
        ) ?? null;


    const rawBase =
        actor.getFlag(
            DOGMA_METER_MODULE_ID,
            "dogmaMeterBase"
        );
	const rawDogmaLevel =
		actor.getFlag(
		DOGMA_METER_MODULE_ID,
		"dogmaLevel"
		);


    const direction =
        actor.getFlag(
            DOGMA_METER_MODULE_ID,
            "dogmaMeterDirection"
        ) ?? null;


    const rawThreshold =
        actor.getFlag(
            DOGMA_METER_MODULE_ID,
            "dogmaMeterThreshold"
        );


    const theme =
        actor.getFlag(
            DOGMA_METER_MODULE_ID,
            "dogmaMeterTheme"
        ) ?? null;


    /* -------------------------------------------------------- */
    /* Convert Values                                           */
    /* -------------------------------------------------------- */

    const modifier =
        getDogmaMeterAttributeModifier(
            actor,
            dogmaAttribute
        );


    const base =
        rawBase === null ||
        rawBase === undefined
            ? null
            : Number(
                rawBase
            );
	const dogmaLevel =
		rawDogmaLevel ===null ||
		rawDogmaLevel === undefined
			? 0
			: Number(
			rawDogmaLevel
		);

    const thresholdRatio =
        rawThreshold === null ||
        rawThreshold === undefined
            ? null
            : Number(
                rawThreshold
            );


    /* -------------------------------------------------------- */
    /* Meter Label                                              */
    /* -------------------------------------------------------- */

    let label =
        "Dogma Meter";


    if (
        theme === "corruption"
    ) {

        label =
            "Corruption Meter";
    }


    if (
        theme === "pure"
    ) {

        label =
            "Purity Meter";
    }


    /* -------------------------------------------------------- */
    /* Validate Configuration                                   */
    /* -------------------------------------------------------- */

    const validBase =
        Number.isFinite(
            base
        );
	const validDogmaLevel =
		Number.isFinite(
			dogmaLevel
		)&&
		dogmaLevel >= 0;

    const validDirection =
        direction === "up" ||
        direction === "down";


    const validThreshold =
        Number.isFinite(
            thresholdRatio
        ) &&
        thresholdRatio >= 0 &&
        thresholdRatio <= 1;


    const validTheme =
        typeof theme === "string" &&
        theme.length > 0;


    /* -------------------------------------------------------- */
    /* Incomplete Dogma Configuration                           */
    /* -------------------------------------------------------- */

    if (
        modifier === null ||
        !validBase ||
		!validDogmaLevel ||
        !validDirection ||
        !validThreshold ||
        !validTheme
    ) {

        return {
            active: false,
            dogmaType,
            label,
            max: 0,
            initial: 0,
            threshold: 0,
            thresholdRatio: 0,
            direction: null,
            theme:
                validTheme
                    ? theme
                    : "neutral",
            profile:
                `${dogmaType}-incomplete`,
            attribute:
                dogmaAttribute,
            modifier,
            base
        };
    }
	
/* This allows vows to modify the maximum Dogma meter level. */

const vowCount =
    getVowCount(actor);

const vowBonus =
    vowCount * 3;
	
/*This gets modifiers that affect the maximum Dogma meter */
	const dogmaMeterMaxModifiers =
		actor.synthetics.modifiers[
			"dogma-meter-max"
		] ?? [];
		
	const dogmaMeterMaxAdjustment =
		dogmaMeterMaxModifiers
			.map(
				construct =>
					construct()
				)
				.filter(
					modifier =>
						modifier &&
						modifier.enabled !== false
				)
				.reduce(
					(total, modifier) =>
						total +
						Number(
							modifier.modifier ?? 0
						),
					0
				);
				
/* This calculates the maximum Dogma meter level */

const max =
    Math.max(
        0,
        (
            (
                base +
                modifier
            ) *
            3 *
            dogmaLevel
        ) +
        vowBonus +
		dogmaMeterMaxAdjustment
    );

    /* -------------------------------------------------------- */
    /* Starting Value                                           */
    /* -------------------------------------------------------- */

    /*
     * Corruption-style meter:
     * starts at 0 and rises.
     *
     * Pure-style meter:
     * starts at maximum and falls.
     */

    const initial =
        direction === "up"
            ? 0
            : max;


    /* -------------------------------------------------------- */
    /* Threshold                                                */
    /* -------------------------------------------------------- */

    const threshold =
        max *
        thresholdRatio;
		
/*Creates the Meter's full "profile" so it includes dogma type, theme, direct, etc*/

    const profile =
        [
            dogmaType,
            theme,
            direction,
            base,
            thresholdRatio,
            dogmaAttribute
        ].join("-");


    return {
        active: true,
        dogmaType,
        label,
        max,
        initial,
        threshold,
        thresholdRatio,
        direction,
        theme,
        profile,
        attribute:
            dogmaAttribute,
        modifier,
        base
    };
}



Hooks.on(
    "renderActorSheet",
    async (
        app,
        html
    ) => {

        const actor =
            app.actor ??
            app.document;


        /* PCs only */

        if (
            !actor ||
            actor.type !==
                "character"
        ) {
            return;
        }
		
		await syncDogmaAliases(
			actor
		);

        const root =
            html instanceof HTMLElement
                ? html
                : html?.[0];


        if (!root) {
            return;
        }

        if (
            root.querySelector(
                ".baleborne-pc-dogma-meter"
            )
        ) {
            return;
        }


        const dogmaSection =
            root.querySelector(
                ".baleborne-dogma"
            );


        if (!dogmaSection) {
            return;
        }


        const meter =
            getDogmaMeterData(
                actor
            );


        const storedProfile =
            actor.getFlag(
                DOGMA_METER_MODULE_ID,
                "dogmaMeterProfile"
            ) ?? null;


        const rawStoredCurrent =
            actor.getFlag(
                DOGMA_METER_MODULE_ID,
                "dogmaMeterCurrent"
            );


        const storedCurrent =
            rawStoredCurrent === null ||
            rawStoredCurrent === undefined
                ? null
                : Number(
                    rawStoredCurrent
                );


        let current =
            storedProfile ===
                meter.profile &&
            Number.isFinite(
                storedCurrent
            )
                ? storedCurrent
                : meter.initial;


        current =
            Math.max(
                0,
                Math.min(
                    meter.max,
                    current
                )
            );


        const percentage =
            meter.max > 0
                ? (
                    current /
                    meter.max
                ) * 100
                : 0;

        const thresholdPercent =
            meter.active
                ? meter.thresholdRatio *
                    100
                : 0;

        const meterElement =
            document.createElement(
                "div"
            );


        meterElement.classList.add(
            "baleborne-pc-dogma-meter",
            `baleborne-dogma-meter-${meter.theme}`
        );


        meterElement.innerHTML = `

            <div
                class="baleborne-dogma-meter-header"
            >

                <span
                    class="baleborne-dogma-meter-label"
                >
                    ${meter.label}
                </span>


                <div
                    class="baleborne-dogma-meter-numbers"
                >

                    <input
                        type="number"
                        class="baleborne-dogma-meter-current"
                        value="${current}"
                        min="0"
                        max="${meter.max}"
                        step="1"
                        ${
                            actor.isOwner &&
                            meter.active
                                ? ""
                                : "disabled"
                        }
                    >

                    <span>/</span>

                    <span
                        class="baleborne-dogma-meter-max"
                    >
                        ${meter.max}
                    </span>

                </div>

            </div>


            <div
                class="baleborne-dogma-meter-bar"
            >

                <div
                    class="baleborne-dogma-meter-fill"
                    style="width: ${percentage}%"
                ></div>


                ${
                    meter.active
                        ? `

                            <div
                                class="baleborne-dogma-meter-threshold"
                                style="left: ${thresholdPercent}%"
                            ></div>

                        `
                        : ""
                }

            </div>
        `;


        /* ---------------------------------------------------- */
        /* Put Directly Below Dogma                              */
        /* ---------------------------------------------------- */

        dogmaSection.insertAdjacentElement(
            "afterend",
            meterElement
        );


        /* ---------------------------------------------------- */
        /* Save Current Value                                    */
        /* ---------------------------------------------------- */

        const input =
            meterElement.querySelector(
                ".baleborne-dogma-meter-current"
            );


        input?.addEventListener(
            "change",
            async event => {

                const enteredValue =
                    Number(
                        event
                            .currentTarget
                            .value
                    );


                const newValue =
                    Math.max(
                        0,
                        Math.min(
                            meter.max,
                            Number.isFinite(
                                enteredValue
                            )
                                ? Math.floor(
                                    enteredValue
                                )
                                : 0
                        )
                    );


                event.currentTarget.value =
                    newValue;


                await actor.update({

                    [`flags.${DOGMA_METER_MODULE_ID}.dogmaMeterCurrent`]:
                        newValue,

                    [`flags.${DOGMA_METER_MODULE_ID}.dogmaMeterProfile`]:
                        meter.profile
                });
            }
        );
    }
);