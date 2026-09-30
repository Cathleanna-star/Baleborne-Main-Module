const GRANT_EFFECT_MODULE_ID =
    "baleborne-main-module";

const GRANT_EFFECT_RULE_KEY =
    "GrantEffect";


let BaleborneGrantEffectRuleElement =
    null;


const pendingActors =
    new Set();

const syncingActors =
    new Set();




Hooks.once(
    "setup",
    () => {

        const RuleElements =
            game.pf2e?.RuleElements;

        if (!RuleElements) {

            console.error(
                "Baleborne Main Module | PF2e Rule Elements were not available for GrantEffect."
            );

            return;
        }


        const BaseGrantItem =
            RuleElements.builtin.GrantItem;

        if (!BaseGrantItem) {

            console.error(
                "Baleborne Main Module | PF2e GrantItem Rule Element was not available."
            );

            return;
        }


        class GrantEffectRuleElement
            extends BaseGrantItem {

            constructor(
                data,
                options
            ) {

                super(
                    {
                        ...data,

                        reevaluateOnUpdate:
                            false,

                        inMemoryOnly:
                            false,

                        allowDuplicate:
                            data.allowDuplicate ??
                            false
                    },
                    options
				);
			

				this.valueFrom =
				typeof data.valueFrom === "string" &&
				data.valueFrom.length > 0
					? data.valueFrom
					: null;
			}

         
            async preCreate() {
                return;
            }


            async preUpdateActor() {

                return {
                    create: [],
                    delete: []
                };
            }


            onApplyActiveEffects() {
                return;
            }
        }


        BaleborneGrantEffectRuleElement =
            GrantEffectRuleElement;


        RuleElements.custom[
            GRANT_EFFECT_RULE_KEY
        ] =
            GrantEffectRuleElement;


        console.log(
            "Baleborne Main Module | GrantEffect Rule Element registered."
        );
    }
);


function getRuleIndex(
    rule
) {

    if (
        Number.isInteger(
            rule.sourceIndex
        )
    ) {
        return rule.sourceIndex;
    }


    return (
        rule.item?.rules?.indexOf(
            rule
        ) ??
        -1
    );
}


function getRuleIdentifier(
    rule
) {

    return [
        rule.item.id,
        getRuleIndex(
            rule
        )
    ].join(":");
}


function getGrantEffectData(
    item
) {

    return (
        item.flags?.[
            GRANT_EFFECT_MODULE_ID
        ]?.grantEffect ??
        null
    );
}


function scheduleGrantEffectSync(
    actor
) {

    if (
        !game.user?.isGM ||
        !actor ||
        !actor.items
    ) {
        return;
    }


    const actorKey =
        actor.uuid;


    if (
        syncingActors.has(
            actorKey
        ) ||
        pendingActors.has(
            actorKey
        )
    ) {
        return;
    }


    pendingActors.add(
        actorKey
    );


    setTimeout(
        async () => {

            pendingActors.delete(
                actorKey
            );


            try {

                await syncGrantEffects(
                    actor
                );

            } catch (error) {

                console.error(
                    `Baleborne Main Module | GrantEffect sync failed for ${actor.name}.`,
                    error
                );
            }

        },
        25
    );
}



async function syncGrantEffects(
    actor
) {

    if (
        !BaleborneGrantEffectRuleElement
    ) {
        return;
    }


    const actorKey =
        actor.uuid;


    if (
        syncingActors.has(
            actorKey
        )
    ) {
        return;
    }


    syncingActors.add(
        actorKey
    );


    try {

        const rules =
            actor.rules.filter(
                rule =>
                    rule instanceof
                        BaleborneGrantEffectRuleElement &&
                    !rule.ignored &&
                    !rule.invalid
            );


        const validRuleIdentifiers =
            new Set(
                rules.map(
                    getRuleIdentifier
                )
            );

        const orphanedEffects =
            actor.items.filter(
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

                    const grantData =
                        getGrantEffectData(
                            item
                        );


                    if (!grantData) {
                        return false;
                    }


                    const identifier =
                        [
                            grantData.granterId,
                            grantData.ruleIndex
                        ].join(":");


                    return (
                        !validRuleIdentifiers.has(
                            identifier
                        )
                    );
                }
            );


        if (
    orphanedEffects.length >
    0
) {

    await actor.deleteEmbeddedDocuments(
        "Item",
        orphanedEffects.map(
            item =>
                item.id
        )
    );
}


        for (
            const rule of rules
        ) {

            await syncSingleGrantEffect(
                actor,
                rule
            );
        }

    } finally {

        syncingActors.delete(
            actorKey
        );
    }
}

