import {
    getDogmaMeterData
} from "./dogma-meter.js";


const DOGMA_REST_MODULE_ID =
    "baleborne-main-module";


/* ------------------------------------------------------------ */
/* Apply Dogma Nightly Recovery                                 */
/* ------------------------------------------------------------ */

async function applyDogmaNightlyRecovery(
    actor
) {

    /* -------------------------------------------------------- */
    /* Characters Only                                          */
    /* -------------------------------------------------------- */

    if (
        !actor ||
        actor.type !==
            "character"
    ) {
        return;
    }


    /* -------------------------------------------------------- */
    /* Meter Information                                        */
    /* -------------------------------------------------------- */

    const meter =
        getDogmaMeterData(
            actor
        );


    /*
     * If the character has no Dogma,
     * or the Dogma hasn't been completely
     * configured, do nothing.
     */

    if (!meter.active) {

        console.log(
            `Baleborne Main Module | ${actor.name} has no active Dogma meter to recover.`
        );

        return;
    }


    /* -------------------------------------------------------- */
    /* Character Level                                          */
    /* -------------------------------------------------------- */

    const level =
        Number(
            actor.level ??
            actor.system
                ?.details
                ?.level
                ?.value ??
            0
        );


    /* -------------------------------------------------------- */
    /* Dogma Attribute Modifier                                 */
    /* -------------------------------------------------------- */

    /*
     * dogma-meter.js already calculated this
     * from the Dogma feat's selected attribute.
     */

    const dogmaAttributeModifier =
        Number(
            meter.modifier
        );


    if (
        !Number.isFinite(
            dogmaAttributeModifier
        )
    ) {

        console.warn(
            `Baleborne Main Module | ${actor.name} has no valid Dogma attribute modifier.`
        );

        return;
    }


 /*This is what finds the Recovery Multiplier */

const rawRecoveryMultiplier =
    Number(
        actor.flags
            ?.pf2e
            ?.dogmaRecoveryMultiplier ??
        1
    );


const recoveryMultiplier =
    Number.isFinite(
        rawRecoveryMultiplier
    )
        ? Math.max(
            0,
            rawRecoveryMultiplier
        )
        : 1;


/*Calculates Recovery of Purity or Corruption */

const baseRecovery =
    Math.max(
        0,
        level +
            dogmaAttributeModifier
    );


const recovery =
    baseRecovery *
    recoveryMultiplier;


    const storedProfile =
        actor.getFlag(
            DOGMA_REST_MODULE_ID,
            "dogmaMeterProfile"
        ) ?? null;


    const rawStoredCurrent =
        actor.getFlag(
            DOGMA_REST_MODULE_ID,
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


    /* -------------------------------------------------------- */
    /* Apply Recovery                                           */
    /* -------------------------------------------------------- */

    let newCurrent =
        current;

    if (
        meter.direction ===
            "up"
    ) {

        newCurrent =
            Math.max(
                0,
                current -
                    recovery
            );
    }

    if (
        meter.direction ===
            "down"
    ) {

        newCurrent =
            Math.min(
                meter.max,
                current +
                    recovery
            );
    }

    await actor.update({

        [`flags.${DOGMA_REST_MODULE_ID}.dogmaMeterCurrent`]:
            newCurrent,

        [`flags.${DOGMA_REST_MODULE_ID}.dogmaMeterProfile`]:
            meter.profile
    });


    /* -------------------------------------------------------- */
    /* Console Confirmation                                     */
    /* -------------------------------------------------------- */

    console.log(
        [
            "Baleborne Main Module | Dogma nightly recovery:",
            actor.name,
            `Level ${level}`,
            `Dogma modifier ${dogmaAttributeModifier}`,
            `Recovery ${recovery}`,
            `${current} → ${newCurrent}`,
            `Direction ${meter.direction}`
        ].join(" | ")
    );
}


/* ------------------------------------------------------------ */
/* PF2e Rest For The Night                                      */
/* ------------------------------------------------------------ */

Hooks.on(
    "pf2e.restForTheNight",
    actor => {

        /*
         * This line is deliberately here while
         * we're setting this up.
         *
         * If Rest for the Night fires correctly,
         * you will see this message in F12 Console.
         */

        console.log(
            "Baleborne Main Module | PF2e Rest for the Night detected:",
            actor?.name
        );


        void applyDogmaNightlyRecovery(
            actor
        ).catch(
            error => {

                console.error(
                    `Baleborne Main Module | Failed to apply Dogma nightly recovery for ${actor?.name ?? "unknown actor"}.`,
                    error
                );
            }
        );
    }
);