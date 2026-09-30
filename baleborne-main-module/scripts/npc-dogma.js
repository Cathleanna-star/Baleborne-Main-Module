const NPC_DOGMA_MODULE_ID = "baleborne-main-module";


/* Finds the Dogma types for the NPC sheets */

const NPC_DOGMA_FEATURE_CATEGORY =
	"dogma-feature";
	
function getNPCDogmaSelection(actor){
	return actor.getFlag(
	NPC_DOGMA_MODULE_ID,
	"npcDogma"
	)?? null;
}

/*NPC's Dogma Traits */
const NPC_DOGMA_TRAITS =
	new Set([
		"corrupt",
		"pure",
		"betwixt"
	]);
	
	
	/* Creates the ability for NPCs to access the automated Corruption and Purity resistances
	due to their Dogma type */

		const NPC_DOGMA_RESISTANCE_SOURCE =
			"Baleborne Dogma";


		async function syncNPCDogmaResistance(
			actor
		) {

			if (
				!actor ||
				actor.type !== "npc"
			) {
				return;
			}

			const dogma =
				getNPCDogmaSelection(
					actor
				);


			const dogmaName =
				dogma?.name
					?.trim()
					?.toLowerCase() ?? "";

			const dogmaLevel =
				Math.max(
					0,
					Math.floor(
						Number(
							actor.getFlag(
								NPC_DOGMA_MODULE_ID,
								"dogmaLevel"
							) ?? 0
						)
					)
				);

			const storedResistances =
				foundry.utils.deepClone(
					actor._source
						?.system
						?.attributes
						?.resistances ?? []
				);

			const newResistances =
				storedResistances.filter(
					resistance =>
						resistance.source !==
							NPC_DOGMA_RESISTANCE_SOURCE
				);


			if (
				dogmaName === "pure" &&
				dogmaLevel > 0
			) {

				newResistances.push({
					type: "corruption",
					value: dogmaLevel,
					source:
						NPC_DOGMA_RESISTANCE_SOURCE
				});
			}


			if (
				dogmaName === "corrupt" &&
				dogmaLevel > 0
			) {

				newResistances.push({
					type: "purity",
					value: dogmaLevel,
					source:
						NPC_DOGMA_RESISTANCE_SOURCE
				});
			}

			await actor.update({

				"system.attributes.resistances":
					newResistances
			});
		}
		
	