function getGrantEffectSourceValue(
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

    const sourceConditions =
        actor.conditions?.bySlug(
            normalizedSlug
        );


    const sourceCondition =
        sourceConditions?.[0] ??
        sourceConditions?.at?.(0) ??
        null;


    if (sourceCondition) {

        const numericValue =
            Number(
                sourceCondition.value
            );


        return Number.isFinite(
            numericValue
        )
            ? numericValue
            : null;
    }


    /*
     * Then check normal Effects.
     */
    const sourceEffect =
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


    if (!sourceEffect) {
        return null;
    }


    const badgeValue =
        sourceEffect.system
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



async function syncGrantEffectValue(
    actor,
    rule,
    grantedEffects
) {

    if (
        !rule.valueFrom ||
        grantedEffects.length === 0
    ) {
        return;
    }


    const sourceSlug =
        rule.resolveInjectedProperties(
            rule.valueFrom
        );


    const sourceValue =
        getGrantEffectSourceValue(
            actor,
            sourceSlug
        );


    if (
        sourceValue === null
    ) {
        return;
    }


    for (
        const effect of grantedEffects
    ) {

        /*
         * valueFrom only applies to Effects
         * that actually have a badge.
         */
        if (
            !effect.system?.badge
        ) {
            continue;
        }


        const currentValue =
            Number(
                effect.system.badge.value
            );


        if (
            currentValue ===
            sourceValue
        ) {
            continue;
        }


        await effect.update(
            {
                "system.badge.value":
                    sourceValue
            }
		);
	}
}

async function syncSingleGrantEffect(
    actor,
    rule
) {

    const ruleIndex =
        getRuleIndex(
            rule
        );


    const grantedEffects =
        actor.items.filter(
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


                const grantData =
                    getGrantEffectData(
                        item
                    );


                return (
                    grantData?.granterId ===
                        rule.item.id &&
                    grantData?.ruleIndex ===
                        ruleIndex
                );
            }
        );


    const predicatePasses =
        rule.test();


  
    if (
        !predicatePasses
    ) {

        if (
            grantedEffects.length >
            0
        ) {

            await actor.deleteEmbeddedDocuments(
                "Item",
                grantedEffects.map(
                    effect =>
                        effect.id
                )
            );
        }
        return;
    }


  
   if (
    grantedEffects.length >
    0
) {

    await syncGrantEffectValue(
        actor,
        rule,
        grantedEffects
    );


    return;
}

    const uuid =
        rule.resolveInjectedProperties(
            rule.uuid
        );


    if (
        typeof uuid !==
            "string" ||
        uuid.length ===
            0
    ) {

        console.warn(
            `Baleborne Main Module | GrantEffect on ${rule.item.name} has an invalid UUID.`
        );

        return;
    }

    if (
        !rule.allowDuplicate
    ) {

        const existingSameEffect =
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


                    const grantData =
                        getGrantEffectData(
                            item
                        );


                    return (
                        item.sourceId ===
                            uuid ||
                        grantData?.uuid ===
                            uuid
                    );
                }
            );


        if (
            existingSameEffect
        ) {
            return;
        }
    }


    const effectDocument =
        await fromUuid(
            uuid
        );


    if (
        !effectDocument
    ) {

        console.warn(
            `Baleborne Main Module | GrantEffect could not resolve UUID: ${uuid}`
        );

        return;
    }


    if (
        effectDocument.documentName !==
            "Item" ||
        ![
            "effect",
			"condition"
			].includes(
				effectDocument.type
			)
    ) {

        console.warn(
            `Baleborne Main Module | GrantEffect only accepts Effect or Condition items. ${uuid} is not an neither.`
        );

        return;
    }


    const effectSource =
        effectDocument.toObject();


    delete effectSource._id;
    delete effectSource._stats;
    delete effectSource.folder;
    delete effectSource.sort;


    effectSource.flags ??=
        {};

    effectSource.flags[
        GRANT_EFFECT_MODULE_ID
    ] ??=
        {};


    effectSource.flags[
        GRANT_EFFECT_MODULE_ID
    ].grantEffect =
        {
            granterId:
                rule.item.id,

            ruleIndex,

            uuid
        };

	if (
		rule.valueFrom &&
		effectSource.system?.badge
	) {

		const sourceSlug =
			rule.resolveInjectedProperties(
				rule.valueFrom
			);


		const sourceValue =
			getGrantEffectSourceValue(
				actor,
				sourceSlug
			);


		if (
			sourceValue !== null
		) {

			effectSource.system.badge.value =
				sourceValue;
		}
	}
    await actor.createEmbeddedDocuments(
        "Item",
        [
            effectSource
        ]
	);
}

Hooks.on(
    "createItem",
    item => {

        scheduleGrantEffectSync(
            item.actor
        );
    }
);


Hooks.on(
    "updateItem",
    item => {

        scheduleGrantEffectSync(
            item.actor
        );
    }
);


Hooks.on(
    "deleteItem",
    item => {

        scheduleGrantEffectSync(
            item.actor
        );
    }
);


Hooks.on(
    "updateActor",
    actor => {

        scheduleGrantEffectSync(
            actor
        );
    }
);

Hooks.once(
    "ready",
    () => {

        if (
            !game.user?.isGM
        ) {
            return;
        }


        for (
            const actor of game.actors
        ) {

            scheduleGrantEffectSync(
                actor
            );
        }
    }
);