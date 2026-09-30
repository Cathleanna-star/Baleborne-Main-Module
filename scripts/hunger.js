const HUNGER_MODULE_ID = "baleborne-main-module";

Hooks.on("renderCharacterSheetPF2e", async (app, html) => {
		
    const actor = app.actor ?? app.document;

    // Hunger applies to PCs and NPCs
    if (
        !actor ||
        !["character", "npc"].includes(actor.type)
    ) {
        return;
    }


    const root =
        html instanceof HTMLElement
            ? html
            : html?.[0];

    if (!root) return;



    /* ==========================================
       Hunger Maximum
       ========================================== */
    const conModifier =
    actor.system.abilities?.con?.mod ?? 0;

	const baseMaxHunger =
		Math.max(
			0,
			5 + conModifier
		);

	const hungerMaxModifiers =
    actor.synthetics.modifiers[
        "hunger-max"
    ] ?? [];


	const hungerMaxBonus =
		hungerMaxModifiers
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


const maxHunger =
    Math.max(
        0,
        baseMaxHunger +
        hungerMaxBonus
    );

	/* ==========================================
	   Current Hunger
	   ========================================== */

	const storedHunger =
		actor.getFlag(
			HUNGER_MODULE_ID,
			"hunger"
		) ?? 0;


	const currentHunger =
		Math.min(
			maxHunger,
			Math.max(
				0,
				Number(storedHunger)
			)
		);


	await syncHungerAliases(
		actor,
		currentHunger,
		maxHunger
	);

	 if (
			root.querySelector(
				".baleborne-hunger, .baleborne-hunger-npc"
			)
		) {
			return;
		}

    /* ==========================================
       PLAYER CHARACTER HUNGER
       ========================================== */

    if (actor.type === "character") {

        const hungerSection =
            document.createElement("div");


        hungerSection.classList.add(
            "baleborne-hunger"
        );


        hungerSection.innerHTML = `
            <header class="baleborne-hunger-header">
                <h2>Hunger</h2>
            </header>

            <div class="baleborne-hunger-resource">

                <div class="baleborne-hunger-numbers">

                    <input
                        type="number"
                        class="baleborne-hunger-current"
                        value="${currentHunger}"
                        min="0"
                        max="${maxHunger}"
                        ${actor.isOwner ? "" : "disabled"}
                    >

                    <span class="baleborne-hunger-divider">
                        /
                    </span>

                    <span class="baleborne-hunger-max">
                        ${maxHunger}
                    </span>

                </div>

                <div class="baleborne-hunger-bar">
                    <div
                        class="baleborne-hunger-fill"
                        style="width: ${
                            maxHunger > 0
                                ? (currentHunger / maxHunger) * 100
                                : 0
                        }%"
                    ></div>
                </div>

            </div>
        `;


        const sidebar =
            root.querySelector(".sidebar");

        if (!sidebar) return;


        const hitPoints =
            sidebar.querySelector(
                ".hitpoints"
            );

        if (!hitPoints) return;


        // Put Hunger directly after PC Hit Points
        hitPoints.insertAdjacentElement(
            "afterend",
            hungerSection
        );


        setupHungerSaving(
            actor,
            hungerSection,
            maxHunger
        );

        return;
    }


    /* ==========================================
       NPC HUNGER
       ========================================== */

    if (actor.type === "npc") {

        const hungerSection =
            document.createElement("div");


        /*
         * "subsection" is the same structural class
         * PF2e uses for NPC HP, AC, Initiative, etc.
         */

        hungerSection.classList.add(
            "subsection",
            "baleborne-hunger-npc"
        );


        hungerSection.innerHTML = `
            <header>

                <label>
                    <i class="fa-solid fa-fw fa-stomach"></i>
                    <span>Hunger</span>
                </label>

                <span class="hit-points">

                    <input
                        type="number"
                        class="current baleborne-hunger-current"
                        value="${currentHunger}"
                        min="0"
                        max="${maxHunger}"
                        ${actor.isOwner ? "" : "disabled"}
                    >

                    <span class="slash">
                        /
                    </span>

                    <div class="max">
                        ${maxHunger}
                    </div>

                </span>

            </header>
        `;


        const health =
            root.querySelector(
                ".sidebar .subsection.health"
            );

        if (!health) return;


        // Put NPC Hunger directly after HP
        health.insertAdjacentElement(
            "afterend",
            hungerSection
        );


        setupHungerSaving(
            actor,
            hungerSection,
            maxHunger
        );
    }
});


/* ==========================================
   Sync Hunger Aliases
   ========================================== */

async function syncHungerAliases(
    actor,
    currentHunger,
    maxHunger
) {
	
    if (!actor.isOwner) {
        return;
    }


    const updates =
        {};

    if (
        actor.getFlag(
            HUNGER_MODULE_ID,
            "hunger"
        ) !== currentHunger
    ) {

        updates[
            `flags.${HUNGER_MODULE_ID}.hunger`
        ] =
            currentHunger;
    }


    /*Creates the roll friendly aliases */
    if (
        actor.flags?.world
            ?.baleborneHungerCurrent !==
        currentHunger
    ) {

        updates[
            "flags.world.baleborneHungerCurrent"
        ] =
            currentHunger;
    }

    if (
        actor.flags?.world
            ?.baleborneHungerMax !==
        maxHunger
    ) {

        updates[
            "flags.world.baleborneHungerMax"
        ] =
            maxHunger;
    }


    if (
        Object.keys(
            updates
        ).length > 0
    ) {

        await actor.update(
            updates,
            {
                render: false
            }
        );
    }
}


/* ==========================================
   Save Hunger
   ========================================== */

function setupHungerSaving(
    actor,
    hungerSection,
    maxHunger
) {

    const hungerInput =
        hungerSection.querySelector(
            ".baleborne-hunger-current"
        );


    hungerInput?.addEventListener(
        "change",
        async event => {

            const enteredValue =
                Number(
                    event.currentTarget.value
                );


            const newValue =
                Math.min(
                    maxHunger,
                    Math.max(
                        0,
                        enteredValue
                    )
                );


            await actor.update(
			{
				[`flags.${HUNGER_MODULE_ID}.hunger`]:
					newValue,
				"flags.world.baleborneHungerCurrent":
					newValue
				}
			);
		}
	);
}