/*This is what calculates the NPC's Dogma Meter */
		export function getNPCDogmaMeterData(actor) {
			const dogma =
				getNPCDogmaSelection(
					actor 
				);
		
		if (!dogma) {
			return {
				active: false,
				label: "Dogma Meter",
				theme: null,
				direction: null,
				base: 0,
				modifier: 0,
				max: 0,
				initial: 0,
				thresholdRatio: 0,
				threshold: 0
			};
		}
		
		const dogmaLevel =
			Math.max(
				0,
				Math.floor(
					Number(
						actor.getFlag(
							NPC_DOGMA_MODULE_ID,
							"dogmaLevel"
						)?? 0
					)
				)
			);
		
		const dogmaAttribute =
			actor.getFlag(
				NPC_DOGMA_MODULE_ID,
				"dogmaAttribute"
			) ?? null;
			
		const modifier =
			["wis", "cha"].includes(
				dogmaAttribute 
			)
				? Number(
					actor.system
						?.abilities
						?.[dogmaAttribute]
						?.mod ?? 0
				)
				: 0;
				
		const dogmaName =
			dogma.name 
				?.trim()
				?.toLowerCase();
				
		let base;
		let theme;
		let direction;
		let thresholdRatio;
		
		
		if (
			dogmaName ===
			"corrupt"
		){
			base = 5;
			theme =
				"corruption";
			direction =
				"up";
			thresholdRatio =
				1/3;
		}
		
		else if (
			dogmaName ===
			"pure"
		) {
			base = 6;
			theme =
				"pure";
			direction =
				"down";
			thresholdRatio =
				1/3;
		}
		
		else if (
			dogmaName ===
			"betwixt"
		) {
			base = 4;
			
			
		const betwixtBase =
			actor.getFlag(
				NPC_DOGMA_MODULE_ID,
				"betwixtBase"
			);
			
		if (
			betwixtBase ===
			"pure"
		) {
				theme =
					"pure";
				direction =
					"down";
				thresholdRatio =
					1/3;
		}
		
		else {
				theme =
					"corruption";
				direction =
					"up";
				thresholdRatio =
					1/3;
		}
	}
	
		else {
				return {
					active: false,
					label: "Dogma Meter",
					theme: null,
					direction: null,
					base: 0,
					modifier,
					max: 0,
					initial: 0,
					thresholdRatio: 0,
					threshold: 0
				};
			}
			
		const max =
			Math.max(
				0,
				(
					base +
					modifier 
				) *
				3 *
				dogmaLevel
			);
			
		const initial =
			direction === "up"
				? 0
				: max;
				
		const threshold =
			max *
			thresholdRatio;
			
		const label =
			theme === "pure"
				? "Purity Meter"
				: "Corruption Meter";
				
		const profile =
				[
					dogmaName,
					theme,
					direction,
					base,
					thresholdRatio,
					dogmaAttribute
				].join("-");
		
				
			return {
				active: true,
				label,
				theme,
				direction,
				base,
				modifier,
				max,
				initial,
				thresholdRatio,
				threshold,
				dogmaLevel,
				dogmaAttribute,
				profile
			};
		}
		
		export function getNPCDogmaMeterCurrent(
			actor,
			meter
		) {
			if (!meter.active) {
				return 0;
			}
			
			const storedCurrent =
				Number(
					actor.getFlag(
						NPC_DOGMA_MODULE_ID,
						"npcDogmaMeterCurrent"
					)
				);
				
			const storedProfile =
				actor.getFlag(
					NPC_DOGMA_MODULE_ID,
					"npcDogmaMeterProfile"
				) ?? null;
				
			if(
				storedProfile !==
					meter.profile ||
				!Number.isFinite(
					storedCurrent
				)
			) {
				return meter.initial;
			}
			
			return Math.min(
				meter.max,
				Math.max(
					0,
					storedCurrent
				)
			);
		}
		
			
				

/* Dogma Rank */

function getNPCDogmaRank(dogmaLevel) {
    if (dogmaLevel >= 15) return 4;
    if (dogmaLevel >= 7) return 3;
    if (dogmaLevel >= 2) return 2;
    if (dogmaLevel >= 1) return 1;

    return 0;
}


/* Rank Name */

function getNPCDogmaRankName(rank) {
    const ranks = [
        "Untrained",
        "Trained",
        "Expert",
        "Master",
        "Legendary"
    ];

    return ranks[rank] ?? "Untrained";
}


/* Proficiency Bonus */

function getNPCDogmaProficiencyBonus(actor, rank) {
    if (rank === 0) {
        return 0;
    }

    const rankBonus = rank * 2;

    const pwol =
        game.pf2e.settings
            ?.variants
            ?.pwol
            ?.enabled ?? false;

    const levelBonus =
        pwol
            ? 0
            : Number(actor.level ?? 0);

    return levelBonus + rankBonus;
}


/* Dogma Attack and DC */

function getNPCDogmaValues(
    actor,
    attribute,
    rank
) {
    if (!["wis", "cha"].includes(attribute)) {
        return {
            attack: null,
            dc: null
        };
    }

    const abilityModifier =
        Number(
            actor.system
                ?.abilities
                ?.[attribute]
                ?.mod ?? 0
        );

    const proficiencyBonus =
        getNPCDogmaProficiencyBonus(
            actor,
            rank
        );

    const attack =
        abilityModifier +
        proficiencyBonus;

    return {
        attack,
        dc: 10 + attack
    };
}


/* Format Modifier */

function formatNPCDogmaModifier(value) {
    if (!Number.isFinite(value)) {
        return "—";
    }

    return value >= 0
        ? `+${value}`
        : `${value}`;
}


/* Create PF2e Roll Statistic */

