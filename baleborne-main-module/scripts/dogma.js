const DOGMA_MODULE_ID =
    "baleborne-main-module";

const DOGMA_FEATURE_CATEGORY =
    "dogma-feature";
/*This is to make sure the number of vows are tracked for the Vow stuff. */

function getVowCount(actor) {
	return actor?.itemTypes?.feat?.filter(
		feat =>
			feat.system
			?.traits
			?.value
			?.includes("vow")
	).length ?? 0;
}

/* This is what finds out what is the PC's dogma*/

function getCharacterDogma(actor) {

    return actor.itemTypes
        ?.feat
        ?.find(
            feat =>
                feat.system.category ===
                DOGMA_FEATURE_CATEGORY
        ) ?? null;
}


/* This part is to make it where Dogma type only show up in the Dogma slot on the first page, rather than showing up
on the feat page*/

function hideDogmaFromOtherSections(
    root,
    dogmaFeature
) {

    if (
        !root ||
        !dogmaFeature
    ) {
        return;
    }


    const itemId =
        dogmaFeature.id;

    const entries =
        root.querySelectorAll(
            `[data-item-id="${CSS.escape(itemId)}"]`
        );


    for (
        const entry
        of entries
    ) {


        if (
            entry.closest(
                ".baleborne-dogma"
            )
        ) {
            continue;
        }


        entry.remove();
    }
}


/* PC Dogma Code setup*/


Hooks.on(
    "renderActorSheet",
    async (app, html) => {

        const actor =
            app.actor ??
            app.document;


        /* PCs only */

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

        if (
            root.querySelector(
                ".baleborne-dogma"
            )
        ) {
            return;
        }

        const abcd =
            root.querySelector(
                'section.tab.character[data-tab="character"] .abcd'
            );


        if (!abcd) return;

        const dogmaFeature =
            getCharacterDogma(
                actor
            );


        const dogmaLabel =
            dogmaFeature?.name ?? "";


        /* This part creates the Dogma selection and enables it to find new Dogma if they are added*/

        const dogmaSection =
            document.createElement(
                "div"
            );


        dogmaSection.classList.add(
            "detail",
            "dogma",
            "baleborne-dogma"
        );


        dogmaSection.innerHTML = `

            <span class="details-label">
                Dogma
            </span>


            <h3
                class="baleborne-dogma-slot"
                data-baleborne-dogma-slot
            >

                <span
                    class="value baleborne-dogma-value"
                    ${
                        dogmaFeature
                            ? 'data-tooltip="Open Dogma"'
                            : ""
                    }
                >

                    ${
                        dogmaLabel ||
                        "&nbsp;"
                    }

                </span>


                ${
                    actor.isOwner
                        ? `

                            <a
                                class="baleborne-dogma-search"
                                data-tooltip="Browse Dogma Features"
                            >

                                <i
                                    class="fa-solid fa-fw fa-search"
                                ></i>

                            </a>

                        `
                        : ""
                }

            </h3>
        `;


        /* This helps put it in the right place on the character sheet (in this case I have it after deity) */
        const deity =
            abcd.querySelector(
                ".detail.deity"
            );


        if (deity) {

            deity.insertAdjacentElement(
                "afterend",
                dogmaSection
            );

        } else {

            abcd.appendChild(
                dogmaSection
            );
        }


        /* This is what enables you to pick the dogma*/

        const dogmaValue =
            dogmaSection.querySelector(
                ".baleborne-dogma-value"
            );


        if (
            dogmaFeature &&
            dogmaValue
        ) {

            dogmaValue.style.cursor =
                "pointer";


            dogmaValue.addEventListener(
                "click",
                () => {

                    dogmaFeature.sheet
                        ?.render(true);

                }
            );
        }


        /* This part is for the little search icon so that when you click it, it pops up the Dogma options*/

        const searchButton =
            dogmaSection.querySelector(
                ".baleborne-dogma-search"
            );


        searchButton?.addEventListener(
            "click",
            async () => {

                await openDogmaPicker(actor);

            }
        );


        /* This helps make sure that the Dogma's are only coded to the Dogma slot and not dogma feats section */

        if (dogmaFeature) {

            setTimeout(
                () => {

                    hideDogmaFromOtherSections(
                        root,
                        dogmaFeature
                    );

                },
                0
            );
        }
    }
);


/*Ensures the character's "own" the Dogma so that it can be used for other identitfying codes */

Hooks.on(
    "createItem",
    async (
        item,
        options,
        userId
    ) => {

          if (
            userId !== game.user.id
        ) {
            return;
        }


        const actor =
            item.actor ??
            item.parent;


        if (
            !actor ||
            actor.type !== "character"
        ) {
            return;
        }


        if (
            item.type !== "feat"
        ) {
            return;
        }


        if (
            item.system.category !==
            DOGMA_FEATURE_CATEGORY
        ) {
            return;
        }


        const oldDogmas =
            actor.itemTypes
                ?.feat
                ?.filter(
                    feat =>
                        feat.id !== item.id &&
                        feat.system.category ===
                            DOGMA_FEATURE_CATEGORY
                ) ?? [];


        /*Ensures that a character only has one dogma at a time and that if a new one is selected, the old one is fully removed.*/

        if (
            oldDogmas.length > 0
        ) {

            await actor.deleteEmbeddedDocuments(
                "Item",
                oldDogmas.map(
                    dogma =>
                        dogma.id
                )
            );
        }
    }
);

/* This part is actually repsonisble for opening the Dogma selection */

async function openDogmaPicker(actor) {

    if (
        !actor ||
        actor.type !== "character"
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


    /*Finds the Dogma and keeps them accesable to the character sheet*/

    const dogmas =
        index.filter(
            entry =>
                entry.type === "feat" &&
                entry.system?.category ===
                    DOGMA_FEATURE_CATEGORY
        );


    if (dogmas.length === 0) {

        ui.notifications.warn(
            "No Dogma Features were found in the Baleborne compendium."
        );

        return;
    }

/*Puts the Dogma list options in alphabetical order*/
    dogmas.sort(
        (a, b) =>
            a.name.localeCompare(
                b.name
            )
    );



    const buttons =
        dogmas.map(
            dogma => ({
                action: dogma._id,
                label: dogma.name,
                icon: "fa-solid fa-diamond"
            })
        );


    buttons.push({
        action: "cancel",
        label: "Cancel",
        icon: "fa-solid fa-xmark"
    });


 

    const result =
        await foundry.applications.api.DialogV2.wait({

            window: {
                title: "Select Dogma"
            },

            content: `
                <p>
                    Choose this character's Dogma.
                </p>
            `,

            buttons,

            rejectClose: false
        });


    /*Makes it to where when you hit the "cancel" option it closes the box without adding anything to the Dogma box*/

    if (
        !result ||
        result === "cancel"
    ) {
        return;
    }

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


    const currentDogma =
        getCharacterDogma(
            actor
        );


    if (
        currentDogma &&
        currentDogma.sourceId ===
            selectedDogma.uuid
    ) {

        return;
    }


    await actor.createEmbeddedDocuments(
        "Item",
        [
            selectedDogma.toObject()
        ]
    );
}