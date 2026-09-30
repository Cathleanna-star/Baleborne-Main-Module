const DOGMA_FEATS_MODULE_ID = "baleborne-main-module";

const DOGMA_FEAT_CATEGORY = "dogma-feat";
const DOGMA_FEAT_LOCATION = "dogma-feat";




Hooks.on(
    "createItem",
    async (item, options, userId) => {
       
        if (userId !== game.user.id) return;

       
        if (item.type !== "feat") return;

        
        if (
            item.system.category !==
            DOGMA_FEAT_CATEGORY
        ) {
            return;
        }
        
        const actor = item.parent;

        if (!actor) return;
        
        if (actor.type !== "character") return;
       
        if (!item.isOwner) return;


        /*Makes it to where if a Dogma feat is dropped anywhere on the character sheet except the feats page, it will automatically
		put it in the Dogma Feat section*/

        if (
            item.system.location !==
            DOGMA_FEAT_LOCATION
        ) {

            await item.update({
                "system.location":
                    DOGMA_FEAT_LOCATION
            });
        }
    }
);


/* The Dogma Feat Section */

Hooks.on(
    "renderActorSheet",
    async (app, html) => {

        const actor =
            app.actor ?? app.document;


        // Dogma Feats are currently for PCs
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


        /* Makes the Feat tab selector function and makes it to where Dogma Feats show up not random other feats in the browser*/

        const featsTab =
            root.querySelector(
                'section.tab.feats[data-tab="feats"]'
            );


        if (!featsTab) return;

       
        if (
            featsTab.querySelector(
                '.feat-section[data-group-id="dogma-feat"]'
            )
        ) {
            return;
        }


        /* This makes the Dogma level fucntion the way we need it to (so when it goes up other parts of the code can read it
		and they work together)*/

        const storedDogmaLevel =
            Number(
                actor.getFlag(
                    DOGMA_FEATS_MODULE_ID,
                    "dogmaLevel"
                ) ?? 0
            );


        const dogmaLevel =
            Math.max(
                0,
                Number.isFinite(storedDogmaLevel)
                    ? Math.floor(storedDogmaLevel)
                    : 0
            );


        /* This actually creates the Dogma Feats section on the character sheet and enables feats to be put here properly*/

        const dogmaSection =
            document.createElement(
                "section"
            );


        dogmaSection.classList.add(
            "feat-section",
            "major",
            "baleborne-dogma-feats"
        );


        dogmaSection.dataset.groupId =
            DOGMA_FEAT_LOCATION;


        dogmaSection.innerHTML = `
            <header>

                Dogma Feats

                <span
                    class="limit baleborne-dogma-level"
                >
                    (
                    Dogma Level

                    <input
                        type="number"
                        class="baleborne-dogma-level-input"
                        value="${dogmaLevel}"
                        min="0"
                        step="1"
                        ${actor.isOwner ? "" : "disabled"}
                    >

                    )
                </span>


                <div class="controls">

                    <button
                        type="button"
                        class="baleborne-dogma-browse"
                        data-tooltip="Browse Dogma Feats"
                    >
                        <i
                            class="fa-solid fa-fw fa-search"
                        ></i>

                        Browse
                    </button>

                </div>

            </header>


            <ol
                class="feats-list baleborne-dogma-feats-list"
                data-foundry-list
            >
            </ol>
        `;


        /* This is the code that chooses where the Dogma Feats appear on the character sheet, working with 
		the css to give it an appropriate appearance */

        const bonusFeats =
            featsTab.querySelector(
                '.feat-section[data-group-id="bonus"]'
            );


        if (bonusFeats) {

            bonusFeats.insertAdjacentElement(
                "beforebegin",
                dogmaSection
            );

        } else {

            featsTab.appendChild(
                dogmaSection
            );
        }


        /* This makes sure other parts of the code can find the Dogma Feats list location and place feats in here correctly*/

        const dogmaFeatList =
            dogmaSection.querySelector(
                ".baleborne-dogma-feats-list"
            );


        if (!dogmaFeatList) return;


        /* This part ensure that feats that have been put on the character sheet are visible and in the proper place */

        
        const assignedDogmaFeats =
            actor.itemTypes.feat.filter(
                feat =>

                    feat.system.category ===
                        DOGMA_FEAT_CATEGORY &&

                    feat.system.location ===
                        DOGMA_FEAT_LOCATION
            );


        for (
            const feat
            of assignedDogmaFeats
        ) {

            const featRow =
                featsTab.querySelector(
                    `li.slot[data-item-id="${feat.id}"]`
                );


            if (!featRow) continue;

            dogmaFeatList.appendChild(
                featRow
            );
        }


        /*This makes it to where feats are freely dropped in and not bound to a level or slot*/

        dogmaFeatList.addEventListener(
            "dragover",
            event => {

                if (!actor.isOwner) return;


                event.preventDefault();


                dogmaFeatList.classList.add(
                    "baleborne-dogma-drop-active"
                );
            }
        );


        dogmaFeatList.addEventListener(
            "dragleave",
            () => {

                dogmaFeatList.classList.remove(
                    "baleborne-dogma-drop-active"
                );
            }
        );


        dogmaFeatList.addEventListener(
            "drop",
            async event => {

                if (!actor.isOwner) return;


                event.preventDefault();
                event.stopPropagation();


                dogmaFeatList.classList.remove(
                    "baleborne-dogma-drop-active"
                );


                /* Makes it to where when you grab a feat and drag it, you can still see what it says instead of it going invisiable*/

                const dragData =
                    foundry.applications.ux.TextEditor
                        .getDragEventData(
                            event
                        );


                if (
                    dragData.type !== "Item" ||
                    !dragData.uuid
                ) {
                    return;
                }


                const draggedItem =
                    await fromUuid(
                        dragData.uuid
                    );


                if (!draggedItem) return;

                if (
                    draggedItem.type !==
                    "feat"
                ) {
                    return;
                }


                /* This part ensure it is only Dogma feats going in the Dogma feat section and not other feats*/

                if (
                    draggedItem.system.category !==
                    DOGMA_FEAT_CATEGORY
                ) {

                    ui.notifications.warn(
                        "Only Dogma Feats can be placed in the Dogma Feats section."
                    );

                    return;
                }
                

                if (
                    draggedItem.parent?.uuid ===
                    actor.uuid
                ) {

                    await draggedItem.update({
                        "system.location":
                            DOGMA_FEAT_LOCATION
                    });


                    return;
                }


                /* Makes it to where when you add a feat to the Dogma Feat section, the notification says it's been added to Dogma Feats,
				instead of saying something like it was added to Bonus Feats*/

                const source =
                    draggedItem.toObject();


                source.system.location =
                    DOGMA_FEAT_LOCATION;


                if (source.system.level) {

                    source.system.level.taken =
                        actor.level;
                }



                delete source._id;


                await actor.createEmbeddedDocuments(
                    "Item",
                    [
                        source
                    ]
                );

		/* The actual ui notification code */
                ui.notifications.info(
                    `${draggedItem.name} added to Dogma Feats.`
                );
            }
        );


        /* makes it to when you change the Dogma Level number that it saves it and remembers it*/

        const levelInput =
            dogmaSection.querySelector(
                ".baleborne-dogma-level-input"
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


                event.currentTarget.value =
                    newLevel;


                await actor.setFlag(
                    DOGMA_FEATS_MODULE_ID,
                    "dogmaLevel",
                    newLevel
                );
            }
        );


        /* Codes that ensures that Dogma Feat (as a filter and otherwise) shows up in the compendium broswer*/

        const browseButton =
            dogmaSection.querySelector(
                ".baleborne-dogma-browse"
            );


        browseButton?.addEventListener(
            "click",
            async () => {

                const browser =
                    game.pf2e
                        ?.compendiumBrowser;


                if (!browser) {

                    console.error(
                        "Baleborne Main Module | PF2e Compendium Browser was not found."
                    );

                    return;
                }


                const featBrowserTab =
                    browser.tabs.feat;

                const filter =
                    await featBrowserTab
                        .getFilterData();


                const categoryFilter =
                    filter.checkboxes.category;

                for (
                    const option
                    of Object.values(
                        categoryFilter.options
                    )
                ) {

                    option.selected =
                        false;
                }


                categoryFilter.selected =
                    [];


                const dogmaFeatOption =
                    categoryFilter.options[
                        DOGMA_FEAT_CATEGORY
                    ];


                if (!dogmaFeatOption) {

                    console.error(
                        "Baleborne Main Module | Dogma Feat category was not found in the Feat Browser."
                    );

                    return;
                }



                dogmaFeatOption.selected =
                    true;


                categoryFilter.selected.push(
                    DOGMA_FEAT_CATEGORY
                );


                categoryFilter.isExpanded =
                    true;

                
                const currentDogmaLevel =
                    Number(
                        actor.getFlag(
                            DOGMA_FEATS_MODULE_ID,
                            "dogmaLevel"
                        ) ?? 0
                    );


                const maximumDogmaLevel =
                    Math.max(
                        0,
                        Number.isFinite(
                            currentDogmaLevel
                        )
                            ? Math.floor(
                                currentDogmaLevel
                            )
                            : 0
                    );


                

                filter.level.from =
                    filter.level.min;


                filter.level.to =
                    Math.min(
                        maximumDogmaLevel,
                        filter.level.max
                    );


                
                filter.level.changed =
                    true;


                filter.level.isExpanded =
                    true;


                

                await featBrowserTab.open({
                    filter
                });
            }
        );
    }
);