function createNPCDogmaStatistic(
    actor,
    attribute,
    attack
) {
    if (
        !["wis", "cha"].includes(attribute) ||
        !Number.isFinite(attack)
    ) {
        return null;
    }

    try {
        const baseStatistic =
            actor.getStatistic?.("will");

        const StatisticClass =
            baseStatistic?.constructor;

        const ModifierClass =
            baseStatistic
                ?.modifiers
                ?.[0]
                ?.constructor;

        if (
            !StatisticClass ||
            !ModifierClass
        ) {
            console.error(
                "Baleborne | Could not find PF2e Statistic/Modifier classes."
            );

            return null;
        }


        const baseModifier =
            new ModifierClass({
                slug: "base",
                label: "PF2E.ModifierTitle",
                modifier: attack
            });


        return new StatisticClass(
            actor,
            {
                slug: "dogma",

                label: "Dogma",

                attribute,

                domains: [
                    "dogma",
                    `${attribute}-based`,
                    "attack-roll",
                    "all"
                ],

                modifiers: [
                    baseModifier
                ],

                check: {
                    type: "attack-roll"
                }
            }
        );

    } catch (error) {
        console.error(
            "Baleborne | Dogma roll statistic failed.",
            error
        );

        return null;
    }
}


/* NPC Sheet */

