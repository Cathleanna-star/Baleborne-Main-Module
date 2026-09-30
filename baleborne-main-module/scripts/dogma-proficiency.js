const DOGMA_PROFICIENCY_MODULE_ID =
    "baleborne-main-module";

const DOGMA_STATISTIC_SLUG =
    "dogma";


/* Sets it up so the code automatically level's up Dogma Proficiencies, according to */

function getDogmaProficiencyRank(dogmaLevel) {

    if (dogmaLevel >= 15) {
        return 4;
    }

    if (dogmaLevel >= 7) {
        return 3;
    }

    if (dogmaLevel >= 2) {
        return 2;
    }

    if (dogmaLevel >= 1) {
        return 1;
    }

    return 0;
}


/* Codes the ranks for the Dogma proficiencie*/

function getDogmaRankName(rank) {

    const ranks = [
        "Untrained",
        "Trained",
        "Expert",
        "Master",
        "Legendary"
    ];

    return ranks[rank] ?? "Untrained";
}


/* When determining proficiencies, this code checks the Dogma attribute to ensure it is added correctly to the proficiency*/

function getDogmaAttributeName(attribute) {

    if (attribute === "wis") {
        return "Wisdom";
    }

    if (attribute === "cha") {
        return "Charisma";
    }

    return null;
}

/*Works with the above code to ensure the correct attribute modifier is added to the Proficiencies*/
function formatDogmaModifier(value) {

    if (!Number.isFinite(value)) {
        return "—";
    }

    return value >= 0
        ? `+${value}`
        : `${value}`;
}


/* This part puts together the stats that make up the Dogma proficiency*/

function createDogmaStatistic(
    actor,
    attribute,
    rank
) {

    
    if (
        !["wis", "cha"].includes(attribute)
    ) {
        return null;
    }


    const baseStatistic =
        actor.spellcasting?.base;


    const StatisticClass =
        baseStatistic?.constructor;


    if (!StatisticClass) {

        console.error(
            "Baleborne Main Module | PF2e Statistic class could not be found."
        );

        return null;
    }


    try {

        const statistic =
            new StatisticClass(
                actor,
                {
                    slug:
                        DOGMA_STATISTIC_SLUG,

                    label:
                        "Dogma Proficiency",

                    attribute,

                    rank,

                    domains: [
                        "dogma"
                    ],

                    check: {
                        type:
                            "attack-roll",

                        domains: [
                            "dogma-attack-roll"
                        ]
                    },

                    dc: {
                        domains: [
                            "dogma-dc"
                        ]
                    }
                }
            );

        
        actor.synthetics
            ?.statistics
            ?.set(
                DOGMA_STATISTIC_SLUG,
                statistic
            );


        return statistic;

    } catch (error) {

        console.error(
            "Baleborne Main Module | Failed to create Dogma Statistic.",
            error
        );

        return null;
    }
}


/* Puts the Dogma proficiency on the visibly on the character sheet, working with css to make it look right */

