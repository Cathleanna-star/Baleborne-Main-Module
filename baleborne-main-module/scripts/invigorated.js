/* This is the coding so that Invigorated will heal only once when it 
is first applied to the character, unless the condition increases. */

const INVIGORATED_EFFECT_NAME =
	"invigorated";
function isInvigoratedEffect(
	item
) {

	if (
		!item ||
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
			INVIGORATED_EFFECT_NAME ||

		itemSlug ===
			`effect-${INVIGORATED_EFFECT_NAME}` ||

		itemName ===
			INVIGORATED_EFFECT_NAME
	);
}


Hooks.on(
	"createItem",
	async (
		item,
		options,
		userId
	) => {


		if (
			userId !==
				game.user.id
		) {
			return;
		}


		if (
			!isInvigoratedEffect(
				item
			)
		) {
			return;
		}


		const actor =
			item.actor;


		if (!actor) {
			return;
		}

		const invigoratedValue =
			Number(
				item.system
					?.badge
					?.value ?? 0
			);


		if (
			!Number.isFinite(
				invigoratedValue
			) ||
			invigoratedValue <= 0
		) {
			return;
		}

		const actorLevel =
			Number(
				actor.level ?? 0
			);


		if (
			!Number.isFinite(
				actorLevel
			) ||
			actorLevel < 0
		) {
			return;
		}

		const healing =
			invigoratedValue *
			actorLevel;


		if (
			healing <= 0
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

		const newHP =
			Math.min(
				maximumHP,
				currentHP +
					healing
			);


		if (
			newHP ===
				currentHP
		) {
			return;
		}


		await actor.update({
			"system.attributes.hp.value":
				newHP
		});
	}
);



Hooks.on(
	"preUpdateItem",
	async (
		item,
		changed,
		options,
		userId
	) => {

		if (
			userId !==
				game.user.id
		) {
			return;
		}


		if (
			!isInvigoratedEffect(
				item
			)
		) {
			return;
		}


		const actor =
			item.actor;


		if (!actor) {
			return;
		}

		const oldValue =
			Number(
				item.system
					?.badge
					?.value ?? 0
			);

		let newValue =
			foundry.utils.getProperty(
				changed,
				"system.badge.value"
			);


		if (
			Object.prototype.hasOwnProperty.call(
				changed,
				"system.badge.value"
			)
		) {

			newValue =
				changed[
					"system.badge.value"
				];
		}


		newValue =
			Number(
				newValue
			);



		if (
			!Number.isFinite(
				newValue
			)
		) {
			return;
		}

		if (
			newValue <=
				oldValue
		) {
			return;
		}


		const actorLevel =
			Number(
				actor.level ?? 0
			);


		if (
			!Number.isFinite(
				actorLevel
			) ||
			actorLevel < 0
		) {
			return;
		}


		const healing =
			newValue *
			actorLevel;


		if (
			healing <= 0
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


		const newHP =
			Math.min(
				maximumHP,
				currentHP +
					healing
			);


		if (
			newHP ===
				currentHP
		) {
			return;
		}


		await actor.update({
			"system.attributes.hp.value":
				newHP
		});
	}
);