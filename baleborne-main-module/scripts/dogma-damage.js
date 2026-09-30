	
	
	import {
		getDogmaMeterData,
		} from "./dogma-meter.js";

	import {
		getNPCDogmaMeterData,
		getNPCDogmaMeterCurrent
	} from "./npc-dogma.js";

	const DOGMA_DAMAGE_MODULE_ID =
		"baleborne-main-module";


	const DOGMA_DAMAGE_TYPES =
		new Set([
			"corruption",
			"purity"
		]);


	/* ------------------------------------------------------------ */
	/* Clamp Number                                                 */
	/* ------------------------------------------------------------ */

	function clamp(
		value,
		min,
		max
	) {

		return Math.max(
			min,
			Math.min(
				max,
				value
			)
		);
	}

	/* This get's the Current Dogma Meter Value so that it can be used for damage and other effects*/
	
	function getCurrentDogmaMeterValue(
		actor,
		meter
	) {

		if (actor.type === "npc") {

			return getNPCDogmaMeterCurrent(
				actor,
				meter
			);
		}

		const storedProfile =
			actor.getFlag(
				DOGMA_DAMAGE_MODULE_ID,
				"dogmaMeterProfile"
			) ?? null;


		const rawStoredCurrent =
			actor.getFlag(
				DOGMA_DAMAGE_MODULE_ID,
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


		return clamp(
			current,
			0,
			meter.max
		);
}
	

	/* ------------------------------------------------------------ */
	/* Get Weakness Against Damage Instance                         */
	/* ------------------------------------------------------------ */

	function getDogmaDamageWeakness(
		actor,
		instance
	) {

		/*
		 * If PF2e's IWR system is disabled,
		 * weaknesses should not apply.
		 */

		if (
			game.pf2e
				?.settings
				?.iwr === false
		) {
			return 0;
		}


		const weaknesses =
			actor.attributes
				?.weaknesses ?? [];


		const description =
			instance.formalDescription;


		const applicable =
			weaknesses.filter(
				weakness => {

					try {

						return weakness.test(
							description
						);

					} catch {

						return false;
					}
				}
			);


		if (
			applicable.length === 0
		) {
			return 0;
		}


		/*
		 * PF2e uses the highest applicable
		 * weakness for a damage instance.
		 */

		return Math.max(
			0,
			...applicable.map(
				weakness =>
					Number(
						weakness.value
					) || 0
			)
		);
	}
	
	/*This part gets and calculates the damage resistance basedd of the Dogma type for NPCS */
		function getNPCDogmaGrantedResistance(
			actor,
			instance
		) {

			if (
				actor.type !== "npc"
			) {
				return 0;
			}


			const npcDogma =
				actor.getFlag(
					DOGMA_DAMAGE_MODULE_ID,
					"npcDogma"
				);


			const dogmaName =
				npcDogma?.name
					?.trim()
					?.toLowerCase();


			if (
				dogmaName !== "pure" &&
				dogmaName !== "corrupt"
			) {
				return 0;
			}


			const dogmaLevel =
				Math.max(
					0,
					Math.floor(
						Number(
							actor.getFlag(
								DOGMA_DAMAGE_MODULE_ID,
								"dogmaLevel"
							) ?? 0
						)
					)
				);

			if (
				dogmaName === "pure" &&
				instance.type === "corruption"
			) {
				return dogmaLevel;
			}


			if (
				dogmaName === "corrupt" &&
				instance.type === "purity"
			) {
				return dogmaLevel;
			}


			return 0;
		}
		
		

	/* This gets and calculates Resistances for PCs and NPCs */

	function getDogmaDamageResistance(
		actor,
		instance
	) {

		if (
			game.pf2e
				?.settings
				?.iwr === false
		) {
			return 0;
		}


		const resistances =
			actor.attributes
				?.resistances ?? [];


		const description =
			instance.formalDescription;


		const applicable =
			resistances.filter(
				resistance => {

					try {

						return resistance.test(
							description
						);

					} catch {

						return false;
					}
				}
			);


		const pf2eResistance =
			applicable.length === 0
				? 0
				: Math.max(
					0,
					...applicable.map(
						resistance => {

							if (
								typeof resistance
									.getDoubledValue ===
									"function"
							) {

								return Number(
									resistance
										.getDoubledValue(
											description
										)
								) || 0;
							}


							return Number(
								resistance.value
							) || 0;
						}
					)
				);


		const npcDogmaResistance =
			getNPCDogmaGrantedResistance(
				actor,
				instance
			);


		return Math.max(
			0,
			pf2eResistance,
			npcDogmaResistance
		);
	}

	/* This applies the correct damage to the dogma meter */

	async function applyDogmaDamageInstances(
		actor,
		meter,
		instances
	) {

		if (
			!meter.active ||
			instances.length === 0
		) {
			return;
		}


		let current =
			getCurrentDogmaMeterValue(
				actor,
				meter
			);


		let meterChange =
			0;


		for (
			const instance
			of instances
		) {

			const damageType =
				instance.type;


			const rawAmount =
				Math.max(
					0,
					Number(
						instance.total ?? 0
					)
				);


			if (
				rawAmount <= 0
			) {
				continue;
			}


		   /* This ensures that weaknesses and resistances are calculated when taking dogma damage */

			const weakness =
				getDogmaDamageWeakness(
					actor,
					instance
				);


			const resistance =
				getDogmaDamageResistance(
					actor,
					instance
				);



			const amount =
				Math.max(
					0,
					rawAmount +
						weakness -
						resistance
				);
		


			/* This part sets up the corruption meter for PCs */


			if (
				meter.theme ===
					"corruption"
			) {

				if (
					damageType ===
						"corruption"
				) {

					meterChange +=
						amount;
				}


				if (
					damageType ===
						"purity"
				) {

					meterChange -=
						amount;
				}
			}


			/* This sets up the purity meter for PCs*/

			if (
				meter.theme ===
					"pure"
			) {

				if (
					damageType ===
						"purity"
				) {

					meterChange +=
						amount;
				}


				if (
					damageType ===
						"corruption"
				) {

					meterChange -=
						amount;
				}
			}


			console.log(
				[
					"Baleborne Main Module | Dogma damage",
					actor.name,
					damageType,
					`Rolled ${rawAmount}`,
					`Resistance ${resistance}`,
					`Applied ${amount}`
				].join(" | ")
			);
		}


		
	/* This ensure the Meter gets updated and saves those updates (from damage or manual changes */
		
		const newCurrent =
			clamp(
				current +
					meterChange,
				0,
				meter.max
			);


		if (actor.type === "npc") {

			await actor.update({

				[`flags.${DOGMA_DAMAGE_MODULE_ID}.npcDogmaMeterCurrent`]:
					newCurrent,

				[`flags.${DOGMA_DAMAGE_MODULE_ID}.npcDogmaMeterProfile`]:
					meter.profile
			});

		}

		else {

			await actor.update({

				[`flags.${DOGMA_DAMAGE_MODULE_ID}.dogmaMeterCurrent`]:
					newCurrent,

				[`flags.${DOGMA_DAMAGE_MODULE_ID}.dogmaMeterProfile`]:
					meter.profile
			});

		}
	}


	/* ------------------------------------------------------------ */
	/* Build A Damage Roll Without Purity / Corruption              */
	/* ------------------------------------------------------------ */

	function removeDogmaDamageFromRoll(
		damage
	) {

		const normalInstances =
			damage.instances.filter(
				instance =>
					!DOGMA_DAMAGE_TYPES.has(
						instance.type
					)
			);

		if (
			normalInstances.length === 0
		) {
			return null;
		}

		const clonedInstances =
			normalInstances.map(
				instance =>
					instance.constructor
						.fromData(
							instance.toJSON()
						)
			);


		const pool =
			damage.pool;


		if (!pool) {
			return null;
		}


		const newPool =
			pool.constructor
				.fromRolls(
					clonedInstances
				);


		const newDamage =
			damage.constructor
				.fromTerms([
					newPool
				]);

		if (
			damage.options &&
			newDamage.options
		) {

			Object.assign(
				newDamage.options,
				foundry.utils.deepClone(
					damage.options
				)
			);
		}


		return newDamage;
	}


	/* Makes sure to follow damage rules set by pathfinder 2e on foundry */
	Hooks.once(
		"ready",
		() => {

			const ActorClass =
				CONFIG.Actor
					?.documentClass;


			const prototype =
				ActorClass
					?.prototype;


			const originalApplyDamage =
				prototype
					?.applyDamage;


			if (
				typeof originalApplyDamage !==
					"function"
			) {

				console.error(
					"Baleborne Main Module | PF2e applyDamage could not be found."
				);

				return;
			}


			if (
				originalApplyDamage
					.baleborneDogmaDamageWrapped
			) {
				return;
			}


			const wrappedApplyDamage =
				async function (
					params
				) {

					const damage =
						params?.damage;


					if (
						!damage ||
						typeof damage ===
							"number" ||
						!Array.isArray(
							damage.instances
						)
					) {

						return originalApplyDamage
							.call(
								this,
								params
							);
					}

	 /* This ensures the Dogma meter functions for both NPCs and PCs (allows it to move up and down
	 and to take damage */

			if (
				![
					"character",
					"npc"
				].includes(
					this.type
				)
			) {

				return originalApplyDamage
					.call(
						this,
						params
					);
			}


		/*Makes sure the correct Dogma meter is used (pure for pure, etc) */

			const meter =
				this.type === "npc"
					? getNPCDogmaMeterData(
						this
					)
					: getDogmaMeterData(
						this
					);
			
			if (!meter.active) {
				return originalApplyDamage.call(
					this,
					params
				);
			}
			

		/* Makes sure that regular damage isn't hitting the dogma meter, but corrutption and purity damage does */

					const dogmaInstances =
						damage.instances.filter(
							instance =>
								DOGMA_DAMAGE_TYPES.has(
									instance.type
								)
						);


					if (
						dogmaInstances.length ===
							0
					) {

						return originalApplyDamage
							.call(
								this,
								params
							);
					}

					await applyDogmaDamageInstances(
						this,
						meter,
						dogmaInstances
					);


					const remainingDamage =
						removeDogmaDamageFromRoll(
							damage
						);


					if (!remainingDamage) {

						return this;
					}
					
					return originalApplyDamage
						.call(
							this,
							{
								...params,
								damage:
									remainingDamage
							}
						);
				};


			wrappedApplyDamage
				.baleborneDogmaDamageWrapped =
				true;


			prototype.applyDamage =
				wrappedApplyDamage;


			console.log(
				"Baleborne Main Module | Dogma damage routing connected."
			);
		}
	);