Hooks.on(
    "renderActorSheet",
    async (app, html) => {

        const actor =
            app.actor ??
            app.document;


        if (
            !actor ||
            actor.type !== "character"
        ) {
            return;
        }


        const root =
            html instanceof HTMLElement
                ? html
                : html?.[0];


        if (!root) return;


        const proficienciesTab =
            root.querySelector(
                'section.tab.proficiencies[data-tab="proficiencies"]'
            );


        if (!proficienciesTab) {
            return;
        }

        if (
            proficienciesTab.querySelector(
                ".baleborne-dogma-proficiency-header"
            )
        ) {
            return;
        }


        /* This is what adds the Dogma level for the dogma proficinecy*/

        const storedDogmaLevel =
            Number(
                actor.getFlag(
                    DOGMA_PROFICIENCY_MODULE_ID,
                    "dogmaLevel"
                ) ?? 0
            );


        const dogmaLevel =
            Math.max(
                0,
                Number.isFinite(
                    storedDogmaLevel
                )
                    ? Math.floor(
                        storedDogmaLevel
                    )
                    : 0
            );


        /* Get's the total Dogma level for the Dogma Proficiency*/

        const dogmaRank =
            getDogmaProficiencyRank(
                dogmaLevel
            );


        const rankName =
            getDogmaRankName(
                dogmaRank
            );


        /* Finds the Dogma attribute to add it*/

        const dogmaAttribute =
            actor.getFlag(
                DOGMA_PROFICIENCY_MODULE_ID,
                "dogmaAttribute"
            ) ?? null;


        const dogmaAttributeName =
            getDogmaAttributeName(
                dogmaAttribute
            );


        /* ==========================================
           Create Statistic
           ========================================== */

        const dogmaStatistic =
            createDogmaStatistic(
                actor,
                dogmaAttribute,
                dogmaRank
            );


        const attackModifier =
            dogmaStatistic
                ? dogmaStatistic.mod
                : null;


        const dogmaDC =
            dogmaStatistic
                ? dogmaStatistic.dc.value
                : null;


        /*Creates the header for the Dogma Proficincy and works with css to ensure it looks correct*/

        const dogmaHeader =
            document.createElement(
                "header"
            );


        dogmaHeader.classList.add(
            "baleborne-dogma-proficiency-header"
        );


        dogmaHeader.textContent =
            "Dogma";


        /*Ensure that the rest of the Dogma proficiency looks correct on the sheet by working with css */

        const dogmaList =
            document.createElement(
                "ul"
            );


        dogmaList.classList.add(
            "proficiencies-list",
            "baleborne-dogma-proficiency-list"
        );


        /* This controls how the Dogma Proficiency acts when there is no Dogma selected */

        if (!dogmaAttributeName) {

            dogmaList.innerHTML = `
                <li class="all-by-myself">

                    <span class="modifier">
                        —
                    </span>

                    <span class="name">
                        No Dogma Selected
                    </span>

                    <span
                        class="pf-rank"
                        data-rank="${dogmaRank}"
                    >
                        ${rankName}
                    </span>

                </li>
            `;

        } else {

            /*Controls how the Dogma proficiency acts when a Dogma is selected */

            dogmaList.innerHTML = `

                <li
                    data-statistic="dogma"
                >

                    <a
                        class="d20 baleborne-dogma-attack"
                        data-tooltip="Roll Dogma Attack"
                    >
                        <div class="d20-svg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="-1 0 19 19"
                                preserveAspectRatio="xMinYMin meet"
                            >
                                <path
                                    fill-rule="evenodd"
                                    fill="currentColor"
                                    d="M3.826,8.060 L0.124,13.540 C0.016,13.716 0.127,13.944 0.332,13.967 L7.637,14.743 L3.826,8.060 L3.826,8.060 ZM0.341,11.589 L2.983,7.288 L0.294,5.672 C0.200,5.615 0.081,5.683 0.081,5.792 L0.081,11.515 C0.081,11.657 0.267,11.710 0.341,11.589 ZM0.722,15.391 L7.541,18.472 C7.727,18.559 7.939,18.422 7.939,18.217 L7.939,15.909 L0.799,15.125 C0.643,15.107 0.580,15.321 0.722,15.391 L0.722,15.391 ZM3.571,6.330 L6.375,1.305 C6.527,1.057 6.249,0.769 5.996,0.913 L0.706,4.380 C0.620,4.437 0.622,4.565 0.711,4.618 L3.571,6.330 L3.571,6.330 ZM8.500,6.687 L12.331,6.687 L8.978,0.769 C8.869,0.590 8.684,0.501 8.500,0.501 C8.316,0.501 8.132,0.590 8.022,0.769 L4.669,6.687 L8.500,6.687 ZM16.707,5.672 L14.018,7.288 L16.659,11.589 C16.733,11.710 16.919,11.657 16.919,11.515 L16.919,5.792 C16.919,5.683 16.800,5.615 16.707,5.672 ZM13.430,6.330 L16.290,4.618 C16.379,4.564 16.381,4.436 16.294,4.379 L11.004,0.913 C10.752,0.769 10.474,1.057 10.626,1.305 L13.430,6.330 ZM16.202,15.125 L9.062,15.908 L9.062,18.217 C9.062,18.422 9.274,18.558 9.460,18.472 L16.279,15.391 C16.420,15.321 16.358,15.107 16.202,15.125 L16.202,15.125 ZM13.175,8.060 L9.364,14.743 L16.669,13.967 C16.874,13.944 16.986,13.716 16.877,13.540 L13.175,8.060 L13.175,8.060 ZM8.500,7.812 L4.977,7.812 L8.500,13.990 L12.023,7.812 L8.500,7.812 Z"
                                />
                            </svg>
                        </div>
                    </a>


                    <a
                        class="modifier baleborne-dogma-attack"
                        data-tooltip="Roll Dogma Attack"
                    >
                        ${formatDogmaModifier(
                            attackModifier
                        )}
                    </a>


                    <span class="name">
                        Dogma Attack
                    </span>


                    <span
                        class="pf-rank"
                        data-rank="${dogmaRank}"
                    >
                        ${rankName}
                    </span>

                </li>


                <li>

                    <span class="modifier">
                        ${dogmaDC ?? "—"}
                    </span>

                    <span class="name">
                        Dogma DC
                    </span>

                    <span
                        class="pf-rank"
                        data-rank="${dogmaRank}"
                    >
                        ${rankName}
                    </span>

                </li>

            `;
        }


        /* Locates the correct page (proficiency page)*/

        const classDCLink =
            proficienciesTab.querySelector(
                "a.dc"
            );


        const classDCList =
            classDCLink?.closest(
                "ul.proficiencies-list"
            );


        const classDCHeader =
            classDCList
                ?.previousElementSibling;


        /*Works with css to control the placement of the Dogma proficiency Header and DC*/

        if (
            classDCHeader &&
            classDCHeader.tagName ===
                "HEADER"
        ) {

            

            classDCHeader.insertAdjacentElement(
                "beforebegin",
                dogmaHeader
            );


            dogmaHeader.insertAdjacentElement(
                "afterend",
                dogmaList
            );

        } else {

           
            proficienciesTab.append(
                dogmaHeader,
                dogmaList
            );
        }


        /* Controls the Dogma Attack roll and ensures it actually rolls */

        const attackButtons =
            dogmaList.querySelectorAll(
                ".baleborne-dogma-attack"
            );


        for (
            const button
            of attackButtons
        ) {

            button.addEventListener(
                "click",
                async event => {

                    if (!dogmaStatistic) {
                        return;
                    }


                    await dogmaStatistic.roll({
                        event
                    });
                }
            );
        }
    }
);