Hooks.on(
    "renderActorSheet",
    async (app, html) => {

        const actor =
            app.actor ??
            app.document;


        if (
            !actor ||
            actor.type !== "npc"
        ) {
            return;
        }


        const root =
            html instanceof HTMLElement
                ? html
                : html?.[0];

        if (!root) return;


        if (
            root.querySelector(
                ".baleborne-npc-dogma"
            )
        ) {
            return;
        }


        const recallKnowledge =
            root.querySelector(
                ".recall-knowledge.section-container"
            );

        if (!recallKnowledge) {
            return;
        }


        /* Dogma Type */

        const currentDogma =
			getNPCDogmaSelection(
				actor
			);
			
		const dogmaLabel =
			currentDogma?.name ??"";


        /* Dogma Level */

        const storedDogmaLevel =
            Number(
                actor.getFlag(
                    NPC_DOGMA_MODULE_ID,
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


        /* Dogma Attribute */

        const dogmaAttribute =
            actor.getFlag(
                NPC_DOGMA_MODULE_ID,
                "dogmaAttribute"
            ) ?? null;


        /* Rank */

        const dogmaRank =
            getNPCDogmaRank(
                dogmaLevel
            );


        const rankName =
            getNPCDogmaRankName(
                dogmaRank
            );


        /* Attack / DC Numbers */

        const dogmaValues =
            currentDogma
                ? getNPCDogmaValues(
                    actor,
                    dogmaAttribute,
                    dogmaRank
                )
                : {
                    attack: null,
                    dc: null
                };


        const dogmaAttack =
            dogmaValues.attack;

        const dogmaDC =
            dogmaValues.dc;
	
	/*Creates the Dogma Meter */
		const dogmaMeter =
			getNPCDogmaMeterData(
				actor
			);
			
		const dogmaMeterCurrent =
			getNPCDogmaMeterCurrent(
				actor,
				dogmaMeter 
			);
			
		const dogmaMeterPercent =
			dogmaMeter.max > 0
				? Math.min(
					100,
					Math.max(
					0,
					(
						dogmaMeterCurrent/
						dogmaMeter.max 
					) * 100
				)
			)
			: 0;
		
		const dogmaMeterThresholdPercent =
			dogmaMeter.active
				? dogmaMeter.thresholdRatio * 100
				: 0;
				


        /*This is part of what sets up the formation of the Dogma box so that everything is in the right place
		and works with css to make it look correct*/

        const dogmaSection =
            document.createElement("div");


        dogmaSection.classList.add(
            "baleborne-npc-dogma",
            "section-container"
        );


        dogmaSection.innerHTML = `

    <div
        class="section-header baleborne-npc-dogma-header"
    >

        <h4>
            Dogma
        </h4>

        <div class="baleborne-npc-dogma-level">

            <span>
                Level
            </span>

            <input
                type="number"
                class="baleborne-npc-dogma-level-input"
                value="${dogmaLevel}"
                min="0"
                step="1"
                data-tooltip="Dogma Level"
                ${
                    actor.isOwner
                        ? ""
                        : "disabled"
                }
            >

        </div>

    </div>


    <div class="baleborne-npc-dogma-content">


        <!-- LEFT COLUMN -->

        <div class="baleborne-npc-dogma-left">


            <!-- Selected Dogma -->

            <div class="baleborne-npc-dogma-slot">

                <span class="baleborne-npc-dogma-name">
                    ${
                        dogmaLabel ||
                        "&nbsp;"
                    }
                </span>

                ${
                    actor.isOwner
                        ? `
                            <a
                                class="baleborne-npc-dogma-search"
                                data-tooltip="${
                                    currentDogma
                                        ? "Change Dogma"
                                        : "Select Dogma"
                                }"
                            >
                                <i
                                    class="fa-solid fa-fw fa-search"
                                ></i>
                            </a>
                        `
                        : ""
                }

            </div>


            <!-- Dogma Meter -->

            <div
                class="
                    baleborne-npc-dogma-meter
                    ${
                        dogmaMeter.theme
                            ? `baleborne-npc-dogma-meter-${dogmaMeter.theme}`
                            : ""
                    }
                "
            >

                <div
                    class="baleborne-npc-dogma-meter-header"
                >

                    <span
                        class="baleborne-npc-dogma-meter-label"
                    >
                        ${dogmaMeter.label}
                    </span>


                    <span
                        class="baleborne-npc-dogma-meter-numbers"
                    >

                        <input
                            type="number"
                            class="baleborne-npc-dogma-meter-current"
                            value="${dogmaMeterCurrent}"
                            min="0"
                            max="${dogmaMeter.max}"
                            step="1"
                            ${
                                actor.isOwner
                                    ? ""
                                    : "disabled"
                            }
                        >

                        <span>
                            /
                        </span>

                        <span
                            class="baleborne-npc-dogma-meter-max"
                        >
                            ${dogmaMeter.max}
                        </span>

                    </span>

                </div>


                <div
                    class="baleborne-npc-dogma-meter-track"
                >

                    <div
                        class="baleborne-npc-dogma-meter-fill"
                        style="width: ${dogmaMeterPercent}%;"
                    >
                    </div>

                    <div
                        class="baleborne-npc-dogma-meter-threshold"
                        style="left: ${dogmaMeterThresholdPercent}%;"
                    >
                    </div>

                </div>

            </div>

        </div>


        <!-- RIGHT COLUMN -->

        <div class="baleborne-npc-dogma-right">


            <!-- Dogma Attack -->

            <div class="baleborne-npc-dogma-stat-row">

                <div class="baleborne-npc-dogma-stat-name">

                    <a
                        class="d20 baleborne-npc-dogma-roll"
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

                    <span>
                        Dogma Attack
                    </span>

                </div>


                <span
                    class="baleborne-npc-dogma-rank"
                >
                    ${rankName}
                </span>


                <a
                    class="baleborne-npc-dogma-value baleborne-npc-dogma-roll"
                    data-tooltip="Roll Dogma Attack"
                >
                    ${formatNPCDogmaModifier(
                        dogmaAttack
                    )}
                </a>

            </div>


            <!-- Dogma DC -->

            <div class="baleborne-npc-dogma-stat-row">

                <div class="baleborne-npc-dogma-stat-name">

                    <span
                        class="baleborne-npc-dogma-d20-space"
                    >
                    </span>

                    <span>
                        Dogma DC
                    </span>

                </div>


                <span
                    class="baleborne-npc-dogma-rank"
                >
                    ${rankName}
                </span>


                <span
                    class="baleborne-npc-dogma-value"
                >
                    ${
                        dogmaDC ??
                        "—"
                    }
                </span>

            </div>

        </div>

    </div>
`;


        /* Put it above Recall Knowledge */

        recallKnowledge.insertAdjacentElement(
            "beforebegin",
            dogmaSection
        );

        const dogmaStatistic =
            createNPCDogmaStatistic(
                actor,
                dogmaAttribute,
                dogmaAttack
            );


        /* Save Dogma Level */

        const levelInput =
            dogmaSection.querySelector(
                ".baleborne-npc-dogma-level-input"
            );


        levelInput?.addEventListener(
            "change",
            async event => {

                const enteredLevel =
                    Number(
                        event.currentTarget.value
                    );


                const newLevel =
                    Math.max(
                        0,
                        Number.isFinite(
                            enteredLevel
                        )
                            ? Math.floor(
                                enteredLevel
                            )
                            : 0
                    );


                await actor.setFlag(
                    NPC_DOGMA_MODULE_ID,
                    "dogmaLevel",
                    newLevel
                );
            		await syncNPCDogmaResistance(
					actor 
				);
			}
		);
				
		
	/*This makes it to where the current Dogma Meter value continues to be saved and tracked. */
			const dogmaMeterInput =
				dogmaSection.querySelector(
					".baleborne-npc-dogma-meter-current"
				);
				
			dogmaMeterInput?.addEventListener(
				"change",
				async event => {
					
				const enteredCurrent =
					Number(
						event.currentTarget.value
					);
					
				const newCurrent =
					Math.min(
						dogmaMeter.max,
						Math.max(
						0,
						Number.isFinite(
							enteredCurrent
						)
							?Math.floor(
								enteredCurrent
							)
							: dogmaMeterCurrent
						)
					);
				await actor.update({
					
					[`flags.${NPC_DOGMA_MODULE_ID}.npcDogmaMeterCurrent`]:
						newCurrent,
					
					[`flags.${NPC_DOGMA_MODULE_ID}.npcDogmaMeterProfile`]:
						dogmaMeter.profile
				});
			}
		);
		

        /* Choose Dogma */

        const searchButton =
            dogmaSection.querySelector(
                ".baleborne-npc-dogma-search"
            );


        searchButton?.addEventListener(
            "click",
            async () => {

                await openNPCDogmaPicker(
                    actor
                );
            }
        );


        /* Roll Dogma Attack */

        const rollButtons =
            dogmaSection.querySelectorAll(
                ".baleborne-npc-dogma-roll"
            );


        for (const button of rollButtons) {

            button.addEventListener(
                "click",
                async event => {

                    if (!dogmaStatistic) {

                        ui.notifications.warn(
                            "Select a Dogma and Dogma attribute first."
                        );

                        return;
                    }


                    await dogmaStatistic
                        .check
                        .roll({
                            event
                        });
                }
            );
        }
    }
);


/* This makes it to where NPCs can choose their dogma type */
	async function openNPCDogmaPicker(actor){
		if (
			!actor ||
			actor.type !== "npc"
		) {
			return;
		}
	const pack =
		game.packs.get(
			"baleborne-main-module.baleborne-main-module-pack"
		);
		if (!pack) {
			ui.notifications.error(
				"Baleborne Item compendium could not be found."
			);
			return;
		}
	const index =
		await pack.getIndex({
				fields: [
					"system.category",
					"img"
				]
		});
	const dogmas =
		index.filter(
			entry =>
				entry.type === "feat" &&
				entry.system?.category ===
					NPC_DOGMA_FEATURE_CATEGORY
		);
	if(
		dogmas.length === 0
	){
		ui.notifications.warn(
			"No Dogma Features were found in the Baleborne compendium."
		);
		return;
	}
	/*This part puts the Dogma's in alphabetical order*/
	dogmas.sort(
		(a,b)=>
			a.name.localeCompare(
				b.name
			)
		);
		
	/*This creates the selector buttons for the dogmas*/
	const buttons =
		dogmas.map(
			dogma=> ({
				action: dogma._id,
				label: dogma.name,
				icon:"fa-solid fa-diamond"
			})
		);
		
		buttons.push({
				action: "cancel",
				label: "Cancel",
				icon: "fa-solid fa-xmark"
		});
		
	/*This part actually opens up the Dogma picker and lets you select options */
		const result =
			await foundry.applications.api.DialogV2.wait({
			window: {
					title: "Select Dogma"
			},
			content:`
				<p>
					Select a Dogma.
				</p>
				`,
				buttons,
				rejectClose: false
			});
		
		if (
			!result ||
			result === "cancel"
		) {
			return;
		}
		
	/* Once selected, this part of the code ensures that the Dogma is able to be loaded appropriately */

	const selectedDogma =
		await pack.getDocument(
			result
		);


	if (!selectedDogma) {

		ui.notifications.error(
			"The selected Dogma could not be loaded."
		);

		return;
	}
	
	/*This chooses the NPC's Dogma Attribute and works with other parts of the code to ensure it functions */
			const dogmaAttribute =
				await chooseNPCDogmaAttribute();
			
			if (!dogmaAttribute){
					return;
			}
			
			
	/*This actually gives Betwixt the selected base chosen by another part of the code */
			let betwixtBase =
			null;
			
			if(
				selectedDogma.name.trim()
				.toLowerCase() ===
				"betwixt"
		) {
			betwixtBase =
				await chooseNPCBetwixtBase();
				
			if (!betwixtBase) {
				return;
			}
		}

	/* This code makes sure the correct trait is selected when choosing the NPC's Dogma */

	const selectedDogmaTrait =
    selectedDogma.name
        .trim()
        .toLowerCase();


	/* Get the NPC's current traits */

	const currentTraits =	
		Array.from(
			actor.system
				?.traits
				?.value ?? []
		);


	/* Remove any previous Dogma trait */

	const newTraits =
		currentTraits.filter(
			trait =>
				!NPC_DOGMA_TRAITS.has(
					trait
				)
		);


	/* Add the selected Dogma's trait */

	if (
		NPC_DOGMA_TRAITS.has(
			selectedDogmaTrait
		)
	) {
		newTraits.push(
			selectedDogmaTrait
		);
	}

	
	/* Saves the selected Dogma and updates the NPC's traits */

	await actor.update({

		[`flags.${NPC_DOGMA_MODULE_ID}.npcDogma`]: {
			id: selectedDogma.id,
			uuid: selectedDogma.uuid,
			name: selectedDogma.name
		},
		
		[`flags.${NPC_DOGMA_MODULE_ID}.dogmaAttribute`]:
			dogmaAttribute,
			
		[`flags.${NPC_DOGMA_MODULE_ID}.betwixtBase`]:
			betwixtBase,
		
			"system.traits.value":
			newTraits
	});
	await syncNPCDogmaResistance(
		actor
	);
}


/*Is what allows the NPC to select Wisdom or Charisma as its Dogma attribute */
		async function chooseNPCDogmaAttribute(){
			const result =
				await foundry.applications.api.DialogV2.wait({
					window: {
						title: "Choose Dogma Attribute"
					},
				content:`
					<p>
						Choose Dogma Attribute
					</p>
				`,
				buttons:[
				{
					action: "wis",
					label: "Wisdom"
				},
				{
					action: "cha",
					label: "Charisma"
				},
				{
					action: "cancel",
					label: "Cancel"
				}
			],
			rejectClose: false 
		});
		
			if (
				!result ||
				result === "cancel"
			){
				return null;
			}
			return result;
		}
		
		/*This is what allows Betwixt NPC's to select Pure or Corrupt base */

async function chooseNPCBetwixtBase() {

    const result =
        await foundry.applications.api.DialogV2.wait({

            window: {
                title: "Choose Betwixt Base"
            },

            content: `
                <p>
                    Choose whether this Betwixt NPC uses
                    a Pure Base or Corrupt Base.
                </p>
            `,

            buttons: [
                {
                    action: "pure",
                    label: "Pure Base"
                },
                {
                    action: "corruption",
                    label: "Corrupt Base"
                },
                {
                    action: "cancel",
                    label: "Cancel"
                }
            ],

            rejectClose: false
        });


    if (
        !result ||
        result === "cancel"
    ) {
        return null;
    }


    return result;
}
