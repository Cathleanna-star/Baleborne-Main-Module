/* ============================================================ */
/* Ruined                                                      */
/* ============================================================ */


	const RUINED_EFFECT_NAME =
		"ruined";

	function getRuinedEffect(actor) {

		if (!actor) {
			return null;
		}


	return actor.items.find(
		item => {

			if (
				item.type !== "effect"
			) {
				return false;
			}


			const itemSlug =
				item.slug
					?.trim()
					?.toLowerCase();


			const itemName =
				item.name
					?.trim()
					?.toLowerCase()
					?.replace(
						/^effect:\s*/,
						""
					);


			return (
				itemSlug ===
					RUINED_EFFECT_NAME ||

				itemSlug ===
					`effect-${RUINED_EFFECT_NAME}` ||

				itemName ===
					RUINED_EFFECT_NAME
			);
		}
	) ?? null;
}


/* Removing Ruined */

async function removeRuined(
	actor
) {

	const ruined =
		getRuinedEffect(
			actor
		);


	if (!ruined) {
		return;
	}


	await ruined.delete();
}


/* Removes Ruined via flat check */

async function rollRuinedRecovery(
	actor,
	ruined
) {

	if (
		!actor ||
		!ruined
	) {
		return;
	}

	const roll =
		await new Roll(
			"1d20"
		).evaluate();


	await roll.toMessage({
		speaker:
			ChatMessage.getSpeaker({
				actor
			}),

		flavor:
			"Ruined Recovery — DC 15 Flat Check"
	});

	if (
		Number(
			roll.total
		) >= 15
	) {

		await ruined.decrease();
	}
}

/* ------------------------------------------------------------ */
/* End Of Turn Recovery                                         */
/* ------------------------------------------------------------ */

Hooks.on(
	"combatTurn",
	async (
		combat,
		updateData,
		updateOptions
	) => {

		/*
		 * Only run when combat is actually active.
		 */

		if (
			!combat?.started
		) {
			return;
		}


		/*
		 * Only run when moving forward through
		 * the initiative order.
		 *
		 * Moving backward through the tracker
		 * should not cause another recovery roll.
		 */

		if (
			Number(
				updateOptions
					?.direction ?? 0
			) <= 0
		) {
			return;
		}


		/*
		 * If there is no current turn, there
		 * isn't a creature whose turn is ending.
		 */

		if (
			!Number.isInteger(
				combat.turn
			)
		) {
			return;
		}


		/*
		 * combatTurn fires before Foundry changes
		 * to the next turn.
		 *
		 * Therefore combat.combatant is the
		 * creature whose turn is ending.
		 */

		const actor =
			combat.combatant
				?.actor;


		if (!actor) {
			return;
		}


		const ruined =
			getRuinedEffect(
				actor
			);


		if (!ruined) {
			return;
		}


		await rollRuinedRecovery(
			actor,
			ruined
		);
	}
);


/* ------------------------------------------------------------ */
/* Remove Ruined When Fully Healed                              */
/* ------------------------------------------------------------ */

Hooks.on(
	"updateActor",
	async (
		actor,
		changed,
		options,
		userId
	) => {

		/*
		 * updateActor is seen by every connected
		 * client.
		 *
		 * Only the user who actually caused the
		 * update should handle Ruined removal.
		 */

		if (
			userId !==
				game.user.id
		) {
			return;
		}


		/*
		 * Only care about updates that actually
		 * changed current Hit Points.
		 */

		const nestedHPChange =
			foundry.utils.hasProperty(
				changed,
				"system.attributes.hp.value"
			);


		const dottedHPChange =
			Object.prototype
				.hasOwnProperty.call(
					changed,
					"system.attributes.hp.value"
				);


		if (
			!nestedHPChange &&
			!dottedHPChange
		) {
			return;
		}


		const hitPoints =
			actor.hitPoints ??
			actor.system
				?.attributes
				?.hp;


		if (!hitPoints) {
			return;
		}


		const currentHP =
			Number(
				hitPoints.value
			);


		const maximumHP =
			Number(
				hitPoints.max
			);


		if (
			!Number.isFinite(
				currentHP
			) ||
			!Number.isFinite(
				maximumHP
			)
		) {
			return;
		}


		/*
		 * The creature is not fully healed.
		 */

		if (
			currentHP <
				maximumHP
		) {
			return;
		}


		/*
		 * Reaching full HP removes Ruined
		 * completely, regardless of its value.
		 */

		await removeRuined(
			actor
		);
	}
);


/* ------------------------------------------------------------ */
/* Remove Ruined After A Full Night's Rest                       */
/* ------------------------------------------------------------ */

Hooks.on(
	"pf2e.restForTheNight",
	async actor => {

		if (!actor) {
			return;
		}


		await removeRuined(
			actor
		);
	}
);